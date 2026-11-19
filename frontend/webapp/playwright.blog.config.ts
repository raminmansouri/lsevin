import { defineConfig } from "@playwright/test";

/** Blog: block editor, publishing and the public pages. Run through `pnpm test:local-env --suite blog` (see e2e/blog.spec.ts). */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["blog.spec.ts"],
  forbidOnly: !!process.env.CI,
  workers: 1,
  timeout: 240_000,
  // Dev-server saves compile server actions on demand and can take tens of seconds the first time.
  expect: { timeout: 60_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report/blog" }], ["junit", { outputFile: "test-results/blog-e2e-junit.xml" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3140",
    channel: "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
});
