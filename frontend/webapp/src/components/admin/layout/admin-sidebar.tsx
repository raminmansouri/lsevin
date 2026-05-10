import { useTranslations } from "next-intl";
import Link from "next/link";
import { Database, TableProperties } from "lucide-react";
import { ResolvedTableDefinition } from "@/lib/admin/types";

type Props = {
  navigation: ResolvedTableDefinition[];
};

export function AdminSidebar({ navigation }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const grouped = navigation.reduce<Record<string, ResolvedTableDefinition[]>>((acc, item) => {
    acc[item.schema] ||= [];
    acc[item.schema].push(item);
    return acc;
  }, {});

  return (
    <aside className="hidden border-r border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-950">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto p-4">
        <div className="mb-6 flex items-center gap-3 px-2 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">{tAdmin("adminDashboard")}</p>
            <p className="text-xs text-zinc-500">{tAdmin("schemaAwareNavigation")}</p>
          </div>
        </div>

        <nav className="space-y-6">
          {Object.entries(grouped).map(([schema, items]) => (
            <div key={schema}>
              <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {schema}
              </div>
              <div className="space-y-1">
                {items.map((item) => (
                  <Link
                    key={item.key}
                    href={`/admin/${item.schema}/${item.table}`}
                    className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  >
                    <TableProperties className="h-4 w-4 shrink-0 text-zinc-500" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </div>
    </aside>
  );
}
