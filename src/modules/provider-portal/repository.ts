import "server-only";
import { sql } from "@core/db/client";

export type ModuleRecord = {
  id: string;
  status?: string | null;
  type?: string | null;
  createdAt?: string | null;
};

export type ProfileClaimRecord = {
  id: string;
  targetType: string;
  targetId: string;
  claimantUserId: string;
  serviceProviderId: string | null;
  clinicReviewStatus: string;
  lsevinReviewStatus: string;
  paymentStatus: string;
  status: string;
  evidence: Record<string, unknown>;
  note: string | null;
  decisionReason: string | null;
  createdAt: string;
};

export type ContentDraftRecord = {
  id: string;
  serviceProviderId: string;
  entityType: string;
  entityId: string;
  locale: string;
  sectionKey: string;
  title: string | null;
  draftPayload: Record<string, unknown>;
  previousSnapshot: Record<string, unknown>;
  status: string;
  submittedByUserId: string | null;
  reviewedByUserId: string | null;
  decisionReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
};

export type PublishedSnapshotRecord = {
  id: string;
  serviceProviderId: string;
  entityType: string;
  entityId: string;
  locale: string;
  sectionKey: string;
  snapshotPayload: Record<string, unknown>;
  versionNo: number;
  publishedAt: string;
};

export async function getModuleSummary(providerId?: string) {
  const [claims, drafts, snapshots] = await Promise.all([
    listProfileClaims(providerId, 50),
    listContentDrafts({ providerId, limit: 50 }),
    listPublishedSnapshots(providerId, 50),
  ]);
  return {
    recordCount: claims.length,
    providerId: providerId ?? null,
    claimsCount: claims.length,
    pendingClaimsCount: claims.filter((claim) => !["approved", "rejected", "revoked", "disabled"].includes(claim.status)).length,
    pendingDraftsCount: drafts.filter((draft) => draft.status === "submitted").length,
    publishedSnapshotsCount: snapshots.length,
  };
}

export async function listRecentRecords(providerId?: string): Promise<ModuleRecord[]> {
  try {
    if (providerId) {
      return sql<ModuleRecord[]>`
        select id::text as id, status, target_type as type, created_at::text as "createdAt"
        from provider_portal_ext.profile_claims
        where service_provider_id = ${providerId}::uuid or target_id = ${providerId}::uuid
        order by created_at desc
        limit 10
      `;
    }
    return sql<ModuleRecord[]>`
      select id::text as id, status, target_type as type, created_at::text as "createdAt"
      from provider_portal_ext.profile_claims
      order by created_at desc
      limit 10
    `;
  } catch {
    return [];
  }
}

