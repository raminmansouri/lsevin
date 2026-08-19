export type OperatingHour = { id: string; dayOfWeek: number; opensAt: string | null; closesAt: string | null; isClosed: boolean; slotIntervalMinutes: number };
export type BookableResource = { id: string; nameTranslations: Record<string, string>; resourceType: string; totalCapacity: number; isActive: boolean; providerServiceId: string | null };
export type AvailabilityRule = { id: string; targetType: string; targetId: string; resourceName: string | null; dayOfWeek: number | null; specificDate: string | null; startsAt: string | null; endsAt: string | null; isAvailable: boolean; capacity: number | null; slotIntervalMinutes: number | null; isActive: boolean };

export type AdminAvailabilityRuleItem = {
  id: string;
  providerId: string;
  providerName: string;
  providerActive: boolean;
  targetType: string;
  targetId: string;
  targetName: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  startsAt: string | null;
  endsAt: string | null;
  isAvailable: boolean;
  capacity: number | null;
  slotIntervalMinutes: number | null;
  timezoneId: string;
  isActive: boolean;
  lastModifiedAt: string;
};

export type AdminResourceItem = {
  id: string;
  providerId: string;
  providerName: string;
  serviceName: string | null;
  resourceName: string;
  resourceType: string;
  totalCapacity: number;
  isActive: boolean;
  lastModifiedAt: string;
};

export type AdminOperatingHourItem = {
  id: string;
  providerId: string;
  providerName: string;
  dayOfWeek: number;
  opensAt: string | null;
  closesAt: string | null;
  isClosed: boolean;
  slotIntervalMinutes: number;
  lastModifiedAt: string;
};

export type AdminAvailabilitySummary = {
  rulesTotal: number;
  rulesActive: number;
  rulesInactive: number;
  unavailableRules: number;
  resourcesActive: number;
  closedOperatingHours: number;
};

export type AvailabilityAdminActionItem = {
  id: string;
  entityId: string;
  action: string;
  reason: string | null;
  actorName: string;
  createdAt: string;
};
