
import 'server-only';

import db from '@/config/database/db';
import { buildDisplayValuesFromPayload, type SubmissionDisplayField } from '../lib/submission-display';

export async function listFormsAdmin() {
  const rows = await db`
    select f.id, f.key, f.name, f.description, f.form_scope, f.is_active, f.last_modified_date,
           (
             select jsonb_build_object(
               'id', fv.id,
               'versionNumber', fv.version_number,
               'title', fv.title,
               'status', fv.status,
               'isActive', fv.is_active,
               'publishedAt', fv.published_at
             )
             from form_builder.form_versions fv
             where fv.form_id = f.id
             order by fv.version_number desc
             limit 1
           ) as latest_version
    from form_builder.forms f
    where f.is_deleted = false
    order by f.last_modified_date desc, f.create_date desc
  `;
  return rows;
}

export async function getFormForDesigner(formId: string) {
  const formRows = await db`
    select
      f.id,
      f.key,
      f.name,
      f.description,
      f.form_scope
    from form_builder.forms f
    where f.id = ${formId}::uuid
    limit 1
  `;

  if (!formRows.length) return null;

  const versionRows = await db`
    select
      fv.id,
      fv.version_number,
      fv.title,
      fv.status,
      fv.locales,
      fv.settings,
      fv.is_active,
      fv.create_date,
      fv.last_modified_date
    from form_builder.form_versions fv
    where fv.form_id = ${formId}::uuid
    order by
      case when exists (select 1 from form_builder.form_fields x where x.form_version_id = fv.id) then 0 else 1 end asc,
      fv.version_number desc,
      fv.is_active desc,
      fv.create_date desc,
      fv.last_modified_date desc,
      fv.id desc
    limit 1
  `;

  const version = versionRows[0];

  if (!version) {
    return {
      formId,
      formVersionId: null,
      versionNumber: null,
      key: formRows[0].key,
      name: formRows[0].name,
      description: formRows[0].description,
      formScope: formRows[0].form_scope,
      title: formRows[0].name,
      locales: ["en-US"],
      status: "draft",
      activateVersion: false,
      settings: { layoutMode: "standard" },
      sections: [],
    };
  }

  const sections = await db`
    select
      s.id,
      s.key,
      s.title,
      s.description,
      s.display_order,
      s.settings,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', ff.id,
              'key', ff.key,
              'fieldTypeCode', ff.field_type_code,
              'label', ff.label,
              'placeholder', ff.placeholder,
              'helpText', ff.help_text,
              'isRequired', ff.is_required,
              'isHidden', ff.is_hidden,
              'isRepeatable', ff.is_repeatable,
              'displayOrder', ff.display_order,
              'columnSpan', ff.column_span,
              'defaultValue', ff.default_value,
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
          )
          from form_builder.form_fields ff
          where ff.section_id = s.id
        ),
        '[]'::jsonb
      ) as fields
    from form_builder.form_sections s
    where s.form_version_id = ${version.id}
    order by s.display_order asc, s.create_date asc, s.id asc
  `;

  return {
    formId: formRows[0].id,
    formVersionId: version.id,
    versionNumber: version.version_number,
    key: formRows[0].key,
    name: formRows[0].name,
    description: formRows[0].description,
    formScope: formRows[0].form_scope,
    title: version.title,
    locales: version.locales ?? ["en-US"],
    status: version.status,
    activateVersion: version.is_active,
    settings: version.settings ?? { layoutMode: "standard" },
    sections: sections.map((s: any) => ({
      id: s.id,
      key: s.key,
      title: s.title,
      description: s.description,
      displayOrder: s.display_order,
      settings: s.settings ?? {},
      fields: s.fields ?? [],
    })),
  };
}

export async function createServiceDefinitionFormMapping(input: {
  serviceDefinitionId: string;
  formId: string;
  usageScope: 'main_booking' | 'child_addon_booking';
}) {
  const [row] = await db`
    insert into form_builder.service_definition_forms (
      service_definition_id, form_id, usage_scope, is_active
    ) values (
      ${input.serviceDefinitionId},
      ${input.formId},
      ${input.usageScope},
      true
    )
    returning id
  `;
  return row;
}

type ListSubmissionsParams = {
  formId?: string | null;
  formVersionId?: string | null;
  status?: string | null;
  submissionScope?: string | null;
  q?: string | null;
  limit?: number;
  offset?: number;
};

function pushParam(params: unknown[], value: unknown) {
  params.push(value);
  return `$${params.length}`;
}

