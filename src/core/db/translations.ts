import { sql } from "@core/db/client";

export function translationSql(column: any, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  return sql`common.get_translation_t(${column}, ${locale}, 'en-US')`;
}
