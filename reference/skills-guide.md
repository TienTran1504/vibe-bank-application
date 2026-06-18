# Skills — Complete Guide

## What Are Skills?
Reusable, invokable workflows defined in Markdown files. Like CLAUDE.md, but they only load when used — so they don't consume context every session.

**Key difference from CLAUDE.md:**
- CLAUDE.md = always loaded, for persistent facts/rules
- Skills = loaded on demand, for procedures and workflows

## Create a Skill

```
.claude/skills/<skill-name>/SKILL.md
```

Or use the shorthand (same thing, no directory):
```
.claude/commands/<skill-name>.md
```

## Skill File Format

```markdown
---
name: deploy-staging
description: Deploy the current branch to staging environment
disable-model-invocation: true    # Only YOU invoke it (not Claude automatically)
---

Deploy to staging. Branch: $ARGUMENTS

1. Run the build: `mvn clean package -DskipTests`
2. Build Docker image: `docker build -t bankapp/<service>:staging .`
3. Push to registry: `docker push bankapp/<service>:staging`
4. Apply K8s config: `kubectl set image deployment/<service> <service>=bankapp/<service>:staging`
5. Wait for rollout: `kubectl rollout status deployment/<service>`
6. Run smoke tests: `./scripts/smoke-test.sh staging`
```

## Invoke a Skill
```
/deploy-staging user-service
/new-service fraud-detection-service
/db-migration add index to transactions table
```

Use `$ARGUMENTS` in the skill body to receive everything typed after the skill name.

---

## Frontmatter Fields

| Field | Description |
|---|---|
| `name` | The slash command name (e.g., `deploy` → `/deploy`) |
| `description` | When Claude should auto-invoke this skill |
| `disable-model-invocation: true` | **Only user can invoke** — Claude won't auto-use this. Good for destructive or side-effect actions |
| `subagent: true` | Runs the skill in a separate subagent context |
| `model: haiku` | Model to use when skill runs as subagent |

---

## This Project's Skills

### `/new-service <name>`
Scaffolds a complete Spring Boot microservice:
- Maven module, package structure, entity, repository, service, controller
- Flyway migration, Kafka events, Dockerfile, docker-compose entry

### `/new-endpoint <description>`
Adds a REST endpoint to an existing service:
- Request DTO, response DTO, service method, controller method
- Unit test + integration test

### `/db-migration <change>`
Creates a Flyway migration:
- Finds the next version number
- Writes DDL with proper types/constraints/indexes
- Updates JPA entity and repository if needed

### `/mobile-screen <description>`
Creates a React Native screen:
- Screen component with proper styles
- Custom hook for data fetching (React Query)
- API service function
- Navigation registration

---

## Skill vs. CLAUDE.md vs. Rules vs. Hooks

| Mechanism | Loaded | Enforcement | Best For |
|---|---|---|---|
| **CLAUDE.md** | Every session | Advisory (Claude tries to follow) | Always-true facts, build commands, architecture rules |
| **Rules** (`.claude/rules/`) | When matching files opened | Advisory | File-type-specific code style |
| **Skills** | On demand (you invoke) | Advisory | Repeatable workflows, procedures |
| **Hooks** | At lifecycle events | **Enforced** (always runs) | Must-always actions (lint, block commands, logging) |

---

## User-Level Skills (Personal, All Projects)
```
~/.claude/skills/<skill-name>/SKILL.md
```
These are always available regardless of which project you're in.

## Import Files Into Skills
```markdown
---
name: code-review
---

Review checklist: @~/.claude/review-checklist.md

Also check @docs/02-api-contracts.md for API conventions.
```

## Auto-Invocation vs. Manual
- **Without `disable-model-invocation`**: Claude can invoke the skill automatically when it sees a relevant task. Good for domain knowledge, conventions.
- **With `disable-model-invocation: true`**: Only you can invoke with `/skill-name`. Good for workflows with side effects (deploy, migrations, commits).
