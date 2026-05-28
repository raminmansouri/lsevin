export function isPersianLocale(locale?: string | null) {
  return (locale || "").toLowerCase().startsWith("fa");
}

type Translator = (key: string, values?: Record<string, unknown>) => string;

const fa: Record<string, string> = {
  "dashboard.eyebrow": "مدیریت زمان‌دهی",
  "dashboard.title": "مدیریت ظرفیت و زمان‌های رزرو",
  "dashboard.description": "در این بخش مشخص می‌کنید مشتری چه زمانی، برای کدام مرکز، خدمت، پزشک، اتاق یا منبع امکان رزرو داشته باشد.",
  "actions.addRule": "افزودن قانون زمان‌دهی",
  "actions.addResource": "افزودن منبع قابل رزرو",
  "actions.filter": "فیلتر",
  "actions.edit": "ویرایش",
  "actions.disable": "غیرفعال",
  "actions.enable": "فعال",
  "actions.delete": "حذف",
  "actions.saveRule": "ذخیره قانون",
  "actions.saveResource": "ذخیره منبع",
  "actions.cancel": "انصراف",
  "tabs.rules": "قوانین زمان‌دهی",
  "tabs.resources": "منابع قابل رزرو",
  "stats.activeRules": "قوانین فعال",
  "stats.blockRules": "قوانین مسدودکننده",
  "stats.resources": "منابع",
  "stats.inactiveResources": "منابع غیرفعال",
  "filters.allProviders": "همه مراکز",
  "filters.allServices": "همه خدمات",
  "empty.noRules": "هنوز قانون زمان‌دهی تعریف نشده است.",
  "empty.noResourcesAdmin": "هنوز منبع قابل رزرو تعریف نشده است.",
  "empty.noProviders": "مرکزی پیدا نشد.",
  "empty.noServices": "خدمتی پیدا نشد.",
  "ruleTypes.available": "قابل رزرو",
  "ruleTypes.blocked": "مسدود / غیرقابل رزرو",
  "status.active": "فعال",
  "status.disabled": "غیرفعال",
  "labels.capacity": "ظرفیت",
  "labels.priority": "اولویت",
  "labels.rules": "قانون",
  "labels.anyDate": "هر تاریخ",
  "labels.allDay": "تمام روز",
  "labels.specificDateMode": "حالت تاریخ خاص: این قانون فقط برای همین تاریخ اعمال می‌شود و روزهای هفته نادیده گرفته می‌شوند.",
  "labels.noWeekdaysSelected": "هیچ روزی انتخاب نشده است. برای قانون تکراری حداقل یک روز هفته را انتخاب کنید یا تاریخ خاص وارد کنید.",
  "weekdayPresets.everyDay": "همه روزها",
  "daysShort.mon": "دوشنبه",
  "daysShort.tue": "سه‌شنبه",
  "daysShort.wed": "چهارشنبه",
  "daysShort.thu": "پنجشنبه",
  "daysShort.fri": "جمعه",
  "daysShort.sat": "شنبه",
  "daysShort.sun": "یکشنبه",
  "days.1": "دوشنبه",
  "days.2": "سه‌شنبه",
  "days.3": "چهارشنبه",
  "days.4": "پنجشنبه",
  "days.5": "جمعه",
  "days.6": "شنبه",
  "days.7": "یکشنبه",
  "quickDays.everyDay": "هر روز",
  "quickDays.weekdays": "روزهای کاری",
  "quickDays.weekend": "آخر هفته",
  "quickDays.clear": "پاک کردن",
  "sections.schedule": "برنامه زمانی",
  "fields.targetType": "نوع هدف قانون",
  "fields.provider": "مرکز / ارائه‌دهنده",
  "fields.providerService": "خدمت مرکز",
  "fields.target": "هدف قانون",
  "fields.ruleType": "نوع قانون",
  "fields.resourceContext": "منبع مرتبط",
  "placeholders.searchTargets": "جستجوی هدف...",
  "empty.noTargets": "هدفی پیدا نشد.",
  "placeholders.optionalResource": "منبع مرتبط، اختیاری",
  "placeholders.searchResources": "جستجوی منبع...",
  "empty.noResources": "منبعی پیدا نشد.",
  "fields.recurringWeekdays": "روزهای تکرارشونده هفته",
  "fields.specificDate": "تاریخ خاص",
  "fields.startsAt": "ساعت شروع",
  "fields.endsAt": "ساعت پایان",
  "fields.capacity": "ظرفیت",
  "fields.slotInterval": "فاصله نوبت‌ها به دقیقه",
  "fields.priority": "اولویت",
  "fields.minBookingMinutes": "حداقل مدت رزرو",
  "fields.maxBookingMinutes": "حداکثر مدت رزرو",
  "fields.timezone": "منطقه زمانی",
  "fields.activeRule": "این قانون فعال باشد",
  "fields.resourceType": "نوع منبع",
  "fields.resourceCode": "کد داخلی منبع",
  "fields.totalCapacity": "ظرفیت کل",
  "fields.resourceName": "نام منبع",
  "fields.resourceDescription": "توضیح منبع",
  "fields.activeResource": "این منبع فعال باشد",
  "placeholders.searchAdmin": "جستجو در قانون‌ها و منابع...",
  "placeholders.searchProviders": "جستجوی مرکز...",
  "placeholders.searchServices": "جستجوی خدمت...",
  "placeholders.optionalProviderContext": "انتخاب مرکز برای محدود کردن جستجو",
  "placeholders.optionalServiceContext": "انتخاب خدمت، اختیاری",
  "placeholders.selectProvider": "ابتدا مرکز را انتخاب کنید",
  "placeholders.selectProviderFirst": "ابتدا مرکز را انتخاب کنید",
  "placeholders.selectTarget": "هدف قانون را انتخاب کنید",
  "placeholders.auto": "خودکار",
  "placeholders.resourceCode": "مثلاً ROOM-101 یا LASER-01",
  "targetTypes.provider": "کل مرکز",
  "targetTypes.provider_service": "خدمت یک مرکز",
  "targetTypes.service_definition": "تعریف کلی خدمت",
  "targetTypes.staff": "شخص / پزشک",
  "targetTypes.provider_staff": "پرسنل متصل به یک مرکز",
  "targetTypes.bookable_resource": "منبع قابل رزرو",
  "resourceTypes.generic": "عمومی",
  "resourceTypes.room": "اتاق",
  "resourceTypes.bed": "تخت",
  "resourceTypes.seat": "صندلی",
  "resourceTypes.table": "میز",
  "resourceTypes.vehicle": "خودرو",
  "resourceTypes.equipment": "تجهیزات / دستگاه",
  "resourceTypes.unit": "واحد ظرفیت",
  "targetTypeHelp.provider": "این قانون روی کل مرکز اعمال می‌شود؛ برای ساعات عمومی یا تعطیلی کل مرکز مناسب است.",
  "targetTypeHelp.provider_service": "این قانون فقط روی یک خدمت مشخص از یک مرکز اعمال می‌شود؛ رایج‌ترین حالت برای رزرو خدمات است.",
  "targetTypeHelp.service_definition": "این قانون روی تعریف کلی یک خدمت اعمال می‌شود و بهتر است فقط برای الگوهای عمومی استفاده شود.",
  "targetTypeHelp.staff": "این قانون روی یک شخص مستقل، مثل پزشک یا کارشناس، اعمال می‌شود.",
  "targetTypeHelp.provider_staff": "این قانون روی همکاری یک شخص در یک مرکز مشخص اعمال می‌شود؛ وقتی یک پزشک در چند مرکز کار می‌کند مفید است.",
  "targetTypeHelp.bookable_resource": "این قانون روی یک منبع واقعی مثل اتاق، تخت، صندلی، خودرو یا دستگاه اعمال می‌شود.",
  "help.weekdayBulk": "برای برنامه تکراری، روزهای هفته را انتخاب کنید. برای یک روز خاص، تاریخ خاص را وارد کنید تا روزهای هفته نادیده گرفته شوند.",
  "help.specificDateOverridesWeekdays": "اگر تاریخ خاص وارد شود، این قانون فقط برای همان روز اجرا می‌شود و انتخاب روزهای هفته اهمیتی ندارد.",
  "help.resourceName": "نامی که کارمند بتواند منبع را سریع تشخیص دهد؛ مثل اتاق ۱۰۱، تخت VIP یا دستگاه لیزر ۱.",
  "help.resourceDescription": "توضیح اختیاری درباره کاربرد، محدودیت یا محل این منبع.",
  "ruleForm.addTitle": "افزودن قانون زمان‌دهی",
  "ruleForm.editTitle": "ویرایش قانون زمان‌دهی",
  "ruleForm.description": "قانون تعیین می‌کند چه بازه‌ای برای مشتری قابل رزرو یا مسدود باشد.",
  "resourceForm.addTitle": "افزودن منبع قابل رزرو",
  "resourceForm.editTitle": "ویرایش منبع قابل رزرو",
  "resourceForm.description": "منبع قابل رزرو چیزی است که ظرفیت واقعی رزرو را محدود می‌کند؛ مثل اتاق، تخت، صندلی، خودرو یا دستگاه.",
  "toasts.ruleUpdated": "قانون زمان‌دهی به‌روزرسانی شد.",
  "toasts.ruleCreated": "قانون زمان‌دهی ایجاد شد.",
  "toasts.ruleSaveFailed": "ذخیره قانون انجام نشد.",
  "toasts.ruleStatusUpdated": "وضعیت قانون به‌روزرسانی شد.",
  "toasts.ruleUpdateFailed": "به‌روزرسانی قانون انجام نشد.",
  "toasts.ruleDeleted": "قانون حذف شد.",
  "toasts.ruleDeleteFailed": "حذف قانون انجام نشد.",
  "toasts.resourceUpdated": "منبع به‌روزرسانی شد.",
  "toasts.resourceCreated": "منبع ایجاد شد.",
  "toasts.resourceSaveFailed": "ذخیره منبع انجام نشد.",
  "toasts.resourceStatusUpdated": "وضعیت منبع به‌روزرسانی شد.",
  "toasts.resourceUpdateFailed": "به‌روزرسانی منبع انجام نشد.",
  "toasts.resourceDeleted": "منبع حذف شد.",
  "toasts.resourceDeleteFailed": "حذف منبع انجام نشد.",
  "confirm.deleteRule": "آیا مطمئن هستید این قانون حذف شود؟",
  "confirm.deleteResource": "آیا مطمئن هستید این منبع حذف شود؟"
};

