# Sub-Agents — Complete Guide

## What Are Subagents?
Specialized AI assistants that run in their **own context window** with custom prompts, tool access, and permissions. Use them when a side task would flood your main conversation with file contents you won't reference again.

## Built-In Subagents (Always Available)

| Agent | Model | Tools | When Used |
|---|---|---|---|
| `Explore` | Haiku (fast) | Read-only | Searching/understanding code — skips CLAUDE.md for speed |
| `Plan` | Inherits | Read-only | Gathering context in plan mode |
| `general-purpose` | Inherits | All | Complex multi-step tasks |
| `claude-code-guide` | Haiku | Web | Questions about Claude Code features |

## This Project's Custom Agents

| Agent | Model | Best For |
|---|---|---|
| `security-reviewer` | Opus | Reviewing auth, payment, and user-input code |
| `api-designer` | Sonnet | Designing or reviewing REST API endpoints |
| `db-reviewer` | Sonnet | DB schema, JPA entities, Flyway migrations |
| `mobile-reviewer` | Sonnet | React Native screens, UX compliance |

---

## Subagent File Format

```markdown
---
name: my-agent                    # Required: kebab-case, unique
description: When to use me       # Required: Claude reads this to decide when to delegate
tools: Read, Grep, Glob           # Optional: inherits all if omitted
model: sonnet                     # Optional: sonnet | opus | haiku | inherit
color: blue                       # Optional: visual indicator in UI
memory: project                   # Optional: persistent cross-session memory
permissionMode: auto              # Optional: default | auto | plan | bypassPermissions
maxTurns: 20                      # Optional: stop after N turns
isolation: worktree               # Optional: run in isolated git worktree
---

You are a [role]. When invoked, [what you do].

Check for:
1. ...
2. ...

Report: [what to output].
```

## File Locations & Priority

| Location | Scope | Priority |
|---|---|---|
| Managed settings | Organization | 1 (highest) |
| `--agents` CLI flag | Current session only | 2 |
| `.claude/agents/` | This project | 3 |
| `~/.claude/agents/` | All your projects | 4 |
| Plugin `agents/` | When plugin enabled | 5 (lowest) |

---

## How to Invoke

### Let Claude decide (automatic)
Write the description well — Claude reads it to decide when to delegate:
```
description: Reviews code for security vulnerabilities. Use proactively after writing auth or payment code.
```

### Explicit invocation
```
"Use the security-reviewer agent to check the AuthController changes."
"Use a subagent to investigate how our account service handles balance updates."
```

### Use `Explore` subagent for investigation
```
"Use subagents to investigate how session tokens are stored across the auth flow."
```
This keeps file exploration out of your main context window.

---

## Key Settings

### Model Selection
```yaml
model: haiku        # Fast, cheap — good for research/exploration
model: sonnet       # Balanced — good for most reviews
model: opus         # Most capable — use for security, architecture decisions
model: inherit      # Same as parent (default)
```

### Tool Restriction (Read-Only Reviewer)
```yaml
tools: Read, Grep, Glob, Bash   # Explicit allowlist
```
Or use `disallowedTools` to remove specific tools from all-inherited:
```yaml
disallowedTools: Edit, Write, Bash
```

### Persistent Memory
```yaml
memory: project   # Remembers across sessions — stored in ~/.claude/agent-memory/
memory: user      # User-scoped memory
```

### Isolated Worktree (Safe Experiments)
```yaml
isolation: worktree   # Runs in a temp git branch — no effect on your working tree
```

---

## Create a New Subagent
```bash
# Option 1: Interactive (recommended)
# In Claude Code: /agents → Library tab → Create new agent

# Option 2: Create the file manually
# .claude/agents/my-agent.md
```

After creating via file, **restart the session** to load it.
Agents created via `/agents` take effect immediately.

---

## When NOT to Use Subagents
- Writing a single function → handle in main session
- Simple test additions → handle in main session
- Quick one-liner fixes → handle in main session
- Tasks where you need to see Claude's full reasoning → handle in main session

## When TO Use Subagents
- Exploring many files (keeps context clean)
- Reviews that need fresh eyes (no bias from the implementation)
- Tasks with different tool needs than your main session
- Parallel independent work
- Long research tasks that would fill the context window
