package com.bankapp.base.event;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.util.UUID;

@Getter
@SuperBuilder
@NoArgsConstructor
public abstract class BaseEvent {

    private String eventId;
    private String eventType;
    private Instant occurredAt;
    private String correlationId;

    protected void initDefaults() {
        if (this.eventId == null) this.eventId = UUID.randomUUID().toString();
        if (this.occurredAt == null) this.occurredAt = Instant.now();
    }
}
