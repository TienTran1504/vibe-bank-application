package com.bankapp.analytics.domain;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SpendSummaryRepository extends MongoRepository<SpendSummary, String> {
    Optional<SpendSummary> findByUserIdAndPeriod(String userId, String period);
    List<SpendSummary> findByUserIdOrderByPeriodDesc(String userId);
}
