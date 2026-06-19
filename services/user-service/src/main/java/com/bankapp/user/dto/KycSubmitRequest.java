package com.bankapp.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;

@Getter
public class KycSubmitRequest {

    @NotBlank
    @Pattern(regexp = "PASSPORT|NATIONAL_ID|DRIVERS_LICENSE",
             message = "must be PASSPORT, NATIONAL_ID, or DRIVERS_LICENSE")
    private String documentType;

    @NotBlank
    private String documentNumber;

    @NotBlank
    private String fullName;

    private String expiryDate;

    // Image URLs (S3 pre-signed URLs or base64 in Phase 2)
    @NotBlank
    private String frontImageUrl;

    private String backImageUrl;

    @NotBlank
    private String selfieUrl;
}
