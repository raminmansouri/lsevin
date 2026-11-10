import "server-only";

import { formatMoney } from "@/features/finance/lib/money";
import { resolveIsIranianVisitor } from "@/features/finance/lib/server/iranian-visitor";

import type { ConsultationPackageOption, VideoConsultationSettings } from "../types";
import type { VideoDoctor, VideoDoctorProfile } from "../video-doctors-types";
import { listActiveAdminPackages } from "./doctor-packages-repository";
import { listPortalDoctors, type PortalDoctor, type PortalPackage } from "./portal-packages";
import { getVideoConsultationSettings } from "./repository";
import { listPublicVideoDoctors } from "./video-doctors-repository";

/** A package as this visitor would pay for it. */
export type PricedPackage = {
  /**
   * provider_consultations.package_prices.id for a clinic's doctor, or
   * consultation.video_doctor_packages.id for a doctor an admin registered here.
   */
  packagePriceId: string | null;
  minutes: number;
  amount: number;
  currency: string;
  priceLabel: string;
};

export type OfferContext = {
  /** The admin's on/off switch for video consultation as a whole. */
  enabled: boolean;
  isIranian: boolean;
  locale: string;
  settings: VideoConsultationSettings;
  portal: Map<string, PortalDoctor>;
  /** Active packages of the doctors an admin registered in this app. */
  admin: Map<string, PortalPackage[]>;
};

export async function loadOfferContext(locale: string): Promise<OfferContext> {
  const [settings, isIranian, portal, admin] = await Promise.all([
    getVideoConsultationSettings(),
    resolveIsIranianVisitor(),
    listPortalDoctors(),
    listActiveAdminPackages(),
  ]);
  return { enabled: settings.enabled, isIranian, locale, settings, portal, admin };
}

function label(ctx: OfferContext, amount: number, currency: string) {
  return formatMoney({ amount, currencyCode: currency }, { locale: ctx.locale });
}

/**
 * What one doctor offers this visitor: the packages switched on for them, in toman for Iranians
 * and in dollars for everyone else. A clinic's doctor (added in the provider portal) has the
 * packages the clinic set there, and none while the clinic has paused them; a doctor an admin
 * registered in this app has the packages set on the admin page.
 */
export function doctorPackages(ctx: OfferContext, videoDoctorId: string): PricedPackage[] {
  if (!ctx.enabled) return [];
  const portal = ctx.portal.get(videoDoctorId);
  if (portal && portal.status !== "active") return [];
  const packages = portal ? portal.packages : (ctx.admin.get(videoDoctorId) ?? []);
  return packages.map((pkg) => {
    const amount = ctx.isIranian ? pkg.priceToman : pkg.priceUsd;
    const currency = ctx.isIranian ? "IRT" : "USD";
    return { packagePriceId: pkg.id, minutes: pkg.minutes, amount, currency, priceLabel: label(ctx, amount, currency) };
  });
}

export function clinicOf(ctx: OfferContext, videoDoctorId: string) {
  const portal = ctx.portal.get(videoDoctorId);
  if (!portal) return { providerId: null, name: null };
  const persian = ctx.locale.toLowerCase().startsWith("fa");
  return {
    providerId: portal.providerId,
    name: (persian ? portal.providerNameFa || portal.providerNameEn : portal.providerNameEn || portal.providerNameFa) ?? null,
  };
}

function withOffer(ctx: OfferContext, doctor: VideoDoctorProfile): VideoDoctor {
  return {
    ...doctor,
    clinicName: clinicOf(ctx, doctor.id).name,
    packages: doctorPackages(ctx, doctor.id).map(({ minutes, priceLabel }) => ({ minutes, priceLabel })),
  };
}

/**
 * Doctors a patient can book: approved by an admin (active in this app) with at least one
 * priced package switched on, and for a clinic's doctor, active in the portal.
 */
export async function listBookableDoctors(ctx: OfferContext): Promise<VideoDoctor[]> {
  if (!ctx.enabled) return [];
  const doctors = await listPublicVideoDoctors(ctx.locale);
  return doctors.map((doctor) => withOffer(ctx, doctor)).filter((doctor) => doctor.packages.length > 0);
}

/**
 * The lengths on offer across these doctors, each with its lowest price. Prices are only
 * compared within one currency: the visitor's own (toman or dollars) wins when there is a choice.
 */
export function summarizePackages(ctx: OfferContext, doctors: VideoDoctor[]): ConsultationPackageOption[] {
  const wanted = ctx.isIranian ? "IRT" : "USD";
  const byMinutes = new Map<number, PricedPackage>();
  for (const doctor of doctors) {
    for (const pkg of doctorPackages(ctx, doctor.id)) {
      const current = byMinutes.get(pkg.minutes);
      const better =
        !current ||
        (pkg.currency === current.currency && pkg.amount < current.amount) ||
        (pkg.currency === wanted && current.currency !== wanted);
      if (better) byMinutes.set(pkg.minutes, pkg);
    }
  }
  return [...byMinutes.values()]
    .sort((a, b) => a.minutes - b.minutes)
    .map(({ minutes, priceLabel }) => ({ minutes, priceLabel }));
}

/**
 * The provider's doctors a patient can book now. A specialist page narrows this to that
 * specialist's own consultation when they give one; otherwise every doctor of the provider counts.
 */
export async function providerDoctors(
  ctx: OfferContext,
  providerId: string,
  staffId?: string | null
): Promise<VideoDoctor[]> {
  const doctors = (await listBookableDoctors(ctx)).filter((d) => ctx.portal.get(d.id)?.providerId === providerId);
  if (!staffId) return doctors;
  const own = doctors.filter((d) => ctx.portal.get(d.id)?.staffId === staffId);
  return own.length ? own : doctors;
}

/** The bookable consultations of one specialist (category.staff id), across every provider they consult for. */
export async function staffDoctors(ctx: OfferContext, staffId: string): Promise<VideoDoctor[]> {
  const doctors = await listBookableDoctors(ctx);
  return doctors.filter((d) => ctx.portal.get(d.id)?.staffId === staffId);
}
