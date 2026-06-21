package com.bankapp.analytics.domain;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "audit_logs")
@Getter @Builder
public class AuditLog {

    @Id
    private String id;

    @Indexed
    private String actorId;
    private ActorType actorType;
    private String action;
    private String resourceType;

    @Indexed
    private String resourceId;
    private String ipAddress;
    private String userAgent;

    @Indexed
    private Instant timestamp;
    private Map<String, Object> metadata;

    public enum ActorType { USER, ADMIN, SYSTEM }
}
