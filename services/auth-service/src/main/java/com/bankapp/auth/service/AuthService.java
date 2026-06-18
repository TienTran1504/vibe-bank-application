package com.bankapp.auth.service;

import com.bankapp.auth.dto.LoginRequest;
import com.bankapp.auth.dto.LoginResponse;
import com.bankapp.auth.dto.RegisterRequest;

public interface AuthService {

    void register(RegisterRequest request);

    LoginResponse login(LoginRequest request);

    LoginResponse refresh(String rawRefreshToken);

    void logout(String bearerToken);

    /** Generates and stores an OTP. Returns the TTL in seconds so the caller can surface it. */
    long sendOtp(String userId);

    boolean verifyOtp(String userId, String otp);
}
