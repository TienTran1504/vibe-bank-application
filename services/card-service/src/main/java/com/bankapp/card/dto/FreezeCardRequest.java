package com.bankapp.card.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class FreezeCardRequest {
    @NotNull(message = "freeze is required")
    private Boolean freeze;
}
