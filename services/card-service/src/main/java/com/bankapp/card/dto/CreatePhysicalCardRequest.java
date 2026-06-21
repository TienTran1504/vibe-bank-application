package com.bankapp.card.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.UUID;

@Getter
public class CreatePhysicalCardRequest {
    @NotNull(message = "accountId is required")
    private UUID accountId;

    @NotBlank(message = "deliveryAddress is required")
    private String deliveryAddress;
}
