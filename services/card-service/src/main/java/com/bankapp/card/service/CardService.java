package com.bankapp.card.service;

import com.bankapp.card.dto.CardPaymentRequest;
import com.bankapp.card.dto.CardResponse;
import com.bankapp.card.dto.CardTransactionResponse;
import com.bankapp.card.dto.CreatePhysicalCardRequest;
import com.bankapp.card.dto.CreateVirtualCardRequest;
import com.bankapp.card.dto.FreezeCardRequest;
import com.bankapp.card.dto.SpendingLimitRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface CardService {
    List<CardResponse> listCards(UUID userId);
    CardResponse createVirtualCard(UUID userId, CreateVirtualCardRequest request);
    CardResponse requestPhysicalCard(UUID userId, CreatePhysicalCardRequest request);
    CardResponse freezeCard(UUID userId, UUID cardId, FreezeCardRequest request);
    CardResponse setSpendingLimit(UUID userId, UUID cardId, SpendingLimitRequest request);
    CardTransactionResponse payWithCard(UUID userId, UUID cardId, String idempotencyKey, CardPaymentRequest request);
    Page<CardTransactionResponse> listCardTransactions(UUID userId, UUID cardId, Pageable pageable);
}
