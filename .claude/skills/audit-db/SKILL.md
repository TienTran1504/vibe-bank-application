---
name: audit-db
description: Deep database security audit — parameterized queries, JPA entities, schema constraints, encryption, Redis auth, MongoDB injection. Use when reviewing or adding database access code.
disable-model-invocation: true
---

Conduct a comprehensive database security audit. $ARGUMENTS

Read all service source files under `services/` focusing on:
- Repository classes (`@Repository`, `JpaRepository`, `MongoRepository`)
- `@Query` annotations with JPQL or native SQL
- `EntityManager` usage
- MongoDB `MongoTemplate` or `ReactiveMongoTemplate` usage
- Redis `RedisTemplate` / `StringRedisTemplate` usage
- Flyway migration files in `src/main/resources/db/migration/`
- `application.yml` for database connection config

---

## Checklist

### PostgreSQL / JPA

**Injection Prevention**
- [ ] No `@Query(nativeQuery=true)` with string concatenation of user input
- [ ] No `entityManager.createNativeQuery("SELECT ... " + userInput)`
- [ ] `@Query` with JPQL uses named/positional parameters (`:param`, `?1`) only
- [ ] Any `queryRaw` / `createQuery` usage has parameterized bindings

**LIKE Clause Safety**
- [ ] User input in LIKE patterns has `%` and `_` escaped before binding
- [ ] No `WHERE name LIKE '%" + userInput + "%'"` patterns

**Transactions & Consistency**
- [ ] Balance updates use `SELECT FOR UPDATE` or `@Version` optimistic locking
- [ ] Multi-step operations wrapped in `@Transactional`
- [ ] Rollback paths tested — no partial state possible

**Connection Security**
- [ ] Connection string uses `SPRING_DATASOURCE_URL` env var — not hardcoded
- [ ] DB credentials in env vars — not in `application.properties` or docker-compose
- [ ] `sslmode=require` or `verify-full` on production DB URL
- [ ] App DB user has only SELECT/INSERT/UPDATE/DELETE — no DROP, CREATE, GRANT

**Schema Integrity**
- [ ] `NOT NULL` enforced on required columns
- [ ] Money columns use `NUMERIC(19,4)` — not `FLOAT`, `DOUBLE`, `DECIMAL(10,2)`
- [ ] Enum columns have CHECK constraints
- [ ] Indexes on all FK columns, `status`, `created_at`, `idempotency_key`

**Migrations**
- [ ] Flyway migrations run with restricted DB user (not superuser)
- [ ] No modification of existing `V*.sql` files — only new versions
- [ ] Destructive operations (`DROP COLUMN`, `TRUNCATE`) have rollback migration

**PII & Audit**
- [ ] Sensitive fields (SSN, full card number) not stored in plaintext
- [ ] `SELECT *` not used — only required columns fetched
- [ ] Query/ORM debug logging does not expose PII in non-production logs

### MongoDB

**Injection Prevention**
- [ ] No user input passed to `$where` expressions
- [ ] User input not used as MongoDB operator keys (`$ne`, `$gt`, `$or`)
- [ ] `MongoTemplate.query()` uses `Criteria` builder, not raw document
- [ ] `mongoose.set('sanitizeFilter', true)` equivalent enabled

**Access Control**
- [ ] MongoDB connection requires authentication (`MONGO_USERNAME`, `MONGO_PASSWORD` env vars)
- [ ] MongoDB not publicly exposed — accessible only from app K8s pods
- [ ] Separate MongoDB user per service with minimal collection permissions

**Data**
- [ ] KYC document URLs are pre-signed S3 URLs (not public) or access-controlled
- [ ] Notification history does not store full PII — only `userId` reference

### Redis

**Authentication**
- [ ] Redis connection uses `requirepass` / `AUTH` — not open access
- [ ] Redis not publicly exposed — internal K8s service only
- [ ] `SPRING_REDIS_PASSWORD` loaded from env var

**Key Design**
- [ ] Redis keys include `userId` or `sessionId` scope — no global mutable keys
- [ ] TTL set on all keys (OTP: 5 min, idempotency: 24h, rate limit: 15 min)
- [ ] JWT blacklist keys have TTL = remaining token lifetime (not indefinite)

**Sensitive Data**
- [ ] OTP values stored as hashed or short-lived entries — not plaintext indefinitely
- [ ] No full JWT tokens stored in Redis — only `jti` (token ID)

---

## Output

For each **Fail**:
```
**[SEVERITY]** — [Item]
File/Migration: `path:line`
Issue: what is wrong
Impact: what an attacker achieves
Fix: exact SQL, Java, or config change
```

Severity: CRITICAL = direct data exfiltration/injection; HIGH = auth bypass or PII exposure; MEDIUM = defense-in-depth gap; LOW = hardening

Risk score (0–10) and top 3 fixes.

Write to `audits/database-audit-<date>.md`.
