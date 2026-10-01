-- 0066 — Data-informed case templates for the current production taxonomy.
--
-- Production contains thousands of service definitions but currently has no
-- category.service_process rows. Category-scoped templates provide useful
-- defaults without creating a template per service. A future provider-service
-- or service-definition template remains more specific and takes precedence.
-- Existing active templates are never replaced.
begin;

with blueprints(
  category_name, journey_type,
  name_en, name_fa, name_ar,
  description_en, description_fa, description_ar
) as (
  values
    ('سلامتی و درمان و زیبایی', 'clinical', 'Clinical care journey', 'مسیر مراقبت درمانی', 'مسار الرعاية السريرية', 'Preparation, treatment, recovery and follow-up.', 'آمادگی، درمان، بهبودی و پیگیری.', 'التحضير والعلاج والتعافي والمتابعة.'),
    ('بیمارستان', 'hospital', 'Hospital treatment journey', 'مسیر درمان بیمارستانی', 'مسار العلاج في المستشفى', 'Pre-admission through discharge and recovery at home.', 'از آمادگی پیش از پذیرش تا ترخیص و بهبودی در منزل.', 'من التحضير قبل الدخول حتى الخروج والتعافي في المنزل.'),
    ('کلینیک', 'clinic', 'Clinic treatment journey', 'مسیر درمان کلینیکی', 'مسار العلاج في العيادة', 'Preparation, clinic treatment, discharge and follow-up.', 'آمادگی، درمان در کلینیک، ترخیص و پیگیری.', 'التحضير والعلاج في العيادة والخروج والمتابعة.'),
    ('آزمایشگاه', 'laboratory', 'Diagnostic test journey', 'مسیر آزمایش و تشخیص', 'مسار الفحص والتشخيص', 'Preparation, sample collection, processing and results.', 'آمادگی، نمونه‌گیری، پردازش و نتیجه.', 'التحضير وجمع العينة والمعالجة والنتائج.'),
    ('خدمات پرستاری در منزل', 'home_care', 'Home care journey', 'مسیر مراقبت در منزل', 'مسار الرعاية المنزلية', 'Scheduling, arrival, care delivery and follow-up.', 'زمان‌بندی، حضور مراقب، ارائه خدمت و پیگیری.', 'الجدولة ووصول مقدم الرعاية وتقديم الخدمة والمتابعة.'),
    ('اقامتگاه', 'accommodation', 'Accommodation journey', 'مسیر اقامت', 'مسار الإقامة', 'Reservation, check-in, stay and check-out.', 'رزرو، ورود، اقامت و خروج.', 'الحجز وتسجيل الدخول والإقامة والمغادرة.'),
    ('هتل', 'accommodation', 'Accommodation journey', 'مسیر اقامت', 'مسار الإقامة', 'Reservation, check-in, stay and check-out.', 'رزرو، ورود، اقامت و خروج.', 'الحجز وتسجيل الدخول والإقامة والمغادرة.'),
    ('سوئیت', 'accommodation', 'Accommodation journey', 'مسیر اقامت', 'مسار الإقامة', 'Reservation, check-in, stay and check-out.', 'رزرو، ورود، اقامت و خروج.', 'الحجز وتسجيل الدخول والإقامة والمغادرة.'),
    ('تندرستی', 'wellness', 'Wellness programme journey', 'مسیر برنامه تندرستی', 'مسار برنامج العافية', 'Activation, assessment, programme and progress review.', 'فعال‌سازی، ارزیابی، برنامه و بررسی پیشرفت.', 'التفعيل والتقييم والبرنامج ومراجعة التقدم.'),
    ('باشگاه', 'wellness', 'Wellness programme journey', 'مسیر برنامه تندرستی', 'مسار برنامج العافية', 'Activation, assessment, programme and progress review.', 'فعال‌سازی، ارزیابی، برنامه و بررسی پیشرفت.', 'التفعيل والتقييم والبرنامج ومراجعة التقدم.'),
    ('ماساژ', 'wellness', 'Wellness service journey', 'مسیر خدمات تندرستی', 'مسار خدمات العافية', 'Preparation, service delivery and follow-up.', 'آمادگی، ارائه خدمت و پیگیری.', 'التحضير وتقديم الخدمة والمتابعة.'),
    ('سالن های زیبایی', 'beauty', 'Beauty service journey', 'مسیر خدمات زیبایی', 'مسار خدمات التجميل', 'Consultation, appointment, service and aftercare.', 'مشاوره، نوبت، انجام خدمت و مراقبت بعدی.', 'الاستشارة والموعد والخدمة والعناية اللاحقة.'),
    ('سالن های بانوان', 'beauty', 'Beauty service journey', 'مسیر خدمات زیبایی', 'مسار خدمات التجميل', 'Consultation, appointment, service and aftercare.', 'مشاوره، نوبت، انجام خدمت و مراقبت بعدی.', 'الاستشارة والموعد والخدمة والعناية اللاحقة.'),
    ('سالن های آقایان', 'beauty', 'Beauty service journey', 'مسیر خدمات زیبایی', 'مسار خدمات التجميل', 'Consultation, appointment, service and aftercare.', 'مشاوره، نوبت، انجام خدمت و مراقبت بعدی.', 'الاستشارة والموعد والخدمة والعناية اللاحقة.'),
    ('کلاس آموزشی', 'education', 'Training journey', 'مسیر آموزش', 'مسار التدريب', 'Registration, preparation, attendance and completion.', 'ثبت‌نام، آمادگی، حضور و پایان دوره.', 'التسجيل والتحضير والحضور وإكمال الدورة.'),
    ('آموزش میکاپ', 'education', 'Training journey', 'مسیر آموزش', 'مسار التدريب', 'Registration, preparation, attendance and completion.', 'ثبت‌نام، آمادگی، حضور و پایان دوره.', 'التسجيل والتحضير والحضور وإكمال الدورة.'),
    ('گردشگری', 'travel', 'Travel service journey', 'مسیر خدمات سفر', 'مسار خدمة السفر', 'Confirmation, preparation, departure, travel and return.', 'تأیید، آمادگی، حرکت، سفر و بازگشت.', 'التأكيد والتحضير والمغادرة والسفر والعودة.'),
    ('شهری', 'travel', 'Travel service journey', 'مسیر خدمات سفر', 'مسار خدمة السفر', 'Confirmation, preparation, departure, travel and return.', 'تأیید، آمادگی، حرکت، سفر و بازگشت.', 'التأكيد والتحضير والمغادرة والسفر والعودة.'),
    ('بین شهری', 'travel', 'Travel service journey', 'مسیر خدمات سفر', 'مسار خدمة السفر', 'Confirmation, preparation, departure, travel and return.', 'تأیید، آمادگی، حرکت، سفر و بازگشت.', 'التأكيد والتحضير والمغادرة والسفر والعودة.'),
    ('بین المللی', 'travel', 'Travel service journey', 'مسیر خدمات سفر', 'مسار خدمة السفر', 'Confirmation, preparation, departure, travel and return.', 'تأیید، آمادگی، حرکت، سفر و بازگشت.', 'التأكيد والتحضير والمغادرة والسفر والعودة.')
), resolved as (
  select c.id as category_id, b.*
  from category.categories c
  join blueprints b
    on common.get_translation_t(c.name_translations, 'fa-IR', 'en-US') = b.category_name
)
insert into case_management.process_templates (
  id, name_translations, description_translations, scope_type,
  category_id, is_active, version
)
select
  public.uuid_generate_v4(),
  jsonb_build_object('en-US', r.name_en, 'fa-IR', r.name_fa, 'ar', r.name_ar),
  jsonb_build_object('en-US', r.description_en, 'fa-IR', r.description_fa, 'ar', r.description_ar),
  'category', r.category_id, true, 1
