package com.bankapp.transaction.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class TransferResponse {
    private UUID transactionId;
    private String status;
    private Instant estimatedCompletionAt;
}
