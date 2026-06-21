package com.bankapp.transaction.service.impl;

import com.bankapp.base.exception.BusinessException;
import com.bankapp.transaction.client.AccountClient;
import com.bankapp.transaction.client.FraudCheckRequest;
import com.bankapp.transaction.client.FraudCheckResponse;
import com.bankapp.transaction.client.FraudClient;
import com.bankapp.transaction.client.UserKycClient;
import com.bankapp.transaction.domain.entity.Transaction;
import com.bankapp.transaction.domain.entity.TransactionOutbox;
import com.bankapp.transaction.domain.repository.TransactionOutboxRepository;
import com.bankapp.transaction.domain.repository.TransactionRepository;
import com.bankapp.transaction.dto.TransactionResponse;
import com.bankapp.transaction.dto.TransferRequest;
import com.bankapp.transaction.dto.TransferResponse;
import com.bankapp.transaction.service.ExchangeRateService;
import com.bankapp.transaction.service.TransactionService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private static final String IDEMPOTENCY_KEY_PREFIX = "tx:idempotency:";
    private static final Duration IDEMPOTENCY_TTL = Duration.ofHours(24);
    private static final String TOPIC_PAYMENT_CREATED = "transaction.payment.created";

    private final TransactionRepository transactionRepository;
    private final TransactionOutboxRepository outboxRepository;
    private final FraudClient fraudClient;
    private final UserKycClient userKycClient;
    private final AccountClient accountClient;
    private final ExchangeRateService exchangeRateService;
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public TransferResponse transfer(UUID userId, String idempotencyKey, TransferRequest req) {
        // 0. Reject self-transfer — cannot send to the same account you send from
        if (req.getFromAccountId().equals(req.getToAccountId())) {
            throw new BusinessException("VALIDATION_FAILED",
                    "Cannot transfer to the same account you are sending from", HttpStatus.BAD_REQUEST);
        }

        // 1. Idempotency check
        String cachedId = redis.opsForValue().get(IDEMPOTENCY_KEY_PREFIX + idempotencyKey);
        if (cachedId != null) {
            log.info("Duplicate request idempotencyKey={} returning cached txId={}", idempotencyKey, cachedId);
            Transaction existing = transactionRepository.findById(UUID.fromString(cachedId))
                    .orElseThrow(() -> new BusinessException("INTERNAL_ERROR", "Cached transaction not found", HttpStatus.INTERNAL_SERVER_ERROR));
            return buildTransferResponse(existing);
        }

        // 2. Derive currencies from accounts
        String fromCurrency = accountClient.getAccountCurrency(req.getFromAccountId());
        String toCurrency   = accountClient.getAccountCurrency(req.getToAccountId());

        // 3. FX conversion (if cross-currency)
        BigDecimal amount = req.getAmount();
        BigDecimal feeAmount      = BigDecimal.ZERO;
        BigDecimal convertedAmount = amount;
        BigDecimal exchangeRate   = BigDecimal.ONE;

        if (exchangeRateService.isCrossCurrency(fromCurrency, toCurrency)) {
            exchangeRate    = exchangeRateService.getRate(fromCurrency, toCurrency);
            feeAmount       = amount.multiply(exchangeRateService.getFeeRate()).setScale(4, RoundingMode.HALF_UP);
            convertedAmount = amount.multiply(exchangeRate).setScale(4, RoundingMode.HALF_UP);
            log.info("FX transfer: {} {} → {} {} (rate={}, fee={})",
                    amount, fromCurrency, convertedAmount, toCurrency, exchangeRate, feeAmount);
        }

        // 4. Fraud check — always pass USD-equivalent so rules are currency-agnostic
        boolean kycApproved = userKycClient.isKycApproved(userId.toString());
        UUID correlationId  = UUID.randomUUID();
        BigDecimal amountInUsd = toUsdEquivalent(amount, fromCurrency);

        FraudCheckResponse fraudResult = fraudClient.check(FraudCheckRequest.builder()
                .userId(userId.toString())
                .transactionId(correlationId.toString())
                .amount(amount)
                .currency(fromCurrency)
                .amountInUsd(amountInUsd)
                .fromAccountId(req.getFromAccountId().toString())
                .toAccountId(req.getToAccountId().toString())
                .kycApproved(kycApproved)
                .correlationId(correlationId.toString())
                .build());

        if (!fraudResult.isApproved()) {
            throw new BusinessException("FRAUD_BLOCKED",
                    "Transaction blocked: " + fraudResult.getReason(), HttpStatus.FORBIDDEN);
        }

        // 5. Persist transaction
        Transaction tx = Transaction.builder()
                .idempotencyKey(idempotencyKey)
                .fromAccountId(req.getFromAccountId())
                .toAccountId(req.getToAccountId())
                .userId(userId)
                .amount(amount)
                .currency(fromCurrency)
                .toCurrency(toCurrency.equals(fromCurrency) ? null : toCurrency)
                .exchangeRate(exchangeRateService.isCrossCurrency(fromCurrency, toCurrency) ? exchangeRate : null)
                .feeAmount(feeAmount.compareTo(BigDecimal.ZERO) > 0 ? feeAmount : null)
                .convertedAmount(exchangeRateService.isCrossCurrency(fromCurrency, toCurrency) ? convertedAmount : null)
                .type(Transaction.TransactionType.TRANSFER)
                .status(Transaction.TransactionStatus.PENDING)
                .description(req.getDescription())
                .correlationId(correlationId)
                .build();
        Transaction savedTx = transactionRepository.save(tx);
        String transactionId = savedTx.getId().toString();

        // 6. Outbox — carry debit/credit amounts so Account Service can handle FX
        BigDecimal debitAmount = amount.add(feeAmount);  // sender pays amount + fee
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventId", UUID.randomUUID().toString());
        payload.put("transactionId", transactionId);
        payload.put("fromAccountId", req.getFromAccountId().toString());
        payload.put("toAccountId", req.getToAccountId().toString());
        payload.put("amount", amount.toPlainString());
        payload.put("debitAmount", debitAmount.toPlainString());
        payload.put("creditAmount", convertedAmount.toPlainString());
        payload.put("currency", fromCurrency);
        payload.put("correlationId", correlationId.toString());

        outboxRepository.save(TransactionOutbox.builder()
                .topic(TOPIC_PAYMENT_CREATED)
                .messageKey(transactionId)
                .payload(toJson(payload))
                .build());

        // 7. Cache idempotency key
        redis.opsForValue().set(IDEMPOTENCY_KEY_PREFIX + idempotencyKey, transactionId, IDEMPOTENCY_TTL);

        log.info("Created transaction txId={} userId={}", transactionId, userId);
        return buildTransferResponse(savedTx);
    }

    @Override
    public TransactionResponse getTransaction(UUID transactionId, UUID userId) {
        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Transaction not found", HttpStatus.NOT_FOUND));
        if (!tx.getUserId().equals(userId)) {
            throw new BusinessException("FORBIDDEN", "Access denied", HttpStatus.FORBIDDEN);
        }
        return TransactionResponse.from(tx);
    }

    @Override
    public Page<TransactionResponse> listTransactions(UUID userId, UUID accountId, Pageable pageable) {
        if (accountId != null) {
            return transactionRepository.findByUserIdAndAccount(userId, accountId, pageable).map(TransactionResponse::from);
        }
        return transactionRepository.findByUserId(userId, pageable).map(TransactionResponse::from);
    }

    @Override
    @Transactional
    public void handlePaymentCompleted(Map<String, Object> event) {
        String txId = (String) event.get("transactionId");
        if (txId == null) return;
        transactionRepository.findById(UUID.fromString(txId)).ifPresent(tx -> {
            tx.setStatus(Transaction.TransactionStatus.COMPLETED);
            tx.setCompletedAt(Instant.now());
            transactionRepository.save(tx);
            log.info("Transaction COMPLETED txId={}", txId);
        });
    }

    @Override
    @Transactional
    public void handlePaymentFailed(Map<String, Object> event) {
        String txId = (String) event.get("transactionId");
        String errorCode = (String) event.get("errorCode");
        if (txId == null) return;
        transactionRepository.findById(UUID.fromString(txId)).ifPresent(tx -> {
            tx.setStatus(Transaction.TransactionStatus.FAILED);
            tx.setErrorCode(errorCode);
            tx.setCompletedAt(Instant.now());
            transactionRepository.save(tx);
            log.info("Transaction FAILED txId={} reason={}", txId, errorCode);
        });
    }

    private BigDecimal toUsdEquivalent(BigDecimal amount, String currency) {
        if ("USD".equals(currency)) return amount;
        BigDecimal rate = exchangeRateService.getRate(currency, "USD");
        return amount.multiply(rate).setScale(4, RoundingMode.HALF_UP);
    }

    private TransferResponse buildTransferResponse(Transaction tx) {
        return TransferResponse.builder()
                .transactionId(tx.getId())
                .status(tx.getStatus().name())
                .estimatedCompletionAt(Instant.now().plusSeconds(5))
                .build();
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize payload", e);
        }
    }
}
