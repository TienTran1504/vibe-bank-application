# Testing Guide — Per-Phase Manual & API Test Plan

How to verify every phase of the Bank App, end-to-end. Two layers per phase:

- **REST / API** — via the Postman collections in [`docs/postman/`](postman/) or `curl`. Fast, deterministic, run first.
- **GUI** — the React Native mobile app flows. Run after the API layer is green.

There is also an **automated smoke runner** ([`scripts/e2e-smoke.mjs`](../scripts/e2e-smoke.mjs)) that drives the REST layer for Phases 1, 2, 4 and 5 through the gateway and prints a pass/fail table.

---

## 0. Prerequisites

### Bring the stack up
```bash
# Docker Desktop running, then:
cd bank-application
docker-compose up -d
docker ps --format "{{.Names}}: {{.Status}}"   # wait until all healthy/up
```
> If Kafka reports `unhealthy` and some services stay in `Created`, just run `docker-compose up -d` again — Kafka self-heals (`restart: on-failure`) and the second `up` starts the aborted services. See [06-devops.md](06-devops.md) → "Kafka `NodeExists` on rebuild".

### Tools
| Tool | Purpose |
|---|---|
| Postman | Import the collections in `docs/postman/`, run folders top-to-bottom |
| `curl` / Node runner | Scripted API checks |
| Android emulator + Metro | GUI testing — `cd frontend/mobile && npm run start -w mobile` (Metro on **:8089**) |

### Conventions
- **All API calls go through the gateway** `http://localhost:8080`, except `/internal/**` endpoints (direct to the service port — not for external testing).
- Auth: every protected call sends `Authorization: Bearer <access_token>`.
- Payment/transfer endpoints require an `X-Idempotency-Key` header.
- Postman collections use **collection variables** (`base_url`, `access_token`, `my_account_id`, `my_card_id`, …) that the test scripts auto-populate as you go.

### Postman collections by phase
| Collection | Phase |
|---|---|
| `BankApp-Auth.postman_collection.json` | 1 |
| `BankApp-Phase2-CoreBanking.postman_collection.json` | 2 |
| `BankApp-Phase4-SupportingServices.postman_collection.json` | 4 |
| `BankApp-Phase5-CardPayments.postman_collection.json` | 5 |
| _(Phase 3 is GUI-only — no collection)_ | 3 |

---

## Phase 1 — Auth

**Goal:** register, login, get a JWT, call a protected endpoint, logout.

### REST
| # | Request | Body | Expect |
|---|---|---|---|
| 1 | `POST /api/v1/auth/register` | `{ "email": "u1@bankapp.com", "password": "Test@1234", "phone": "+84901234567" }` | 200/201, user created |
| 2 | `POST /api/v1/auth/register` (same email) | same | `409 CONFLICT` (duplicate) |
| 3 | `POST /api/v1/auth/register` | weak password `"test"` | `400 VALIDATION_FAILED` |
| 4 | `POST /api/v1/auth/login` | `{ "email": "u1@bankapp.com", "password": "Test@1234" }` | 200, `{ accessToken, refreshToken, expiresIn, requiresMfa:false }` |
| 5 | `POST /api/v1/auth/login` | wrong password | 401 |
| 6 | `GET /api/v1/users/me` | Bearer token | 200, profile (proves JWT works at the gateway) |
| 7 | `GET /api/v1/users/me` | **no** token | `401 UNAUTHORIZED` (JSON body, not empty) |
| 8 | `POST /api/v1/auth/mfa/send` | Bearer | `200 "OTP sent, expires in 5 minutes"` (OTP printed to `docker logs bankapp-auth` in dev) |
| 9 | `POST /api/v1/auth/mfa/verify` | `{ "otp": "<from logs>" }` | 200 |
| 10 | `POST /api/v1/auth/logout` | Bearer | 200; token now blacklisted → reusing it on step 6 returns 401 |

### GUI
1. **Splash / Onboarding** → **Register** screen: create an account.
2. **Login** with email + password (and biometric prompt if enabled).
3. **MFA** screen accepts the 6-digit OTP.
4. After login you land on the **Dashboard**. Logout from Profile returns you to Login and clears storage.

---

## Phase 2 — Core Banking

**Goal:** accounts + P2P transfers with fraud checks.

