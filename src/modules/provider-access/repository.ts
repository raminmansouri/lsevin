import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import type { ProviderMember, ProviderSummary } from "./types";

export async function listMyProviders(userId: string, locale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "fa-IR") {
  const rows = await sql<ProviderSummary[]>`
    select
      sp.id::text as id,
      ${translationSql(sql`sp.name_translations`, locale)} as name,
      ${translationSql(sql`sp.description_translations`, locale)} as description,
      sp.image_url as "imageUrl",
      ${translationSql(sql`pt.name_translations`, locale)} as "providerTypeName",
      pm.role::text as role,
      pm.is_default as "isDefault",
      sp.is_active as "isActive",
      coalesce(sp.rating, 0)::float8 as rating,
      coalesce(sp.review_count, 0)::int as "reviewCount",
      coalesce(svc.count, 0)::int as "serviceCount",
      coalesce(stf.count, 0)::int as "staffCount",
      coalesce(bkg.count, 0)::int as "bookingCount"
    from provider_portal.provider_members pm
    join category.service_providers sp on sp.id = pm.service_provider_id
    join category.provider_types pt on pt.id = sp.provider_type_id
    left join lateral (select count(*) from category.provider_services ps where ps.service_provider_id = sp.id) svc on true
    left join lateral (select count(*) from category.provider_staffs psf where psf.service_provider_id = sp.id) stf on true
    left join lateral (select count(*) from booking.bookings b where b.provider_id = sp.id) bkg on true
    where pm.user_id = ${userId}::uuid and coalesce(pm.status, 'active') = 'active'
    order by pm.is_default desc, sp.create_date desc
  `;
  return rows;
}

export async function listProviderMembers(providerId: string) {
  const rows = await sql<ProviderMember[]>`
    select
      pm.id::text as id,
      pm.user_id::text as "userId",
      trim(concat_ws(' ', u.first_name, u.last_name)) as "fullName",
      u.email,
      pm.role::text as role,
      pm.is_default as "isDefault"
    from provider_portal.provider_members pm
    join identity.asp_net_users u on u.id = pm.user_id
    where pm.service_provider_id = ${providerId}::uuid
    order by pm.is_default desc, pm.create_date asc
  `;
  return rows;
}

export async function resolveUserIdByEmail(email: string) {
  if (!email.trim()) return null;
  const rows = await sql<{ id: string }[]>`
    select id::text from identity.asp_net_users where lower(email) = lower(${email.trim()}) limit 1
  `;
  return rows[0]?.id ?? null;
}

export async function assignExistingProviderToUser(input: { providerId: string; userId: string; role: string; isDefault?: boolean }) {
  await sql.begin(async (tx) => {
    const updated = await tx`
      update provider_portal.provider_members
         set role = ${input.role}::provider_portal.membership_role,
             is_default = ${!!input.isDefault},
             last_modified_date = now()
       where service_provider_id = ${input.providerId}::uuid
         and user_id = ${input.userId}::uuid
      returning id
    `;

    if (updated.count === 0) {
      await tx`
        insert into provider_portal.provider_members (service_provider_id, user_id, role, is_default, metadata)
        values (${input.providerId}::uuid, ${input.userId}::uuid, ${input.role}::provider_portal.membership_role, ${!!input.isDefault}, '{}'::jsonb)
      `;
    }
  });
}

export async function removeProviderMember(providerId: string, memberId: string) {
  await sql`update provider_portal.provider_members set status='revoked', is_default=false, revoked_at=now(), last_modified_date=now() where service_provider_id=${providerId}::uuid and id=${memberId}::uuid and role<>'owner'::provider_portal.membership_role`;
}

export async function findUsersByEmail(query: string) {
  const q = `%${query.trim()}%`;
  return sql<{ id: string; label: string; email: string }[]>`
    select id::text, trim(concat_ws(' ', first_name, last_name)) as label, email
    from identity.asp_net_users
    where email ilike ${q}
    order by created_at desc
    limit 20
  `;
}


