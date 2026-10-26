#!/usr/bin/env node
/**
 * Local test environment: unit, integration (real Postgres) and end-to-end (Playwright, real Next
 * server + real API routes/server actions + real Postgres) for the suites below.
 *
 *   pnpm test:local-env                       # every suite; reuse the test database if it exists
 *   pnpm test:local-env --reset               # rebuild the test database from the local dev database
 *   pnpm test:local-env --suite categories    # one suite (itinerary | categories); repeatable
 *   pnpm test:local-env --unit                # unit tests only (no database, no server)
 *   pnpm test:local-env --e2e-only            # skip unit + integration (e.g. after they passed)
 *   pnpm test:itinerary                       # = --suite itinerary
 *
 * What it does:
 *   1. Test database: clones the local dev database (docker container, default lsevin-dev-postgres-1)
 *      into lsevin_itinerary_test, applies scripts/test-env/prod-schema-alignment.sql and every repo
 *      migration (each in its own transaction; ones that need schemas the local base lacks are
 *      reported and skipped). It never touches the dev database itself or any remote database.
 *   2. Unit tests, then the opt-in integration tests against the test database.
 *   3. A file server for fixture images, a stand-in for the .NET API (scripts/test-env/api-stub.mjs;
 *      tests register the responses they need), a Next dev server on a free port against the test
 *      database, then the suites' Playwright configs, then shutdown.
 *
 * Fixtures are created and removed by the tests themselves. Sessions are minted with the local
 * AUTH_SECRET; the e2e specs refuse to run against anything but localhost.
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { startApiStub } from './api-stub.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const argv = process.argv.slice(2);
const args = new Set(argv);
const CONTAINER = process.env.TEST_PG_CONTAINER || 'lsevin-dev-postgres-1';
const SOURCE_DB = process.env.TEST_PG_SOURCE_DB || 'lsevin';
const TEST_DB = process.env.TEST_PG_DB || 'lsevin_itinerary_test';
const PG_USER = process.env.TEST_PG_USER || 'lsevin';

const SUITES = {
  itinerary: {
    unit: ['src/features/booking-pro'],
    integration: ['src/features/booking-pro/server/child-booking.int.test.ts'],
    e2e: 'playwright.booking-itinerary.config.ts',
    // Pages that must render before the specs start (compiled on first request in dev).
    warmup: [{ path: '/fa/n/app/mobile/booking', signedIn: true }],
  },
  categories: {
    unit: ['src/features/categories'],
    integration: ['src/features/categories/server/category-landing.int.test.ts'],
    e2e: 'playwright.category-landing.config.ts',
    warmup: [{ path: '/fa/n/app/mobile/home', signedIn: false }, { path: '/fa/n/app/mobile/categories', signedIn: false }],
  },
};
const requested = argv.flatMap((arg, index) => (arg === '--suite' ? [argv[index + 1]] : arg.startsWith('--suite=') ? [arg.slice(8)] : []));
const suites = requested.length ? requested : Object.keys(SUITES);
const unknown = suites.filter((name) => !SUITES[name]);
if (unknown.length) {
  console.error(`[local-env] unknown suite(s): ${unknown.join(', ')} — expected ${Object.keys(SUITES).join(', ')}`);
  process.exit(2);
}
const results = [];

function log(message) { console.log(`[local-env] ${message}`); }
function record(name, ok, detail = '') { results.push({ name, ok, detail }); log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`); }

function readEnvLocal(key) {
  const file = path.join(APP, '.env.local');
  if (!fs.existsSync(file)) return '';
  const match = fs.readFileSync(file, 'utf8').match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)\\s*$`, 'm'));
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : '';
}

function psql(sqlText, db = TEST_DB) {
  return spawnSync('docker', ['exec', '-i', CONTAINER, 'psql', '-q', '-U', PG_USER, '-d', db, '-v', 'ON_ERROR_STOP=1', '-At'], { input: sqlText, encoding: 'utf8' });
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
  log(`migrations applied; ${skipped.length} skipped on this local base`);
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
 * Ready means every page the selected suites start from renders (200, not the 404 page). A signed-out
 * request to a protected page is answered by the middleware before the page compiles, so waiting for
 * that alone let the first tests hit a half-compiled dev server ("This page could not be found").
 */
