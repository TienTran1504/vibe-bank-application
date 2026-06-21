package com.bankapp.notification.security;

import java.util.UUID;

public record GatewayPrincipal(UUID userId, String email, String role) {}
