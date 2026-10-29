import React from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    throw new Promise(() => {});
  },
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  Link: ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children),
}));
vi.mock("@/config/env/client", () => ({
  env: { NEXT_PUBLIC_FILES_URL: "https://files.example" },
}));
vi.mock("@/components/editor/lexical-renderer", () => ({
  hasLexicalContent: () => false,
  LexicalRenderer: () => null,
}));
vi.mock("@/components/ui/image-with-fallback", () => ({
  ImageWithFallback: () => null,
}));

it("emits catalog headings and links even when request URL state suspends during ISR", () => {
  const html = renderToString(
    React.createElement(CategoryBrowserClient, {
      categoryGroups: [
        {
          id: "group",
          title: "Care categories",
          categories: [
            {
              id: "fixture",
              name: "Public care category",
              description: "",
              image: null,
              icon: null,
              iconUrl: null,
              gradient: null,
              parentId: null,
              childCount: 0,
              count: 2,
              displayOrder: 0,
            },
          ],
        },
      ],
      totalCategories: 1,
      totalProviders: 2,
    })
  );
  expect(html).toContain("Public care category");
  expect(html).toContain("<h3");
  expect(html).toContain("<a");
  expect(html).toContain("fixture");
});
