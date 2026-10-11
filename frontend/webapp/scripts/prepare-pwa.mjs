import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

// Give every worker/shell revision its own atomic cache. Unchanged builds keep
// the same cache and do not trigger an unnecessary update prompt.
const publicRoot = new URL("../public/", import.meta.url);
const workerURL = new URL("sw.js", publicRoot);
const worker = await readFile(workerURL, "utf8");
const versionPattern = /const VERSION = "[^"]+";/;
if (!versionPattern.test(worker))
  throw new Error("PWA worker version marker is missing.");
const hash = createHash("sha256");
hash.update(worker.replace(versionPattern, 'const VERSION = "generated";'));
for (const path of [
  "offline.html",
  "pwa/offline.js",
  "pwa/offline.css",
  "pwa/profile-crypto.js",
  "pwa/icon-192.png",
  "pwa/icon-512.png",
  "pwa/apple-touch-icon.png",
]) {
  hash.update(path);
  hash.update(await readFile(new URL(path, publicRoot)));
}
const version = `v1-${hash.digest("hex").slice(0, 16)}`;
const prepared = worker.replace(
  versionPattern,
  `const VERSION = "${version}";`
);
if (prepared !== worker) await writeFile(workerURL, prepared);
console.log(`PWA cache revision: ${version}`);
