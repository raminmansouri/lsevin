import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "commerce-mobile.spec.ts",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3022",
    channel: "chrome",
    viewport: { width: 360, height: 740 },
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --config e2e/fixtures/commerce-ui/vite.config.ts",
    url: "http://127.0.0.1:3022",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
