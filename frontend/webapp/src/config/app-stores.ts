export type AppStore = {
  name: string;
  platform: "android" | "ios";
  url: string;
  region?: "iran" | "global";
};

// Fill only published listing URLs. Empty entries are never displayed.
// Optional `region` limits a listing to lsevin.ir or the global hosts.
export const APP_STORES: AppStore[] = [
  { name: "Google Play", platform: "android", url: "" },
  { name: "Myket", platform: "android", url: "" },
  { name: "Cafe Bazaar", platform: "android", url: "" },
  { name: "App Store", platform: "ios", url: "" },
];

export function appStoreLinks(
  userAgent: string,
  hostname: string,
  standalone: boolean,
  stores: AppStore[] = APP_STORES
) {
  const android = /Android/i.test(userAgent);
  const ios = /iPhone|iPad|iPod/i.test(userAgent);
  const native =
    /\bwv\b|LsevinApp/i.test(userAgent) ||
    (/iPhone|iPad|iPod|Macintosh/i.test(userAgent) &&
      /AppleWebKit/i.test(userAgent) &&
      !/Safari/i.test(userAgent));
  if (standalone || native) return [];
  const platform = android ? "android" : ios ? "ios" : null;
  const iran = hostname === "lsevin.ir" || hostname.endsWith(".lsevin.ir");
  return stores.filter((store) => {
    if (
      (platform && store.platform !== platform) ||
      (store.region && (store.region === "iran") !== iran)
    )
      return false;
    try {
      const url = new URL(store.url);
      return url.protocol === "https:" && !url.username && !url.password;
    } catch {
      return false;
    }
  });
}
