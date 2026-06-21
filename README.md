# vibe-bank-application

A PayPal-like mobile banking application built with microservices — Java 21 + Spring Boot 3, React Native, and a complete Claude Code workspace for AI-assisted development.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
│                                                                         │
│   Mobile App              Admin Dashboard         External / API        │
│   iOS & Android           KYC · Users · Monitor   Partners · Webhooks  │
│   React Native            React + Vite (TS)       REST / Webhook        │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ HTTPS / REST
┌────────────────────────────────▼────────────────────────────────────────┐
│                     API GATEWAY & AUTH                                  │
│                                                                         │
│   API Gateway :8080                    Auth Service :8001               │
│   Rate limiting · Routing              JWT · OAuth2 · MFA               │
│   JWT validation · Load balancing      Refresh tokens · OTP             │
│   Spring Cloud Gateway                 Spring Security                  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ Internal REST + Kafka Events
┌────────────────────────────────▼────────────────────────────────────────┐
│               CORE MICROSERVICES  (Spring Boot 3 · Java 21)             │
│                                                                         │
│  ✅ User Service :8081        ✅ Account Service :8082                  │
│     Profile · KYC · Onboard     Balances · IBAN · Multi-currency        │
│                                                                         │
│  ✅ Transaction Service :8083 ✅ Fraud Service :8088                    │
│     P2P Transfers · History      Rules engine · Risk scoring            │
│     Idempotency · Saga           Velocity limits · KYC checks           │
│                                                                         │
│  🔲 Card Service :8084        🔲 Notification Service :8085             │
│     Virtual & physical cards     Push · Email · SMS           (Phase 4) │
│                                                                         │
│  🔲 Wallet Service :8086      🔲 Analytics Service :8087                │
│     Top-up · Withdraw            Spend insights · Audit log   (Phase 4) │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                          APACHE KAFKA                                   │
│                                                                         │
│  transaction.payment.created   transaction.payment.completed            │
│  transaction.payment.failed    user.kyc.approved                        │
│  fraud.alert.raised            (notification.send · account.updated     │
│                                 added in Phase 4)                       │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                     DATA LAYER  (Polyglot Persistence)                  │
│                                                                         │
│  PostgreSQL                    Redis                  MongoDB           │
│  auth_db  · user_db            Sessions · JWT cache   KYC documents     │
│  account_db · transaction_db   Rate limiting · OTP    Notifications     │
│  (card_db · wallet_db          Idempotency keys       Audit logs        │
│   added in Phase 4)            Fraud velocity         Analytics         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│               INFRASTRUCTURE & OBSERVABILITY                            │
│                                                                         │
│  Docker + Kubernetes           Observability          CI/CD Pipeline    │
│  Helm charts                   Prometheus + Grafana   GitHub Actions    │
│  Auto-scaling                  ELK Stack              Docker Hub        │
│  Rolling deploys               Distributed tracing    K8s deploy        │
└─────────────────────────────────────────────────────────────────────────┘

Legend:  ✅ Built   🔲 Planned
```

---

## Project Structure

```
bank-application/
├── CLAUDE.md                        ← Claude reads this every session (project rules)
├── pom.xml                          ← Maven parent POM (multi-module)
├── docker-compose.yml               ← Full local stack (infra + services)
├── .dockerignore
├── .gitignore
│
├── services/                        ← Spring Boot microservices
│   ├── base-domain/                 ← Shared DTOs, events, exceptions
│   ├── gateway/                     ← API Gateway :8080 ✅
│   ├── auth-service/                ← Auth :8001 ✅
│   ├── user-service/                ← Profile, KYC :8081 ✅
│   ├── account-service/             ← Balances, IBAN :8082 ✅
│   ├── transaction-service/         ← P2P transfers, Saga :8083 ✅
│   ├── fraud-service/               ← Rules engine :8088 ✅
│   ├── card-service/                ← Cards :8084 🔲
│   ├── notification-service/        ← Push/Email/SMS :8085 🔲
│   ├── wallet-service/              ← Top-up, withdraw :8086 🔲
│   └── analytics-service/           ← Insights, audit log :8087 🔲
│
├── frontend/                        ← npm workspaces monorepo
│   ├── shared/                      ← @bankapp/shared — TS types, Axios client
│   ├── mobile/                      ← React Native (iOS + Android) 🔲
│   └── admin/                       ← React + Vite admin dashboard 🔲
│
├── infra/                           ← Docker, K8s Helm charts, Prometheus, Grafana
├── docs/                            ← Architecture, API contracts, DB schemas, UX guide
│   └── postman/                     ← Postman collections (Phase 1 Auth, Phase 2 Core Banking)
└── .claude/                         ← Claude Code agents, rules, skills
```

---

## Run Locally

```bash
# Full stack (builds + starts everything)
docker-compose up -d --build

