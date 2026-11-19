import { PageHeader } from "@/components/page/page-header";
import sql from "@/config/database/db";
import { HeroArchForm } from "@/features/home-admin/components/hero-arch-form";

export const dynamic = "force-dynamic";

export default async function AdminHeroArchesPage() {
  const rows = await sql<
    { slot: number; image_url: string | null; label_translations: Record<string, string> | null; link_url: string | null }[]
  >`
    select slot::int as slot, image_url, label_translations, link_url
    from marketing.home_hero_arches
    order by slot
  `;

  return (
    <div className="space-y-6">
      <div>
        <PageHeader title="عکس‌های هیرو" />
        <p className="mt-1 text-sm text-muted-foreground">
          سه عکس طاقی بالای صفحهٔ اصلی (نسخهٔ دسکتاپ). طاق اول بزرگ و وسط است، دو طاق دیگر دو طرف آن. اگر برای طاقی عکس نگذارید، عکس دستهٔ هم‌شماره نمایش داده می‌شود.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {rows.map((row) => (
          <HeroArchForm
            key={row.slot}
            arch={{
              slot: row.slot,
              imageUrl: row.image_url ?? "",
              label: { translations: row.label_translations ?? {} },
              linkUrl: row.link_url ?? "",
            }}
          />
        ))}
      </div>
    </div>
  );
}