package com.bankapp.notification.domain;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "notifications")
@Getter @Setter @Builder
public class Notification {

    @Id
    private String id;

    @Indexed
    private String userId;

    private NotificationType type;
    private NotificationChannel channel;
    private String title;
    private String body;
    private NotificationStatus status;
    private boolean read;
    private Map<String, Object> metadata;
    private Instant sentAt;
    private Instant createdAt;

    public enum NotificationType    { TRANSACTION, KYC, FRAUD, WALLET, SYSTEM }
    public enum NotificationChannel { PUSH, EMAIL, SMS, IN_APP }
    public enum NotificationStatus  { SENT, FAILED, PENDING }
}
