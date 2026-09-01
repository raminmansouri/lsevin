/**
 * Shop route wrapper. `overflow-x-hidden` is a hard guarantee that no Shop
 * surface — dense product grids, comparison tables, horizontal rails — can make
 * the page scroll sideways on a phone (SHP-UX-010). Wide content that genuinely
 * needs to scroll (the compare table) does so inside its own `overflow-x-auto`
 * container.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-full overflow-x-hidden">{children}</div>;
}
