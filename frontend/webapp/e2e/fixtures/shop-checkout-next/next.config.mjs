import path from "node:path";
import { fileURLToPath } from "node:url";
import createNextIntlPlugin from "next-intl/plugin";

const root = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(root, "../../../src");
const repository = path.join(root, "repository.ts");
export default createNextIntlPlugin(path.join(root, "i18n.ts"))({
  experimental: { externalDir: true },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/i18n/navigation": path.join(root, "navigation.tsx"),
      "@/features/shop/components/ShopHeader": path.join(root, "header.tsx"),
      ...Object.fromEntries(
        [
          "@/features/shop/api/cart.repository",
          "@/features/shop/api/checkout.repository",
          "@/features/shop/api/address.repository",
          "@/features/shop/lib/context",
          "@/features/shop/lib/analytics",
          "../api/cart.repository",
          "../api/checkout.repository",
          "../api/address.repository",
          "../lib/context",
          "../lib/analytics",
          "../server/shop-payment.service",
        ].map((key) => [key + "$", repository])
      ),
      "@": source,
    };
    return config;
  },
});
