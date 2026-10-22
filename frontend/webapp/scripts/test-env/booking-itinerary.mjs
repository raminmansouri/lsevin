#!/usr/bin/env node
/**
 * One command for the booking-pro itinerary test environment: unit, integration (real Postgres)
 * and end-to-end (Playwright, real Next server + real API + real Postgres).
 *
 *   node scripts/test-env/booking-itinerary.mjs            # reuse the test database if it exists
 *   node scripts/test-env/booking-itinerary.mjs --reset    # rebuild it from the local dev database
 *   node scripts/test-env/booking-itinerary.mjs --unit     # unit tests only (no database, no server)
 *
 * What it does:
 *   1. Test database: clones the local dev database (docker container, default lsevin-dev-postgres-1)
 *      into lsevin_itinerary_test, applies scripts/test-env/prod-schema-alignment.sql and every repo
 *      migration (each in its own transaction; ones that need schemas the local base lacks are
 *      reported and skipped). It never touches the dev database itself or any remote database.
 *   2. Unit tests (booking-pro) and the opt-in integration test against the test database.
 *   3. A tiny file server for fixture images, a Next dev server on a free port against the test
 *      database, then the Playwright suite (playwright.booking-itinerary.config.ts), then shutdown.
 *
 * Fixtures are created and removed by the tests themselves. Sessions are minted with the local
 * AUTH_SECRET; the e2e spec refuses to run against anything but localhost.
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = new Set(process.argv.slice(2));
const CONTAINER = process.env.TEST_PG_CONTAINER || 'lsevin-dev-postgres-1';
const SOURCE_DB = process.env.TEST_PG_SOURCE_DB || 'lsevin';
const TEST_DB = process.env.TEST_PG_DB || 'lsevin_itinerary_test';
const PG_USER = process.env.TEST_PG_USER || 'lsevin';
const results = [];

function log(message) { console.log(`[itinerary-env] ${message}`); }
function record(name, ok, detail = '') { results.push({ name, ok, detail }); log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); }

function readEnvLocal(key) {
  const file = path.join(APP, '.env.local');
  if (!fs.existsSync(file)) return '';
  const match = fs.readFileSync(file, 'utf8').match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)\\s*$`, 'm'));
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
}

function psql(sql, db = TEST_DB) {
  return spawnSync('docker', ['exec', '-i', CONTAINER, 'psql', '-q', '-U', PG_USER, '-d', db, '-v', 'ON_ERROR_STOP=1', '-At'], { input: sql, encoding: 'utf8' });
}

function testDatabaseUrl() {
  const base = process.env.DATABASE_URL || readEnvLocal('DATABASE_URL');
  if (!base) throw new Error('DATABASE_URL not found (environment or .env.local)');
  const url = new URL(base);
  if (!['localhost', '127.0.0.1', '::1'].includes(url.hostname)) throw new Error(`Refusing a non-local database host: ${url.hostname}`);
  url.pathname = `/${TEST_DB}`;
  return url.toString();
}

function prepareDatabase() {
  const exists = psql(`select 1 from pg_database where datname = '${TEST_DB}'`, 'postgres').stdout.trim() === '1';
  if (exists && !args.has('--reset')) { log(`reusing database ${TEST_DB} (pass --reset to rebuild)`); return; }
  log(`building ${TEST_DB} from ${SOURCE_DB} in ${CONTAINER}`);
  execFileSync('docker', ['exec', CONTAINER, 'sh', '-c',
    `dropdb -U ${PG_USER} --if-exists ${TEST_DB} && createdb -U ${PG_USER} ${TEST_DB} && pg_dump -U ${PG_USER} -d ${SOURCE_DB} --no-owner | psql -q -U ${PG_USER} -d ${TEST_DB} > /dev/null 2>&1`], { stdio: 'inherit' });
  const alignment = fs.readFileSync(path.join(APP, 'scripts/test-env/prod-schema-alignment.sql'), 'utf8');
  const aligned = psql(alignment);
  if (aligned.status !== 0) throw new Error(`prod-schema-alignment.sql failed: ${aligned.stderr}`);
  const dir = path.join(APP, 'db/migrations');
  const skipped = [];
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.sql')).sort()) {
    const run = psql(`begin;\n${fs.readFileSync(path.join(dir, file), 'utf8')}\n;commit;`);
    if (run.status !== 0) skipped.push(`${file}: ${(run.stderr.match(/ERROR:.*$/m) || ['?'])[0]}`);
  }
  log(`migrations applied; ${skipped.length} skipped on this local base:`);
  skipped.forEach((line) => log(`  skipped ${line}`));
  const repeat = psql(`select count(*) from pg_indexes where indexname like 'ux_booking%child%one%'`).stdout.trim();
  if (repeat !== '0') throw new Error('migration 0078 is not in effect in the test database');
}

function freePort(preferred) {
  return new Promise((resolve) => {
    const server = net.createServer().once('error', () => resolve(freePort(preferred + 1)));
    // No host: binds the IPv6 wildcard (dual-stack), as Next does, so a port held on either stack counts as taken.
    server.listen(preferred, () => server.close(() => resolve(preferred)));
  });
}

function startFileServer(port) {
  // Serves any /files/*.png request with a real image, so next/image renders fixture photos.
  const image = fs.readFileSync(path.join(APP, 'public/images/hero.png'));
  const server = http.createServer((request, response) => {
    if (request.url?.startsWith('/files/') && request.url.endsWith('.png')) {
      response.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': image.length });
      response.end(image);
      return;
    }
    response.writeHead(404).end();
  });
  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

function run(name, command, commandArgs, env) {
  const result = spawnSync(command, commandArgs, { cwd: APP, env: { ...process.env, ...env }, stdio: 'inherit', shell: process.platform === 'win32' });
  record(name, result.status === 0, result.status === 0 ? '' : `exit ${result.status}`);
  return result.status === 0;
}

/**
 * Ready means the booking page itself renders for a signed-in user. A signed-out request is answered
 * by the middleware before the page compiles, so waiting for that alone let the first tests hit a
 * half-compiled dev server (404 "This page could not be found").
 */
