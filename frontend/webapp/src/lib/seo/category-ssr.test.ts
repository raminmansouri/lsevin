import React from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";

import { CategoryBrowserClient } from "@/features/service-providers/components/categories/category-browser-client";

vi.mock("next/navigation", () => ({
  useSearchParams: () => {
    throw new Promise(() => {});
  },
}));
vi.mock("next-intl", () => ({ useLocale: () => "fa", useTranslations: () => (key: string) => key }));
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

function category(overrides: Record<string, unknown>) {
  return {
    id: "019c236f-93f9-12c7-b5c0-3b73f3e3cf69",
    slug: "public-care",
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
    ...overrides,
  };
}

function render(categories: ReturnType<typeof category>[], parentId: string | null = null) {
  return renderToString(
    React.createElement(CategoryBrowserClient, {
      categoryGroups: [{ id: "group", title: "Care categories", categories }],
      totalCategories: categories.length,
      totalProviders: 2,
      parentId,
    } as never)
  );
}

const hrefs = (html: string) => [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);

it("emits catalog headings and links even when request URL state suspends during ISR", () => {
  const html = render([category({})]);
  expect(html).toContain("Public care category");
  expect(html).toContain("<h3");
  expect(html).toContain("<a");
  // A category without subcategories links to its providers by slug.
  expect(hrefs(html)).toContain("/categories/public-care/providers");
});

// Reported 2026-11-10: the home shelf and the browser linked /categories?parent=<uuid>
// and /map?categoryId=<uuid>&view=list.
it("links categories by slug, never by id in the query", () => {
  const root = category({ id: "019c2387-4640-f177-36f4-ddbdf681e6cd", slug: "accommodation", name: "Accommodation", childCount: 1, count: 5 });
  const child = category({ id: "019c23b5-72a4-abd9-2d5a-3278b64712c0", slug: "hotel", name: "Hotel", parentId: root.id, count: 5 });

  const top = hrefs(render([root, child]));
  expect(top).toContain("/categories/accommodation");

  const opened = hrefs(render([root, child], root.id));
  expect(opened).toContain("/categories/hotel/providers");
  expect(opened).toContain("/categories/accommodation/providers");
  expect(opened).toContain("/categories");

  for (const href of [...top, ...opened]) {
    expect(href).not.toMatch(/[?&](parent|categoryId|providerTypeId)=/);
    expect(href).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
  }
});
