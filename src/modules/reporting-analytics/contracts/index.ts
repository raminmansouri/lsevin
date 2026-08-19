import type { EntityReference } from "@core/modules/contracts";

export type ReportingAnalyticsEntity = {
  id: string;
  source?: EntityReference;
  status?: string;
  metadata?: Record<string, unknown>;
};
