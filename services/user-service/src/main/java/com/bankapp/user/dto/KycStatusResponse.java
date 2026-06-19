package com.bankapp.user.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class KycStatusResponse {
    private String status;
    private Instant submittedAt;
    private Instant reviewedAt;
    private String documentType;
}
