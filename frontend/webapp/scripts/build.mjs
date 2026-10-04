import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const mode = process.argv[2] || "production";
if (!new Set(["production", "fast"]).has(mode)) {
  console.error(`Unsupported build mode "${mode}". Expected "production" or "fast".`);
  process.exit(2);
}

const nextBin = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
console.log(`Building Next.js in ${mode} mode.`);
const result = spawnSync(process.execPath, [nextBin, "build"], {
  stdio: "inherit",
  env: { ...process.env, BUILD_MODE: mode },
});

process.exit(result.status ?? 1);
