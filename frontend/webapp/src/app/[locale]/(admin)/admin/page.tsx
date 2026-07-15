import Link from "next/link";
import { Database, ShieldCheck, TableProperties, Trash2 } from "lucide-react";
import { getResolvedAdminNavigation } from "@/lib/admin/metadata";
import { getAdminPermissions, permissionForTable } from "@/lib/admin/guard";
import { PageHeader } from "@/components/admin/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { UserRole } from "@/types/common";
import { PurgeCacheButton } from "./purge-cache-button";

export default async function AdminHomePage() {
  const [navigation, permissions, session] = await Promise.all([
    getResolvedAdminNavigation(),
    getAdminPermissions(),
    getSession().catch(() => null),
  ]);

  const roles = session?.user?.roles;
  const isPrivileged = Boolean(
    roles?.includes(UserRole.SuperAdmin) || roles?.includes(UserRole.Admin)
  );

  const allowed = navigation.filter((item) =>
    permissionForTable(permissions, item.schema, item.table)?.canRead
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Admin" description="Metadata-driven PostgreSQL dashboard" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <Database className="h-5 w-5" />
          </div>
          <div className="text-2xl font-semibold">{allowed.length}</div>
          <p className="mt-1 text-sm text-zinc-500">Accessible tables</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-2xl font-semibold">{permissions.length}</div>
          <p className="mt-1 text-sm text-zinc-500">Permission rows aggregated</p>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            <TableProperties className="h-5 w-5" />
          </div>
          <div className="text-2xl font-semibold">CRUD</div>
          <p className="mt-1 text-sm text-zinc-500">Lists, create, edit, relations, locale-aware rendering</p>
        </div>
      </div>

      {isPrivileged ? (
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">System cache</h2>
              <p className="text-sm text-zinc-500">
                Force-rebuild every cached page and data query across the app.
              </p>
            </div>
          </div>
          <PurgeCacheButton />
        </div>
      ) : null}

      <div className="rounded-3xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Tables</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {allowed.map((item) => (
            <Link
              key={item.key}
              href={`/admin/${item.schema}/${item.table}`}
              className="rounded-2xl border border-zinc-200 p-4 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
            >
              <div className="text-sm font-medium">{item.label}</div>
              <div className="mt-1 text-xs text-zinc-500">
                {item.schema}.{item.table}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