export function availabilityText(locale: string | undefined, t: Translator) {
  const useFa = isPersianLocale(locale);
  const tr = (key: string, values?: Record<string, unknown>) => {
    if (useFa) {
      if (key === "labels.weeklyMode") return `${values?.count ?? 0} روز هفته انتخاب شده است.`;
      if (fa[key]) return fa[key];
    }
    try {
      return t(key, values);
    } catch {
      return fa[key] || key;
    }
  };

  return {
    tr,
    targetTypeLabel: (value?: string | null) => tr(`targetTypes.${value || "provider_service"}`),
    resourceTypeLabel: (value?: string | null) => tr(`resourceTypes.${value || "generic"}`),
    isPersian: useFa,
  };
}

export const readableGuideClass = "rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-slate-900 shadow-sm dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-50";
export const readableHelpClass = "mt-1 block text-xs leading-5 text-slate-700 dark:text-slate-200";
export const readableInlineInfoClass = "rounded-xl border border-sky-200 bg-sky-50 p-3 text-sm leading-6 text-slate-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-50";

export const targetTypeExplanationsFa: Record<string, string> = {
  provider: "کل ساعات و ظرفیت مرکز را کنترل می‌کند. برای تعطیلی کل مرکز یا ساعات عمومی استفاده کنید.",
  provider_service: "فقط یک خدمت مشخص از یک مرکز را کنترل می‌کند. برای بیشتر رزروهای درمانی، زیبایی، باشگاه یا هتل این گزینه مناسب است.",
  service_definition: "روی تعریف عمومی خدمت اعمال می‌شود، نه یک ارائه‌دهنده خاص. فقط وقتی استفاده شود که واقعاً می‌خواهید قانون عمومی داشته باشید.",
  staff: "زمان شخص/پزشک مستقل را کنترل می‌کند. اگر پزشک در چند مرکز کار می‌کند، گزینه پرسنل مرکز دقیق‌تر است.",
  provider_staff: "زمان یک پزشک/کارشناس در یک مرکز مشخص را کنترل می‌کند. برای پزشکانی که در چند مرکز شیفت دارند مناسب‌تر است.",
  bookable_resource: "ظرفیت یک منبع واقعی مثل اتاق، تخت، صندلی، خودرو یا دستگاه را کنترل می‌کند. برای جلوگیری از رزرو بیش از ظرفیت استفاده کنید.",
};

