import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";
import reactPlugin from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "out/**",
      ".turbo/**",
      "storybook-static/**",

      "**/coverage/**",
      "**/tsconfig.tsbuildinfo",

      // Environment files
      ".env",
      ".env.*",
      "**/.env",
      "**/.env.*",

      // Test files and directories
      "**/*.test.*",
      "**/*.spec.*",
      "**/__tests__/**",
      "**/tests/**",
      "**/test/**",
      "**/cypress/**",
      "**/e2e/**",
      "**/*.stories.tsx",
    ],
  },
  {
    extends: compat.extends("prettier", "next/core-web-vitals"),
    plugins: {
      react: reactPlugin,
      "react-compiler": reactCompiler,
      "react-hooks": reactHooksPlugin,
      "@typescript-eslint": tsPlugin,
      boundaries,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
      "boundaries/include": ["src/**/*"],

      "boundaries/elements": [
        {
          mode: "full",
          type: "shared",

          pattern: [
            "src/components/**/*",
            "src/data/**/*",
            "src/hooks/**/*",
            "src/providers/**/*",
            "src/stores/**/*",
            "src/lib/**/*",
            "src/services/**/*",
            "src/config/**/*",
            "src/types/**/*",
            "src/utils/**/*",
            "src/i18n/**/*",
            "src/features/shared/**/*",
            "src/middleware.ts",
            "src/instrumentation-client.ts",
            "src/instrumentation.ts",
            "src/instrumentation.js",
            "src/stories/**/*",
          ],
        },
        {
          mode: "full",
          type: "feature",
          capture: ["featureName"],
          pattern: ["src/features/*/**/*"],
        },
        {
          mode: "full",
          type: "app",
          capture: ["_", "fileName"],
          pattern: ["src/app/**/*"],
        },
      ],
    },

    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-compiler/react-compiler": "error",
      "boundaries/no-unknown": ["error"],
      "boundaries/no-unknown-files": ["error"],
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",

          rules: [
            {
              from: ["shared"],
              allow: ["shared", "feature"],
            },
            {
              from: ["feature"],

              allow: [
                "shared",
                "feature", // Allow access to any feature, not just same featureName
              ],
            },
            {
              from: [["feature", { featureName: "home" }]],
              allow: ["shared", "feature"],
            },
            {
              from: ["app"],
              allow: ["shared", "feature"],
            },
            {
              from: ["app"],

              allow: [
                [
                  "app",
                  {
                    fileName: "*.css",
                  },
                ],
              ],
            },
          ],
        },
      ],
    },
  },
]);
