import Link from "next/link";
import { Database, Lock, CalendarCheck, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { AdminDashboardCard } from "../types";

function schemaIcon(schema: string) {
  if (schema === "booking") return CalendarCheck;
  if (schema === "identity") return Lock;
  if (schema === "customer") return Users;
  return Database;
}

export function AdminDataDashboard({ cards }: { cards: AdminDashboardCard[] }) {
  const grouped = cards.reduce<Record<string, AdminDashboardCard[]>>((acc, card) => {
    acc[card.schema] ||= [];
    acc[card.schema].push(card);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-gradient-to-br from-[#0f182b] via-[#155e75] to-[#139ddc] p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">Admin data control</p>
        <h1 className="mt-3 text-3xl font-bold">Booking, Identity & Customer</h1>
        <p className="mt-3 max-w-3xl text-white/80">
          Direct PostgreSQL admin console for operational bookings, ASP.NET Identity users/roles/security records, customer profiles, documents, favorites, and wallet flows.
        </p>
      </div>

      {Object.entries(grouped).map(([schema, items]) => {
        const Icon = schemaIcon(schema);
        return (
          <section key={schema} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-100 text-gray-700"><Icon className="h-5 w-5" /></div>
              <div>
                <h2 className="text-xl font-semibold capitalize">{schema} schema</h2>
                <p className="text-sm text-muted-foreground">{items.length} managed tables and views</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((card) => (
                <Link key={`${card.schema}.${card.table}`} href={card.href}>
                  <Card className="h-full rounded-2xl border-gray-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-3">
                        <CardTitle className="text-base">{card.title}</CardTitle>
                        {card.readOnly && <Badge variant="outline">Read-only</Badge>}
                      </div>
                      <CardDescription className="line-clamp-2">{card.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-gray-900">{card.total.toLocaleString()}</div>
                      <div className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">records</div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