export type ProviderMemberInvitation = {
  id:string; providerId:string; providerName:string; intendedUserId:string|null; intendedEmail:string;
  role:"owner"|"admin"|"manager"|"editor"|"viewer"|"staff"; tokenHash:string;
  status:"pending"|"accepted"|"declined"|"cancelled"|"expired"; expiresAt:string;
};
function normalizeEmail(value:string){ return value.trim().toLowerCase(); }
function hashToken(value:string){ return createHash("sha256").update(value,"utf8").digest("hex"); }
export function invitationTokenMatches(token:string, tokenHash:string){
  const actual=Buffer.from(hashToken(token),"hex"); const expected=Buffer.from(String(tokenHash||""),"hex");
  return actual.length===expected.length && actual.length>0 && timingSafeEqual(actual,expected);
}
export async function getProviderMemberInvitation(invitationId:string):Promise<ProviderMemberInvitation|null>{
  const rows=await sql<ProviderMemberInvitation[]>`
    select i.id::text id, i.service_provider_id::text "providerId",
      coalesce(common.get_translation_t(sp.name_translations,'fa-IR','en-US'),sp.email,sp.id::text) "providerName",
      i.intended_user_id::text "intendedUserId", i.intended_email "intendedEmail", i.role::text role,
      i.token_hash "tokenHash", i.status, i.expires_at::text "expiresAt"
    from provider_portal.provider_member_invitations i join category.service_providers sp on sp.id=i.service_provider_id
    where i.id=${invitationId}::uuid limit 1`;
  return rows[0]??null;
}
export async function acceptProviderMemberInvitation(input:{invitationId:string;token:string;userId:string;userEmail:string}){
  return sql.begin(async(tx)=>{
    const rows=await tx<ProviderMemberInvitation[]>`
      select i.id::text id,i.service_provider_id::text "providerId",''::text "providerName",i.intended_user_id::text "intendedUserId",i.intended_email "intendedEmail",i.role::text role,i.token_hash "tokenHash",i.status,i.expires_at::text "expiresAt"
      from provider_portal.provider_member_invitations i where i.id=${input.invitationId}::uuid for update`;
    const invitation=rows[0]; if(!invitation) throw new Error('Invitation was not found.');
    if(invitation.status!=="pending") throw new Error('Invitation is no longer pending.');
    if(!invitationTokenMatches(input.token,invitation.tokenHash)) throw new Error('Invitation token is invalid.');
    if(invitation.intendedUserId && invitation.intendedUserId!==input.userId) throw new Error('Invitation is intended for another LSevin user.');
    if(normalizeEmail(invitation.intendedEmail)!==normalizeEmail(input.userEmail)) throw new Error('Invitation is intended for another LSevin email.');
    if(new Date(invitation.expiresAt).getTime()<=Date.now()) { await tx`update provider_portal.provider_member_invitations set status='expired',last_modified_date=now() where id=${input.invitationId}::uuid`; throw new Error('Invitation has expired.'); }
    const existing=await tx<{id:string;role:string;status:string}[]>`select id::text,role::text,status::text from provider_portal.provider_members where service_provider_id=${invitation.providerId}::uuid and user_id=${input.userId}::uuid limit 1`;
    let memberId=existing[0]?.id;
    if(memberId){ await tx`update provider_portal.provider_members set role=${invitation.role}::provider_portal.membership_role,status='active',status_reason=null,revoked_at=null,suspended_at=null,accepted_at=coalesce(accepted_at,now()),last_modified_date=now() where id=${memberId}::uuid`; }
    else { const inserted=await tx<{id:string}[]>`insert into provider_portal.provider_members(service_provider_id,user_id,role,is_default,metadata,status,invited_by_user_id,accepted_at) select ${invitation.providerId}::uuid,${input.userId}::uuid,${invitation.role}::provider_portal.membership_role,false,'{}'::jsonb,'active',created_by_user_id,now() from provider_portal.provider_member_invitations where id=${input.invitationId}::uuid returning id::text`; memberId=inserted[0].id; }
    await tx`update provider_portal.provider_member_invitations set status='accepted',accepted_by_user_id=${input.userId}::uuid,accepted_at=now(),last_modified_date=now() where id=${input.invitationId}::uuid`;
    await tx`insert into provider_portal.provider_member_audit(service_provider_id,member_id,target_user_id,actor_user_id,action,previous_state,new_state) values(${invitation.providerId}::uuid,${memberId}::uuid,${input.userId}::uuid,${input.userId}::uuid,'membership_invitation_accepted',${sql.json(existing[0]??{})},${sql.json({status:'active',role:invitation.role})})`;
    return {providerId:invitation.providerId,memberId};
  });
}
export async function declineProviderMemberInvitation(input:{invitationId:string;token:string;userId:string;userEmail:string}){
  const invitation=await getProviderMemberInvitation(input.invitationId); if(!invitation||invitation.status!=="pending") throw new Error('Invitation is no longer pending.');
  if(!invitationTokenMatches(input.token,invitation.tokenHash)) throw new Error('Invitation token is invalid.');
  if(invitation.intendedUserId&&invitation.intendedUserId!==input.userId) throw new Error('Invitation is intended for another LSevin user.');
  if(normalizeEmail(invitation.intendedEmail)!==normalizeEmail(input.userEmail)) throw new Error('Invitation is intended for another LSevin email.');
  await sql`update provider_portal.provider_member_invitations set status='declined',declined_at=now(),last_modified_date=now() where id=${input.invitationId}::uuid and status='pending'`;
}
