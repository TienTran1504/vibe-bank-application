# Settings Reference

## File Locations & Precedence (Highest → Lowest)

| Scope | File | Overrides |
|---|---|---|
| 1. Managed (IT/admin) | `C:\Program Files\ClaudeCode\managed-settings.json` | Everything |
| 2. CLI flags | `--model`, `--permission-mode` | User + below |
| 3. Local | `.claude/settings.local.json` | Project + user |
| 4. Project | `.claude/settings.json` | User only |
| 5. User | `~/.claude/settings.json` | Nothing |

**Gitignore** `.claude/settings.local.json` (personal settings, don't commit).

---

## Key Settings (`settings.json`)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",

  // Model
  "model": "claude-sonnet-4-6",
  "availableModels": ["sonnet", "opus", "haiku"],

  // Features
  "autoMemoryEnabled": true,         // Claude saves learnings across sessions
  "autoCompactEnabled": true,        // Auto-compact when context fills
  "fileCheckpointingEnabled": true,  // /rewind checkpoints before each change
  "alwaysThinkingEnabled": false,    // Extended thinking by default

  // UI
  "editorMode": "normal",            // "normal" | "vim"
  "autoScrollEnabled": true,
  "showTurnDuration": true,

  // Permissions
  "permissions": {
    "allow": [
      "Bash(mvn *)",           // Allow all maven commands
      "Bash(npm *)",           // Allow all npm commands
      "Bash(git status)",      // Allow specific git commands
      "Bash(git log *)",
      "Bash(git diff *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Read(~/.zshrc)"         // Allow reading shell config
    ],
    "deny": [
      "Bash(rm -rf /)",        // Protect root
      "Bash(git push --force *)", // No force push
      "Read(.env*)"            // Never read env files
    ]
  }
}
```

---

## Permission Rule Syntax

```json
"Bash(git *)"                // All git subcommands
"Bash(npm run lint)"         // Exact command
"Bash(npm run test *)"       // npm test with any args
"Edit(src/**/*.ts)"          // Edit TypeScript files
"Read(~/.zshrc)"             // Read a specific file
"Read(.env*)"                // Read any .env file (use in deny)
"Write(./infra/**)"          // Write anywhere in infra/
```

---

## Environment Variables (for hooks / all sessions)

```json
{
  "env": {
    "JAVA_HOME": "C:/Program Files/Java/jdk-21",
    "ANDROID_HOME": "C:/Users/tdtien/AppData/Local/Android/Sdk",
    "NODE_ENV": "development"
  }
}
```

---

## Common Settings Patterns

### Development (permissive — local only in settings.local.json)
```json
{
  "permissions": {
    "allow": [
      "Bash(mvn *)",
      "Bash(npm *)",
      "Bash(docker-compose *)",
      "Bash(git *)"
    ]
  }
}
```

### Production CI (restrictive)
```json
{
  "permissions": {
    "allow": [
      "Bash(mvn test)",
      "Bash(mvn package -DskipTests)",
      "Bash(docker build *)",
      "Bash(docker push *)"
    ],
    "deny": [
      "Bash(rm *)",
      "Bash(git push *)"
    ]
  },
  "disableAllHooks": false
}
```

### Read-Only Audit Mode
```json
{
  "permissions": {
    "deny": ["Edit(*)", "Write(*)", "Bash(*)"]
  }
}
```

---

## Hooks Configuration

See `reference/hooks-guide.md` for full details.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/post-edit.sh",
            "timeout": 30,
            "async": true
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash(rm *)",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/confirm-rm.sh"
          }
        ]
      }
    ]
  }
}
```

---

## Auto Memory Settings

```json
{
  "autoMemoryEnabled": true,
  "autoMemoryDirectory": "~/.claude/projects/bank-app/memory"
}
```

Auto memory files: `~/.claude/projects/<project>/memory/MEMORY.md`
- First 200 lines loaded every session
- Topic files (e.g., `debugging.md`) loaded on demand
- Run `/memory` to browse and edit

## Disable Auto Updates (Stable Channel)

```json
{
  "autoUpdatesChannel": "stable"
}
```

---

## CLI Environment Variables

```bash
# Override model for one session
CLAUDE_MODEL=claude-opus-4-8 claude

# Disable auto memory globally
CLAUDE_CODE_DISABLE_AUTO_MEMORY=1 claude

# Use a specific settings file
claude --settings ./my-settings.json

# Non-interactive with permissions
claude -p "task" --allowedTools "Edit,Bash(mvn *)"
```
