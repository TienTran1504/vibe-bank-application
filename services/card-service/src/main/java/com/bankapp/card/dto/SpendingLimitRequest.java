package com.bankapp.card.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class SpendingLimitRequest {
    @NotNull(message = "dailyLimit is required")
    @DecimalMin(value = "0.01", message = "dailyLimit must be greater than 0")
    private BigDecimal dailyLimit;
}
