import { Package, ShieldCheck, Sparkles, Store } from "lucide-react";

/** Desktop seller page header (>= 1280px): a green band with the seller's card over it. */
export function DesktopSellerHeader({
  seller,
  labels,
}: {
  seller: { name: string; logoUrl: string | null; description: string; warranty: string };
  labels: { products: string; tenure: string };
}) {
  return (
    <section className="lsd hidden xl:block">
      <div className="lsd-container pt-6">
        <div className="lsd-hero-bg h-36 rounded-[32px]" />
        <div className="relative mx-10 -mt-20 flex items-center gap-8 rounded-[28px] bg-white p-8 shadow-[0_30px_60px_-40px_rgba(6,42,32,0.5)] ring-1 ring-[#e7dcc4]">
          <span className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-[#083f30] text-3xl font-black text-[#eacb7f] ring-4 ring-[#fbf3de]">
            {seller.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seller.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              seller.name.charAt(0) || <Store size={32} />
            )}
          </span>
          <div className="min-w-0 flex-1 space-y-3">
            <h1 className="text-3xl font-black text-[#0e1a16]">{seller.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 rounded-full bg-[#e7f4ee] px-3 py-1.5 font-bold text-[#0f5a45]">
                <Package size={15} />
                {labels.products}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[#fbf3de] px-3 py-1.5 font-bold text-[#8c6b2c]">
                <Sparkles size={15} />
                {labels.tenure}
              </span>
            </div>
            {seller.description ? <p className="max-w-3xl text-[15px] leading-7 text-[#56675f]">{seller.description}</p> : null}
          </div>
          {seller.warranty ? (
            <div className="hidden max-w-xs shrink-0 items-start gap-3 rounded-[20px] bg-[#fbf8f1] p-5 ring-1 ring-[#eadfc6] 2xl:flex">
              <ShieldCheck size={22} className="mt-0.5 shrink-0 text-[#0f5a45]" />
              <p className="text-sm leading-6 text-[#3d4b45]">{seller.warranty}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}