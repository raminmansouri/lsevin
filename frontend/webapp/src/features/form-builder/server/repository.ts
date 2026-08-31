import "server-only";

import db from "@/config/database/db";
import type {
  DynamicFormSubmissionPayload,
  DynamicFormSubmissionResult,
  FormSubmissionScope,
  FormSubmissionStatus,
  FormUsageScope,
  RuntimeServiceForm,
} from "../types";

type RuntimeIdentity = {
  formId?: string | null;
  formKey?: string | null;
  formVersionId?: string | null;
  serviceDefinitionId?: string | null;
  usageScope?: FormUsageScope;
};

function normalizeUsageScope(value?: string | null): FormUsageScope {
  return value === "child_addon_booking" ? "child_addon_booking" : "main_booking";
}

function normalizeSubmissionScope(value?: string | null): FormSubmissionScope {
  if (value === "admin_preview" || value === "generic" || value === "booking") return value;
  return "booking";
}

function normalizeSubmissionStatus(value?: string | null): FormSubmissionStatus {
  if (value === "draft" || value === "submitted" || value === "archived") return value;
  return "submitted";
}

function uuidOrNull(value?: string | null) {
  return value && value.trim() ? value : null;
}

async function runtimeFormFromSelectedVersionQuery(whereSql: string, params: unknown[]): Promise<RuntimeServiceForm | null> {
  const rows = await db.unsafe(
    `
      with selected_version as (
        select
          fv.id as form_version_id,
          fv.form_id,
          fv.version_number,
          fv.title,
          fv.locales,
          fv.settings,
          f.key as form_key,
          f.name as form_name
        from form_builder.form_versions fv
        join form_builder.forms f
          on f.id = fv.form_id
         and f.is_deleted = false
         and f.is_active = true
        where ${whereSql}
        order by
          fv.is_active desc,
          case when fv.status = 'published' then 0 else 1 end,
          fv.version_number desc,
          fv.published_at desc nulls last,
          fv.create_date desc,
          fv.id desc
        limit 1
      )
      select
        sv.form_id,
        sv.form_version_id,
        null::uuid as service_definition_id,
        'main_booking'::text as usage_scope,
        sv.title,
        sv.locales,
        sv.settings,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', s.id,
              'key', s.key,
              'title', s.title,
              'description', s.description,
              'displayOrder', s.display_order,
              'settings', s.settings,
              'fields', (
                select coalesce(
                  jsonb_agg(
                    jsonb_build_object(
                      'id', ff.id,
                      'key', ff.key,
                      'fieldTypeCode', ff.field_type_code,
                      'label', ff.label,
                      'placeholder', ff.placeholder,
                      'helpText', ff.help_text,
                      'defaultValue', ff.default_value,
                      'isRequired', ff.is_required,
                      'isHidden', ff.is_hidden,
                      'isRepeatable', ff.is_repeatable,
                      'displayOrder', ff.display_order,
                      'columnSpan', ff.column_span,
                      'settings', ff.settings,
                      'validationRules', ff.validation_rules,
                      'options', (
                        select coalesce(
                          jsonb_agg(
                            jsonb_build_object(
                              'id', fo.id,
                              'value', fo.value,
                              'label', fo.label,
                              'labelTranslations', fo.label_translations,
                              'metadata', fo.metadata,
                              'displayOrder', fo.display_order
                            )
                            order by fo.display_order asc
                          ),
                          '[]'::jsonb
                        )
                        from form_builder.field_options fo
                        where fo.field_id = ff.id
                      )
                    )
                    order by ff.display_order asc
                  ),
                  '[]'::jsonb
                )
                from form_builder.form_fields ff
                where ff.section_id = s.id
              )
            )
            order by s.display_order asc
          ) filter (where s.id is not null),
          '[]'::jsonb
        ) as sections
      from selected_version sv
      left join form_builder.form_sections s
        on s.form_version_id = sv.form_version_id
      group by
        sv.form_id,
        sv.form_version_id,
        sv.title,
        sv.locales,
        sv.settings
    `,
    params
  );

  if (!rows.length) return null;
  const row = rows[0] as any;

  return {
    formId: row.form_id,
    formVersionId: row.form_version_id,
    serviceDefinitionId: row.service_definition_id,
    usageScope: row.usage_scope,
    locales: row.locales ?? ["en-US"],
    title: row.title,
    settings: row.settings ?? {},
    sections: row.sections ?? [],
  };
}

