import Link from "next/link";
import { PropsWithChildren } from "react";
import { Bell, Search, UserCircle2 } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { ResolvedTableDefinition } from "@/lib/admin/types";

type Props = PropsWithChildren<{
  navigation: ResolvedTableDefinition[];
}>;

export function AdminShell({ navigation, children }: Props) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-[280px_1fr]">
        <AdminSidebar navigation={navigation} />
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
            <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-950">
                  <Search className="h-5 w-5" />
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-medium">Dynamic Admin</p>
                  <p className="truncate text-xs text-zinc-500">Metadata-driven dashboard</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="rounded-xl border border-zinc-200 p-2 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900">
                  <Bell className="h-4 w-4" />
                </button>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  <UserCircle2 className="h-4 w-4" />
                  Admin
                </Link>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
