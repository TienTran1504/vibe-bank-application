# Best Practices — Vibe Coding with Claude Code

## The Fundamental Constraint
**Claude's context window fills fast and performance degrades as it fills.**

Every file Claude reads, every command output, every message — all consume context. A single debugging session can burn tens of thousands of tokens. Managing context IS the most important skill.

---

## The Golden Workflow (Explore → Plan → Code → Verify)

### Step 1: Explore (Plan Mode)
Enter plan mode first. Claude reads code without making changes.
```
"Read services/auth-service/src and understand how JWT tokens are generated and validated."
```

### Step 2: Plan
```
"I want to add MFA via OTP. What files change? What's the flow? Give me a detailed plan."
Ctrl+G → Opens the plan in your text editor → Edit it directly
```

### Step 3: Implement
```
"Implement from the plan. Write a failing test first, then make it pass."
```

### Step 4: Verify
```
"Run the tests. If they fail, fix them. Show me the test output."
"Use the security-reviewer agent to check the auth changes."
```

### Step 5: Commit
```
"Commit with Conventional Commits format. Create a PR."
```

---

## Context Management Rules

| Situation | What to do |
|---|---|
| Starting a **new, unrelated task** | `/clear` first |
| Corrected Claude **twice** on the same thing | `/clear` + write a better prompt |
| Exploring a large codebase | Delegate to `Explore` subagent |
| Need a quick answer without filling context | `/btw what does X do?` |
| Claude is forgetting earlier instructions | Context is full — `/compact` or `/clear` |
| After `/compact` | Claude re-reads CLAUDE.md automatically |
| Want something to survive compaction | Add it to CLAUDE.md |

**Rule**: If you've corrected Claude more than twice in a row, don't try again. `/clear` and write a more precise initial prompt using what you learned.

---

## Writing Good Prompts

### Vague → Precise

| ❌ Vague | ✅ Precise |
|---|---|
| "Add tests for the service" | "Write JUnit 5 tests for `TransactionService.transfer()` covering: insufficient funds, fraud blocked, and happy path. Run them and fix failures." |
| "Fix the login bug" | "Users report 401 after token expiry. Check `AuthController` and `JwtFilter`. Write a test that reproduces the expired token case, then fix it." |
| "Create the transfer endpoint" | "Add `POST /api/v1/transactions/transfer` to `TransactionController`. Requires idempotency key header. Returns 202 Accepted. See @docs/02-api-contracts.md for conventions." |
| "Make the app look better" | "The dashboard balance card should use the PayPal blue gradient. See @docs/04-mobile-ux-guide.md for the exact colors. Take a screenshot after and compare it to the spec." |

### Reference Files Explicitly
```
"Look at how UserController handles pagination, then add the same to TransactionController."
"Follow the pattern in services/account-service/ to implement the card service."
```

### Give Claude a Verification Step
```
"Implement X. Then run `mvn test` and fix any failures before reporting done."
"Build the screen. Use the mobile-reviewer agent to check it against the UX guide."
```

---

## When to Use Each Feature

### CLAUDE.md
**Use when**: a fact or rule should apply in EVERY session.
- Build commands
- Architectural decisions
- Code style that differs from defaults
- "Always use BigDecimal for money"

### Rules (`.claude/rules/`)
**Use when**: a rule only applies to certain file types.
- Java-specific rules → paths: `services/**/*.java`
- React Native rules → paths: `mobile/**/*.tsx`

### Skills
**Use when**: you have a repeatable multi-step procedure.
- Scaffolding a new service
- Creating a migration
- Deploying to staging

### Subagents
**Use when**: a task would flood your context with files you won't reference again.
- Codebase exploration/research
- Code reviews (fresh context = unbiased review)
- Parallel independent work

### Hooks
**Use when**: something must ALWAYS happen with zero exceptions.
- Linting after every file edit
- Blocking rm -rf
- Logging all Bash commands

---

## Anti-Patterns to Avoid

### ❌ Kitchen Sink Sessions
Doing Task A, then an unrelated Task B in the same session. Context fills with irrelevant info.
✅ **Fix**: `/clear` between unrelated tasks.

### ❌ Correction Loop
Correcting Claude 3+ times in a row on the same issue.
✅ **Fix**: After 2 failed corrections, `/clear` + write a better prompt incorporating what you learned.

### ❌ Over-Stuffed CLAUDE.md
CLAUDE.md > 200 lines. Important rules get lost in the noise.
✅ **Fix**: Move procedures to skills. Move file-type rules to `.claude/rules/`. Prune anything Claude gets right without being told.

### ❌ No Verification Gate
Claude says "done" but you have no way to check if it really worked.
✅ **Fix**: Always give Claude a test to run, a build to check, or a screenshot to compare.

### ❌ Infinite Exploration
"Investigate everything about the codebase." Claude reads 100 files, filling context.
✅ **Fix**: Scope exploration narrowly. Or: "Use subagents to investigate X specifically."

---

## The Writer / Reviewer Pattern

Use two separate Claude sessions for higher quality:

**Session A (Writer)**:
```
"Implement the rate limiter for the transaction endpoint."
```

**Session B (Reviewer)** — fresh context, no bias:
```
"Review @services/transaction-service/src/main/java/.../RateLimiter.java
for edge cases, thread safety, and consistency with existing patterns.
Don't check style — check correctness only."
```

Then feed the review back to Session A.

---

## Parallel Work with Worktrees

For large features with independent parts:
```bash
# Terminal 1: Work on the backend
git worktree add ../bank-app-backend -b feature/card-service
cd ../bank-app-backend && claude

# Terminal 2: Work on the mobile screens (independently)
git worktree add ../bank-app-mobile -b feature/cards-mobile
cd ../bank-app-mobile && claude
```

Each Claude session has its own context, no collision between the two.

---

## Session Management

```bash
claude --continue           # Resume the last session
claude --resume             # Pick from a list of sessions
/rename card-service-impl   # Name the current session
```

**Treat sessions like branches**: each feature or workstream gets its own session.

---

## Keyboard Habits to Build

| Habit | When |
|---|---|
| `Esc` | The moment Claude goes off track |
| `Esc Esc` | Before reverting to a checkpoint |
| `/clear` | Between unrelated tasks (do it reflexively) |
| `Ctrl+G` in plan mode | Always review and edit the plan before implementing |

---

## Measuring Success

You're using Claude Code effectively when:
- You can walk away from a session and it finishes correctly
- Claude asks clarifying questions instead of guessing wrong
- Your CLAUDE.md gets shorter over time (not longer)
- Context fills slowly because you use subagents for exploration
- Every session has a verification step Claude can run itself
