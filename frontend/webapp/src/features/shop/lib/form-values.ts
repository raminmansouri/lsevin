/** Parses HTML form boolean values without treating the string "false" as true. */
export function parseFormBoolean(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return ["true", "1", "on"].includes(value.trim().toLowerCase());
}
