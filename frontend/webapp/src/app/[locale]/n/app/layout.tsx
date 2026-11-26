// No robots policy here. The public pages (/fa, /fa/explore, /fa/shop,
// /fa/products/<slug>, /fa/providers, ...) are rewrites onto routes in this
// tree, so a layout policy reaches them too: from 2026-11-23 to 11-26 a
// `noindex, follow` here kept the home page and every product out of Google.
// The old direct addresses (/fa/n/app/...) get `X-Robots-Tag: noindex, follow`
// from next.config.ts headers(), which match the requested URL, not the
// rewritten route. Private screens keep their own layout policies.
export default function AppOnlyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
