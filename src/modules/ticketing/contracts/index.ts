import type { EntityReference } from "@core/modules/contracts";

export type TicketingEntity = {
  id: string;
  source?: EntityReference;
  status?: string;
  metadata?: Record<string, unknown>;
};
