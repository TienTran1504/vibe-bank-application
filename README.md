# vibe-bank-application

A PayPal-like mobile banking application built with microservices — Java 21 + Spring Boot 3, React Native, and a complete Claude Code workspace for AI-assisted development.

## Quick Start

```bash
cd d:\project\vibe\bank-application
claude
```

Claude reads `CLAUDE.md` automatically. To continue from Phase 2:
```
"Read docs/05-build-phases.md and start Phase 2 — User Service and Account Service."
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
│   ├── user-service/                ← :8081
│   ├── account-service/             ← :8082
│   ├── transaction-service/         ← :8083
│   ├── card-service/                ← :8084
│   ├── notification-service/        ← :8085
│   ├── wallet-service/              ← :8086
│   ├── analytics-service/           ← :8087
│   └── fraud-service/               ← :8088
│
├── frontend/                        ← npm workspaces monorepo
│   ├── shared/                      ← @bankapp/shared — TS types, Axios client
│   ├── mobile/                      ← React Native (iOS + Android)
│   └── admin/                       ← React + Vite admin dashboard
│
├── infra/                           ← Docker, K8s Helm charts, Prometheus, Grafana
├── docs/                            ← Architecture, API contracts, DB schemas, UX guide
└── .claude/                         ← Claude Code agents, rules, skills
```

---

## Run Locally

```bash
# Full stack (builds + starts everything)
docker-compose up -d --build

# Infra only (then run services via Maven)
docker-compose up -d postgres redis mongodb kafka zookeeper
mvn spring-boot:run -pl services/auth-service -am
```

API is available at `http://localhost:8080/api/v1/` (via gateway).

---

## Build Phases

| Phase | Focus | Status |
|---|---|---|
| 1 | Foundation: monorepo, Docker, Auth Service | ✅ Complete |
| 2 | Core Banking: accounts, P2P transfers, fraud | ⬜ Next |
| 3 | Mobile App: all screens, biometric, full flow | ⬜ |
| 4 | Supporting: cards, wallet, notifications, analytics | ⬜ |
| 5 | Admin dashboard, K8s, CI/CD, load testing | ⬜ |

See [docs/05-build-phases.md](docs/05-build-phases.md) for the full checklist.

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

| Layer | Tech |
|---|---|
| Backend | Java 21 + Spring Boot 3.3 |
| Mobile | React Native (iOS + Android) |
| Admin | React + Vite + TypeScript |
| Gateway | Spring Cloud Gateway + JWT |
| Messaging | Apache Kafka |
| Financial DB | PostgreSQL (ACID) |
| Cache / Sessions | Redis |
| Documents / Logs | MongoDB |
| Infra | Docker + Kubernetes + Helm |
| Monitoring | Prometheus + Grafana + ELK |
