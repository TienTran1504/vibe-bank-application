package com.bankapp.transaction.client;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class FraudCheckRequest {
    private String userId;
    private String transactionId;
    private BigDecimal amount;
    private String currency;
    private String fromAccountId;
    private String toAccountId;
    private boolean kycApproved;
    private String correlationId;
}
