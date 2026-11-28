import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import sql from "@/config/database/db";

import { searchKnowledge } from "./search-knowledge";

/**
 * The assistant's knowledge base with the self-hosted embedding model: index (script) -> store
 * (embedding_local) -> search (tool). Real Postgres and the real embedding service; the database
 * name must end in "_it".
 */
const dbName = new URL(process.env.DATABASE_URL ?? "postgres://x/none").pathname.slice(1);
const embeddingUp = await fetch(`${process.env.EMBEDDING_URL ?? "http://127.0.0.1:8089"}/health`)
  .then((r) => r.ok)
  .catch(() => false);
const APP_ROOT = path.resolve(__dirname, "../../../..");

const definitionId = randomUUID();
const faqDefinitionId = randomUUID();
let categoryId = "";

function runIndexer(...args: string[]) {
  return execFileSync(process.execPath, ["scripts/index-assistant-knowledge.mjs", ...args], {
    cwd: APP_ROOT,
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
    encoding: "utf8",
  });
}

describe.skipIf(!dbName.endsWith("_it") || !embeddingUp)("assistant knowledge with the local embedding model (real database)", () => {
  beforeAll(async () => {
    process.env.ASSISTANT_EMBEDDINGS = "local";
    categoryId = (await sql`select id::text as id from category.categories limit 1`)[0].id;
    await sql`delete from ai.knowledge_chunks`;
    const rows: [string, Record<string, string>, Record<string, string>][] = [
      [definitionId, { "fa-IR": "کاشت مو" }, { "fa-IR": "کاشت مو روشی است که فولیکول‌های مو از پشت سر برداشته و به نواحی کم‌مو پیوند زده می‌شوند. نتیجه نهایی پس از شش تا دوازده ماه دیده می‌شود." }],
      [faqDefinitionId, { "fa-IR": "جراحی بینی", "en-US": "Rhinoplasty" }, { "fa-IR": "در عمل جراحی بینی شکل بینی از نظر ظاهری و تنفسی اصلاح می‌شود. تا یک هفته باید از برخورد به بینی خودداری کرد.", "en-US": "Rhinoplasty reshapes the nose. Avoid any contact with the nose for a week after surgery." }],
    ];
    for (const [id, name, description] of rows) {
      await sql`
        insert into category.service_definitions (id, name_translations, description_translations, category_id, duration_minutes, pricing_model, is_active, currency, value)
        values (${id}, ${sql.json(name)}, ${sql.json(description)}, ${categoryId}, 60, 'Fixed', true, 'IRR', 1000)`;
    }
  });

  afterAll(async () => {
    delete process.env.ASSISTANT_EMBEDDINGS;
    await sql`delete from ai.knowledge_chunks where source_id = any(${[definitionId, faqDefinitionId]})`;
    await sql`delete from category.service_definitions where id = any(${[definitionId, faqDefinitionId]})`;
    await sql.end({ timeout: 2 });
  });

  it("--local indexes with the local model only: embedding_local filled, the OpenAI column untouched", async () => {
    const output = runIndexer("--local");
    expect(output).toContain("local Xenova/multilingual-e5-small");
    const rows = await sql<{ embedding: string | null; embedding_local: string | null; embedding_model: string | null }[]>`
      select embedding::text as embedding, embedding_local::text as embedding_local, embedding_model
        from ai.knowledge_chunks where source_id = any(${[definitionId, faqDefinitionId]})`;
    expect(rows.length).toBeGreaterThanOrEqual(3); // fa + en for rhinoplasty, fa for hair transplant
    for (const row of rows) {
      expect(row.embedding).toBeNull();
      expect(row.embedding_local).not.toBeNull();
      expect(row.embedding_model).toBe("Xenova/multilingual-e5-small");
    }
  });

  it("running again embeds nothing new (idempotent)", () => {
    const output = runIndexer("--local");
    expect(output).toMatch(/0 new or changed to embed/);
  });

  it("answers a question in Persian from the right passage", async () => {
    const result = await searchKnowledge({ question: "کاشت مو یعنی چه و نتیجه‌اش کی معلوم می‌شود؟" }, "fa-IR");
    expect(result.count).toBeGreaterThan(0);
    expect(result.results[0].content).toContain("فولیکول");
  });

  it("finds the passage for a differently worded question and for English", async () => {
    const fa = await searchKnowledge({ question: "بعد از عمل بینی چه مراقبتی لازم است؟" }, "fa-IR");
    expect(fa.results[0]?.content).toContain("بینی");
    const en = await searchKnowledge({ question: "how long should I protect my nose after rhinoplasty?" }, "en-US");
    expect(en.results[0]?.content.toLowerCase()).toContain("nose");
  });

  it("returns nothing for an unrelated question instead of a weak guess", async () => {
    const result = await searchKnowledge({ question: "قیمت بلیط هواپیما تهران به استانبول" }, "fa-IR");
    expect(result.count).toBe(0);
  });

  it("with the embedding service unreachable it says nothing found, not an error", async () => {
    const { vi } = await import("vitest");
    const previous = process.env.EMBEDDING_URL;
    process.env.EMBEDDING_URL = "http://127.0.0.1:9";
    vi.resetModules();
    const fresh = await import("./search-knowledge");
    // A cached vector for this exact question would hide the outage: use a question never asked before.
    const result = await fresh.searchKnowledge({ question: `سوال تازه ${randomUUID()}` }, "fa-IR");
    expect(result.count).toBe(0);
    process.env.EMBEDDING_URL = previous;
  });
});
