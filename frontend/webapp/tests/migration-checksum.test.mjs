import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import { migrationChecksum } from '../scripts/migration-checksum.mjs';

test('Windows CRLF and production LF migration files have the same checksum', () => {
  const sql = readFileSync(fileURLToPath(new URL('../db/migrations/0084_translation_empty_fast_path.sql', import.meta.url)), 'utf8');
  const lf = sql.replace(/\r\n/g, '\n');
  const crlf = lf.replace(/\n/g, '\r\n');
  const productionChecksum = '2ed02d1ca932891fceceaa5a438b3b687032a6f807734010dac5d8b485ad51ef';
  assert.equal(migrationChecksum(lf), productionChecksum);
  assert.equal(migrationChecksum(crlf), productionChecksum);
  assert.notEqual(migrationChecksum(`${lf}\n-- changed`), productionChecksum);
});
