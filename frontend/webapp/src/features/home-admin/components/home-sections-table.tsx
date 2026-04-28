import { Edit, Image as ImageIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { Link } from '@/i18n/navigation';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';

import type { HomeSectionListItem } from '../types';

export function HomeSectionsTable({ sections }: { sections: HomeSectionListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Home sections</CardTitle>
        <CardDescription>
          Edit app home page content blocks such as hero featured copy, nearby discovery, premium packages, and loyalty club.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Section</th>
                <th className="px-4 py-3 font-semibold">Content</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sections.map((section) => {
                const mediaUrl = resolveHomeMediaUrl(section.imageUrl);

                return (
                  <tr key={section.sectionKey} className="bg-background align-middle">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                          {mediaUrl ? (
                            <ImageWithFallback fill src={mediaUrl} alt={section.title} sizes="56px" className="object-cover" />
                          ) : (
                            <ImageIcon className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <div className="font-mono text-xs text-muted-foreground">{section.sectionKey}</div>
                          <div className="font-semibold text-foreground">{section.title}</div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[420px] px-4 py-4">
                      <div className="line-clamp-2 text-muted-foreground">{section.subtitle || '-'}</div>
                      {section.buttonHref ? <div className="mt-1 font-mono text-xs text-muted-foreground">{section.buttonHref}</div> : null}
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={section.isActive ? 'default' : 'secondary'}>{section.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-4">{section.displayOrder}</td>
                    <td className="px-4 py-4 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/home-sections/${encodeURIComponent(section.sectionKey)}/update`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
