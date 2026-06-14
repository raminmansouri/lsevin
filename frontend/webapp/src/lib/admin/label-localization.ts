/**
 * Persian labels for the metadata-driven ("Dynamic") admin.
 *
 * The admin auto-generates field/column/table labels by humanizing English DB
 * names (e.g. "display_order" -> "Display Order"). Those are locale-agnostic, so
 * in Persian mode they stayed English. This dictionary localizes the common ones
 * at the render layer; anything not mapped falls back to the English label.
 */

function isPersian(locale?: string | null): boolean {
  return !!locale && locale.toLowerCase().startsWith("fa");
}

// Exact column-name -> Persian. Covers the fields that appear across most tables.
const COLUMN_FA: Record<string, string> = {
  id: "شناسه",
  name: "نام",
  title: "عنوان",
  label: "برچسب",
  description: "توضیحات",
  detail: "جزئیات",
  details: "جزئیات",
  content: "محتوا",
  body: "متن",
  summary: "خلاصه",
  slug: "اسلاگ",
  code: "کد",
  value: "مقدار",
  status: "وضعیت",
  state: "وضعیت",
  type: "نوع",
  kind: "نوع",
  category: "دسته‌بندی",
  group: "گروه",
  group_id: "گروه",
  parent_id: "والد",
  // ordering / flags
  display_order: "ترتیب نمایش",
  sort_order: "ترتیب",
  order: "ترتیب",
  priority: "اولویت",
  is_active: "فعال",
  is_primary: "اصلی",
  is_public: "عمومی",
  is_featured: "ویژه",
  is_verified: "تأیید شده",
  is_required: "اجباری",
  is_enabled: "فعال",
  is_default: "پیش‌فرض",
  is_sponsored: "تبلیغاتی",
  accredited: "معتبر",
  // dates
  create_date: "تاریخ ایجاد",
  created_at: "تاریخ ایجاد",
  last_modified_date: "تاریخ ویرایش",
  modified_date: "تاریخ ویرایش",
  updated_at: "تاریخ ویرایش",
  start_date: "تاریخ شروع",
  end_date: "تاریخ پایان",
  starts_at: "شروع از",
  ends_at: "پایان در",
  expires_at: "تاریخ انقضا",
  valid_until: "معتبر تا",
  birth_date: "تاریخ تولد",
  // media
  image: "تصویر",
  image_url: "تصویر",
  icon: "آیکون",
  icon_url: "آیکون",
  media_url: "آدرس رسانه",
  file_url: "آدرس فایل",
  url: "آدرس",
  thumbnail: "تصویر بندانگشتی",
  media_type: "نوع رسانه",
  mime_type: "نوع فایل",
  extension: "پسوند",
  file_size: "حجم فایل",
  width: "عرض",
  height: "ارتفاع",
  duration_seconds: "مدت (ثانیه)",
  color: "رنگ",
  gradient: "گرادینت",
  before_image: "تصویر قبل",
  after_image: "تصویر بعد",
  procedure: "روش",
  months: "ماه‌ها",
  recovery: "دوره نقاهت",
  // identity / contact
  first_name: "نام",
  last_name: "نام خانوادگی",
  full_name: "نام کامل",
  username: "نام کاربری",
  user_name: "نام کاربری",
  email: "ایمیل",
  phone: "تلفن",
  phone_number: "شماره تلفن",
  phone_number_country_code: "کد کشور",
  gender: "جنسیت",
  address: "آدرس",
  city: "شهر",
  country: "کشور",
  street: "خیابان",
  // money
  price: "قیمت",
  amount: "مبلغ",
  currency: "ارز",
  rate: "نرخ",
  discount_percent: "درصد تخفیف",
  // ratings / text
  rating: "امتیاز",
  review_count: "تعداد نظرات",
  reviews: "نظرات",
  comment: "نظر",
  notes: "یادداشت‌ها",
  message: "پیام",
  // common foreign keys
  category_id: "دسته‌بندی",
  service_provider_id: "ارائه‌دهنده خدمت",
  provider_service_id: "خدمت ارائه‌دهنده",
  service_definition_id: "تعریف خدمت",
  provider_type_id: "نوع ارائه‌دهنده",
  staff_id: "کارمند",
  user_id: "کاربر",
  customer_id: "مشتری",
  attribute_type_id: "نوع ویژگی",
  type_id: "نوع",
  // base words (also used to resolve "<base>_id" foreign keys)
  provider: "ارائه‌دهنده",
  service: "خدمت",
  specialist: "متخصص",
  booking: "رزرو",
  draft: "پیش‌نویس",
  customer: "مشتری",
  user: "کاربر",
  staff: "کارمند",
  coupon: "کوپن",
  language: "زبان",
  // booking / scheduling
  selected_date: "تاریخ انتخابی",
  selected_date_from: "از تاریخ",
  selected_date_to: "تا تاریخ",
  selected_time: "زمان انتخابی",
  selected_time_from: "از ساعت",
  selected_time_to: "تا ساعت",
  start_time: "زمان شروع",
  end_time: "زمان پایان",
  day_of_week: "روز هفته",
  specific_date: "تاریخ مشخص",
  is_recurring: "تکرارشونده",
  adults: "بزرگسالان",
  children: "کودکان",
  infants: "نوزادان",
  rooms: "اتاق‌ها",
  booking_status: "وضعیت رزرو",
  booking_ui_mode: "حالت رزرو",
  confirmation_code: "کد تأیید",
  current_step: "مرحله فعلی",
  use_lsevin: "استفاده از ال‌سوین",
  upload_files: "فایل‌ها",
  submitted_at: "تاریخ ارسال",
  provider_updated_at: "به‌روزرسانی ارائه‌دهنده",
  // payments
  subtotal_amount: "جمع جزء",
  addons_amount: "مبلغ افزونه‌ها",
  total_amount: "مبلغ کل",
  paid_amount: "مبلغ پرداختی",
  payment_method: "روش پرداخت",
  payment_status: "وضعیت پرداخت",
  payment_reference: "مرجع پرداخت",
  currency_code: "کد ارز",
  exchange_rate: "نرخ ارز",
  source_currency_code: "کد ارز مبدا",
  display_currency_code: "کد ارز نمایش",
  payment_currency_code: "کد ارز پرداخت",
  settlement_currency_code: "کد ارز تسویه",
  applied_discount_amount: "مبلغ تخفیف",
  // staff / profile
  biography: "بیوگرافی",
  experience: "تجربه",
  experience_years: "سال‌های تجربه",
  consultation_fee: "هزینه مشاوره",
  patients: "بیماران",
  specialty: "تخصص",
  organization: "سازمان",
  issuer: "صادرکننده",
  credential: "مدرک",
  degree: "مدرک تحصیلی",
  institution: "مؤسسه",
  year: "سال",
  next_available_label: "برچسب در دسترس بعدی",
  // reviews
  customer_name: "نام مشتری",
  comment_text: "متن نظر",
  treatment: "درمان",
  helpful_count: "تعداد مفید",
  not_helpful_count: "تعداد غیرمفید",
  review_target: "هدف نظر",
  moderation_status: "وضعیت بررسی",
  created_by_admin: "ایجادشده توسط ادمین",
  pros: "نکات مثبت",
  cons: "نکات منفی",
  form_submission_id: "فرم ثبت‌شده",
  parent_booking_id: "رزرو والد",
  parent_draft_id: "پیش‌نویس والد",
  source_draft_id: "پیش‌نویس مبدا",
  source_subtotal_amount: "جمع جزء (مبدا)",
  source_addons_amount: "افزونه‌ها (مبدا)",
  source_total_amount: "مبلغ کل (مبدا)",
  display_subtotal_amount: "جمع جزء (نمایش)",
  display_addons_amount: "افزونه‌ها (نمایش)",
  display_total_amount: "مبلغ کل (نمایش)",
  applied_coupon_id: "کوپن اعمال‌شده",
  applied_discount_type: "نوع تخفیف",
  applied_discount_value: "مقدار تخفیف",
  wallet_payment_intent_id: "درخواست پرداخت کیف پول",
  exchange_rate_ids: "شناسه‌های نرخ ارز",
  fx_quote_id: "مظنه ارز",
};

