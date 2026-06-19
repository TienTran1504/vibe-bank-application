# Bank App — Microservices Project

## Project Overview
PayPal-like mobile banking app built with microservices architecture.
See @docs/00-architecture-overview.md for the full plan.

## Tech Stack
- **Backend**: Java 21 + Spring Boot 3 (microservices)
- **Mobile**: React Native (iOS & Android)
- **Admin Web**: React + Vite + TypeScript
- **API Gateway**: Spring Cloud Gateway + JWT/OAuth2
- **Messaging**: Apache Kafka + REST
- **DBs**: PostgreSQL (financial), Redis (cache/sessions), MongoDB (docs/logs)
- **Infra**: Docker + Kubernetes + Helm

## Project Structure
```
bank-application/
├── pom.xml                     # Maven parent POM (multi-module)
├── docker-compose.yml
│
├── services/                   # Spring Boot microservices (Maven multi-module)
│   ├── base-domain/            # Shared DTOs, events, exceptions
│   ├── gateway/                # API Gateway :8080
│   ├── auth-service/           # Auth :8001 ✅
│   ├── user-service/           # :8081
│   ├── account-service/        # :8082
│   ├── transaction-service/    # :8083
│   ├── card-service/           # :8084
│   ├── notification-service/   # :8085
│   ├── wallet-service/         # :8086
│   ├── analytics-service/      # :8087
│   └── fraud-service/          # :8088
│
├── frontend/                   # npm workspaces monorepo
│   ├── package.json            # workspace root
│   ├── shared/                 # @bankapp/shared — TS types, Axios client, constants
│   ├── mobile/                 # React Native (iOS + Android)
│   └── admin/                  # React + Vite admin dashboard
│
├── infra/                      # Docker, K8s Helm charts, Prometheus, Grafana
└── docs/                       # Architecture & API docs, Postman collections
```

## Build Commands
- **Backend — install parent POM first (once):** `mvn install -N`
- **Backend — build a module:** `mvn clean install -pl services/base-domain`
- **Backend — run a service:** `mvn spring-boot:run -pl services/auth-service -am`
- **Full stack (Docker):** `docker-compose up -d --build`
- **Infra only (Docker):** `docker-compose up -d postgres redis mongodb kafka zookeeper`
- **Rebuild one service:** `docker-compose up -d --build auth-service`
- **Frontend — install all workspaces:** `cd frontend && npm install`
- **Mobile:** `cd frontend && npm run start -w mobile` / `npm run android -w mobile`
- **Admin:** `cd frontend && npm run dev -w admin`
- **Run backend tests:** `mvn test -pl services/auth-service`
- **Run frontend tests:** `cd frontend && npm test -w shared`

## Code Style Rules
- Java: follow Google Java Style Guide, use Lombok, no wildcard imports
- TypeScript: strict mode ON, no `any`, prefer `interface` over `type`
- React Native: functional components only, hooks for state
- REST APIs: kebab-case URLs, camelCase JSON, always paginate lists
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, etc.)

## Architecture Principles
- Each microservice owns its own database — NO cross-service DB joins
- All inter-service async communication via Kafka events
- Saga pattern for distributed transactions (no 2PC)
- Idempotency keys on ALL payment/transaction endpoints
- Every API endpoint must have input validation at the boundary
- NEVER store secrets in code — use environment variables or Vault
- Service layer: always create an **interface** in `service/` + **implementation** in `service/impl/`
- Frontend: shared TS types and Axios client live in `frontend/shared/` — never duplicate across mobile/admin

## Workflow
1. Explore first (plan mode), then implement
2. Run tests after every significant change
3. Use `git commit` with Conventional Commits format
4. Use subagents for research-heavy tasks to preserve context
5. See @docs/05-build-phases.md for the current phase roadmap
6. **After completing a phase or adding new API endpoints**: create or update the Postman collection in `docs/postman/` — see Postman Collections section below

## Audit & Review Skills (run after building each feature)
- `/audit-auth` — JWT, bcrypt, refresh tokens, OTP deep audit (after auth service work)
- `/audit-db` — PostgreSQL/MongoDB/Redis security audit (after schema or query changes)
- `/audit-business-logic` — Race conditions, double-spend, idempotency (after transaction/account work)
- `/audit-secrets` — Scan entire codebase for hardcoded credentials
- `/audit-input` — Input validation matrix across all endpoints
- `/review-solid` — SOLID principles + Spring Boot code quality
- `/review-errors` — Error handling, circuit breakers, Kafka DLT

## Scaffolding Skills
- `/new-service <name>` — Full Spring Boot microservice scaffold
- `/new-endpoint <description>` — REST endpoint with DTO, service, controller, tests
- `/db-migration <change>` — Flyway migration + entity update
- `/mobile-screen <description>` — React Native screen with React Query + UX

## Postman Collections

All Postman collections live in `docs/postman/` and follow Postman Collection v2.1.0 format.

| File | Phase | Coverage |
|---|---|---|
| `BankApp-Auth.postman_collection.json` | Phase 1 | Register, Login, MFA, Refresh, Logout |
| `BankApp-Phase2-CoreBanking.postman_collection.json` | Phase 2 | User profile, KYC, Accounts, Transfers, Fraud edge cases |

**Rules for maintaining collections:**
- All requests target the gateway at `http://localhost:8080` (not service ports directly), except internal endpoints under `/internal/**` which go direct to the service port
- Use collection variables for all dynamic values: `base_url`, `access_token`, `my_account_id`, etc.
- Add a `test` script to auto-save IDs and tokens from responses using `pm.collectionVariables.set()`
- Add a `prerequest` script to generate idempotency keys where required
- Group requests in folders by service; include at least one happy-path response and one error response as examples
- When a new phase or endpoint is added, either update the relevant collection or create `BankApp-Phase{N}-<Name>.postman_collection.json`

## Important Files
- Architecture: @docs/00-architecture-overview.md
- API conventions: @docs/02-api-contracts.md
- DB schemas: @docs/03-database-schemas.md
- Mobile UX guide: @docs/04-mobile-ux-guide.md
- DevOps setup: @docs/06-devops.md
- Claude Code reference: @reference/claude-code-cheatsheet.md
- Postman collections: `docs/postman/`
