package com.bankapp.account.event;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class KycApprovedEvent {
    private String eventId;
    private String eventType;
    private String userId;
    private String email;
    private String firstName;
    private String lastName;
    private String countryCode;
    private String correlationId;
}
