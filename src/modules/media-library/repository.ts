import "server-only";
import { sql } from "@core/db/client";

export type ModuleRecord = { id: string; status?: string | null; type?: string | null; createdAt?: string | null };

export type MediaAssetItem = {
  id: string;
  originalName: string;
  fileUrl: string;
  mimeType: string;
  mediaKind: string;
  sizeBytes: string;
  titleTranslations: Record<string, string>;
  altTranslations: Record<string, string>;
  isPublic: boolean;
  moderationStatus: string;
  decisionReason: string | null;
  createdAt: string;
};

export type MediaUsageItem = MediaAssetItem & {
  usageId: string;
  ownerEntityType: string;
  ownerEntityId: string;
  usageKind: string;
  displayOrder: number;
  isPrimary: boolean;
  publicVisibility: string;
};

export async function getModuleSummary(providerId?: string) {
  const [records, assets] = await Promise.all([listRecentRecords(providerId), listMediaAssets({ providerId, limit: 100 })]);
  return {
    recordCount: records.length,
    providerId: providerId ?? null,
    assetsCount: assets.length,
    pendingCount: assets.filter((asset) => asset.moderationStatus === "pending").length,
    approvedCount: assets.filter((asset) => asset.moderationStatus === "approved").length,
  };
}

export async function listRecentRecords(providerId?: string): Promise<ModuleRecord[]> {
  try {
    if (providerId) {
      return sql<ModuleRecord[]>`
        select ma.id::text as id, ma.moderation_status as status, ma.media_kind as type, ma.created_at::text as "createdAt"
        from media_library.media_assets ma
        join media_library.media_usages mu on mu.media_asset_id = ma.id
        where mu.owner_service_provider_id = ${providerId}::uuid or mu.owner_entity_id = ${providerId}::uuid
        order by ma.created_at desc
        limit 10
      `;
    }
    return sql<ModuleRecord[]>`
      select id::text as id, moderation_status as status, media_kind as type, created_at::text as "createdAt"
      from media_library.media_assets
      order by created_at desc
      limit 10
    `;
  } catch {
    return [];
  }
}

