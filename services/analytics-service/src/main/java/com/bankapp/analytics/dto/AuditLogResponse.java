package com.bankapp.analytics.dto;

import com.bankapp.analytics.domain.AuditLog;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;

@Getter @Builder
public class AuditLogResponse {
    private String id;
    private String actorId;
    private String actorType;
    private String action;
    private String resourceType;
    private String resourceId;
    private Instant timestamp;
    private Map<String, Object> metadata;

    public static AuditLogResponse from(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .actorId(log.getActorId())
                .actorType(log.getActorType().name())
                .action(log.getAction())
                .resourceType(log.getResourceType())
                .resourceId(log.getResourceId())
                .timestamp(log.getTimestamp())
                .metadata(log.getMetadata())
                .build();
    }
}
