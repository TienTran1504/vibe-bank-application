package com.bankapp.notification.service.impl;

import com.bankapp.base.exception.BusinessException;
import com.bankapp.notification.domain.Notification;
import com.bankapp.notification.domain.NotificationRepository;
import com.bankapp.notification.provider.NotificationProvider;
import com.bankapp.notification.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationProvider pushProvider;
    private final NotificationProvider emailProvider;
    private final NotificationProvider smsProvider;

    public NotificationServiceImpl(
            NotificationRepository notificationRepository,
            @Qualifier("pushProvider")  NotificationProvider pushProvider,
            @Qualifier("emailProvider") NotificationProvider emailProvider,
            @Qualifier("smsProvider")   NotificationProvider smsProvider) {
        this.notificationRepository = notificationRepository;
        this.pushProvider  = pushProvider;
        this.emailProvider = emailProvider;
        this.smsProvider   = smsProvider;
    }

    @Override
    public void dispatch(String userId, Notification.NotificationType type,
                         String title, String body, Map<String, Object> metadata) {
        // Save in-app notification first (always succeeds)
        Notification saved = notificationRepository.save(Notification.builder()
                .userId(userId)
                .type(type)
                .channel(Notification.NotificationChannel.IN_APP)
                .title(title)
                .body(body)
                .status(Notification.NotificationStatus.SENT)
                .read(false)
                .metadata(metadata)
                .sentAt(Instant.now())
                .createdAt(Instant.now())
                .build());

        // Dispatch via all channels (push uses user device token — skipped here as we don't store them yet)
        try {
            pushProvider.send(userId, title, body);
            emailProvider.send(userId, title, body);
            smsProvider.send(userId, title, body);
        } catch (Exception e) {
            log.error("Provider dispatch failed for notificationId={} userId={}", saved.getId(), userId, e);
        }

        log.info("Notification dispatched notificationId={} userId={} type={}", saved.getId(), userId, type);
    }

    @Override
    public Page<Notification> listNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public long countUnread(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Override
    public Notification markRead(String userId, String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Notification not found", HttpStatus.NOT_FOUND));
        if (!notification.getUserId().equals(userId)) {
            throw new BusinessException("FORBIDDEN", "Access denied", HttpStatus.FORBIDDEN);
        }
        notification.setRead(true);
        return notificationRepository.save(notification);
    }
}
