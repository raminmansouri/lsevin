import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/page/page-header';
import { getAdminHomeSectionByKey } from '@/features/home-admin/api/server/get-home-sections-admin';
import { HomeSectionForm } from '@/features/home-admin/components/home-section-form';
import type { PageProps } from '@/types/next';

export const metadata: Metadata = {
  title: 'Update home section',
  description: 'Update mobile home section content.',
};

export default async function UpdateHomeSectionPage({ params }: PageProps) {
  const resolved = await params;
  const sectionKey = decodeURIComponent(String((resolved as { sectionKey?: string }).sectionKey || ''));
  const section = await getAdminHomeSectionByKey(sectionKey);

  if (!section) notFound();

  return (
    <div className="space-y-6">
      <div><PageHeader title="Update home section" /><p className="mt-1 font-mono text-sm text-muted-foreground">{section.sectionKey}</p></div>
      <HomeSectionForm section={section} />
    </div>
  );
}
