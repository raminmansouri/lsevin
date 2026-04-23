
import 'server-only';

import db from '@/config/database/db';

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
    where f.id = ${formId}
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
      fv.is_active,
      fv.create_date,
      fv.last_modified_date
    from form_builder.form_versions fv
    where fv.form_id = ${formId}
    order by
      fv.version_number desc,
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