export async function getActiveServiceForm(
  serviceDefinitionId: string,
  usageScope: FormUsageScope = "main_booking"
): Promise<RuntimeServiceForm | null> {
  const rows = await db`
    with mapped_form as (
      select
        sdf.service_definition_id,
        sdf.usage_scope,
        f.id as form_id
      from form_builder.service_definition_forms sdf
      join form_builder.forms f
        on f.id = sdf.form_id
       and f.is_active = true
       and f.is_deleted = false
      where sdf.service_definition_id = ${serviceDefinitionId}::uuid
        and sdf.usage_scope = ${usageScope}
        and sdf.is_active = true
      order by sdf.display_order asc, sdf.form_id asc
      limit 1
    ),
    selected_version as (
      select
        fv.id as form_version_id,
        fv.form_id,
        fv.title,
        fv.locales,
        fv.settings
      from form_builder.form_versions fv
      join mapped_form mf
        on mf.form_id = fv.form_id
      where fv.status = 'published'
      order by
        fv.is_active desc,
        fv.version_number desc,
        fv.published_at desc nulls last,
        fv.create_date desc,
        fv.id desc
      limit 1
    )
    select
      mf.form_id,
      sv.form_version_id,
      mf.service_definition_id,
      mf.usage_scope,
      sv.title,
      sv.locales,
      sv.settings,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', s.id,
            'key', s.key,
            'title', s.title,
            'description', s.description,
            'displayOrder', s.display_order,
            'settings', s.settings,
            'fields', (
              select coalesce(
                jsonb_agg(
                  jsonb_build_object(
                    'id', ff.id,
                    'key', ff.key,
                    'fieldTypeCode', ff.field_type_code,
                    'label', ff.label,
                    'placeholder', ff.placeholder,
                    'helpText', ff.help_text,
                    'defaultValue', ff.default_value,
                    'isRequired', ff.is_required,
                    'isHidden', ff.is_hidden,
                    'isRepeatable', ff.is_repeatable,
                    'displayOrder', ff.display_order,
                    'columnSpan', ff.column_span,
                    'settings', ff.settings,
                    'validationRules', ff.validation_rules,
                    'options', (
                      select coalesce(
                        jsonb_agg(
                          jsonb_build_object(
                            'id', fo.id,
                            'value', fo.value,
                            'label', fo.label,
                            'labelTranslations', fo.label_translations,
                            'metadata', fo.metadata,
                            'displayOrder', fo.display_order
                          )
                          order by fo.display_order asc
                        ),
                        '[]'::jsonb
                      )
                      from form_builder.field_options fo
                      where fo.field_id = ff.id
                    )
                  )
                  order by ff.display_order asc
                ),
                '[]'::jsonb
              )
              from form_builder.form_fields ff
              where ff.section_id = s.id
            )
          )
          order by s.display_order asc
        ) filter (where s.id is not null),
        '[]'::jsonb
      ) as sections
    from mapped_form mf
    join selected_version sv
      on sv.form_id = mf.form_id
    left join form_builder.form_sections s
      on s.form_version_id = sv.form_version_id
    group by
      mf.form_id,
      sv.form_version_id,
      mf.service_definition_id,
      mf.usage_scope,
      sv.title,
      sv.locales,
      sv.settings
  `;

  if (!rows.length) return null;
  const row = rows[0] as any;

  return {
    formId: row.form_id,
    formVersionId: row.form_version_id,
    serviceDefinitionId: row.service_definition_id,
    usageScope: row.usage_scope,
    locales: row.locales ?? ["en-US"],
    title: row.title,
    settings: row.settings ?? {},
    sections: row.sections ?? [],
  };
}

export async function getRuntimeForm(identity: RuntimeIdentity): Promise<RuntimeServiceForm | null> {
  if (identity.serviceDefinitionId) {
    return getActiveServiceForm(identity.serviceDefinitionId, normalizeUsageScope(identity.usageScope));
  }

  if (identity.formVersionId) {
    return runtimeFormFromSelectedVersionQuery("fv.id = $1::uuid", [identity.formVersionId]);
  }

  if (identity.formId) {
    return runtimeFormFromSelectedVersionQuery("f.id = $1::uuid", [identity.formId]);
  }

  if (identity.formKey) {
    return runtimeFormFromSelectedVersionQuery("f.key = $1", [identity.formKey]);
  }

  return null;
}

