import "server-only";

import db from "@/config/database/db";

import { ProviderServiceRelationsDetails, ServiceDefinitionRelationsDetails } from "../types";

const FALLBACK_LOCALE = "en-US";
const asJson = (value: unknown) => JSON.stringify(value ?? {});

function parseMetadata(value?: string | null): Record<string, unknown> {
  if (!value?.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    throw new Error("Metadata must be valid JSON.");
  }
}

export async function getProviderServiceRelations(providerServiceId: string, locale: string): Promise<ProviderServiceRelationsDetails | null> {
  const baseRows = await db`
    select
      ps.id as provider_service_id,
      common.get_translation_t(ps.display_name_translations, ${locale}, ${FALLBACK_LOCALE}) as provider_service_name,
      sd.id as service_definition_id,
      common.get_translation_t(sd.name_translations, ${locale}, ${FALLBACK_LOCALE}) as service_definition_name
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    where ps.id = ${providerServiceId}
    limit 1
  `;
  const base = baseRows[0] as any;
  if (!base) return null;

  const addons = await db`
    select a.id as addon_id, a.name as addon_name, a.addon_kind, a.source_type, a.price, a.icon
    from category.provider_service_addons psa
    join category.addons a on a.id = psa.addon_id
    where psa.provider_service_id = ${providerServiceId}
    order by a.name asc
  `;
  const faqs = await db`select id, question, answer from category.service_faqs where service_id = ${providerServiceId} order by id asc`;
  const included = await db`select id, item from category.service_included where service_id = ${providerServiceId} order by item asc, id asc`;
  const process = await db`select id, step, title, description, duration from category.service_process where service_id = ${providerServiceId} order by step asc, id asc`;
  const attributeValues = await db`
    select sav.id, sav.attribute_definition_id,
           common.get_translation_t(sad.name_translations, ${locale}, ${FALLBACK_LOCALE}) as attribute_definition_name,
           sav.value_translations
    from category.service_attribute_values sav
    join category.service_attribute_definitions sad on sad.id = sav.attribute_definition_id
    where sav.provider_service_id = ${providerServiceId}
    order by sad.display_order asc, sav.id asc
  `;
  const availableDefinitions = await db`
    select sad.id, common.get_translation_t(sad.name_translations, ${locale}, ${FALLBACK_LOCALE}) as name
    from category.service_attribute_definitions sad
    where sad.service_definition_id = ${base.service_definition_id}
    order by sad.display_order asc, sad.id asc
  `;

  return {
    providerServiceId: base.provider_service_id,
    providerServiceName: base.provider_service_name,
    serviceDefinitionId: base.service_definition_id,
    serviceDefinitionName: base.service_definition_name,
    addons: addons.map((row: any) => ({ addonId: row.addon_id, addonName: row.addon_name, addonKind: row.addon_kind, sourceType: row.source_type, price: Number(row.price ?? 0), icon: row.icon })),
    faqs: faqs as any,
    included: included as any,
    process: process.map((row: any) => ({ ...row, step: Number(row.step ?? 0) })) as any,
    attributeValues: attributeValues.map((row: any) => ({ id: row.id, attributeDefinitionId: row.attribute_definition_id, attributeDefinitionName: row.attribute_definition_name, valueTranslations: row.value_translations ?? {} })),
    availableAttributeDefinitions: availableDefinitions.map((row: any) => ({ id: row.id, name: row.name })),
  };
}

