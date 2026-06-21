package com.bankapp.analytics.controller;

import com.bankapp.analytics.domain.AuditLog;
import com.bankapp.analytics.dto.AuditLogResponse;
import com.bankapp.analytics.dto.SpendSummaryResponse;
import com.bankapp.analytics.security.GatewayAuthContext;
import com.bankapp.analytics.service.AnalyticsService;
import com.bankapp.base.dto.ApiResponse;
import com.bankapp.base.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/spend")
    public ResponseEntity<ApiResponse<List<SpendSummaryResponse>>> spendHistory() {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        List<SpendSummaryResponse> summaries = analyticsService
                .getSpendSummary(ctx.userId().toString())
                .stream().map(SpendSummaryResponse::from).toList();
        return ResponseEntity.ok(ApiResponse.ok(summaries));
    }

    @GetMapping("/spend/current-month")
    public ResponseEntity<ApiResponse<SpendSummaryResponse>> currentMonth() {
        GatewayAuthContext ctx = GatewayAuthContext.current();
        return ResponseEntity.ok(ApiResponse.ok(
                SpendSummaryResponse.from(analyticsService.getCurrentMonthSummary(ctx.userId().toString()))));
    }

    // Admin-only — protected by SecurityConfig role check
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> auditLogs(
            @RequestParam(required = false) String actorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        var result = analyticsService.getAuditLogs(actorId, from, to,
                PageRequest.of(page, Math.min(size, 200)));
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(result.map(AuditLogResponse::from))));
    }
}
