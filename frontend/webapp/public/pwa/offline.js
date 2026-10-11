/* Standalone reader: no framework, API, CDN, authentication or font dependency. */
import {
  clearOfflineProfile,
  openProfile,
  PROFILE_KEY,
  PROFILE_TTL,
} from "/pwa/profile-crypto.js";

const supportedLocales = new Set([
  "en",
  "fa",
  "tr",
  "es",
  "ar",
  "ku",
  "de",
  "fr",
  "ru",
  "tg",
  "zh",
]);
const routeLocale = location.pathname.split("/")[1];
let rememberedLocale;
try {
  rememberedLocale = localStorage.getItem("lsevin-pwa-locale");
} catch {
  /* Optional preference. */
}
let locale = supportedLocales.has(routeLocale)
  ? routeLocale
  : document.cookie.match(
      /(?:^|;\s*)(?:LSEVIN_LOCALE|NEXT_LOCALE)=([^;]+)/
    )?.[1] ||
    rememberedLocale ||
    (location.hostname.endsWith(".ir") ? "fa" : "en");
if (!supportedLocales.has(locale)) locale = "en";
let items = [];
let pages = [];
let unavailable = false;
const texts = {
  en: {
    title: "Saved pages",
    explanation:
      "Read saved pages and provider information. Bookings, payments and account changes require a connection. Information may have changed since it was saved.",
    retry: "Try again",
    clear: "Clear saved directory",
    search: "Search saved providers",
    empty:
      "No saved providers. Open LSevin while connected to save a directory for later.",
    noResults: "No matching saved providers.",
    saved: "Saved",
    open: "Open when connected",
    online: "Connection available. Try again to return to LSevin.",
    offline: "You are offline. Saved information is available below.",
    unavailable: "Offline storage is unavailable in this browser.",
  },
  fa: {
    title: "صفحات ذخیره‌شده",
    explanation:
      "صفحات و اطلاعات ذخیره‌شده مراکز را ببینید. رزرو، پرداخت و تغییرات حساب به اینترنت نیاز دارند. ممکن است اطلاعات از زمان ذخیره تغییر کرده باشند.",
    retry: "تلاش دوباره",
    clear: "پاک کردن فهرست ذخیره‌شده",
    search: "جستجوی مراکز ذخیره‌شده",
    empty:
      "مرکزی ذخیره نشده است. برای ذخیره فهرست، یک‌بار لسوین را با اینترنت باز کنید.",
    noResults: "مرکز ذخیره‌شده‌ای پیدا نشد.",
    saved: "ذخیره‌شده در",
    open: "باز کردن با اینترنت",
    online: "اتصال در دسترس است. برای بازگشت به لسوین دوباره تلاش کنید.",
    offline: "آفلاین هستید. اطلاعات ذخیره‌شده در پایین در دسترس است.",
    unavailable: "ذخیره‌سازی آفلاین در این مرورگر در دسترس نیست.",
  },
};
texts.en.profile = "Saved profile";
texts.en.partial = "Partial page saved. Reconnect to see all content.";
texts.en.passphrase = "Offline passphrase";
texts.en.unlock = "Unlock saved profile";
texts.en.noProfile =
  "No saved profile. Save one from your profile page while connected.";
texts.en.unlockError =
  "Could not unlock. Check your passphrase; expired profiles must be saved again online.";
texts.fa.profile = "پروفایل ذخیره‌شده";
texts.fa.partial =
  "بخشی از صفحه ذخیره شده است. برای دیدن همه اطلاعات به اینترنت وصل شوید.";
texts.fa.passphrase = "عبارت عبور آفلاین";
texts.fa.unlock = "باز کردن پروفایل ذخیره‌شده";
texts.fa.noProfile =
  "پروفایلی ذخیره نشده است. با اتصال به اینترنت از صفحه پروفایل ذخیره کنید.";
texts.fa.unlockError =
  "باز نشد. عبارت عبور را بررسی کنید؛ پروفایل منقضی‌شده را دوباره با اینترنت ذخیره کنید.";
const element = (id) => document.getElementById(id);
const text = () => texts[locale === "fa" ? "fa" : "en"];
const normalizeSearch = (value) =>
  value
    .toLocaleLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\u200c/g, " ");
