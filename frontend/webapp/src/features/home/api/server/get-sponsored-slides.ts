// src/features/explore/data/get-sponsored-slides.ts
import sql from "@/config/database/db";
import "server-only";

// Change this import to your actual postgres.js client path
// import { sql } from "@/lib/postgres";

export type SponsoredSlide = {
  id: string;
  link: string | null;
  url: string;
  mediaType: "image" | "video" | "gif";
};

function normalizeMediaType(value: string | null | undefined): SponsoredSlide["mediaType"] {
  const v = (value ?? "").trim().toLowerCase();

  if (v === "video") return "video";
  if (v === "gif") return "gif";
  return "image";
}

export async function getSponsoredSlides(): Promise<SponsoredSlide[]> {
  const rows = await sql<{
    id: string;
    link: string | null;
    url: string;
    media_type: string | null;
  }[]>`
    SELECT
      s.id,
      NULLIF(BTRIM(s.link), '') AS link,
      s.url,
      mt.name AS media_type
    FROM media.sponsered_slider s
    LEFT JOIN media.media_type mt
      ON mt.id = s.media_type_id
    WHERE NULLIF(BTRIM(s.url), '') IS NOT NULL
    ORDER BY s.id DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    link: row.link,
    url: row.url,
    mediaType: normalizeMediaType(row.media_type),
  }));
}