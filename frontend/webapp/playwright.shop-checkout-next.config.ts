import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "shop-checkout-next.spec.ts",
  workers: 1,
  timeout: 90000,
  use: {
    baseURL: "http://127.0.0.1:3024",
    channel: "chrome",
    viewport: { width: 360, height: 740 },
    trace: "retain-on-failure",
  },
  webServer: {
    command:
      "node node_modules/next/dist/bin/next dev e2e/fixtures/shop-checkout-next --webpack --hostname 127.0.0.1 --port 3024",
    url: "http://127.0.0.1:3024/checkout",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
