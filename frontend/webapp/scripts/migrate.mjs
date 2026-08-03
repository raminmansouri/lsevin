#!/usr/bin/env node
/**
 * SQL migration runner.
 *
 * The project has no ORM and no migration tool: schemas outside the four EF-owned
 * ones (identity/customer/category/common) were created by hand on the server, and
 * some tables are still created by `create table if not exists` at request time.
 * That is why nothing in the repo can recreate the database. This runner is the
 * first step out of that: from here on, every schema change is a numbered file in
 * db/migrations/ that is applied exactly once and recorded.
 *
 * Usage (from frontend/webapp):
 *   pnpm migrate            apply every pending migration
 *   pnpm migrate:status     show what is applied and what is pending
 *   pnpm migrate --dry-run  print the plan without touching the database
 *
 * DATABASE_URL is read from the environment, falling back to .env.local / .env
 * the same way `next dev` resolves it. Nothing here is ever run automatically —
 * deploys do not call it; a human does.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const postgres = require("postgres");

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS_DIR = path.join(APP_ROOT, "db", "migrations");

// A lock id unique to this project, so two runners (or a runner and a deploy)
// can never apply the same migration twice in parallel.
const ADVISORY_LOCK_ID = 8_142_337_015;

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const isStatus = args.has("--status");
const baselineArg = process.argv.find((a) => a.startsWith("--baseline="));
const baselineNames = baselineArg
  ? baselineArg.slice("--baseline=".length).split(",").map((x) => x.trim()).filter(Boolean)
  : [];

function readDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  for (const file of [".env.local", ".env"]) {
    const full = path.join(APP_ROOT, file);
    if (!fs.existsSync(full)) continue;
    const match = fs.readFileSync(full, "utf8").match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, "");
  }

  throw new Error("DATABASE_URL is not set (checked the environment, .env.local and .env).");
}

function loadMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort()
    .map((name) => {
      const sqlText = fs.readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
      return {
        name,
        sqlText,
        checksum: createHash("sha256").update(sqlText).digest("hex"),
        // CREATE INDEX CONCURRENTLY and a few other statements cannot run inside a
        // transaction block. Such a file opts out with this header directive and
        // takes responsibility for its own atomicity.
        noTransaction: /^--\s*migrate:no-transaction\s*$/m.test(sqlText),
      };
    });
}

async function ensureRegistry(sql) {
  await sql`
    create table if not exists public.schema_migrations (
      name        text        primary key,
      checksum    text        not null,
      applied_at  timestamptz not null default now(),
      duration_ms integer     not null
    )
  `;
}

async function main() {
  const migrations = loadMigrations();
  if (!migrations.length) {
    console.log("No migrations found in db/migrations.");
    return;
  }

  const sql = postgres(readDatabaseUrl(), {
    max: 1,
    prepare: false,
    connect_timeout: 15,
    idle_timeout: 10,
    onnotice: (notice) => console.log(`  notice: ${notice.message}`),
  });

  try {
    await ensureRegistry(sql);

    const applied = await sql`select name, checksum from public.schema_migrations`;
    const appliedByName = new Map(applied.map((row) => [row.name, row.checksum]));

    // A file that was already applied but has since been edited means the database
    // and the repo disagree about what actually ran. Refuse rather than guess.
    const drifted = migrations.filter(
      (m) => appliedByName.has(m.name) && appliedByName.get(m.name) !== m.checksum
    );
    if (drifted.length) {
      throw new Error(
        `These migrations were already applied but their contents changed:\n` +
          drifted.map((m) => `  - ${m.name}`).join("\n") +
          `\nWrite a new migration instead of editing an applied one.`
      );
    }

    const pending = migrations.filter((m) => !appliedByName.has(m.name));

    // Baseline: record a migration as applied without running it.
    //
    // Needed when a database already holds the objects a migration creates but has
    // no ledger row for it — the state production was left in. Re-running those
    // files is harmless for the `create ... if not exists` ones and actively wrong
    // for 0011, which posts opening-balance journal entries and would post them a
    // second time.
    if (baselineNames.length) {
      const unknown = baselineNames.filter((n) => !migrations.some((m) => m.name === n));
      if (unknown.length) {
        throw new Error(`Unknown migration(s): ${unknown.join(", ")}`);
      }
      for (const name of baselineNames) {
        const migration = migrations.find((m) => m.name === name);
        if (appliedByName.has(name)) {
          console.log(`already recorded  ${name}`);
          continue;
        }
        await sql`
          insert into public.schema_migrations (name, checksum, duration_ms)
          values (${migration.name}, ${migration.checksum}, 0)
        `;
        console.log(`baselined         ${name}`);
      }
      return;
    }

    if (isStatus) {
      for (const migration of migrations) {
        const mark = appliedByName.has(migration.name) ? "applied" : "pending";
        console.log(`${mark.padEnd(8)} ${migration.name}`);
      }
      return;
    }

    if (!pending.length) {
      console.log(`Up to date — ${migrations.length} migration(s) already applied.`);
      return;
    }

    console.log(`${pending.length} pending migration(s):`);
    for (const migration of pending) console.log(`  - ${migration.name}`);

    if (isDryRun) {
      console.log("\n--dry-run: nothing was executed.");
      return;
    }

    const [{ locked }] = await sql`select pg_try_advisory_lock(${ADVISORY_LOCK_ID}) as locked`;
    if (!locked) {
      throw new Error("Another migration run holds the advisory lock. Try again once it finishes.");
    }

    try {
      for (const migration of pending) {
        console.log(`\napplying ${migration.name}${migration.noTransaction ? " (no transaction)" : ""}`);
        const startedAt = Date.now();

        if (migration.noTransaction) {
          await sql.unsafe(migration.sqlText).simple();
          await sql`
            insert into public.schema_migrations (name, checksum, duration_ms)
            values (${migration.name}, ${migration.checksum}, ${Date.now() - startedAt})
          `;
        } else {
          await sql.begin(async (tx) => {
            await tx.unsafe(migration.sqlText).simple();
            await tx`
              insert into public.schema_migrations (name, checksum, duration_ms)
              values (${migration.name}, ${migration.checksum}, ${Date.now() - startedAt})
            `;
          });
        }

        console.log(`  done in ${Date.now() - startedAt}ms`);
      }
    } finally {
      await sql`select pg_advisory_unlock(${ADVISORY_LOCK_ID})`;
    }

    console.log(`\nApplied ${pending.length} migration(s).`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(`\nmigration failed: ${error.message}`);
  process.exit(1);
});