export const ruleTypeExplanationsFa: Record<string, string> = {
  available: "این بازه را برای رزرو باز می‌کند. مشتری می‌تواند بین ساعت شروع و پایان، بر اساس فاصله نوبت، زمان انتخاب کند.",
  blocked: "این بازه را می‌بندد. برای تعطیلی، مرخصی، ناهار، تعمیرات یا زمانی که نباید رزرو انجام شود استفاده کنید.",
};

export const resourceTypeExplanationsFa: Record<string, string> = {
  generic: "وقتی نوع خاصی ندارید اما می‌خواهید ظرفیت کلی تعریف کنید.",
  room: "برای اتاق هتل، اتاق درمان، اتاق مشاوره یا اتاق عمل سبک.",
  bed: "برای تخت کلینیک، تخت بستری، تخت ریکاوری یا تخت خدمات زیبایی.",
  seat: "برای کلاس، سمینار، صندلی انتظار یا ظرفیت گروهی.",
  table: "برای میز رستوران، میز مشاوره یا ظرفیت مشابه.",
  vehicle: "برای خودرو، ون، آمبولانس یا وسیله حمل‌ونقل قابل رزرو.",
  equipment: "برای دستگاه یا تجهیزاتی که همزمان فقط تعداد محدودی استفاده می‌شود؛ مثل لیزر، MRI، دستگاه فیزیوتراپی.",
  unit: "برای هر واحد ظرفیت قابل شمارش که در گزینه‌های دیگر جا نمی‌گیرد.",
};
