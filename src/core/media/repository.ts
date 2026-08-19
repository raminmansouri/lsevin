import "server-only";
import { sql } from "@core/db/client";
import type { CoreMediaItem } from "./types";

function mediaSelect() {
  return sql`
    m.id::text as id,
    m.original_name as "originalName",
    m.file_url as "fileUrl",
    m.mime_type as "mimeType",
    m.media_type as "mediaType",
    coalesce(m.file_size, 0)::bigint as "fileSize",
    m.title_translations as "titleTranslations",
    m.alt_translations as "altTranslations",
    m.created_by::text as "createdBy",
    m.is_public as "isPublic",
    m.create_date::text as "createdAt"
  `;
}

export async function listAccessibleMedia(input: { userId: string; providerId: string; query?: string; mediaType?: string; limit?: number }): Promise<CoreMediaItem[]> {
  const query = input.query?.trim() ?? "";
  const mediaType = input.mediaType?.trim() ?? "";
  const rows = await sql<(Omit<CoreMediaItem, "ownedByProvider"> & { ownedByProvider: boolean })[]>`
    select ${mediaSelect()},
      exists (
        select 1 from provider_portal.media_ownership owned
        where owned.media_id = m.id and owned.service_provider_id = ${input.providerId}::uuid
      ) as "ownedByProvider"
    from media.media_library m
    where (
      m.created_by = ${input.userId}::uuid
      or exists (
        select 1 from provider_portal.media_ownership owned
        where owned.media_id = m.id and owned.service_provider_id = ${input.providerId}::uuid
      )
    )
      and (${mediaType} = '' or m.media_type = ${mediaType})
      and (${query} = '' or m.original_name ilike '%' || ${query} || '%' or m.file_url ilike '%' || ${query} || '%'
        or exists (select 1 from jsonb_each_text(coalesce(m.title_translations, '{}'::jsonb)) item where item.value ilike '%' || ${query} || '%'))
    order by m.create_date desc
    limit ${Math.min(80, Math.max(12, input.limit ?? 48))}
  `;
  return rows.map((row) => ({ ...row, fileSize: Number(row.fileSize || 0), ownedByProvider: Boolean(row.ownedByProvider) }));
}

export async function getAccessibleMediaByReferences(input: { userId: string; providerId: string; references: string[] }): Promise<CoreMediaItem[]> {
  const references = [...new Set(input.references.map((item) => item.trim()).filter(Boolean))];
  if (!references.length) return [];
  const rows = await sql<(Omit<CoreMediaItem, "ownedByProvider"> & { ownedByProvider: boolean })[]>`
    select ${mediaSelect()},
      exists (select 1 from provider_portal.media_ownership owned where owned.media_id = m.id and owned.service_provider_id = ${input.providerId}::uuid) as "ownedByProvider"
    from media.media_library m
    where (m.id::text in ${sql(references)} or m.file_url in ${sql(references)})
      and (m.created_by = ${input.userId}::uuid or exists (
        select 1 from provider_portal.media_ownership owned
        where owned.media_id = m.id and owned.service_provider_id = ${input.providerId}::uuid
      ))
    order by m.create_date desc
  `;
  const mapped = rows.map((row) => ({ ...row, fileSize: Number(row.fileSize || 0), ownedByProvider: Boolean(row.ownedByProvider) }));
  const byRef = new Map<string, CoreMediaItem>();
  mapped.forEach((item) => { byRef.set(item.id, item); byRef.set(item.fileUrl, item); });
  return references.map((reference) => byRef.get(reference)).filter((item): item is CoreMediaItem => Boolean(item));
}

export async function createOwnedMedia(input: {
  providerId: string;
  userId: string;
  originalName: string;
  storedName: string;
  fileUrl: string;
  storagePath: string;
  storageKey: string;
  mimeType: string;
  extension?: string | null;
  mediaType: "image" | "video" | "file";
  fileSize: number;
  ownershipRole: "owner" | "admin" | "manager" | "editor";
}) {
  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`
      insert into media.media_library (
        title_translations, description_translations, alt_translations,
        original_name, stored_name, file_url, storage_path, storage_key,
        mime_type, extension, media_type, file_size, created_by, is_public,
        create_date, last_modified_date
      ) values (
        '{}'::jsonb, '{}'::jsonb, '{}'::jsonb,
        ${input.originalName}, ${input.storedName}, ${input.fileUrl}, ${input.storagePath}, ${input.storageKey},
        ${input.mimeType}, ${input.extension || null}, ${input.mediaType}, ${input.fileSize}, ${input.userId}::uuid, false,
        now(), now()
      ) returning id::text
    `;
    await tx`
      insert into provider_portal.media_ownership(media_id, service_provider_id, owner_user_id, ownership_role, source)
      values (${rows[0].id}::uuid, ${input.providerId}::uuid, ${input.userId}::uuid, ${input.ownershipRole}, 'provider_portal')
      on conflict(media_id, service_provider_id) do update set owner_user_id = excluded.owner_user_id
    `;
    return rows[0].id;
  });
}

