package com.bankapp.card.dto;

import com.bankapp.card.domain.entity.Card;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class CardResponse {
    private UUID id;
    private UUID userId;
    private UUID accountId;
    private String cardNumberMasked;
    private String cardType;
    private String status;
    private BigDecimal spendingLimit;
    private LocalDate expiryDate;
    private Instant createdAt;
    private Instant updatedAt;

    public static CardResponse from(Card card) {
        return CardResponse.builder()
                .id(card.getId())
                .userId(card.getUserId())
                .accountId(card.getAccountId())
                .cardNumberMasked(card.getCardNumberMasked())
                .cardType(card.getCardType().name())
                .status(card.getStatus().name())
                .spendingLimit(card.getSpendingLimit())
                .expiryDate(card.getExpiryDate())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .build();
    }
}
