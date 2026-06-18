package com.bankapp.auth.security;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class JwtBlacklistService {

    private static final String BLACKLIST_KEY_PREFIX = "jwt:blacklist:";

    private final StringRedisTemplate redis;

    public void blacklist(String jti, long ttlSeconds) {
        redis.opsForValue().set(BLACKLIST_KEY_PREFIX + jti, "1", Duration.ofSeconds(ttlSeconds));
    }

    public boolean isBlacklisted(String jti) {
        return Boolean.TRUE.equals(redis.hasKey(BLACKLIST_KEY_PREFIX + jti));
    }
}