export async function saveDynamicFormSubmission(
  payload: DynamicFormSubmissionPayload,
  submittedByUserId?: string | null
): Promise<DynamicFormSubmissionResult> {
  const status = normalizeSubmissionStatus(payload.status);
  const submissionScope = normalizeSubmissionScope(payload.submissionScope);
  const [row] = await db`
    insert into form_builder.submissions (
      form_version_id,
      service_definition_id,
      booking_draft_id,
      booking_draft_child_id,
      booking_id,
      booking_child_id,
      submitted_by_user_id,
      locale,
      submission_scope,
      status,
      payload,
      normalized_payload,
      submitted_at
    ) values (
      ${payload.formVersionId}::uuid,
      ${uuidOrNull(payload.serviceDefinitionId)}::uuid,
      ${uuidOrNull(payload.bookingDraftId)}::uuid,
      ${uuidOrNull(payload.bookingDraftChildId)}::uuid,
      ${uuidOrNull(payload.bookingId)}::uuid,
      ${uuidOrNull(payload.bookingChildId)}::uuid,
      ${uuidOrNull(payload.submittedByUserId ?? submittedByUserId)}::uuid,
      ${payload.locale ?? null},
      ${submissionScope},
      ${status},
      ${payload.payload as any},
      ${(payload.normalizedPayload ?? payload.payload) as any},
      ${status === "submitted" ? new Date() : null}
    )
    returning id, status
  `;

  return {
    submissionId: row.id,
    status: row.status,
  };
}

