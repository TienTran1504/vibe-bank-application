package com.bankapp.analytics.service.impl;

import com.bankapp.analytics.domain.AuditLog;
import com.bankapp.analytics.domain.AuditLogRepository;
import com.bankapp.analytics.domain.SpendSummary;
import com.bankapp.analytics.domain.SpendSummaryRepository;
import com.bankapp.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.Decimal128;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final AuditLogRepository auditLogRepository;
    private final SpendSummaryRepository spendSummaryRepository;
    private final MongoTemplate mongoTemplate;

    private static final DateTimeFormatter PERIOD_FMT = DateTimeFormatter.ofPattern("yyyy-MM");

    @Override
    public void recordAuditLog(String actorId, AuditLog.ActorType actorType, String action,
                                String resourceType, String resourceId, Map<String, Object> metadata) {
        auditLogRepository.save(AuditLog.builder()
                .actorId(actorId)
                .actorType(actorType)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .timestamp(Instant.now())
                .metadata(metadata)
                .build());
    }

    @Override
    public void updateSpendSummary(String userId, BigDecimal amount, String currency, boolean isOutgoing) {
        String period = YearMonth.now().format(PERIOD_FMT);

        // Atomic upsert with $inc — concurrent events for the same (userId, period)
        // can no longer create duplicate documents (unlike find-then-save).
        // $inc requires a numeric BSON type — BigDecimal is stored as a String by default,
        // so wrap amounts in Decimal128 (the correct numeric type for money).
        Decimal128 incAmount = new Decimal128(amount);
        Decimal128 zero = new Decimal128(BigDecimal.ZERO);

        Query query = new Query(Criteria.where("userId").is(userId).and("period").is(period));
        Update update = new Update()
                .setOnInsert("userId", userId)
                .setOnInsert("period", period)
                .setOnInsert("currency", currency != null ? currency : "USD")
                .inc("transactionCount", 1L);
        if (isOutgoing) {
            update.inc("totalSpent", incAmount).inc("totalReceived", zero);
        } else {
            update.inc("totalReceived", incAmount).inc("totalSpent", zero);
        }
        mongoTemplate.upsert(query, update, SpendSummary.class);
    }

    @Override
    public Page<AuditLog> getAuditLogs(String actorId, Instant from, Instant to, Pageable pageable) {
        if (actorId != null) {
            return auditLogRepository.findByActorIdOrderByTimestampDesc(actorId, pageable);
        }
        if (from != null && to != null) {
            return auditLogRepository.findByTimestampBetweenOrderByTimestampDesc(from, to, pageable);
        }
        return auditLogRepository.findAll(pageable);
    }

    @Override
    public List<SpendSummary> getSpendSummary(String userId) {
        return spendSummaryRepository.findByUserIdOrderByPeriodDesc(userId);
    }

    @Override
    public SpendSummary getCurrentMonthSummary(String userId) {
        String period = YearMonth.now().format(PERIOD_FMT);
        return spendSummaryRepository.findByUserIdAndPeriod(userId, period)
                .orElse(SpendSummary.builder()
                        .userId(userId)
                        .period(period)
                        .currency("USD")
                        .totalSpent(BigDecimal.ZERO)
                        .totalReceived(BigDecimal.ZERO)
                        .transactionCount(0)
                        .build());
    }
}