from resolved r
where not exists (
  select 1 from case_management.process_templates pt
  where pt.scope_type = 'category'
    and pt.category_id = r.category_id
    and pt.is_active
);

with step_blueprints(
  journey_type, display_order, step_key, timing_anchor, offset_minutes,
  duration_minutes, responsible_role,
  title_en, title_fa, title_ar,
  description_en, description_fa, description_ar
) as (
  values
    ('clinical', 1, 'preparation', 'appointment_start', -4320, 4320, 'customer', 'Preparation', 'آمادگی پیش از درمان', 'التحضير قبل العلاج', 'Review instructions, documents and required tests.', 'دستورها، مدارک و آزمایش‌های لازم را بررسی کنید.', 'راجع التعليمات والمستندات والفحوص المطلوبة.'),
    ('clinical', 2, 'arrival', 'appointment_start', -60, 60, 'staff', 'Arrival and admission', 'حضور و پذیرش', 'الوصول والقبول', 'Arrive and complete admission.', 'مراجعه و پذیرش را تکمیل کنید.', 'الحضور وإكمال إجراءات القبول.'),
    ('clinical', 3, 'treatment', 'appointment_start', 0, 180, 'provider', 'Treatment', 'انجام درمان', 'إجراء العلاج', 'The planned treatment is delivered.', 'درمان برنامه‌ریزی‌شده انجام می‌شود.', 'يتم تقديم العلاج المخطط له.'),
    ('clinical', 4, 'recovery', 'previous_step', 0, 180, 'staff', 'Recovery', 'ریکاوری و پایش', 'التعافي والمراقبة', 'Recovery and observation.', 'بهبودی اولیه و پایش وضعیت.', 'التعافي الأولي ومراقبة الحالة.'),
    ('clinical', 5, 'follow_up', 'appointment_start', 10080, 30, 'provider', 'Follow-up', 'پیگیری درمان', 'المتابعة', 'Review recovery and next actions.', 'بهبودی و اقدامات بعدی بررسی می‌شود.', 'مراجعة التعافي والخطوات التالية.'),

    ('hospital', 1, 'pre_admission', 'appointment_start', -4320, 4320, 'customer', 'Pre-admission preparation', '۳ روز مانده تا درمان', 'قبل العلاج بثلاثة أيام', 'Complete tests, documents and preparation instructions.', 'آزمایش‌ها، مدارک و دستورهای آمادگی را تکمیل کنید.', 'إكمال الفحوص والمستندات وتعليمات التحضير.'),
    ('hospital', 2, 'admission', 'appointment_start', -120, 120, 'staff', 'Hospital admission', 'پذیرش بیمارستان', 'الدخول إلى المستشفى', 'Complete hospital admission.', 'پذیرش بیمارستان تکمیل می‌شود.', 'إكمال إجراءات دخول المستشفى.'),
    ('hospital', 3, 'procedure', 'appointment_start', 0, 180, 'provider', 'Procedure or operation', 'عمل یا فرایند درمانی', 'الإجراء أو العملية', 'The scheduled procedure is performed.', 'عمل یا فرایند برنامه‌ریزی‌شده انجام می‌شود.', 'يتم تنفيذ الإجراء المجدول.'),
    ('hospital', 4, 'recovery', 'previous_step', 0, 180, 'staff', 'Post-procedure recovery', 'ریکاوری پس از عمل', 'التعافي بعد الإجراء', 'Immediate recovery and observation.', 'ریکاوری اولیه و پایش علائم حیاتی.', 'التعافي الفوري ومراقبة العلامات الحيوية.'),
    ('hospital', 5, 'inpatient', 'previous_step', 0, 720, 'staff', 'Inpatient care', 'بستری', 'الإقامة الداخلية', 'Inpatient care when required.', 'در صورت نیاز، مراقبت بستری انجام می‌شود.', 'تقديم رعاية داخلية عند الحاجة.'),
    ('hospital', 6, 'discharge', 'previous_step', 0, 60, 'provider', 'Hospital discharge', 'ترخیص از بیمارستان', 'الخروج من المستشفى', 'Review medicines, aftercare and warning signs.', 'داروها، مراقبت و علائم هشدار مرور می‌شود.', 'مراجعة الأدوية والعناية وعلامات التحذير.'),
    ('hospital', 7, 'home_recovery', 'appointment_start', 1440, 10080, 'customer', 'Return home and recovery', 'بازگشت به منزل و بهبودی', 'العودة إلى المنزل والتعافي', 'Follow the home recovery plan.', 'برنامه بهبودی در منزل را اجرا کنید.', 'اتباع خطة التعافي المنزلي.'),
    ('hospital', 8, 'follow_up', 'appointment_start', 10080, 30, 'provider', 'Clinical follow-up', 'پیگیری درمان', 'المتابعة السريرية', 'The care team reviews recovery.', 'تیم درمان روند بهبودی را بررسی می‌کند.', 'يراجع فريق الرعاية التعافي.'),

    ('clinic', 1, 'preparation', 'appointment_start', -4320, 4320, 'customer', 'Treatment preparation', '۳ روز مانده تا درمان', 'قبل العلاج بثلاثة أيام', 'Review preparation and required documents.', 'آمادگی‌ها و مدارک لازم را بررسی کنید.', 'مراجعة التحضيرات والمستندات المطلوبة.'),
    ('clinic', 2, 'check_in', 'appointment_start', -60, 60, 'staff', 'Clinic check-in', 'وقت کلینیک و پذیرش', 'موعد العيادة والتسجيل', 'Arrive and complete clinic check-in.', 'در کلینیک حاضر شوید و پذیرش را تکمیل کنید.', 'الحضور وإكمال التسجيل في العيادة.'),
    ('clinic', 3, 'treatment', 'appointment_start', 0, 180, 'provider', 'Treatment', 'انجام درمان', 'إجراء العلاج', 'The scheduled treatment is performed.', 'درمان برنامه‌ریزی‌شده انجام می‌شود.', 'يتم تنفيذ العلاج المجدول.'),
    ('clinic', 4, 'observation', 'previous_step', 0, 120, 'staff', 'Observation', 'پایش پس از درمان', 'المراقبة بعد العلاج', 'The immediate condition is observed.', 'وضعیت پس از درمان پایش می‌شود.', 'تتم مراقبة الحالة بعد العلاج.'),
    ('clinic', 5, 'leave_clinic', 'previous_step', 0, 30, 'provider', 'Leave the clinic', 'خروج از کلینیک', 'مغادرة العيادة', 'Aftercare instructions are provided.', 'دستور مراقبت پس از درمان ارائه می‌شود.', 'تقديم تعليمات العناية اللاحقة.'),
    ('clinic', 6, 'follow_up', 'appointment_start', 10080, 30, 'provider', 'Follow-up', 'پیگیری درمان', 'المتابعة', 'Recovery and results are reviewed.', 'بهبودی و نتیجه درمان بررسی می‌شود.', 'مراجعة التعافي ونتائج العلاج.'),

    ('laboratory', 1, 'preparation', 'appointment_start', -720, 720, 'customer', 'Test preparation', 'آمادگی آزمایش', 'التحضير للفحص', 'Follow preparation instructions.', 'دستور آمادگی آزمایش را انجام دهید.', 'اتباع تعليمات التحضير.'),
    ('laboratory', 2, 'collection', 'appointment_start', 0, 30, 'staff', 'Sample collection', 'نمونه‌گیری', 'جمع العينة', 'The required sample is collected.', 'نمونه مورد نیاز دریافت می‌شود.', 'يتم جمع العينة المطلوبة.'),
    ('laboratory', 3, 'processing', 'previous_step', 0, 1440, 'staff', 'Laboratory processing', 'پردازش آزمایش', 'معالجة المختبر', 'The sample is analysed and validated.', 'نمونه تحلیل و نتیجه اعتبارسنجی می‌شود.', 'تحليل العينة والتحقق من النتيجة.'),
    ('laboratory', 4, 'results', 'previous_step', 0, 30, 'provider', 'Results available', 'آماده شدن نتیجه', 'توفر النتائج', 'Results are released for review.', 'نتیجه برای بررسی منتشر می‌شود.', 'إصدار النتائج للمراجعة.'),

    ('home_care', 1, 'confirmation', 'booking_created', 0, 30, 'provider', 'Care request confirmed', 'تأیید درخواست مراقبت', 'تأكيد طلب الرعاية', 'The request and address are confirmed.', 'درخواست و نشانی تأیید می‌شود.', 'تأكيد الطلب والعنوان.'),
    ('home_care', 2, 'preparation', 'appointment_start', -120, 120, 'customer', 'Prepare for the visit', 'آمادگی برای مراجعه', 'التحضير للزيارة', 'Prepare the patient and records.', 'بیمار و مدارک را آماده کنید.', 'تجهيز المريض والسجلات.'),
    ('home_care', 3, 'arrival', 'appointment_start', 0, 30, 'staff', 'Caregiver arrival', 'حضور مراقب در منزل', 'وصول مقدم الرعاية', 'The assigned caregiver arrives.', 'مراقب تعیین‌شده حاضر می‌شود.', 'وصول مقدم الرعاية المعيّن.'),
    ('home_care', 4, 'care', 'previous_step', 0, 120, 'staff', 'Home care delivery', 'ارائه مراقبت در منزل', 'تقديم الرعاية المنزلية', 'Care is delivered and documented.', 'مراقبت انجام و ثبت می‌شود.', 'تقديم الرعاية وتوثيقها.'),
    ('home_care', 5, 'follow_up', 'previous_step', 0, 30, 'provider', 'Care follow-up', 'پیگیری مراقبت', 'متابعة الرعاية', 'Outcome and next needs are reviewed.', 'نتیجه و نیازهای بعدی بررسی می‌شود.', 'مراجعة النتيجة والاحتياجات التالية.'),

    ('accommodation', 1, 'confirmed', 'booking_created', 0, 15, 'provider', 'Reservation confirmed', 'تأیید رزرو', 'تأكيد الحجز', 'Reservation details are confirmed.', 'جزئیات رزرو تأیید می‌شود.', 'تأكيد تفاصيل الحجز.'),
    ('accommodation', 2, 'check_in', 'appointment_start', 0, 30, 'staff', 'Check-in', 'ورود و تحویل اقامتگاه', 'تسجيل الدخول', 'Identity and handover are completed.', 'احراز هویت و تحویل انجام می‌شود.', 'إكمال التحقق والتسليم.'),
    ('accommodation', 3, 'stay', 'previous_step', 0, null, 'customer', 'Stay in progress', 'اقامت در حال انجام', 'الإقامة جارية', 'The booked stay is in progress.', 'اقامت رزروشده در حال انجام است.', 'الإقامة المحجوزة جارية.'),
    ('accommodation', 4, 'check_out', 'appointment_end', 0, 30, 'staff', 'Check-out', 'خروج و تحویل', 'تسجيل المغادرة', 'Final check-out is completed.', 'خروج و تحویل نهایی انجام می‌شود.', 'إكمال المغادرة النهائية.'),

    ('wellness', 1, 'activation', 'booking_created', 0, 15, 'provider', 'Programme activated', 'فعال‌سازی برنامه', 'تفعيل البرنامج', 'The programme is activated.', 'برنامه فعال می‌شود.', 'تفعيل البرنامج.'),
    ('wellness', 2, 'assessment', 'appointment_start', 0, 60, 'staff', 'Initial assessment', 'ارزیابی اولیه', 'التقييم الأولي', 'Goals and condition are assessed.', 'اهداف و وضعیت ارزیابی می‌شود.', 'تقييم الأهداف والحالة.'),
    ('wellness', 3, 'programme', 'previous_step', 0, null, 'staff', 'Programme in progress', 'اجرای برنامه', 'تنفيذ البرنامج', 'The service programme is delivered.', 'برنامه خدمت اجرا می‌شود.', 'تنفيذ برنامج الخدمة.'),
    ('wellness', 4, 'review', 'previous_step', 0, 30, 'provider', 'Progress review', 'بررسی پیشرفت', 'مراجعة التقدم', 'Progress and next goals are reviewed.', 'پیشرفت و اهداف بعدی بررسی می‌شود.', 'مراجعة التقدم والأهداف التالية.'),

    ('beauty', 1, 'consultation', 'appointment_start', -1440, 30, 'provider', 'Consultation', 'مشاوره', 'الاستشارة', 'Needs and preparation are reviewed.', 'نیاز و آمادگی‌ها بررسی می‌شود.', 'مراجعة الاحتياجات والتحضير.'),
    ('beauty', 2, 'check_in', 'appointment_start', 0, 15, 'staff', 'Appointment check-in', 'پذیرش نوبت', 'تسجيل الموعد', 'The customer checks in.', 'مشتری پذیرش می‌شود.', 'تسجيل وصول العميل.'),
    ('beauty', 3, 'service', 'previous_step', 0, 120, 'staff', 'Service delivery', 'انجام خدمت', 'تقديم الخدمة', 'The selected service is delivered.', 'خدمت انتخاب‌شده انجام می‌شود.', 'تقديم الخدمة المختارة.'),
    ('beauty', 4, 'aftercare', 'previous_step', 0, 30, 'staff', 'Aftercare guidance', 'راهنمای مراقبت', 'إرشادات العناية', 'Aftercare guidance is provided.', 'راهنمای مراقبت ارائه می‌شود.', 'تقديم إرشادات العناية.'),
    ('beauty', 5, 'follow_up', 'appointment_start', 10080, 15, 'provider', 'Follow-up', 'پیگیری نتیجه', 'متابعة النتيجة', 'The result is reviewed.', 'نتیجه بررسی می‌شود.', 'مراجعة النتيجة.'),

    ('education', 1, 'registration', 'booking_created', 0, 15, 'provider', 'Registration confirmed', 'تأیید ثبت‌نام', 'تأكيد التسجيل', 'Registration is confirmed.', 'ثبت‌نام تأیید می‌شود.', 'تأكيد التسجيل.'),
    ('education', 2, 'preparation', 'appointment_start', -1440, 60, 'customer', 'Training preparation', 'آمادگی آموزش', 'التحضير للتدريب', 'Review schedule and materials.', 'زمان‌بندی و منابع را بررسی کنید.', 'مراجعة الجدول والمواد.'),
    ('education', 3, 'attendance', 'appointment_start', 0, null, 'customer', 'Training in progress', 'حضور و آموزش', 'التدريب جارٍ', 'The learner attends the programme.', 'فراگیر در برنامه شرکت می‌کند.', 'حضور المتعلم في البرنامج.'),
    ('education', 4, 'completion', 'previous_step', 0, 30, 'provider', 'Completion', 'پایان دوره', 'إكمال الدورة', 'Completion is recorded.', 'پایان دوره ثبت می‌شود.', 'تسجيل إكمال الدورة.'),

    ('travel', 1, 'confirmed', 'booking_created', 0, 15, 'provider', 'Travel confirmed', 'تأیید سفر', 'تأكيد السفر', 'The itinerary is confirmed.', 'برنامه سفر تأیید می‌شود.', 'تأكيد خط السير.'),
    ('travel', 2, 'preparation', 'appointment_start', -4320, 4320, 'customer', 'Travel preparation', 'آمادگی سفر', 'التحضير للسفر', 'Review documents and instructions.', 'مدارک و دستورها را بررسی کنید.', 'مراجعة المستندات والتعليمات.'),
    ('travel', 3, 'departure', 'appointment_start', 0, 60, 'staff', 'Departure', 'حرکت', 'المغادرة', 'Check-in and departure are completed.', 'پذیرش و حرکت انجام می‌شود.', 'إكمال التسجيل والمغادرة.'),
    ('travel', 4, 'in_progress', 'previous_step', 0, null, 'staff', 'Travel in progress', 'سفر در حال انجام', 'الرحلة جارية', 'The travel service is in progress.', 'خدمت سفر در حال انجام است.', 'خدمة السفر جارية.'),
    ('travel', 5, 'return', 'appointment_end', 0, 30, 'provider', 'Return and completion', 'بازگشت و پایان سفر', 'العودة وإكمال الرحلة', 'Return and completion are confirmed.', 'بازگشت و پایان سفر تأیید می‌شود.', 'تأكيد العودة وإكمال الرحلة.')
), template_types as (
  select pt.id as template_id,
    case common.get_translation_t(pt.name_translations, 'en-US', 'fa-IR')
      when 'Clinical care journey' then 'clinical'
      when 'Hospital treatment journey' then 'hospital'
      when 'Clinic treatment journey' then 'clinic'
      when 'Diagnostic test journey' then 'laboratory'
      when 'Home care journey' then 'home_care'
      when 'Accommodation journey' then 'accommodation'
      when 'Wellness programme journey' then 'wellness'
      when 'Wellness service journey' then 'wellness'
      when 'Beauty service journey' then 'beauty'
      when 'Training journey' then 'education'
      when 'Travel service journey' then 'travel'
    end as journey_type
  from case_management.process_templates pt
  where pt.scope_type = 'category' and pt.is_active
)
insert into case_management.process_template_steps (
  template_id, step_key, display_order, title_translations,
  description_translations, timing_anchor, offset_minutes,
  estimated_duration_minutes, responsible_role
)
select
  tt.template_id, sb.step_key, sb.display_order,
  jsonb_build_object('en-US', sb.title_en, 'fa-IR', sb.title_fa, 'ar', sb.title_ar),
  jsonb_build_object('en-US', sb.description_en, 'fa-IR', sb.description_fa, 'ar', sb.description_ar),
  sb.timing_anchor, sb.offset_minutes, sb.duration_minutes, sb.responsible_role
