import db from "@/config/database/db";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { AmenityCatalog } from "@/features/stays/ui/admin/amenity-catalog";

export default async function AmenitiesPage() {
  await adminPageActor();
  const entries = await db<{code:string; label:Record<string,string>; icon:string|null; revision:number; imageId:string|null}[]>`
    select code,label,icon,revision,image_id::text as "imageId" from stay.amenities where is_active order by coalesce(parent_code,code), parent_code nulls first, sort_order`;
  return <AmenityCatalog entries={entries} />;
}
