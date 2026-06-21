package com.bankapp.card.security;

import com.bankapp.base.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public record GatewayAuthContext(UUID userId, String email, String role) {

    public static GatewayAuthContext current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof GatewayPrincipal principal)) {
            throw new BusinessException("UNAUTHORIZED", "Authentication required", HttpStatus.UNAUTHORIZED);
        }
        return new GatewayAuthContext(principal.userId(), principal.email(), principal.role());
    }
}
