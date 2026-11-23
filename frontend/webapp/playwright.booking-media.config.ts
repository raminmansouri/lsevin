import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: ['booking-media.spec.ts', 'media-permissions.spec.ts'],
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: { baseURL: process.env.E2E_BASE_URL || 'http://localhost:3100', channel: 'chrome', timezoneId: 'America/Los_Angeles' },
});
