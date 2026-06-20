package com.bankapp.account.dto;

import com.bankapp.account.domain.entity.BankAccount;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class AccountResponse {

    private UUID id;
    private UUID userId;
    private String holderName;
    private String accountNumber;
    private String accountType;
    private String currency;
    private BigDecimal balance;
    private BigDecimal availableBalance;
    private String status;
    private Instant createdAt;
    private Instant updatedAt;

    public static AccountResponse from(BankAccount a) {
        return AccountResponse.builder()
                .id(a.getId())
                .userId(a.getUserId())
                .accountNumber(a.getAccountNumber())
                .accountType(a.getAccountType().name())
                .currency(a.getCurrency())
                .balance(a.getBalance())
                .availableBalance(a.getAvailableBalance())
                .status(a.getStatus().name())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
