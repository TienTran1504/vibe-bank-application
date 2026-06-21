package com.bankapp.analytics.dto;

import com.bankapp.analytics.domain.SpendSummary;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter @Builder
public class SpendSummaryResponse {
    private String period;
    private BigDecimal totalSpent;
    private BigDecimal totalReceived;
    private long transactionCount;
    private String currency;

    public static SpendSummaryResponse from(SpendSummary s) {
        return SpendSummaryResponse.builder()
                .period(s.getPeriod())
                .totalSpent(s.getTotalSpent())
                .totalReceived(s.getTotalReceived())
                .transactionCount(s.getTransactionCount())
                .currency(s.getCurrency())
                .build();
    }
}
