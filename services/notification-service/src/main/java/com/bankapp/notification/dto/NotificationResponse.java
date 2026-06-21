package com.bankapp.notification.dto;

import com.bankapp.notification.domain.Notification;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.Map;

@Getter
@Builder
public class NotificationResponse {
    private String id;
    private String userId;
    private String type;
    private String channel;
    private String title;
    private String body;
    private String status;
    private boolean read;
    private Map<String, Object> metadata;
    private Instant sentAt;
    private Instant createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .userId(n.getUserId())
                .type(n.getType().name())
                .channel(n.getChannel().name())
                .title(n.getTitle())
                .body(n.getBody())
                .status(n.getStatus().name())
                .read(n.isRead())
                .metadata(n.getMetadata())
                .sentAt(n.getSentAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
