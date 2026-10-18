/* Branded last resort. Saved application pages are served by the worker first. */
const supported = new Set([
  "en",
  "fa",
  "ar",
  "ku",
  "tr",
  "es",
  "de",
  "fr",
  "ru",
  "tg",
  "zh",
]);
const routeLocale = location.pathname.split("/")[1];
let remembered;
try {
  remembered = localStorage.getItem("lsevin-pwa-locale");
} catch {
  /* Optional preference. */
}
const cookieLocale = document.cookie.match(
  /(?:^|;\s*)(?:LSEVIN_LOCALE|NEXT_LOCALE)=([^;]+)/
)?.[1];
const locale = supported.has(routeLocale)
  ? routeLocale
  : [cookieLocale, remembered].find((value) => supported.has(value)) ||
    (location.hostname.endsWith(".ir") ? "fa" : "en");
const persian = locale === "fa";
document.documentElement.lang = locale;
document.documentElement.dir = ["fa", "ar", "ku"].includes(locale)
  ? "rtl"
  : "ltr";
const title = persian ? "اتصال برقرار نیست" : "Connection unavailable";
document.title = `LSevin — ${title}`;
document.getElementById("title").textContent = title;
document.getElementById("explanation").textContent = persian
  ? "این صفحه به‌صورت آفلاین در دسترس نیست. اتصال اینترنت را بررسی کنید و دوباره تلاش کنید."
  : "This page is not available offline. Check your connection and try again.";
document.getElementById("retry").textContent = persian
  ? "تلاش دوباره"
  : "Try again";
document.getElementById("retry").addEventListener("click", () => {
  // Preserve the requested page and query when the worker supplies this shell.
  if (location.pathname === "/offline.html")
    location.replace(`/${locale}/n/app/mobile/home`);
  else location.reload();
});
