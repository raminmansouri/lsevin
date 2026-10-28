import { redirect } from "next/navigation";

/**
 * Referral links (`/ref/CODE`, built by the share page and sent by its share buttons)
 * land here and go on to sign-up with the code pre-filled. Sign-up then handles the
 * code exactly as if it had been typed: it parks it in the referral cookie until the
 * phone number is verified.
 */
export default async function ReferralLinkPage({ params }: { params: Promise<{ locale: string; code: string }> }) {
  const { locale, code } = await params;
  // Codes are letters, digits, "-" and "_"; anything else is dropped rather than passed on.
  const clean = decodeURIComponent(code).trim().replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40);
  redirect(clean ? `/${locale}/sign-up?ref=${encodeURIComponent(clean)}` : `/${locale}`);
}