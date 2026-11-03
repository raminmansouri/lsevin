import "server-only";

import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { getSession } from "@/lib/auth/session";

import { getSignedInDoctor, type SignedInDoctor } from "./doctor-guard";

/**
 * For the panel's pages: the signed-in GP, or a redirect — to sign-in (and back
 * here) for a guest, to the home page for anyone without the GP role.
 */
export async function requireDoctorForRoute(returnPath: string): Promise<SignedInDoctor> {
  const locale = await getLocale();
  const doctor = await getSignedInDoctor();
  if (doctor) return doctor;

  const session = await getSession({ redirectToLogin: false, adminRequired: false });
  if (!session?.user?.id) {
    return redirect({
      href: `/sign-in?redirectTo=${encodeURIComponent(`/${locale}${returnPath}`)}`,
      locale,
    });
  }
  return redirect({ href: "/", locale });
}