export async function listMediaAssets(input: { providerId?: string; status?: string; limit?: number } = {}): Promise<MediaAssetItem[]> {
  const limit = input.limit ?? 50;
  try {
    if (input.providerId) {
      return sql<MediaAssetItem[]>`
        select ${assetSelectFragment()}
        from media_library.media_assets ma
        where exists (
          select 1
          from media_library.media_usages mu
          where mu.media_asset_id = ma.id
            and (mu.owner_service_provider_id = ${input.providerId}::uuid or mu.owner_entity_id = ${input.providerId}::uuid)
        )
          and (${input.status || ""} = '' or ma.moderation_status = ${input.status || ""})
        order by ma.created_at desc
        limit ${limit}
      `;
    }
    return sql<MediaAssetItem[]>`
      select ${assetSelectFragment()}
      from media_library.media_assets ma
      where (${input.status || ""} = '' or ma.moderation_status = ${input.status || ""})
      order by ma.created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

export async function listMediaUsages(providerId: string, limit = 50): Promise<MediaUsageItem[]> {
  try {
    return sql<MediaUsageItem[]>`
      select
        ma.id::text as id,
        ma.original_name as "originalName",
        ma.file_url as "fileUrl",
        ma.mime_type as "mimeType",
        ma.media_kind as "mediaKind",
        ma.size_bytes::text as "sizeBytes",
        ma.title_translations as "titleTranslations",
        ma.alt_translations as "altTranslations",
        ma.is_public as "isPublic",
        ma.moderation_status as "moderationStatus",
        ma.decision_reason as "decisionReason",
        ma.created_at::text as "createdAt",
        mu.id::text as "usageId",
        mu.owner_entity_type as "ownerEntityType",
        mu.owner_entity_id::text as "ownerEntityId",
        mu.usage_kind as "usageKind",
        mu.display_order::int as "displayOrder",
        mu.is_primary as "isPrimary",
        mu.public_visibility as "publicVisibility"
      from media_library.media_usages mu
      join media_library.media_assets ma on ma.id = mu.media_asset_id
      where mu.owner_service_provider_id = ${providerId}::uuid or mu.owner_entity_id = ${providerId}::uuid
      order by mu.display_order, ma.created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

function assetSelectFragment() {
  return sql`
    ma.id::text as id,
    ma.original_name as "originalName",
    ma.file_url as "fileUrl",
    ma.mime_type as "mimeType",
    ma.media_kind as "mediaKind",
    ma.size_bytes::text as "sizeBytes",
    ma.title_translations as "titleTranslations",
    ma.alt_translations as "altTranslations",
    ma.is_public as "isPublic",
    ma.moderation_status as "moderationStatus",
    ma.decision_reason as "decisionReason",
    ma.created_at::text as "createdAt"
  `;
}

export async function createMediaAsset(input: {
  originalName: string;
  fileUrl: string;
  mimeType: string;
  mediaKind: string;
  sizeBytes?: number;
  titleTranslations: Record<string, string>;
  altTranslations: Record<string, string>;
  createdByUserId: string;
  moderationStatus?: string;
}) {
  const rows = await sql<{ id: string }[]>`
    insert into media_library.media_assets(original_name, file_url, mime_type, media_kind, size_bytes, title_translations, alt_translations, created_by_user_id, is_public, moderation_status)
    values (${input.originalName}, ${input.fileUrl}, ${input.mimeType}, ${input.mediaKind}, ${input.sizeBytes ?? 0}, ${sql.json(input.titleTranslations)}, ${sql.json(input.altTranslations)}, ${input.createdByUserId}::uuid, true, ${input.moderationStatus ?? "pending"})
    returning id::text
  `;
  return rows[0].id;
}

export async function attachMediaToEntity(input: { mediaAssetId: string; providerId: string; ownerEntityType: string; ownerEntityId: string; usageKind: string; displayOrder: number; isPrimary: boolean }) {
  await sql.begin(async (tx) => {
    const ownerRows = input.ownerEntityType === "provider"
      ? await tx<{ ok: boolean }[]>`select (${input.ownerEntityId}::uuid = ${input.providerId}::uuid) as ok`
      : input.ownerEntityType === "service"
        ? await tx<{ ok: boolean }[]>`select exists(select 1 from category.provider_services where id = ${input.ownerEntityId}::uuid and service_provider_id = ${input.providerId}::uuid) as ok`
        : input.ownerEntityType === "staff"
          ? await tx<{ ok: boolean }[]>`select exists(select 1 from category.provider_staffs where id = ${input.ownerEntityId}::uuid and service_provider_id = ${input.providerId}::uuid) as ok`
          : [];
    if (!ownerRows[0]?.ok) throw new Error("Media can only be attached to this provider or its own service/staff records.");
    if (input.isPrimary) {
      await tx`
        update media_library.media_usages
        set is_primary = false
        where owner_entity_type = ${input.ownerEntityType}
          and owner_entity_id = ${input.ownerEntityId}::uuid
          and owner_service_provider_id = ${input.providerId}::uuid
          and usage_kind = ${input.usageKind}
      `;
    }
    await tx`
      insert into media_library.media_usages(media_asset_id, owner_entity_type, owner_entity_id, owner_service_provider_id, usage_kind, display_order, is_primary, public_visibility)
      values (${input.mediaAssetId}::uuid, ${input.ownerEntityType}, ${input.ownerEntityId}::uuid, ${input.providerId}::uuid, ${input.usageKind}, ${input.displayOrder}, ${input.isPrimary}, 'pending')
    `;
  });
}

export async function setMediaPrimary(input: { usageId: string; providerId: string }) {
  const usageRows = await sql<{ ownerEntityType: string; ownerEntityId: string; usageKind: string }[]>`
    select owner_entity_type as "ownerEntityType", owner_entity_id::text as "ownerEntityId", usage_kind as "usageKind"
    from media_library.media_usages
    where id = ${input.usageId}::uuid and (owner_service_provider_id = ${input.providerId}::uuid or owner_entity_id = ${input.providerId}::uuid)
    limit 1
  `;
  const usage = usageRows[0];
  if (!usage) throw new Error("Media usage was not found for this provider.");
  await sql.begin(async (tx) => {
    await tx`
      update media_library.media_usages
      set is_primary = false
      where owner_entity_type = ${usage.ownerEntityType}
        and owner_entity_id = ${usage.ownerEntityId}::uuid
        and owner_service_provider_id = ${input.providerId}::uuid
        and usage_kind = ${usage.usageKind}
    `;
    await tx`update media_library.media_usages set is_primary = true where id = ${input.usageId}::uuid`;
  });
}

export async function reviewMediaAsset(input: { mediaAssetId: string; decision: "approved" | "rejected" | "hidden"; reviewerUserId: string; reason?: string }) {
  const visibility = input.decision === "approved" ? "approved" : "hidden";
  await sql.begin(async (tx) => {
    await tx`
      update media_library.media_assets
      set moderation_status = ${input.decision}, reviewed_by_user_id = ${input.reviewerUserId}::uuid, reviewed_at = now(), decision_reason = nullif(${input.reason || ""}, ''), updated_at = now()
      where id = ${input.mediaAssetId}::uuid
    `;
    await tx`update media_library.media_usages set public_visibility = ${visibility} where media_asset_id = ${input.mediaAssetId}::uuid`;
  });
}
