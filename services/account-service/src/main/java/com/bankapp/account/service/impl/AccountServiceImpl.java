package com.bankapp.account.service.impl;

import com.bankapp.account.domain.entity.BankAccount;
import com.bankapp.account.domain.repository.BankAccountRepository;
import com.bankapp.account.dto.AccountResponse;
import com.bankapp.account.dto.CreateAccountRequest;
import com.bankapp.account.dto.TopUpRequest;
import com.bankapp.account.event.KycApprovedEvent;
import com.bankapp.account.service.AccountService;
import com.bankapp.base.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountServiceImpl implements AccountService {

    private static final String TOPIC_PAYMENT_COMPLETED = "transaction.payment.completed";
    private static final String TOPIC_PAYMENT_FAILED = "transaction.payment.failed";

    private final BankAccountRepository accountRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RestTemplate restTemplate;
    private final Random random = new Random();

    @Value("${services.user.internal-url:http://user-service:8081}")
    private String userServiceUrl;

    @Override
    @Transactional
    public AccountResponse createAccount(UUID userId, CreateAccountRequest req) {
        BankAccount account = BankAccount.builder()
                .userId(userId)
                .accountNumber(generateIban())
                .accountType(BankAccount.AccountType.valueOf(req.getAccountType()))
                .currency(req.getCurrency())
                .build();
        BankAccount saved = accountRepository.save(account);
        return withHolderName(saved);
    }

    @Override
    public List<AccountResponse> getMyAccounts(UUID userId) {
        String holderName = fetchHolderName(userId);
        return accountRepository.findByUserId(userId).stream()
                .map(a -> withHolderName(a, holderName))
                .toList();
    }

    @Override
    public AccountResponse getAccount(UUID accountId, UUID userId) {
        BankAccount account = findAccountOwned(accountId, userId);
        return withHolderName(account);
    }

    @Override
    public AccountResponse lookupByAccountNumber(String accountNumber) {
        BankAccount account = accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Account not found", HttpStatus.NOT_FOUND));
        return withHolderName(account);
    }

    private AccountResponse withHolderName(BankAccount account) {
        return withHolderName(account, fetchHolderName(account.getUserId()));
    }

    private AccountResponse withHolderName(BankAccount account, String holderName) {
        return AccountResponse.builder()
                .id(account.getId())
                .userId(account.getUserId())
                .holderName(holderName)
                .accountNumber(account.getAccountNumber())
                .accountType(account.getAccountType().name())
                .currency(account.getCurrency())
                .balance(account.getBalance())
                .availableBalance(account.getAvailableBalance())
                .status(account.getStatus().name())
                .createdAt(account.getCreatedAt())
                .updatedAt(account.getUpdatedAt())
                .build();
    }

    @SuppressWarnings("unchecked")
    private String fetchHolderName(UUID userId) {
        try {
            String url = userServiceUrl + "/internal/v1/users/" + userId + "/name";
            Map<String, String> response = restTemplate.getForObject(url, Map.class);
            return response != null ? response.getOrDefault("fullName", "") : "";
        } catch (Exception e) {
            log.warn("Could not fetch holder name for userId={}: {}", userId, e.getMessage());
            return "";
        }
    }

    @Override
    @Transactional
    public AccountResponse topUp(UUID accountId, UUID userId, TopUpRequest req) {
        BankAccount account = findAccountOwned(accountId, userId);
        if (account.getStatus() != BankAccount.AccountStatus.ACTIVE) {
            throw new BusinessException("ACCOUNT_FROZEN", "Account is not active", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        account.setBalance(account.getBalance().add(req.getAmount()));
        account.setAvailableBalance(account.getAvailableBalance().add(req.getAmount()));
        return AccountResponse.from(accountRepository.save(account));
    }

    @Override
    @Transactional
    public void handleKycApproved(KycApprovedEvent event) {
        UUID userId = UUID.fromString(event.getUserId());
        // Auto-create a default USD CHECKING account when KYC is approved
        if (accountRepository.findByUserId(userId).isEmpty()) {
            BankAccount account = BankAccount.builder()
                    .userId(userId)
                    .accountNumber(generateIban())
                    .accountType(BankAccount.AccountType.CHECKING)
                    .currency("USD")
                    .build();
            accountRepository.save(account);
            log.info("Auto-created default account for userId={} on KYC approval", userId);
        }
    }

    @Override
    @Transactional
    public void handlePaymentCreated(Map<String, Object> event) {
        String transactionId = Objects.toString(event.get("transactionId"));
        UUID fromAccountId = UUID.fromString(Objects.toString(event.get("fromAccountId")));
        UUID toAccountId = UUID.fromString(Objects.toString(event.get("toAccountId")));

        // debitAmount = amount + fee (what sender loses); creditAmount = converted amount (what receiver gains)
        BigDecimal debitAmount  = new BigDecimal(Objects.toString(
                event.getOrDefault("debitAmount", event.get("amount"))));
        BigDecimal creditAmount = new BigDecimal(Objects.toString(
                event.getOrDefault("creditAmount", event.get("amount"))));

        BankAccount from = accountRepository.findByIdForUpdate(fromAccountId).orElse(null);
        BankAccount to   = accountRepository.findByIdForUpdate(toAccountId).orElse(null);

        if (from == null || to == null) {
            publishPaymentFailed(transactionId, "ACCOUNT_NOT_FOUND", Objects.toString(event.get("correlationId")));
            return;
        }
        if (from.getStatus() != BankAccount.AccountStatus.ACTIVE) {
            publishPaymentFailed(transactionId, "ACCOUNT_FROZEN", Objects.toString(event.get("correlationId")));
            return;
        }
        if (from.getAvailableBalance().compareTo(debitAmount) < 0) {
            publishPaymentFailed(transactionId, "INSUFFICIENT_FUNDS", Objects.toString(event.get("correlationId")));
            return;
        }

        from.setBalance(from.getBalance().subtract(debitAmount));
        from.setAvailableBalance(from.getAvailableBalance().subtract(debitAmount));
        to.setBalance(to.getBalance().add(creditAmount));
        to.setAvailableBalance(to.getAvailableBalance().add(creditAmount));
        accountRepository.save(from);
        accountRepository.save(to);

        publishPaymentCompleted(transactionId, Objects.toString(event.get("correlationId")));
    }

    private void publishPaymentCompleted(String transactionId, String correlationId) {
        kafkaTemplate.send(TOPIC_PAYMENT_COMPLETED, transactionId,
                Map.of("transactionId", transactionId,
                       "status", "COMPLETED",
                       "correlationId", correlationId,
                       "occurredAt", Instant.now().toString()))
                .whenComplete((r, ex) -> {
                    if (ex != null) log.error("Failed to publish payment.completed txId={}", transactionId, ex);
                });
    }

    private void publishPaymentFailed(String transactionId, String reason, String correlationId) {
        kafkaTemplate.send(TOPIC_PAYMENT_FAILED, transactionId,
                Map.of("transactionId", transactionId,
                       "status", "FAILED",
                       "errorCode", reason,
                       "correlationId", correlationId,
                       "occurredAt", Instant.now().toString()))
                .whenComplete((r, ex) -> {
                    if (ex != null) log.error("Failed to publish payment.failed txId={}", transactionId, ex);
                });
    }

    private BankAccount findAccountOwned(UUID accountId, UUID userId) {
        BankAccount account = accountRepository.findById(accountId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Account not found", HttpStatus.NOT_FOUND));
        if (!account.getUserId().equals(userId)) {
            throw new BusinessException("FORBIDDEN", "Access denied", HttpStatus.FORBIDDEN);
        }
        return account;
    }

    private String generateIban() {
        // Format: GB + 2 check digits + 4-char sort code + 8-digit account number
        int checkDigits = 10 + random.nextInt(89);
        String sortCode = String.format("%04d", random.nextInt(10000));
        String accountNum = String.format("%08d", random.nextInt(100000000));
        return "GB" + checkDigits + "BANK" + sortCode + accountNum;
    }
}
