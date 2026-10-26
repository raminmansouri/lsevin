# Agent tooling

Tools that coding agents (and CI) use to build, test and operate this repo.
Required by CLAUDE.md §4.2: record every agent tool / testing dependency here,
with version, reason, install, config, verification and per-agent status.

Status values: `VERIFIED` (exercised in that environment), `CONFIGURED`
(registered, not exercised there), `NOT CONFIGURED`.

## Tools

### @playwright/test — persistent E2E suites

| | |
|---|---|
| Version | 1.56.1 (pinned in `frontend/webapp/package.json` + lockfile) |
| Why | Reproducible browser tests kept in the repo (CLAUDE.md §3) |
| Install | `cd frontend/webapp && pnpm install --frozen-lockfile && npx playwright install chrome` |
| Config | `frontend/webapp/playwright.tours.config.ts` (Tours, AT-01..AT-48 + responsive regression) |
| Database | `node scripts/tours-e2e-db.mjs` migrates `lsevin_tours_e2e` (local Postgres only) |
| Verify | `npx playwright test --config playwright.tours.config.ts --list` |
| Notes | Production-build runs: build with `AUTH_URL=APP_URL=http://127.0.0.2:3031`, `next start --port 3031`, then `TOURS_E2E_BASE_URL=http://127.0.0.2:3031` (a production build rejects `localhost` redirect origins). Success screenshots are attached via `testInfo.attach`; tags `@smoke` / `@regression` / `@critical` select suites (`--grep @critical`). |

### Playwright MCP — exploratory browser checks by agents

| | |
|---|---|
| Version | `@playwright/mcp` 0.0.82 (global npm install for Claude Code; Codex uses `npx @playwright/mcp@latest`) |
| Why | Agent-driven inspection of real pages (overflow, layout, console) — not a substitute for committed tests |
| Verify | `claude mcp list` → `playwright … ✔ Connected` |
| Artifacts | Save screenshots under `.playwright-mcp/qa/` (gitignored), never into the repo |

### keygen MCP — cryptographic secret generation

| | |
|---|---|
| Version | 1.0.0, zero dependencies, Node ≥ 18 (`node:crypto`) |
| Location | `C:\Users\Maham\.claude\mcp-servers\keygen\server.mjs` (per-machine; not in the repo) |
| Why | Agents need API keys / shared secrets (e.g. `TOURS_INTERNAL_API_KEY`) generated with a CSPRNG instead of invented strings |
| Tools | `generate_secret` (16–512 bytes, base64url/hex/base64, optional prefix), `generate_password`, `generate_uuid` |
| Install (Claude Code) | `claude mcp add --scope user keygen -- node <path>\server.mjs` |
| Install (Codex CLI) | `codex mcp add keygen -- node <path>\server.mjs` |
| Verify | `claude mcp get keygen` → `Status: ✔ Connected`; stdio smoke: send `initialize`, `tools/list`, `tools/call generate_secret` |
| Security | Values are only returned to the caller; nothing is logged or written. Never commit generated secrets — put them straight into the k8s secret / password manager. |

### postgres MCP — read-only production inspection

| | |
|---|---|
| Version | `@microsoft/postgres-mcp` via `npx` |
| Why | Read-only checks of production schema/data (migration level, enum values) |
| Rule | Query tool only; never used for writes. Production writes go through migrations. |

## Per-agent matrix (this workstation, 2026-10-22)

| Capability | Claude Code (CLI/VS Code) | Codex CLI 0.157.1 | CI (Jenkins) | Other machines / accounts |
|---|---|---|---|---|
| @playwright/test (repo) | VERIFIED | CONFIGURED (same repo deps) | NOT CONFIGURED — no Playwright stage in the Jenkins pipeline yet | NOT CONFIGURED |
| Playwright MCP | VERIFIED | CONFIGURED | n/a | NOT CONFIGURED |
| keygen MCP | VERIFIED (`✔ Connected`, stdio smoke passed) | CONFIGURED (`enabled`; not exercised from Codex) | n/a | NOT CONFIGURED — copy `server.mjs` and run the add command |
| postgres MCP | VERIFIED (read-only prod queries; `claude mcp list` health probe still reports a cold-start `Failed to connect`) | CONFIGURED | n/a | NOT CONFIGURED |
