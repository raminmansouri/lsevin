import fs from "node:fs/promises";
import path from "node:path";
import { ChatOllama } from "@langchain/ollama";
import { z } from "zod";

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
}

const rootDir = process.cwd();
const srcDir = path.resolve(rootDir, getArg("src", "src"));
const messagesDir = path.resolve(rootDir, getArg("messages", "messages"));

const model = getArg("model", process.env.OLLAMA_MODEL || "qwen2.5-coder:14b");
const baseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

const limit = Number(getArg("limit", "0"));
const maxChars = Number(getArg("max-chars", "60000"));
const dryRun = args.includes("--dry-run");

const statePath = path.resolve(rootDir, ".next-intl-langchain-state.json");
const backupDir = path.resolve(rootDir, ".next-intl-langchain-backup");

const includeExtensions = new Set([".tsx", ".ts"]);

const excludeParts = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "coverage",
  "generated",
  ".turbo",
];

const excludeFiles = [
  ".d.ts",
  ".test.ts",
  ".test.tsx",
  ".spec.ts",
  ".spec.tsx",
];

const MessageValueSchema = z.object({
  en: z.string(),
  fa: z.string(),
});

const LocalizationResultSchema = z.object({
  changed: z.boolean(),
  source: z.string(),
  messages: z.record(z.string(), MessageValueSchema),
});

const llm = new ChatOllama({
  model,
  baseUrl,
  temperature: 0,
});

const structuredLlm = llm.withStructuredOutput(LocalizationResultSchema);

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback) {
  if (!(await exists(filePath))) return fallback;

  const raw = await fs.readFile(filePath, "utf8");

  if (!raw.trim()) return fallback;

  return JSON.parse(raw);
}

async function writeJson(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relative = path.relative(rootDir, fullPath).replaceAll("\\", "/");

    if (excludeParts.some((part) => relative.split("/").includes(part))) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name);
    if (!includeExtensions.has(ext)) continue;

    if (excludeFiles.some((suffix) => entry.name.endsWith(suffix))) continue;

    files.push(fullPath);
  }

  return files;
}

function namespaceFromFile(filePath) {
  const relative = path.relative(srcDir, filePath).replaceAll("\\", "/");

  return relative
    .replace(/\.(tsx|ts)$/i, "")
    .replaceAll("[", "")
    .replaceAll("]", "")
    .replaceAll("(", "")
    .replaceAll(")", "")
    .replace(/\/index$/, "")
    .replace(/[^a-zA-Z0-9/_-]/g, "")
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/[-_]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ""))
        .replace(/^\d+/, "")
    )
    .join(".");
}

function setDeep(obj, dottedPath, value) {
  const parts = dottedPath.split(".").filter(Boolean);
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];

    if (
      typeof current[key] !== "object" ||
      current[key] === null ||
      Array.isArray(current[key])
    ) {
      current[key] = {};
    }

    current = current[key];
  }

  current[parts[parts.length - 1]] = value;
}

async function backupFile(filePath) {
  const relative = path.relative(rootDir, filePath);
  const backupPath = path.join(backupDir, relative);

  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  await fs.copyFile(filePath, backupPath);
}

function buildPrompt({ relative, namespace, source }) {
  return `
You are converting one Next.js TypeScript/TSX source file to next-intl.

Return structured output matching the provided schema.

Your job:
1. Find user-visible hardcoded text.
2. Replace user-visible text with t("key") calls.
3. Return the complete updated file source.
4. Return English and Persian translations for every new key.
5. Do not change business logic.
6. Do not remove existing code.
7. Do not rewrite unrelated code.
8. Do not change imports except when needed for next-intl.
9. Do not introduce duplicate imports.
10. Preserve TypeScript and JSX validity.

Use this next-intl pattern when possible:

import { useTranslations } from "next-intl";

const t = useTranslations("${namespace}");

If the file already uses next-intl, extend the existing style instead of adding a duplicate pattern.

Use namespace:

${namespace}

Localize these:
- headings
- paragraphs
- button labels
- link labels
- menu labels
- placeholders
- labels
- aria-labels
- alt text
- toast messages
- validation messages
- empty states
- table headers
- tab labels
- card titles
- badge text

Do NOT localize these:
- import paths
- route paths
- URLs
- CSS class names
- Tailwind class names
- object keys used by APIs
- database column names
- enum values
- technical constants
- React component names
- TypeScript type names
- variable names
- console logs unless clearly shown to users

Important:
- Use short stable keys like "title", "submit", "emptyState", "searchPlaceholder".
- If duplicate keys would conflict, use more specific keys like "hero.title" or "filters.country".
- In JSX attributes, use t("key") correctly.
- In template strings, avoid unnecessary complexity.
- If text contains dynamic values, use next-intl interpolation.

File path:
${relative}

Original source:
${source}
`.trim();
}

