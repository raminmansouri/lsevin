import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "locations-catalogue.spec.ts",
  workers: 1,
  timeout: 90000,
  expect: { timeout: 20000 },
  use: {
    baseURL: process.env.LOCATIONS_E2E_BASE_URL ?? "http://127.0.0.1:3000",
    channel: "chrome",
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
    proxy: process.env.LOCATIONS_E2E_PROXY
      ? { server: process.env.LOCATIONS_E2E_PROXY }
      : undefined,
    launchOptions: {
      args: [
        ...(process.env.LOCATIONS_E2E_DIRECT ? ["--no-proxy-server"] : []),
        ...(process.env.LOCATIONS_E2E_HOST_RULES
          ? ["--host-resolver-rules=" + process.env.LOCATIONS_E2E_HOST_RULES]
          : []),
      ],
    },
    trace: "retain-on-failure",
  },
});
