#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { execSync } from "node:child_process";

const DEFAULT_CONFIG = {
  projectRoot: ".",
  ollamaUrl: "http://localhost:11434",
  model: "qwen2.5-coder:14b-instruct",
  schemaPath: "database-schema.sql",
  archiveCommand:
    '"C:\\Program Files\\WinRAR\\WinRAR.exe" a -r .lsevin-agent\\snapshots\\ts-tsx-source.rar *.ts *.tsx -x*\\node_modules\\* -x*\\.next\\* -x*\\dist\\* -x*\\build\\* -x*\\.git\\*',
  allowedExtensions: [".ts", ".tsx", ".json", ".css", ".scss", ".sql", ".md", ".mjs", ".js"],
  sourceExtensions: [".ts", ".tsx"],
  excludeDirs: ["node_modules", ".next", "dist", "build", ".git", ".turbo", ".vercel", "coverage", ".lsevin-agent"],
  maxFilesToRead: 24,
  maxFileChars: 30000,
  maxSchemaChars: 160000,
  maxManifestFiles: 5000,
  fixAttempts: 2,
  checkCommands: ["pnpm lint", "pnpm typecheck"],
};

const SYSTEM_PROMPT = `You are the local senior full-stack developer agent for the LSevin booking system.

Project definition:
- LSevin is an international booking and health-mall platform, not only medical tourism.
- Users browse providers, services, categories, country/city discovery, maps, bookings, payments, support, media, profile, wallet, coupons, and medical files.
- Provider/admin panels manage CRUD data for provider pages, services, specialists, availability, media, pricing, bookings, refunds, commercial data, and support.
- The stack is Next.js App Router, TypeScript, postgres.js, server actions, next-intl, React components, and PostgreSQL.
- UI must stay premium, responsive, multilingual, RTL/LTR-safe, and production-ready.
- Prefer open/closed principle: extend with new helpers/components/repositories where safe; avoid rewriting existing working flows.
- Use existing conventions already present in the codebase.
- For localized names/descriptions, prefer existing LocalizedInputBridge and existing localization patterns when applicable.
- For Lexical descriptions, prefer hasLexicalContent and LexicalRenderer patterns already used in the project.
- For images, preserve existing ImageWithFallback and NEXT_PUBLIC_FILES_URL conventions.
- Database changes must match database-schema.sql and use postgres.js-safe parameter typing. Explicitly cast nullable parameters where PostgreSQL may not infer type.

Operational rules:
- Return machine-readable JSON only when asked for JSON. No markdown fences.
- Never invent files before requesting/reading relevant existing files.
- Only modify files necessary for the requested task.
- Never delete unrelated code, never revert unrelated user work, never mass-format the project.
- Avoid destructive commands. Do not propose git reset, rm -rf, migration drops, or data loss.
- All code must compile TypeScript and should be compatible with Next.js server/client component boundaries.
- Server actions must export async functions only.
- Do not pass functions directly from Server Components into Client Components.
- For lists, use stable unique keys; avoid duplicate row ids.
`;

function printUsage() {
  console.log(`
LSevin Ollama Dev Agent

Usage:
  node scripts/lsevin-agent.mjs pack
  node scripts/lsevin-agent.mjs manual "add country/city filters to explore"
  node scripts/lsevin-agent.mjs manual
  node scripts/lsevin-agent.mjs auto --iterations 3

Recommended:
  1) Run from your project root.
  2) Keep a clean git branch before auto mode.
  3) Put database-schema.sql in project root or update lsevin-agent.config.json.
`);
}

function loadConfig() {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "lsevin-agent.config.json");
  if (!fs.existsSync(configPath)) return { ...DEFAULT_CONFIG };
  const userConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return { ...DEFAULT_CONFIG, ...userConfig };
}

function resolveRoot(config) {
  return path.resolve(process.cwd(), config.projectRoot || ".");
}

function ensureDirs(root) {
  for (const dir of [".lsevin-agent", ".lsevin-agent/snapshots", ".lsevin-agent/backups", ".lsevin-agent/logs"]) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
  }
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function isExcluded(rel, config) {
  const parts = toPosix(rel).split("/");
  return parts.some((part) => config.excludeDirs.includes(part));
}

function isAllowedFile(rel, config) {
  return config.allowedExtensions.includes(path.extname(rel));
}

function walkFiles(root, config, dir = root, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(root, full);
    if (isExcluded(rel, config)) continue;
    if (entry.isDirectory()) {
      walkFiles(root, config, full, out);
    } else if (entry.isFile() && isAllowedFile(rel, config)) {
      out.push(toPosix(rel));
    }
  }
  return out;
}

