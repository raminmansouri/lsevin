"use server";

import { getChildCollectionPanels, type ChildCollectionPanel } from "@/lib/admin/child-relations";

/**
 * Resolves the generic "service before/after" child-collection panel for a single
 * provider service, so the admin details page can render the shared
 * <OneToManyManager> scoped to the selected service.
 *
 * Reuses the metadata-driven admin pipeline: the panel is auto-derived from the
 * foreign key category.service_before_after.provider_service_id ->
 * category.provider_services.id (no per-table CRUD code required).
 */
export async function getServiceBeforeAfterPanelAction(
  providerServiceId: string,
  locale: string,
): Promise<{ ok: true; panel: ChildCollectionPanel } | { ok: false }> {
  if (!providerServiceId) return { ok: false };

  const panels = await getChildCollectionPanels({
    parentSchema: "category",
    parentTable: "provider_services",
    parentRecordId: providerServiceId,
    locale,
  });

  const panel = panels.find((item) => item.collection.table === "service_before_after");
  return panel ? { ok: true, panel } : { ok: false };
}
