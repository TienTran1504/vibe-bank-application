package com.bankapp.analytics.listener;

import com.bankapp.analytics.domain.AuditLog;
import com.bankapp.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaAnalyticsListener {

    private final AnalyticsService analyticsService;

    @KafkaListener(topics = "transaction.payment.completed", groupId = "analytics-service")
    public void onPaymentCompleted(Map<String, Object> event) {
        String userId      = str(event, "userId");
        String fromId      = str(event, "fromAccountId");
        String toId        = str(event, "toAccountId");
        String txId        = str(event, "transactionId");
        String amountStr   = str(event, "amount");
        String currency    = str(event, "currency");

        if (userId == null || amountStr == null) return;

        BigDecimal amount = new BigDecimal(amountStr);

        // Sender: outgoing
        analyticsService.recordAuditLog(userId, AuditLog.ActorType.USER,
                "TRANSFER_SENT", "TRANSACTION", txId, event);
        analyticsService.updateSpendSummary(userId, amount, currency != null ? currency : "USD", true);

        // Recipient: incoming (best effort — only if recipientUserId is in event)
        String recipientUserId = str(event, "recipientUserId");
        if (recipientUserId != null) {
            analyticsService.updateSpendSummary(recipientUserId, amount, currency != null ? currency : "USD", false);
        }
    }

    @KafkaListener(topics = "transaction.payment.failed", groupId = "analytics-service")
    public void onPaymentFailed(Map<String, Object> event) {
        String userId = str(event, "userId");
        String txId   = str(event, "transactionId");
        if (userId == null) return;
        analyticsService.recordAuditLog(userId, AuditLog.ActorType.USER,
                "TRANSFER_FAILED", "TRANSACTION", txId, event);
    }

    @KafkaListener(topics = "user.kyc.approved", groupId = "analytics-service")
    public void onKycApproved(Map<String, Object> event) {
        String userId = str(event, "userId");
        if (userId == null) return;
        analyticsService.recordAuditLog(userId, AuditLog.ActorType.SYSTEM,
                "KYC_APPROVED", "USER", userId, event);
    }

    @KafkaListener(topics = "fraud.alert.raised", groupId = "analytics-service")
    public void onFraudAlert(Map<String, Object> event) {
        String userId = str(event, "userId");
        String txId   = str(event, "transactionId");
        if (userId == null) return;
        analyticsService.recordAuditLog(userId, AuditLog.ActorType.SYSTEM,
                "FRAUD_ALERT", "TRANSACTION", txId, event);
    }

    @KafkaListener(topics = "wallet.top-up.completed", groupId = "analytics-service")
    public void onWalletTopUp(Map<String, Object> event) {
        String userId    = str(event, "userId");
        String walletId  = str(event, "walletId");
        String amountStr = str(event, "amount");
        if (userId == null) return;
        if (amountStr != null) {
            analyticsService.updateSpendSummary(userId, new BigDecimal(amountStr), "USD", false);
        }
        analyticsService.recordAuditLog(userId, AuditLog.ActorType.USER,
                "WALLET_TOP_UP", "WALLET", walletId, event);
    }

    @KafkaListener(topics = "wallet.withdrawal.completed", groupId = "analytics-service")
    public void onWalletWithdrawal(Map<String, Object> event) {
        String userId    = str(event, "userId");
        String walletId  = str(event, "walletId");
        String amountStr = str(event, "amount");
        if (userId == null) return;
        if (amountStr != null) {
            analyticsService.updateSpendSummary(userId, new BigDecimal(amountStr), "USD", true);
        }
        analyticsService.recordAuditLog(userId, AuditLog.ActorType.USER,
                "WALLET_WITHDRAWAL", "WALLET", walletId, event);
    }

    private String str(Map<String, Object> event, String key) {
        Object val = event.get(key);
        return val != null ? val.toString() : null;
    }
}
