import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod/v4";

import { FaqForm } from "@/features/site-content/components/admin/faq-form";
import { getAdminFaq } from "@/features/site-content/server/repository";
import { catalogDataLocale } from "@/lib/pwa/data-locale";

export const metadata: Metadata = { title: "Edit FAQ" };

export default async function AdminEditFaqPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!z.guid().safeParse(id).success) notFound();
  const faq = await getAdminFaq(id, catalogDataLocale(locale));
  if (!faq) notFound();
  return <FaqForm faq={faq} />;
}