async function processFile({ filePath, enMessages, faMessages, state }) {
  const relative = path.relative(rootDir, filePath).replaceAll("\\", "/");

  if (state.completed[relative]) {
    console.log(`SKIP completed: ${relative}`);
    return false;
  }

  console.log(`\nPROCESS: ${relative}`);

  const source = await fs.readFile(filePath, "utf8");

  if (source.length > maxChars) {
    const message = `File too large for one LLM call: ${source.length} chars. Max: ${maxChars}.`;

    console.log(`SKIP large: ${relative}`);

    state.failed[relative] = {
      error: message,
      failedAt: new Date().toISOString(),
    };

    await writeJson(statePath, state);
    return false;
  }

  const namespace = namespaceFromFile(filePath);

  const prompt = buildPrompt({
    relative,
    namespace,
    source,
  });

  try {
    const result = await structuredLlm.invoke(prompt);

    if (!result || typeof result.source !== "string") {
      throw new Error("Invalid LangChain result: missing source.");
    }

    if (!result.messages || typeof result.messages !== "object") {
      throw new Error("Invalid LangChain result: missing messages.");
    }

    if (dryRun) {
      console.log(`DRY RUN changed=${Boolean(result.changed)} namespace=${namespace}`);
      console.log("Message keys:", Object.keys(result.messages));
      return true;
    }

    await backupFile(filePath);

    if (result.changed) {
      await fs.writeFile(filePath, result.source, "utf8");
    }

    for (const [key, translations] of Object.entries(result.messages)) {
      if (!translations) continue;

      if (typeof translations.en === "string") {
        setDeep(enMessages, `${namespace}.${key}`, translations.en);
      }

      if (typeof translations.fa === "string") {
        setDeep(faMessages, `${namespace}.${key}`, translations.fa);
      }
    }

    state.completed[relative] = {
      namespace,
      changed: Boolean(result.changed),
      completedAt: new Date().toISOString(),
    };

    delete state.failed[relative];

    await writeJson(path.join(messagesDir, "en.json"), enMessages);
    await writeJson(path.join(messagesDir, "fa.json"), faMessages);
    await writeJson(statePath, state);

    console.log(`DONE: ${relative}`);
    return true;
  } catch (error) {
    console.error(`FAILED: ${relative}`);
    console.error(error.message);

    state.failed[relative] = {
      error: error.message,
      failedAt: new Date().toISOString(),
    };

    await writeJson(statePath, state);
    return false;
  }
}

async function main() {
  const state = await readJson(statePath, {
    completed: {},
    failed: {},
  });

  const enPath = path.join(messagesDir, "en.json");
  const faPath = path.join(messagesDir, "fa.json");

  const enMessages = await readJson(enPath, {});
  const faMessages = await readJson(faPath, {});

  const files = await walk(srcDir);

  console.log(`Model: ${model}`);
  console.log(`Ollama base URL: ${baseUrl}`);
  console.log(`Source dir: ${path.relative(rootDir, srcDir)}`);
  console.log(`Messages dir: ${path.relative(rootDir, messagesDir)}`);
  console.log(`Files found: ${files.length}`);
  console.log(`Dry run: ${dryRun ? "yes" : "no"}`);

  let processed = 0;

  for (const filePath of files) {
    if (limit > 0 && processed >= limit) break;

    const didProcess = await processFile({
      filePath,
      enMessages,
      faMessages,
      state,
    });

    if (didProcess) {
      processed++;
    }
  }

  console.log(`\nFinished.`);
  console.log(`Processed this run: ${processed}`);
  console.log(`State file: ${path.relative(rootDir, statePath)}`);
  console.log(`Backup dir: ${path.relative(rootDir, backupDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});