"use server";

import { getLocale } from "next-intl/server";

import type { VideoConsultationOffer } from "../types";
import { listBookableDoctors, loadOfferContext, summarizePackages } from "./doctor-offers";
import { consultationSchemaExists } from "./repository";
import { videoDoctorsTableExists } from "./video-doctors-repository";

const HIDDEN: VideoConsultationOffer = { enabled: false, durationMinutes: 0, priceLabel: "", packages: [] };

/**
 * The home card's lengths and prices, resolved for this visitor: the packages the bookable
 * doctors offer (20, 45 and 60 minutes from the clinics in the provider portal), each from its
 * lowest price, in toman for Iranians and dollars for everyone else. Read on the client after
 * load because the home page is static: resolving the visitor here (phone, IP, locale) would
 * make the whole page dynamic.
 */
export async function getVideoConsultationOfferAction(): Promise<VideoConsultationOffer> {
  try {
    if (!(await consultationSchemaExists()) || !(await videoDoctorsTableExists())) return HIDDEN;
    const ctx = await loadOfferContext(await getLocale());
    if (!ctx.enabled) return HIDDEN;
    const packages = summarizePackages(ctx, await listBookableDoctors(ctx));
    if (!packages.length) return HIDDEN;
    return { enabled: true, durationMinutes: packages[0].minutes, priceLabel: packages[0].priceLabel, packages };
  } catch (error) {
    console.error("[consultation] video offer failed", error);
    return HIDDEN;
  }
}
