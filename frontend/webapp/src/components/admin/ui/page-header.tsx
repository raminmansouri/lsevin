import { ReactNode } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type Breadcrumb = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  description?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  createHref?: string;
  children?: ReactNode;
};

/**
 * The header for the metadata-driven `/admin/[schema]/[table]` screens.
 *
 * Two things are gone from the previous version. The "Refresh" control was a
 * bare `<button>` with no `onClick` inside a server component — a permanently
 * inert control shown on every generated admin page. And the whole component was
 * painted in hardcoded `zinc-*` with a `bg-zinc-900` CTA, so these pages ignored
 * the theme and looked like a different product from the rest of the panel; it
 * now uses the same tokens and `buttonVariants` as everything else.
 */
export async function PageHeader({
  title,
  description,
  breadcrumbs = [],
  createHref,
  children,
}: Props) {
  const t = await getTranslations("Admin");

  return (
    <div className="space-y-3">
      {breadcrumbs.length > 0 && (
        <nav className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-foreground transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span>{crumb.label}</span>
              )}
              {index < breadcrumbs.length - 1 ? (
                <ChevronRight className="size-3" />
              ) : null}
            </div>
          ))}
        </nav>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="text-muted-foreground text-sm">{description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {children}
          {createHref ? (
            <Link
              href={createHref}
              className={cn(buttonVariants({ size: "sm" }), "gap-2")}
            >
              <Plus className="size-4" />
              {t("actions.create")}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