async function waitFor(base, secret, timeoutMs) {
  const { encode } = await import('next-auth/jwt');
  const now = Date.now();
  const user = '0e2e0000-0000-4000-8000-00000000beef';
  const session = await encode({ secret, salt: 'authjs.session-token', token: { sub: user, user: { id: user, accessToken: 'warmup', accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 } } });
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/fa/n/app/mobile/booking`, { redirect: 'manual', headers: { cookie: `authjs.session-token=${session}` }, signal: AbortSignal.timeout(900_000) });
      const body = await response.text();
      if (response.status === 200 && !body.includes('This page could not be found')) return true;
    } catch { /* still compiling */ }
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }
  return false;
}

function stop(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/F', '/T', '/PID', String(child.pid)], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}

async function main() {
  run('unit tests (booking-pro)', 'npx', ['vitest', 'run', 'src/features/booking-pro'], {});
  if (args.has('--unit')) return;

  prepareDatabase();
  const databaseUrl = testDatabaseUrl();
  const secret = process.env.AUTH_SECRET || readEnvLocal('AUTH_SECRET');
  if (!secret) throw new Error('AUTH_SECRET not found (environment or .env.local)');

  run('integration tests (real database)', 'npx', ['vitest', 'run', 'src/features/booking-pro/server/child-booking.int.test.ts'], { ACCOUNTING_TEST_DATABASE_URL: databaseUrl });

  const filesPort = await freePort(3901);
  const appPort = await freePort(3140);
  const files = await startFileServer(filesPort);
  const base = `http://localhost:${appPort}`;
  log(`starting Next dev server on ${base} (first compile can take several minutes)`);
  const server = spawn(process.execPath, [path.join(APP, 'node_modules/next/dist/bin/next'), 'dev', '--turbopack', '-p', String(appPort)], {
    cwd: APP,
    env: { ...process.env, DATABASE_URL: databaseUrl, DATABASE_URL_DIRECT: databaseUrl, NEXT_PUBLIC_FILES_URL: `http://localhost:${filesPort}/files`, AUTH_URL: base, NEXT_PUBLIC_APP_URL: base },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  try {
    if (!(await waitFor(base, secret, 40 * 60_000))) { record('dev server start', false, 'did not answer within 40 minutes'); return; }
    run('end-to-end (Playwright)', 'npx', ['playwright', 'test', '--config', 'playwright.booking-itinerary.config.ts'], { E2E_BASE_URL: base, E2E_DATABASE_URL: databaseUrl, E2E_AUTH_SECRET: secret });
  } finally {
    stop(server);
    files.close();
  }
}

main()
  .catch((error) => record('environment', false, error.message))
  .finally(() => {
    log('summary:');
    results.forEach((item) => log(`  ${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` (${item.detail})` : ''}`));
    process.exitCode = results.every((item) => item.ok) ? 0 : 1;
  });
