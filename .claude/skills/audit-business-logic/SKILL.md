---
name: audit-business-logic
description: Financial business logic vulnerability audit — race conditions, double-spending, idempotency gaps, saga failures, amount limits, currency manipulation. Use when reviewing transaction, account, or wallet service code.
disable-model-invocation: true
---

Conduct a financial business logic security audit focused on money movement and transaction safety. $ARGUMENTS

Read all relevant service files:
- `services/transaction-service/src/` — transfer logic, idempotency handling, saga steps
- `services/account-service/src/` — balance update logic, `SELECT FOR UPDATE` usage
- `services/wallet-service/src/` — top-up, withdrawal logic
- `services/fraud-service/src/` — fraud rule engine

---

## Checklist

### 1. Race Conditions & Concurrency

- [ ] Balance deduction uses `SELECT FOR UPDATE` or Spring Data `@Lock(LockModeType.PESSIMISTIC_WRITE)` to prevent concurrent overdraft
- [ ] Transfer saga steps are atomic — no window between debit and credit where funds are lost
- [ ] Concurrent transfers from the same account don't allow balance to go negative (check DB constraint: `balance >= 0`)
- [ ] Database `CHECK (balance >= 0)` or `CHECK (available_balance >= 0)` constraint exists as last defense

### 2. Double-Spending / Idempotency

- [ ] `X-Idempotency-Key` required on `POST /transactions/transfer` — rejected (400) if missing
- [ ] Idempotency key stored in Redis for 24 hours before DB write
- [ ] Duplicate request with same idempotency key returns the cached original response (409 or 200), not a second debit
- [ ] Idempotency check happens in a Redis `SET NX` atomic operation (not read-then-write)
- [ ] Kafka consumer processes each `transactionId` exactly once — idempotency on consume side too

### 3. Amount Validation

- [ ] `amount > 0` enforced at API validation layer (`@DecimalMin("0.01")`)
- [ ] `amount > 0` also enforced at DB level (`CHECK (amount > 0)`)
- [ ] Negative amounts rejected before any balance check (no negative transfer trick)
- [ ] Maximum transaction amount enforced server-side (not client-side only)
- [ ] Daily/weekly limit enforced per user — checked before processing, not after
- [ ] No `float` or `double` for any amount — only `BigDecimal` with `HALF_UP` rounding

### 4. Currency Safety

- [ ] Currency code validated against ISO 4217 allowlist (`USD`, `EUR`, `VND`, etc.)
- [ ] Cross-currency transfers use exchange rate from a trusted source (not user-supplied)
- [ ] No user-controlled exchange rate field in request body
- [ ] Currency conversion uses `BigDecimal.multiply()` with explicit rounding mode

### 5. Saga Pattern Integrity

- [ ] Every saga step has a corresponding **compensating transaction** defined
- [ ] Compensation fires automatically on failure — not manual intervention required
- [ ] Saga state persisted to DB — survives service restarts
- [ ] Saga step timeouts are defined — stuck sagas don't leave accounts in limbo
- [ ] Final state is always `COMPLETED` or `REVERSED` — never stuck at `PROCESSING`

### 6. Transactional Outbox

- [ ] DB write + outbox insert happen in the same `@Transactional` block
- [ ] Outbox poller retries on failure — no event silently dropped
- [ ] Outbox records marked `PUBLISHED` after Kafka confirm — not before

### 7. Fraud Check Gate

- [ ] Fraud service consulted **before** committing any transfer
- [ ] If fraud service is unavailable, transfer is **held** (not silently approved)
- [ ] Fraud check result is **not** user-controllable — server-to-server call only
- [ ] `FRAUD_BLOCKED` status recorded in transaction record

### 8. KYC Gate

- [ ] Transfers > $10,000 blocked if `kyc_status != 'APPROVED'`
- [ ] KYC status read from authoritative source (user-service) — not from JWT claim alone
- [ ] KYC bypass not possible through parameter manipulation

### 9. Account Ownership

- [ ] Transfer deducts from `fromAccountId` that belongs to the authenticated user — not arbitrary account
- [ ] `fromAccountId` ownership verified server-side before processing (not client-provided and trusted)
- [ ] Cannot transfer from a `FROZEN` or `CLOSED` account

### 10. Time-Based Vulnerabilities

- [ ] No TOCTOU: balance check and deduction in the same DB transaction with lock
- [ ] Token/OTP expiry checked server-side using server time — not client-provided timestamp
- [ ] Timestamps use UTC — no timezone manipulation possible

### 11. Integer/Decimal Safety

- [ ] No integer overflow in cumulative amount calculations
- [ ] BigDecimal scale consistent: `NUMERIC(19,4)` in DB, `BigDecimal.setScale(4, HALF_UP)` in Java
- [ ] Refund amount ≤ original transaction amount (no refund-more-than-paid)

---

## Output

For each **Fail**:
```
**[SEVERITY]** — [Item]
File: `path/to/file.java:line`
Attack scenario: [exact steps an attacker takes]
Financial impact: [what money is lost or gained illegitimately]
Fix: [code change or DB constraint]
```

CRITICAL = direct financial loss, double-spend, bypass of fraud/KYC gate
HIGH = partial saga failure, currency manipulation, IDOR on accounts
MEDIUM = missing server-side limit (relies on client), edge case in concurrent requests
LOW = defense-in-depth gap

Write to `audits/business-logic-audit-<date>.md`.
