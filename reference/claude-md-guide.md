# CLAUDE.md — Complete Guide

## What Is It?
A Markdown file Claude reads at the **start of every session**. It gives Claude persistent context without you re-explaining things each time.

## File Locations (Load Order)

| Location | Scope | Shared? |
|---|---|---|
| `C:\Program Files\ClaudeCode\CLAUDE.md` | All users on machine (IT) | Yes (managed) |
| `~/.claude/CLAUDE.md` | All your projects (personal) | No |
| `./CLAUDE.md` or `./.claude/CLAUDE.md` | This project (team) | Yes (git) |
| `./CLAUDE.local.md` | This project (personal) | No (gitignored) |

All discovered files are **concatenated** — they don't override each other.
Project-level files load after user-level (more specific = read last).

## When to Add Something
- Claude makes the **same mistake twice**
- You type the same **correction** that you typed last session
- A **new team member** would need this context to be productive
- Something Claude **can't figure out from reading the code**

## What to Include vs. Exclude

| ✅ Include | ❌ Exclude |
|---|---|
| Build commands (`mvn clean install`) | Things Claude can read from code |
| Code style rules that differ from defaults | Standard language conventions |
| Architecture decisions (e.g., saga pattern) | Long tutorials or API docs |
| Workflow steps ("run tests before commit") | File-by-file descriptions |
| Non-obvious gotchas or constraints | Info that changes frequently |
| Tool preferences (e.g., "use Lombok, not Guava") | Self-evident advice ("write clean code") |

## Size Rule
**Target under 200 lines**. Longer = Claude ignores your actual instructions.
- Move procedures to skills (`.claude/skills/`)
- Move file-type rules to `.claude/rules/`
- Move team procedures to `docs/`

## Imports
```markdown
# CLAUDE.md
See @README.md for project overview.
See @package.json for available npm commands.

# Pull in a shared doc section
@docs/00-architecture-overview.md
```
Imported files load at session start and count toward context.

## HTML Comments (Maintainer Notes)
```markdown
<!-- This section is for human maintainers — Claude never reads this -->
# Build Commands
- `mvn install`
```
HTML comments are stripped before being fed to Claude. Use them for notes to teammates.

## Path-Scoped Rules (`.claude/rules/`)
Instead of putting all rules in CLAUDE.md, break them into topic files:
```
.claude/rules/
├── java-spring.md          # Only loads when editing Java files
├── react-native.md         # Only loads when editing mobile code
├── security.md             # Loads for all code
└── kafka-events.md         # Only loads when editing Kafka code
```

Files with `paths` frontmatter only load when Claude works with matching files:
```markdown
---
paths:
  - "services/**/*.java"
---
# Java Rules
...
```

## Auto Memory
Claude automatically saves learnings across sessions to:
`~/.claude/projects/<project>/memory/MEMORY.md`

- Only first 200 lines load at session start
- Rest is in topic files (e.g., `debugging.md`)
- Run `/memory` to view and edit
- Say "remember that X" to trigger a save
- Say "add this to CLAUDE.md" to put it in the project file instead

## Debugging
If Claude isn't following CLAUDE.md:
1. Run `/memory` — verify the file is listed as loaded
2. Make instructions more specific ("2-space indent" not "format nicely")
3. Check for conflicting instructions across files
4. If it must happen every time, use a **hook** instead (hooks are enforced; CLAUDE.md is advisory)

## For Hooks That Must Always Run
CLAUDE.md tells Claude what to do. Hooks **force** it regardless of what Claude decides:
```json
// .claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command", "command": "npm run lint" }]
    }]
  }
}
```