from template_types tt
join step_blueprints sb on sb.journey_type = tt.journey_type
where tt.journey_type is not null
  and not exists (
    select 1 from case_management.process_template_steps pts
    where pts.template_id = tt.template_id and pts.step_key = sb.step_key
  );

-- Preserve provider-curated processes if providers add them later.
insert into case_management.process_templates (
  id, name_translations, description_translations, scope_type,
  provider_service_id, is_active, version
)
select
  public.uuid_generate_v4(),
  jsonb_build_object(
    'en-US', coalesce(nullif(common.get_translation_t(ps.display_name_translations, 'en-US', 'fa-IR'), ''), 'Service care plan'),
    'fa-IR', coalesce(nullif(common.get_translation_t(ps.display_name_translations, 'fa-IR', 'en-US'), ''), 'فرآیند ارائه خدمت'),
    'ar', coalesce(nullif(common.get_translation_t(ps.display_name_translations, 'ar', 'en-US'), ''), 'خطة رعاية الخدمة')
  ),
  jsonb_build_object(
    'en-US', 'Care journey seeded from the provider service process.',
    'fa-IR', 'مسیر خدمت بر اساس مراحل ثبت‌شده توسط ارائه‌دهنده.',
    'ar', 'مسار الخدمة المستند إلى الخطوات المسجلة لدى مقدم الخدمة.'
  ),
  'provider_service', ps.id, true, 1
