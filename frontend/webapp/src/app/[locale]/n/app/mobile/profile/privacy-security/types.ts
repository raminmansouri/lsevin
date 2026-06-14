export type PermissionStatusValue = "unknown" | "prompt" | "granted" | "denied" | "unsupported";

export type SessionRow = {
  id: string;
  deviceName: string;
  locationLabel: string;
  isCurrent: boolean;
  lastActiveLabel: string;
};

export type PermissionSnapshot = {
  locationPermissionStatus: PermissionStatusValue;
  notificationPermissionStatus: PermissionStatusValue;
  locationPermissionSyncedAt: string | null;
  notificationPermissionSyncedAt: string | null;
};

export type PrivacySecurityPageData = {
  biometricEnabled: boolean;
  permissionSnapshot: PermissionSnapshot;
  hasPendingDeletionRequest: boolean;
  activeSessions: SessionRow[];
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
