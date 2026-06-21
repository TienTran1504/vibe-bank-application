# API Contracts & Design Standards

## Base URL
All APIs: `https://api.bankapp.com/api/v1/`

## Request / Response Conventions

### Success Response Envelope
```json
{
  "data": { ... },
  "message": "Success",
  "timestamp": "2026-06-18T10:30:00Z"
}
```

### Error Response Envelope
```json
{
  "error": "VALIDATION_FAILED",
  "message": "Invalid input",
  "details": [
    { "field": "amount", "message": "must be greater than 0" }
  ],
  "timestamp": "2026-06-18T10:30:00Z",
  "traceId": "abc-123-xyz"
}
```

### Pagination Response
```json
{
  "data": {
    "content": [...],
    "page": 0,
    "size": 20,
    "totalElements": 150,
    "totalPages": 8,
    "last": false
  }
}
```

---

## Auth Service `/api/v1/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | None | Register new user |
| POST | `/login` | None | Login, get JWT pair |
| POST | `/refresh` | Refresh token | Get new access token |
| POST | `/logout` | Bearer | Blacklist token |
| POST | `/mfa/send` | Bearer | Send OTP to phone |
| POST | `/mfa/verify` | Bearer | Verify OTP |
| POST | `/oauth2/google` | None | Google OAuth login |

**Register Request:**
```json
{ "email": "user@example.com", "password": "Test@1234", "phone": "+84901234567" }
```
Password rules: min 8 chars, must contain uppercase, lowercase, digit, and special character (`@$!%*?&`).

**Login Request:**
```json
{ "email": "user@example.com", "password": "Test@1234" }
```
**Login Response:**
```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "a4551938-a9cb-4c6d-8bd8-19bd28c2aba8",
    "expiresIn": 900,
    "requiresMfa": false
  },
  "message": "Success",
  "timestamp": "2026-06-18T12:30:18.973Z"
}
```

**MFA Send Response:**
```json
{ "message": "OTP sent, expires in 5 minutes", "timestamp": "..." }
```
OTP is 6 digits, Redis-backed, TTL configured via `otp.ttl-seconds` (default 300s). In dev the OTP is printed to server logs. In production it is delivered via the notification service (Phase 4).

**MFA Verify Request:**
```json
{ "otp": "483921" }
```

---

## User Service `/api/v1/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Bearer | Get own profile |
| PUT | `/me` | Bearer | Update profile |
| POST | `/me/kyc` | Bearer | Submit KYC documents |
| GET | `/me/kyc` | Bearer | Get KYC status |
| GET | `/{userId}` | Admin | Get any user (admin only) |
| PUT | `/{userId}/ban` | Admin | Ban user |

---

## Account Service `/api/v1/accounts`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Bearer | List my accounts |
| POST | `/` | Bearer | Create new account |
| GET | `/{accountId}` | Bearer | Get account details + balance |

**Create Account Request:**
```json
{ "currency": "USD", "type": "SAVINGS" }
```

---

## Transaction Service `/api/v1/transactions`

| Method | Path | Auth | Headers | Description |
|--------|------|------|---------|-------------|
| POST | `/transfer` | Bearer | `X-Idempotency-Key` | P2P transfer |
| GET | `/{txId}` | Bearer | | Get transaction status |
| GET | `/` | Bearer | | List transactions (paginated); optional `?accountId=uuid` filters to a specific account |

**Transfer Request:**
```json
{
  "fromAccountId": "uuid",
  "toAccountId": "uuid",
  "amount": "150.00",
  "currency": "USD",
  "description": "Dinner split"
}
```
**Transfer Response (202 Accepted):**
```json
{
  "data": {
    "transactionId": "uuid",
    "status": "PENDING",
    "estimatedCompletionAt": "2026-06-18T10:30:05Z"
  }
}
```

---

## Wallet Service `/api/v1/wallets`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Bearer | Get or create wallet |
| POST | `/top-up` | Bearer | Add funds (mock gateway) |
| POST | `/withdraw` | Bearer | Withdraw to bank account |
| GET | `/transactions` | Bearer | Wallet transaction history (paginated) |

**Top-up Request:**
```json
{ "amount": "100.00", "paymentMethodToken": "mock-card-token" }
```
**Withdraw Request:**
```json
{ "amount": "50.00", "toAccountId": "uuid" }
```

---

## Card Service `/api/v1/cards`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Bearer | List my cards |
| POST | `/virtual` | Bearer | Create virtual card |
| POST | `/physical` | Bearer | Request physical card |
| PUT | `/{cardId}/freeze` | Bearer | Freeze/unfreeze card |
| PUT | `/{cardId}/limits` | Bearer | Set spending limit |

**Create Virtual Card Request:**
```json
{ "accountId": "uuid" }
```
**Freeze Request:**
```json
{ "freeze": true }
```
**Spending Limit Request:**
```json
{ "dailyLimit": "500.00" }
```

---

## Notification Service `/api/v1/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Bearer | List my notifications (paginated) |
| GET | `/unread-count` | Bearer | Count of unread notifications |
| PUT | `/{id}/read` | Bearer | Mark notification as read |

Notifications are dispatched automatically via Kafka when transactions complete, KYC is approved, fraud alerts are raised, or wallet operations complete. In the current implementation (Phase 4) all providers are **mock/log-only** — push (FCM), email (SendGrid), and SMS (Twilio) providers are wired as `@ConditionalOnProperty` beans ready to be enabled without code changes.

---

## Analytics Service `/api/v1/analytics`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/spend` | Bearer | All monthly spend summaries for current user |
| GET | `/spend/current-month` | Bearer | Current month spend vs received |
| GET | `/audit-logs` | Admin | Paginated audit log (query by actorId, date range) |

**Spend Summary Response:**
```json
{
  "data": {
    "period": "2026-06",
    "totalSpent": "350.00",
    "totalReceived": "1200.00",
    "transactionCount": 8,
    "currency": "USD"
  }
}
```
**Audit Log query params:** `?actorId=uuid`, `?from=2026-06-01T00:00:00Z&to=2026-06-30T23:59:59Z`, `?page=0&size=50`

---

## Standard Error Codes

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_FAILED` | 400 | Request body validation error |
| `CONFLICT` | 409 | Resource already exists (e.g. duplicate email) |
| `DUPLICATE_REQUEST` | 409 | Idempotency key already processed |
| `INSUFFICIENT_FUNDS` | 422 | Not enough balance |
| `ACCOUNT_FROZEN` | 422 | Account is suspended |
| `KYC_REQUIRED` | 403 | KYC not approved for this action |
| `FRAUD_BLOCKED` | 403 | Transaction blocked by fraud rules |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

All error responses — including 401 and 403 — always return a JSON body (never an empty HTTP status):

**401 — No token / expired token:**
```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required — provide a valid Bearer token",
  "timestamp": "2026-06-18T12:30:00Z",
  "traceId": "abc-123"
}
```

**403 — Authenticated but wrong role:**
```json
{
  "error": "FORBIDDEN",
  "message": "You do not have permission to access this resource",
  "timestamp": "2026-06-18T12:30:00Z",
  "traceId": "abc-123"
}
```
