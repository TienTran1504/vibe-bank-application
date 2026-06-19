package com.bankapp.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

@Getter
public class CreateAccountRequest {

    @NotBlank
    @Pattern(regexp = "SAVINGS|CHECKING|WALLET",
             message = "must be SAVINGS, CHECKING, or WALLET")
    private String accountType;

    @NotBlank
    @Pattern(regexp = "USD|EUR|VND",
             message = "must be USD, EUR, or VND")
    private String currency;
}