if (
  /^\/(en|fa|tr|es|ar|ku|de|fr|ru|tg|zh)\/(n\/app\/mobile\/)?profile\/?$/.test(
    location.pathname
  )
) {
  element("search-label").before(element("profile-panel"));
}
function updateStatus() {
  element("status").textContent = unavailable
    ? text().unavailable
    : navigator.onLine
      ? text().online
      : text().offline;
}
function render() {
  const t = text();
  document.documentElement.lang = locale;
  document.documentElement.dir = ["fa", "ar", "ku"].includes(locale)
    ? "rtl"
    : "ltr";
  document.title = `LSevin — ${t.title}`;
  element("title").textContent = t.title;
  element("explanation").textContent = t.explanation;
  element("retry").textContent = t.retry;
  element("clear").textContent = t.clear;
  element("search-label").textContent = t.search;
  element("language").textContent = locale === "fa" ? "English" : "فارسی";
  element("directory").setAttribute("aria-label", t.search);
  element("profile-title").textContent = t.profile;
  element("passphrase-label").textContent = t.passphrase;
  element("unlock").textContent = t.unlock;
  updateStatus();
  const query = normalizeSearch(element("search").value.trim());
  const now = Date.now();
  items = items.filter((item) => now - item.savedAt < 7 * 24 * 60 * 60 * 1000);
  const filtered = items.filter((item) =>
    normalizeSearch(`${item.name} ${item.city} ${item.country}`).includes(query)
  );
  pages = pages.filter((page) => now - page.savedAt < 24 * 60 * 60 * 1000);
  const visiblePages = pages.filter((page) =>
    normalizeSearch(`${page.title} ${page.text}`).includes(query)
  );
  element("empty").textContent =
    !items.length && !pages.length
      ? t.empty
      : !filtered.length && !visiblePages.length
        ? t.noResults
        : "";
  element("pages").replaceChildren();
  for (const page of visiblePages.sort(
    (a, b) =>
      (b.pathname === location.pathname ? 1 : 0) -
      (a.pathname === location.pathname ? 1 : 0)
  )) {
    const card = document.createElement("article");
    const title = document.createElement("h2");
    title.textContent = page.title;
    const saved = document.createElement("small");
    saved.textContent = `${t.saved}: ${new Date(page.savedAt).toLocaleString(locale)}`;
    const content = document.createElement("p");
    content.className = "saved-text";
    content.textContent = page.text;
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = locale === "fa" ? "خواندن صفحه" : "Read page";
    details.open = page.pathname === location.pathname;
    details.append(summary, content);
    const link = document.createElement("a");
    link.className = "provider-link";
    link.href = page.pathname;
    link.textContent = t.open;
    card.append(title, saved, details, link);
    if (page.partial) {
      const note = document.createElement("p");
      note.textContent = t.partial;
      card.prepend(note);
    }
    element("pages").append(card);
  }
  element("directory").replaceChildren();
  for (const item of filtered) {
    const card = document.createElement("article");
    const title = document.createElement("h2");
    title.textContent = item.name;
    const location = document.createElement("p");
    location.textContent = [item.city, item.country]
      .filter(Boolean)
      .join(" · ");
    const description = document.createElement("p");
    description.textContent = item.description;
    const saved = document.createElement("small");
    saved.textContent = `${t.saved}: ${new Date(item.savedAt).toLocaleString(locale)}`;
    const link = document.createElement("a");
    link.className = "provider-link";
    link.href = `/${locale}/n/app/mobile/provider/${encodeURIComponent(item.id)}`;
    link.textContent = t.open;
    card.append(title, location, description, saved, link);
    element("directory").append(card);
  }
}
async function loadDirectory() {
  try {
    const names = await caches.keys();
    pages = [];
    if (names.includes("lsevin-pwa-pages-v1")) {
      const cache = await caches.open("lsevin-pwa-pages-v1");
      for (const key of await cache.keys()) {
        const response = await cache.match(key);
        const page = await response.json();
        if (page.pathname.split("/")[1] === locale) pages.push(page);
      }
    }
    // Do not create an empty cache when installation has not happened yet.
    if (!(await caches.keys()).includes("lsevin-pwa-directory-v1")) {
      items = [];
      render();
      return;
    }
    const cache = await caches.open("lsevin-pwa-directory-v1");
    const response = await cache.match(`/pwa/directory/${locale}`);
    items = response ? (await response.json()).items : [];
  } catch {
    unavailable = true;
    items = [];
  }
  render();
}
element("search").addEventListener("input", render);
element("retry").addEventListener("click", () => {
  // Keep the failed URL (including query) so recovery returns to the user's workflow.
  if (location.pathname === "/offline.html")
    location.assign(`/${locale}/n/app/mobile/home`);
  else location.reload();
});
element("language").addEventListener("click", () => {
  locale = locale === "fa" ? "en" : "fa";
  loadDirectory();
});
element("clear").addEventListener("click", async () => {
  try {
    await Promise.all([
      caches.delete("lsevin-pwa-directory-v1"),
      caches.delete("lsevin-pwa-pages-v1"),
    ]);
    clearOfflineProfile();
    items = [];
    pages = [];
    render();
  } catch {
    unavailable = true;
    render();
  }
});
function lockProfile() {
  element("profile-content").textContent = "";
  element("profile-status").textContent = "";
  element("passphrase").value = "";
}
element("unlock-profile").addEventListener("submit", async (event) => {
  event.preventDefault();
  element("unlock").disabled = true;
  element("profile-content").textContent = "";
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (!saved) {
      element("profile-status").textContent = text().noProfile;
      return;
    }
    const record = JSON.parse(saved);
    if (Date.now() - record.savedAt > PROFILE_TTL) {
      clearOfflineProfile();
      throw new Error("Expired");
    }
    const profile = await openProfile(record, element("passphrase").value);
    // A sign-out/clear may have occurred in another tab while decrypting.
    if (localStorage.getItem(PROFILE_KEY) !== saved) return;
    element("profile-content").textContent =
      `${profile.name} · ${profile.email}`;
    element("profile-status").textContent =
      `${text().saved}: ${new Date(profile.savedAt).toLocaleString(locale)}`;
  } catch {
    element("profile-status").textContent = text().unlockError;
  } finally {
    element("passphrase").value = "";
    element("unlock").disabled = false;
  }
});
window.addEventListener("storage", (event) => {
  if (event.key === PROFILE_KEY || event.key === null) lockProfile();
});
window.addEventListener("lsevin-profile-cleared", lockProfile);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) lockProfile();
});
window.addEventListener("online", updateStatus);
window.addEventListener("offline", updateStatus);
loadDirectory();
