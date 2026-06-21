package com.bankapp.card.security;

import java.util.UUID;

public record GatewayPrincipal(UUID userId, String email, String role) {}
