# Build Phases Roadmap

## Phase 1 — Foundation (Weeks 1–3)
**Goal**: Working local dev environment + Auth

- [x] Monorepo setup: Maven multi-module parent POM
- [x] `docker-compose.yml` for local dev (PostgreSQL, Redis, MongoDB, Kafka, Zookeeper)
- [x] API Gateway service (Spring Cloud Gateway, routing config)
- [x] Auth Service:
  - [x] User registration + login endpoints
  - [x] JWT generation (access + refresh tokens) — with JTI per-token blacklisting
  - [ ] OAuth2 Google login (optional at this stage)
  - [x] MFA via OTP (Redis-backed, 6-digit, 5-min TTL)
  - [x] JWT blacklist on logout (Redis SET, keyed by JTI)
  - [x] Rate limiting on `/auth/**` (5 req/s, burst 10, via Gateway RequestRateLimiter)
- [x] Shared `base-domain` module with common DTOs, event base class
- [x] Service interface + impl pattern (`service/AuthService.java` + `service/impl/AuthServiceImpl.java`)
- [x] JSON error bodies on 401 and 403 (`AuthEntryPoint`, `CustomAccessDeniedHandler`)
- [x] OTP expiry surfaced in MFA send response (`"OTP sent, expires in 5 minutes"`)
- [x] Postman collection at `docs/postman/BankApp-Auth.postman_collection.json`

**Done criteria**: Can register, login, get a JWT, call a protected endpoint, and logout.

---

## Phase 2 — Core Banking (Weeks 4–7)
**Goal**: Working accounts and P2P transfers

- [x] User Service:
  - [x] Profile CRUD
  - [x] KYC document upload (MongoDB storage)
  - [x] KYC status flow (PENDING → APPROVED / REJECTED)
  - [x] Kafka: publish `user.kyc.approved` event
- [x] Account Service:
  - [x] Create bank account (IBAN generation)
  - [x] Get balance
  - [x] Multi-currency support (USD, EUR, VND)
  - [x] Consume `user.kyc.approved` → auto-create default account
- [x] Transaction Service:
  - [x] P2P transfer (Saga pattern)
  - [x] Idempotency key handling
  - [x] Transaction history with pagination
  - [x] Outbox pattern for Kafka publishing
  - [x] Fraud check call before committing
- [x] Fraud Service (basic):
  - [x] Rule engine: block transactions > $10,000 without KYC
  - [x] Rule: block if > 5 transactions in 1 minute
  - [x] Publish `fraud.alert.raised` event

**Done criteria**: Can create an account, top up (mock), and send money to another user.
- [x] Postman collection at `docs/postman/BankApp-Phase2-CoreBanking.postman_collection.json`

---

## Phase 3 — Mobile App (Weeks 8–11)
**Goal**: Full PayPal-like mobile experience

- [x] React Native project setup (Expo SDK 52, TypeScript, navigation, theme)
- [x] Auth screens:
  - [x] Splash / Onboarding
  - [x] Login (email + password + biometric)
  - [x] Register
  - [x] MFA screen (OTP input)
- [x] Home / Dashboard screen:
  - [x] Total balance card (all currencies converted to USD)
  - [x] Quick actions: Transfer, Deposit, New Acc, Cards (custom PNG icons)
  - [x] My Accounts cards with full IBAN + copy button + USD equivalent for non-USD
  - [x] Recent transactions list (last 5, skeleton loader)
  - [x] Create Account sheet + Deposit sheet
- [x] Transfer flow (renamed from "Send"):
  - [x] Enter recipient by IBAN with Verify button
  - [x] Enter amount — account selector with balance, FX preview box (cross-currency)
  - [x] Review screen — FX breakdown (rate, fee, total deducted, recipient gets)
  - [x] Biometric confirmation before submit
  - [x] Success / Failure screen with converted amount display
- [x] Cross-currency transfer support:
  - [x] Backend: `ExchangeRateService` — USD base, 1 USD = 26,000 VND, 1 USD = 0.87 EUR
  - [x] 1.5% conversion fee on cross-currency transfers
  - [x] `debitAmount` / `creditAmount` in Kafka Saga event
  - [x] `amountInUsd` in fraud check for currency-agnostic $10,000 KYC threshold
  - [x] Flyway V3 migration — `to_currency`, `exchange_rate`, `fee_amount`, `converted_amount` columns
  - [x] `AccountClient` — internal REST call to account-service for account currency lookup
  - [x] `/internal/v1/accounts/{id}/currency` endpoint on account-service
- [x] Activity screen:
  - [x] Shows 5 most recent transactions on load
  - [x] "Load more" fetches all remaining in one request
  - [x] Filter by status (All / Completed / Pending / Failed)
  - [x] Transaction detail view
  - [x] Custom icons: PNG send-arrow (outgoing), receive-arrow (incoming), category emoji
- [x] Cards screen:
  - [x] Virtual card display (masked number)
  - [ ] Card settings (freeze, limits) — requires Phase 4 card-service
- [x] Profile screen:
  - [x] User info + KYC status
  - [x] KYC upload flow (UI — camera integration pending)
  - [x] Settings (biometric, notifications, logout)
- [x] UX polish:
  - [x] `← Home` back button on all tab screens (Activity, Cards, Profile, Transfer flow)
  - [x] Comma-formatted amounts throughout (toLocaleString)
  - [x] FX rate label shows 2–4 decimal places (no rounding to whole number)
  - [x] Bottom nav padding so last items aren't covered by floating tab bar

**Done criteria**: Can complete a full cross-currency send money flow end-to-end from the phone.

---

## Phase 4 — Supporting Services (Weeks 12–13)
**Goal**: Complete notification, cards, wallet, and analytics

- [ ] Card Service:
  - [ ] Virtual card generation (tokenized PAN via mock BIN)
  - [ ] Physical card request
  - [ ] Card freeze/unfreeze
  - [ ] Spending limits per card
- [ ] Wallet Service:
  - [ ] Top-up via mock payment gateway
  - [ ] Withdraw to bank account
  - [ ] Wallet-to-account transfer
- [ ] Notification Service:
  - [ ] Push notifications (FCM for Android, APNs for iOS)
  - [ ] Email (SendGrid or similar)
  - [ ] SMS (Twilio or similar)
  - [ ] Consume Kafka topics and dispatch notifications
- [ ] Analytics Service:
  - [ ] Spend by category (weekly/monthly)
  - [ ] Transaction volume metrics
  - [ ] Audit log (immutable, MongoDB)

---

## Phase 5 — Admin Dashboard + Infra (Weeks 14–15)
**Goal**: Admin web app + production-ready infra

- [ ] React + Vite admin project setup
- [ ] Admin screens:
  - [ ] User management (search, ban, view KYC)
  - [ ] KYC approval queue
  - [ ] Transaction monitor (real-time table)
  - [ ] Fraud alert inbox
  - [ ] System health dashboard
- [ ] Kubernetes Helm charts for all services
- [ ] CI/CD: GitHub Actions → Docker Hub → K8s rolling deploy
- [ ] Prometheus + Grafana dashboards (request rate, error rate, latency)
- [ ] ELK Stack for log aggregation
- [ ] Load testing (k6 or Locust) — target: 1000 req/s on transaction endpoints

---

## Current Status
> Update this section as you progress through phases.

**Phase**: 3 — Mobile App ✅ Complete
**Phase 1 Completed**: 2026-06-18 (OAuth2 Google login deferred to later)
**Phase 2 Completed**: 2026-06-19
**Phase 3 Completed**: 2026-06-20 (full mobile app + cross-currency transfers + UX polish)
