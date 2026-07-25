/**
 * Stand-in for the `server-only` package under Vitest.
 *
 * The real package throws on import outside a React Server Component. That guard is
 * correct in the build and must stay, but Vitest has no RSC runtime, so importing any
 * server module would fail before a test could run. vitest.config.ts aliases
 * `server-only` here; nothing else should import this file.
 */
export {};
