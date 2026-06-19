package com.bankapp.user.domain.repository;

import com.bankapp.user.domain.document.KycDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface KycDocumentRepository extends MongoRepository<KycDocument, String> {
    Optional<KycDocument> findTopByUserIdOrderBySubmittedAtDesc(String userId);
}
