import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const stub = path.join(root, "stubs.tsx");
export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      ...[
        "@/config/env/client",
        "@/components/ui/image-with-fallback",
        "@/features/booking/components/rich-text-preview",
        "@/i18n/navigation",
        "../actions/checkout.actions",
      ].map((find) => ({ find, replacement: stub })),
      { find: "@", replacement: path.resolve(root, "../../../src") },
    ],
  },
  server: {
    host: "127.0.0.1",
    port: 3022,
    strictPort: true,
    fs: { allow: [path.resolve(root, "../../../../..")] },
  },
});
