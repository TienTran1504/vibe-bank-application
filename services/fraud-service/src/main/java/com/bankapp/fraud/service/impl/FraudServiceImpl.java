package com.bankapp.fraud.service.impl;

import com.bankapp.fraud.dto.FraudCheckRequest;
import com.bankapp.fraud.dto.FraudCheckResponse;
import com.bankapp.fraud.event.FraudAlertRaisedEvent;
import com.bankapp.fraud.service.FraudService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudServiceImpl implements FraudService {

    private static final String TOPIC_FRAUD_ALERT = "fraud.alert.raised";
    private static final BigDecimal HIGH_VALUE_THRESHOLD = new BigDecimal("10000.00");
    private static final int VELOCITY_LIMIT = 5;
    private static final String VELOCITY_KEY_PREFIX = "fraud:velocity:";

    private final StringRedisTemplate redis;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    public FraudCheckResponse check(FraudCheckRequest req) {
        // Rule 1: Block transactions > $10,000 without approved KYC
        if (req.getAmount().compareTo(HIGH_VALUE_THRESHOLD) > 0 && !req.isKycApproved()) {
            return blocked(req, "KYC_REQUIRED",
                    "Transactions above $10,000 require approved KYC");
        }

        // Rule 2: Block if user has > 5 transactions in the last 60 seconds
        String velocityKey = VELOCITY_KEY_PREFIX + req.getUserId();
        Long count = redis.opsForValue().increment(velocityKey);
        if (count != null && count == 1) {
            redis.expire(velocityKey, Duration.ofSeconds(60));
        }
        if (count != null && count > VELOCITY_LIMIT) {
            return blocked(req, "VELOCITY_LIMIT",
                    "Too many transactions in a short period");
        }

        log.debug("Fraud check APPROVED transactionId={} userId={}", req.getTransactionId(), req.getUserId());
        return FraudCheckResponse.builder().approved(true).build();
    }

    private FraudCheckResponse blocked(FraudCheckRequest req, String rule, String reason) {
        log.warn("Fraud BLOCKED transactionId={} userId={} rule={}", req.getTransactionId(), req.getUserId(), rule);

        FraudAlertRaisedEvent alert = FraudAlertRaisedEvent.of(
                req.getUserId(), req.getTransactionId(),
                req.getAmount(), req.getCurrency(),
                rule, reason, req.getCorrelationId()
        );
        kafkaTemplate.send(TOPIC_FRAUD_ALERT, req.getUserId(), alert)
                .whenComplete((r, ex) -> {
                    if (ex != null) log.error("Failed to publish FraudAlertRaisedEvent", ex);
                });

        return FraudCheckResponse.builder()
                .approved(false)
                .ruleTriggered(rule)
                .reason(reason)
                .build();
    }
}
