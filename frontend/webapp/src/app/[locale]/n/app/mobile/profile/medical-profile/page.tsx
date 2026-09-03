import { notFound } from "next/navigation";

/**
 * The medical profile is deactivated.
 *
 * Hiding the row in the profile menu is not enough on its own — the URL was public and
 * is in browser histories, so the route has to refuse on its own. This 404s before any
 * database work happens, which also means the page stops reading medical data entirely
 * rather than fetching it and declining to render it.
 *
 * Nothing else was removed: `queries.ts`, `actions.ts`, `storage.ts`, `types.ts`,
 * `utils.ts` and `MedicalProfilePageClient.tsx` are untouched, so re-enabling is this
 * file plus the menu row in `../page.tsx`:
 *
 *   import sql from "@/config/database/db";
 *   import { requireAuthenticatedUserId } from "./auth";
 *   import MedicalProfilePageClient from "./MedicalProfilePageClient";
 *   import { getMedicalProfilePageData } from "./queries";

export const dynamic = "force-dynamic";
 *
 *   export default async function MedicalProfilePage() {
 *     const identityUserId = await requireAuthenticatedUserId();
 *     const data = await getMedicalProfilePageData(sql, identityUserId);
 *     return <MedicalProfilePageClient initialData={data} />;
 *   }
 */
export default async function MedicalProfilePage() {
  notFound();
}