export async function listFormSubmissionsAdmin(params: ListSubmissionsParams = {}) {
  const queryParams: unknown[] = [];
  const where: string[] = ["true"];

  if (params.formId) where.push(`f.id = ${pushParam(queryParams, params.formId)}::uuid`);
  if (params.formVersionId) where.push(`s.form_version_id = ${pushParam(queryParams, params.formVersionId)}::uuid`);
  if (params.status) where.push(`s.status = ${pushParam(queryParams, params.status)}`);
  if (params.submissionScope) where.push(`s.submission_scope = ${pushParam(queryParams, params.submissionScope)}`);
  if (params.q?.trim()) {
    const placeholder = pushParam(queryParams, `%${params.q.trim()}%`);
    where.push(`(
      f.key ilike ${placeholder}
      or f.name ilike ${placeholder}
      or fv.title ilike ${placeholder}
      or s.id::text ilike ${placeholder}
      or s.payload::text ilike ${placeholder}
    )`);
  }

  const limitPlaceholder = pushParam(queryParams, Math.min(200, Math.max(1, Number(params.limit ?? 50))));
  const offsetPlaceholder = pushParam(queryParams, Math.max(0, Number(params.offset ?? 0)));

  const rows = await db.unsafe(
    `
      select
        s.id,
        f.id as "formId",
        f.key as "formKey",
        f.name as "formName",
        fv.id as "formVersionId",
        fv.version_number as "versionNumber",
        fv.title as "versionTitle",
        s.service_definition_id as "serviceDefinitionId",
        s.booking_draft_id as "bookingDraftId",
        s.booking_draft_child_id as "bookingDraftChildId",
        s.booking_id as "bookingId",
        s.booking_child_id as "bookingChildId",
        s.submitted_by_user_id as "submittedByUserId",
        s.locale,
        s.submission_scope as "submissionScope",
        s.status,
        s.payload,
        s.normalized_payload as "normalizedPayload",
        (
          select coalesce(
            jsonb_agg(
              jsonb_build_object(
                'key', ff.key,
                'label', ff.label,
                'fieldTypeCode', ff.field_type_code,
                'sectionKey', fs.key,
                'sectionTitle', fs.title,
                'sectionDisplayOrder', fs.display_order,
                'displayOrder', ff.display_order
              )
              order by fs.display_order asc, ff.display_order asc
            ),
            '[]'::jsonb
          )
          from form_builder.form_sections fs
          join form_builder.form_fields ff on ff.section_id = fs.id
          where fs.form_version_id = fv.id
        ) as "fieldDefinitions",
        s.create_date as "createDate",
        s.last_modified_date as "lastModifiedDate",
        s.submitted_at as "submittedAt"
      from form_builder.submissions s
      join form_builder.form_versions fv on fv.id = s.form_version_id
      join form_builder.forms f on f.id = fv.form_id
      where ${where.join(" and ")}
      order by s.create_date desc, s.id desc
      limit ${limitPlaceholder}
      offset ${offsetPlaceholder}
    `,
    queryParams
  );

  return rows.map(enrichSubmissionRow);
}

function normalizeSubmissionFields(value: unknown): SubmissionDisplayField[] {
  return Array.isArray(value) ? (value as SubmissionDisplayField[]) : [];
}

function enrichSubmissionRow<T extends Record<string, any>>(row: T) {
  const fieldDefinitions = normalizeSubmissionFields(row.fieldDefinitions);
  const { fieldDefinitions: _fieldDefinitions, ...rest } = row;
  return {
    ...rest,
    displayValues: buildDisplayValuesFromPayload((row.payload ?? {}) as Record<string, unknown>, fieldDefinitions),
  };
}

export async function getFormSubmissionAdmin(submissionId: string) {
  const rows = await db`
    select
      s.id,
      f.id as "formId",
      f.key as "formKey",
      f.name as "formName",
      fv.id as "formVersionId",
      fv.version_number as "versionNumber",
      fv.title as "versionTitle",
      s.service_definition_id as "serviceDefinitionId",
      s.booking_draft_id as "bookingDraftId",
      s.booking_draft_child_id as "bookingDraftChildId",
      s.booking_id as "bookingId",
      s.booking_child_id as "bookingChildId",
      s.submitted_by_user_id as "submittedByUserId",
      s.locale,
      s.submission_scope as "submissionScope",
      s.status,
      s.payload,
      s.normalized_payload as "normalizedPayload",
      (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'key', ff.key,
              'label', ff.label,
              'fieldTypeCode', ff.field_type_code,
              'sectionKey', fs.key,
              'sectionTitle', fs.title,
              'sectionDisplayOrder', fs.display_order,
              'displayOrder', ff.display_order
            )
            order by fs.display_order asc, ff.display_order asc
          ),
          '[]'::jsonb
        )
        from form_builder.form_sections fs
        join form_builder.form_fields ff on ff.section_id = fs.id
        where fs.form_version_id = fv.id
      ) as "fieldDefinitions",
      s.create_date as "createDate",
      s.last_modified_date as "lastModifiedDate",
      s.submitted_at as "submittedAt"
    from form_builder.submissions s
    join form_builder.form_versions fv on fv.id = s.form_version_id
    join form_builder.forms f on f.id = fv.form_id
    where s.id = ${submissionId}::uuid
    limit 1
  `;

  return rows[0] ? enrichSubmissionRow(rows[0] as any) : null;
}
