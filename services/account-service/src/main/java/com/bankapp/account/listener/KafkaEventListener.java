package com.bankapp.account.listener;

import com.bankapp.account.event.KycApprovedEvent;
import com.bankapp.account.service.AccountService;

import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaEventListener {

    private final AccountService accountService;

    @KafkaListener(topics = "user.kyc.approved", groupId = "account-service")
    public void onKycApproved(KycApprovedEvent event) {
        log.info("Received user.kyc.approved for userId={} correlationId={}",
                event.getUserId(), event.getCorrelationId());
        accountService.handleKycApproved(event);
    }

    @KafkaListener(topics = "transaction.payment.created", groupId = "account-service")
    public void onPaymentCreated(Map<String, Object> event) {
        log.info("Received transaction.payment.created txId={} correlationId={}",
                event.get("transactionId"), event.get("correlationId"));
        accountService.handlePaymentCreated(event);
    }
}
