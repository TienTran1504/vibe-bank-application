package com.bankapp.user.domain.document;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "kyc_documents")
@Getter
@Setter
@Builder
public class KycDocument {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String documentType;    // PASSPORT, NATIONAL_ID, DRIVERS_LICENSE
    private String documentNumber;
    private String frontImageUrl;
    private String backImageUrl;
    private String selfieUrl;
    private String fullName;
    private String expiryDate;
    private Instant submittedAt;
}
