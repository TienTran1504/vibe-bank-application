package com.bankapp.analytics.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface AuditLogRepository extends MongoRepository<AuditLog, String> {
    Page<AuditLog> findByActorIdOrderByTimestampDesc(String actorId, Pageable pageable);
    Page<AuditLog> findByTimestampBetweenOrderByTimestampDesc(Instant from, Instant to, Pageable pageable);
    Page<AuditLog> findByActionOrderByTimestampDesc(String action, Pageable pageable);
}
