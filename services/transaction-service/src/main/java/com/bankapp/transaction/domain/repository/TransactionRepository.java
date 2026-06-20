package com.bankapp.transaction.domain.repository;

import com.bankapp.transaction.domain.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);
    Page<Transaction> findByUserId(UUID userId, Pageable pageable);

    @Query("SELECT t FROM Transaction t WHERE t.userId = :userId AND (t.fromAccountId = :accountId OR t.toAccountId = :accountId)")
    Page<Transaction> findByUserIdAndAccount(@Param("userId") UUID userId, @Param("accountId") UUID accountId, Pageable pageable);
}
