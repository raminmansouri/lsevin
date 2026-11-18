import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { routing } from "@/i18n/routing";

import { STAY_CONTENT_LOCALES, STAY_UI_LOCALES } from "./domain/locales";
import { renderStayNotice, type StayNoticeKind } from "./server/notifications";

/**
 * Localization guard for the stays app and admin: every platform language has every message,
 * every message formats (ICU syntax, plurals, tags) with the same arguments as English, no
 * Persian/Arabic script leaks into Latin/Cyrillic/Chinese files, notifications exist in every
 * language, and the stays source code has no user-visible text outside the message files.
 */
const ROOT = path.resolve(__dirname, "../../..");
const AREAS = { app: "StayApp", admin: "StayAdmin" } as const;
const ARABIC_SCRIPT = /[؀-ۿ]/;
const ARABIC_SCRIPT_LOCALES = new Set(["fa", "ar", "ku"]);

type Tree = { [k: string]: string | Tree };
const load = (area: string, locale: string): Tree => JSON.parse(readFileSync(path.join(ROOT, "messages/stays", area, `${locale}.json`), "utf8"));
const flat = (t: Tree, p = ""): Record<string, string> =>
  Object.entries(t).reduce<Record<string, string>>((acc, [k, v]) => (typeof v === "string" ? { ...acc, [p + k]: v } : { ...acc, ...flat(v, `${p}${k}.`) }), {});