export async function assertMediaReferenceAccessible(input: { userId: string; providerId: string; reference?: string | null }) {
  const reference = String(input.reference || "").trim();
  if (!reference) return null;
  const rows = await getAccessibleMediaByReferences({ ...input, references: [reference] });
  if (!rows[0]) {
    const allowLegacy = process.env.ALLOW_LEGACY_MEDIA_URLS === "true" && process.env.NODE_ENV !== "production";
    if (allowLegacy && (/^(https?:)?\/\//i.test(reference) || reference.startsWith("/"))) return null;
    throw new Error("The selected media file is not available to this provider or user.");
  }
  return rows[0];
}

export async function listUserOwnedMedia(input: { userId: string; query?: string; mediaType?: string; limit?: number }): Promise<CoreMediaItem[]> {
  const query = input.query?.trim() ?? "";
  const mediaType = input.mediaType?.trim() ?? "";
  const rows = await sql<(Omit<CoreMediaItem, "ownedByProvider"> & { ownedByProvider: boolean })[]>`
    select ${mediaSelect()}, false as "ownedByProvider"
    from media.media_library m
    where m.created_by=${input.userId}::uuid
      and (${mediaType}='' or m.media_type=${mediaType})
      and (${query}='' or m.original_name ilike '%'||${query}||'%' or m.file_url ilike '%'||${query}||'%'
        or exists(select 1 from jsonb_each_text(coalesce(m.title_translations,'{}'::jsonb)) x where x.value ilike '%'||${query}||'%'))
    order by m.create_date desc
    limit ${Math.min(80, Math.max(12, input.limit ?? 48))}
  `;
  return rows.map((row) => ({ ...row, fileSize: Number(row.fileSize || 0), ownedByProvider: false, sharedByProvider: false }));
}

export async function getUserOwnedMediaByReferences(input: { userId: string; references: string[] }): Promise<CoreMediaItem[]> {
  const references=[...new Set(input.references.map((v)=>v.trim()).filter(Boolean))];
  if(!references.length) return [];
  const rows=await sql<(Omit<CoreMediaItem,"ownedByProvider"> & {ownedByProvider:boolean})[]>`
    select ${mediaSelect()}, false as "ownedByProvider"
    from media.media_library m
    where m.created_by=${input.userId}::uuid and (m.id::text in ${sql(references)} or m.file_url in ${sql(references)})
    order by m.create_date desc
  `;
  const mapped=rows.map((row)=>({...row,fileSize:Number(row.fileSize||0),ownedByProvider:false,sharedByProvider:false}));
  const byRef=new Map<string,CoreMediaItem>(); mapped.forEach((x)=>{byRef.set(x.id,x);byRef.set(x.fileUrl,x)});
  return references.map((r)=>byRef.get(r)).filter((x):x is CoreMediaItem=>Boolean(x));
}

export async function createUserOwnedMedia(input: { userId:string; originalName:string; storedName:string; fileUrl:string; storagePath:string; storageKey:string; mimeType:string; extension?:string|null; mediaType:"image"|"video"|"file"; fileSize:number }) {
  const rows=await sql<{id:string}[]>`
    insert into media.media_library(title_translations,description_translations,alt_translations,original_name,stored_name,file_url,storage_path,storage_key,mime_type,extension,media_type,file_size,created_by,is_public,create_date,last_modified_date)
    values('{}'::jsonb,'{}'::jsonb,'{}'::jsonb,${input.originalName},${input.storedName},${input.fileUrl},${input.storagePath},${input.storageKey},${input.mimeType},${input.extension||null},${input.mediaType},${input.fileSize},${input.userId}::uuid,false,now(),now())
    returning id::text
  `;
  return rows[0].id;
}

export async function assertUserOwnedMediaReference(input:{userId:string;reference?:string|null}) {
  const reference=String(input.reference||'').trim(); if(!reference) return null;
  const rows=await getUserOwnedMediaByReferences({userId:input.userId,references:[reference]});
  if(!rows[0]) throw new Error('The selected media file is not owned by this LSevin user.');
  return rows[0];
}

async function assertApprovedStaffWorkspace(input:{userId:string;providerId:string;staffId:string}) {
  const rows=await sql<{ok:boolean}[]>`
    select true ok
    from provider_portal_ext.profile_claims pc
    join category.staff st on st.id=pc.target_id and st.is_active=true
    join category.provider_staffs ps on ps.staff_id=st.id and ps.service_provider_id=pc.service_provider_id and ps.is_active=true
    join category.service_providers sp on sp.id=pc.service_provider_id and sp.is_active=true
    where pc.claimant_user_id=${input.userId}::uuid and pc.target_type='staff' and pc.target_id=${input.staffId}::uuid
      and pc.service_provider_id=${input.providerId}::uuid and pc.status='approved' and pc.clinic_review_status='approved'
      and pc.lsevin_review_status='approved' and pc.payment_status in ('not_required','paid','waived') limit 1
  `;
  if(!rows[0]?.ok) throw new Error('Approved active staff workspace access is required.');
}

export async function listStaffWorkspaceMedia(input:{userId:string;providerId:string;staffId:string;query?:string;mediaType?:string;limit?:number}):Promise<CoreMediaItem[]> {
  await assertApprovedStaffWorkspace(input);
  const query=input.query?.trim()??''; const mediaType=input.mediaType?.trim()??'';
  const rows=await sql<(Omit<CoreMediaItem,"ownedByProvider"> & {ownedByProvider:boolean;sharedByProvider:boolean})[]>`
    select ${mediaSelect()},
      exists(select 1 from provider_portal.media_ownership owned where owned.media_id=m.id and owned.service_provider_id=${input.providerId}::uuid) as "ownedByProvider",
      exists(select 1 from provider_portal.media_staff_access msa where msa.media_id=m.id and msa.service_provider_id=${input.providerId}::uuid and msa.staff_id=${input.staffId}::uuid) as "sharedByProvider"
    from media.media_library m
    where (m.created_by=${input.userId}::uuid or exists(select 1 from provider_portal.media_staff_access msa where msa.media_id=m.id and msa.service_provider_id=${input.providerId}::uuid and msa.staff_id=${input.staffId}::uuid))
      and (${mediaType}='' or m.media_type=${mediaType})
      and (${query}='' or m.original_name ilike '%'||${query}||'%' or m.file_url ilike '%'||${query}||'%')
    order by m.create_date desc limit ${Math.min(100,Math.max(12,input.limit??48))}
  `;
  return rows.map((row)=>({...row,fileSize:Number(row.fileSize||0),ownedByProvider:Boolean(row.ownedByProvider),sharedByProvider:Boolean(row.sharedByProvider)}));
}

export async function getStaffWorkspaceMediaByReferences(input:{userId:string;providerId:string;staffId:string;references:string[]}):Promise<CoreMediaItem[]> {
  const all=await listStaffWorkspaceMedia({...input,limit:100}); const refs=new Set(input.references.map((v)=>v.trim()).filter(Boolean));
  return all.filter((item)=>refs.has(item.id)||refs.has(item.fileUrl));
}

export async function grantProviderMediaToStaff(input:{userId:string;providerId:string;staffId:string;mediaId:string}) {
  const valid=await sql<{ok:boolean}[]>`
    select true ok from provider_portal.media_ownership owned
    join category.provider_staffs ps on ps.service_provider_id=owned.service_provider_id and ps.staff_id=${input.staffId}::uuid and ps.is_active=true
    join category.service_providers sp on sp.id=owned.service_provider_id and sp.is_active=true
    where owned.media_id=${input.mediaId}::uuid and owned.service_provider_id=${input.providerId}::uuid limit 1
  `;
  if(!valid[0]?.ok) throw new Error('Provider media or active staff relationship was not found.');
  await sql`insert into provider_portal.media_staff_access(media_id,service_provider_id,staff_id,granted_by_user_id) values(${input.mediaId}::uuid,${input.providerId}::uuid,${input.staffId}::uuid,${input.userId}::uuid) on conflict(media_id,service_provider_id,staff_id) do nothing`;
}
export async function revokeProviderMediaFromStaff(input:{providerId:string;staffId:string;mediaId:string}) { await sql`delete from provider_portal.media_staff_access where media_id=${input.mediaId}::uuid and service_provider_id=${input.providerId}::uuid and staff_id=${input.staffId}::uuid`; }
export async function listProviderMediaStaffGrants(providerId:string) { return sql<{mediaId:string;staffId:string;createdAt:string}[]>`select media_id::text "mediaId", staff_id::text "staffId", created_at::text "createdAt" from provider_portal.media_staff_access where service_provider_id=${providerId}::uuid order by created_at desc`; }
