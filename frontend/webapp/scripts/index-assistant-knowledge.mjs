#!/usr/bin/env node
/**
 * Builds the assistant's knowledge base (ai.knowledge_chunks) from LSevin's own content:
 * service descriptions, FAQs, treatment steps, what is included, and provider policies.
 * Only new or changed chunks are embedded; chunks whose content is gone are deleted.
 *
 * Usage (from frontend/webapp):  pnpm assistant:index
 */
import { createHash } from "node:crypto";

import postgres from "postgres";

try {
  process.loadEnvFile(".env.local");
} catch {
  // Environment may already be set (server, CI).
}

const { DATABASE_URL, OPENAI_API_KEY } = process.env;
const MODEL = process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small";
if (!DATABASE_URL || !OPENAI_API_KEY) {
  console.error("DATABASE_URL and OPENAI_API_KEY are required (frontend/webapp/.env.local).");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 4, onnotice: () => {} });
const MAX_CHARS = 1200;
const BATCH = 100;

/** Rich-text fields may hold Lexical JSON; keep only the readable text. */
function plainText(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  let text = raw;
  if (raw.startsWith("{")) {
    text = [...raw.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g)]
      .map((match) => {
        try {
          return JSON.parse(`"${match[1]}"`);
        } catch {
          return match[1];
        }
      })
      .join(" ");
  }
  return text.replace(/\s+/g, " ").trim();
}

