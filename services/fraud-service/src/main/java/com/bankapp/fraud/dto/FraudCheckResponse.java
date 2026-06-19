package com.bankapp.fraud.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FraudCheckResponse {
    private boolean approved;
    private String ruleTriggered;   // null if approved
    private String reason;          // null if approved
}
