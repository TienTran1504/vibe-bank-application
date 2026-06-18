package com.bankapp.auth.service.impl;

import com.bankapp.auth.domain.entity.RefreshToken;
import com.bankapp.auth.domain.entity.User;
import com.bankapp.auth.domain.repository.RefreshTokenRepository;
import com.bankapp.auth.domain.repository.UserRepository;
import com.bankapp.auth.dto.LoginRequest;
import com.bankapp.auth.dto.LoginResponse;
import com.bankapp.auth.dto.RegisterRequest;
import com.bankapp.auth.security.JwtBlacklistService;
import com.bankapp.auth.security.JwtService;
import com.bankapp.auth.security.OtpService;
import com.bankapp.auth.service.AuthService;
import com.bankapp.base.exception.BusinessException;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    @Value("${jwt.refresh-expiry-ms}")
    private long refreshExpiryMs;

    @Value("${jwt.access-expiry-ms}")
    private long accessExpiryMs;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final JwtBlacklistService blacklistService;
    private final OtpService otpService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw BusinessException.conflict("Email already registered");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .build();

        userRepository.save(user);
        log.info("User registered: {}", user.getEmail());
    }

    @Override
    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> BusinessException.unauthorized("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw BusinessException.unauthorized("Invalid credentials");
        }

        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw BusinessException.forbidden("Account is " + user.getStatus().name().toLowerCase());
        }

        user.setLastLoginAt(Instant.now());

        String accessToken = jwtService.generateAccessToken(user);
        String rawRefreshToken = jwtService.generateRefreshToken();

        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(rawRefreshToken))
                .expiresAt(Instant.now().plusMillis(refreshExpiryMs))
                .build();

        refreshTokenRepository.save(refreshToken);

        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(rawRefreshToken)
                .expiresIn(accessExpiryMs / 1000)
                .requiresMfa(user.isMfaEnabled())
                .build();
    }

    @Override
    @Transactional
    public LoginResponse refresh(String rawRefreshToken) {
        String tokenHash = hashToken(rawRefreshToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> BusinessException.unauthorized("Invalid refresh token"));

        if (stored.isRevoked() || stored.isExpired()) {
            throw BusinessException.unauthorized("Refresh token expired or revoked");
        }

        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        String newAccessToken = jwtService.generateAccessToken(user);
        String newRawRefreshToken = jwtService.generateRefreshToken();

        RefreshToken newToken = RefreshToken.builder()
                .user(user)
                .tokenHash(hashToken(newRawRefreshToken))
                .expiresAt(Instant.now().plusMillis(refreshExpiryMs))
                .build();

        refreshTokenRepository.save(newToken);

        return LoginResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRawRefreshToken)
                .expiresIn(accessExpiryMs / 1000)
                .requiresMfa(false)
                .build();
    }

    @Override
    @Transactional
    public void logout(String bearerToken) {
        String token = bearerToken.replace("Bearer ", "");
        Claims claims = jwtService.validateAccessToken(token);

        String jti = claims.getId();
        long remainingTtlSeconds = (claims.getExpiration().getTime() - System.currentTimeMillis()) / 1000;
        if (remainingTtlSeconds > 0) {
            blacklistService.blacklist(jti, remainingTtlSeconds);
        }

        User user = userRepository.findById(UUID.fromString(claims.getSubject()))
                .orElseThrow(() -> BusinessException.unauthorized("User not found"));

        refreshTokenRepository.revokeAllByUser(user);
        log.info("User logged out: {}", user.getEmail());
    }

    @Override
    public long sendOtp(String userId) {
        String otp = otpService.generateAndStore(userId);
        log.info("[DEV ONLY] OTP for user {}: {}", userId, otp);
        return otpService.getTtlSeconds();
    }

    @Override
    public boolean verifyOtp(String userId, String otp) {
        return otpService.verify(userId, otp);
    }

    private String hashToken(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
