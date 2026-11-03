"use client";

import { Bell, CheckCircle2, Eye, EyeOff, Fingerprint, KeyRound, MapPin, RefreshCw, ShieldAlert, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";

import type { PermissionStatusValue, PrivacySecurityPageData } from "@/app/[locale]/n/app/mobile/profile/privacy-security/types";
import { permissionBadgeLabel, permissionHelpText } from "@/app/[locale]/n/app/mobile/profile/privacy-security/utils";

import { Reveal } from "../components/motion";

const STATUS_TONE: Record<string, string> = {
  granted: "bg-[#e7f4ee] text-[#0f5a45]",
  denied: "bg-[#fdf1ef] text-[#b2453a]",
  prompt: "bg-[#fbf3de] text-[#8c6b2c]",
};
const tone = (status: string) => STATUS_TONE[status] ?? "bg-[#f6f1e6] text-[#8a8170]";

function Card({ icon, title, action, children, danger = false }: { icon: ReactNode; title: string; action?: ReactNode; children: ReactNode; danger?: boolean }) {
  return (
    <section className={`rounded-[26px] bg-white p-7 ring-1 ${danger ? "ring-[#f1c7c0]" : "ring-[#e7dcc4]"}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 text-lg font-black text-[#0e1a16]">
          <span className={`grid h-10 w-10 place-items-center rounded-full ${danger ? "bg-[#fdf1ef] text-[#b2453a]" : "bg-[#083f30] text-[#eacb7f]"}`}>{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function PasswordField({ label, value, onChange, placeholder, autoComplete }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; autoComplete: string }) {
  const t = useTranslations("MobileProfile.privacySecurity");
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-[#3d4b45]">{label}</span>
      <span className="flex h-12 items-center gap-3 rounded-full bg-[#fbf8f1] px-5 ring-1 ring-[#e7dcc4] focus-within:ring-[#c9a55a]">
        <KeyRound size={16} className="shrink-0 text-[#c9a55a]" />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#a8a08e]"
        />
        <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? t("hidePassword") : t("showPassword")} className="text-[#8a8170] transition hover:text-[#083f30]">
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  );
}

/** Desktop privacy & security (>= 1280px). Every action is the named one from PrivacySecurityPageClient. */
export function DesktopPrivacySecurity(props: {
  isPending: boolean;
  message: string | null;
  error: string | null;
  password: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    setCurrentPassword: (value: string) => void;
    setNewPassword: (value: string) => void;
    setConfirmPassword: (value: string) => void;
  };
  onSubmitPassword: () => void;
  biometricEnabled: boolean;
  onToggleBiometric: (checked: boolean) => void;
  sessions: PrivacySecurityPageData["activeSessions"];
  onRevokeSession: (id: string) => void;
  locationStatus: PermissionStatusValue;
  notificationStatus: PermissionStatusValue;
  permissionLoading: "none" | "location" | "notification" | "refresh";
  onLocationAction: () => void | Promise<void>;
  onNotificationAction: () => void | Promise<void>;
  onRefreshPermissions: () => void;
  securityNote: string | null;
  deleteReason: string;
  setDeleteReason: (value: string) => void;
  onSubmitDeletion: () => void;
  hasPendingDeletion: boolean;
}) {
  const t = useTranslations("MobileProfile.privacySecurity");
  const { password } = props;

  const permissions = [
    {
      key: "location",
      icon: <MapPin size={18} />,
      title: t("locationPermissions"),
      status: props.locationStatus,
      busy: props.permissionLoading === "location" || props.permissionLoading === "refresh",
      onAction: props.onLocationAction,
    },
    {
      key: "notification",
      icon: <Bell size={18} />,
      title: t("notificationPermissions"),
      status: props.notificationStatus,
      busy: props.permissionLoading === "notification" || props.permissionLoading === "refresh",
      onAction: props.onNotificationAction,
    },
  ] as const;

  return (
    <div className="lsd lsd-shop-bg hidden pb-20 xl:block">
      <section className="lsd-container pt-6">
        <div className="lsd-hero-bg overflow-hidden rounded-[36px] px-12 py-12 text-white">
          <Reveal className="space-y-3">
            <span className="text-[10px] font-bold tracking-[0.5em] text-[#eacb7f]">SECURITY</span>
            <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
          </Reveal>
        </div>

        {props.error ? (
          <p className="mt-5 flex items-center gap-3 rounded-[18px] border border-[#f1c7c0] bg-[#fdf1ef] px-6 py-4 text-sm text-[#8f2f26]">
            <ShieldAlert size={18} className="shrink-0" />
            {props.error}
          </p>
        ) : null}
        {props.message ? (
          <p className="mt-5 flex items-center gap-3 rounded-[18px] border border-[#bfe3d2] bg-[#eef8f3] px-6 py-4 text-sm text-[#0f5a45]">
            <CheckCircle2 size={18} className="shrink-0" />
            {props.message}
          </p>
        ) : null}
      </section>

      <div className="lsd-container mt-10 grid grid-cols-2 items-start gap-6">
        <div className="space-y-6">
          {/* Password */}
          <Card icon={<KeyRound size={18} />} title={t("changePassword")}>
            <div className="space-y-4">
              <PasswordField label={t("currentPassword")} value={password.currentPassword} onChange={password.setCurrentPassword} placeholder={t("enterCurrentPassword")} autoComplete="current-password" />
              <PasswordField label={t("newPassword")} value={password.newPassword} onChange={password.setNewPassword} placeholder={t("enterNewPassword")} autoComplete="new-password" />
              <PasswordField label={t("confirmNewPassword")} value={password.confirmPassword} onChange={password.setConfirmPassword} placeholder={t("reenterNewPassword")} autoComplete="new-password" />
              <button type="button" disabled={props.isPending} onClick={props.onSubmitPassword} className="lsd-btn lsd-btn-green h-12 w-full text-sm disabled:opacity-50">
                {t("updatePassword")}
              </button>
            </div>
          </Card>

          {/* Biometric */}
          <Card
            icon={<Fingerprint size={18} />}
            title={t("biometricLogin")}
            action={
              <button
                type="button"
                role="switch"
                aria-checked={props.biometricEnabled}
                onClick={() => props.onToggleBiometric(!props.biometricEnabled)}
                className={`relative h-7 w-12 rounded-full transition ${props.biometricEnabled ? "bg-[#083f30]" : "bg-[#e7dcc4]"}`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full transition-all ${props.biometricEnabled ? "start-6 bg-[#eacb7f]" : "start-1 bg-white"}`}
                />
              </button>
            }
          >
            <p className="text-sm leading-6 text-[#6b6150]">{t("biometricDescription")}</p>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Sessions */}
          <Card
            icon={<Smartphone size={18} />}
            title={t("activeSessions")}
            action={
              <button type="button" onClick={() => window.location.reload()} className="text-sm font-bold text-[#083f30] transition hover:text-[#8c6b2c]">
                {t("refresh")}
              </button>
            }
          >
            {props.sessions.length === 0 ? (
              <p className="rounded-[16px] bg-[#fbf8f1] px-5 py-4 text-sm text-[#6b6150]">{t("noTrackedSessions")}</p>
            ) : (
              <ul className="divide-y divide-[#f1ead9]">
                {props.sessions.map((session) => (
                  <li key={session.id} className="flex items-start justify-between gap-4 py-4">
                    <div className="flex gap-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f6f1e6] text-[#8c6b2c]">
                        <Smartphone size={18} />
                      </span>
                      <div>
                        <p className="flex items-center gap-2 font-bold text-[#0e1a16]">
                          {session.deviceName}
                          {session.isCurrent ? <span className="rounded-full bg-[#e7f4ee] px-2.5 py-0.5 text-[11px] font-bold text-[#0f5a45]">{t("current")}</span> : null}
                        </p>
                        <p className="mt-0.5 text-sm text-[#6b6150]">{session.locationLabel}</p>
                        <p className="mt-0.5 text-xs text-[#8a8170]">{session.lastActiveLabel}</p>
                      </div>
                    </div>
                    {!session.isCurrent ? (
                      <button
                        type="button"
                        onClick={() => props.onRevokeSession(session.id)}
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-[#b2453a] ring-1 ring-[#f1c7c0] transition hover:bg-[#fdf1ef]"
                      >
                        {t("revoke")}
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Permissions */}
          <Card
            icon={<ShieldCheck size={18} />}
            title={t("privacyControls")}
            action={
              <button
                type="button"
                onClick={props.onRefreshPermissions}
                disabled={props.permissionLoading !== "none"}
                className="inline-flex items-center gap-2 text-sm font-bold text-[#083f30] transition hover:text-[#8c6b2c] disabled:opacity-50"
              >
                <RefreshCw size={15} className={props.permissionLoading === "refresh" ? "animate-spin" : ""} />
                {t("refresh")}
              </button>
            }
          >
            <div className="space-y-3">
              {permissions.map((permission) => {
                const actionLabel =
                  permission.status === "granted" ? t("refresh") : permission.status === "denied" ? t("checkAgain") : t("requestAccess");
                return (
                  <div key={permission.key} className="rounded-[18px] bg-[#fbf8f1] p-5 ring-1 ring-[#efe7d5]">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 text-[#c9a55a]">{permission.icon}</span>
                        <div>
                          <p className="flex items-center gap-2 font-bold text-[#0e1a16]">
                            {permission.title}
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${tone(permission.status)}`}>{permissionBadgeLabel(permission.status, t)}</span>
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#6b6150]">{permissionHelpText(permission.key, permission.status, t)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => void permission.onAction()}
                        disabled={permission.busy || permission.status === "unsupported"}
                        className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#083f30] ring-1 ring-[#e7dcc4] transition hover:ring-[#c9a55a] disabled:cursor-not-allowed disabled:text-[#a8a08e]"
                      >
                        {permission.busy ? t("working") : permission.status === "unsupported" ? t("notSupported") : actionLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {props.securityNote ? <p className="mt-4 text-sm text-[#8c6b2c]">{props.securityNote}</p> : null}
          </Card>
        </div>

        {/* Danger zone */}
        <div className="col-span-2">
          <Card icon={<Trash2 size={18} />} title={t("deleteAccount")} danger>
            <p className="-mt-2 mb-4 text-sm leading-6 text-[#6b6150]">{t("deleteDescription")}</p>
            <div className="flex items-end gap-4">
              <textarea
                value={props.deleteReason}
                onChange={(event) => props.setDeleteReason(event.target.value)}
                placeholder={t("optionalReason")}
                rows={2}
                className="min-w-0 flex-1 resize-none rounded-[18px] bg-[#fbf8f1] px-5 py-3 text-sm outline-none ring-1 ring-[#e7dcc4] focus:ring-[#e3a59c]"
              />
              <button
                type="button"
                disabled={props.isPending || props.hasPendingDeletion}
                onClick={props.onSubmitDeletion}
                className="h-12 shrink-0 rounded-full px-6 text-sm font-bold text-[#b2453a] ring-1 ring-[#e3a59c] transition hover:bg-[#fdf1ef] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {props.hasPendingDeletion ? t("deletionRequestOpen") : t("requestAccountDeletion")}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}