#!/usr/bin/env node
/**
 * Prepares the local database used by the Tours E2E suite and the tours
 * integration tests.
 *
 *   node scripts/tours-e2e-db.mjs [--fresh] [--dump=<pg_dump -Fc file inside the container>]
 *
 * Without --fresh it only applies pending migrations (scripts/migrate.mjs) to
 * TOURS_E2E_DATABASE_URL, so repeated runs keep their data. With --fresh it
 * recreates the database from a production-equivalent baseline dump first
 * (docker exec into TOURS_E2E_PG_CONTAINER, default lsevin-dev-postgres-1).
 * Refuses to touch anything but localhost.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const url = new URL(process.env.TOURS_E2E_DATABASE_URL || "postgres://lsevin:lsevin@localhost:5432/lsevin_tours_e2e");
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname)) {
  console.error(`Refusing to prepare a non-local database (${url.hostname}).`);
  process.exit(1);
}
const dbName = url.pathname.slice(1);
const fresh = process.argv.includes("--fresh");
const dump = (process.argv.find((a) => a.startsWith("--dump=")) || "--dump=/tmp/prodlike_0077.dump").slice(7);
const container = process.env.TOURS_E2E_PG_CONTAINER || "lsevin-dev-postgres-1";

function run(cmd, args, env = {}) {
  const r = spawnSync(cmd, args, { stdio: "inherit", env: { ...process.env, MSYS_NO_PATHCONV: "1", ...env } });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

if (fresh) {
  if (!/^[a-z0-9_]+$/.test(dbName)) throw new Error("unsafe database name");
  run("docker", ["exec", container, "psql", "-U", url.username, "-d", "postgres", "-qc", `drop database if exists ${dbName} with (force)`]);
  run("docker", ["exec", container, "psql", "-U", url.username, "-d", "postgres", "-qc", `create database ${dbName}`]);
  run("docker", ["exec", container, "pg_restore", "-U", url.username, "-d", dbName, "--no-owner", dump]);
}
run(process.execPath, [path.join(appRoot, "scripts/migrate.mjs")], { DATABASE_URL: url.toString() });
console.log(`Tours E2E database ready: ${dbName}`);
