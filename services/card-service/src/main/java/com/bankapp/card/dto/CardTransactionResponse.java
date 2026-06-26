package com.bankapp.card.dto;

import com.bankapp.card.domain.entity.CardTransaction;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class CardTransactionResponse {

    private UUID id;
    private UUID cardId;
    private String merchant;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String declineReason;
    private Instant authorizedAt;

    public static CardTransactionResponse from(CardTransaction t) {
        return CardTransactionResponse.builder()
                .id(t.getId())
                .cardId(t.getCardId())
                .merchant(t.getMerchant())
                .amount(t.getAmount())
                .currency(t.getCurrency())
                .status(t.getStatus().name())
                .declineReason(t.getDeclineReason())
                .authorizedAt(t.getAuthorizedAt())
                .build();
    }
}
