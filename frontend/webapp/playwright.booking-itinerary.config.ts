import { defineConfig } from "@playwright/test";

/** Mobile itinerary (booking step 3). See e2e/booking-itinerary.spec.ts for the env it needs. */
export default defineConfig({
  testDir: "./e2e",
  testMatch: ["booking-itinerary.spec.ts"],
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3100",
    channel: "chrome",
    trace: "retain-on-failure",
  },
});
