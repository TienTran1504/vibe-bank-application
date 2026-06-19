package com.bankapp.transaction.service.impl;

import com.bankapp.base.exception.BusinessException;
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

import java.time.Duration;
import java.time.Instant;
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
    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public TransferResponse transfer(UUID userId, String idempotencyKey, TransferRequest req) {
        // 1. Idempotency check
        String cachedId = redis.opsForValue().get(IDEMPOTENCY_KEY_PREFIX + idempotencyKey);
        if (cachedId != null) {
            log.info("Duplicate request idempotencyKey={} returning cached txId={}", idempotencyKey, cachedId);
            Transaction existing = transactionRepository.findById(UUID.fromString(cachedId))
                    .orElseThrow(() -> new BusinessException("INTERNAL_ERROR", "Cached transaction not found", HttpStatus.INTERNAL_SERVER_ERROR));
            return buildTransferResponse(existing);
        }

        // 2. Fraud check
        boolean kycApproved = userKycClient.isKycApproved(userId.toString());
        UUID correlationId = UUID.randomUUID();

        FraudCheckResponse fraudResult = fraudClient.check(FraudCheckRequest.builder()
                .userId(userId.toString())
                .transactionId(correlationId.toString())
                .amount(req.getAmount())
                .currency(req.getCurrency())
                .fromAccountId(req.getFromAccountId().toString())
                .toAccountId(req.getToAccountId().toString())
                .kycApproved(kycApproved)
                .correlationId(correlationId.toString())
                .build());

        if (!fraudResult.isApproved()) {
            throw new BusinessException("FRAUD_BLOCKED",
                    "Transaction blocked: " + fraudResult.getReason(), HttpStatus.FORBIDDEN);
        }

        // 3. Create transaction — let JPA generate the ID, capture the returned entity
        Transaction tx = Transaction.builder()
                .idempotencyKey(idempotencyKey)
                .fromAccountId(req.getFromAccountId())
                .toAccountId(req.getToAccountId())
                .userId(userId)
                .amount(req.getAmount())
                .currency(req.getCurrency())
                .type(Transaction.TransactionType.TRANSFER)
                .status(Transaction.TransactionStatus.PENDING)
                .description(req.getDescription())
                .correlationId(correlationId)
                .build();
        Transaction savedTx = transactionRepository.save(tx);
        String transactionId = savedTx.getId().toString();

        // 4. Create outbox entry in the same DB transaction
        Map<String, Object> payload = Map.of(
                "eventId", UUID.randomUUID().toString(),
                "transactionId", transactionId,
                "fromAccountId", req.getFromAccountId().toString(),
                "toAccountId", req.getToAccountId().toString(),
                "amount", req.getAmount().toPlainString(),
                "currency", req.getCurrency(),
                "correlationId", correlationId.toString()
        );
        outboxRepository.save(TransactionOutbox.builder()
                .topic(TOPIC_PAYMENT_CREATED)
                .messageKey(transactionId)
                .payload(toJson(payload))
                .build());

        // 5. Cache idempotency key → the actual DB-generated ID
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
    public Page<TransactionResponse> listTransactions(UUID userId, Pageable pageable) {
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
