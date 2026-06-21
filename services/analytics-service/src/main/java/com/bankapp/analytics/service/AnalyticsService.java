package com.bankapp.analytics.service;

import com.bankapp.analytics.domain.AuditLog;
import com.bankapp.analytics.domain.SpendSummary;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public interface AnalyticsService {
    void recordAuditLog(String actorId, AuditLog.ActorType actorType, String action,
                        String resourceType, String resourceId, Map<String, Object> metadata);
    void updateSpendSummary(String userId, java.math.BigDecimal amount, String currency, boolean isOutgoing);
    Page<AuditLog> getAuditLogs(String actorId, Instant from, Instant to, Pageable pageable);
    List<SpendSummary> getSpendSummary(String userId);
    SpendSummary getCurrentMonthSummary(String userId);
}
