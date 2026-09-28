import "server-only";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { alternatesFor, type SeoLocale } from "./alternates";
import { firstSeoPlainText } from "./plain-text";

export interface PublicMetadataFacts {
  locale: string;
  path: string;
  title?: string | null;
  descriptions?: readonly unknown[];
  image?: string | null;
  type?: "website" | "profile";
  eligibleLocales?: readonly SeoLocale[];
}

/** Callers map entity facts only; explicit locale preserves static next-intl isolation. */
export async function buildPublicMetadata(facts: PublicMetadataFacts): Promise<Metadata> {
  const alternates = alternatesFor(facts.locale, facts.path, facts.eligibleLocales);
  const t = await getTranslations({ locale: facts.locale, namespace: "LocaleLayout" });
  const title = firstSeoPlainText([facts.title, t("title"), "LSevin"], 160);
  const description = firstSeoPlainText(facts.descriptions ?? []) ||
    firstSeoPlainText([`${title} ? ${firstSeoPlainText([t("description"), title])}`]);
  const images = facts.image ? [{ url: facts.image }] : [];
  return {
    // Prevent the ancestor title template from drifting away from social titles.
    title: { absolute: title },
    description,
    alternates,
    openGraph: { title, description, url: alternates.canonical, type: facts.type ?? "website", images },
    twitter: { card: images.length ? "summary_large_image" : "summary", title, description, images },
  };
}