/** Split long text into chunks of about MAX_CHARS, on sentence boundaries. */
function splitText(text) {
  if (text.length <= MAX_CHARS) return [text];
  const parts = [];
  let current = "";
  for (const sentence of text.split(/(?<=[.!?؟\n])\s+/)) {
    if (current && (current + " " + sentence).length > MAX_CHARS) {
      parts.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Best readable value of a translations object, for titles. */
function pick(translations) {
  if (!translations || typeof translations !== "object") return "";
  return plainText(translations["fa-IR"] || translations["en-US"] || Object.values(translations).find(Boolean) || "");
}

const hash = (value) => createHash("sha256").update(value).digest("hex");

const chunks = [];
function add(sourceType, sourceId, locale, title, content, url) {
  const text = plainText(content);
  if (!text) return;
  for (const part of splitText(text)) {
    chunks.push({ sourceType, sourceId, locale, title: title ?? "", content: part, url, hash: hash(`${title}\n${part}`) });
  }
}

async function collect() {
  // 1) Treatment descriptions, one chunk set per language.
  const definitions = await sql`
    select id::text as id, name_translations, description_translations
    from category.service_definitions
    where is_active = true
  `;
  for (const definition of definitions) {
    for (const [locale, description] of Object.entries(definition.description_translations ?? {})) {
      const title = plainText(definition.name_translations?.[locale]) || pick(definition.name_translations);
      add("service_definition", definition.id, locale, title, description, null);
    }
  }

  // Names of active provider services, for FAQ / process / included titles.
  const services = await sql`
    select ps.id::text as id, sd.name_translations as name, sp.name_translations as provider
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    where ps.is_active = true
  `;
  const nameOf = new Map(services.map((row) => [row.id, [pick(row.name), pick(row.provider)].filter(Boolean).join(" · ")]));
  const serviceUrl = (id) => `/n/app/mobile/service/${id}`;
  const groupBy = (rows) => {
    const groups = new Map();
    for (const row of rows) {
      if (!nameOf.has(row.id)) continue; // inactive or deleted service
      if (!groups.has(row.id)) groups.set(row.id, []);
      groups.get(row.id).push(row);
    }
    return groups;
  };

  // 2) FAQs of each service.
  const faqs = await sql`select service_id::text as id, question, answer from category.service_faqs`;
  for (const [id, rows] of groupBy(faqs)) {
    const content = rows.map((row) => `${plainText(row.question)}\n${plainText(row.answer)}`).join("\n");
    add("faq", id, "any", nameOf.get(id), content, serviceUrl(id));
  }

  // 3) Treatment steps.
  const steps = await sql`
    select service_id::text as id, step, title, description, duration
    from category.service_process
    order by service_id, step
  `;
  for (const [id, rows] of groupBy(steps)) {
    const content = rows
      .map((row) => `${row.step}. ${plainText(row.title)}: ${plainText(row.description)}${row.duration ? ` (${plainText(row.duration)})` : ""}`)
      .join("\n");
    add("process", id, "any", nameOf.get(id), content, serviceUrl(id));
  }

  // 4) What is included.
  const included = await sql`select service_id::text as id, item from category.service_included`;
  for (const [id, rows] of groupBy(included)) {
    add("included", id, "any", nameOf.get(id), rows.map((row) => plainText(row.item)).join(", "), serviceUrl(id));
  }

  // 5) Provider policies (cancellation, refund, admission...), per language.
  const policies = await sql`
    select pp.id::text as id, pp.service_provider_id::text as provider_id,
      pp.type_translations, pp.description_translations, sp.name_translations as provider
    from category.provider_policies pp
    join category.service_providers sp on sp.id = pp.service_provider_id
  `;
  for (const policy of policies) {
    for (const [locale, description] of Object.entries(policy.description_translations ?? {})) {
      const type = plainText(policy.type_translations?.[locale]) || pick(policy.type_translations);
      const title = [type, pick(policy.provider)].filter(Boolean).join(" · ");
      add("policy", policy.id, locale, title, description, `/n/app/mobile/provider/${policy.provider_id}`);
    }
  }
}

async function embed(texts) {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!response.ok) throw new Error(`OpenAI embeddings ${response.status}: ${await response.text()}`);
  const json = await response.json();
  return json.data.sort((a, b) => a.index - b.index).map((item) => item.embedding);
}

async function main() {
  const started = Date.now();
  await collect();

  const keyOf = (type, id, locale, contentHash) => `${type}|${id}|${locale}|${contentHash}`;
  const existing = await sql`
    select id::text as id, source_type, source_id::text as source_id, locale, content_hash
    from ai.knowledge_chunks
  `;
  const existingKeys = new Set(existing.map((row) => keyOf(row.source_type, row.source_id, row.locale, row.content_hash)));

  const wanted = new Set();
  const toEmbed = [];
  for (const chunk of chunks) {
    const key = keyOf(chunk.sourceType, chunk.sourceId, chunk.locale, chunk.hash);
    if (wanted.has(key)) continue;
    wanted.add(key);
    if (!existingKeys.has(key)) toEmbed.push(chunk);
  }

  console.log(`${chunks.length} chunks from site content, ${toEmbed.length} new or changed to embed.`);

  for (let i = 0; i < toEmbed.length; i += BATCH) {
    const batch = toEmbed.slice(i, i + BATCH);
    const vectors = await embed(batch.map((chunk) => `${chunk.title}\n${chunk.content}`));
    for (const [index, chunk] of batch.entries()) {
      await sql`
        insert into ai.knowledge_chunks (source_type, source_id, locale, title, content, url, content_hash, embedding)
        values (${chunk.sourceType}, ${chunk.sourceId}::uuid, ${chunk.locale}, ${chunk.title}, ${chunk.content},
          ${chunk.url}, ${chunk.hash}, ${`[${vectors[index].join(",")}]`}::vector)
        on conflict do nothing
      `;
    }
    console.log(`  embedded ${Math.min(i + BATCH, toEmbed.length)} / ${toEmbed.length}`);
  }

  const stale = existing
    .filter((row) => !wanted.has(keyOf(row.source_type, row.source_id, row.locale, row.content_hash)))
    .map((row) => row.id);
  if (stale.length) await sql`delete from ai.knowledge_chunks where id = any(${stale}::uuid[])`;

  const [{ total }] = await sql`select count(*)::int as total from ai.knowledge_chunks`;
  console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s: ${toEmbed.length} embedded, ${stale.length} removed, ${total} chunks in the knowledge base.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());