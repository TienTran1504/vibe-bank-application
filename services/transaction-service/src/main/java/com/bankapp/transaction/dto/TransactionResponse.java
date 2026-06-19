package com.bankapp.transaction.dto;

import com.bankapp.transaction.domain.entity.Transaction;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class TransactionResponse {

    private UUID id;
    private UUID fromAccountId;
    private UUID toAccountId;
    private BigDecimal amount;
    private String currency;
    private String type;
    private String status;
    private String description;
    private String errorCode;
    private Instant completedAt;
    private Instant createdAt;

    public static TransactionResponse from(Transaction t) {
        return TransactionResponse.builder()
                .id(t.getId())
                .fromAccountId(t.getFromAccountId())
                .toAccountId(t.getToAccountId())
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .type(t.getType().name())
                .status(t.getStatus().name())
                .description(t.getDescription())
                .errorCode(t.getErrorCode())
                .completedAt(t.getCompletedAt())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