export async function listProfileClaims(providerId?: string, limit = 50): Promise<ProfileClaimRecord[]> {
  const selectSql = sql<ProfileClaimRecord[]>`
    select
      id::text,
      target_type as "targetType",
      target_id::text as "targetId",
      claimant_user_id::text as "claimantUserId",
      service_provider_id::text as "serviceProviderId",
      clinic_review_status as "clinicReviewStatus",
      lsevin_review_status as "lsevinReviewStatus",
      payment_status as "paymentStatus",
      status,
      evidence,
      note,
      decision_reason as "decisionReason",
      created_at::text as "createdAt"
    from provider_portal_ext.profile_claims
  `;
  try {
    if (providerId) {
      return sql<ProfileClaimRecord[]>`${selectSql}
        where service_provider_id = ${providerId}::uuid or target_id = ${providerId}::uuid
        order by created_at desc
        limit ${limit}
      `;
    }
    return sql<ProfileClaimRecord[]>`${selectSql}
      order by created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

export async function getProfileClaim(claimId: string) {
  try {
    const rows = await sql<ProfileClaimRecord[]>`
      select
        id::text,
        target_type as "targetType",
        target_id::text as "targetId",
        claimant_user_id::text as "claimantUserId",
        service_provider_id::text as "serviceProviderId",
        clinic_review_status as "clinicReviewStatus",
        lsevin_review_status as "lsevinReviewStatus",
        payment_status as "paymentStatus",
        status,
        evidence,
        note,
        decision_reason as "decisionReason",
        created_at::text as "createdAt"
      from provider_portal_ext.profile_claims
      where id = ${claimId}::uuid
      limit 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function nextClaimStatus(clinicReviewStatus: string, lsevinReviewStatus: string, paymentStatus: string) {
  if (clinicReviewStatus === "rejected" || lsevinReviewStatus === "rejected") return "rejected";
  if (clinicReviewStatus !== "approved") return "clinic_review";
  if (lsevinReviewStatus !== "approved") return "lsevin_review";
  if (["paid", "waived", "not_required"].includes(paymentStatus)) return "approved";
  return "payment_required";
}

export async function updateClaimReview(input: {
  claimId: string;
  scope: "clinic" | "lsevin";
  decision: "approved" | "rejected";
  actorUserId: string;
  reason?: string;
}) {
  const claim = await getProfileClaim(input.claimId);
  if (!claim) throw new Error("Profile claim was not found.");

  const clinicReviewStatus = input.scope === "clinic" ? input.decision : claim.clinicReviewStatus;
  const lsevinReviewStatus = input.scope === "lsevin" ? input.decision : claim.lsevinReviewStatus;
  const status = nextClaimStatus(clinicReviewStatus, lsevinReviewStatus, claim.paymentStatus);

  if (input.scope === "clinic") {
    await sql`
      update provider_portal_ext.profile_claims
      set clinic_review_status = ${input.decision},
          clinic_reviewed_by_user_id = ${input.actorUserId}::uuid,
          clinic_reviewed_at = now(),
          status = ${status},
          decision_reason = nullif(${input.reason || ""}, ''),
          updated_at = now()
      where id = ${input.claimId}::uuid
    `;
  } else {
    await sql`
      update provider_portal_ext.profile_claims
      set lsevin_review_status = ${input.decision},
          lsevin_reviewed_by_user_id = ${input.actorUserId}::uuid,
          lsevin_reviewed_at = now(),
          status = ${status},
          decision_reason = nullif(${input.reason || ""}, ''),
          updated_at = now()
      where id = ${input.claimId}::uuid
    `;
  }

  await insertAuditEvent({
    providerId: claim.serviceProviderId,
    actorUserId: input.actorUserId,
    eventType: `profile_claim.${input.scope}.${input.decision}`,
    entityType: "profile_claim",
    entityId: claim.id,
    reason: input.reason,
    payload: { claimId: claim.id, targetType: claim.targetType, targetId: claim.targetId, status },
  });
}

export async function attachInvoiceToProfileClaim(input: { claimId: string; invoiceId: string; invoiceNumber: string; totalAmount: string; currencyCode: string; paymentUrl: string }) {
  await sql`
    update provider_portal_ext.profile_claims
    set payment_status = 'invoiced',
        status = 'payment_required',
        evidence = coalesce(evidence, '{}'::jsonb) || ${JSON.stringify({ paymentBilling: input })}::jsonb,
        updated_at = now()
    where id = ${input.claimId}::uuid
  `;
}

export async function waiveProfileClaimPayment(claimId: string) {
  await sql`
    update provider_portal_ext.profile_claims
    set payment_status = 'waived',
        status = case when clinic_review_status = 'approved' and lsevin_review_status = 'approved' then 'approved' else status end,
        evidence = coalesce(evidence, '{}'::jsonb) || jsonb_build_object('paymentWaivedAt', now()),
        updated_at = now()
    where id = ${claimId}::uuid
  `;
}

export async function listContentDrafts(input: { providerId?: string; status?: string; limit?: number } = {}): Promise<ContentDraftRecord[]> {
  const limit = input.limit ?? 50;
  try {
    if (input.providerId && input.status) {
      return sql<ContentDraftRecord[]>`
        select ${contentDraftSelect()}
        from provider_portal_ext.content_drafts
        where service_provider_id = ${input.providerId}::uuid and status = ${input.status}
        order by created_at desc
        limit ${limit}
      `;
    }
    if (input.providerId) {
      return sql<ContentDraftRecord[]>`
        select ${contentDraftSelect()}
        from provider_portal_ext.content_drafts
        where service_provider_id = ${input.providerId}::uuid
        order by created_at desc
        limit ${limit}
      `;
    }
    if (input.status) {
      return sql<ContentDraftRecord[]>`
        select ${contentDraftSelect()}
        from provider_portal_ext.content_drafts
        where status = ${input.status}
        order by created_at desc
        limit ${limit}
      `;
    }
    return sql<ContentDraftRecord[]>`
      select ${contentDraftSelect()}
      from provider_portal_ext.content_drafts
      order by created_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

function contentDraftSelect() {
  return sql`
    id::text,
    service_provider_id::text as "serviceProviderId",
    entity_type as "entityType",
    entity_id::text as "entityId",
    locale,
    section_key as "sectionKey",
    title,
    draft_payload as "draftPayload",
    previous_snapshot as "previousSnapshot",
    status,
    submitted_by_user_id::text as "submittedByUserId",
    reviewed_by_user_id::text as "reviewedByUserId",
    decision_reason as "decisionReason",
    submitted_at::text as "submittedAt",
    reviewed_at::text as "reviewedAt",
    published_at::text as "publishedAt",
    created_at::text as "createdAt"
  `;
}

export async function listPublishedSnapshots(providerId?: string, limit = 50): Promise<PublishedSnapshotRecord[]> {
  try {
    if (providerId) {
      return sql<PublishedSnapshotRecord[]>`
        select
          id::text,
          service_provider_id::text as "serviceProviderId",
          entity_type as "entityType",
          entity_id::text as "entityId",
          locale,
          section_key as "sectionKey",
          snapshot_payload as "snapshotPayload",
          version_no::int as "versionNo",
          published_at::text as "publishedAt"
        from provider_portal_ext.published_content_snapshots
        where service_provider_id = ${providerId}::uuid and is_current = true
        order by published_at desc
        limit ${limit}
      `;
    }
    return sql<PublishedSnapshotRecord[]>`
      select
        id::text,
        service_provider_id::text as "serviceProviderId",
        entity_type as "entityType",
        entity_id::text as "entityId",
        locale,
        section_key as "sectionKey",
        snapshot_payload as "snapshotPayload",
        version_no::int as "versionNo",
        published_at::text as "publishedAt"
      from provider_portal_ext.published_content_snapshots
      where is_current = true
      order by published_at desc
      limit ${limit}
    `;
  } catch {
    return [];
  }
}

export async function submitContentDraft(input: {
  providerId: string;
  entityType: string;
  entityId: string;
  locale: string;
  sectionKey: string;
  title?: string;
  draftPayload: Record<string, unknown>;
  submittedByUserId: string;
}) {
  const previousRows = await sql<{ snapshotPayload: Record<string, unknown>; versionNo: number }[]>`
    select snapshot_payload as "snapshotPayload", version_no::int as "versionNo"
    from provider_portal_ext.published_content_snapshots
    where entity_type = ${input.entityType}
      and entity_id = ${input.entityId}::uuid
      and locale = ${input.locale}
      and section_key = ${input.sectionKey}
      and is_current = true
    order by published_at desc
    limit 1
  `;

  const rows = await sql<{ id: string }[]>`
    insert into provider_portal_ext.content_drafts (
      service_provider_id, entity_type, entity_id, locale, section_key, title,
      draft_payload, previous_snapshot, status, submitted_by_user_id, submitted_at, updated_at
    ) values (
      ${input.providerId}::uuid, ${input.entityType}, ${input.entityId}::uuid, ${input.locale}, ${input.sectionKey}, nullif(${input.title || ""}, ''),
      ${sql.json(input.draftPayload)}, ${sql.json(previousRows[0]?.snapshotPayload ?? {})}, 'submitted', ${input.submittedByUserId}::uuid, now(), now()
    ) returning id::text
  `;

  await insertAuditEvent({
    providerId: input.providerId,
    actorUserId: input.submittedByUserId,
    eventType: "content_draft.submitted",
    entityType: "content_draft",
    entityId: rows[0].id,
    payload: { entityType: input.entityType, entityId: input.entityId, locale: input.locale, sectionKey: input.sectionKey },
  });

  return rows[0].id;
}

export async function reviewContentDraft(input: { draftId: string; decision: "approved" | "rejected"; reviewedByUserId: string; reason?: string }) {
  const draftRows = await sql<ContentDraftRecord[]>`
    select ${contentDraftSelect()}
    from provider_portal_ext.content_drafts
    where id = ${input.draftId}::uuid
    limit 1
  `;
  const draft = draftRows[0];
  if (!draft) throw new Error("Content draft was not found.");

  if (input.decision === "rejected") {
    await sql`
      update provider_portal_ext.content_drafts
      set status = 'rejected', reviewed_by_user_id = ${input.reviewedByUserId}::uuid, reviewed_at = now(), decision_reason = nullif(${input.reason || ""}, ''), updated_at = now()
      where id = ${input.draftId}::uuid
    `;
  } else {
    await sql.begin(async (tx) => {
      const versionRows = await tx<{ nextVersion: number }[]>`
        select coalesce(max(version_no), 0) + 1 as "nextVersion"
        from provider_portal_ext.published_content_snapshots
        where entity_type = ${draft.entityType}
          and entity_id = ${draft.entityId}::uuid
          and locale = ${draft.locale}
          and section_key = ${draft.sectionKey}
      `;
      await tx`
        update provider_portal_ext.published_content_snapshots
        set is_current = false
        where entity_type = ${draft.entityType}
          and entity_id = ${draft.entityId}::uuid
          and locale = ${draft.locale}
          and section_key = ${draft.sectionKey}
          and is_current = true
      `;
      await tx`
        insert into provider_portal_ext.published_content_snapshots (
          service_provider_id, entity_type, entity_id, locale, section_key, snapshot_payload, source_draft_id, version_no, published_by_user_id
        ) values (
          ${draft.serviceProviderId}::uuid, ${draft.entityType}, ${draft.entityId}::uuid, ${draft.locale}, ${draft.sectionKey}, ${tx.json(JSON.parse(JSON.stringify(draft.draftPayload)))}, ${input.draftId}::uuid, ${versionRows[0]?.nextVersion ?? 1}, ${input.reviewedByUserId}::uuid
        )
      `;
      await tx`
        update provider_portal_ext.content_drafts
        set status = 'published', reviewed_by_user_id = ${input.reviewedByUserId}::uuid, reviewed_at = now(), published_at = now(), decision_reason = nullif(${input.reason || ""}, ''), updated_at = now()
        where id = ${input.draftId}::uuid
      `;
    });
  }

  await insertAuditEvent({
    providerId: draft.serviceProviderId,
    actorUserId: input.reviewedByUserId,
    eventType: `content_draft.${input.decision}`,
    entityType: "content_draft",
    entityId: draft.id,
    reason: input.reason,
    payload: { entityType: draft.entityType, entityId: draft.entityId, locale: draft.locale, sectionKey: draft.sectionKey },
  });
}

export async function insertAuditEvent(input: {
  providerId?: string | null;
  actorUserId?: string | null;
  eventType: string;
  entityType: string;
  entityId?: string | null;
  reason?: string;
  payload?: Record<string, unknown>;
}) {
  await sql`
    insert into provider_portal_ext.audit_events(service_provider_id, actor_user_id, event_type, entity_type, entity_id, reason, payload)
    values (${input.providerId || null}::uuid, ${input.actorUserId || null}::uuid, ${input.eventType}, ${input.entityType}, ${input.entityId || null}::uuid, nullif(${input.reason || ""}, ''), ${sql.json(input.payload ?? {})})
  `;
}
