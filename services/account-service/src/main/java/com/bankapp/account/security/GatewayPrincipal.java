package com.bankapp.account.security;

import java.util.UUID;

public record GatewayPrincipal(UUID userId, String email, String role) {}
