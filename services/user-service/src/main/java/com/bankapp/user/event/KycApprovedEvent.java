package com.bankapp.user.event;

import com.bankapp.base.event.BaseEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

@Getter
@SuperBuilder
@NoArgsConstructor
public class KycApprovedEvent extends BaseEvent {

    private String userId;
    private String email;
    private String firstName;
    private String lastName;
    private String countryCode;

    public static KycApprovedEvent of(String userId, String email,
                                      String firstName, String lastName,
                                      String countryCode, String correlationId) {
        KycApprovedEvent event = KycApprovedEvent.builder()
                .userId(userId)
                .email(email)
                .firstName(firstName)
                .lastName(lastName)
                .countryCode(countryCode)
                .correlationId(correlationId)
                .build();
        event.initDefaults();
        return event;
    }
}
