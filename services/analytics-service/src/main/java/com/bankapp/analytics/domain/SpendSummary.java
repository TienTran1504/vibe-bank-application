package com.bankapp.analytics.domain;

import lombok.Builder;
import lombok.Getter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;

@Document(collection = "spend_summaries")
@CompoundIndex(name = "userId_period_unique", def = "{'userId': 1, 'period': 1}", unique = true)
@Getter @Builder
public class SpendSummary {

    @Id
    private String id;

    private String userId;
    private String period;      // "YYYY-MM" e.g. "2026-06"
    private BigDecimal totalSpent;
    private BigDecimal totalReceived;
    private long transactionCount;
    private String currency;
}
