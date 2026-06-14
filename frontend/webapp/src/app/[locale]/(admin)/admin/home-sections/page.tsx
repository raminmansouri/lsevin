import type { Metadata } from 'next';

import { PageHeader } from '@/components/page/page-header';
import { getAdminHomeSections } from '@/features/home-admin/api/server/get-home-sections-admin';
import { HomeSectionsTable } from '@/features/home-admin/components/home-sections-table';
import type { PageProps } from '@/types/next';

export const metadata: Metadata = {
  title: 'Home sections',
  description: 'Manage mobile home page editorial sections.',
};

export default async function AdminHomeSectionsPage({ params }: PageProps) {
  const resolved = await params;
  const locale = String((resolved as { locale?: string } | undefined)?.locale || 'fa-IR');
  const sections = await getAdminHomeSections(locale);

  return (
    <div className="space-y-6">
      <div><PageHeader title="Home sections" /><p className="mt-1 text-sm text-muted-foreground">Control the content displayed on the mobile booking home page.</p></div>
      <HomeSectionsTable sections={sections} />
    </div>
  );
}
