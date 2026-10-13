import type { ProfileOverviewData } from "../../features/profile/components/profile-overview-view";

export type ProfileProjection = {
  kind: "profile-v1";
  owner: string;
  shell: string;
  data: ProfileOverviewData;
};

// Keep new data out of the legacy HTML key until the user activates the new
// worker. An older worker must never serve a JSON projection as an HTML page.
export function profileProjectionKey(pathname: string) {
  return `/pwa/profile-projection/${pathname.split("/")[1]}`;
}

/** Treat device storage as untrusted even after decryption. */
export function parseProfileProjection(
  value: string | null
): ProfileProjection | null {
  if (!value) return null;
  try {
    const record = JSON.parse(value) as ProfileProjection;
    const data = record.data;
    const iconNames = new Set([
      "Bell",
      "CalendarCheck2",
      "ClipboardList",
      "Coins",
      "FlaskConical",
      "Gift",
      "Heart",
      "HeartPulse",
      "Link2",
      "MessageCircle",
      "PiggyBank",
      "ScrollText",
      "Share2",
      "Shield",
      "Stamp",
      "Wallet",
    ]);
    if (
      record.kind !== "profile-v1" ||
      typeof record.owner !== "string" ||
      !record.owner ||
      typeof record.shell !== "string" ||
      !record.shell.includes("data-pwa-profile-root") ||
      data?.version !== 1 ||
      !/^(en|fa|tr|es|ar|ku|de|fr|ru|tg|zh)$/.test(data.locale)
    )
      return null;
    if (
      ![
        data.firstName,
        data.lastName,
        data.email,
        data.image,
        data.editLabel,
        data.signOutLabel,
      ].every((v) => typeof v === "string" && v.length <= 400000)
    )
      return null;
    if (
      data.image &&
      !/^data:image\/(?:png|jpeg|webp|gif);base64,[a-zA-Z0-9+/=]+$/.test(
        data.image
      )
    )
      return null;
    if (
      !Array.isArray(data.stats) ||
      data.stats.length !== 3 ||
      !Array.isArray(data.menu) ||
      data.menu.length > 20
    )
      return null;
    const validPath = (path: string) =>
      /^\/n\/app\/mobile\/[a-zA-Z0-9/-]+$/.test(path);
    if (
      !data.stats.every(
        (item) =>
          iconNames.has(item.icon) &&
          typeof item.label === "string" &&
          typeof item.value === "string" &&
          (!item.href || validPath(item.href))
      )
    )
      return null;
    if (
      !data.menu.every(
        (item) =>
          iconNames.has(item.icon) &&
          typeof item.label === "string" &&
          validPath(item.href) &&
          /^text-[a-z]+-\d{3}$/.test(item.color)
      )
    )
      return null;
    return record;
  } catch {
    return null;
  }
}
