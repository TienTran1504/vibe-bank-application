package com.bankapp.notification.service;

import com.bankapp.notification.domain.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface NotificationService {
    void dispatch(String userId, Notification.NotificationType type, String title, String body, Map<String, Object> metadata);
    Page<Notification> listNotifications(String userId, Pageable pageable);
    long countUnread(String userId);
    Notification markRead(String userId, String notificationId);
}
