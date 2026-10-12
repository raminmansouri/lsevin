// Profile snapshots keep the original DOM/CSS. Server-dependent controls do
// not submit stale data; normal local navigation and browser history still work.
document.documentElement.dataset.lsevinOffline = "true";
function connectionNotice() {
  let notice = document.getElementById("lsevin-connection-notice");
  if (!notice) {
    notice = document.createElement("div");
    notice.id = "lsevin-connection-notice";
    notice.role = "status";
    notice.className =
      "fixed inset-x-3 top-3 z-[100] mx-auto max-w-xl rounded-xl border bg-white p-3 text-sm shadow-lg";
    notice.textContent =
      document.documentElement.lang === "fa"
        ? "این بخش به اتصال اینترنت نیاز دارد."
        : "This action requires an internet connection.";
    document.body.append(notice);
  }
  setTimeout(() => notice.remove(), 4000);
}
document.addEventListener(
  "submit",
  (event) => {
    event.preventDefault();
    connectionNotice();
  },
  true
);
document.addEventListener(
  "click",
  async (event) => {
    const target = event.target.closest("a,button");
    if (
      !target ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    if (target.matches("button")) {
      event.preventDefault();
      if (target.hasAttribute("data-pwa-signout")) {
        await LsevinViewStore.clear();
        location.assign(
          "/" + document.documentElement.lang + "/n/app/mobile/home"
        );
      } else connectionNotice();
      return;
    }
    const url = new URL(target.href, location.href);
    if (
      url.origin !== location.origin ||
      (url.hash && url.pathname === location.pathname)
    )
      return;
    event.preventDefault();
    const saved = await (
      await caches.open("lsevin-pwa-application-v2")
    ).match(url.pathname);
    if (saved || (await LsevinViewStore.read(url.pathname)))
      location.assign(url.href);
    else connectionNotice();
  },
  true
);
window.addEventListener("online", () => location.reload());
