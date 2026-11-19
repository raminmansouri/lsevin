"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";

import sql from "@/config/database/db";
import { adminMay, getAdminContext } from "@/lib/auth/admin-guard";

const HeroArchSchema = z.object({
  slot: z.number().int().min(1).max(3),
  imageUrl: z.string().trim().max(2048),
  label: z.object({ translations: z.record(z.string(), z.string().max(80)) }),
  linkUrl: z
    .string()
    .trim()
    .max(500)
    .refine((value) => value === "" || (value.startsWith("/") && !value.startsWith("//"))),
});

export type HeroArchFormInput = z.infer<typeof HeroArchSchema>;

export async function saveHeroArchAction(
  input: HeroArchFormInput
): Promise<{ ok: true } | { ok: false; error: "forbidden" | "invalid" }> {
  const adminCtx = await getAdminContext();
  if (!adminMay(adminCtx, "editorial")) return { ok: false, error: "forbidden" };

  const parsed = HeroArchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const data = parsed.data;

  const translations = Object.fromEntries(
    Object.entries(data.label.translations)
      .map(([key, value]) => [key, value.trim()])
      .filter(([, value]) => value)
  );

  await sql`
    update marketing.home_hero_arches
       set image_url = ${data.imageUrl || null},
           label_translations = ${sql.json(translations as never)},
           link_url = ${data.linkUrl || null},
           updated_at = now()
     where slot = ${data.slot}
  `;

  revalidatePath("/[locale]", "page");
  revalidatePath("/[locale]/admin/home-sections/hero", "page");
  return { ok: true };
}