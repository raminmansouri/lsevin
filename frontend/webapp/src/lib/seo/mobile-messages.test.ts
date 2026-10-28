import fs from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import { MOBILE_ADMIN_GENERATED_KEYS } from "@/i18n/partial-namespaces";

// HTML weight: the mobile translation catalog is the biggest part of each page.
const SRC = path.resolve(__dirname, "../..");

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : sourceFiles(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });
}

// Same scope as the audit that produced the list: admin-panel code (any path
// containing "admin") has its own provider with the full namespace.
const customerFiles = sourceFiles(SRC).filter((file) => {
  const rel = path.relative(SRC, file).replace(/\\/g, "/");
  return !/admin/i.test(rel) && rel !== "i18n/partial-namespaces.ts";
});

function adminGeneratedKeys(source: string) {
  const vars = [
    ...source.matchAll(/(?:const|let)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*['"`]AdminGenerated['"`]\s*\)/g),
  ].map((m) => m[1]);
  const keys = new Set<string>();
  for (const v of vars) {
    for (const m of source.matchAll(new RegExp(`\\b${v}(?:\\.(?:rich|markup|raw|has))?\\(\\s*(['"])([^'"]+)\\1`, "g"))) {
      keys.add(m[2]);
    }
  }
  return keys;
}

describe("AdminGenerated subset shipped to mobile pages", () => {
  it("contains every key customer components use", () => {
    const listed = new Set<string>(MOBILE_ADMIN_GENERATED_KEYS);
    const missing: string[] = [];
    for (const file of customerFiles) {
      const source = fs.readFileSync(file, "utf8");
      if (!source.includes("AdminGenerated")) continue;
      for (const key of adminGeneratedKeys(source)) {
        if (!listed.has(key)) missing.push(`${path.relative(SRC, file)}: ${key}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it("lists only keys that exist in the catalog", () => {
    const messages = JSON.parse(fs.readFileSync(path.resolve(SRC, "../messages/en.json"), "utf8"));
    const unknown = MOBILE_ADMIN_GENERATED_KEYS.filter((key) => !(key in messages.AdminGenerated));
    expect(unknown).toEqual([]);
  });

  it("getClientMessages ships the subset, not the namespace", async () => {
    const full = { AdminGenerated: { timezone: "Time zone", purgeCache: "Purge cache" }, Common: {}, Home: {} };
    vi.doMock("next-intl/server", () => ({ getMessages: async () => full }));
    const { getClientMessages } = await import("@/i18n/client-messages");
    const mobile = (await getClientMessages("mobileApp", "en")) as Record<string, Record<string, string>>;
    expect(mobile.AdminGenerated).toEqual({ timezone: "Time zone" });
    const admin = (await getClientMessages("admin", "en")) as Record<string, Record<string, string>>;
    expect(admin.AdminGenerated ?? null).not.toEqual({ timezone: "Time zone" });
  });
});
