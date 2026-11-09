/**
 * Static scan of which translation keys client code can read. Used by
 * `src/lib/seo/route-messages.test.ts` to prove that every page under the
 * customer app shell receives every message it renders, now that the large
 * namespaces are handed out per route (see `ROUTE_NAMESPACES` in
 * client-messages.ts). Node-only: never import this from application code.
 */
import fs from "node:fs";
import path from "node:path";

const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

export type KeyUse = {
  /** Namespace, e.g. "Consultation". */
  namespace: string;
  /** Top-level key under the namespace, or "*" when the whole namespace may be read. */
  topKey: string;
  file: string;
};

export function createScanner(srcDir: string) {
  const fileCache = new Map<string, string>();
  const read = (file: string) => {
    let text = fileCache.get(file);
    if (text === undefined) {
      text = fs.readFileSync(file, "utf8");
      fileCache.set(file, text);
    }
    return text;
  };

  function resolveImport(from: string, spec: string): string | null {
    let base: string;
    if (spec.startsWith("@/")) base = path.join(srcDir, spec.slice(2));
    else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
    else return null;
    const candidates = [
      base,
      ...EXTENSIONS.map((ext) => base + ext),
      ...EXTENSIONS.map((ext) => path.join(base, "index" + ext)),
    ];
    for (const candidate of candidates) {
      if (/\.(tsx?|jsx?)$/.test(candidate) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
    return null;
  }

  const depCache = new Map<string, string[]>();
  function dependencies(file: string): string[] {
    const cached = depCache.get(file);
    if (cached) return cached;
    const source = read(file);
    const deps: string[] = [];
    const pattern =
      /(?:import|export)\s[^'"`;]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|^\s*import\s+['"]([^'"]+)['"]/gm;
    for (const match of source.matchAll(pattern)) {
      const resolved = resolveImport(file, match[1] || match[2] || match[3]);
      if (resolved) deps.push(resolved);
    }
    depCache.set(file, deps);
    return deps;
  }

  /** Every module statically or dynamically imported from `entry`, including itself. */
  function reachable(entry: string): Set<string> {
    const seen = new Set<string>();
    const stack = [entry];
    while (stack.length) {
      const file = stack.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      stack.push(...dependencies(file));
    }
    return seen;
  }

  /** The string value of `NAME` in this file or the module it is imported from. */
  function constantValue(file: string, name: string, depth = 0): string | null {
    const source = read(file);
    const local = source.match(new RegExp(`(?:const|let)\\s+${name}\\s*(?::[^=]+)?=\\s*['"\`]([^'"\`]*)['"\`]`));
    if (local) return local[1];
    if (depth > 3) return null;
    const imported = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]([^'"]+)['"]/g)].find((m) =>
      m[1].split(",").some((part) => part.trim().split(/\s+as\s+/).pop() === name)
    );
    if (!imported) return null;
    const target = resolveImport(file, imported[2]);
    return target ? constantValue(target, name, depth + 1) : null;
  }

  const useCache = new Map<string, KeyUse[]>();
  /**
   * Keys read through `useTranslations(...)` in one file. `getTranslations` is
   * ignored: it runs on the server against the full catalog. A translator whose
   * key is not a string literal, or which is handed to other code, counts as
   * reading its whole scope.
   */
  function keyUses(file: string): KeyUse[] {
    const cached = useCache.get(file);
    if (cached) return cached;
    const source = read(file);
    const uses: KeyUse[] = [];
    const add = (scope: string, key: string | null) => {
      const parts = scope.split(".").filter(Boolean);
      const namespace = parts[0];
      if (!namespace) return;
      const rest = [...parts.slice(1), ...(key === null ? [] : key.split("."))];
      uses.push({ namespace, topKey: rest[0] || "*", file });
    };

    const bindings = [
      ...source.matchAll(
        /(?:const|let)\s+(\w+)\s*=\s*useTranslations\(\s*(?:(['"`])([^'"`]*)\2|([A-Za-z_$][\w$]*))?\s*\)/g
      ),
    ];
    for (const [index, binding] of bindings.entries()) {
      const variable = binding[1];
      const scope = binding[3] ?? (binding[4] ? constantValue(file, binding[4]) : "");
      if (scope === null) {
        uses.push({ namespace: `<unresolved ${binding[4]}>`, topKey: "*", file });
        continue;
      }
      // Several components in one file often each bind `t`; a binding's calls
      // end where the next binding of the same name starts.
      const next = bindings.slice(index + 1).find((other) => other[1] === variable);
      const body = source.slice(binding.index! + binding[0].length, next ? next.index : undefined);
      // Not `border-t`, `{ t: … }` or `obj.t`: only the translator itself.
      for (const occurrence of body.matchAll(new RegExp(`(?<![\\w$.-])${variable}\\b(?![-\\s]*[:-])`, "g"))) {
        const after = body.slice(occurrence.index! + variable.length);
        const call = after.match(/^(?:\.(?:rich|markup|raw|has))?\(\s*/);
        if (!call) {
          add(scope, null); // passed along or stored: assume any key
          continue;
        }
        const arg = after.slice(call[0].length);
        // `t(('mealPlan.' + code + '.name') as never)` reads under "mealPlan".
        const literal = arg.match(/^\(*\s*(?:(['"])([^'"]*)\1|`([^`$]*))/);
        if (!literal) {
          add(scope, null);
          continue;
        }
        let text = literal[2] ?? literal[3] ?? "";
        const continued =
          literal[3] !== undefined
            ? arg[literal[0].length] === "$"
            : /^\s*\+/.test(arg.slice(literal[0].length));
        // Only the complete segments of a built key are known: `mealPlan.${code}`
        // and 'status_' + code read under "mealPlan" and anywhere, respectively.
        if (continued) text = text.includes(".") ? text.slice(0, text.lastIndexOf(".")) : "";
        const key = text;
        add(scope, key === "" ? null : key);
      }
    }
    useCache.set(file, uses);
    return uses;
  }

  return { reachable, keyUses, resolveImport };
}
