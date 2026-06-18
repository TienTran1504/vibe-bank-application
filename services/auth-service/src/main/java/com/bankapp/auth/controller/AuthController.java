package com.bankapp.auth.controller;

import com.bankapp.auth.dto.LoginRequest;
import com.bankapp.auth.dto.LoginResponse;
import com.bankapp.auth.dto.MfaVerifyRequest;
import com.bankapp.auth.dto.RefreshTokenRequest;
import com.bankapp.auth.dto.RegisterRequest;
import com.bankapp.auth.service.AuthService;
import com.bankapp.base.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(null, "Registration successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<LoginResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestHeader("Authorization") String authorizationHeader) {
        authService.logout(authorizationHeader);
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out successfully"));
    }

    @PostMapping("/mfa/send")
    public ResponseEntity<ApiResponse<Void>> sendOtp(
            @AuthenticationPrincipal UserDetails userDetails) {
        long ttlSeconds = authService.sendOtp(userDetails.getUsername());
        long ttlMinutes = ttlSeconds / 60;
        String message = ttlMinutes > 0
                ? "OTP sent, expires in " + ttlMinutes + " minute" + (ttlMinutes > 1 ? "s" : "")
                : "OTP sent, expires in " + ttlSeconds + " seconds";
        return ResponseEntity.ok(ApiResponse.ok(null, message));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> verifyOtp(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody MfaVerifyRequest request) {
        boolean verified = authService.verifyOtp(userDetails.getUsername(), request.getOtp());
        if (!verified) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.ok(Map.of("verified", false), "Invalid or expired OTP"));
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("verified", true), "MFA verified"));
    }
}
