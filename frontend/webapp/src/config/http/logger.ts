type LogFormat = "curl" | "node-fetch" | "both";

type RequestLogOptions = {
  enabled?: boolean;
  format?: LogFormat;
  redactHeaders?: string[];      // header names to redact
  redactBodyKeys?: string[];     // JSON keys to redact
  maxBodyLength?: number;        // truncate huge bodies
};

const DEFAULT_LOG_OPTIONS: Required<RequestLogOptions> = {
  enabled: true,
  format: "both",
  //redactHeaders: ["authorization", "cookie", "set-cookie"],
  redactHeaders: [],
  redactBodyKeys: ["password", "token", "accessToken", "refreshToken"],
  maxBodyLength: 10_000,
};

const normalizeHeaderName = (h: string) => h.toLowerCase();

function headersToObject(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const obj: Record<string, string> = {};
    headers.forEach((v, k) => (obj[k] = v));
    return obj;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers.map(([k, v]) => [k, v]));
  }
  return { ...headers } as Record<string, string>;
}

function redactHeaders(
  headers: Record<string, string>,
  redactList: string[]
): Record<string, string> {
  const redactSet = new Set(redactList.map(normalizeHeaderName));
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    out[k] = redactSet.has(normalizeHeaderName(k)) ? "<redacted>" : v;
  }
  return out;
}

function tryParseJson(input: unknown): unknown {
  if (typeof input !== "string") return input;
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

function redactJsonKeys(value: unknown, redactKeys: string[]): unknown {
  const redactSet = new Set(redactKeys);
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const obj = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(obj)) {
        out[k] = redactSet.has(k) ? "<redacted>" : walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(value);
}

function escapeSingleQuotes(s: string) {
  // for bash single-quoted strings: close/open and escape single quote
  return s.replace(/'/g, `'\\''`);
}

function buildCurl(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string | FormData
) {
  const parts: string[] = [`curl -i -X ${method.toUpperCase()} '${escapeSingleQuotes(url)}'`];

  for (const [k, v] of Object.entries(headers)) {
    parts.push(`-H '${escapeSingleQuotes(`${k}: ${v}`)}'`);
  }

  if (body) {
    if (body instanceof FormData) {
      // Best-effort: show a placeholder (real FormData serialization is complex)
      parts.push(`# NOTE: Body is FormData. Reproduce with -F 'key=value' parts.`);
    } else if (typeof body === "string" && body.length > 0) {
      parts.push(`--data-raw '${escapeSingleQuotes(body)}'`);
    }
  }

  return parts.join(" \\\n  ");
}

function buildNodeFetch(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: string | FormData
) {
  const headersJson = JSON.stringify(headers, null, 2);

  if (body instanceof FormData) {
    return `import fetch from "node-fetch";

const form = new FormData();
// NOTE: Fill form.append(...) entries to match the original request.

const res = await fetch(${JSON.stringify(url)}, {
  method: ${JSON.stringify(method.toUpperCase())},
  headers: ${headersJson},
  body: form
});

console.log(res.status, await res.text());
`;
  }

  const bodyLine =
    body && typeof body === "string" && body.length > 0
      ? `  body: ${JSON.stringify(body)},\n`
      : "";

  return `import fetch from "node-fetch";

const res = await fetch(${JSON.stringify(url)}, {
  method: ${JSON.stringify(method.toUpperCase())},
  headers: ${headersJson},
${bodyLine}});
console.log(res.status, await res.text());
`;
}

export function logRequest(
  fullUrl: string,
  init: RequestInit,
  body?: string | FormData,
  opts?: RequestLogOptions
) {
  const o = { ...DEFAULT_LOG_OPTIONS, ...(opts ?? {}) };
  if (!o.enabled) return;

  const method = (init.method ?? "GET").toUpperCase();
  const headersObj = headersToObject(init.headers);
  const safeHeaders = redactHeaders(headersObj, o.redactHeaders);

  let safeBody: string | FormData | undefined = body;

  if (typeof body === "string") {
    const parsed = tryParseJson(body);
    const redacted = redactJsonKeys(parsed, o.redactBodyKeys);
    safeBody = typeof redacted === "string" ? redacted : JSON.stringify(redacted);
    if (typeof safeBody === "string" && safeBody.length > o.maxBodyLength) {
      safeBody = safeBody.slice(0, o.maxBodyLength) + "…<truncated>";
    }
  }

  const curl = buildCurl(fullUrl, method, safeHeaders, safeBody);
  const nodeFetch = buildNodeFetch(fullUrl, method, safeHeaders, safeBody);

  const stamp = new Date().toISOString();
  if (o.format === "curl" || o.format === "both") {
    console.log(`\n[HTTP LOG ${stamp}] cURL:\n${curl}\n`);
  }
  if (o.format === "node-fetch" || o.format === "both") {
    console.log(`\n[HTTP LOG ${stamp}] Node fetch:\n${nodeFetch}\n`);
  }
}