# Infra only (then run services via Maven for hot-reload)
docker-compose up -d postgres redis mongodb kafka zookeeper
mvn spring-boot:run -pl services/auth-service -am
```

API is available at `http://localhost:8080/api/v1/` via the gateway.

Import `docs/postman/` collections into Postman to test all endpoints.

---

## Build Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Foundation: monorepo, Docker, Gateway, Auth Service | ✅ Complete |
| 2 | Core Banking: User, Account, Transaction, Fraud services | ✅ Complete |
| 3 | Mobile App: all screens, biometric auth, full flow | ✅ Complete |
| 4 | Supporting: Cards, Wallet, Notifications, Analytics | ✅ Complete |
| 5 | Card Payments: card→merchant flow enforcing freeze + daily limit | 🔲 Next |
| 6 | Admin dashboard, Kubernetes, CI/CD, load testing | 🔲 |

See [docs/05-build-phases.md](docs/05-build-phases.md) for the full checklist.

---

## Key Design Patterns

| Pattern | Where used |
|---|---|
| **Saga (Choreography)** | P2P transfers: transaction-service → Kafka → account-service → result event |
| **Transactional Outbox** | transaction-service writes DB + outbox atomically; 1s poller publishes to Kafka |
| **Idempotency Keys** | All transfer endpoints require `X-Idempotency-Key`; 24h Redis cache |
| **Pessimistic Locking** | Account balance updates use `SELECT FOR UPDATE` to prevent race conditions |
| **Gateway Auth Injection** | Gateway validates JWT, injects `X-User-Id/Email/Role` headers; services trust these |
| **Fail-open Fraud Check** | Fraud service unreachable → transfer proceeds and is flagged for review |

---

## Scaffolding Commands

| Command | Description |
|---|---|
| `/new-service <name>` | Scaffold a complete Spring Boot microservice |
| `/new-endpoint <desc>` | Add a REST endpoint to an existing service |
| `/db-migration <desc>` | Create a Flyway migration + entity update |
| `/mobile-screen <desc>` | Build a React Native screen with full UX |

## Audit & Review Commands

| Command | Description |
|---|---|
| `/audit-auth` | JWT, bcrypt, refresh tokens, OTP deep audit |
| `/audit-db` | PostgreSQL/MongoDB/Redis security audit |
| `/audit-business-logic` | Race conditions, double-spend, idempotency |
| `/audit-secrets` | Scan codebase for hardcoded credentials |
| `/audit-input` | Input validation matrix across all endpoints |
| `/review-solid` | SOLID principles + Spring Boot code quality |
| `/review-errors` | Error handling, circuit breakers, Kafka DLT |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21 + Spring Boot 3.3 |
| Mobile | React Native (iOS + Android) |
| Admin | React + Vite + TypeScript |
| Gateway | Spring Cloud Gateway + JWT |
| Messaging | Apache Kafka |
| Financial DB | PostgreSQL (ACID — auth, user, account, transaction) |
| Cache / Sessions | Redis (JWT blacklist, OTP, idempotency, rate limiting) |
| Documents / Logs | MongoDB (KYC docs, notifications, audit logs) |
| Infra | Docker + Kubernetes + Helm |
| Monitoring | Prometheus + Grafana + ELK Stack |