export async function getServiceDefinitionRelations(serviceDefinitionId: string, locale: string): Promise<ServiceDefinitionRelationsDetails | null> {
  const baseRows = await db`
    select sd.id as service_definition_id,
           common.get_translation_t(sd.name_translations, ${locale}, ${FALLBACK_LOCALE}) as service_definition_name
    from category.service_definitions sd
    where sd.id = ${serviceDefinitionId}
    limit 1
  `;
  const base = baseRows[0] as any;
  if (!base) return null;

  const addonProviderTypes = await db`
    select sapt.id, sapt.provider_type_id,
           common.get_translation_t(pt.name_translations, ${locale}, ${FALLBACK_LOCALE}) as provider_type_name,
           sapt.icon, sapt.display_order, sapt.is_required, sapt.metadata
    from category.service_definition_addon_provider_types sapt
    join category.provider_types pt on pt.id = sapt.provider_type_id
    where sapt.service_definition_id = ${serviceDefinitionId}
    order by sapt.display_order asc, pt.create_date asc
  `;

  const attributeDefinitions = await db`
    select sad.id,
           sad.name_translations,
           sad.description_translations,
           common.get_translation_t(sad.name_translations, ${locale}, ${FALLBACK_LOCALE}) as name,
           common.get_translation_t(sad.description_translations, ${locale}, ${FALLBACK_LOCALE}) as description,
           sad.attribute_type_id,
           at.name as attribute_type_name,
           sad.is_required,
           sad.affects_pricing,
           sad.display_order,
           coalesce((
             select jsonb_agg(
               jsonb_build_object(
                 'optionId', o.id,
                 'displayNameTranslations', o.display_name_translations,
                 'valueTranslations', o.value_translations,
                 'additionalPrice', o.additional_price
               ) order by o.id asc
             )
             from category.service_attribute_definition_options o
             where o.service_attribute_definition_id = sad.id
           ), '[]'::jsonb) as options
    from category.service_attribute_definitions sad
    join category.attribute_types at on at.id = sad.attribute_type_id
    where sad.service_definition_id = ${serviceDefinitionId}
    order by sad.display_order asc, sad.id asc
  `;

  return {
    serviceDefinitionId: base.service_definition_id,
    serviceDefinitionName: base.service_definition_name,
    addonProviderTypes: addonProviderTypes.map((row: any) => ({ id: row.id, providerTypeId: row.provider_type_id, providerTypeName: row.provider_type_name, icon: row.icon, displayOrder: Number(row.display_order ?? 0), isRequired: Boolean(row.is_required), metadata: row.metadata ?? {} })),
    attributeDefinitions: attributeDefinitions.map((row: any) => ({ id: row.id, nameTranslations: row.name_translations ?? {}, descriptionTranslations: row.description_translations ?? {}, name: row.name, description: row.description, attributeTypeId: Number(row.attribute_type_id), attributeTypeName: row.attribute_type_name, isRequired: Boolean(row.is_required), affectsPricing: Boolean(row.affects_pricing), displayOrder: Number(row.display_order ?? 0), options: row.options ?? [] })),
  };
}

export async function addProviderServiceAddon(providerServiceId: string, addonId: string) {
  await db`insert into category.provider_service_addons (provider_service_id, addon_id) values (${providerServiceId}, ${addonId}) on conflict (provider_service_id, addon_id) do nothing`;
}
export async function removeProviderServiceAddon(providerServiceId: string, addonId: string) {
  await db`delete from category.provider_service_addons where provider_service_id = ${providerServiceId} and addon_id = ${addonId}`;
}

export async function upsertServiceFaq(input: { providerServiceId: string; faqId?: string; question: string; answer: string; }) {
  if (input.faqId) { await db`update category.service_faqs set question = ${input.question}, answer = ${input.answer} where id = ${input.faqId} and service_id = ${input.providerServiceId}`; return { id: input.faqId }; }
  const rows = await db`insert into category.service_faqs (id, service_id, question, answer) values (public.uuid_generate_v4(), ${input.providerServiceId}, ${input.question}, ${input.answer}) returning id`;
  return { id: rows[0].id as string };
}
export async function deleteServiceFaq(providerServiceId: string, faqId: string) { await db`delete from category.service_faqs where id = ${faqId} and service_id = ${providerServiceId}`; }

export async function upsertServiceIncluded(input: { providerServiceId: string; includedId?: string; item: string; }) {
  if (input.includedId) { await db`update category.service_included set item = ${input.item} where id = ${input.includedId} and service_id = ${input.providerServiceId}`; return { id: input.includedId }; }
  const rows = await db`insert into category.service_included (id, service_id, item) values (public.uuid_generate_v4(), ${input.providerServiceId}, ${input.item}) returning id`;
  return { id: rows[0].id as string };
}
export async function deleteServiceIncluded(providerServiceId: string, includedId: string) { await db`delete from category.service_included where id = ${includedId} and service_id = ${providerServiceId}`; }

export async function upsertServiceProcess(input: { providerServiceId: string; processId?: string; step: number; title: string; description?: string; duration?: string; }) {
  if (input.processId) { await db`update category.service_process set step = ${input.step}, title = ${input.title}, description = ${input.description ?? null}, duration = ${input.duration ?? null} where id = ${input.processId} and service_id = ${input.providerServiceId}`; return { id: input.processId }; }
  const rows = await db`insert into category.service_process (id, service_id, step, title, description, duration) values (public.uuid_generate_v4(), ${input.providerServiceId}, ${input.step}, ${input.title}, ${input.description ?? null}, ${input.duration ?? null}) returning id`;
  return { id: rows[0].id as string };
}
export async function deleteServiceProcess(providerServiceId: string, processId: string) { await db`delete from category.service_process where id = ${processId} and service_id = ${providerServiceId}`; }

export async function upsertServiceAttributeValue(input: { providerServiceId: string; valueId?: string; attributeDefinitionId: string; valueTranslations: Record<string, string>; }) {
  if (input.valueId) { await db`update category.service_attribute_values set attribute_definition_id = ${input.attributeDefinitionId}, value_translations = ${asJson(input.valueTranslations)}::jsonb, last_modified_date = now() where id = ${input.valueId} and provider_service_id = ${input.providerServiceId}`; return { id: input.valueId }; }
  const rows = await db`insert into category.service_attribute_values (id, attribute_definition_id, value_translations, provider_service_id, create_date) values (public.uuid_generate_v4(), ${input.attributeDefinitionId}, ${asJson(input.valueTranslations)}::jsonb, ${input.providerServiceId}, now()) returning id`;
  return { id: rows[0].id as string };
}
export async function deleteServiceAttributeValue(providerServiceId: string, valueId: string) { await db`delete from category.service_attribute_values where id = ${valueId} and provider_service_id = ${providerServiceId}`; }

