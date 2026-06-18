# Database Schemas

## Naming Conventions
- Tables: `snake_case` plural (e.g., `user_accounts`)
- Columns: `snake_case`
- Primary keys: `UUID DEFAULT gen_random_uuid()`
- Money columns: `NUMERIC(19, 4)` — NEVER `FLOAT` or `DOUBLE`
- Timestamps: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- Enums: stored as `VARCHAR(50)` with a CHECK constraint

---

## Auth Service DB (`auth_db`)

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    phone           VARCHAR(20),
    status          VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'SUSPENDED', 'BANNED')),
    mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    revoked     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
```

---

## User Service DB (`user_db`)

```sql
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE,   -- FK to auth_db.users (cross-service, no DB FK)
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    address         TEXT,
    country_code    CHAR(2),
    kyc_status      VARCHAR(50) NOT NULL DEFAULT 'PENDING'
                    CHECK (kyc_status IN ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    kyc_reviewed_at TIMESTAMPTZ,
    kyc_reviewed_by UUID,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
-- KYC documents stored in MongoDB (flexible schema for different doc types)
```

---

## Account Service DB (`account_db`)

```sql
CREATE TABLE bank_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    account_number  VARCHAR(34) NOT NULL UNIQUE,   -- IBAN format
    account_type    VARCHAR(50) NOT NULL CHECK (account_type IN ('SAVINGS', 'CHECKING', 'WALLET')),
    currency        CHAR(3) NOT NULL DEFAULT 'USD', -- ISO 4217
    balance         NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    available_balance NUMERIC(19, 4) NOT NULL DEFAULT 0.0000,
    status          VARCHAR(50) NOT NULL DEFAULT 'ACTIVE'
                    CHECK (status IN ('ACTIVE', 'FROZEN', 'CLOSED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
```

---

## Transaction Service DB (`transaction_db`)

```sql
CREATE TABLE transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key     VARCHAR(255) NOT NULL UNIQUE,
    from_account_id     UUID NOT NULL,
    to_account_id       UUID NOT NULL,
    amount              NUMERIC(19, 4) NOT NULL CHECK (amount > 0),
    currency            CHAR(3) NOT NULL,
    type                VARCHAR(50) NOT NULL CHECK (type IN ('TRANSFER', 'TOP_UP', 'WITHDRAWAL', 'PAYMENT')),
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING'
                        CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED')),
    description         VARCHAR(500),
    correlation_id      UUID NOT NULL,
    error_code          VARCHAR(100),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Outbox table for Kafka publishing (transactional outbox pattern)
CREATE TABLE transaction_outbox (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic           VARCHAR(255) NOT NULL,
    payload         JSONB NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING', 'PUBLISHED', 'FAILED')),
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_outbox_status ON transaction_outbox(status) WHERE status = 'PENDING';
```

---

## MongoDB Collections

### `kyc_documents` (User Service)
```json
{
  "_id": "ObjectId",
  "userId": "UUID string",
  "documentType": "PASSPORT | NATIONAL_ID | DRIVERS_LICENSE",
  "frontImageUrl": "s3://...",
  "backImageUrl": "s3://...",
  "selfieUrl": "s3://...",
  "submittedAt": "ISODate",
  "extractedData": {
    "documentNumber": "...",
    "fullName": "...",
    "expiryDate": "..."
  }
}
```

### `notifications` (Notification Service)
```json
{
  "_id": "ObjectId",
  "userId": "UUID string",
  "type": "PUSH | EMAIL | SMS",
  "title": "...",
  "body": "...",
  "channel": "transaction | kyc | security",
  "status": "SENT | FAILED | PENDING",
  "sentAt": "ISODate",
  "metadata": { "transactionId": "..." }
}
```

### `audit_logs` (Analytics Service)
```json
{
  "_id": "ObjectId",
  "actorId": "UUID string",
  "actorType": "USER | ADMIN | SYSTEM",
  "action": "TRANSFER | LOGIN | KYC_APPROVED | ...",
  "resourceType": "TRANSACTION | USER | ACCOUNT",
  "resourceId": "UUID string",
  "ipAddress": "...",
  "userAgent": "...",
  "timestamp": "ISODate",
  "metadata": { ... }
}
```
