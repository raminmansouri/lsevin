import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * The accounting tests run against a REAL Postgres, not a mock.
 *
 * Everything they assert — deferred balance constraints, row locks, ON CONFLICT
 * idempotency, non-negative CHECKs, append-only triggers — lives in the database. A
 * mocked client would test nothing except that the mock was called, which is precisely
 * the class of bug this module exists to prevent.
 *
 * Each test wraps its work in a transaction that is rolled back, so the database is
 * unchanged afterwards and tests do not interfere with each other.
 *
 * Point ACCOUNTING_TEST_DATABASE_URL at a database you are willing to write to. It
 * falls back to DATABASE_URL from .env.local with the port overridden to 5442, which is
 * where the local lsevin-pg container listens.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` throws on import outside a React Server Component, which is the
      // whole point of the package — but under Vitest there is no RSC runtime, so it
      // would fail every server module before a single assertion ran. Stubbing it keeps
      // the guard in the real build while letting the tests import these modules.
      "server-only": path.resolve(__dirname, "./src/accounting/server/__testing__/server-only-stub.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./src/accounting/server/__testing__/setup-env.ts"],
    // Scoped to the accounting module on purpose: src/app/.../nearby.geo.test.ts is a
    // standalone script that runs itself under `node`, not a Vitest suite, and sweeping
    // it in here only produces a spurious "no test suite found".
    include: ["src/accounting/**/*.test.ts"],
    // Postgres row locks are the point of several tests; running files in parallel
    // against one database makes those tests flaky for reasons unrelated to the code.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
});
