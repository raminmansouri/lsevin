export interface FeatureFlags {}

export const getFeatureFlags = (): FeatureFlags => ({});

export const isFeatureEnabled = (feature: keyof FeatureFlags): boolean => {
  const flags = getFeatureFlags();
  return flags[feature];
};