/** Values for every top-level ICU argument and rich-text tag of a message. */
function sampleValues(message: string) {
  const values: Record<string, unknown> = {};
  let depth = 0;
  for (let i = 0; i < message.length; i += 1) {
    const ch = message[i];
    if (ch === "'") {
      // ICU quoting: '{' or '}' quoted literally
      const end = message.indexOf("'", i + 1);
      if (end > i + 1 && /[{}]/.test(message.slice(i + 1, end))) i = end;
      continue;
    }
    if (ch === "{") {
      if (depth === 0) {
        const m = /^\{\s*([A-Za-z0-9_]+)\s*(?:,\s*(\w+))?/.exec(message.slice(i));
        if (m) {
          const type = m[2] ?? "";
          values[m[1]] = type === "plural" || type === "selectordinal" || type === "number" ? 3 : type === "date" || type === "time" ? new Date(Date.UTC(2026, 0, 15)) : type === "select" ? "other" : "X";
        }
      }
      depth += 1;
    } else if (ch === "}") depth -= 1;
  }
  for (const m of message.matchAll(/<(\w+)>/g)) values[m[1]] = (chunks: unknown) => `[${String(chunks)}]`;
  return values;
}

describe("stays messages in every language", () => {
  it("covers exactly the platform languages", () => {
    expect([...STAY_UI_LOCALES].sort()).toEqual([...routing.locales].sort());
    expect(STAY_CONTENT_LOCALES).toHaveLength(routing.locales.length);
  });

  for (const [area, namespace] of Object.entries(AREAS)) {
    const english = flat(load(area, "en"));
    for (const locale of STAY_UI_LOCALES) {
      it(`${area}/${locale}: same keys as English, every message formats with English's arguments`, () => {
        const tree = load(area, locale);
        const messages = flat(tree);
        expect(Object.keys(messages).filter((k) => !(k in english)), "extra keys").toEqual([]);
        expect(Object.keys(english).filter((k) => !(k in messages)), "missing keys").toEqual([]);
        const errors: string[] = [];
        const t = createTranslator({ locale, messages: tree as never, onError: (e) => errors.push(`${locale}: ${e.message}`) });
        const problems: string[] = [];
        for (const [key, value] of Object.entries(messages)) {
          if (!value.trim()) problems.push(`${key}: empty`);
          if (!ARABIC_SCRIPT_LOCALES.has(locale) && ARABIC_SCRIPT.test(value)) problems.push(`${key}: Persian/Arabic script in ${locale}`);
          const id = key.slice(namespace.length + 1);
          const sample = sampleValues(english[key]);
          const out = (t as unknown as { markup: (k: string, v: unknown) => string }).markup(`${namespace}.${id}`, sample);
          if (typeof out !== "string" || out.includes(`${namespace}.`)) problems.push(`${key}: did not format`);
          // Every argument English uses must appear in the translation (a dropped {count} hides data).
          const own = sampleValues(value);
          for (const arg of Object.keys(sample)) if (!(arg in own)) problems.push(`${key}: missing {${arg}}`);
        }
        expect([...problems, ...errors]).toEqual([]);
      });
    }
  }
});

describe("stay notifications in every language", () => {
  const kinds: StayNoticeKind[] = ["created", "requested", "accepted", "declined", "confirmed", "cancelled", "request_expired", "expired"];
  for (const locale of STAY_CONTENT_LOCALES) {
    it(`${locale}: every event has its own title and text with the stay, dates and reference`, () => {
      for (const kind of kinds) {
        const n = renderStayNotice(kind, { locale, calendar: "gregory", checkIn: "2026-12-01", checkOut: "2026-12-03", voucher: "ST-TEST123", propertyName: "Hotel Test" });
        expect(n.title.trim()).not.toBe("");
        expect(n.body).toContain("ST-TEST123");
        expect(n.body).toContain("Hotel Test");
        expect(n.body).not.toMatch(/\{(stay|dates|ref)\}/);
        if (!locale.startsWith("en")) expect(n.title, `${locale} ${kind} falls back to English`).not.toBe(renderStayNotice(kind, { locale: "en-US", calendar: "gregory", checkIn: "2026-12-01", checkOut: "2026-12-03", voucher: "x", propertyName: "y" }).title);
      }
    });
  }
});

describe("no hard-coded user-visible text in stays code", () => {
  const roots = ["src/features/stays", "src/app/[locale]/stays", "src/app/[locale]/(admin)/admin/stays", "src/app/api/stays"].map((r) => path.join(ROOT, r));
  // Lines that legitimately hold Persian/Arabic characters: search normalisers, the Arabic-script
  // list separator, date splitting on either comma, and the notification dictionary (one entry
  // per language, checked above).
  const ALLOWED = [/translate\(/, /\[۰-۹\]|\[٠-٩\]/, /like '%/, /\[,،\]/, /return "، "/, /^\s*(created|requested|accepted|declined|confirmed|cancelled|request_expired|expired): \[/];
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !full.includes(`${path.sep}testing${path.sep}`)) files.push(full);
    }
  };
  roots.forEach(walk);

  it("has no Persian/Arabic text outside comments (it belongs in messages/stays/*)", () => {
    const found: string[] = [];
    for (const file of files) {
      let block = false;
      readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
        const trimmed = line.trim();
        if (block) {
          if (trimmed.includes("*/")) block = false;
          return;
        }
        if (trimmed.startsWith("/*") && !trimmed.includes("*/")) {
          block = true;
          return;
        }
        if (trimmed.startsWith("//") || trimmed.startsWith("*")) return;
        const code = line.replace(/\/\/.*$/, "");
        if (ARABIC_SCRIPT.test(code) && !ALLOWED.some((re) => re.test(code))) found.push(`${path.relative(ROOT, file)}:${i + 1}: ${trimmed.slice(0, 90)}`);
      });
    }
    expect(found).toEqual([]);
  });

  it("has no English text in JSX or in aria-label/title/placeholder/alt attributes", () => {
    const found: string[] = [];
    for (const file of files.filter((f) => f.endsWith(".tsx"))) {
      readFileSync(file, "utf8").split(/\r?\n/).forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, "");
        if (/^\s*(\*|\/\/)/.test(line)) return;
        for (const m of code.matchAll(/\b(aria-label|title|placeholder|alt)="([^"{]*[A-Za-z]{3,}[^"]*)"/g)) found.push(`${path.relative(ROOT, file)}:${i + 1}: ${m[1]}="${m[2]}"`);
        for (const m of code.matchAll(/>\s*([A-Z][a-z]+(?: [a-z]+)+)\s*</g)) found.push(`${path.relative(ROOT, file)}:${i + 1}: text "${m[1]}"`);
      });
    }
    expect(found).toEqual([]);
  });
});
