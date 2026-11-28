import { afterAll, beforeAll, describe, expect, it } from "vitest";

import sql from "@/config/database/db";

import { loadFixtures } from "../__testing__/fixtures";
import { resetSearchContextCache } from "./context";
import { resetEmbeddingClient } from "./embedding-client";
import { search } from "./search";
import { suggest } from "./suggest";

/**
 * Runs against a REAL Postgres (pgvector, pg_trgm) and the real embedding service. The test
 * database must end in "_it": the suite empties search.documents.
 */
const dbName = new URL(process.env.DATABASE_URL ?? "postgres://x/none").pathname.slice(1);
const embeddingUp = await fetch(`${process.env.EMBEDDING_URL ?? "http://127.0.0.1:8089"}/health`)
  .then((r) => r.ok)
  .catch(() => false);

const run = (query: string, extra: Record<string, unknown> = {}) => search({ q: query, locale: "fa", limit: 10, ...extra });
const ids = (response: Awaited<ReturnType<typeof run>>) => response.results.map((r) => r.href.split("/").slice(-1)[0]);

describe.skipIf(!dbName.endsWith("_it"))("unified search (real database)", () => {
  beforeAll(async () => {
    await loadFixtures(sql, embeddingUp);
    await sql`truncate search.query_log`;
    resetSearchContextCache();
    resetEmbeddingClient();
  });
  afterAll(async () => {
    await sql.end({ timeout: 2 });
  });

  describe("keywords, place and city (no embedding needed)", () => {
    it("the example query: hair transplant in Gheytarieh, Tehran ranks the Gheytarieh clinic first", async () => {
      const response = await run("کاشت مو قیطریه تهران");
      expect(ids(response)[0]).toBe("hair-gheytarieh");
      expect(response.place?.name).toBe("قیطریه");
      // Elahieh (about 2 km away) beats Sadeghieh (about 12 km), and Isfahan is not preferred over Tehran.
      const order = ids(response);
      expect(order.indexOf("hair-elahieh")).toBeLessThan(order.indexOf("hair-sadeghieh"));
      expect(order.indexOf("hair-isfahan")).toBeLessThan(0);
      expect(response.results[0].distanceKm).toBeLessThan(1);
    });

    it("works the same in Latin letters and with Arabic yeh/kaf", async () => {
      expect(ids(await run("hair transplant gheytarieh tehran"))[0]).toBe("hair-gheytarieh");
      expect(ids(await run("كاشت مو قيطريه تهران"))[0]).toBe("hair-gheytarieh");
    });

    it("a city only: all matching clinics of that city, other cities after", async () => {
      const response = await run("کاشت مو تهران");
      const order = ids(response);
      expect(order.slice(0, 3)).toEqual(expect.arrayContaining(["hair-gheytarieh", "hair-elahieh", "hair-sadeghieh"]));
      expect(order.indexOf("hair-isfahan")).toBeLessThan(0); // enough Tehran results, so no widening
    });

    it("widens beyond the city when the city has too little", async () => {
      const response = await run("تور شیراز");
      expect(ids(response)).toContain("persepolis");
    });

    it("a neighbourhood alone returns what is near it", async () => {
      const response = await run("قیطریه");
      const order = ids(response);
      expect(order.slice(0, 2).sort()).toEqual(["hair-gheytarieh", "laser-gheytarieh"].sort());
      expect(response.confidentCount).toBeGreaterThan(0);
    });

    it("synonyms: 'هیر ترانسپلنت' and 'FUE' find hair transplants", async () => {
      for (const q of ["هیر ترانسپلنت", "FUE", "hair transplant"]) {
        const top = ids(await run(q)).slice(0, 4);
        expect(top, q).toEqual(expect.arrayContaining(["hair-gheytarieh"]));
      }
    });

    it("tolerates a typo", async () => {
      const top = ids(await run("کاشت موو تهران")).slice(0, 5);
      expect(top.some((id) => id.startsWith("hair-"))).toBe(true);
    });

    it("type filter returns only that type", async () => {
      const response = await run("مو", { type: "article" });
      expect(response.results.length).toBeGreaterThan(0);
      expect(response.results.every((r) => r.type === "article")).toBe(true);
    });

    it("prefers the visitor's position for 'near me'", async () => {
      const near = ids(await run("کاشت مو", { near: { lat: 35.7235, lng: 51.33 } }));
      expect(near[0]).toBe("hair-sadeghieh");
    });

    it("never fails on hostile input and never throws SQL errors", async () => {
      for (const q of ["'; drop table search.documents; --", "a & b | !c", ":*", "\\", "%_%", "<script>alert(1)</script>", "😀😀😀"]) {
        const response = await run(q);
        expect(Array.isArray(response.results), q).toBe(true);
      }
      expect((await sql`select count(*)::int as n from search.documents`)[0].n).toBeGreaterThan(0);
    });

    it("logs the query without any identity, and counts zero-result searches", async () => {
      await run("zzqqxx nonsense");
      await new Promise((resolve) => setTimeout(resolve, 200));
      const rows = await sql<{ normalized: string; results: number; session_hash: string | null }[]>`
        select normalized, results, session_hash from search.query_log where normalized = 'zzqqxx nonsense'`;
      expect(rows.length).toBe(1);
      expect(rows[0].results).toBe(0);
      expect(rows[0].session_hash).toBeNull();
    });
  });

  describe.skipIf(!embeddingUp)("meaning (needs the embedding service)", () => {
    it("symptom words find the right article and treatment", async () => {
      const response = await run("ریزش مو دارم چیکار کنم");
      expect(response.usedVector).toBe(true);
      expect(ids(response).slice(0, 4)).toEqual(expect.arrayContaining(["hair-loss"]));
    });

    it("a service in a named neighbourhood: rhinoplasty in Zafaranieh", async () => {
      expect(ids(await run("عمل بینی زعفرانیه"))[0]).toBe("nose-zafaranieh");
    });

    it("English wording finds Persian-titled results", async () => {
      expect(ids(await run("laser hair removal"))[0]).toBe("laser-gheytarieh");
      expect(ids(await run("accommodation near the shrine mashhad"))[0]).toBe("mashhad-haram");
    });

    it("gibberish finds nothing confident (closest results are only alternatives)", async () => {
      const response = await run("qwrtzx plkmn vbnm");
      expect(response.confidentCount).toBe(0);
    });
  });

  describe("when the embedding service is down", () => {
    it("falls back to keywords and place, quickly", async () => {
      const previous = process.env.EMBEDDING_URL;
      // A query vector already in the database cache needs no service; start from an empty cache.
      await sql`truncate search.embedding_cache`;
      // The client reads its URL at import time, so simulate an outage through a fresh module with a dead port.
      process.env.EMBEDDING_URL = "http://127.0.0.1:9";
      const { vi } = await import("vitest");
      vi.resetModules();
      const fresh = await import("./search");
      const started = Date.now();
      const response = await fresh.search({ q: "كاشت مو قيطريه تهران", locale: "fa", limit: 10 });
      expect(Date.now() - started).toBeLessThan(2000);
      expect(response.usedVector).toBe(false);
      expect(response.results[0].href.endsWith("hair-gheytarieh")).toBe(true);
      process.env.EMBEDDING_URL = previous;
    });
  });

  describe("autocomplete", () => {
    it("is empty for too-short input and does not throw on odd input", async () => {
      expect(await suggest("ک")).toEqual([]);
      expect(await suggest("100%_\\")).toEqual([]);
    });
  });
});
