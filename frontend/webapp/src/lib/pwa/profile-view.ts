/** The offline profile never contains Next's server payload or session scripts. */
export function profileDocument(owner?: string) {
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  if (owner) {
    clone.dataset.lsevinViewOwner = owner;
    clone.dataset.lsevinViewUntil = String(Date.now() + 24 * 60 * 60 * 1000);
  }
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
  for (const src of ["/pwa/view-store.js", "/pwa/live-view.js"]) {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    clone.querySelector("head")?.append(script);
  }
  return clone;
}
