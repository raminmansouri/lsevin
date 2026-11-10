import { Package, ShieldCheck, Store } from "lucide-react";

/** Desktop seller page header (>= 1280px): one slim deep-green band with the seller's emblem, name and facts. */
export function DesktopSellerHeader({
  seller,
  labels,
}: {
  seller: { name: string; logoUrl: string | null; description: string; warranty: string; productCount: number };
  labels: { products: string; tenure: string; warrantyTitle: string };
}) {
  return (
    <section className="lsd hidden xl:block">
      <div className="lsd-container pt-6">
        <div className="relative overflow-hidden rounded-[28px] bg-[#062a20] px-10 py-7 text-white">
          <div className="pointer-events-none absolute -end-16 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(234,203,127,0.2),transparent_65%)]" />

          <div className="relative flex items-center gap-7">
            {/* Emblem */}
            <div className="relative h-20 w-20 shrink-0 rounded-full border border-[#eacb7f]/50 p-1.5">
              <div className="lsd-seller-ring pointer-events-none absolute -inset-2 rounded-full border border-dashed border-[#eacb7f]/25" />
              <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-gradient-to-b from-[#0f5a45] to-[#083f30]">
                {seller.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={seller.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store size={30} className="text-[#eacb7f]" />
                )}
              </div>
            </div>

            {/* Name and story */}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#eacb7f]">{labels.tenure}</p>
              <h1 className="lsd-gold-text mt-1 truncate text-[34px] font-black leading-tight">{seller.name}</h1>
              {seller.description ? (
                <p className="mt-1 line-clamp-2 max-w-2xl text-sm leading-7 text-white/65">{seller.description}</p>
              ) : null}
            </div>

            {/* Facts */}
            <div className="flex shrink-0 items-center gap-3">
              <span className="flex items-center gap-2 rounded-full bg-white/[0.07] px-4 py-2 text-sm font-bold ring-1 ring-white/10">
                <Package size={15} className="text-[#eacb7f]" />
                {labels.products}
              </span>
              {seller.warranty ? (
                <span
                  title={seller.warranty}
                  className="flex max-w-[240px] items-center gap-2 rounded-full bg-[#eacb7f] px-4 py-2 text-sm font-bold text-[#062a20]"
                >
                  <ShieldCheck size={15} className="shrink-0" />
                  <span className="truncate">{labels.warrantyTitle}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}