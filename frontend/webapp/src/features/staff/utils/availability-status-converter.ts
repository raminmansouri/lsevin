/**
 * Converts availability status ID to translation key
 * Status mapping: Available = 1, Busy = 2, OnLeave = 3, Inactive = 4
 */
export function convertStatusIdToTranslationKey(statusId: number): string {
  const statusMapping: Record<number, string> = {
    1: "available",
    2: "busy",
    3: "onLeave",
    4: "inactive",
  };

  return statusMapping[statusId] || "available";
}

/**
 * Gets all available status options with their IDs and translation keys
 */
export function getAvailabilityStatusOptions() {
  return [
    { id: 1, translationKey: "available" },
    { id: 2, translationKey: "busy" },
    { id: 3, translationKey: "onLeave" },
    { id: 4, translationKey: "inactive" },
  ];
}
