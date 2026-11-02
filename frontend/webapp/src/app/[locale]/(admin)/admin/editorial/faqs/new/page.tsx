import type { Metadata } from "next";

import { FaqForm } from "@/features/site-content/components/admin/faq-form";
import { FAQ_SCOPES, type FaqScope } from "@/features/site-content/types";

export const metadata: Metadata = { title: "New FAQ" };

export default async function AdminNewFaqPage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const { scope } = await searchParams;
  const initialScope = (FAQ_SCOPES as readonly string[]).includes(scope ?? "") ? (scope as FaqScope) : undefined;
  return <FaqForm initialScope={initialScope} />;
}
