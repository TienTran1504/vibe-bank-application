package com.bankapp.fraud.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class FraudCheckRequest {

    @NotBlank
    private String userId;

    @NotBlank
    private String transactionId;

    @NotNull
    @DecimalMin(value = "0.01")
    private BigDecimal amount;

    @NotBlank
    private String currency;

    @NotBlank
    private String fromAccountId;

    @NotBlank
    private String toAccountId;

    // KYC status passed by transaction-service (obtained from user-service)
    private boolean kycApproved;

    private String correlationId;

    // USD-equivalent of amount — used for currency-agnostic threshold rules
    private BigDecimal amountInUsd;
}
