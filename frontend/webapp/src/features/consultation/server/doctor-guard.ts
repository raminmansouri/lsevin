import "server-only";

import { hasAppRole } from "@/lib/auth/app-roles";
import { getSession } from "@/lib/auth/session";

import { getDoctorIdForUser } from "./doctor-panel-repository";

export type SignedInDoctor = { userId: string; doctorId: string };

/**
 * The signed-in consultation GP, or null. Every panel page and action goes
 * through this, so a GP only ever reaches their own consultations.
 */
export async function getSignedInDoctor(): Promise<SignedInDoctor | null> {
  const session = await getSession({ redirectToLogin: false, adminRequired: false });
  const userId = session?.user?.id;
  if (!userId || !(await hasAppRole(userId, "consultationDoctor"))) return null;
  const doctorId = await getDoctorIdForUser(userId);
  return doctorId ? { userId, doctorId } : null;
}
