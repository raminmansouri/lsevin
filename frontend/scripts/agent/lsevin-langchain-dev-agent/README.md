# LSevin LangChain Dev Agent

A local Python/LangChain developer agent for your LSevin booking system.

It uses:

- Local Ollama
- LangChain `create_agent`
- Custom guarded tools
- Source snapshots
- `database-schema.sql` context
- Manual feature mode
- Auto improvement mode
- Backups before file edits
- Check/fix loop through `pnpm lint`, `pnpm typecheck`, or your configured commands

## 1. Install

From this folder:

```powershell
py -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

Make sure Ollama is running:

```powershell
ollama serve
```

Pull a coding model, for example:

```powershell
ollama pull qwen2.5-coder:14b-instruct
```

You can also use other local models that support tool calling.

## 2. Configure

Copy the agent folder anywhere, then edit:

```text
lsevin-agent.config.yaml
```

Set your project root:

```yaml
project_root: "F:/workplace/lsevin/frontend/webapp"
```

Put this file in the project root:

```text
database-schema.sql
```

The agent will read it every run.

## 3. Manual mode

```powershell
python agent.py manual "add country then city lazy searchable filters to explore without breaking existing filters"
```

The agent will:

1. Create a source snapshot
2. Read project definition
3. Search files
4. Read relevant files
5. Apply exact patches
6. Run checks
7. Fix errors when possible
8. Write a run log

## 4. Auto mode

```powershell
python agent.py auto --iterations 3
```

Auto mode asks the model to find one small missing/safe improvement per iteration.

Recommended first auto tasks:

- Missing RTL/LTR fixes
- Missing next-intl keys
- Small validation improvements
- Low-risk provider/admin CRUD improvements
- Defensive error handling
- UI polish without DB changes

## 5. Pack only

```powershell
python agent.py pack
```

This creates a snapshot archive under:

```text
.lsevin-agent/snapshots
```

By default, it tries WinRAR first. If WinRAR is unavailable, it falls back to Python zip.

## 6. Safety model

The agent intentionally does **not** include dangerous tools like:

- delete file
- run arbitrary command
- database execute
- git reset
- git clean
- package install

Allowed commands are controlled by:

```yaml
allowed_command_prefixes:
  - "pnpm "
  - "npm "
  - "npx "
  - "git status"
  - "git diff"
```

## 7. Recommended workflow

Create a branch before using the agent:

```powershell
git checkout -b ai-agent-work
```

Run manual mode for one feature:

```powershell
python agent.py manual "implement the feature here"
```

Review:

```powershell
git diff
pnpm typecheck
pnpm lint
```

Commit only after reviewing the diff.

## 8. Notes

The archive is a safety snapshot. Ollama does not directly understand binary zip/rar files through normal chat APIs. The agent gives the model the schema, manifest, search results, and exact source files through controlled tools.
