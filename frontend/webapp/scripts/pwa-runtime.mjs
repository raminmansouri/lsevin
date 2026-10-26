// Reproduce the standalone Docker layout for local release verification.
import { spawn } from "node:child_process";
import { cp, readdir, readlink, stat, symlink, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const standalone = new URL(".next/standalone/", root);
await stat(new URL("server.js", standalone));
// Next's Windows tracer can emit file-typed symlinks for directory packages.
// POSIX accepts those; Windows cannot traverse them (EPERM). Normalize only
// generated links whose paths AND targets stay inside this standalone artifact.
if (process.platform === "win32") {
  const artifactRoot = path.resolve(fileURLToPath(standalone));
  const inside = (value) =>
    path.resolve(value).startsWith(artifactRoot + path.sep);
  const normalizeDirectoryLinks = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) {
        const target = path.resolve(directory, await readlink(filename));
        if (!inside(filename) || !inside(target)) continue;
        let targetInfo;
        try {
          targetInfo = await stat(target);
        } catch {
          continue;
        }
        if (!targetInfo.isDirectory()) continue;
        try {
          await stat(filename);
        } catch (error) {
          if (error.code !== "EPERM") throw error;
          await unlink(filename); // Remove the generated link, never its target.
          await symlink(target, filename, "junction");
        }
      } else if (entry.isDirectory() && entry.name.startsWith("@")) {
        await normalizeDirectoryLinks(filename);
      } else if (entry.isDirectory() && entry.name === ".pnpm") {
        // Links live at the package node_modules level. Do not traverse each
        // library's dist/source tree while preparing the generated artifact.
        for (const version of await readdir(filename, {
          withFileTypes: true,
        })) {
          if (!version.isDirectory()) continue;
          const dependencyDirectory =
            version.name === "node_modules"
              ? path.join(filename, version.name)
              : path.join(filename, version.name, "node_modules");
          try {
            await stat(dependencyDirectory);
          } catch {
            continue;
          }
          await normalizeDirectoryLinks(dependencyDirectory);
        }
      }
    }
  };
  await normalizeDirectoryLinks(path.join(artifactRoot, "node_modules"));
}
await cp(
  fileURLToPath(new URL("public/", root)),
  fileURLToPath(new URL("public/", standalone)),
  { recursive: true }
);
await cp(
  fileURLToPath(new URL(".next/static/", root)),
  fileURLToPath(new URL(".next/static/", standalone)),
  { recursive: true }
);
try {
  process.loadEnvFile(fileURLToPath(new URL(".env.local", root)));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const child = spawn(
  process.execPath,
  [fileURLToPath(new URL("server.js", standalone))],
  {
    cwd: fileURLToPath(standalone),
    stdio: "inherit",
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: process.env.PORT || "3188",
      HOSTNAME: "127.0.0.1",
    },
  }
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("error", (error) => {
  console.error(error.name);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
