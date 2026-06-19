package com.bankapp.account.event;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class TransactionPaymentCreatedEvent {
    private String eventId;
    private String transactionId;
    private String fromAccountId;
    private String toAccountId;
    private String amount;
    private String currency;
    private String correlationId;
}
