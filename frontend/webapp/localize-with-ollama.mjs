import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
}

const rootDir = process.cwd();
const srcDir = path.resolve(rootDir, getArg("src", "src"));
const messagesDir = path.resolve(rootDir, getArg("messages", "messages"));
const model = getArg("model", process.env.OLLAMA_MODEL || "qwen2.5-coder:14b");
const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434/api/chat";
const limit = Number(getArg("limit", "0"));
const dryRun = args.includes("--dry-run");

const statePath = path.resolve(rootDir, ".next-intl-ollama-state.json");
const backupDir = path.resolve(rootDir, ".next-intl-ollama-backup");

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

function extractJson(text) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {}

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    return JSON.parse(fenced[1]);
  }

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");

  if (first >= 0 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1));
  }

  throw new Error("Ollama response did not contain valid JSON.");
}

function buildPrompt({ filePath, namespace, source }) {
  return `
You are modifying a Next.js TypeScript/TSX file to use next-intl.

Task:
1. Convert user-visible hardcoded text in this file into t("key") calls.
2. Return the fully updated file source.
3. Return English and Persian messages for the extracted text.
4. Do not change business logic.
5. Do not remove existing imports, components, props, types, validation, or styling.
6. Do not localize:
   - import paths
   - className strings
   - CSS values
   - object keys used by APIs
   - database field names
   - route paths
   - URLs
   - console logs unless clearly user-facing
   - enum values
   - technical constants
7. Do localize:
   - button labels
   - headings
   - paragraphs
   - placeholders
   - aria-labels
   - alt text
   - toast messages
   - validation messages
   - empty states
   - table headers
   - tab labels
   - form labels
8. Use namespace: "${namespace}".
9. Prefer next-intl standard usage:
   - For Client Components or normal React components: import {useTranslations} from "next-intl"; and use const t = useTranslations("${namespace}");
   - If the file already uses next-intl, extend the existing pattern.
   - Do not introduce duplicate imports.
10. Keep JSX structure valid.
11. Preserve formatting as much as possible.

Return ONLY valid JSON with this exact shape:

{
  "changed": true,
  "source": "full updated source code here",
  "messages": {
    "some.key": {
      "en": "English text",
      "fa": "Persian translation"
    }
  }
}

If there is nothing user-facing to translate, return:

{
  "changed": false,
  "source": "original source code here",
  "messages": {}
}

File path:
${filePath}

Source:
${source}
`.trim();
}

async function callOllama(prompt) {
  const response = await fetch(ollamaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      options: {
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.message?.content || "";
}

async function backupFile(filePath) {
  const relative = path.relative(rootDir, filePath);
  const backupPath = path.join(backupDir, relative);
  await fs.mkdir(path.dirname(backupPath), { recursive: true });
  await fs.copyFile(filePath, backupPath);
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

  let processed = 0;

  for (const filePath of files) {
    const relative = path.relative(rootDir, filePath).replaceAll("\\", "/");

    if (state.completed[relative]) {
      console.log(`SKIP completed: ${relative}`);
      continue;
    }

    if (limit > 0 && processed >= limit) break;

    console.log(`\nPROCESS: ${relative}`);

    const source = await fs.readFile(filePath, "utf8");
    const namespace = namespaceFromFile(filePath);

    const prompt = buildPrompt({
      filePath: relative,
      namespace,
      source,
    });

    try {
      const raw = await callOllama(prompt);
      const result = extractJson(raw);

      if (typeof result.source !== "string") {
        throw new Error("Invalid Ollama result: source is missing.");
      }

      if (!result.messages || typeof result.messages !== "object") {
        throw new Error("Invalid Ollama result: messages is missing.");
      }

      if (dryRun) {
        console.log(`DRY RUN changed=${Boolean(result.changed)} namespace=${namespace}`);
        console.log(Object.keys(result.messages));
      } else {
        await backupFile(filePath);

        if (result.changed) {
          await fs.writeFile(filePath, result.source, "utf8");
        }

        for (const [key, translations] of Object.entries(result.messages)) {
          if (!translations || typeof translations !== "object") continue;

          const en = translations.en;
          const fa = translations.fa;

          if (typeof en === "string") {
            setDeep(enMessages, `${namespace}.${key}`, en);
          }

          if (typeof fa === "string") {
            setDeep(faMessages, `${namespace}.${key}`, fa);
          }
        }

        await writeJson(enPath, enMessages);
        await writeJson(faPath, faMessages);

        state.completed[relative] = {
          namespace,
          changed: Boolean(result.changed),
          completedAt: new Date().toISOString(),
        };

        delete state.failed[relative];

        await writeJson(statePath, state);
      }

      processed++;
      console.log(`DONE: ${relative}`);
    } catch (error) {
      console.error(`FAILED: ${relative}`);
      console.error(error.message);

      state.failed[relative] = {
        error: error.message,
        failedAt: new Date().toISOString(),
      };

      await writeJson(statePath, state);
    }
  }

  console.log(`\nFinished. Processed ${processed} file(s).`);
  console.log(`State file: ${path.relative(rootDir, statePath)}`);
  console.log(`Backup dir: ${path.relative(rootDir, backupDir)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});