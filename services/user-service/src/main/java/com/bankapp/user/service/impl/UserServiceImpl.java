package com.bankapp.user.service.impl;

import com.bankapp.base.exception.BusinessException;
import com.bankapp.user.domain.document.KycDocument;
import com.bankapp.user.domain.entity.UserProfile;
import com.bankapp.user.domain.repository.KycDocumentRepository;
import com.bankapp.user.domain.repository.UserProfileRepository;
import com.bankapp.user.dto.CreateProfileRequest;
import com.bankapp.user.dto.KycStatusResponse;
import com.bankapp.user.dto.KycSubmitRequest;
import com.bankapp.user.dto.UpdateProfileRequest;
import com.bankapp.user.dto.UserProfileResponse;
import com.bankapp.user.event.KycApprovedEvent;
import com.bankapp.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private static final String TOPIC_KYC_APPROVED = "user.kyc.approved";

    private final UserProfileRepository profileRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Override
    @Transactional
    public UserProfileResponse createProfile(UUID userId, String email, CreateProfileRequest req) {
        if (profileRepository.existsByUserId(userId)) {
            throw new BusinessException("CONFLICT", "Profile already exists for this user", HttpStatus.CONFLICT);
        }
        UserProfile profile = UserProfile.builder()
                .userId(userId)
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .dateOfBirth(req.getDateOfBirth())
                .address(req.getAddress())
                .countryCode(req.getCountryCode())
                .build();
        return UserProfileResponse.from(profileRepository.save(profile));
    }

    @Override
    public UserProfileResponse getProfile(UUID userId) {
        return UserProfileResponse.from(findProfileByUserId(userId));
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest req) {
        UserProfile profile = findProfileByUserId(userId);
        if (req.getFirstName() != null) profile.setFirstName(req.getFirstName());
        if (req.getLastName() != null) profile.setLastName(req.getLastName());
        if (req.getDateOfBirth() != null) profile.setDateOfBirth(req.getDateOfBirth());
        if (req.getAddress() != null) profile.setAddress(req.getAddress());
        if (req.getCountryCode() != null) profile.setCountryCode(req.getCountryCode());
        return UserProfileResponse.from(profileRepository.save(profile));
    }

    @Override
    @Transactional
    public KycStatusResponse submitKyc(UUID userId, KycSubmitRequest req) {
        UserProfile profile = findProfileByUserId(userId);

        if (profile.getKycStatus() == UserProfile.KycStatus.APPROVED) {
            throw new BusinessException("CONFLICT", "KYC already approved", HttpStatus.CONFLICT);
        }

        KycDocument doc = KycDocument.builder()
                .userId(userId.toString())
                .documentType(req.getDocumentType())
                .documentNumber(req.getDocumentNumber())
                .fullName(req.getFullName())
                .expiryDate(req.getExpiryDate())
                .frontImageUrl(req.getFrontImageUrl())
                .backImageUrl(req.getBackImageUrl())
                .selfieUrl(req.getSelfieUrl())
                .submittedAt(Instant.now())
                .build();
        KycDocument saved = kycDocumentRepository.save(doc);

        profile.setKycStatus(UserProfile.KycStatus.SUBMITTED);
        profileRepository.save(profile);

        log.info("KYC submitted for userId={} documentId={}", userId, saved.getId());
        return KycStatusResponse.builder()
                .status(UserProfile.KycStatus.SUBMITTED.name())
                .submittedAt(saved.getSubmittedAt())
                .documentType(saved.getDocumentType())
                .build();
    }

    @Override
    public KycStatusResponse getKycStatus(UUID userId) {
        UserProfile profile = findProfileByUserId(userId);
        KycDocument latest = kycDocumentRepository
                .findTopByUserIdOrderBySubmittedAtDesc(userId.toString())
                .orElse(null);

        return KycStatusResponse.builder()
                .status(profile.getKycStatus().name())
                .submittedAt(latest != null ? latest.getSubmittedAt() : null)
                .reviewedAt(profile.getKycReviewedAt())
                .documentType(latest != null ? latest.getDocumentType() : null)
                .build();
    }

    @Override
    public String getKycStatusRaw(UUID userId) {
        return findProfileByUserId(userId).getKycStatus().name();
    }

    // Called internally (e.g. by admin) to approve KYC
    @Transactional
    public void approveKyc(UUID userId, UUID reviewerId, String correlationId) {
        UserProfile profile = findProfileByUserId(userId);
        profile.setKycStatus(UserProfile.KycStatus.APPROVED);
        profile.setKycReviewedAt(Instant.now());
        profile.setKycReviewedBy(reviewerId);
        profileRepository.save(profile);

        KycApprovedEvent event = KycApprovedEvent.of(
                userId.toString(),
                null,
                profile.getFirstName(),
                profile.getLastName(),
                profile.getCountryCode(),
                correlationId
        );
        kafkaTemplate.send(TOPIC_KYC_APPROVED, userId.toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish KycApprovedEvent for userId={}", userId, ex);
                    } else {
                        log.info("Published KycApprovedEvent for userId={}", userId);
                    }
                });
    }

    private UserProfile findProfileByUserId(UUID userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("NOT_FOUND", "User profile not found", HttpStatus.NOT_FOUND));
    }
}
