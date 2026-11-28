import { createHash } from "node:crypto";

import type postgres from "postgres";

/**
 * A small, production-shaped catalogue for relevance tests: Tehran clinics around the
 * neighbourhoods people actually name, other cities, tours, stays and articles. Coordinates
 * of the Tehran clinics match the (approximate) neighbourhood centres in search.places.
 */
type Fixture = {
  id: string;
  type: "provider" | "offer" | "tour" | "stay" | "article";
  fa: string;
  en?: string;
  sub?: string;
  extra?: string;
  city?: string;
  lat?: number;
  lng?: number;
  quality?: number;
  price?: number;
  url: string;
};

export const FIXTURES: Fixture[] = [
  { id: "hair-gheytarieh", type: "offer", fa: "کاشت مو", en: "Hair transplant", sub: "کلینیک زیبایی آرتا", extra: "کاشت مو به روش FUE و DHI با پزشک متخصص", city: "tehran", lat: 35.7955, lng: 51.444, quality: 0.8, price: 45_000_000, url: "/services/hair-gheytarieh" },
  { id: "hair-sadeghieh", type: "offer", fa: "کاشت مو", en: "Hair transplant", sub: "کلینیک دکتر کوچالی", extra: "کاشت مو و ابرو", city: "tehran", lat: 35.723, lng: 51.329, quality: 0.7, price: 38_000_000, url: "/services/hair-sadeghieh" },
  { id: "hair-isfahan", type: "offer", fa: "کاشت مو", en: "Hair transplant", sub: "کلینیک مهر اصفهان", city: "isfahan", lat: 32.65, lng: 51.67, quality: 0.9, price: 30_000_000, url: "/services/hair-isfahan" },
  { id: "hair-elahieh", type: "offer", fa: "کاشت موی FUE", en: "FUE hair transplant", sub: "مرکز مو و پوست الهیه", city: "tehran", lat: 35.7935, lng: 51.4225, quality: 0.75, price: 50_000_000, url: "/services/hair-elahieh" },
  { id: "laser-gheytarieh", type: "offer", fa: "لیزر موهای زائد", en: "Laser hair removal", sub: "کلینیک لیزر نگین", city: "tehran", lat: 35.796, lng: 51.442, quality: 0.6, price: 4_000_000, url: "/services/laser-gheytarieh" },
  { id: "nose-zafaranieh", type: "offer", fa: "جراحی بینی", en: "Rhinoplasty", sub: "بیمارستان زعفرانیه", extra: "عمل بینی با جراح فوق تخصص", city: "tehran", lat: 35.806, lng: 51.413, quality: 0.85, price: 90_000_000, url: "/services/nose-zafaranieh" },
  { id: "prp-vanak", type: "offer", fa: "پی ار پی (PRP)", en: "PRP platelet-rich plasma", sub: "کلینیک ونک", city: "tehran", lat: 35.757, lng: 51.409, quality: 0.5, price: 6_000_000, url: "/services/prp-vanak" },
  { id: "prov-alipour", type: "provider", fa: "کلینیک پوست و مو دکتر علیپور", sub: "تهران", extra: "کاشت مو، پی ار پی، لیزر", city: "tehran", lat: 35.7243, lng: 51.4022, quality: 0.6, url: "/providers/alipour" },
  { id: "prov-bahrooyan", type: "provider", fa: "کلینیک زیبایی بهرویان", sub: "دیباجی جنوبی", extra: "جراحی بینی و فیلر", city: "tehran", lat: 35.7923, lng: 51.4628, quality: 0.65, url: "/providers/bahrooyan" },
  { id: "tour-persepolis", type: "tour", fa: "تور یک روزه تخت جمشید", en: "Persepolis day tour", sub: "شیراز", city: "shiraz", lat: 29.93, lng: 52.89, quality: 0.8, url: "/tours/persepolis" },
  { id: "tour-yazd", type: "tour", fa: "تور تاریخی یزد", en: "Yazd historic tour", sub: "یزد", city: "yazd", lat: 31.9, lng: 54.36, quality: 0.7, url: "/tours/yazd" },
  { id: "stay-mashhad", type: "stay", fa: "هتل آپارتمان نزدیک حرم", en: "Apartment hotel near the holy shrine", sub: "مشهد", city: "mashhad", lat: 36.288, lng: 59.615, quality: 0.7, url: "/stays/mashhad-haram" },
  { id: "art-hairloss", type: "article", fa: "ریزش مو؛ علت‌ها و روش‌های درمان", en: "Hair loss: causes and treatments", extra: "اگر ریزش مو دارید، درمان‌هایی مانند کاشت مو و پی ار پی وجود دارد", quality: 0.4, url: "/blog/hair-loss" },
  { id: "art-nose-care", type: "article", fa: "مراقبت‌های بعد از جراحی بینی", en: "Care after rhinoplasty", quality: 0.4, url: "/blog/nose-care" },
];

const fold = (value: string) =>
  value.normalize("NFKC").replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").toLowerCase().replace(/\s+/g, " ").trim();

async function embedPassages(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${process.env.EMBEDDING_URL ?? "http://127.0.0.1:8089"}/embed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ texts, kind: "passage" }),
  });
  if (!response.ok) throw new Error(`embedding service ${response.status}`);
  return ((await response.json()) as { vectors: number[][] }).vectors;
}

/** Empties search.documents and loads the catalogue above, with real embeddings when the service is up. */
export async function loadFixtures(sql: postgres.Sql, withEmbeddings: boolean) {
  await sql`truncate search.documents`;
  const texts = FIXTURES.map((f) => [f.fa, f.en, f.sub, f.extra].filter(Boolean).join("\n"));
  const vectors = withEmbeddings ? await embedPassages(texts) : null;
  for (const [index, f] of FIXTURES.entries()) {
    const title = { "fa-IR": f.fa, ...(f.en ? { "en-US": f.en } : {}) };
    const searchText = fold([f.fa, f.en, f.sub, f.extra, f.city].filter(Boolean).join(" "));
    const vector = vectors ? `[${vectors[index].join(",")}]` : null;
    await sql`
      insert into search.documents (doc_type, source_id, title, subtitle, url, city, lat, lng, price_toman, quality,
                                    search_text, content_hash, embedding, embedding_model)
      values (${f.type}, ${f.id}, ${sql.json(title)}, ${sql.json(f.sub ? { "fa-IR": f.sub } : {})}, ${f.url}, ${f.city ?? null},
              ${f.lat ?? null}, ${f.lng ?? null}, ${f.price ?? null}, ${f.quality ?? 0.5}, ${searchText},
              ${createHash("sha256").update(searchText).digest("hex")}, ${vector}::halfvec,
              ${vector ? "Xenova/multilingual-e5-small" : null})`;
  }
}