async function waitFor(base, secret, pages, timeoutMs) {
  const { encode } = await import('next-auth/jwt');
  const now = Date.now();
  const user = '0e2e0000-0000-4000-8000-00000000beef';
  const session = await encode({ secret, salt: 'authjs.session-token', token: { sub: user, user: { id: user, accessToken: 'warmup', accessTokenExpires: now + 3_600_000, refreshTokenExpires: now + 7_200_000 } } });
  const deadline = Date.now() + timeoutMs;
  for (const page of pages) {
    log(`warming ${page.path}`);
    let ready = false;
    while (!ready && Date.now() < deadline) {
      try {
        const headers = page.signedIn ? { cookie: `authjs.session-token=${session}` } : {};
        const response = await fetch(`${base}${page.path}`, { redirect: 'manual', headers, signal: AbortSignal.timeout(900_000) });
        const body = await response.text();
        ready = response.status === 200 && !body.includes('This page could not be found');
      } catch { /* still compiling */ }
      if (!ready) await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    if (!ready) return false;
  }
  return true;
}

function stop(child) {
  if (!child?.pid) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/F', '/T', '/PID', String(child.pid)], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}

async function main() {
  log(`suites: ${suites.join(', ')}`);
  const e2eOnly = args.has('--e2e-only');
  if (!e2eOnly) run(`unit tests (${suites.join(', ')})`, 'npx', ['vitest', 'run', ...suites.flatMap((name) => SUITES[name].unit)], {});
  if (args.has('--unit')) return;

  prepareDatabase();
  const databaseUrl = testDatabaseUrl();
  const secret = process.env.AUTH_SECRET || readEnvLocal('AUTH_SECRET');
  if (!secret) throw new Error('AUTH_SECRET not found (environment or .env.local)');

  if (!e2eOnly) run('integration tests (real database)', 'npx', ['vitest', 'run', ...suites.flatMap((name) => SUITES[name].integration)], { ACCOUNTING_TEST_DATABASE_URL: databaseUrl });

  const filesPort = await freePort(3901);
  const stubPort = await freePort(3911);
  const appPort = await freePort(3140);
  const files = await startFileServer(filesPort);
  const stub = await startApiStub(stubPort);
  const stubUrl = `http://localhost:${stubPort}`;
  const base = `http://localhost:${appPort}`;
  fs.mkdirSync(path.join(APP, 'test-results'), { recursive: true });
  const devLogPath = path.join(APP, 'test-results', 'local-env-dev.log');
  const devLog = fs.openSync(devLogPath, 'w');
  log(`dev server output: ${devLogPath}`);
  log(`starting Next dev server on ${base} (API stub ${stubUrl}; first compile can take several minutes)`);
  const server = spawn(process.execPath, [path.join(APP, 'node_modules/next/dist/bin/next'), 'dev', '--turbopack', '-p', String(appPort)], {
    cwd: APP,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DATABASE_URL_DIRECT: databaseUrl,
      INTERNAL_API_URL: `${stubUrl}/api/v1`,
      NEXT_PUBLIC_FILES_URL: `http://localhost:${filesPort}/files`,
      AUTH_URL: base,
      NEXT_PUBLIC_APP_URL: base,
    },
    stdio: ['ignore', devLog, devLog],
  });
  try {
    const pages = suites.flatMap((name) => SUITES[name].warmup);
    if (!(await waitFor(base, secret, pages, 40 * 60_000))) {
      record('dev server start', false, 'pages did not render within 40 minutes');
      const tail = fs.readFileSync(devLogPath, 'utf8').split(/\r?\n/).slice(-40).join('\n');
      log(`last dev server output:\n${tail}`);
      return;
    }
    for (const name of suites) {
      run(`end-to-end: ${name} (Playwright)`, 'npx', ['playwright', 'test', '--config', SUITES[name].e2e], {
        E2E_BASE_URL: base, E2E_DATABASE_URL: databaseUrl, E2E_AUTH_SECRET: secret, E2E_API_STUB_URL: stubUrl,
      });
    }
  } finally {
    stop(server);
    files.close();
    stub.close();
    fs.closeSync(devLog);
  }
}

main()
  .catch((error) => record('environment', false, error.message))
  .finally(() => {
    log('summary:');
    results.forEach((item) => log(`  ${item.ok ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` (${item.detail})` : ''}`));
    process.exitCode = results.every((item) => item.ok) ? 0 : 1;
  });
