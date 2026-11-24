import { cn } from "@/lib/utils";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function toDate(value: string | Date) {
  if (value instanceof Date) return { date: value, timeZone: "Asia/Tehran" };
  if (DATE_ONLY.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return { date: new Date(Date.UTC(y, m - 1, d)), timeZone: "UTC" };
  }
  return { date: new Date(value), timeZone: "Asia/Tehran" };
}

export function DualDate({ value, className }: { value: string | Date | null | undefined; className?: string }) {
  if (!value) return <span className={className}>—</span>;
  const { date, timeZone } = toDate(value);
  if (Number.isNaN(date.getTime())) return <span className={className}>{String(value)}</span>;
  const shamsi = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(date);
  const miladi = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }).format(date);
  return (
    <span className={cn("inline-flex flex-col whitespace-nowrap leading-tight", className)}>
      <span className="font-medium">{shamsi}</span>
      <span className="text-[11px] text-slate-500" dir="ltr">
        {miladi}
      </span>
    </span>
  );
}