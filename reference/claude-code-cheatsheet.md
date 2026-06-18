# Claude Code — Quick Reference Cheatsheet

## Slash Commands (In-Session)

| Command | What it does |
|---|---|
| `/init` | Generate/improve CLAUDE.md from current codebase |
| `/memory` | View/edit CLAUDE.md, rules, and auto-memory files |
| `/agents` | Create, browse, and manage custom subagents |
| `/hooks` | View all configured hooks (read-only) |
| `/compact` | Manually compact the context window |
| `/compact <focus>` | Compact with a focus hint (e.g., `/compact keep API changes`) |
| `/clear` | Reset context entirely (use between unrelated tasks) |
| `/rewind` | Open rewind menu — restore conversation/code to a checkpoint |
| `/btw <question>` | Ask a side question without it entering conversation context |
| `/model` | Switch the active model mid-session |
| `/goal <condition>` | Set a success condition — Claude loops until it's met |
| `/rename <name>` | Name the current session for later resume |
| `/config` | Open interactive settings browser |
| `/permissions` | Browse and edit permission allowlist/denylist |
| `/sandbox` | Toggle OS-level sandboxing |
| `/desktop` | Hand off session to the Desktop app for visual diff review |

## Custom Skills (This Project)

### Scaffolding
| Command | What it does |
|---|---|
| `/new-service <name>` | Scaffold a complete new Spring Boot microservice |
| `/new-endpoint <description>` | Add a REST endpoint to an existing service |
| `/db-migration <change>` | Create a Flyway migration + entity update |
| `/mobile-screen <description>` | Build a new React Native screen with full UX |

### Security & Quality Audits (run after each feature)
| Command | What it does |
|---|---|
| `/audit-auth` | JWT, bcrypt, refresh tokens, OTP, brute force — full auth checklist |
| `/audit-db` | PostgreSQL/MongoDB/Redis injection, encryption, schema constraints |
| `/audit-business-logic` | Race conditions, double-spend, idempotency, saga gaps |
| `/audit-secrets` | Scans entire codebase for hardcoded credentials |
| `/audit-input` | Input validation matrix — `@Valid`, injection, mass assignment |
| `/review-solid` | SOLID principles + Spring Boot code quality rating |
| `/review-errors` | Error handling, circuit breakers, Kafka DLT, logging |

## Built-in Skills (Always Available)

| Command | What it does |
|---|---|
| `/code-review` | Review current diff for bugs in a fresh subagent |
| `/code-review ultra` | Deep multi-agent cloud review of the branch |
| `/security-review` | Security review of pending changes |
| `/fix-issue <number>` | Fetch GitHub issue + implement + open PR |
| `/schedule` | Schedule a recurring task or reminder |

---

## CLI Flags

```bash
# Start a session
claude                          # Interactive
claude -p "prompt"              # Non-interactive (headless)
claude --continue               # Resume most recent session
claude --resume                 # Choose session to resume
claude --model opus             # Override model

# Permissions
claude --permission-mode auto   # Auto-approve safe actions
claude --permission-mode plan   # Plan mode (no writes)

# Output (for scripting)
claude -p "prompt" --output-format json
claude -p "prompt" --output-format stream-json --verbose

# Tools
cat error.log | claude -p "find the root cause"    # Pipe data in
git diff main | claude -p "review for security"    # Pipe git diff
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Esc` | Stop Claude mid-action (context preserved) |
| `Esc Esc` | Open rewind/checkpoint menu |
| `Ctrl+G` | Open current plan in text editor |
| `Ctrl+C` | Cancel current operation |

---

## Context Management (CRITICAL)

**Context fills fast and performance degrades as it fills.**

| Situation | Action |
|---|---|
| Switching to a different task | `/clear` — fresh context |
| Context feels noisy / Claude is confused | `/clear` + write a better initial prompt |
| Long file exploration | Use `Explore` subagent: *"use subagents to investigate X"* |
| Want to keep key info across compaction | Add it to `CLAUDE.md` |
| Need a side answer without bloating context | `/btw your question` |
| Context auto-compacted | Claude re-reads CLAUDE.md automatically |
| Want to customize what survives compaction | Add to CLAUDE.md: *"When compacting, always preserve..."* |

**Rule of thumb**: If you've corrected Claude more than twice on the same issue, `/clear` and start fresh with a more precise prompt.

---

## Subagents — When to Use

| Task | Use subagent? |
|---|---|
| Exploring many files to understand a codebase | YES — use Explore subagent |
| Security review of new code | YES — use `security-reviewer` |
| API design for new endpoint | YES — use `api-designer` |
| Reviewing a DB schema | YES — use `db-reviewer` |
| Reviewing a mobile screen | YES — use `mobile-reviewer` |
| Writing a single function | NO — handle in main session |
| Writing tests for existing code | NO — handle in main session |

**Invoke explicitly**: *"Use the security-reviewer agent to check these files."*

---

## Vibe Coding Workflow

### For a new feature
```
1. [Plan Mode] "Read [files] and understand how X works"
2. [Plan Mode] "I want to build Y. What files change? Give me a plan."
3. Ctrl+G → edit the plan in your editor
4. [Default Mode] "Implement from the plan. Run tests after each file."
5. "Use the security-reviewer agent on the changes."
6. "Commit with Conventional Commits format and open a PR."
```

### For a bug
```
1. "The error is [paste]. Check [likely file]. Find root cause."
2. "Write a failing test that reproduces it."
3. "Fix it. Run tests. Verify the fix."
4. "Commit: fix(<scope>): <description>"
```

### For a new microservice
```
/new-service <service-name>
```

### For a new API endpoint
```
/new-endpoint POST /api/v1/accounts/{id}/freeze — Admin can freeze an account
```
