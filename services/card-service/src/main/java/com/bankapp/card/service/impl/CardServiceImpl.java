package com.bankapp.card.service.impl;

import com.bankapp.base.exception.BusinessException;
import com.bankapp.card.domain.entity.Card;
import com.bankapp.card.domain.repository.CardRepository;
import com.bankapp.card.dto.CardResponse;
import com.bankapp.card.dto.CreatePhysicalCardRequest;
import com.bankapp.card.dto.CreateVirtualCardRequest;
import com.bankapp.card.dto.FreezeCardRequest;
import com.bankapp.card.dto.SpendingLimitRequest;
import com.bankapp.card.service.CardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private static final String MOCK_BIN = "411111";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CardRepository cardRepository;

    @Override
    public List<CardResponse> listCards(UUID userId) {
        return cardRepository.findByUserId(userId).stream()
                .map(CardResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public CardResponse createVirtualCard(UUID userId, CreateVirtualCardRequest request) {
        String last4 = generateLast4();
        Card card = Card.builder()
                .userId(userId)
                .accountId(request.getAccountId())
                .cardNumberMasked("**** **** **** " + last4)
                .cardToken(generateToken(last4))
                .cardType(Card.CardType.VIRTUAL)
                .status(Card.CardStatus.ACTIVE)
                .expiryDate(LocalDate.now().plusYears(3))
                .build();
        Card saved = cardRepository.save(card);
        log.info("Virtual card created cardId={} userId={}", saved.getId(), userId);
        return CardResponse.from(saved);
    }

    @Override
    @Transactional
    public CardResponse requestPhysicalCard(UUID userId, CreatePhysicalCardRequest request) {
        String last4 = generateLast4();
        Card card = Card.builder()
                .userId(userId)
                .accountId(request.getAccountId())
                .cardNumberMasked("**** **** **** " + last4)
                .cardToken(generateToken(last4))
                .cardType(Card.CardType.PHYSICAL)
                .status(Card.CardStatus.ACTIVE)
                .expiryDate(LocalDate.now().plusYears(3))
                .build();
        Card saved = cardRepository.save(card);
        log.info("Physical card requested cardId={} userId={} address={}",
                saved.getId(), userId, request.getDeliveryAddress());
        return CardResponse.from(saved);
    }

    @Override
    @Transactional
    public CardResponse freezeCard(UUID userId, UUID cardId, FreezeCardRequest request) {
        Card card = getOwnedCard(userId, cardId);
        if (card.getStatus() == Card.CardStatus.CANCELLED) {
            throw new BusinessException("CARD_CANCELLED", "Cannot modify a cancelled card", HttpStatus.UNPROCESSABLE_ENTITY);
        }
        card.setStatus(request.getFreeze() ? Card.CardStatus.FROZEN : Card.CardStatus.ACTIVE);
        Card saved = cardRepository.save(card);
        log.info("Card {} status={} userId={}", cardId, saved.getStatus(), userId);
        return CardResponse.from(saved);
    }

    @Override
    @Transactional
    public CardResponse setSpendingLimit(UUID userId, UUID cardId, SpendingLimitRequest request) {
        Card card = getOwnedCard(userId, cardId);
        card.setSpendingLimit(request.getDailyLimit());
        Card saved = cardRepository.save(card);
        log.info("Spending limit set cardId={} limit={} userId={}", cardId, request.getDailyLimit(), userId);
        return CardResponse.from(saved);
    }

    private Card getOwnedCard(UUID userId, UUID cardId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "Card not found", HttpStatus.NOT_FOUND));
        if (!card.getUserId().equals(userId)) {
            throw new BusinessException("FORBIDDEN", "Access denied", HttpStatus.FORBIDDEN);
        }
        return card;
    }

    private String generateLast4() {
        return String.format("%04d", RANDOM.nextInt(10000));
    }

    private String generateToken(String last4) {
        // Mock tokenized PAN: BIN + 6 random digits + last4
        String middle = String.format("%06d", RANDOM.nextInt(1000000));
        return MOCK_BIN + middle + last4 + "-" + UUID.randomUUID();
    }
}
