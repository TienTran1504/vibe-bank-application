package com.bankapp.transaction.service;

import com.bankapp.transaction.dto.TransferRequest;
import com.bankapp.transaction.dto.TransferResponse;
import com.bankapp.transaction.dto.TransactionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;
import java.util.UUID;

public interface TransactionService {
    TransferResponse transfer(UUID userId, String idempotencyKey, TransferRequest request);
    TransactionResponse getTransaction(UUID transactionId, UUID userId);
    Page<TransactionResponse> listTransactions(UUID userId, UUID accountId, Pageable pageable);
    void handlePaymentCompleted(Map<String, Object> event);
    void handlePaymentFailed(Map<String, Object> event);
}
