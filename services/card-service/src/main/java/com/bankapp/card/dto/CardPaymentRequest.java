package com.bankapp.card.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
public class CardPaymentRequest {

    @NotBlank(message = "merchant is required")
    private String merchant;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be greater than 0")
    private BigDecimal amount;

    // Optional — defaults to USD. No FX conversion in this phase: the amount is
    // debited from the card's linked account as-is.
    private String currency;
}
