-- Add-on booking form: "مترجم خانم زبان فارسی انگلیسی" (female translator, FA <-> EN).
--
-- Seeds the form itself, published and ready, but deliberately does NOT bind it to a
-- service definition. The binding lives in form_builder.service_definition_forms and
-- says *which* service offers this add-on -- a catalogue decision that depends on the
-- data in each environment, and one this file cannot guess without being wrong
-- somewhere. An admin makes it on the form's own page in the form builder, under
-- "Service bindings", choosing scope "Add-on booking".
--
-- Until that binding exists the form is simply unused: getActiveServiceForm looks a
-- form up by (service definition, usage scope), so an unbound form is never shown.
--
-- Idempotent: keyed on the form key, so re-running changes nothing.

begin;

do $$
declare
  v_form_key   text := 'addon-female-translator-fa-en';
  v_form_id    uuid;
  v_version_id uuid;
  v_section_id uuid;
  v_field_id   uuid;
begin
  if exists (select 1 from form_builder.forms where key = v_form_key) then
    raise notice 'Form % already present -- nothing to do.', v_form_key;
    return;
  end if;

  -- Field types are referenced by code, so they have to exist first. Matches what
  -- upsertFormDefinition does when a designer saves a form using these types.
  insert into form_builder.field_types (code, display_name, category, supports_options, configuration_schema)
  values
    ('date',     'date',     'input', false, '{}'::jsonb),
    ('time',     'time',     'input', false, '{}'::jsonb),
    ('number',   'number',   'input', false, '{}'::jsonb),
    ('text',     'text',     'input', false, '{}'::jsonb),
    ('textarea', 'textarea', 'input', false, '{}'::jsonb),
    ('select',   'select',   'input', true,  '{}'::jsonb)
  on conflict (code) do update
    set supports_options = form_builder.field_types.supports_options or excluded.supports_options;

  insert into form_builder.forms (key, name, description, form_scope, is_active, is_deleted)
  values (
    v_form_key,
    'مترجم خانم زبان فارسی انگلیسی',
    'فرم رزرو مترجم خانم برای زبان فارسی به انگلیسی، به عنوان افزونه روی رزرو اصلی.',
    'addon_booking',
    true,
    false
  )
  returning id into v_form_id;

  insert into form_builder.form_versions (
    form_id, version_number, title, status, locales, is_active, published_at, settings
  ) values (
    v_form_id, 1, 'مترجم خانم زبان فارسی انگلیسی', 'published',
    array['fa-IR', 'en-US'], true, now(), '{}'::jsonb
  )
  returning id into v_version_id;

  insert into form_builder.form_sections (
    form_version_id, key, title, description, display_order, settings
  ) values (
    v_version_id, 'translator_details', 'جزئیات درخواست مترجم',
    'زمان و محل حضور مترجم را مشخص کنید.', 0, '{}'::jsonb
  )
  returning id into v_section_id;

  insert into form_builder.form_fields (
    form_version_id, section_id, key, field_type_code, label, placeholder, help_text,
    default_value, is_required, is_hidden, is_repeatable, display_order, column_span,
    settings, validation_rules
  ) values
    (v_version_id, v_section_id, 'service_date', 'date', 'تاریخ نیاز به مترجم',
     null, null, null, true, false, false, 0, 6, '{}'::jsonb, '{}'::jsonb),
    (v_version_id, v_section_id, 'start_time', 'time', 'ساعت شروع',
     null, null, null, true, false, false, 1, 6, '{}'::jsonb, '{}'::jsonb),
    (v_version_id, v_section_id, 'duration_hours', 'number', 'مدت حضور (ساعت)',
     '2', 'حداقل یک ساعت.', null, true, false, false, 2, 6,
     '{}'::jsonb, '{"min": 1, "max": 12}'::jsonb),
    (v_version_id, v_section_id, 'meeting_place', 'text', 'محل حضور مترجم',
     'نام بیمارستان، کلینیک یا هتل', null, null, false, false, false, 3, 6,
     '{}'::jsonb, '{}'::jsonb),
    (v_version_id, v_section_id, 'notes', 'textarea', 'توضیحات تکمیلی',
     null, null, null, false, false, false, 5, 12, '{}'::jsonb, '{}'::jsonb);

  -- Carries options, so it is inserted separately to capture the field id.
  insert into form_builder.form_fields (
    form_version_id, section_id, key, field_type_code, label, placeholder, help_text,
    default_value, is_required, is_hidden, is_repeatable, display_order, column_span,
    settings, validation_rules
  ) values (
    v_version_id, v_section_id, 'session_type', 'select', 'نوع همراهی',
    null, null, null, true, false, false, 4, 6, '{}'::jsonb, '{}'::jsonb
  )
  returning id into v_field_id;

  insert into form_builder.field_options (
    field_id, value, label, label_translations, metadata, display_order
  ) values
    (v_field_id, 'in_person', 'حضوری',
     '{"fa-IR": "حضوری", "en-US": "In person"}'::jsonb, '{}'::jsonb, 0),
    (v_field_id, 'phone', 'تلفنی',
     '{"fa-IR": "تلفنی", "en-US": "By phone"}'::jsonb, '{}'::jsonb, 1),
    (v_field_id, 'online', 'آنلاین',
     '{"fa-IR": "آنلاین", "en-US": "Online"}'::jsonb, '{}'::jsonb, 2);

  raise notice 'Created add-on form % (%). Bind it to a service in the form builder.',
    v_form_key, v_form_id;
end $$;

commit;
