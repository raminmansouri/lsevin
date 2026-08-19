import type { EntityReference } from "@core/modules/contracts";

export type BookingManagementEntity = {
  id: string;
  source?: EntityReference;
  status?: string;
  metadata?: Record<string, unknown>;
};