### REST
| # | Request | Body | Expect |
|---|---|---|---|
| 1 | `GET /api/v1/users/me` | Bearer | 200 profile |
| 2 | `POST /api/v1/users/me/kyc` | KYC docs | 200, status → `SUBMITTED` |
| 3 | `POST /api/v1/accounts` | `{ "currency": "USD", "type": "CHECKING" }` | 201, returns account + IBAN; save `accountA` |
| 4 | `POST /api/v1/accounts` | `{ "currency": "USD", "type": "SAVINGS" }` | 201; save `accountB` |
| 5 | `POST /api/v1/accounts/{accountA}/top-up` | `{ "amount": "1000.00" }` | 200, balance = 1000 |
| 6 | `POST /api/v1/transactions/transfer` (+`X-Idempotency-Key`) | `{ "fromAccountId": A, "toAccountId": B, "amount": "150.00", "currency": "USD", "description": "Test" }` | `202 PENDING` |
| 7 | `GET /api/v1/transactions/{txId}` | Bearer | poll until `COMPLETED`; A debited 150, B credited 150 |
| 8 | same transfer, **same** `X-Idempotency-Key` | same | returns the **same** txId (no double-spend) |
| 9 | transfer with `fromAccountId == toAccountId` | | `400 VALIDATION_FAILED` (self-transfer guard) |
| 10 | `GET /api/v1/transactions?accountId={A}` | Bearer | paginated list filtered to account A |
| 11 | **Fraud:** transfer `"amount":"20000.00"` without approved KYC | | `403 FRAUD_BLOCKED` (>$10k without KYC) |

### GUI
1. **Dashboard**: total balance (all currencies → USD), account cards with full IBAN + copy, recent activity.
2. **Create Account** sheet → new account appears.
3. **Transfer flow**: enter recipient IBAN → **Verify** → enter amount (account selector, FX preview if cross-currency) → **Review** (rate/fee/total) → biometric → success screen.
4. Confirm the **self-transfer guard**: entering your own account as recipient removes it from the "From account" list.
5. **Activity**: 5 recent on load, "Load more", status filter, transaction detail.

---

## Phase 3 — Mobile App (GUI-focused)

**Goal:** full PayPal-like experience + cross-currency transfers. No dedicated Postman collection — these are GUI flows (backed by Phase 2/3 APIs).

### GUI checklist
- **Cross-currency transfer**: send USD→EUR or USD→VND. The Amount screen shows the FX preview (recipient gets, 1.5% fee, total deducted, rate to 2–4 dp). Review shows the FX breakdown. Success shows the converted amount.
- **Insufficient-funds** check includes the 1.5% fee.
- **Home**: quick actions (Transfer, Wallet, New Acc, Cards); non-USD account cards show `≈ $X.XX USD`.
- **Activity**: pull-to-refresh resets to 5 recent; custom row icons for incoming/outgoing.
- **Profile**: KYC status + upload flow; settings (biometric, notifications, logout).
- **UX**: `← Home` back button on all tab screens; comma-formatted amounts everywhere.

### API spot-check (cross-currency)
`POST /api/v1/transactions/transfer` from a USD account to a EUR account → response/ledger carries `exchangeRate`, `feeAmount`, `convertedAmount`; fraud check uses USD-equivalent.

---

## Phase 4 — Supporting Services

**Goal:** cards, wallet, notifications, analytics. Postman: `BankApp-Phase4-SupportingServices`.

### 4a. Card Service `/api/v1/cards`
| # | Request | Body | Expect |
|---|---|---|---|
| 1 | `POST /virtual` | `{ "accountId": A }` | 201, masked PAN; save `cardId` |
| 2 | `GET /` | | 200, list contains the card |
| 3 | `POST /physical` | `{ "accountId": A, "deliveryAddress": "..." }` | 201 |
| 4 | `PUT /{cardId}/freeze` | `{ "freeze": true }` | 200 `status:FROZEN` |
| 5 | `PUT /{cardId}/freeze` | `{ "freeze": false }` | 200 `status:ACTIVE` |
| 6 | `PUT /{cardId}/limits` | `{ "dailyLimit": "500.00" }` | 200 `spendingLimit:500` |
| 7 | `PUT /{cardId}/freeze` | `{}` (empty) | `400 VALIDATION_FAILED` |

### 4b. Wallet Service `/api/v1/wallets`
| # | Request | Body | Expect |
|---|---|---|---|
| 1 | `GET /me` | | 200, auto-creates wallet (balance 0) |
| 2 | `POST /top-up` | `{ "amount": "100.00", "paymentMethodToken": "mock-card-token" }` | 200, balance 100 |
| 3 | `POST /withdraw` | `{ "amount": "30.00", "toAccountId": A }` | 200, wallet 70 **and bank account A credited +30** |
| 4 | `POST /withdraw` | amount > wallet balance | `422 INSUFFICIENT_FUNDS` |
| 5 | `GET /transactions?page=0&size=20` | | 200 paginated (TOP_UP + WITHDRAWAL) |

### 4c. Notification Service `/api/v1/notifications`
Trigger an event first (a transfer or the wallet top-up above), then:
| # | Request | Expect |
|---|---|---|
| 1 | `GET /unread-count` | `{ unreadCount: N≥1 }` |
| 2 | `GET /?page=0&size=20` | list includes the event-driven notification |
| 3 | `PUT /{id}/read` | 200; unread-count decrements |

