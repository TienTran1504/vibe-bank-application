package com.bankapp.notification.listener;

import com.bankapp.notification.domain.Notification;
import com.bankapp.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaNotificationListener {

    private final NotificationService notificationService;

    @KafkaListener(topics = "transaction.payment.created", groupId = "notification-service")
    public void onPaymentCreated(Map<String, Object> event) {
        String userId = str(event, "userId");
        String amount = str(event, "amount");
        String currency = str(event, "currency");
        if (userId == null) return;
        notificationService.dispatch(userId,
                Notification.NotificationType.TRANSACTION,
                "Transfer initiated",
                String.format("Your transfer of %s %s is being processed.", amount, currency),
                event);
    }

    @KafkaListener(topics = "transaction.payment.completed", groupId = "notification-service")
    public void onPaymentCompleted(Map<String, Object> event) {
        String userId = str(event, "userId");
        String amount = str(event, "amount");
        String currency = str(event, "currency");
        if (userId == null) return;
        notificationService.dispatch(userId,
                Notification.NotificationType.TRANSACTION,
                "Transfer completed",
                String.format("Your transfer of %s %s was successful.", amount, currency),
                event);
    }

    @KafkaListener(topics = "transaction.payment.failed", groupId = "notification-service")
    public void onPaymentFailed(Map<String, Object> event) {
        String userId = str(event, "userId");
        String reason = str(event, "errorCode");
        if (userId == null) return;
        notificationService.dispatch(userId,
                Notification.NotificationType.TRANSACTION,
                "Transfer failed",
                "Your transfer could not be completed" + (reason != null ? ": " + reason : "."),
                event);
    }

    @KafkaListener(topics = "user.kyc.approved", groupId = "notification-service")
    public void onKycApproved(Map<String, Object> event) {
        String userId = str(event, "userId");
        if (userId == null) return;
        notificationService.dispatch(userId,
                Notification.NotificationType.KYC,
                "KYC Approved",
                "Your identity verification was approved. You can now make high-value transfers.",
                event);
    }

    @KafkaListener(topics = "fraud.alert.raised", groupId = "notification-service")
    public void onFraudAlert(Map<String, Object> event) {
        String userId = str(event, "userId");
        String reason = str(event, "reason");
        if (userId == null) return;
        notificationService.dispatch(userId,
                Notification.NotificationType.FRAUD,
                "Transaction blocked",
                "A transaction was blocked for security reasons" + (reason != null ? ": " + reason : "."),
                event);
    }

    @KafkaListener(topics = "wallet.top-up.completed", groupId = "notification-service")
    public void onWalletTopUp(Map<String, Object> event) {
        String userId = str(event, "userId");
        String amount = str(event, "amount");
        if (userId == null) return;
        notificationService.dispatch(userId,
                Notification.NotificationType.WALLET,
                "Wallet topped up",
                String.format("%s USD has been added to your wallet.", amount),
                event);
    }

    @KafkaListener(topics = "wallet.withdrawal.completed", groupId = "notification-service")
    public void onWalletWithdrawal(Map<String, Object> event) {
        String userId = str(event, "userId");
        String amount = str(event, "amount");
        if (userId == null) return;
        notificationService.dispatch(userId,
                Notification.NotificationType.WALLET,
                "Withdrawal completed",
                String.format("%s USD has been withdrawn from your wallet.", amount),
                event);
    }

    private String str(Map<String, Object> event, String key) {
        Object val = event.get(key);
        return val != null ? val.toString() : null;
    }
}
