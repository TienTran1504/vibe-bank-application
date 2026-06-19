package com.bankapp.transaction.domain.repository;

import com.bankapp.transaction.domain.entity.TransactionOutbox;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionOutboxRepository extends JpaRepository<TransactionOutbox, UUID> {
    List<TransactionOutbox> findTop50ByStatusOrderByCreatedAtAsc(TransactionOutbox.OutboxStatus status);
}