export async function upsertAddonProviderType(input: { serviceDefinitionId: string; relationId?: string; providerTypeId: string; icon?: string; displayOrder: number; isRequired: boolean; metadata?: string; }) {
  const metadata = parseMetadata(input.metadata);
  if (input.relationId) { await db`update category.service_definition_addon_provider_types set provider_type_id = ${input.providerTypeId}, icon = ${input.icon ?? null}, display_order = ${input.displayOrder}, is_required = ${input.isRequired}, metadata = ${asJson(metadata)}::jsonb, last_modified_date = now() where id = ${input.relationId} and service_definition_id = ${input.serviceDefinitionId}`; return { id: input.relationId }; }
  const rows = await db`insert into category.service_definition_addon_provider_types (id, service_definition_id, provider_type_id, icon, display_order, is_required, metadata) values (public.uuid_generate_v4(), ${input.serviceDefinitionId}, ${input.providerTypeId}, ${input.icon ?? null}, ${input.displayOrder}, ${input.isRequired}, ${asJson(metadata)}::jsonb) returning id`;
  return { id: rows[0].id as string };
}
export async function deleteAddonProviderType(serviceDefinitionId: string, relationId: string) { await db`delete from category.service_definition_addon_provider_types where id = ${relationId} and service_definition_id = ${serviceDefinitionId}`; }

export async function upsertServiceAttributeDefinition(input: { serviceDefinitionId: string; attributeDefinitionId?: string; nameTranslations: Record<string, string>; descriptionTranslations: Record<string, string>; attributeTypeId: number; isRequired: boolean; affectsPricing: boolean; displayOrder: number; }) {
  if (input.attributeDefinitionId) { await db`update category.service_attribute_definitions set name_translations = ${asJson(input.nameTranslations)}::jsonb, description_translations = ${asJson(input.descriptionTranslations)}::jsonb, attribute_type_id = ${input.attributeTypeId}, is_required = ${input.isRequired}, affects_pricing = ${input.affectsPricing}, display_order = ${input.displayOrder}, last_modified_date = now() where id = ${input.attributeDefinitionId} and service_definition_id = ${input.serviceDefinitionId}`; return { id: input.attributeDefinitionId }; }
  const rows = await db`insert into category.service_attribute_definitions (id, name_translations, description_translations, attribute_type_id, is_required, affects_pricing, display_order, service_definition_id, create_date) values (public.uuid_generate_v4(), ${asJson(input.nameTranslations)}::jsonb, ${asJson(input.descriptionTranslations)}::jsonb, ${input.attributeTypeId}, ${input.isRequired}, ${input.affectsPricing}, ${input.displayOrder}, ${input.serviceDefinitionId}, now()) returning id`;
  return { id: rows[0].id as string };
}
export async function deleteServiceAttributeDefinition(serviceDefinitionId: string, attributeDefinitionId: string) { await db`delete from category.service_attribute_definitions where id = ${attributeDefinitionId} and service_definition_id = ${serviceDefinitionId}`; }

export async function upsertServiceAttributeOption(input: { serviceDefinitionId: string; attributeDefinitionId: string; optionId?: number; displayNameTranslations: Record<string, string>; valueTranslations: Record<string, string>; additionalPrice?: number | null; }) {
  const ownership = await db`select id from category.service_attribute_definitions where id = ${input.attributeDefinitionId} and service_definition_id = ${input.serviceDefinitionId} limit 1`;
  if (!ownership[0]) throw new Error("Attribute definition does not belong to this service definition.");
  if (input.optionId) { await db`update category.service_attribute_definition_options set display_name_translations = ${asJson(input.displayNameTranslations)}::jsonb, value_translations = ${asJson(input.valueTranslations)}::jsonb, additional_price = ${input.additionalPrice ?? null} where service_attribute_definition_id = ${input.attributeDefinitionId} and id = ${input.optionId}`; return { id: input.optionId }; }
  const rows = await db`insert into category.service_attribute_definition_options (service_attribute_definition_id, display_name_translations, value_translations, additional_price) values (${input.attributeDefinitionId}, ${asJson(input.displayNameTranslations)}::jsonb, ${asJson(input.valueTranslations)}::jsonb, ${input.additionalPrice ?? null}) returning id`;
  return { id: Number(rows[0].id) };
}
export async function deleteServiceAttributeOption(attributeDefinitionId: string, optionId: number) { await db`delete from category.service_attribute_definition_options where service_attribute_definition_id = ${attributeDefinitionId} and id = ${optionId}`; }
