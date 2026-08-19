import { FlatCompat } from "@eslint/eslintrc";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "dist/**",
      "*.config.generated.*",
      "next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The modular repository contains validated boundary payloads and generic
      // module contracts where `any` is intentional. Type safety is enforced by
      // the mandatory zero-error `tsc --noEmit` release gate.
      "@typescript-eslint/no-explicit-any": "off",
      // Module registry helpers use `module` as a domain variable, not the Node
      // CommonJS global. Next's generic rule is a false positive in these files.
      "@next/next/no-assign-module-variable": "off",
    },
  },
];

export default config;
