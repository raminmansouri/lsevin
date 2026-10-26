/** The offline profile never contains Next's server payload or session scripts. */
export function profileDocument(
  owner?: string,
  structured = false,
  storagePath?: string
) {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  if (owner) {
    clone.dataset.lsevinViewOwner = owner;
    clone.dataset.lsevinViewUntil = String(Date.now() + 24 * 60 * 60 * 1000);
  }
  if (storagePath) clone.dataset.lsevinViewKey = storagePath;
  clone
    .querySelectorAll(
      "script,iframe,object,embed,template,noscript,[data-pwa-transient],[role=dialog],input,textarea,select"
    )
    .forEach((node) => node.remove());
  clone.querySelectorAll("*").forEach((node) => {
    for (const attr of [...node.attributes])
      if (/^on/i.test(attr.name) || /nonce|token|csrf/i.test(attr.name))
        node.removeAttribute(attr.name);
  });
  if (structured) {
    const overview = clone.querySelector("[data-pwa-profile-overview]");
    if (!overview) throw new Error("ProfileOverviewUnavailable");
    overview.replaceChildren();
    overview.removeAttribute("data-pwa-profile-overview");
    overview.setAttribute("data-pwa-profile-root", "");
  }
  for (const src of [
    "/pwa/view-store.js",
    "/pwa/live-view.js",
    ...(structured ? ["/pwa/profile-app.js"] : []),
  ]) {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    clone.querySelector("head")?.append(script);
  }
  return clone;
}
