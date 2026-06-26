package com.bankapp.card.service.impl;

import com.bankapp.base.exception.BusinessException;
import com.bankapp.card.domain.entity.Card;
import com.bankapp.card.domain.entity.CardTransaction;
import com.bankapp.card.domain.repository.CardRepository;
import com.bankapp.card.domain.repository.CardTransactionRepository;
import com.bankapp.card.dto.CardPaymentRequest;
import com.bankapp.card.dto.CardResponse;
import com.bankapp.card.dto.CardTransactionResponse;
import com.bankapp.card.dto.CreatePhysicalCardRequest;
import com.bankapp.card.dto.CreateVirtualCardRequest;
import com.bankapp.card.dto.FreezeCardRequest;
import com.bankapp.card.dto.SpendingLimitRequest;
import com.bankapp.card.service.CardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CardServiceImpl implements CardService {

    private static final String MOCK_BIN = "411111";
    private static final SecureRandom RANDOM = new SecureRandom();

    private static final String IDEM_PREFIX = "card:pay:idem:";
    private static final String SPEND_PREFIX = "card:spend:";
    private static final Duration IDEMPOTENCY_TTL = Duration.ofHours(24);
    private static final String TOPIC_COMPLETED = "card.payment.completed";
    private static final String TOPIC_DECLINED = "card.payment.declined";

    private final CardRepository cardRepository;
    private final CardTransactionRepository cardTransactionRepository;
    private final StringRedisTemplate redis;
    private final RestTemplate restTemplate;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${account-service.url:http://localhost:8082}")
    private String accountServiceUrl;

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

    @Override
    public CardTransactionResponse payWithCard(UUID userId, UUID cardId, String idempotencyKey, CardPaymentRequest request) {
        // 1. Idempotency replay — same key returns the original outcome
        String cachedTxId = redis.opsForValue().get(IDEM_PREFIX + idempotencyKey);
        if (cachedTxId != null) {
            return replayCachedOutcome(cachedTxId);
        }

        Card card = getOwnedCard(userId, cardId);
        String currency = request.getCurrency() != null ? request.getCurrency() : "USD";
        BigDecimal amount = request.getAmount();

        // 2. Enforce card status
        if (card.getStatus() == Card.CardStatus.FROZEN) {
            decline(card, idempotencyKey, request, currency, "CARD_FROZEN", "Card is frozen", HttpStatus.FORBIDDEN);
        }
        if (card.getStatus() == Card.CardStatus.CANCELLED) {
            decline(card, idempotencyKey, request, currency, "CARD_CANCELLED", "Card is cancelled", HttpStatus.FORBIDDEN);
        }

        // 2b. Enforce card validity — a card is valid through its expiry date.
        // Default a missing expiry to today (valid only through today).
        LocalDate expiry = card.getExpiryDate() != null ? card.getExpiryDate() : LocalDate.now();
        if (expiry.isBefore(LocalDate.now())) {
            decline(card, idempotencyKey, request, currency, "CARD_EXPIRED", "Card has expired", HttpStatus.FORBIDDEN);
        }

        // 3. Enforce per-card daily limit
        BigDecimal todaySpent = todaySpend(cardId);
        if (card.getSpendingLimit() != null && todaySpent.add(amount).compareTo(card.getSpendingLimit()) > 0) {
            decline(card, idempotencyKey, request, currency, "LIMIT_EXCEEDED",
                    "Daily spending limit exceeded", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // 4. Debit the linked account
        if (!debitLinkedAccount(card.getAccountId(), amount)) {
            decline(card, idempotencyKey, request, currency, "INSUFFICIENT_FUNDS",
                    "Insufficient funds on linked account", HttpStatus.UNPROCESSABLE_ENTITY);
        }

        // 5. Authorize: persist, bump counter, publish, cache idempotency
        CardTransaction tx = saveTransaction(card, idempotencyKey, request, currency,
                CardTransaction.Status.COMPLETED, null);
        bumpDailyCounter(cardId, todaySpent.add(amount));
        publish(TOPIC_COMPLETED, tx, null);
        redis.opsForValue().set(IDEM_PREFIX + idempotencyKey, tx.getId().toString(), IDEMPOTENCY_TTL);
        log.info("Card payment COMPLETED cardId={} amount={} merchant={}", cardId, amount, request.getMerchant());
        return CardTransactionResponse.from(tx);
    }

    @Override
    public Page<CardTransactionResponse> listCardTransactions(UUID userId, UUID cardId, Pageable pageable) {
        getOwnedCard(userId, cardId); // ownership check
        return cardTransactionRepository.findByCardIdOrderByAuthorizedAtDesc(cardId, pageable)
                .map(CardTransactionResponse::from);
    }

    // ─── Payment helpers ──────────────────────────────────────────────────────

    private void decline(Card card, String idempotencyKey, CardPaymentRequest request, String currency,
                         String reason, String message, HttpStatus status) {
        CardTransaction tx = saveTransaction(card, idempotencyKey, request, currency,
                CardTransaction.Status.DECLINED, reason);
        publish(TOPIC_DECLINED, tx, reason);
        redis.opsForValue().set(IDEM_PREFIX + idempotencyKey, tx.getId().toString(), IDEMPOTENCY_TTL);
        log.info("Card payment DECLINED cardId={} reason={}", card.getId(), reason);
        throw new BusinessException(reason, message, status);
    }

    private CardTransactionResponse replayCachedOutcome(String cachedTxId) {
        CardTransaction tx = cardTransactionRepository.findById(UUID.fromString(cachedTxId))
                .orElseThrow(() -> new BusinessException("INTERNAL_ERROR",
                        "Cached transaction missing", HttpStatus.INTERNAL_SERVER_ERROR));
        if (tx.getStatus() == CardTransaction.Status.DECLINED) {
            throw new BusinessException(tx.getDeclineReason(),
                    "Card payment declined: " + tx.getDeclineReason(), declineStatus(tx.getDeclineReason()));
        }
        return CardTransactionResponse.from(tx);
    }

    private CardTransaction saveTransaction(Card card, String idempotencyKey, CardPaymentRequest request,
                                            String currency, CardTransaction.Status status, String declineReason) {
        return cardTransactionRepository.save(CardTransaction.builder()
                .cardId(card.getId())
                .userId(card.getUserId())
                .accountId(card.getAccountId())
                .merchant(request.getMerchant())
                .amount(request.getAmount())
                .currency(currency)
                .status(status)
                .declineReason(declineReason)
                .idempotencyKey(idempotencyKey)
                .authorizedAt(Instant.now())
                .build());
    }

    private boolean debitLinkedAccount(UUID accountId, BigDecimal amount) {
        try {
            restTemplate.postForObject(
                    accountServiceUrl + "/internal/v1/accounts/" + accountId + "/debit",
                    Map.of("amount", amount.toPlainString()), Map.class);
            return true;
        } catch (RestClientException e) {
            log.warn("Debit failed for accountId={}: {}", accountId, e.getMessage());
            return false;
        }
    }

    private BigDecimal todaySpend(UUID cardId) {
        String key = SPEND_PREFIX + cardId + ":" + LocalDate.now(ZoneOffset.UTC);
        String cached = redis.opsForValue().get(key);
        if (cached != null) {
            return new BigDecimal(cached);
        }
        Instant startOfDay = LocalDate.now(ZoneOffset.UTC).atStartOfDay(ZoneOffset.UTC).toInstant();
        BigDecimal sum = cardTransactionRepository.sumCompletedSince(cardId, startOfDay);
        redis.opsForValue().set(key, sum.toPlainString(), secondsUntilMidnight());
        return sum;
    }

    private void bumpDailyCounter(UUID cardId, BigDecimal newTotal) {
        String key = SPEND_PREFIX + cardId + ":" + LocalDate.now(ZoneOffset.UTC);
        redis.opsForValue().set(key, newTotal.toPlainString(), secondsUntilMidnight());
    }

    private Duration secondsUntilMidnight() {
        Instant nextMidnight = LocalDate.now(ZoneOffset.UTC).plusDays(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        return Duration.between(Instant.now(), nextMidnight);
    }

    private HttpStatus declineStatus(String reason) {
        return ("CARD_FROZEN".equals(reason) || "CARD_CANCELLED".equals(reason) || "CARD_EXPIRED".equals(reason))
                ? HttpStatus.FORBIDDEN : HttpStatus.UNPROCESSABLE_ENTITY;
    }

    private void publish(String topic, CardTransaction tx, String declineReason) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("eventId", UUID.randomUUID().toString());
        payload.put("transactionId", tx.getId().toString());
        payload.put("cardId", tx.getCardId().toString());
        payload.put("userId", tx.getUserId().toString());
        payload.put("accountId", tx.getAccountId().toString());
        payload.put("merchant", tx.getMerchant());
        payload.put("amount", tx.getAmount().toPlainString());
        payload.put("currency", tx.getCurrency());
        payload.put("status", tx.getStatus().name());
        if (declineReason != null) {
            payload.put("declineReason", declineReason);
        }
        payload.put("timestamp", tx.getAuthorizedAt().toString());
        kafkaTemplate.send(topic, tx.getCardId().toString(), payload);
    }

    // ─── Card helpers ─────────────────────────────────────────────────────────

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
