package com.bankapp.auth.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final String OTP_KEY_PREFIX = "otp:";
    private static final int OTP_LENGTH = 6;
    private static final SecureRandom RANDOM = new SecureRandom();

    @Value("${otp.ttl-seconds:300}")
    private long otpTtlSeconds;

    private final StringRedisTemplate redis;

    public String generateAndStore(String userId) {
        String otp = generateOtp();
        String key = OTP_KEY_PREFIX + userId;
        redis.opsForValue().set(key, otp, Duration.ofSeconds(otpTtlSeconds));
        log.debug("OTP stored for user {}", userId);
        return otp;
    }

    public boolean verify(String userId, String otp) {
        String key = OTP_KEY_PREFIX + userId;
        String stored = redis.opsForValue().get(key);
        if (stored == null || !stored.equals(otp)) {
            return false;
        }
        redis.delete(key);
        return true;
    }

    public long getTtlSeconds() {
        return otpTtlSeconds;
    }

    private String generateOtp() {
        int value = RANDOM.nextInt(1_000_000);
        return String.format("%06d", value);
    }
}
