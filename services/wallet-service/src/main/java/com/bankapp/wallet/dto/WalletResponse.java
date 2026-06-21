package com.bankapp.wallet.dto;

import com.bankapp.wallet.domain.entity.Wallet;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class WalletResponse {
    private UUID id;
    private UUID userId;
    private BigDecimal balance;
    private String currency;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public static WalletResponse from(Wallet w) {
        return WalletResponse.builder()
                .id(w.getId())
                .userId(w.getUserId())
                .balance(w.getBalance())
                .currency(w.getCurrency())
                .status(w.getStatus().name())
                .createdAt(w.getCreatedAt())
                .updatedAt(w.getUpdatedAt())
                .build();
    }
}
