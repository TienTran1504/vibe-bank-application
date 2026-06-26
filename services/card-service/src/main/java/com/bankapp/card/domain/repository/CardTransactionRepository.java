package com.bankapp.card.domain.repository;

import com.bankapp.card.domain.entity.CardTransaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface CardTransactionRepository extends JpaRepository<CardTransaction, UUID> {

    Optional<CardTransaction> findByIdempotencyKey(String idempotencyKey);

    Page<CardTransaction> findByCardIdOrderByAuthorizedAtDesc(UUID cardId, Pageable pageable);

    @Query("""
            SELECT COALESCE(SUM(t.amount), 0) FROM CardTransaction t
            WHERE t.cardId = :cardId
              AND t.status = com.bankapp.card.domain.entity.CardTransaction.Status.COMPLETED
              AND t.authorizedAt >= :since
            """)
    BigDecimal sumCompletedSince(@Param("cardId") UUID cardId, @Param("since") Instant since);
}
