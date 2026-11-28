import db from "@/config/database/db";
import { adminPageActor } from "@/features/tours/server/admin/page-actor";
import { AmenityCatalog, type AmenityEntry } from "@/features/stays/ui/admin/amenity-catalog";

/** Amenity catalogue: every amenity (switched-off ones too), its options and how widely it is used. */
export default async function AmenitiesPage() {
  await adminPageActor();
  const entries = await db<AmenityEntry[]>`
    select a.code, a.label, a.icon, a.revision, a.image_id::text as "imageId", m.file_url as "imageUrl",
           a.grp as "group", a.parent_code as "parentCode", a.sort_order as "sortOrder", a.is_active as "isActive",
           (select count(*)::int from stay.properties p where a.code = any(p.amenity_codes))
             + (select count(*)::int from stay.room_types r where a.code = any(r.amenity_codes)) as "usage"
      from stay.amenities a
      left join media.media_library m on m.id = a.image_id
     order by a.sort_order, a.code`;
  return <AmenityCatalog entries={entries} />;
}
