<<<<<<< HEAD
import { AxiosRequestConfig, AxiosResponse } from "axios";
=======
import axios, {
  AxiosRequestConfig,
  AxiosRequestHeaders,
  AxiosResponse,
} from "axios";
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

// ---------- Logging helpers ----------

type LogFormat = "curl" | "node-fetch" | "both";

type AxiosLogOptions = {
  enabled?: boolean;
  format?: LogFormat;
  redactHeaders?: string[];
  redactBodyKeys?: string[];
  maxBodyLength?: number;
};

const DEFAULT_AXIOS_LOG_OPTIONS: Required<AxiosLogOptions> = {
  enabled: true,
  format: "curl",
<<<<<<< HEAD
=======
//   redactHeaders: ["authorization", "cookie", "set-cookie"],
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  redactHeaders: [],
  redactBodyKeys: ["password", "token", "accessToken", "refreshToken"],
  maxBodyLength: 10_000,
};

const normalizeHeaderName = (h: string) => h.toLowerCase();

function redactHeadersObj(
  headers: Record<string, any>,
  redactList: string[]
): Record<string, string> {
  const redactSet = new Set(redactList.map(normalizeHeaderName));
  const out: Record<string, string> = {};
<<<<<<< HEAD

  for (const [k, v] of Object.entries(headers ?? {})) {
    const key = String(k);
    out[key] = redactSet.has(normalizeHeaderName(key))
      ? "<redacted>"
      : String(v);
  }

=======
  for (const [k, v] of Object.entries(headers ?? {})) {
    const key = String(k);
    out[key] = redactSet.has(normalizeHeaderName(key)) ? "<redacted>" : String(v);
  }
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  return out;
}

function redactJsonKeys(value: any, redactKeys: string[]): any {
  const redactSet = new Set(redactKeys);
<<<<<<< HEAD

  const walk = (v: any): any => {
    if (Array.isArray(v)) return v.map(walk);

=======
  const walk = (v: any): any => {
    if (Array.isArray(v)) return v.map(walk);
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    if (v && typeof v === "object") {
      const out: any = {};
      for (const [k, val] of Object.entries(v)) {
        out[k] = redactSet.has(k) ? "<redacted>" : walk(val);
      }
      return out;
    }
<<<<<<< HEAD

    return v;
  };

=======
    return v;
  };
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  return walk(value);
}

