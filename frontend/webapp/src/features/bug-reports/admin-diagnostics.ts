export type AdminDiagnosticEntry = {
  level: "error" | "warning";
  message: string;
  timestamp: string;
  source?: string;
};

const SECRET_PATTERN =
  /(authorization|cookie|password|secret|token|api[-_]?key)\s*[:=]\s*([^\s,;]+)/gi;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_ENTRIES = 30;

export function redactDiagnosticText(value: unknown): string {
  const text =
    value instanceof Error
      ? `${value.name}: ${value.message}`
      : String(value ?? "");
  return text
    .replace(SECRET_PATTERN, "$1=[redacted]")
    .slice(0, MAX_MESSAGE_LENGTH);
}

export function normalizeDiagnosticEntries(
  entries: AdminDiagnosticEntry[]
): AdminDiagnosticEntry[] {
  return entries.slice(-MAX_ENTRIES).map((entry) => ({
    level: entry.level === "warning" ? "warning" : "error",
    message: redactDiagnosticText(entry.message),
    timestamp: entry.timestamp,
    ...(entry.source ? { source: redactDiagnosticText(entry.source) } : {}),
  }));
}
