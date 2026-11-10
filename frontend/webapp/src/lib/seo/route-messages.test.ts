import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  CORE_NAMESPACES,
  ROUTE_NAMESPACES,
  SEGMENT_NAMESPACES,
} from "@/i18n/client-messages";
import { createScanner } from "@/i18n/message-usage";
import {
  MOBILE_ADMIN_GENERATED_KEYS,
  MOBILE_BOOKING_KEYS,
  MOBILE_CONSULTATION_KEYS,
} from "@/i18n/partial-namespaces";

// Page weight (SEO tracker T37): the large namespaces are handed only to the
// routes that use them. This walks the imports of every route file under the
// mobile app shell and fails when the browser could ask for a message nobody
// gave it, which next-intl renders as a raw key path such as "Booking.close".

const SRC = path.resolve(__dirname, "../..");
const LOCALE_DIR = path.join(SRC, "app", "[locale]");
const SHELL_TREES = ["n", "(site)"];
const ROUTE_FILE = /^(page|layout|error|loading|not-found|template|default)\.tsx$/;

const PARTIAL: Record<string, readonly string[]> = {
  AdminGenerated: MOBILE_ADMIN_GENERATED_KEYS,
  Booking: MOBILE_BOOKING_KEYS,
  Consultation: MOBILE_CONSULTATION_KEYS,
};

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const rel = (file: string, from = LOCALE_DIR) => path.relative(from, file).split(path.sep).join("/");

const routeFiles = SHELL_TREES.flatMap((tree) => walk(path.join(LOCALE_DIR, tree))).filter((file) =>
  ROUTE_FILE.test(path.basename(file))
);

const catalog = JSON.parse(fs.readFileSync(path.resolve(SRC, "../messages/en.json"), "utf8")) as Record<
  string,
  Record<string, unknown>
>;

describe("messages handed to the mobile app shell", () => {
  const scanner = createScanner(SRC);

  it("covers every key each page under the shell can read in the browser", () => {
    const full = new Set<string>([...CORE_NAMESPACES, ...SEGMENT_NAMESPACES.mobileApp]);
    const missing = new Set<string>();

    for (const routeFile of routeFiles) {
      const route = rel(routeFile);
      const provided = new Set(full);
      for (const [prefix, namespaces] of Object.entries(ROUTE_NAMESPACES)) {
        if (route.startsWith(prefix + "/")) namespaces.forEach((ns) => provided.add(ns));
      }

      for (const file of scanner.reachable(routeFile)) {
        for (const use of scanner.keyUses(file)) {
          // A namespace the catalog does not have is somebody else's problem
          // (and is reported by next-intl in development), not this split's.
          if (!(use.namespace in catalog) && !use.namespace.startsWith("<")) continue;
          if (provided.has(use.namespace)) continue;
          const keys = PARTIAL[use.namespace];
          if (keys?.includes(use.topKey)) continue;
          const what = keys ? `${use.namespace}.${use.topKey}` : use.namespace;
          missing.add(`${route}: ${what} (via ${rel(file, SRC)})`);
        }
      }
    }

    expect([...missing].sort()).toEqual([]);
  });

  it("keeps the large namespaces out of the shell itself", () => {
    const shell = new Set<string>(SEGMENT_NAMESPACES.mobileApp);
    for (const namespace of ["Booking", "Consultation", "FormBuilder", "MobileProfile", "ProviderOnboarding"]) {
      expect(shell.has(namespace), namespace).toBe(false);
    }
  });

  it("every ROUTE_NAMESPACES entry is wired in that route's layout", () => {
    for (const route of Object.keys(ROUTE_NAMESPACES)) {
      const layout = path.join(LOCALE_DIR, ...route.split("/"), "layout.tsx");
      expect(fs.existsSync(layout), layout).toBe(true);
      expect(fs.readFileSync(layout, "utf8")).toContain(`route="${route}"`);
    }
  });

  it("partial key lists name keys that exist", () => {
    for (const [namespace, keys] of Object.entries(PARTIAL)) {
      const unknown = keys.filter((key) => !(key in catalog[namespace]));
      expect(unknown, namespace).toEqual([]);
    }
  });

  it("the scanner sees built keys and translators handed along", () => {
    const dir = fs.mkdtempSync(path.join(SRC, "..", ".route-messages-"));
    try {
      const file = path.join(dir, "sample.tsx");
      fs.writeFileSync(
        file,
        [
          'const t = useTranslations("Booking");',
          "t('mealPlan.' + code + '.name'); t(`stay.${x}`); t('close');",
          'const u = useTranslations("Consultation.homeTeaser"); u("title");',
          'const v = useTranslations("Shop"); render(v);',
          "const w = useTranslations(\"Explore\"); w('status_' + s);",
        ].join("\n")
      );
      const uses = createScanner(SRC)
        .keyUses(file)
        .map((use) => `${use.namespace}.${use.topKey}`);
      expect(uses.sort()).toEqual(
        ["Booking.close", "Booking.mealPlan", "Booking.stay", "Consultation.homeTeaser", "Explore.*", "Shop.*"].sort()
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
