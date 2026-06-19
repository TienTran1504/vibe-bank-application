package com.bankapp.user.service;

import com.bankapp.user.dto.CreateProfileRequest;
import com.bankapp.user.dto.KycStatusResponse;
import com.bankapp.user.dto.KycSubmitRequest;
import com.bankapp.user.dto.UpdateProfileRequest;
import com.bankapp.user.dto.UserProfileResponse;

import java.util.UUID;

public interface UserService {
    UserProfileResponse createProfile(UUID userId, String email, CreateProfileRequest request);
    UserProfileResponse getProfile(UUID userId);
    UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request);
    KycStatusResponse submitKyc(UUID userId, KycSubmitRequest request);
    KycStatusResponse getKycStatus(UUID userId);
    String getKycStatusRaw(UUID userId);
}