export async function upsertFormDefinition(
  input: import("../types/designer").UpsertFormDefinitionInput
) {
  const normalizedSections = input.sections ?? [];

  return await db.begin(async (tx) => {
    const existing = input.formId
      ? (await tx`select id from form_builder.forms where id = ${input.formId}::uuid`)[0]
      : (await tx`select id from form_builder.forms where key = ${input.key}`)[0];

    let formId = existing?.id;

    if (!formId) {
      const [form] = await tx`
        insert into form_builder.forms (
          key, name, description, form_scope, is_active, is_deleted
        )
        values (
          ${input.key},
          ${input.name},
          ${input.description ?? null},
          ${input.formScope ?? "service_booking"},
          true,
          false
        )
        returning id
      `;
      formId = form.id;
    } else {
      // Renaming a form onto a key another form already owns would either hit a
      // unique index with a raw Postgres message, or silently leave two forms
      // sharing a key — after which the lookup above picks an arbitrary one.
      const [keyOwner] = await tx`
        select id from form_builder.forms
        where key = ${input.key} and id <> ${formId}
      `;

      if (keyOwner) {
        throw new Error(`Form key "${input.key}" is already used by another form.`);
      }

      await tx`
        update form_builder.forms
        set key = ${input.key},
            name = ${input.name},
            description = ${input.description ?? null},
            form_scope = ${input.formScope ?? "service_booking"},
            is_active = true,
            is_deleted = false
        where id = ${formId}
      `;
    }

    const [latestExisting] = await tx`
      select fv.id
      from form_builder.form_versions fv
      where fv.form_id = ${formId}
      order by fv.version_number desc
      limit 1
    `;

    if (latestExisting) {
      const [existingCounts] = await tx`
        select
          (select count(*)::int from form_builder.form_sections where form_version_id = ${latestExisting.id}) as section_count,
          (select count(*)::int from form_builder.form_fields where form_version_id = ${latestExisting.id}) as field_count
      `;

      const incomingSectionCount = normalizedSections.length;
      const incomingFieldCount = normalizedSections.reduce((sum, section) => sum + (section.fields?.length ?? 0), 0);

      if (existingCounts.field_count > 0 && incomingSectionCount === 0 && incomingFieldCount === 0) {
        throw new Error(
          "Refusing to create a new empty form version because the previous version contains fields. The frontend likely submitted an empty sections payload."
        );
      }
    }

    const [{ next_version_number }] = await tx`
      select coalesce(max(version_number), 0) + 1 as next_version_number
      from form_builder.form_versions
      where form_id = ${formId}
    `;

    const requestedStatus = input.status ?? "draft";
    const shouldActivate =
      input.activateVersion === undefined
        ? requestedStatus === "published"
        : Boolean(input.activateVersion);

    const [version] = await tx`
      insert into form_builder.form_versions (
        form_id,
        version_number,
        title,
        status,
        locales,
        is_active,
        published_at,
        settings
      ) values (
        ${formId},
        ${next_version_number},
        ${input.title || input.name},
        ${shouldActivate ? "published" : requestedStatus},
        ${(input.locales?.length ? input.locales : ["en-US"]) as any},
        ${shouldActivate},
        ${shouldActivate ? new Date() : null},
        ${input.settings ?? ({} as any)}
      )
      returning id, version_number
    `;

    if (shouldActivate) {
      await tx`
        update form_builder.form_versions
        set is_active = false
        where form_id = ${formId}
          and id <> ${version.id}
      `;

      await tx`
        update form_builder.form_versions
        set is_active = true,
            status = 'published',
            published_at = coalesce(published_at, now())
        where id = ${version.id}
      `;
    }

    const incomingFieldTypes = new Map<string, { supportsOptions: boolean }>();
    for (const section of normalizedSections) {
      for (const field of section.fields ?? []) {
        const code = String(field.fieldTypeCode);
        incomingFieldTypes.set(code, {
          supportsOptions: incomingFieldTypes.get(code)?.supportsOptions || code === "select" || code === "radio" || Boolean(field.options?.length),
        });
      }
    }

    for (const [code, metadata] of incomingFieldTypes.entries()) {
      await tx`
        insert into form_builder.field_types (
          code, display_name, category, supports_options, configuration_schema
        ) values (
          ${code},
          ${code.replace(/_/g, " ")},
          ${"input"},
          ${metadata.supportsOptions},
          ${{} as any}
        )
        on conflict (code) do update
        set supports_options = form_builder.field_types.supports_options or excluded.supports_options
      `;
    }

    for (const [sectionIndex, section] of normalizedSections.entries()) {
      const [sectionRow] = await tx`
        insert into form_builder.form_sections (
          form_version_id, key, title, description, display_order, settings
        ) values (
          ${version.id},
          ${section.key},
          ${section.title ?? null},
          ${section.description ?? null},
          ${section.displayOrder ?? sectionIndex},
          ${section.settings ?? ({} as any)}
        )
        returning id
      `;

      for (const [fieldIndex, field] of (section.fields ?? []).entries()) {
        const [fieldRow] = await tx`
          insert into form_builder.form_fields (
            form_version_id, section_id, key, field_type_code, label, placeholder,
            help_text, default_value, is_required, is_hidden, is_repeatable,
            display_order, column_span, settings, validation_rules
          ) values (
            ${version.id},
            ${sectionRow.id},
            ${field.key},
            ${field.fieldTypeCode},
            ${field.label},
            ${field.placeholder ?? null},
            ${field.helpText ?? null},
            ${field.defaultValue ?? (null as any)},
            ${Boolean(field.isRequired)},
            ${Boolean(field.isHidden)},
            ${Boolean(field.isRepeatable ?? false)},
            ${field.displayOrder ?? fieldIndex},
            ${field.columnSpan ?? 12},
            ${field.settings ?? ({} as any)},
            ${field.validationRules ?? ({} as any)}
          )
          returning id
        `;

        for (const [optionIndex, option] of (field.options ?? []).entries()) {
          if (!option.value || !option.label) continue;

          await tx`
            insert into form_builder.field_options (
              field_id, value, label, label_translations, metadata, display_order
            ) values (
              ${fieldRow.id},
              ${option.value},
              ${option.label},
              ${option.labelTranslations ?? ({} as any)},
              ${option.metadata ?? ({} as any)},
              ${option.displayOrder ?? optionIndex}
            )
          `;
        }
      }
    }

    return {
      formId,
      formVersionId: version.id,
      versionNumber: version.version_number,
      isActive: shouldActivate,
      status: shouldActivate ? "published" : requestedStatus,
    };
  });
}
