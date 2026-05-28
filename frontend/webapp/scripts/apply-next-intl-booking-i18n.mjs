// scripts/apply-next-intl-booking-i18n.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const cwd = process.cwd();

const messagesArg = process.argv[2] || "./messages";
const patchDirArg = process.argv[3] || "./patch";

function resolveFromCwd(inputPath) {
  return path.isAbsolute(inputPath)
    ? path.normalize(inputPath)
    : path.resolve(cwd, inputPath);
}

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function deepMerge(target, source) {
  const output = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (isPlainObject(value) && isPlainObject(output[key])) {
      output[key] = deepMerge(output[key], value);
    } else {
      output[key] = value;
    }
  }

  return output;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

async function findPatchFile(fileName) {
  const explicitPatchDir = patchDirArg ? resolveFromCwd(patchDirArg) : null;

  const candidates = [
    explicitPatchDir ? path.join(explicitPatchDir, fileName) : null,

    // When patch files are placed beside this script:
    path.join(scriptDir, fileName),

    // When script is inside /scripts and patch files are one level above:
    path.join(scriptDir, "..", fileName),

    // When running from project root and patch files are in current folder:
    path.join(cwd, fileName),

    // When patch files are inside /scripts:
    path.join(cwd, "scripts", fileName),

    // When patch files are inside /messages:
    path.join(cwd, "messages", fileName),
  ].filter(Boolean);

  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (await fileExists(normalized)) {
      return normalized;
    }
  }

  throw new Error(
    `Missing patch file: ${fileName}\nChecked:\n${candidates
      .map((item) => `- ${path.normalize(item)}`)
      .join("\n")}`
  );
}

async function applyPatch(locale, patchFileName) {
  const messagesDir = resolveFromCwd(messagesArg);
  const targetFile = path.join(messagesDir, `${locale}.json`);

  if (!(await fileExists(targetFile))) {
    throw new Error(`Missing file: ${targetFile}`);
  }

  const patchFile = await findPatchFile(patchFileName);

  const existing = await readJson(targetFile);
  const patch = await readJson(patchFile);

  const merged = deepMerge(existing, patch);

  const backupFile = `${targetFile}.bak-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`;

  await fs.copyFile(targetFile, backupFile);
  await writeJson(targetFile, merged);

  console.log(`Updated: ${targetFile}`);
  console.log(`Backup:  ${backupFile}`);
  console.log(`Patch:   ${patchFile}`);
}

async function main() {
  console.log(`Working directory: ${cwd}`);
  console.log(`Script directory:  ${scriptDir}`);
  console.log(`Messages folder:   ${resolveFromCwd(messagesArg)}`);

  await applyPatch("en", "en.json");
  await applyPatch("fa", "fa.json");
  await applyPatch("ar", "ar.json");

  console.log("Done.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});