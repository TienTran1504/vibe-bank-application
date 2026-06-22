# Bank App — Architecture Overview

## Summary
A PayPal-like mobile banking application built with microservices. The system handles P2P payments, account management, card issuance, and real-time notifications.

## Tech Stack Decisions

| Layer | Technology | Reason |
|---|---|---|
| Backend | Java 21 + Spring Boot 3 | Enterprise-grade, ACID compliance, mature ecosystem |
| Mobile | React Native | Cross-platform iOS + Android, single codebase |
| Admin Web | React + Vite + TypeScript | Lightweight, fast dev server, shadcn/ui |
| API Gateway | Spring Cloud Gateway | Native Spring ecosystem, JWT + OAuth2 built-in |
| Auth | JWT + OAuth2 (Spring Security) | Stateless, industry standard |
| Messaging | Apache Kafka + REST | Kafka for async events, REST for sync calls |
| Financial DB | PostgreSQL | ACID, strong consistency for money |
| Cache/Sessions | Redis | OTP, JWT blocklist, rate limiting, sessions |
| Documents/Logs | MongoDB | KYC docs, notification history, audit logs |
| Infra | Docker + Kubernetes + Helm | Production-grade, auto-scaling |
| Observability | Prometheus + Grafana + ELK | Metrics, dashboards, log aggregation |

---

## Microservices Map

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                             │
│   React Native (iOS/Android)   │   React+Vite (Admin Web)  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
┌─────────────────────▼───────────────────────────────────────┐
│              Spring Cloud Gateway :8080                     │
│         Rate Limiting · Routing · JWT Validation            │
├───────────────────────────┬─────────────────────────────────┤
│      Auth Service :8001   │   (JWT issue, refresh, OAuth2)  │
└───────────────────────────┴──────────────┬──────────────────┘
                                           │ Internal REST
    ┌──────────────────────────────────────┼──────────────────────────┐
    │              CORE MICROSERVICES      │                          │
    ▼                 ▼                   ▼               ▼          ▼
:8081 User     :8082 Account    :8083 Transaction   :8084 Card  :8086 Wallet
  Profile        Balances         P2P Transfers      Virtual     Top-up
  KYC            Multi-currency   Idempotency        Physical    Withdraw
  Onboarding     IBAN             Saga pattern       Limits
    │                 │                   │               │
    └─────────────────┴───────────────────┴───────────────┘
                                │
                    ┌───────────▼───────────┐
                    │   Apache Kafka Bus    │
                    │  (Event Streaming)    │
                    └───────────┬───────────┘
                                │
    ┌───────────────────────────┼───────────────────────┐
    ▼               ▼           ▼               ▼       ▼
:8085 Notify  :8087 Analytics  :8088 Fraud     Admin Service
  Push/Email    Spend Insights   Rules Engine   User Mgmt
  SMS           Audit Log        Risk Score     KYC Review
```

---

## Database Assignment (Polyglot Persistence)

Each service owns its database — no cross-service DB joins allowed.

| Service | Database | Why |
|---|---|---|
| Auth Service | PostgreSQL + Redis | Credentials in PG; sessions/OTP/JWT blocklist in Redis |
| User Service | PostgreSQL + MongoDB | User profiles in PG; KYC documents in MongoDB |
| Account Service | PostgreSQL | ACID critical — balances must be consistent |
| Transaction Service | PostgreSQL | ACID critical — financial ledger |
| Card Service | PostgreSQL | Card records, status, limits |
| Wallet Service | PostgreSQL | Wallet balances |
| Notification Service | MongoDB | Notification history, templates (flexible schema) |
| Analytics Service | MongoDB | Event store, time-series data, audit logs |
| Fraud Service | Redis + PostgreSQL | Fast rule evaluation in Redis; case records in PG |

---

## Key Architecture Patterns

### 1. Saga Pattern (Distributed Transactions)
Used for money transfers that span multiple services:
```
Transaction Service → [publish] → Kafka
  → Account Service deducts sender balance
  → Account Service credits receiver balance
  → On failure → compensating transaction reverses the deduction
```
No 2-Phase Commit (2PC). All compensation is event-driven.

### 2. Idempotency Keys
Every POST to a payment/transfer endpoint requires `X-Idempotency-Key` header.
The key is stored in Redis for 24 hours. Duplicate requests return the cached response.

### 3. Transactional Outbox Pattern
Prevents the "dual write" problem (DB write + Kafka publish failing independently):
1. Service writes to DB AND an `outbox` table in the same transaction
2. A separate poller reads the outbox and publishes to Kafka
3. On success, marks the outbox record as `published`

### 4. API Versioning
All APIs are versioned: `/api/v1/`, `/api/v2/`, etc.
Breaking changes require a new version. Old versions deprecated with a sunset header.

---

## Port Assignments

| Service | Port |
|---|---|
| API Gateway | 8080 |
| Auth Service | 8001 |
| User Service | 8081 |
| Account Service | 8082 |
| Transaction Service | 8083 |
| Card Service | 8084 |
| Notification Service | 8085 |
| Wallet Service | 8086 |
| Analytics Service | 8087 |
| Fraud Service | 8088 |
| Mobile Metro (dev) | 8089 |
| PostgreSQL | 5432 |
| Redis | 6379 |
| MongoDB | 27017 |
| Kafka | 9092 |
| Zookeeper | 2181 |
| Kafka UI | 9093 |
| Prometheus | 9090 |
| Grafana | 3000 |

---

## Frontend Monorepo Structure

All frontend code lives under `frontend/` as an **npm workspaces** monorepo — mirroring the `services/` pattern on the backend.

```
frontend/
├── package.json            ← workspace root { "workspaces": ["shared","mobile","admin"] }
├── shared/                 ← @bankapp/shared (no UI framework)
│   └── src/
│       ├── types/          ← TS interfaces matching backend DTOs (LoginResponse, etc.)
│       ├── api/            ← Axios base client + token refresh interceptor
│       └── constants/      ← error codes, currencies, status enums
├── mobile/                 ← React Native (iOS + Android)
│   └── src/
│       ├── screens/        ← auth/, home/, send/, activity/, cards/, profile/
│       ├── components/     ← MoneyAmount, AccountCard, TransactionRow...
│       ├── navigation/     ← bottom tabs + stack navigators
│       ├── api/            ← mobile-specific React Query hooks
│       ├── store/          ← Zustand auth/user state
│       └── theme/          ← colors.ts, typography.ts
└── admin/                  ← React + Vite + TypeScript
    └── src/
        ├── pages/          ← Users, KycQueue, Transactions, FraudAlerts, SystemHealth
        ├── components/
        └── api/            ← admin-specific React Query hooks
```

**Rule:** TS types and the Axios client are defined once in `shared/` and imported by both `mobile` and `admin`. Never duplicate API types across apps.

---

## Backend Service Code Structure

Every Spring Boot microservice follows this internal package layout:

```
com.bankapp.<service>/
├── <Service>Application.java
├── controller/         ← @RestController — validates input, delegates to service
├── service/
│   ├── <Name>Service.java       ← interface (contract)
│   └── impl/
│       └── <Name>ServiceImpl.java  ← @Service implementation
├── domain/
│   ├── entity/         ← @Entity JPA classes
│   └── repository/     ← JpaRepository interfaces
├── dto/                ← Request/Response POJOs (@Getter @Builder)
├── event/              ← Kafka event classes (extends BaseEvent)
├── config/             ← SecurityConfig, KafkaConfig...
├── security/           ← JWT filter, AuthEntryPoint, AccessDeniedHandler
└── exception/          ← @RestControllerAdvice GlobalExceptionHandler
```
