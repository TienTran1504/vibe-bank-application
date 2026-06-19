package com.bankapp.fraud.event;

import com.bankapp.base.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Getter
@SuperBuilder
@NoArgsConstructor
public class FraudAlertRaisedEvent extends BaseEvent {

    private String userId;
    private String transactionId;
    private BigDecimal amount;
    private String currency;
    private String ruleTriggered;
    private String reason;

    public static FraudAlertRaisedEvent of(String userId, String transactionId,
                                            BigDecimal amount, String currency,
                                            String rule, String reason, String correlationId) {
        FraudAlertRaisedEvent event = FraudAlertRaisedEvent.builder()
                .userId(userId)
                .transactionId(transactionId)
                .amount(amount)
                .currency(currency)
                .ruleTriggered(rule)
                .reason(reason)
                .correlationId(correlationId)
                .build();
        event.initDefaults();
        return event;
    }
}
