import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const migration = readFileSync(
  fileURLToPath(new URL('../db/migrations/0092_public_url_slug_backfill.sql', import.meta.url)),
  'utf8',
);

const expected = new Map([
  ['category.service_providers', 186],
  ['category.provider_types', 12],
  ['category.provider_services', 3065],
  ['category.staff', 304],
  ['marketing.special_packages', 3],
]);

test('approved public slug mapping has one lowercase, descriptive slug per entity', () => {
  const groups = new Map([...expected.keys()].map((table) => [table, []]));
  const statements = migration.matchAll(/update (\w+\.\w+) as target set slug = source\.slug\s+from \(values([\s\S]*?)\) as source\(id, slug\)/g);

  for (const [, table, values] of statements) {
    assert.ok(groups.has(table), `unexpected table ${table}`);
    for (const [, id, slug] of values.matchAll(/\('([0-9a-f-]{36})'::uuid, '([^']+)'::text\)/g)) {
      assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.equal(slug.includes(id), false, 'public slug must not contain a UUID');
      groups.get(table).push({ id, slug });
    }
  }

  for (const [table, count] of expected) {
    const rows = groups.get(table);
    assert.equal(rows.length, count, `${table} mapping count`);
    assert.equal(new Set(rows.map((row) => row.id)).size, count, `${table} IDs`);
    assert.equal(new Set(rows.map((row) => row.slug)).size, count, `${table} slugs`);
  }
  assert.match(migration, /where target\.id = source\.id and target\.slug is null;/);
});
