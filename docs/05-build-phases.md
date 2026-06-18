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

- [ ] User Service:
  - [ ] Profile CRUD
  - [ ] KYC document upload (MongoDB storage)
  - [ ] KYC status flow (PENDING → APPROVED / REJECTED)
  - [ ] Kafka: publish `user.kyc.approved` event
- [ ] Account Service:
  - [ ] Create bank account (IBAN generation)
  - [ ] Get balance
  - [ ] Multi-currency support (USD, EUR, VND)
  - [ ] Consume `user.kyc.approved` → auto-create default account
- [ ] Transaction Service:
  - [ ] P2P transfer (Saga pattern)
  - [ ] Idempotency key handling
  - [ ] Transaction history with pagination
  - [ ] Outbox pattern for Kafka publishing
  - [ ] Fraud check call before committing
- [ ] Fraud Service (basic):
  - [ ] Rule engine: block transactions > $10,000 without KYC
  - [ ] Rule: block if > 5 transactions in 1 minute
  - [ ] Publish `fraud.alert.raised` event

**Done criteria**: Can create an account, top up (mock), and send money to another user.

---

## Phase 3 — Mobile App (Weeks 8–11)
**Goal**: Full PayPal-like mobile experience

- [ ] React Native project setup (TypeScript, navigation, theme)
- [ ] Auth screens:
  - [ ] Splash / Onboarding
  - [ ] Login (email + password + biometric)
  - [ ] Register
  - [ ] MFA screen (OTP input)
- [ ] Home / Dashboard screen:
  - [ ] Balance card
  - [ ] Quick actions: Send, Receive, Top Up
  - [ ] Recent transactions list (skeleton loader)
- [ ] Send Money flow:
  - [ ] Enter recipient (by email or account number)
  - [ ] Enter amount with currency picker
  - [ ] Review screen
  - [ ] Biometric confirmation
  - [ ] Success / Failure screen
- [ ] Transaction History screen:
  - [ ] FlatList with pagination
  - [ ] Filter by date / type
  - [ ] Transaction detail view
- [ ] Cards screen:
  - [ ] Virtual card display (masked number)
  - [ ] Card settings (freeze, limits)
- [ ] Profile screen:
  - [ ] User info
  - [ ] KYC status + upload flow
  - [ ] Settings (biometric, notifications, logout)

**Done criteria**: Can complete a full send money flow end-to-end from the phone.

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

**Phase**: 1 — Foundation
**Started**: 2026-06-18
**Completed**: Phase 1 core complete 2026-06-18 (OAuth2 Google login deferred to later)
