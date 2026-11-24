import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["seo-app-robots-seller.spec.ts"],
  workers: 1,
  timeout: 90_000,
  use: { baseURL: process.env.E2E_BASE_URL || "http://localhost:3101", channel: "chrome" },
});
