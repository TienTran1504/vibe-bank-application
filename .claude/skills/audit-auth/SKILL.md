---
name: audit-auth
description: Deep authentication security audit — JWT config, refresh token lifecycle, bcrypt, brute force protection, session invalidation, OAuth2. Use after building or modifying the Auth Service.
disable-model-invocation: true
---

Conduct a comprehensive authentication security audit of the Auth Service. $ARGUMENTS

Read these files first to understand the current implementation:
- `services/auth-service/src/main/java/**/*` — all auth service source files
- `services/gateway/src/main/java/**/*` — JWT filter and security config

Then check every item below. For each: **Pass / Fail / Unable to verify (what code would prove it)**.

---

## Checklist

### 1. Password Hashing
- [ ] Uses `BCryptPasswordEncoder` with strength ≥ 12
- [ ] No double-hashing (encode once, compare with `matches()`)
- [ ] No MD5, SHA-1, SHA-256 for passwords — only bcrypt/argon2

### 2. JWT Secret & Algorithm
- [ ] JWT secret loaded from env var (`JWT_SECRET`), not hardcoded in `application.yml`
- [ ] Secret entropy ≥ 256 bits for HS256; RS256/ES256 preferred for production
- [ ] Access token TTL: 5–15 minutes (`JWT_ACCESS_EXPIRY_MS` ≤ 900000)
- [ ] Refresh token TTL: 7–30 days
- [ ] Separate secret/key for access vs. refresh tokens

### 3. JWT Validation (Gateway Filter)
- [ ] `exp`, `iss`, `aud`, `sub`, `jti`, `iat` all validated on every request
- [ ] `jwt.verify()` used (not `jwt.decode()`) — algorithm explicitly specified
- [ ] Invalid token returns 401, not 500

### 4. Refresh Token Lifecycle
- [ ] Refresh token rotated on every use — old token immediately revoked
- [ ] Reuse detection: if old RT presented after rotation → revoke entire session family
- [ ] RT stored in DB (`refresh_tokens` table) as a hash (SHA-256), not plaintext
- [ ] RT expires and is cleaned up after TTL
- [ ] RT invalidated on password change (compare `pwdChangedAt` vs `jwt.iat`)

### 5. JWT Blacklist on Logout
- [ ] Access token `jti` stored in Redis on logout
- [ ] Redis key TTL matches the remaining token lifetime
- [ ] Gateway filter checks Redis blacklist before accepting token

### 6. Brute Force Protection
- [ ] Login endpoint rate-limited: max 5 attempts per username+IP per 15 minutes in Redis
- [ ] Progressive backoff after threshold
- [ ] Rate limit applies to password reset and OTP verify endpoints too

### 7. Account Enumeration Defense
- [ ] "User not found" and "wrong password" return identical HTTP status + message
- [ ] Response timing is constant (no early return exposing user existence)

### 8. Password Reset Flow
- [ ] Reset token: `SecureRandom` (≥ 256 bits), hashed at rest (SHA-256) before DB storage
- [ ] Reset token TTL: 15–30 minutes
- [ ] Token is one-time use — deleted/invalidated after first use
- [ ] All active reset tokens invalidated on successful reset

### 9. MFA / OTP
- [ ] OTP generated with `SecureRandom` (not `Math.random()`)
- [ ] OTP stored in Redis with 5-minute TTL, deleted after use
- [ ] OTP brute force: max 5 wrong attempts → lock / resend required

### 10. OAuth2 / Google Login
- [ ] State parameter validated to prevent CSRF
- [ ] Authorization code exchanged server-side (never on mobile client)
- [ ] ID token verified against Google's JWKS endpoint
- [ ] Email verified flag checked before creating/linking account

### 11. Input Validation
- [ ] Email normalized (lowercased, trimmed) before lookup
- [ ] Password length: 8–128 characters, no truncation
- [ ] `@Valid` on all auth endpoint request bodies
- [ ] No user input passed to raw SQL or JPQL string concatenation

### 12. Mass Assignment
- [ ] Registration DTO cannot set `role`, `status`, `mfaEnabled`, `kycStatus`
- [ ] `@JsonProperty(access = READ_ONLY)` or separate DTOs for sensitive fields

### 13. Logging & PII
- [ ] Passwords never logged
- [ ] JWT tokens never logged (log only `jti` or `userId`)
- [ ] Reset tokens never logged
- [ ] OTPs never logged

### 14. Transport
- [ ] HTTPS enforced — HTTP requests redirect or rejected
- [ ] CORS locked to known origins — no `*` in production
- [ ] Auth endpoints excluded from public CORS allowlist

---

## Output

For each **Fail**:
```
**[SEVERITY]** — [Item name]
File: `path/to/file.java:line`
Issue: [what is wrong]
Impact: [what an attacker can do]
Fix: [exact code change or config]
```

Provide a risk score (0–10) and top 3 priority fixes.

Write the report to `audits/auth-audit-<date>.md`.
