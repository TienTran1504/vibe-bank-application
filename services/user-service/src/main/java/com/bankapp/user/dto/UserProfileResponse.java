package com.bankapp.user.dto;

import com.bankapp.user.domain.entity.UserProfile;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Getter
@Builder
public class UserProfileResponse {

    private UUID id;
    private UUID userId;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String address;
    private String countryCode;
    private String kycStatus;
    private Instant kycReviewedAt;
    private Instant createdAt;
    private Instant updatedAt;

    public static UserProfileResponse from(UserProfile p) {
        return UserProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .firstName(p.getFirstName())
                .lastName(p.getLastName())
                .dateOfBirth(p.getDateOfBirth())
                .address(p.getAddress())
                .countryCode(p.getCountryCode())
                .kycStatus(p.getKycStatus().name())
                .kycReviewedAt(p.getKycReviewedAt())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
