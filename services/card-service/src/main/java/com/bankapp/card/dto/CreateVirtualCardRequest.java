package com.bankapp.card.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.UUID;

@Getter
public class CreateVirtualCardRequest {
    @NotNull(message = "accountId is required")
    private UUID accountId;
}
