export type ThemePreference = "system" | "light" | "dark";
export type DistanceUnit = "km" | "mi";

export type SettingsOverview = {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumberCountryCode: string;
    phoneNumber: string;
    profileConfirmed: boolean;
  };
  preferences: {
    preferredLocale: string;
    preferredCurrencyCode: string;
    preferredTheme: ThemePreference;
    distanceUnit: DistanceUnit;
    notificationsEnabled: boolean;
    marketingNotificationsEnabled: boolean;
    useCurrentLocation: boolean;
    selectedCountryName: string | null;
    selectedCityName: string | null;
  };
  summary: {
    unreadNotifications: number;
    favoritesCount: number;
    hasWallet: boolean;
    availableWalletAmount: string | null;
    referralCode: string | null;
  };
};

export type UpdatePreferencesInput = {
  preferredLocale: string;
  preferredCurrencyCode: string;
  preferredTheme: ThemePreference;
  distanceUnit: DistanceUnit;
  notificationsEnabled: boolean;
  marketingNotificationsEnabled: boolean;
  useCurrentLocation: boolean;
};
