import "server-only";

import db from "@/config/database/db";
import type {
  RuntimeServiceForm,
  DynamicFormSubmissionPayload,
  DynamicFormSubmissionResult,
} from "../types";

export async function getActiveServiceForm(
  serviceDefinitionId: string,
  usageScope: "main_booking" | "child_addon_booking" = "main_booking"
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
      where sdf.service_definition_id = ${serviceDefinitionId}
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

export async function saveDynamicFormSubmission(
  payload: DynamicFormSubmissionPayload,
  submittedByUserId?: string | null
): Promise<DynamicFormSubmissionResult> {
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
      status,
      payload,
      normalized_payload,
      submitted_at
    ) values (
      ${payload.formVersionId},
      ${payload.serviceDefinitionId ?? null},
      ${payload.bookingDraftId ?? null},
      ${payload.bookingDraftChildId ?? null},
      ${payload.bookingId ?? null},
      ${payload.bookingChildId ?? null},
      ${submittedByUserId ?? null},
      ${payload.locale ?? null},
      ${payload.status ?? "draft"},
      ${payload.payload as any},
      ${payload.payload as any},
      ${payload.status === "submitted" ? new Date() : null}
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

  console.log("upsertFormDefinition payload", {
  formId: input.formId,
  key: input.key,
  title: input.title,
  sectionsCount: input.sections?.length ?? 0,
  sections: (input.sections ?? []).map((s) => ({
    key: s.key,
    title: s.title,
    fieldCount: s.fields?.length ?? 0,
    fieldTypes: (s.fields ?? []).map((f) => f.fieldTypeCode),
  })),
});

  return await db.begin(async (tx) => {
    const existing = input.formId
      ? (await tx`select id from form_builder.forms where id = ${input.formId}`)[0]
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

    const [{ next_version_number }] = await tx`
      select coalesce(max(version_number), 0) + 1 as next_version_number
      from form_builder.form_versions
      where form_id = ${formId}
    `;

    const requestedStatus = input.status ?? "published";
    const shouldActivate =
      input.activateVersion === undefined
        ? requestedStatus === "published"
        : Boolean(input.activateVersion);

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

  const incomingSectionCount = input.sections?.length ?? 0;
  const incomingFieldCount = (input.sections ?? []).reduce(
    (sum, s) => sum + (s.fields?.length ?? 0),
    0
  );

  if (
    existingCounts.field_count > 0 &&
    incomingSectionCount === 0 &&
    incomingFieldCount === 0
  ) {
    throw new Error(
      "Refusing to create a new empty form version because the previous version contains fields. The frontend likely submitted an empty sections payload."
    );
  }
}

    const [version] = await tx`
      insert into form_builder.form_versions (
        form_id,
        version_number,
        title,
        status,
        locales,
        is_active,
        published_at
      ) values (
        ${formId},
        ${next_version_number},
        ${input.title},
        ${shouldActivate ? "published" : requestedStatus},
        ${input.locales as any},
        ${shouldActivate},
        ${shouldActivate ? new Date() : null}
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

    for (const section of input.sections) {
      const [sectionRow] = await tx`
        insert into form_builder.form_sections (
          form_version_id, key, title, description, display_order, settings
        ) values (
          ${version.id},
          ${section.key},
          ${section.title ?? null},
          ${section.description ?? null},
          ${section.displayOrder ?? 0},
          ${section.settings ?? ({} as any)}
        )
        returning id
      `;

      for (const field of section.fields) {
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
            ${field.displayOrder ?? 0},
            ${field.columnSpan ?? 12},
            ${field.settings ?? ({} as any)},
            ${field.validationRules ?? ({} as any)}
          )
          returning id
        `;

        for (const option of field.options ?? []) {
          await tx`
            insert into form_builder.field_options (
              field_id, value, label, label_translations, metadata, display_order
            ) values (
              ${fieldRow.id},
              ${option.value},
              ${option.label},
              ${option.labelTranslations ?? ({} as any)},
              ${option.metadata ?? ({} as any)},
              ${option.displayOrder ?? 0}
            )
          `;
        }
      }
    }

    const [counts] = await tx`
  select
    (select count(*)::int from form_builder.form_sections where form_version_id = ${version.id}) as section_count,
    (select count(*)::int from form_builder.form_fields where form_version_id = ${version.id}) as field_count
`;

console.log("saved version counts", {
  formVersionId: version.id,
  versionNumber: version.version_number,
  sectionCount: counts.section_count,
  fieldCount: counts.field_count,
});

    return {
      formId,
      formVersionId: version.id,
      versionNumber: version.version_number,
      isActive: shouldActivate,
      status: shouldActivate ? "published" : requestedStatus,
    };
  });
}