// Exact table-name -> Persian (used for the sidebar nav and relation panels).
const TABLE_FA: Record<string, string> = {
  categories: "دسته‌بندی‌ها",
  currencies: "ارزها",
  exchange_rates: "نرخ ارز",
  locations: "مکان‌ها",
  picked_locations: "مکان‌های منتخب",
  provider_types: "انواع ارائه‌دهنده",
  provider_attribute_definitions: "تعریف ویژگی‌های ارائه‌دهنده",
  provider_attribute_definition_domain_options: "گزینه‌های ویژگی",
  service_definitions: "تعریف خدمات",
  service_definition_addon_provisions: "افزونه‌های تعریف خدمت",
  service_definition_forms: "فرم‌های تعریف خدمت",
  service_providers: "ارائه‌دهندگان خدمات",
  provider_gallery_items: "گالری ارائه‌دهنده",
  provider_service_gallery_items: "گالری خدمت",
  provider_languages: "زبان‌های ارائه‌دهنده",
  provider_certifications: "گواهینامه‌های ارائه‌دهنده",
  staff: "کارکنان",
  staff_services: "خدمات کارکنان",
  staff_gallery_items: "گالری کارکنان",
  staff_before_after: "قبل و بعد کارکنان",
  service_before_after: "قبل و بعد خدمت",
  offers: "پیشنهادها",
  provider_services: "خدمات ارائه‌دهنده",
  attribute_types: "انواع ویژگی",
};

/** Localizes a column/field label by its raw snake_case name. */
export function localizeColumnLabel(
  columnName: string | undefined | null,
  fallback: string,
  locale?: string | null,
): string {
  if (!isPersian(locale) || !columnName) return fallback;
  const key = columnName.toLowerCase();

  if (COLUMN_FA[key]) return COLUMN_FA[key];

  // `*_translations` (multilingual columns) -> the base field name.
  if (key.endsWith("_translations")) {
    const base = key.slice(0, -"_translations".length);
    if (COLUMN_FA[base]) return COLUMN_FA[base];
  }

  // Boolean-ish `is_*` columns not listed above.
  if (key.startsWith("is_")) {
    const base = key.slice(3);
    if (COLUMN_FA[base]) return COLUMN_FA[base];
  }

  // Foreign keys `<base>_id` -> the base term, when known.
  if (key.endsWith("_id")) {
    const base = key.slice(0, -3);
    if (COLUMN_FA[base]) return COLUMN_FA[base];
    if (TABLE_FA[base]) return TABLE_FA[base];
  }

  return fallback;
}

/** Localizes a table/entity label by its raw table name. */
export function localizeTableLabel(
  table: string | undefined | null,
  fallback: string,
  locale?: string | null,
): string {
  if (!isPersian(locale) || !table) return fallback;
  return TABLE_FA[table.toLowerCase()] ?? fallback;
}
