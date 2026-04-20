import Link from "next/link";
import { ChevronRight, Plus, RefreshCcw } from "lucide-react";

type Breadcrumb = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  createHref?: string;
};

export function PageHeader({ title, description, breadcrumbs = [], createHref }: Props) {
  return (
    <div className="mb-6 rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      {breadcrumbs.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1 text-xs text-zinc-500">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span>{crumb.label}</span>}
              {index < breadcrumbs.length - 1 ? <ChevronRight className="h-3 w-3" /> : null}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
          {createHref ? (
            <Link
              href={createHref}
              className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2 text-sm text-white hover:opacity-90 dark:bg-white dark:text-zinc-950"
            >
              <Plus className="h-4 w-4" />
              Create
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
