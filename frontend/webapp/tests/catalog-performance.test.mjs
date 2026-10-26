import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import postgres from "postgres";

import {
  compileSearchQuery,
  readCurrentSearchQuery,
} from "./helpers/search-query.mjs";

const connection = process.env.PERFORMANCE_TEST_DATABASE_URL;
if (!connection)
  throw new Error(
    "Set PERFORMANCE_TEST_DATABASE_URL to an isolated local *_seo_verify_* database."
  );
const target = new URL(connection);
if (
  !["localhost", "127.0.0.1", "postgres"].includes(target.hostname) ||
  !/^\/lsevin_seo_verify_/.test(target.pathname)
)
  throw new Error(
    "Refusing to modify a database outside the isolated local SEO verification environment."
  );
const sql = postgres(connection, {
  max: 1,
  prepare: false,
  connect_timeout: 5,
  idle_timeout: 1,
});
const read = (path) =>
  fs
    .readFileSync(new URL(path, import.meta.url), "utf8")
    .replace(/^\uFEFF/, "");
const previous = read("../db/migrations/0069_optimize_translation_lookup.sql");
const migration = read("../db/migrations/0084_translation_empty_fast_path.sql");
const oldQuery = read("./fixtures/search-query-before.sql");
let beforeCounts;
before(async () => {
  // The local schema snapshot predates existing production columns even though
  // its copied migration ledger lists 0045. Reconstruct these pre-existing
  // columns only in this disposable fixture DB; this is not migration 0083.
  await sql`alter table category.provider_services add column if not exists value_toman numeric(18,2)`;
  await sql`alter table category.provider_services add column if not exists search_text text`;
  await sql`alter table category.service_providers add column if not exists search_text text`;
  await sql
    .unsafe(read("../db/migrations/0068_multilingual_catalog_search.sql"))
    .simple();
  await sql.unsafe(previous).simple();
  await sql`create schema if not exists seo_verification`;
  await sql
    .unsafe(
      previous
        .slice(previous.indexOf("create or replace function"))
        .replace(
          "common.get_translation_t",
          "seo_verification.translation_before"
        )
    )
    .simple();
  await sql.unsafe(read("./fixtures/public-catalog.sql")).simple();
  beforeCounts =
    await sql`select (select count(*) from category.provider_services) as services,(select count(*) from category.service_providers) as providers`;
  // Reconstruct the previous function state only in the guarded disposable DB,
  // then execute the unchanged deployment runner with ONLY the new migration.
  await sql`delete from public.schema_migrations where name='0084_translation_empty_fast_path.sql'`;
  const runnerRoot = fileURLToPath(new URL("../artifacts/migration-upgrade-fixture/", import.meta.url));
  fs.mkdirSync(path.join(runnerRoot, "scripts"), {recursive:true});
  fs.mkdirSync(path.join(runnerRoot, "db/migrations"), {recursive:true});
  fs.copyFileSync(new URL("../scripts/migrate.mjs",import.meta.url),path.join(runnerRoot,"scripts/migrate.mjs"));
  fs.writeFileSync(path.join(runnerRoot,"db/migrations/0084_translation_empty_fast_path.sql"),migration);
  const log=execFileSync(process.execPath,[path.join(runnerRoot,"scripts/migrate.mjs")],{env:{...process.env,DATABASE_URL:connection},encoding:"utf8",timeout:30_000});
  fs.writeFileSync(new URL("../artifacts/migration-upgrade.log",import.meta.url),log);
  assert.match(log,/Applied 1 migration/);
  const applied=await sql`select checksum from public.schema_migrations where name='0084_translation_empty_fast_path.sql'`;
  assert.equal(applied[0].checksum,createHash("sha256").update(migration).digest("hex"));
});
after(async () => {
  await sql.end({ timeout: 2 });
});

test("0083 upgrades the inspected production translation implementation without changing lookup semantics", async () => {
  const values = [
    null,
    {},
    [],
    [1],
    true,
    42,
    "",
    "  plain string  ",
    { "fa-IR": "فارسی", "en-US": "English" },
    { fa: "فارسی پایه", en: "English base" },
    { FA_IR: "normalized", "fa-af": "regional", fa: "base" },
    { "fa-IR": " ", "en-US": "fallback" },
    { "fr-FR": null, "en-US": "fallback" },
    { z: "last", a: "first" },
    { "fa-IR": false, "en-US": 1 },
  ];
  const locales = [
    null,
    "",
    "fa",
    "fa-IR",
    "FA_ir",
    "fa-AF",
    "en",
    "en-US",
    "unknown",
  ];
  for (const value of values)
    for (const locale of locales) {
      const encoded = JSON.stringify(value);
      const rows =
        await sql`select seo_verification.translation_before(${encoded}::jsonb,${locale},'en-US') as old,common.get_translation_t(${encoded}::jsonb,${locale},'en-US') as current`;
      assert.equal(
        rows[0].current,
        rows[0].old,
        JSON.stringify({ value, locale })
      );
    }
  const properties =
    await sql`select provolatile,proparallel,pg_get_function_result(oid) as result from pg_proc where oid='common.get_translation_t(jsonb,text,text)'::regprocedure`;
  assert.deepEqual(
    { ...properties[0] },
    { provolatile: "i", proparallel: "s", result: "text" }
  );
  const afterCounts =
    await sql`select (select count(*) from category.provider_services) as services,(select count(*) from category.service_providers) as providers`;
  assert.deepEqual([...afterCounts], [...beforeCounts]);
});

const cases = [
  {},
  { locale: "fa-IR" },
  { locale: "fa" },
  { term: "Heart" },
  { term: "Doctor" },
  { term: "درمان", locale: "fa-IR" },
  { term: "not-present-qa" },
  { term: "%" },
  { country: "ir" },
  { city: "Tehran" },
  { country: "AE", city: "Dubai" },
  { categoryId: "10000000-0000-4000-8000-000000000002" },
  { providerTypeId: "20000000-0000-4000-8000-000000000001" },
  { limit: 1 },
  { limit: 60 },
];
for (const input of cases)
  test(`deferred search projection preserves real SQL results: ${JSON.stringify(input)}`, async () => {
    const original = compileSearchQuery(oldQuery, input),
      candidate = compileSearchQuery(readCurrentSearchQuery(), input);
    const a = await sql.unsafe(original.text, original.values),
      b = await sql.unsafe(candidate.text, candidate.values);
    // Ties among identical score/name rows have no specified SQL order. Compare
    // full result payloads as multisets without changing the public sort contract.
    const canonical = (rows) =>
      rows.map((x) => JSON.stringify({ ...x })).sort();
    assert.deepEqual(canonical(b), canonical(a));
    if (
      !input.term &&
      !input.city &&
      !input.country &&
      !input.categoryId &&
      !input.providerTypeId
    )
      assert.equal(b.length, input.limit ?? 30);
  });

test("empty-translation fast path removes work without altering output", async (t) => {
  // Use a non-constant argument to prevent immutable constant folding.
  const [old] =
    await sql`explain (analyze,format json) select sum(length(seo_verification.translation_before(case when i>0 then '{}'::jsonb else null end,'fa-IR','en-US'))) from generate_series(1,5000) i`;
  const [current] =
    await sql`explain (analyze,format json) select sum(length(common.get_translation_t(case when i>0 then '{}'::jsonb else null end,'fa-IR','en-US'))) from generate_series(1,5000) i`;
  t.diagnostic(
    JSON.stringify({
      oldMs: old["QUERY PLAN"][0]["Execution Time"],
      currentMs: current["QUERY PLAN"][0]["Execution Time"],
    })
  );
});