### 4d. Analytics Service `/api/v1/analytics`
| # | Request | Expect |
|---|---|---|
| 1 | `GET /spend/current-month` | `{ period, totalSpent, totalReceived, transactionCount, currency }` |
| 2 | `GET /spend` | array of monthly summaries |
| 3 | `GET /analytics/audit-logs` as **USER** | `403 FORBIDDEN` |
| 4 | `GET /analytics/audit-logs` as **ADMIN** | 200 paginated |

### GUI
- **Home**: notification bell shows unread **badge**; tap → Notifications screen.
- **Wallet** screen: top-up, withdraw (verify bank account balance rises), paginated history.
- **Cards** screen: freeze toggle + daily-limit sheet persist.
- **Notifications** screen: unread highlight, tap-to-read, "Mark all read".
- **Profile → Spend Analytics**: current-month hero + net cash flow + month history.

---

## Phase 5 — Card Payments

**Goal:** card→merchant payments that enforce freeze + per-card daily limit. Postman: `BankApp-Phase5-CardPayments`. Requires a `cardId` (Phase 4) whose linked account has a balance.

### REST
| # | Request | Body / Headers | Expect |
|---|---|---|---|
| 1 | `POST /api/v1/cards/{cardId}/pay` | `X-Idempotency-Key`; `{ "merchant":"Coffee Shop", "amount":"12.50", "currency":"USD" }` | `201 COMPLETED`; linked account debited 12.50 |
| 2 | same key, repeat | same `X-Idempotency-Key` | same transaction returned, **no double-charge** |
| 3 | set `dailyLimit` to 100, then pay `"amount":"150.00"` | new key | `422 LIMIT_EXCEEDED` |
| 4 | freeze the card, then pay | new key | `403 CARD_FROZEN` |
| 5 | pay more than the linked account balance | new key | `422 INSUFFICIENT_FUNDS` |
| 6 | expire the card¹, then pay | new key | `403 CARD_EXPIRED` |
| 7 | `GET /api/v1/cards/{cardId}/transactions?page=0&size=20` | | 200 paginated; COMPLETED + DECLINED rows with `declineReason` |

> ¹ Cards are always created with a future `expiry_date`, so there's no API to expire one. To test the `CARD_EXPIRED` path, set it in the DB:
> ```bash
> docker exec bankapp-postgres psql -U bankapp -d card_db \
>   -c "UPDATE cards SET expiry_date = CURRENT_DATE - 1 WHERE id = '<cardId>';"
> ```
> Then re-run the payment (it reads `expiry_date` live). Restore with a future date afterward if you want to keep using the card.

### GUI (Cards screen)
1. **Pay with card** button → sheet (merchant + amount) → **Pay Now**.
2. Success → "Payment Approved" alert; the card's linked account balance drops.
3. Freeze the card, retry → "Payment Declined — card is frozen".
4. Set a low daily limit, pay above it → "Payment Declined — exceeds daily limit".
5. An **expired** card (see REST note ¹) shows an "Expired" badge + greyed art, and paying → "Payment Declined — this card has expired".
6. **Transaction History** row → sheet lists the card's payments (green = completed, red = declined with reason).

### Event fan-out
After a successful card payment: a **notification** ("Card payment approved") appears, and the **analytics** spend summary increases (`GET /analytics/spend/current-month`). Watch with `docker logs bankapp-notification` / `bankapp-analytics`.

---

## Cross-cutting: event-driven verification

Phase 4/5's value is the async fan-out. After any **transfer**, **wallet op**, or **card payment**, confirm:
- **Notification** created (`GET /notifications/unread-count` rises; bell badge updates).
- **Analytics** spend summary updates (`GET /analytics/spend/current-month`).
- Consumers logged the event: `docker logs bankapp-notification`, `docker logs bankapp-analytics`.

---

## Automated smoke test

A Node runner exercises the REST layer for Phases 1, 2, 4, 5 through the gateway and prints a pass/fail table:
```bash
node scripts/e2e-smoke.mjs
# optional: BASE_URL=http://localhost:8080 node scripts/e2e-smoke.mjs
```
It registers a fresh throwaway user each run (so it's repeatable), creates two accounts, tops up, transfers, exercises cards/wallet/notifications/analytics, and runs the card-payment success + decline paths. Exit code is non-zero if any check fails.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `dependency failed to start: bankapp-kafka is unhealthy` | Re-run `docker-compose up -d` once Kafka is healthy (it self-heals). |
| Mobile screen shows stale code / blank | Restart Metro with cache reset: `npx expo start --port 8089 -c`. |
| Metro port conflict | Metro must be **8089** — never 8080–8088 (those are the microservices). |
| Android emulator can't reach Metro | `adb reverse tcp:8089 tcp:8089` (Expo sets this when `ANDROID_HOME`/`adb` are on PATH). |
| 401 on every call | Token expired (15 min) — log in again, or use `/auth/refresh`. |