function readTextFile(root, rel, maxChars) {
  const full = path.resolve(root, rel);
  if (!full.startsWith(root)) throw new Error(`Unsafe path outside project: ${rel}`);
  if (!fs.existsSync(full)) throw new Error(`File does not exist: ${rel}`);
  const text = fs.readFileSync(full, "utf8");
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n\n/* TRUNCATED: file has ${text.length} chars; ask for a narrower file section or inspect manually. */`;
}

function buildManifest(root, config) {
  const files = walkFiles(root, config).sort();
  const manifestRows = files.slice(0, config.maxManifestFiles).map((rel) => {
    const stat = fs.statSync(path.join(root, rel));
    return `${rel} (${stat.size} bytes)`;
  });
  if (files.length > config.maxManifestFiles) {
    manifestRows.push(`... ${files.length - config.maxManifestFiles} more files omitted from manifest`);
  }
  return { files, text: manifestRows.join("\n") };
}

function readSchema(root, config) {
  const schemaPath = path.resolve(root, config.schemaPath);
  if (!fs.existsSync(schemaPath)) {
    return `database-schema.sql not found at ${config.schemaPath}. Ask user to export/copy it, or continue only if schema is not needed.`;
  }
  const schema = fs.readFileSync(schemaPath, "utf8");
  if (schema.length <= config.maxSchemaChars) return schema;
  return `${schema.slice(0, config.maxSchemaChars)}\n\n/* TRUNCATED schema: ${schema.length} chars total. Use schemaPath locally for exact database structure. */`;
}

function loadState(root) {
  const statePath = path.join(root, ".lsevin-agent/state.json");
  if (!fs.existsSync(statePath)) {
    return { completedTasks: [], changedFiles: [], runs: [] };
  }
  return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

function saveState(root, state) {
  fs.writeFileSync(path.join(root, ".lsevin-agent/state.json"), JSON.stringify(state, null, 2), "utf8");
}

function runArchive(root, config) {
  ensureDirs(root);
  if (!config.archiveCommand) return { ok: false, output: "archiveCommand is empty" };
  try {
    const output = execSync(config.archiveCommand, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      output: `${error.stdout || ""}\n${error.stderr || ""}\n${error.message}`.trim(),
    };
  }
}

async function callOllama(config, messages, options = {}) {
  const response = await fetch(`${config.ollamaUrl.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model,
      stream: false,
      messages,
      options: {
        temperature: options.temperature ?? 0.15,
        num_ctx: options.num_ctx ?? 32768,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Ollama HTTP ${response.status}: ${text}`);
  }

  const json = await response.json();
  return json?.message?.content || "";
}

function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return JSON.parse(fenced[1].trim());

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) return JSON.parse(trimmed.slice(first, last + 1));

  throw new Error(`Model did not return parseable JSON. Raw output:\n${text}`);
}

function validateRelPath(root, rel, config) {
  if (!rel || typeof rel !== "string") throw new Error("Invalid empty path");
  const normalized = toPosix(path.normalize(rel));
  if (normalized.startsWith("../") || path.isAbsolute(normalized)) {
    throw new Error(`Unsafe path: ${rel}`);
  }
  const full = path.resolve(root, normalized);
  if (!full.startsWith(root)) throw new Error(`Unsafe path outside project: ${rel}`);
  if (!isAllowedFile(normalized, config)) throw new Error(`Extension not allowed for ${rel}`);
  if (isExcluded(normalized, config)) throw new Error(`Path is excluded: ${rel}`);
  return normalized;
}

function backupFile(root, rel) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return null;
  const backupRoot = path.join(root, ".lsevin-agent/backups", nowStamp());
  const backupPath = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(full, backupPath);
  return path.relative(root, backupPath);
}

function applyChanges(root, config, changes) {
  if (!Array.isArray(changes)) throw new Error("changes must be an array");
  const applied = [];

  for (const change of changes) {
    const rel = validateRelPath(root, change.path, config);
    if (typeof change.content !== "string") {
      throw new Error(`Change for ${rel} must include full string content`);
    }
    const backup = backupFile(root, rel);
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, change.content.replace(/\r\n/g, "\n"), "utf8");
    applied.push({ path: rel, backup });
  }

  return applied;
}

function runChecks(root, config) {
  const results = [];
  for (const command of config.checkCommands || []) {
    try {
      const output = execSync(command, {
        cwd: root,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        shell: true,
        timeout: 1000 * 60 * 10,
      });
      results.push({ command, ok: true, output: output.slice(-12000) });
    } catch (error) {
      results.push({
        command,
        ok: false,
        output: `${error.stdout || ""}\n${error.stderr || ""}\n${error.message}`.trim().slice(-20000),
      });
      break;
    }
  }
  return results;
}

function checksOk(results) {
  return results.every((r) => r.ok);
}

function buildContext(root, config) {
  ensureDirs(root);
  const archive = runArchive(root, config);
  const manifest = buildManifest(root, config);
  const schema = readSchema(root, config);
  const state = loadState(root);
  return { archive, manifest, schema, state };
}

async function askForFiles(config, context, userTask, mode) {
  const recentTasks = (context.state.completedTasks || []).slice(-20).map((t) => `- ${t.summary || t.task}`).join("\n");
  const prompt = `Mode: ${mode}

User task or auto instruction:
${userTask}

Recent completed tasks to avoid repeating:
${recentTasks || "none"}

Available file manifest:
${context.manifest.text}

Database schema:
${context.schema}

Return JSON only with this shape:
{
  "taskSummary": "short precise task you will implement",
  "reason": "why these files are needed",
  "filesToRead": ["relative/path.tsx", "relative/path.ts"]
}

Choose only the minimum files required. Maximum ${config.maxFilesToRead} files. If you need a file not in the manifest, explain in reason but do not invent content.`;

  const raw = await callOllama(config, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);
  const json = extractJson(raw);
  json.filesToRead = Array.isArray(json.filesToRead) ? json.filesToRead.slice(0, config.maxFilesToRead) : [];
  return json;
}

function readRequestedFiles(root, config, filesToRead) {
  const unique = [...new Set(filesToRead || [])];
  const blocks = [];
  for (const requested of unique) {
    const rel = validateRelPath(root, requested, config);
    if (!fs.existsSync(path.join(root, rel))) {
      blocks.push(`--- FILE: ${rel}\n/* MISSING FILE */`);
      continue;
    }
    const content = readTextFile(root, rel, config.maxFileChars);
    blocks.push(`--- FILE: ${rel}\n${content}`);
  }
  return blocks.join("\n\n");
}

async function askForImplementation(config, context, task, filePlan, fileContents) {
  const prompt = `Implement the task below using the provided files. Return JSON only.

Task:
${task}

Planned summary:
${filePlan.taskSummary || ""}

Database schema:
${context.schema}

Files:
${fileContents}

Return JSON only with this exact shape:
{
  "summary": "what you changed",
  "changes": [
    {
      "path": "relative/path.tsx",
      "content": "FULL final file content, not a diff"
    }
  ],
  "notes": ["manual follow-up note if any"]
}

Rules:
- Include FULL file content for every changed file.
- Do not include unchanged files.
- Do not use markdown fences.
- Do not modify unrelated code.
- Preserve imports, exports, server/client boundaries, and existing behavior.
- If database schema is insufficient, return an empty changes array and explain in notes.`;

  const raw = await callOllama(config, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);
  return extractJson(raw);
}

async function askForFix(config, context, task, changedFilesText, checkResults) {
  const errors = checkResults.map((r) => `COMMAND: ${r.command}\nOK: ${r.ok}\nOUTPUT:\n${r.output}`).join("\n\n");
  const prompt = `The previous implementation failed checks. Fix only the changed files. Return JSON only.

Original task:
${task}

Database schema:
${context.schema}

Changed files current content:
${changedFilesText}

Check output:
${errors}

Return JSON only:
{
  "summary": "fix summary",
  "changes": [
    { "path": "relative/path.tsx", "content": "FULL final file content" }
  ],
  "notes": []
}`;

  const raw = await callOllama(config, [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ]);
  return extractJson(raw);
}

function recordRun(root, state, run) {
  state.runs = state.runs || [];
  state.runs.push(run);
  state.runs = state.runs.slice(-100);
  if (run.ok) {
    state.completedTasks = state.completedTasks || [];
    state.completedTasks.push({ at: run.at, task: run.task, summary: run.summary });
    state.completedTasks = state.completedTasks.slice(-100);
  }
  state.changedFiles = [...new Set([...(state.changedFiles || []), ...(run.changedFiles || [])])].slice(-1000);
  saveState(root, state);
}

async function executeTask(root, config, userTask, mode) {
  console.log(`\n=== LSevin agent: ${mode} ===`);
  const context = buildContext(root, config);
  console.log(context.archive.ok ? "Snapshot archive created." : `Snapshot archive failed: ${context.archive.output}`);

  const filePlan = await askForFiles(config, context, userTask, mode);
  console.log(`Task: ${filePlan.taskSummary || userTask}`);
  console.log(`Reading ${filePlan.filesToRead.length} files...`);

  const fileContents = readRequestedFiles(root, config, filePlan.filesToRead);
  const implementation = await askForImplementation(config, context, userTask, filePlan, fileContents);

  if (!implementation.changes?.length) {
    console.log("Model returned no changes.");
    console.log((implementation.notes || []).join("\n"));
    return { ok: false, summary: implementation.summary || "No changes", changedFiles: [] };
  }

  let applied = applyChanges(root, config, implementation.changes);
  console.log(`Applied ${applied.length} file change(s).`);

  let checkResults = runChecks(root, config);
  for (const result of checkResults) {
    console.log(`${result.ok ? "PASS" : "FAIL"}: ${result.command}`);
    if (!result.ok) console.log(result.output);
  }

  let attempts = 0;
  while (!checksOk(checkResults) && attempts < config.fixAttempts) {
    attempts += 1;
    console.log(`Fix attempt ${attempts}/${config.fixAttempts}...`);
    const changedPaths = [...new Set(applied.map((a) => a.path))];
    const changedText = readRequestedFiles(root, config, changedPaths);
    const fix = await askForFix(config, context, userTask, changedText, checkResults);
    if (!fix.changes?.length) break;
    applied = [...applied, ...applyChanges(root, config, fix.changes)];
    checkResults = runChecks(root, config);
    for (const result of checkResults) {
      console.log(`${result.ok ? "PASS" : "FAIL"}: ${result.command}`);
      if (!result.ok) console.log(result.output);
    }
  }

  const changedFiles = [...new Set(applied.map((a) => a.path))];
  const ok = checksOk(checkResults);
  const state = loadState(root);
  const run = {
    at: new Date().toISOString(),
    mode,
    task: userTask,
    summary: implementation.summary,
    ok,
    changedFiles,
    checks: checkResults.map((r) => ({ command: r.command, ok: r.ok })),
  };
  recordRun(root, state, run);
  fs.writeFileSync(path.join(root, ".lsevin-agent/logs", `${nowStamp()}-${mode}.json`), JSON.stringify(run, null, 2), "utf8");

  console.log(ok ? "Done. Checks passed." : "Done with errors. Review output and git diff.");
  console.log(`Changed files:\n${changedFiles.map((f) => `- ${f}`).join("\n")}`);
  return run;
}

async function manual(root, config, args) {
  let task = args.join(" ").trim();
  if (!task) {
    const rl = readline.createInterface({ input, output });
    task = (await rl.question("Feature/fix request: ")).trim();
    rl.close();
  }
  if (!task) throw new Error("Empty manual task.");
  await executeTask(root, config, task, "manual");
}

async function auto(root, config, args) {
  const idx = args.indexOf("--iterations");
  const iterations = idx >= 0 ? Math.max(1, Number(args[idx + 1] || 1)) : 1;
  for (let i = 0; i < iterations; i += 1) {
    const context = buildContext(root, config);
    const autoPrompt = `Analyze the LSevin booking system file manifest, database schema, and recent completed tasks. Choose exactly one small, safe, high-value missing feature, bug fix, or production hardening improvement. Avoid repeating completed tasks. Prefer changes that can be validated by TypeScript/lint. Return a file-read plan for that one task.`;
    const filePlan = await askForFiles(config, context, autoPrompt, "auto-planning");
    const task = filePlan.taskSummary || autoPrompt;
    console.log(`\nAuto iteration ${i + 1}/${iterations}: ${task}`);
    await executeTask(root, config, task, "auto");
  }
}

async function pack(root, config) {
  const archive = runArchive(root, config);
  console.log(archive.ok ? "Snapshot archive created." : `Snapshot archive failed:\n${archive.output}`);
  const schemaFull = path.resolve(root, config.schemaPath);
  console.log(fs.existsSync(schemaFull) ? `Schema found: ${schemaFull}` : `Schema missing: ${schemaFull}`);
}

async function main() {
  const config = loadConfig();
  const root = resolveRoot(config);
  ensureDirs(root);
  const [command, ...args] = process.argv.slice(2);

  if (!command || ["-h", "--help", "help"].includes(command)) {
    printUsage();
    return;
  }

  if (command === "pack") return pack(root, config);
  if (command === "manual") return manual(root, config, args);
  if (command === "auto") return auto(root, config, args);

  printUsage();
  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`\nAgent failed: ${error.message}`);
  process.exitCode = 1;
});
