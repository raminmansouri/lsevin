import { ColumnMetadata } from "./core/db-introspection";
import { adminLocales } from "./config";
import { AdminFieldKind } from "./types";

const IMAGE_NAMES = ["image", "avatar", "thumbnail", "cover"];
const FILE_NAMES = ["file", "document", "attachment"];

export function isTranslationColumn(column: ColumnMetadata) {
  return (
    (column.columnName.endsWith("_translations") || column.columnName.endsWith("_translation")) &&
    (column.dataType === "json" || column.dataType === "jsonb" || column.udtName === "jsonb" || column.udtName === "json")
  );
}

export function inferFieldKind(column: ColumnMetadata): AdminFieldKind {
  const name = column.columnName.toLowerCase();
  const dataType = column.dataType.toLowerCase();
  const udt = column.udtName.toLowerCase();

  if (isTranslationColumn(column)) return "multilingual";
  if (column.manyToOne.length > 0 || name.endsWith("_id")) return "relation";
  if (column.isEnum) return "enum";
  if (dataType === "boolean" || name.startsWith("is_") || name.startsWith("has_")) return "boolean";
  if (dataType === "json" || dataType === "jsonb" || udt === "json" || udt === "jsonb") return "json";
  if (dataType.includes("timestamp")) return "datetime";
  if (dataType === "date") return "date";
  if (dataType.startsWith("time")) return "time";
  if (["smallint", "integer", "bigint", "numeric", "decimal", "real", "double precision"].includes(dataType)) {
    return "number";
  }

  if (IMAGE_NAMES.some((token) => name.includes(token)) && name.endsWith("_url")) return "image";
  if (FILE_NAMES.some((token) => name.includes(token)) && name.endsWith("_url")) return "file";
  if (["description", "content", "body", "bio", "notes"].some((token) => name.includes(token))) return "textarea";

  return "text";
}

export function inferFieldLabel(columnName: string) {
  return columnName
    .replace(/_translations$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (x) => x.toUpperCase());
}

export function inferDisplayField(columns: ColumnMetadata[]) {
  const ranked = [
    "display_name_translations",
    "name_translations",
    "title_translations",
    "display_name",
    "name",
    "title",
    "slug",
    "code",
    "id",
  ];

  for (const candidate of ranked) {
    const found = columns.find((c) => c.columnName === candidate);
    if (found) return found.columnName;
  }

  const textColumn = columns.find((c) =>
    ["text", "character varying", "character"].includes(c.dataType.toLowerCase())
  );
  return textColumn?.columnName ?? columns[0]?.columnName ?? "id";
}

export function inferSearchableFields(columns: ColumnMetadata[]) {
  return columns
    .filter((c) => {
      const t = c.dataType.toLowerCase();
      return (
        isTranslationColumn(c) ||
        ["text", "character varying", "character", "uuid"].includes(t) ||
        ["varchar", "bpchar", "text", "uuid"].includes(c.udtName.toLowerCase())
      );
    })
    .slice(0, 5)
    .map((c) => c.columnName);
}

export function inferLocales(columnName: string) {
  if (!columnName.endsWith("_translations")) return undefined;
  return adminLocales.supported;
}