from category.provider_services ps
where exists (select 1 from category.service_process sp where sp.service_id = ps.id)
  and not exists (
    select 1 from case_management.process_templates pt
    where pt.scope_type = 'provider_service'
      and pt.provider_service_id = ps.id
      and pt.is_active
  );

insert into case_management.process_template_steps (
  template_id, step_key, display_order, title_translations,
  description_translations, timing_anchor, offset_minutes,
  estimated_duration_minutes, responsible_role, metadata
)
select
  pt.id, 'imported-' || sp.id::text,
  row_number() over (partition by pt.id order by sp.step, sp.id)::integer,
  jsonb_build_object('en-US', coalesce(sp.title, 'Care step'), 'fa-IR', coalesce(sp.title, 'مرحله مراقبت'), 'ar', coalesce(sp.title, 'مرحلة الرعاية')),
  jsonb_build_object('en-US', coalesce(sp.description, ''), 'fa-IR', coalesce(sp.description, ''), 'ar', coalesce(sp.description, '')),
  case when sp.step = 1 then 'appointment_start' else 'previous_step' end,
  0,
  case when coalesce(sp.duration, '') ~ '^[0-9]+$' then sp.duration::integer else null end,
  'provider',
  jsonb_build_object('source', 'category.service_process', 'legacyProcessId', sp.id, 'legacyDuration', sp.duration)
from category.service_process sp
join case_management.process_templates pt
  on pt.scope_type = 'provider_service'
 and pt.provider_service_id = sp.service_id
 and pt.is_active
 and pt.description_translations ->> 'en-US' = 'Care journey seeded from the provider service process.'
where not exists (
  select 1 from case_management.process_template_steps pts
  where pts.template_id = pt.id and pts.step_key = 'imported-' || sp.id::text
);

-- Backfill eligible historical bookings. This function is idempotent and each
-- case snapshots its selected template, so later edits do not rewrite history.
select case_management.ensure_case_for_booking(b.id)
from booking.bookings b
where lower(coalesce(b.booking_status, '')) not in
  ('cancelled', 'canceled', 'rejected', 'failed', 'no_show');

commit;
