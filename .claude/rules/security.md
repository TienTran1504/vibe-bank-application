---
paths:
  - "services/**/*.java"
  - "mobile/**/*.ts"
  - "mobile/**/*.tsx"
  - "admin/**/*.ts"
  - "admin/**/*.tsx"
---

# Security Rules (All Code)

## OWASP Top 10 — Mandatory Checks

### Injection Prevention
- ALL user input must be validated and sanitized before use
- Java: use JPA parameterized queries — NEVER string-concatenate SQL
- Never pass user input to `Runtime.exec()`, `ProcessBuilder`, or shell commands
- TypeScript: sanitize any data rendered as HTML (`DOMPurify` if needed)

### Authentication & Authorization
- JWT tokens: HS256 minimum, RS256 preferred for production
- Token expiry: access token 15 minutes, refresh token 7 days
- NEVER store tokens in localStorage (web) or AsyncStorage (mobile) — use httpOnly cookies (web) or Keychain (mobile)
- Every protected endpoint must check the JWT and the user's role
- Rate limit all auth endpoints: max 5 failed login attempts per IP per 15 minutes

### Sensitive Data
- NEVER log: passwords, tokens, card numbers, full account numbers, SSNs, CVVs
- Passwords: bcrypt with cost factor 12 minimum
- Card numbers: store only last 4 digits; use tokenization for full PAN (PCI-DSS)
- Encrypt PII at rest (AES-256)
- All API communication: HTTPS only, TLS 1.2+

### API Security
- CORS: explicit allowlist of origins — never `*` in production
- All endpoints: validate `Content-Type` header
- File uploads: validate MIME type AND magic bytes, max size limit
- Pagination: enforce max page size (e.g., 100 items) to prevent DoS

### Secrets Management
- NO secrets in source code, git history, or config files
- Use environment variables or a secrets manager (Vault / AWS Secrets Manager)
- `.env` files are gitignored — always
- Rotate secrets on any suspected compromise

## Financial-Specific Security
- All money amounts: use `BigDecimal` in Java, never `float`/`double`
- Idempotency keys required on all payment endpoints (prevents double-charge)
- Every transaction must be logged to the immutable audit log
- Fraud detection must run before any transfer is committed
- Amount limits: enforce per-transaction and daily limits server-side
