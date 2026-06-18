# Hooks — Complete Guide

## What Are Hooks?
Shell commands, HTTP endpoints, or LLM prompts that run **automatically** at specific points in Claude's workflow. Unlike CLAUDE.md (advisory), hooks are **deterministic** — they always run.

## Hook Event Types

### Session Events
| Event | When |
|---|---|
| `SessionStart` | Session begins or resumes |
| `SessionEnd` | Session terminates |

### Per-Turn Events
| Event | When |
|---|---|
| `UserPromptSubmit` | Before Claude processes your message |
| `Stop` | After Claude finishes responding |

### Tool Events (Most Useful)
| Event | When |
|---|---|
| `PreToolUse` | **Before** a tool runs — can block or modify |
| `PostToolUse` | **After** a tool succeeds |
| `PostToolUseFailure` | After a tool fails |

### File & Config Events
| Event | When |
|---|---|
| `CwdChanged` | Working directory changes |
| `FileChanged` | A watched file changes on disk |
| `InstructionsLoaded` | A CLAUDE.md or rules file loads |

---

## Hook Configuration

Hooks live in `.claude/settings.json`:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/lint-on-save.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "./.claude/hooks/validate-bash.sh"
          }
        ]
      }
    ]
  }
}
```

## Matcher Patterns
| Pattern | Matches |
|---|---|
| `"*"` or omit | All tool calls |
| `"Edit"` | Only Edit tool |
| `"Edit\|Write"` | Edit or Write tools |
| `"Bash(git *)"` | Bash calls starting with `git` |
| `"Bash(rm *)"` | Bash calls starting with `rm` |
| `"mcp__memory__.*"` | All tools from `memory` MCP server |

---

## Hook Types

### Command Hook
```json
{
  "type": "command",
  "command": "/path/to/script.sh",
  "timeout": 30,
  "async": false
}
```
The command receives the full context as **JSON on stdin**. It can block or modify the action via exit codes and JSON output.

### HTTP Hook
```json
{
  "type": "http",
  "url": "http://localhost:8080/hooks/validate",
  "headers": { "Authorization": "Bearer $MY_TOKEN" },
  "allowedEnvVars": ["MY_TOKEN"]
}
```

### Prompt Hook (LLM Decision)
```json
{
  "type": "prompt",
  "prompt": "Is this Bash command safe to run?\n\n$ARGUMENTS",
  "model": "claude-haiku-4-5-20251001"
}
```

---

## Exit Codes (Command Hooks)

| Exit Code | Meaning |
|---|---|
| `0` | Success — parse stdout for JSON output |
| `2` | **Block** — stderr is fed to Claude as an error; action is blocked |
| Other | Non-blocking error — stderr logged, action continues |

## Blocking an Action (Exit Code 2)
```bash
#!/bin/bash
COMMAND=$(cat | jq -r '.tool_input.command')

if echo "$COMMAND" | grep -qE '^rm -rf'; then
  echo "Blocked: rm -rf is not allowed. Use git to discard changes instead." >&2
  exit 2
fi

exit 0
```

## Modifying Tool Input (PreToolUse)
Return JSON from the hook to rewrite what Claude passes to the tool:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "updatedInput": {
      "command": "npm run lint --fix"
    }
  }
}
```

---

## Practical Hook Examples

### 1. Auto-lint after every file edit
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "npx eslint --fix \"${CLAUDE_PROJECT_DIR}/$(cat | jq -r '.tool_input.file_path')\"",
        "async": true
      }]
    }]
  }
}
```

### 2. Block writes to migration files
```bash
#!/bin/bash
# .claude/hooks/protect-migrations.sh
FILE=$(cat | jq -r '.tool_input.file_path // .tool_input.path // ""')

if echo "$FILE" | grep -q 'db/migration/V'; then
  echo "Blocked: Never edit existing migration files. Create a new version instead." >&2
  exit 2
fi
exit 0
```
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command", "command": ".claude/hooks/protect-migrations.sh" }]
    }]
  }
}
```

### 3. Run tests after service changes
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "if": "Edit(services/**/*.java)",
      "hooks": [{
        "type": "command",
        "command": "cd services && mvn test -pl $(dirname $(cat | jq -r '.tool_input.file_path') | cut -d'/' -f2)",
        "async": true
      }]
    }]
  }
}
```

### 4. Log all Bash commands
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{
        "type": "command",
        "command": "cat | jq -r '.tool_input.command' >> ~/.claude/bash-history.log && exit 0"
      }]
    }]
  }
}
```

---

## Environment Variables in Hooks

| Variable | Description |
|---|---|
| `CLAUDE_PROJECT_DIR` | Project root directory |
| `CLAUDE_PLUGIN_ROOT` | Plugin installation directory |
| `CLAUDE_ENV_FILE` | File for persisting env vars across hooks |
| `CLAUDE_EFFORT` | Current effort level (`low`/`medium`/`high`) |
| `CLAUDE_CODE_REMOTE` | Set to `"true"` in web environments |

## Disable Hooks
```json
{ "disableAllHooks": true }
```

## View Active Hooks
Run `/hooks` in Claude Code — shows all hooks with their source file.
