import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const RTL = new Set(["fa", "ar", "ku"]);

function pageList(page: number, total: number): Array<number | "gap"> {
  const wanted = [1, 2, total - 1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total);
  const sorted = [...new Set(wanted)].sort((a, b) => a - b);
  const out: Array<number | "gap"> = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev === 2) out.push(prev + 1);
    else if (p - prev > 2) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

function Chevron({ pointsRight }: { pointsRight: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={pointsRight ? "M9 6l6 6-6 6" : "M15 6l-6 6 6 6"} />
    </svg>
  );
}

export function ShopPagination({
  page,
  totalPages,
  locale,
  hrefFor,
  onSelect,
}: {
  page: number;
  totalPages: number;
  locale: string;
  hrefFor?: (page: number) => string;
  onSelect?: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const rtl = RTL.has(locale.split("-")[0]);
  const number = new Intl.NumberFormat(locale);
  const base = "grid h-11 min-w-11 place-items-center rounded-xl px-2 text-base font-semibold transition";

  const item = (target: number, content: React.ReactNode, className: string, current = false) => {
    if (hrefFor) {
      return (
        <Link href={hrefFor(target)} aria-current={current ? "page" : undefined} className={className}>
          {content}
        </Link>
      );
    }
    return (
      <button type="button" onClick={() => onSelect?.(target)} aria-current={current ? "page" : undefined} className={className}>
        {content}
      </button>
    );
  };

  return (
    <nav className="flex items-center justify-center gap-1.5" data-testid="shop-pagination">
      {page > 1
        ? item(page - 1, <Chevron pointsRight={rtl} />, cn(base, "text-neutral-500 hover:bg-[#f7f2e6] hover:text-[#083f30]"))
        : <span className={cn(base, "text-neutral-300")} aria-hidden="true"><Chevron pointsRight={rtl} /></span>}
      {pageList(page, totalPages).map((p, index) =>
        p === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-neutral-400" aria-hidden="true">…</span>
        ) : (
          <span key={p}>
            {item(
              p,
              number.format(p),
              p === page
                ? cn(base, "bg-[#f7f2e6] text-[#083f30] ring-[1.5px] ring-[#c9a55a]")
                : cn(base, "text-neutral-500 hover:bg-[#f7f2e6] hover:text-[#083f30]"),
              p === page,
            )}
          </span>
        ),
      )}
      {page < totalPages
        ? item(page + 1, <Chevron pointsRight={!rtl} />, cn(base, "text-neutral-500 hover:bg-[#f7f2e6] hover:text-[#083f30]"))
        : <span className={cn(base, "text-neutral-300")} aria-hidden="true"><Chevron pointsRight={!rtl} /></span>}
    </nav>
  );
}