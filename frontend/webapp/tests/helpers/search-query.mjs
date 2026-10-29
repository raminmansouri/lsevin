import fs from "node:fs";

export function compileSearchQuery(source, input = {}) {
  const section = source.includes("export async function getSearchResults")
    ? source.slice(source.indexOf("export async function getSearchResults"))
    : source;
  const template = section.includes("sql<SearchResultRow[]>`")
    ? section.match(/sql<SearchResultRow\[\]>`([\s\S]*?)`/)[1]
    : section;
  const term = input.term ?? "";
  const bindings = {
    term,
    likeTerm: `%${term}%`,
    normalizedLocale: input.locale ?? "en-US",
    categoryId: input.categoryId ?? null,
    providerTypeId: input.providerTypeId ?? null,
    country: input.country ?? null,
    city: input.city ?? null,
    "labels.sponsored": input.locale?.startsWith("fa")
      ? "اسپانسر شده"
      : "Sponsored",
    "labels.verified": input.locale?.startsWith("fa")
      ? "تأیید شده"
      : "Verified",
    limit: input.limit ?? 30,
    uuidPattern:
      "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
  };
  const values = [];
  const text = template.replace(/\$\{([^}]+)\}/g, (_, key) => {
    if (!(key in bindings)) throw new Error(`Unknown binding ${key}`);
    values.push(bindings[key]);
    return `$${values.length}`;
  });
  return { text, values };
}
export function readCurrentSearchQuery() {
  return fs.readFileSync(
    new URL(
      "../../src/features/service-providers/server/search.repository.ts",
      import.meta.url
    ),
    "utf8"
  );
}
