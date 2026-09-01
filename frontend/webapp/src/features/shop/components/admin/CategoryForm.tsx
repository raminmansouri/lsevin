import { upsertCategoryForm } from "../../actions/admin-catalog.actions";
import { MediaUrlField } from "./MediaUrlField";

const input = "h-9 w-full rounded border border-gray-300 px-2 text-sm";

export function CategoryForm({
  category,
  categories,
}: {
  category?: {
    id: string;
    slug: string;
    parent_id: string | null;
    display_order: number;
    is_active: boolean;
    image_url: string | null;
    banner_url: string | null;
    icon: string | null;
    gradient: string | null;
    name_translations: Record<string, string>;
    description_translations: Record<string, string>;
  };
  categories: Array<{ id: string; name: string }>;
}) {
  const nt = category?.name_translations ?? {};
  const dt = category?.description_translations ?? {};

  return (
    <form action={upsertCategoryForm} className="max-w-2xl space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <div className="grid grid-cols-3 gap-2">
        <label className="text-sm">Name (EN)<input name="name_en" defaultValue={nt.en ?? ""} required className={input} /></label>
        <label className="text-sm">Name (FA)<input name="name_fa" defaultValue={nt.fa ?? ""} className={input} dir="rtl" /></label>
        <label className="text-sm">Name (AR)<input name="name_ar" defaultValue={nt.ar ?? ""} className={input} dir="rtl" /></label>
        <label className="text-sm">Description (EN)<input name="desc_en" defaultValue={dt.en ?? ""} className={input} /></label>
        <label className="text-sm">Description (FA)<input name="desc_fa" defaultValue={dt.fa ?? ""} className={input} dir="rtl" /></label>
        <label className="text-sm">Description (AR)<input name="desc_ar" defaultValue={dt.ar ?? ""} className={input} dir="rtl" /></label>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <label className="text-sm">Slug<input name="slug" defaultValue={category?.slug ?? ""} required pattern="[a-z0-9-]+" className={input} /></label>
        <label className="text-sm">Parent
          <select name="parentId" defaultValue={category?.parent_id ?? ""} className={input}>
            <option value="">— none (top-level) —</option>
            {categories.filter((c) => c.id !== category?.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Display order<input name="displayOrder" type="number" defaultValue={category?.display_order ?? 0} className={input} /></label>
        <label className="mt-5 flex items-center gap-1 text-sm"><input type="checkbox" name="isActive" defaultChecked={category?.is_active ?? true} /> active</label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">Icon (emoji)<input name="icon" defaultValue={category?.icon ?? ""} className={input} /></label>
        <label className="text-sm">Gradient (tailwind classes)<input name="gradient" defaultValue={category?.gradient ?? ""} className={input} placeholder="from-emerald-500 to-teal-600" /></label>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <MediaUrlField name="imageUrl" label="Category image (shortcut icon)" defaultValue={category?.image_url} />
        <MediaUrlField name="bannerUrl" label="Category banner" defaultValue={category?.banner_url} />
      </div>
      <button className="rounded-lg bg-[#083f30] px-4 py-2 text-sm font-semibold text-white">Save category</button>
    </form>
  );
}
