"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Bell,
  ChevronLeft,
  Eye,
  EyeOff,
  Fingerprint,
  Lock,
  MapPin,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  Trash2,
} from "lucide-react";

import {
  changePassword,
  requestAccountDeletion,
  revokeSession,
  syncPermissionSnapshot,
  updateBiometricEnabled,
} from "./actions";
import type { PermissionStatusValue, PrivacySecurityPageData } from "./types";
import { permissionBadgeLabel, permissionHelpText } from "./utils";

type Props = {
  initialData: PrivacySecurityPageData;
};

export default function PrivacySecurityPageClient({ initialData }: Props) {
  const t = useTranslations("MobileProfile.privacySecurity");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(initialData.biometricEnabled);
  const [deleteReason, setDeleteReason] = useState("");

  const [locationPermissionStatus, setLocationPermissionStatus] = useState<PermissionStatusValue>(initialData.permissionSnapshot.locationPermissionStatus);
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<PermissionStatusValue>(initialData.permissionSnapshot.notificationPermissionStatus);
  const [permissionLoading, setPermissionLoading] = useState<"none" | "location" | "notification" | "refresh">("none");

  function runAction(action: () => Promise<unknown>, successMessage: string) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await action();
        setMessage(successMessage);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("messages.somethingWentWrong"));
      }
    });
  }

  async function detectLocationPermission(): Promise<PermissionStatusValue> {
    if (typeof window === "undefined") return "unknown";
    if (!("navigator" in window) || !("geolocation" in navigator)) return "unsupported";

    try {
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        if (result.state === "granted" || result.state === "denied" || result.state === "prompt") {
          return result.state;
        }
      }
      return "prompt";
    } catch {
      return "prompt";
    }
  }

  async function detectNotificationPermission(): Promise<PermissionStatusValue> {
    if (typeof window === "undefined") return "unknown";
    if (!("Notification" in window)) return "unsupported";

    const state = Notification.permission;
    if (state === "granted" || state === "denied") return state;
    return "prompt";
  }

  async function syncPermissionsToServer(locationStatus: PermissionStatusValue, notificationStatus: PermissionStatusValue) {
    try {
      await syncPermissionSnapshot({
        locationPermissionStatus: locationStatus,
        notificationPermissionStatus: notificationStatus,
      });
    } catch {
      // keep UI working even if snapshot sync fails
    }
  }

  async function refreshPermissions(showSuccess = false) {
    setPermissionLoading("refresh");
    setError(null);
    try {
      const [locationStatus, notificationStatus] = await Promise.all([
        detectLocationPermission(),
        detectNotificationPermission(),
      ]);
      setLocationPermissionStatus(locationStatus);
      setNotificationPermissionStatus(notificationStatus);
      await syncPermissionsToServer(locationStatus, notificationStatus);
      if (showSuccess) setMessage(t("messages.permissionStateRefreshed"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.couldNotRefreshPermission"));
    } finally {
      setPermissionLoading("none");
    }
  }

  useEffect(() => {
    void refreshPermissions(false);
  }, []);

  async function requestLocationPermission() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocationPermissionStatus("unsupported");
      return;
    }

    setPermissionLoading("location");
    setError(null);
    setMessage(null);

    try {
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(),
          (error) => {
            if (error.code === error.PERMISSION_DENIED) {
              resolve();
              return;
            }
            reject(new Error(error.message || t("messages.couldNotReadLocation")));
          },
          { maximumAge: 0, timeout: 10000, enableHighAccuracy: false },
        );
      });

      const locationStatus = await detectLocationPermission();
      const notificationStatus = await detectNotificationPermission();
      setLocationPermissionStatus(locationStatus);
      setNotificationPermissionStatus(notificationStatus);
      await syncPermissionsToServer(locationStatus, notificationStatus);
      setMessage(locationStatus === "granted" ? t("messages.locationGranted") : t("messages.locationUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.couldNotRequestLocation"));
    } finally {
      setPermissionLoading("none");
    }
  }

  async function requestNotificationPermission() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setNotificationPermissionStatus("unsupported");
      return;
    }

    setPermissionLoading("notification");
    setError(null);
    setMessage(null);

    try {
      const result = await Notification.requestPermission();
      const notificationStatus: PermissionStatusValue = result === "granted" || result === "denied" ? result : "prompt";
      const locationStatus = await detectLocationPermission();
      setNotificationPermissionStatus(notificationStatus);
      setLocationPermissionStatus(locationStatus);
      await syncPermissionsToServer(locationStatus, notificationStatus);
      setMessage(notificationStatus === "granted" ? t("messages.notificationGranted") : t("messages.notificationUpdated"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("messages.couldNotRequestNotification"));
    } finally {
      setPermissionLoading("none");
    }
  }

  const sessionRows = initialData.activeSessions;

  const securityNote = useMemo(() => {
    if (locationPermissionStatus === "denied" || notificationPermissionStatus === "denied") {
      return t("messages.permissionsBlocked");
    }
    return null;
  }, [locationPermissionStatus, notificationPermissionStatus]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="flex items-center gap-4 px-6 py-4">
          <a href="/n/app/mobile/profile/settings" className="flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition hover:bg-gray-100">
            <ChevronLeft size={22} />
          </a>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
        </div>
      </div>

      <div className="space-y-6 p-6">
        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="mb-4 font-bold text-gray-900">{t("changePassword")}</h3>
          <div className="space-y-4">
            <InputRow label={t("currentPassword")} type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={setCurrentPassword} placeholder={t("enterCurrentPassword")} icon={<Lock size={18} />} toggle={<button type="button" onClick={() => setShowCurrentPassword((v) => !v)}>{showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
            <InputRow label={t("newPassword")} type={showNewPassword ? "text" : "password"} value={newPassword} onChange={setNewPassword} placeholder={t("enterNewPassword")} icon={<Lock size={18} />} toggle={<button type="button" onClick={() => setShowNewPassword((v) => !v)}>{showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
            <InputRow label={t("confirmNewPassword")} type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={setConfirmPassword} placeholder={t("reenterNewPassword")} icon={<Lock size={18} />} toggle={<button type="button" onClick={() => setShowConfirmPassword((v) => !v)}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>} />
            <button type="button" disabled={isPending} onClick={() => runAction(async () => {
              await changePassword({ currentPassword, newPassword, confirmPassword });
              setCurrentPassword("");
              setNewPassword("");
              setConfirmPassword("");
            }, t("messages.passwordUpdated"))} className="h-12 w-full rounded-xl bg-[#083f30] font-semibold text-white transition hover:bg-[#0a5a44] disabled:bg-gray-300">{t("updatePassword")}</button>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50"><Fingerprint size={20} className="text-purple-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900">{t("biometricLogin")}</h3>
                <p className="text-sm text-gray-600">{t("biometricDescription")}</p>
              </div>
            </div>
            <Toggle checked={biometricEnabled} onChange={(checked) => {
              setBiometricEnabled(checked);
              runAction(() => updateBiometricEnabled(checked), t("messages.biometricUpdated"));
            }} />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="font-bold text-gray-900">{t("activeSessions")}</h3>
            <button type="button" onClick={() => window.location.reload()} className="text-sm font-medium text-[#083f30]">{t("refresh")}</button>
          </div>
          <div className="space-y-3">
            {sessionRows.length === 0 ? (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{t("noTrackedSessions") }</p>
            ) : (
              sessionRows.map((session) => (
                <div key={session.id} className="flex items-start justify-between rounded-lg bg-gray-50 p-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50"><Smartphone size={20} className="text-blue-600" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{session.deviceName}</p>
                        {session.isCurrent ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">{t("current") }</span> : null}
                      </div>
                      <p className="text-sm text-gray-600">{session.locationLabel}</p>
                      <p className="mt-1 text-xs text-gray-500">{session.lastActiveLabel}</p>
                    </div>
                  </div>
                  {!session.isCurrent ? <button type="button" className="text-sm font-medium text-red-600" onClick={() => runAction(() => revokeSession(session.id), t("messages.sessionRevoked"))}>{t("revoke") }</button> : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="font-bold text-gray-900">{t("privacyControls")}</h3>
            <button type="button" onClick={() => void refreshPermissions(true)} className="inline-flex items-center gap-2 text-sm font-medium text-[#083f30]" disabled={permissionLoading !== "none"}>
              <RefreshCw size={15} className={permissionLoading === "refresh" ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="space-y-3">
            <PermissionCard
              icon={<MapPin size={20} className="text-gray-600" />}
              title={t("locationPermissions")}
              value={locationPermissionStatus}
              summary={permissionHelpText("location", locationPermissionStatus)}
              actionLabel={locationPermissionStatus === "granted" ? t("refresh") : locationPermissionStatus === "denied" ? t("checkAgain") : t("requestAccess")}
              onAction={() => locationPermissionStatus === "granted" ? refreshPermissions(true) : requestLocationPermission()}
              isBusy={permissionLoading === "location" || permissionLoading === "refresh"}
              t={t}
            />
            <PermissionCard
              icon={<Bell size={20} className="text-gray-600" />}
              title={t("notificationPermissions")}
              value={notificationPermissionStatus}
              summary={permissionHelpText("notification", notificationPermissionStatus)}
              actionLabel={notificationPermissionStatus === "granted" ? t("refresh") : notificationPermissionStatus === "denied" ? t("checkAgain") : t("requestAccess")}
              onAction={() => notificationPermissionStatus === "granted" ? refreshPermissions(true) : requestNotificationPermission()}
              isBusy={permissionLoading === "notification" || permissionLoading === "refresh"}
              t={t}
            />
          </div>

          {securityNote ? <p className="mt-4 text-sm text-amber-700">{securityNote}</p> : null}
        </section>

        <section className="rounded-xl border-2 border-red-200 bg-white p-4">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50"><Trash2 size={20} className="text-red-600" /></div>
            <div>
              <h3 className="font-bold text-gray-900">{t("deleteAccount")}</h3>
              <p className="text-sm text-gray-600">{t("deleteDescription")}</p>
            </div>
          </div>
          <textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder={t("optionalReason")} rows={3} className="w-full rounded-xl border-2 border-gray-300 px-4 py-3 focus:border-red-500 focus:outline-none" />
          <button type="button" disabled={isPending || initialData.hasPendingDeletionRequest} onClick={() => runAction(() => requestAccountDeletion(deleteReason), t("messages.accountDeletionRequested"))} className="mt-4 h-12 w-full rounded-xl border-2 border-red-600 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-red-200 disabled:text-red-300">{initialData.hasPendingDeletionRequest ? t("deletionRequestOpen") : t("requestAccountDeletion")}</button>
        </section>

        {error ? <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><ShieldAlert size={18} /><span>{error}</span></div> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
      </div>
    </div>
  );
}

function InputRow({ label, type, value, onChange, placeholder, icon, toggle }: { label: string; type: string; value: string; onChange: (value: string) => void; placeholder: string; icon: React.ReactNode; toggle: React.ReactNode; }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-gray-900">{label}</span>
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border-2 border-gray-300 pl-11 pr-12 focus:border-[#083f30] focus:outline-none" />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">{toggle}</div>
      </div>
    </label>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <div className="h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#083f30] peer-checked:after:translate-x-full" />
    </label>
  );
}

function PermissionCard({ icon, title, value, summary, actionLabel, onAction, isBusy, t }: { icon: React.ReactNode; title: string; value: PermissionStatusValue; summary: string; actionLabel: string; onAction: () => void | Promise<void>; isBusy: boolean; t: ReturnType<typeof useTranslations>; }) {
  const badge = permissionBadgeLabel(value);
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icon}</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-gray-900">{title}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-gray-600">{badge}</span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{summary}</p>
          </div>
        </div>
      </div>
      <button type="button" onClick={() => void onAction()} disabled={isBusy || value === "unsupported"} className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400">
        {isBusy ? t("working") : value === "unsupported" ? t("notSupported") : actionLabel}
      </button>
    </div>
  );
}
