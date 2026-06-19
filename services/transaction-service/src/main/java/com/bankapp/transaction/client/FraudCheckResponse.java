package com.bankapp.transaction.client;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FraudCheckResponse {
    private boolean approved;
    private String ruleTriggered;
    private String reason;
}
