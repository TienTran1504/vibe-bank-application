package com.bankapp.transaction.listener;

import com.bankapp.transaction.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaEventListener {

    private final TransactionService transactionService;

    @KafkaListener(topics = "transaction.payment.completed", groupId = "transaction-service")
    public void onPaymentCompleted(Map<String, Object> event) {
        log.info("Received transaction.payment.completed txId={}", event.get("transactionId"));
        transactionService.handlePaymentCompleted(event);
    }

    @KafkaListener(topics = "transaction.payment.failed", groupId = "transaction-service")
    public void onPaymentFailed(Map<String, Object> event) {
        log.info("Received transaction.payment.failed txId={} reason={}", event.get("transactionId"), event.get("errorCode"));
        transactionService.handlePaymentFailed(event);
    }
}
