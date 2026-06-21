package com.bankapp.wallet.service.impl;

import com.bankapp.base.exception.BusinessException;
import com.bankapp.wallet.domain.entity.Wallet;
import com.bankapp.wallet.domain.entity.WalletTransaction;
import com.bankapp.wallet.domain.repository.WalletRepository;
import com.bankapp.wallet.domain.repository.WalletTransactionRepository;
import com.bankapp.wallet.dto.TopUpRequest;
import com.bankapp.wallet.dto.WalletResponse;
import com.bankapp.wallet.dto.WalletTransactionResponse;
import com.bankapp.wallet.dto.WithdrawRequest;
import com.bankapp.wallet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final WalletTransactionRepository txRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RestTemplate restTemplate;

    @Value("${services.account.internal-url:http://localhost:8082}")
    private String accountServiceUrl;

    @Override
    @Transactional
    public WalletResponse getOrCreateWallet(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseGet(() -> walletRepository.save(
                        Wallet.builder().userId(userId).build()));
        return WalletResponse.from(wallet);
    }

    @Override
    @Transactional
    public WalletResponse topUp(UUID userId, TopUpRequest request) {
        Wallet wallet = getActiveWallet(userId);

        // Mock payment gateway: always succeeds
        wallet.setBalance(wallet.getBalance().add(request.getAmount()));
        walletRepository.save(wallet);

        txRepository.save(WalletTransaction.builder()
                .walletId(wallet.getId())
                .type(WalletTransaction.TxType.TOP_UP)
                .amount(request.getAmount())
                .description("Top-up via mock payment gateway")
                .build());

        publishWalletEvent("wallet.top-up.completed", wallet.getId(), userId, request.getAmount());
        log.info("Wallet top-up userId={} amount={}", userId, request.getAmount());
        return WalletResponse.from(wallet);
    }

    @Override
    @Transactional
    public WalletResponse withdraw(UUID userId, WithdrawRequest request) {
        Wallet wallet = getActiveWallet(userId);

        if (wallet.getBalance().compareTo(request.getAmount()) < 0) {
            throw new BusinessException("INSUFFICIENT_FUNDS",
                    "Wallet balance is insufficient", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        wallet.setBalance(wallet.getBalance().subtract(request.getAmount()));
        walletRepository.save(wallet);

        txRepository.save(WalletTransaction.builder()
                .walletId(wallet.getId())
                .type(WalletTransaction.TxType.WITHDRAWAL)
                .amount(request.getAmount())
                .reference(request.getToAccountId().toString())
                .description(request.getDescription() != null ? request.getDescription() : "Withdrawal to bank account")
                .build());

        // Credit the target bank account via internal REST call
        try {
            String url = accountServiceUrl + "/internal/v1/accounts/" + request.getToAccountId() + "/credit";
            restTemplate.postForObject(url, Map.of("amount", request.getAmount().toPlainString()), Map.class);
        } catch (Exception e) {
            log.error("Failed to credit account {} after wallet withdrawal: {}", request.getToAccountId(), e.getMessage());
            throw new BusinessException("INTERNAL_ERROR",
                    "Withdrawal recorded but failed to credit bank account — please contact support",
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }

        publishWalletEvent("wallet.withdrawal.completed", wallet.getId(), userId, request.getAmount());
        log.info("Wallet withdrawal userId={} amount={} toAccount={}", userId, request.getAmount(), request.getToAccountId());
        return WalletResponse.from(wallet);
    }

    @Override
    public Page<WalletTransactionResponse> listTransactions(UUID userId, Pageable pageable) {
        Wallet wallet = getActiveWallet(userId);
        return txRepository.findByWalletId(wallet.getId(), pageable)
                .map(WalletTransactionResponse::from);
    }

    private Wallet getActiveWallet(UUID userId) {
        Wallet wallet = walletRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND",
                        "Wallet not found — call GET /api/v1/wallets/me to create one", HttpStatus.NOT_FOUND));
        if (wallet.getStatus() != Wallet.WalletStatus.ACTIVE) {
            throw new BusinessException("ACCOUNT_FROZEN", "Wallet is not active", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        return wallet;
    }

    private void publishWalletEvent(String topic, UUID walletId, UUID userId, java.math.BigDecimal amount) {
        Map<String, Object> event = new HashMap<>();
        event.put("walletId", walletId.toString());
        event.put("userId", userId.toString());
        event.put("amount", amount.toPlainString());
        event.put("eventId", UUID.randomUUID().toString());
        kafkaTemplate.send(topic, walletId.toString(), event);
    }
}
