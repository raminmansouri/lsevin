import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminBookingPaymentPolicies } from '@/features/commercial/api/server/get-admin-commercial';
import { BookingPaymentPoliciesTable } from '@/features/commercial/components/admin/payment-policies/payment-policies-table';

export default async function BookingPaymentPoliciesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>>; }) {
  const params = await searchParams;
  const search = typeof params?.search === 'string' ? params.search : '';
  const scopeType = typeof params?.scopeType === 'string' ? params.scopeType : '';
  const active = typeof params?.active === 'string' ? params.active : '';

  const rows = await getAdminBookingPaymentPolicies({ search, scopeType, active });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Booking payment policies</h1>
          <p className="text-sm text-muted-foreground">Define free-booking, deposit, and full-prepay reservation rules by provider type, provider, service definition, or exact provider service.</p>
        </div>
        <Button asChild><Link href="/admin/commercial/payment-policies/new"><Plus className="mr-2 h-4 w-4" />New payment policy</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Search and filter</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4">
            <input type="text" name="search" defaultValue={search} placeholder="Search by name" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <select name="scopeType" defaultValue={scopeType} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All scope types</option>
              <option value="global">global</option>
              <option value="provider_type">provider_type</option>
              <option value="provider">provider</option>
              <option value="service_definition">service_definition</option>
              <option value="provider_service">provider_service</option>
            </select>
            <select name="active" defaultValue={active} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">Any status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <div className="flex gap-2"><Button type="submit" variant="outline">Apply</Button></div>
          </form>
        </CardContent>
      </Card>

      <BookingPaymentPoliciesTable rows={rows} />
    </div>
  );
}
