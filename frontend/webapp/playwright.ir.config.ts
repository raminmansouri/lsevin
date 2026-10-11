import { defineConfig } from "@playwright/test";

// Acceptance run against the Iran site (https://lsevin.ir, served by server A behind the ArvanCloud edge).
// From a machine that cannot route to A directly, open a tunnel first and map the hostname to it:
//   ssh -N -L 127.0.0.1:13443:127.0.0.1:443 root@<A>      (the certificate is valid for lsevin.ir)
//   IR_TUNNEL_PORT=13443 npx playwright test -c playwright.ir.config.ts
// From inside Iran just run it without IR_TUNNEL_PORT.
const tunnel = process.env.IR_TUNNEL_PORT;

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["ir-site.spec.ts"],
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || "https://lsevin.ir",
    channel: "chrome",
    trace: "retain-on-failure",
    launchOptions: tunnel ? { args: ["--no-proxy-server", `--host-resolver-rules=MAP lsevin.ir 127.0.0.1:${tunnel}`] } : {},
  },
});
