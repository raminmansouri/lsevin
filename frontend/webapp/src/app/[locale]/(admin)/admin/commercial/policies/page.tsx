import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminCompensationPolicies } from '@/features/commercial/api/server/get-admin-commercial';
import { PoliciesTable } from '@/features/commercial/components/admin/policies/policies-table';

export default async function CommercialPoliciesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>>; }) {
  const params = await searchParams;
  const search = typeof params?.search === 'string' ? params.search : '';
  const scopeType = typeof params?.scopeType === 'string' ? params.scopeType : '';
  const appliesTo = typeof params?.appliesTo === 'string' ? params.appliesTo : '';
  const active = typeof params?.active === 'string' ? params.active : '';

  const rows = await getAdminCompensationPolicies({ search, scopeType, appliesTo, active });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Compensation policies</h1>
          <p className="text-sm text-muted-foreground">Define how LSevin splits gross booking value into platform fee and provider payable by scope and booking line type.</p>
        </div>
        <Button asChild><Link href="/admin/commercial/policies/new"><Plus className="mr-2 h-4 w-4" />New policy</Link></Button>
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
              <option value="addon">addon</option>
            </select>
            <select name="appliesTo" defaultValue={appliesTo} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">All applies-to targets</option>
              <option value="main_booking">main_booking</option>
              <option value="child_booking">child_booking</option>
              <option value="addon">addon</option>
            </select>
            <div className="flex gap-2">
              <select name="active" defaultValue={active} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                <option value="">Any status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <Button type="submit" variant="outline">Apply</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <PoliciesTable rows={rows} />
    </div>
  );
}
