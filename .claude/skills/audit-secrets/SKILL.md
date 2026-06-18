---
name: audit-secrets
description: Scan the entire codebase for hardcoded secrets, exposed credentials, and secrets management gaps. Use periodically and before any PR that touches config files or environment setup.
disable-model-invocation: true
---

Scan the entire codebase for hardcoded secrets and secrets management issues. $ARGUMENTS

Search all files under `services/`, `mobile/`, `admin/`, `infra/`, and root config files.

---

## Phase 1 — Automated Pattern Search

Run these searches and report every match:

```bash
# Hardcoded secrets patterns
grep -rn "password\s*=\s*['\"][^${\(]" services/ --include="*.java" --include="*.yml" --include="*.properties"
grep -rn "secret\s*=\s*['\"][^${\(]" services/ --include="*.java" --include="*.yml"
grep -rn "JWT_SECRET\s*=\s*[a-zA-Z0-9]" services/ --include="*.yml" --include="*.properties"
grep -rn "api[_-]key\s*[:=]\s*['\"][^${\(]" . -r --include="*.ts" --include="*.tsx" --include="*.java"
grep -rn "BEGIN PRIVATE KEY\|BEGIN RSA PRIVATE KEY\|BEGIN EC PRIVATE KEY" . -r
grep -rn "mongodb://[^$].*:.*@" . -r
grep -rn "postgresql://[^$].*:.*@" . -r
grep -rn "redis://:.*@" . -r
```

## Phase 2 — File-by-File Checklist

### Java / Spring Boot (`services/`)
- [ ] No secrets in `application.yml` or `application.properties` — only `${ENV_VAR}` references
- [ ] No secrets in `application-dev.yml` or `application-test.yml` committed to git
- [ ] `JWT_SECRET` is an env var reference — minimum 64 hex chars / 256 bits when set
- [ ] `SPRING_DATASOURCE_PASSWORD` is an env var reference
- [ ] `SPRING_REDIS_PASSWORD` is an env var reference
- [ ] `SPRING_DATA_MONGODB_PASSWORD` is an env var reference
- [ ] No API keys hardcoded in `@Value("api-key-value")` or static fields
- [ ] `.env` files are in `.gitignore` — check `.gitignore` covers all patterns: `.env`, `.env.*`, `*.env`

### Docker / Infra (`infra/`, `docker-compose.yml`)
- [ ] `docker-compose.yml` uses `${ENV_VAR}` for all passwords — no hardcoded values
- [ ] Kubernetes secrets (`infra/helm/templates/secret.yaml`) reference K8s Secret objects — no base64-encoded values in chart
- [ ] `.env.example` or `.env.template` contains only placeholder values (e.g., `DB_PASSWORD=changeme`)
- [ ] No real credentials in Helm `values.yaml` or `values-prod.yaml`

### Mobile (`mobile/`)
- [ ] No API base URLs with embedded credentials in React Native source
- [ ] No `REACT_NATIVE_API_KEY` hardcoded in `*.ts` or `*.tsx` files
- [ ] Sensitive keys loaded from `react-native-config` env files — `.env` is gitignored
- [ ] No client-side secrets that should only exist server-side (e.g., payment gateway private keys)

### Admin Dashboard (`admin/`)
- [ ] No API keys in `.env.local`, `vite.config.ts`, or `*.ts` source files that are committed
- [ ] `VITE_*` env vars only contain public-safe values (not private API keys)

### Git History Check
```bash
git log --all --full-history -- "**/.env" "**/*.pem" "**/*.key" "**/secrets*"
git log -p --all --grep="password\|secret\|api_key" --regexp-ignore-case -- "*.yml" "*.properties" | head -200
```
- [ ] No secrets in git history (if found, need `git filter-repo` or `BFG Repo Cleaner`)

---

## Phase 3 — Secrets Management Quality

- [ ] All secrets are loaded from environment variables or a secrets manager (Vault / AWS Secrets Manager / K8s Secrets)
- [ ] Different secret values for dev / staging / production environments
- [ ] JWT secrets are rotatable without restarting all services (via config reload)
- [ ] DB credentials are rotatable (connection pool handles reconnect on rotation)
- [ ] Kafka SSL/SASL credentials in env vars — not in `producer.properties` file in repo

---

## Output

**CRITICAL** for any hardcoded secret found.

For each finding:
```
**CRITICAL** — Hardcoded [secret type]
File: `path/to/file:line`
Pattern: [the matched text, redacted]
Impact: Credential exposure if repo is accessed by unauthorized party
Fix: Replace with `${ENV_VAR_NAME}` and document in `.env.example`
```

Write to `audits/secrets-audit-<date>.md` with a pass/fail summary per category.
