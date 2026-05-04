# LSevin Ollama Dev Agent

A local Windows-friendly developer agent for the LSevin booking system. It uses your local Ollama model, snapshots the TypeScript/TSX source, reads `database-schema.sql`, plans file reads, writes controlled full-file replacements, then runs validation commands.

## Install

Copy these files into your project root:

```text
lsevin-agent.config.json
scripts/lsevin-agent.mjs
```

Use Node.js 18+.

## Configure Ollama

Start Ollama and pull a coder model:

```powershell
ollama pull qwen2.5-coder:14b-instruct
ollama serve
```

Edit `lsevin-agent.config.json` if you use another model, for example:

```json
"model": "deepseek-coder-v2:16b"
```

## Export schema

Put your schema at project root as:

```text
database-schema.sql
```

Example PostgreSQL export:

```powershell
pg_dump --schema-only --no-owner --no-privileges -h localhost -U postgres -d lsevin > database-schema.sql
```

## Snapshot source

The config uses your WinRAR command:

```powershell
"C:\Program Files\WinRAR\WinRAR.exe" a -r .lsevin-agent\snapshots\ts-tsx-source.rar *.ts *.tsx -x*\node_modules\* -x*\.next\* -x*\dist\* -x*\build\* -x*\.git\*
```

Note: this creates a `.rar` archive. For an actual `.zip`, change the config command to:

```powershell
"C:\Program Files\WinRAR\WinRAR.exe" a -afzip -r .lsevin-agent\snapshots\ts-tsx-source.zip *.ts *.tsx -x*\node_modules\* -x*\.next\* -x*\dist\* -x*\build\* -x*\.git\*
```

## Manual mode

```powershell
node scripts/lsevin-agent.mjs manual "add country then city lazy searchable filters to explore without breaking existing filters"
```

Or interactive:

```powershell
node scripts/lsevin-agent.mjs manual
```

## Auto mode

```powershell
node scripts/lsevin-agent.mjs auto --iterations 3
```

Auto mode asks the model to pick one small missing improvement, implement it, run checks, and avoid repeating completed tasks from `.lsevin-agent/state.json`.

## Validation

Default checks:

```json
"checkCommands": [
  "pnpm lint",
  "pnpm typecheck"
]
```

Change them to match your project scripts. If your project has no `typecheck`, use:

```json
"checkCommands": [
  "pnpm lint",
  "pnpm build"
]
```

## Safety workflow

Use a separate branch:

```powershell
git checkout -b ai-agent-work
```

Review after every run:

```powershell
git diff
pnpm build
```

Backups are saved under `.lsevin-agent/backups` before each file overwrite.
