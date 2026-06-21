package com.bankapp.wallet.dto;

import com.bankapp.wallet.domain.entity.WalletTransaction;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class WalletTransactionResponse {
    private UUID id;
    private String type;
    private BigDecimal amount;
    private String status;
    private String reference;
    private String description;
    private Instant createdAt;

    public static WalletTransactionResponse from(WalletTransaction t) {
        return WalletTransactionResponse.builder()
                .id(t.getId())
                .type(t.getType().name())
                .amount(t.getAmount())
                .status(t.getStatus().name())
                .reference(t.getReference())
                .description(t.getDescription())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