function escapeSingleQuotes(s: string) {
  return s.replace(/'/g, `'\\''`);
}

function buildCurl(
  fullUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: string
) {
<<<<<<< HEAD
  const parts: string[] = [
    `curl -i -X ${method.toUpperCase()} '${escapeSingleQuotes(fullUrl)}'`,
  ];
=======
  const parts: string[] = [`curl -i -X ${method.toUpperCase()} '${escapeSingleQuotes(fullUrl)}'`];
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

  for (const [k, v] of Object.entries(headers)) {
    parts.push(`-H '${escapeSingleQuotes(`${k}: ${v}`)}'`);
  }

  if (body && body.length > 0) {
    parts.push(`--data-raw '${escapeSingleQuotes(body)}'`);
  }

  return parts.join(" \\\n  ");
}

function buildNodeFetch(
  fullUrl: string,
  method: string,
  headers: Record<string, string>,
  body?: string
) {
  const headersJson = JSON.stringify(headers, null, 2);
<<<<<<< HEAD
  const bodyLine =
    body && body.length > 0 ? `  body: ${JSON.stringify(body)},\n` : "";

=======
  const bodyLine = body && body.length > 0 ? `  body: ${JSON.stringify(body)},\n` : "";
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  return `import fetch from "node-fetch";

const res = await fetch(${JSON.stringify(fullUrl)}, {
  method: ${JSON.stringify(method.toUpperCase())},
  headers: ${headersJson},
${bodyLine}});
console.log(res.status, await res.text());
`;
}

function resolveFullUrl(config: AxiosRequestConfig): string {
  const baseURL = config.baseURL ?? "";
  const url = config.url ?? "";
<<<<<<< HEAD

  const full = new URL(
    url,
    baseURL ||
      (typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost")
  );

  if (config.params && typeof config.params === "object") {
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null) {
        full.searchParams.set(k, String(v));
      }
    }
  }

  return full.toString();
}

function stringifyBodySafe(
  data: any,
  opts: Required<AxiosLogOptions>
): string | undefined {
  if (data === undefined || data === null) return undefined;

=======
  const full = new URL(url, baseURL || (typeof window !== "undefined" ? window.location.origin : "http://localhost"));
  // append params
  if (config.params && typeof config.params === "object") {
    for (const [k, v] of Object.entries(config.params)) {
      if (v !== undefined && v !== null) full.searchParams.set(k, String(v));
    }
  }
  return full.toString();
}

function stringifyBodySafe(data: any, opts: Required<AxiosLogOptions>): string | undefined {
  if (data === undefined || data === null) return undefined;

  // If caller already JSON.stringify()'d it, keep it but still redact keys if JSON
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      const redacted = redactJsonKeys(parsed, opts.redactBodyKeys);
      let s = JSON.stringify(redacted);
<<<<<<< HEAD
      if (s.length > opts.maxBodyLength) {
        s = s.slice(0, opts.maxBodyLength) + "…<truncated>";
      }
      return s;
    } catch {
      let s = data;
      if (s.length > opts.maxBodyLength) {
        s = s.slice(0, opts.maxBodyLength) + "…<truncated>";
      }
=======
      if (s.length > opts.maxBodyLength) s = s.slice(0, opts.maxBodyLength) + "…<truncated>";
      return s;
    } catch {
      // not JSON string
      let s = data;
      if (s.length > opts.maxBodyLength) s = s.slice(0, opts.maxBodyLength) + "…<truncated>";
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      return s;
    }
  }

<<<<<<< HEAD
  if (typeof data === "object") {
    const redacted = redactJsonKeys(data, opts.redactBodyKeys);
    let s = JSON.stringify(redacted);
    if (s.length > opts.maxBodyLength) {
      s = s.slice(0, opts.maxBodyLength) + "…<truncated>";
    }
=======
  // Raw object -> redact then stringify
  if (typeof data === "object") {
    const redacted = redactJsonKeys(data, opts.redactBodyKeys);
    let s = JSON.stringify(redacted);
    if (s.length > opts.maxBodyLength) s = s.slice(0, opts.maxBodyLength) + "…<truncated>";
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
    return s;
  }

  return String(data);
}

<<<<<<< HEAD
export function logAxiosRequest(
  config: AxiosRequestConfig,
  options?: AxiosLogOptions
) {
=======
export function logAxiosRequest(config: AxiosRequestConfig, options?: AxiosLogOptions) {
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  const o = { ...DEFAULT_AXIOS_LOG_OPTIONS, ...(options ?? {}) };
  if (!o.enabled) return;

  const fullUrl = resolveFullUrl(config);
  const method = (config.method ?? "GET").toUpperCase();

  const headers = redactHeadersObj(
    (config.headers ?? {}) as Record<string, any>,
    o.redactHeaders
  );

  const body = stringifyBodySafe(config.data, o);

  const stamp = new Date().toISOString();
<<<<<<< HEAD

  if (o.format === "curl" || o.format === "both") {
    console.log(
      `\n[HTTP REQUEST ${stamp}] cURL:\n${buildCurl(
        fullUrl,
        method,
        headers,
        body
      )}\n`
    );
  }

  if (o.format === "node-fetch" || o.format === "both") {
    console.log(
      `\n[HTTP REQUEST ${stamp}] Node fetch:\n${buildNodeFetch(
        fullUrl,
        method,
        headers,
        body
      )}\n`
    );
  }
}

export function logAxiosResponse(
  response: AxiosResponse,
  options?: AxiosLogOptions
) {
  const o = { ...DEFAULT_AXIOS_LOG_OPTIONS, ...(options ?? {}) };
  if (!o.enabled) return;

  const fullUrl = resolveFullUrl(response.config);
  const method = (response.config.method ?? "GET").toUpperCase();

  const requestHeaders = redactHeadersObj(
    (response.config.headers ?? {}) as Record<string, any>,
    o.redactHeaders
  );

  const responseHeaders = redactHeadersObj(
    (response.headers ?? {}) as Record<string, any>,
    o.redactHeaders
  );

  const requestBody = stringifyBodySafe(response.config.data, o);
  const responseBody = stringifyBodySafe(response.data, o);

  const stamp = new Date().toISOString();

  console.log(`\n[HTTP RESPONSE ${stamp}]`, {
    url: fullUrl,
    method,
    status: response.status,
    statusText: response.statusText,
    requestHeaders,
    requestBody,
    responseHeaders,
    responseBody,
  });
}

=======
  if (o.format === "curl" || o.format === "both") {
    console.log(`\n[HTTP LOG ${stamp}] cURL:\n${buildCurl(fullUrl, method, headers, body)}\n`);
  }
  if (o.format === "node-fetch" || o.format === "both") {
    console.log(`\n[HTTP LOG ${stamp}] Node fetch:\n${buildNodeFetch(fullUrl, method, headers, body)}\n`);
  }
}

>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
export function logAxiosError(error: any, options?: AxiosLogOptions) {
  const o = { ...DEFAULT_AXIOS_LOG_OPTIONS, ...(options ?? {}) };
  if (!o.enabled) return;

  const cfg: AxiosRequestConfig | undefined = error?.config;
<<<<<<< HEAD
  if (cfg) {
    logAxiosRequest(cfg, o);
  }

  const status = error?.response?.status;
  const data = error?.response?.data;
  const headers = error?.response?.headers;

  console.log("\n[HTTP ERROR]", {
    status,
    message: error?.message,
    responseHeaders: redactHeadersObj(headers ?? {}, o.redactHeaders),
    response:
      typeof data === "string"
        ? data.slice(0, 2000)
        : redactJsonKeys(data, o.redactBodyKeys),
=======
  if (cfg) logAxiosRequest(cfg, o);

  const status = error?.response?.status;
  const data = error?.response?.data;

  // Keep this short: enough to debug, not enough to leak everything.
  console.log("[HTTP ERROR]", {
    status,
    message: error?.message,
    response: typeof data === "string" ? data.slice(0, 2000) : data,
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
  });
}