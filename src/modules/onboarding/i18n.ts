import type { PortalLocale } from "@core/i18n/config";

type StepCopy = { title: string; text: string };
type FeatureCopy = { title: string; text: string };

type OnboardingCopy = {
  common: {
    dashboard: string;
    open: string;
    start: string;
    missingProviderType: string;
    statuses: Record<string, string>;
  };
  providerLanding: {
    authBeforeCode: string;
    authAfterCode: string;
    badge: string;
    headline: string;
    intro: string;
    primaryAction: string;
    secondaryAction: string;
    benefits: string[];
    readinessKicker: string;
    readinessTitle: string;
    readinessRows: Array<[string, string, string]>;
    quickLinks: string[];
    flowKicker: string;
    flowTitle: string;
    flowDescription: string;
    steps: StepCopy[];
    modulesKicker: string;
    modulesTitle: string;
    multilingualReady: string;
    features: FeatureCopy[];
    ctaTitle: string;
    ctaDescription: string;
    startApplication: string;
  };
  staffLanding: {
    badge: string;
    headline: string;
    intro: string;
    primaryAction: string;
    secondaryAction: string;
    benefits: string[];
    ownershipKicker: string;
    ownershipTitle: string;
    ownershipRows: Array<[string, string, string]>;
    quickLinks: string[];
    flowKicker: string;
    flowTitle: string;
    flowDescription: string;
    steps: StepCopy[];
    controlsKicker: string;
    controlsTitle: string;
    controlledAccess: string;
    features: FeatureCopy[];
    ctaTitle: string;
    ctaDescription: string;
    startRequest: string;
  };
  form: {
    providerTitle: string;
    staffTitle: string;
    providerType: string;
    relatedCenterType: string;
    selectType: string;
    legalName: string;
    centerName: string;
    providerDisplayName: string;
    staffDisplayName: string;
    professionalTitle: string;
    specialtyRole: string;
    existingProfileReference: string;
    centerContact: string;
    contactPerson: string;
    email: string;
    phonePrefix: string;
    phone: string;
    website: string;
    professionalPage: string;
    address: string;
    centerAddress: string;
    notes: string;
    documentsNotes: string;
    staffActivationNotice: string;
    submitProvider: string;
    submitStaff: string;
    registerProvider: string;
    requestStaffOwnership: string;
  };
  applications: {
    title: string;
    description: string;
    newApplication: string;
    noApplications: string;
    emptyDescription: string;
  };
  newProvider: { title: string; description: string };
  newStaff: { title: string; description: string };
};

const en: OnboardingCopy = {
  common: {
    dashboard: "Dashboard",
    open: "Open",
    start: "Start",
    missingProviderType: "Missing provider type",
    statuses: {
      draft: "Draft",
      submitted: "Submitted",
      in_review: "In review",
      approved: "Approved",
      rejected: "Rejected",
      disabled: "Disabled",
    },
  },
  providerLanding: {
    authBeforeCode: "Sign in through LSevin, or configure a real",
    authAfterCode: "after restoring the local database.",
    badge: "LSevin Providers Portal",
    headline: "Turn a LSevin user into a trusted provider workspace.",
    intro: "A modular portal where registered LSevin users can apply as providers, or admins can assign existing providers to users so they can manage services, staff, media, availability, bookings, offers, support, finance, and reports.",
    primaryAction: "Become a provider",
    secondaryAction: "Open my portal",
    benefits: ["Shared LSevin login", "Admin assignment support", "One-folder modules"],
    readinessKicker: "Provider readiness",
    readinessTitle: "Marketplace management",
    readinessRows: [
      ["Profile data", "Complete", "92%"],
      ["Services and prices", "12 active", "78%"],
      ["Staff and credentials", "6 linked", "64%"],
      ["Finance setup", "Payout ready", "88%"],
    ],
    quickLinks: ["Bookings", "Reviews", "Reports"],
    flowKicker: "Conversion flow",
    flowTitle: "From normal user to provider operator",
    flowDescription: "The portal supports both self-onboarding and admin assignment of an existing provider to a LSevin user.",
    steps: [
      { title: "Login with LSevin", text: "The portal uses the same LSevin identity. Existing users can start without a second account." },
      { title: "Submit provider profile", text: "Choose provider type, enter legal and profile data, upload documents, and request review." },
      { title: "Manage your marketplace data", text: "After approval or admin assignment, manage services, staff, media, schedules, offers, bookings, and finance." },
    ],
    modulesKicker: "Portal modules",
    modulesTitle: "Standalone modules with shared core",
    multilingualReady: "Ready for multilingual LSevin data",
    features: [
      { title: "Provider profile", text: "Business identity, location, languages, specialties, contact data, and marketplace presentation." },
      { title: "Services", text: "Provider-specific names, descriptions, prices, duration, slot size, images, and status." },
      { title: "Staff", text: "Doctors, specialists, trainers, beauty staff, interpreters, guides, and employees linked to the provider." },
      { title: "Media", text: "Gallery photos and videos used across provider and service pages." },
      { title: "Availability", text: "Operating hours, bookable resources, and availability rules for provider operations." },
      { title: "Finance", text: "Wallet, compensation, settlement, withdrawals, and payout accounts." },
      { title: "Bookings", text: "Booking queue, payment status, provider notes, and provider-side status updates." },
      { title: "Growth tools", text: "Offers, reviews, support tickets, and management checklists that improve marketplace quality." },
    ],
    ctaTitle: "Ready to start provider onboarding?",
    ctaDescription: "Submit a new application or open your assigned provider workspace.",
    startApplication: "Start application",
  },
  staffLanding: {
    badge: "LSevin Staff Portal",
    headline: "Turn a LSevin user into the owner of their staff profile.",
    intro: "A dedicated path for doctors, specialists, trainers, beauty experts, interpreters, guides, and employees who need to claim or create a staff page connected to a verified provider.",
    primaryAction: "Claim or create staff profile",
    secondaryAction: "I represent a clinic/provider",
    benefits: ["Clinic confirmation", "LSevin verification", "Payment-aware ownership"],
    ownershipKicker: "Staff ownership",
    ownershipTitle: "Verification pipeline",
    ownershipRows: [
      ["Identity evidence", "Submitted", "72%"],
      ["Clinic confirmation", "Pending", "44%"],
      ["LSevin review", "Queued", "28%"],
      ["Payment/waiver", "Not required", "18%"],
    ],
    quickLinks: ["Schedule", "Reviews", "Bookings"],
    flowKicker: "Staff conversion flow",
    flowTitle: "Two staff paths: claim an existing profile or request a new one",
    flowDescription: "A staff page cannot be taken over without provider confirmation and LSevin verification.",
    steps: [
      { title: "Claim an existing staff profile", text: "For professionals and employees who already appear on LSevin." },
      { title: "Request a new staff profile", text: "For a staff member linked to a provider who does not yet have a marketplace profile." },
      { title: "Get provider and LSevin approval", text: "The provider confirms the relationship, then LSevin verifies identity, documents, and ownership rights." },
      { title: "Manage your own page", text: "After approval and any required payment or waiver, manage allowed content, schedule, reviews, and bookings." },
    ],
    controlsKicker: "Staff page controls",
    controlsTitle: "What staff can manage after approval",
    controlledAccess: "Provider + LSevin controlled access",
    features: [
      { title: "Professional identity", text: "Name, title, specialty, biography, education, credentials, certifications, languages, and profile image." },
      { title: "Provider relationship", text: "The staff profile remains connected to a provider so ownership cannot bypass the business owner." },
      { title: "Schedule and timing", text: "Staff can manage available days, times, and bookable services when the provider allows it." },
      { title: "Portfolio and media", text: "Gallery, certificates, and profile media can be submitted for moderation." },
      { title: "Services", text: "Staff can be linked to provider services, fees, specialties, and active booking slots." },
      { title: "Reviews and replies", text: "Staff can see reviews targeted to their profile and reply according to provider policy." },
      { title: "Bookings", text: "Staff can see assigned bookings, notes, payment snapshots, and operational tasks." },
      { title: "Optional paid ownership", text: "When ownership is chargeable, billing issues the invoice through the shared Core capability." },
    ],
    ctaTitle: "Ready to claim or create a staff profile?",
    ctaDescription: "Start the staff application. Admins can connect it to a staff page and the required provider confirmation.",
    startRequest: "Start staff request",
  },
  form: {
    providerTitle: "Provider partnership application",
    staffTitle: "Staff profile ownership request",
    providerType: "Provider type",
    relatedCenterType: "Related provider type",
    selectType: "Select type",
    legalName: "Legal name",
    centerName: "Provider or clinic name",
    providerDisplayName: "Provider display name",
    staffDisplayName: "Staff display name",
    professionalTitle: "Professional title",
    specialtyRole: "Specialty or role",
    existingProfileReference: "Existing profile link or ID",
    centerContact: "Provider contact person",
    contactPerson: "Contact person",
    email: "Email",
    phonePrefix: "Calling code",
    phone: "Phone",
    website: "Website",
    professionalPage: "Professional page",
    address: "Address",
    centerAddress: "Provider address",
    notes: "Additional notes",
    documentsNotes: "Documents and notes",
    staffActivationNotice: "Ownership is activated only after provider confirmation, LSevin review, and payment when required.",
    submitProvider: "Submit application",
    submitStaff: "Submit staff request",
    registerProvider: "Register a provider",
    requestStaffOwnership: "Request staff-page ownership",
  },
  applications: {
    title: "Provider applications",
    description: "Applications submitted by your account.",
    newApplication: "New application",
    noApplications: "No applications",
    emptyDescription: "Start onboarding to create a provider workspace.",
  },
  newProvider: {
    title: "Become a provider",
    description: "Submit provider information. LSevin admins can approve it and create or attach a provider workspace.",
  },
  newStaff: {
    title: "Claim or create a staff profile",
    description: "Submit a staff ownership request. Provider confirmation and LSevin approval are required before management is enabled.",
  },
};

const fa: OnboardingCopy = {
  common: {
    dashboard: "داشبورد", open: "باز کردن", start: "شروع", missingProviderType: "نوع ارائه‌دهنده یافت نشد",
    statuses: { draft: "پیش‌نویس", submitted: "ارسال‌شده", in_review: "در حال بررسی", approved: "تأییدشده", rejected: "ردشده", disabled: "غیرفعال" },
  },
  providerLanding: {
    authBeforeCode: "از طریق السوین وارد شوید یا پس از بازیابی پایگاه داده محلی، یک مقدار واقعی برای",
    authAfterCode: "تنظیم کنید.",
    badge: "پرتال ارائه‌دهندگان السوین",
    headline: "حساب کاربری السوین را به محیط کاری مطمئن ارائه‌دهنده تبدیل کنید.",
    intro: "پرتالی ماژولار که کاربران ثبت‌شده السوین از طریق آن درخواست ارائه‌دهندگی می‌دهند یا مدیر، ارائه‌دهنده موجود را به کاربر متصل می‌کند تا خدمات، کارکنان، رسانه، زمان‌بندی، رزروها، پیشنهادها، پشتیبانی، امور مالی و گزارش‌ها را مدیریت کند.",
    primaryAction: "ارائه‌دهنده شوید", secondaryAction: "ورود به پرتال من",
    benefits: ["ورود مشترک با السوین", "اتصال توسط مدیر", "ماژول‌های مستقل در یک پوشه"],
    readinessKicker: "آمادگی ارائه‌دهنده", readinessTitle: "مدیریت بازار خدمات",
    readinessRows: [["اطلاعات پروفایل", "کامل", "92%"], ["خدمات و قیمت‌ها", "۱۲ مورد فعال", "78%"], ["کارکنان و مدارک", "۶ مورد متصل", "64%"], ["راه‌اندازی مالی", "آماده تسویه", "88%"]],
    quickLinks: ["رزروها", "دیدگاه‌ها", "گزارش‌ها"],
    flowKicker: "فرایند تبدیل", flowTitle: "از کاربر عادی تا مدیر ارائه‌دهنده", flowDescription: "پرتال هم درخواست مستقیم کاربر و هم اتصال یک ارائه‌دهنده موجود توسط مدیر به حساب السوین را پشتیبانی می‌کند.",
    steps: [
      { title: "ورود با السوین", text: "پرتال از همان هویت السوین استفاده می‌کند و کاربر موجود به حساب دوم نیاز ندارد." },
      { title: "ارسال پروفایل ارائه‌دهنده", text: "نوع ارائه‌دهنده، اطلاعات قانونی و پروفایل، مدارک و درخواست بررسی را ثبت کنید." },
      { title: "مدیریت اطلاعات بازار", text: "پس از تأیید یا اتصال مدیر، خدمات، کارکنان، رسانه، برنامه‌ها، پیشنهادها، رزروها و امور مالی را مدیریت کنید." },
    ],
    modulesKicker: "ماژول‌های پرتال", modulesTitle: "ماژول‌های مستقل با هسته مشترک", multilingualReady: "آماده برای داده‌های چندزبانه السوین",
    features: [
      { title: "پروفایل ارائه‌دهنده", text: "هویت کسب‌وکار، موقعیت، زبان‌ها، تخصص‌ها، اطلاعات تماس و نمایش در بازار." },
      { title: "خدمات", text: "نام، توضیح، قیمت، مدت، ظرفیت، تصاویر و وضعیت اختصاصی خدمات ارائه‌دهنده." },
      { title: "کارکنان", text: "پزشکان، متخصصان، مربیان، کارکنان زیبایی، مترجمان، راهنماها و کارمندان متصل به ارائه‌دهنده." },
      { title: "رسانه", text: "عکس‌ها و ویدئوهای گالری برای صفحات ارائه‌دهنده و خدمات." },
      { title: "دسترسی‌پذیری", text: "ساعات کاری، منابع قابل رزرو و قوانین دسترسی‌پذیری عملیات." },
      { title: "امور مالی", text: "کیف پول، جبران خدمات، تسویه، برداشت و حساب‌های واریز." },
      { title: "رزروها", text: "صف رزرو، وضعیت پرداخت، یادداشت‌های ارائه‌دهنده و تغییر وضعیت." },
      { title: "ابزارهای رشد", text: "پیشنهادها، دیدگاه‌ها، تیکت‌های پشتیبانی و چک‌لیست‌های بهبود کیفیت بازار." },
    ],
    ctaTitle: "برای شروع فرایند ارائه‌دهندگی آماده‌اید؟", ctaDescription: "درخواست جدید ثبت کنید یا محیط کاری متصل‌شده خود را باز کنید.", startApplication: "شروع درخواست",
  },
  staffLanding: {
    badge: "پرتال کارکنان السوین", headline: "حساب السوین را به مالک پروفایل حرفه‌ای کارمند تبدیل کنید.",
    intro: "مسیر اختصاصی برای پزشکان، متخصصان، مربیان، کارشناسان زیبایی، مترجمان، راهنماها و کارکنانی که می‌خواهند پروفایل متصل به یک ارائه‌دهنده تأییدشده را مطالبه یا ایجاد کنند.",
    primaryAction: "مطالبه یا ایجاد پروفایل کارمند", secondaryAction: "نماینده مرکز یا ارائه‌دهنده هستم",
    benefits: ["تأیید مرکز", "بررسی السوین", "مالکیت با کنترل پرداخت"], ownershipKicker: "مالکیت پروفایل کارمند", ownershipTitle: "مسیر تأیید",
    ownershipRows: [["مدرک هویتی", "ارسال‌شده", "72%"], ["تأیید مرکز", "در انتظار", "44%"], ["بررسی السوین", "در صف", "28%"], ["پرداخت یا معافیت", "لازم نیست", "18%"]],
    quickLinks: ["برنامه زمانی", "دیدگاه‌ها", "رزروها"], flowKicker: "فرایند تبدیل کارمند", flowTitle: "دو مسیر: مطالبه پروفایل موجود یا درخواست پروفایل جدید", flowDescription: "هیچ‌کس بدون تأیید ارائه‌دهنده و بررسی السوین نمی‌تواند کنترل صفحه یک پزشک یا کارمند را به دست بگیرد.",
    steps: [
      { title: "مطالبه پروفایل موجود", text: "برای متخصصان و کارکنانی که از قبل در السوین نمایش داده می‌شوند." },
      { title: "درخواست پروفایل جدید", text: "برای کارمند متصل به ارائه‌دهنده که هنوز پروفایل بازار ندارد." },
      { title: "دریافت تأیید ارائه‌دهنده و السوین", text: "ارائه‌دهنده رابطه را تأیید می‌کند و سپس السوین هویت، مدارک و حق مالکیت را بررسی می‌کند." },
      { title: "مدیریت صفحه شخصی", text: "پس از تأیید و پرداخت یا معافیت لازم، محتوای مجاز، برنامه، دیدگاه‌ها و رزروها را مدیریت کنید." },
    ],
    controlsKicker: "کنترل‌های صفحه کارمند", controlsTitle: "کارمند پس از تأیید چه چیزهایی را مدیریت می‌کند؟", controlledAccess: "دسترسی تحت کنترل ارائه‌دهنده و السوین",
    features: [
      { title: "هویت حرفه‌ای", text: "نام، عنوان، تخصص، شرح‌حال، تحصیلات، مدارک، گواهی‌ها، زبان‌ها و تصویر پروفایل." },
      { title: "رابطه با ارائه‌دهنده", text: "پروفایل به ارائه‌دهنده متصل می‌ماند تا مالکیت، صاحب کسب‌وکار را دور نزند." },
      { title: "برنامه و زمان‌بندی", text: "کارمند در صورت اجازه ارائه‌دهنده، روزها، ساعت‌ها و خدمات قابل رزرو خود را مدیریت می‌کند." },
      { title: "نمونه‌کار و رسانه", text: "گالری، گواهی‌ها و رسانه پروفایل برای بررسی ارسال می‌شوند." },
      { title: "خدمات", text: "کارمند به خدمات، هزینه‌ها، تخصص‌ها و زمان‌های رزرو فعال ارائه‌دهنده متصل می‌شود." },
      { title: "دیدگاه و پاسخ", text: "کارمند دیدگاه‌های مربوط به پروفایل خود را می‌بیند و طبق سیاست ارائه‌دهنده پاسخ می‌دهد." },
      { title: "رزروها", text: "رزروهای واگذارشده، یادداشت‌ها، خلاصه پرداخت و کارهای عملیاتی را مشاهده می‌کند." },
      { title: "مالکیت پولی اختیاری", text: "در صورت پولی بودن مالکیت، صورتحساب از طریق قابلیت مشترک هسته صادر می‌شود." },
    ],
    ctaTitle: "برای مطالبه یا ایجاد پروفایل کارمند آماده‌اید؟", ctaDescription: "درخواست کارمند را شروع کنید تا مدیر آن را به پروفایل و تأیید لازم مرکز متصل کند.", startRequest: "شروع درخواست کارمند",
  },
  form: {
    providerTitle: "درخواست همکاری ارائه‌دهنده", staffTitle: "درخواست مالکیت پروفایل کارمند", providerType: "نوع ارائه‌دهنده", relatedCenterType: "نوع مرکز مرتبط", selectType: "انتخاب نوع", legalName: "نام قانونی", centerName: "نام مرکز یا کلینیک", providerDisplayName: "نام نمایشی ارائه‌دهنده", staffDisplayName: "نام نمایشی کارمند", professionalTitle: "عنوان حرفه‌ای", specialtyRole: "تخصص یا نقش", existingProfileReference: "لینک یا شناسه پروفایل موجود", centerContact: "مسئول تماس مرکز", contactPerson: "شخص رابط", email: "ایمیل", phonePrefix: "پیش‌شماره", phone: "تلفن", website: "وب‌سایت", professionalPage: "صفحه حرفه‌ای", address: "نشانی", centerAddress: "نشانی مرکز", notes: "توضیحات تکمیلی", documentsNotes: "مدارک و توضیحات", staffActivationNotice: "فعال‌سازی مالکیت فقط پس از تأیید مرکز، بررسی السوین و در صورت نیاز پرداخت انجام می‌شود.", submitProvider: "ارسال درخواست", submitStaff: "ارسال درخواست کارمند", registerProvider: "ثبت مرکز یا ارائه‌دهنده", requestStaffOwnership: "درخواست مالکیت صفحه کارمند",
  },
  applications: { title: "درخواست‌های ارائه‌دهندگی", description: "درخواست‌های ثبت‌شده با حساب شما.", newApplication: "درخواست جدید", noApplications: "درخواستی وجود ندارد", emptyDescription: "برای ایجاد محیط کاری ارائه‌دهنده، فرایند ثبت‌نام را شروع کنید." },
  newProvider: { title: "ارائه‌دهنده شوید", description: "اطلاعات ارائه‌دهنده را ارسال کنید تا مدیران السوین آن را تأیید و یک محیط کاری جدید یا موجود را متصل کنند." },
  newStaff: { title: "مطالبه یا ایجاد پروفایل کارمند", description: "درخواست مالکیت را ارسال کنید. پیش از فعال شدن مدیریت، تأیید ارائه‌دهنده و السوین الزامی است." },
};

const ar: OnboardingCopy = {
  common: { dashboard: "لوحة التحكم", open: "فتح", start: "ابدأ", missingProviderType: "نوع المزوّد غير موجود", statuses: { draft: "مسودة", submitted: "مُرسَل", in_review: "قيد المراجعة", approved: "مقبول", rejected: "مرفوض", disabled: "معطّل" } },
  providerLanding: {
    authBeforeCode: "سجّل الدخول عبر LSevin، أو اضبط قيمة حقيقية لـ", authAfterCode: "بعد استعادة قاعدة البيانات المحلية.", badge: "بوابة مزوّدي LSevin", headline: "حوّل حساب LSevin إلى مساحة عمل موثوقة لمزوّد الخدمة.", intro: "بوابة معيارية تتيح لمستخدمي LSevin التقديم كمزوّدين، أو تتيح للإدارة ربط مزوّد موجود بالمستخدم ليدير الخدمات والموظفين والوسائط والتوافر والحجوزات والعروض والدعم والمالية والتقارير.", primaryAction: "أصبح مزوّد خدمة", secondaryAction: "افتح بوابتي", benefits: ["دخول موحّد مع LSevin", "ربط بواسطة الإدارة", "وحدات مستقلة في مجلد واحد"], readinessKicker: "جاهزية المزوّد", readinessTitle: "إدارة السوق", readinessRows: [["بيانات الملف", "مكتملة", "92%"], ["الخدمات والأسعار", "12 فعالة", "78%"], ["الموظفون والاعتمادات", "6 مرتبطون", "64%"], ["الإعداد المالي", "جاهز للتحويل", "88%"]], quickLinks: ["الحجوزات", "المراجعات", "التقارير"], flowKicker: "مسار التحويل", flowTitle: "من مستخدم عادي إلى مدير مزوّد", flowDescription: "تدعم البوابة التقديم الذاتي وربط مزوّد موجود بحساب LSevin بواسطة الإدارة.", steps: [{ title: "الدخول عبر LSevin", text: "تستخدم البوابة هوية LSevin نفسها، لذلك لا يحتاج المستخدم الحالي إلى حساب ثانٍ." }, { title: "إرسال ملف المزوّد", text: "اختر النوع وأدخل البيانات القانونية وبيانات الملف وارفع المستندات واطلب المراجعة." }, { title: "إدارة بيانات السوق", text: "بعد القبول أو الربط الإداري، أدر الخدمات والموظفين والوسائط والجداول والعروض والحجوزات والمالية." }], modulesKicker: "وحدات البوابة", modulesTitle: "وحدات مستقلة بنواة مشتركة", multilingualReady: "جاهزة لبيانات LSevin متعددة اللغات", features: [{ title: "ملف المزوّد", text: "هوية النشاط والموقع واللغات والتخصصات وبيانات الاتصال والعرض في السوق." }, { title: "الخدمات", text: "الأسماء والأوصاف والأسعار والمدة والسعة والصور والحالة الخاصة بالمزوّد." }, { title: "الموظفون", text: "الأطباء والمتخصصون والمدربون وموظفو التجميل والمترجمون والمرشدون والموظفون المرتبطون بالمزوّد." }, { title: "الوسائط", text: "صور وفيديوهات المعرض المستخدمة في صفحات المزوّد والخدمة." }, { title: "التوافر", text: "ساعات العمل والموارد القابلة للحجز وقواعد التوافر." }, { title: "المالية", text: "المحفظة والتعويض والتسوية والسحب وحسابات التحويل." }, { title: "الحجوزات", text: "قائمة الحجوزات وحالة الدفع وملاحظات المزوّد وتحديثات الحالة." }, { title: "أدوات النمو", text: "العروض والمراجعات وتذاكر الدعم وقوائم تحسين جودة السوق." }], ctaTitle: "هل أنت جاهز لبدء تسجيل المزوّد؟", ctaDescription: "أرسل طلباً جديداً أو افتح مساحة المزوّد المرتبطة بحسابك.", startApplication: "ابدأ الطلب",
  },
  staffLanding: {
    badge: "بوابة موظفي LSevin", headline: "حوّل حساب LSevin إلى مالك لملفه المهني.", intro: "مسار مخصص للأطباء والمتخصصين والمدربين وخبراء التجميل والمترجمين والمرشدين والموظفين الذين يحتاجون إلى المطالبة بصفحة موظف أو إنشائها وربطها بمزوّد موثّق.", primaryAction: "المطالبة بملف موظف أو إنشاؤه", secondaryAction: "أمثل عيادة أو مزوّداً", benefits: ["تأكيد المزوّد", "تحقق LSevin", "ملكية مرتبطة بالدفع"], ownershipKicker: "ملكية ملف الموظف", ownershipTitle: "مسار التحقق", ownershipRows: [["إثبات الهوية", "مُرسَل", "72%"], ["تأكيد المزوّد", "معلّق", "44%"], ["مراجعة LSevin", "في الانتظار", "28%"], ["الدفع أو الإعفاء", "غير مطلوب", "18%"]], quickLinks: ["الجدول", "المراجعات", "الحجوزات"], flowKicker: "مسار تحويل الموظف", flowTitle: "مساران: المطالبة بملف موجود أو طلب ملف جديد", flowDescription: "لا يمكن الاستحواذ على صفحة طبيب أو موظف دون تأكيد المزوّد وتحقق LSevin.", steps: [{ title: "المطالبة بملف موجود", text: "للمهنيين والموظفين الذين يظهرون بالفعل في LSevin." }, { title: "طلب ملف جديد", text: "لموظف مرتبط بمزوّد ولا يملك بعد ملفاً في السوق." }, { title: "الحصول على موافقة المزوّد وLSevin", text: "يؤكد المزوّد العلاقة ثم تتحقق LSevin من الهوية والمستندات وحق الملكية." }, { title: "إدارة صفحتك", text: "بعد الموافقة وأي دفع أو إعفاء مطلوب، أدر المحتوى المسموح والجدول والمراجعات والحجوزات." }], controlsKicker: "عناصر تحكم الموظف", controlsTitle: "ما الذي يستطيع الموظف إدارته بعد القبول؟", controlledAccess: "وصول تحت تحكم المزوّد وLSevin", features: [{ title: "الهوية المهنية", text: "الاسم واللقب والتخصص والنبذة والتعليم والاعتمادات والشهادات واللغات والصورة." }, { title: "علاقة المزوّد", text: "يبقى الملف مرتبطاً بالمزوّد حتى لا تتجاوز الملكية صاحب النشاط." }, { title: "الجدول والتوقيت", text: "يمكن للموظف إدارة الأيام والأوقات والخدمات القابلة للحجز عندما يسمح المزوّد." }, { title: "الأعمال والوسائط", text: "يمكن إرسال المعرض والشهادات ووسائط الملف للمراجعة." }, { title: "الخدمات", text: "يمكن ربط الموظف بخدمات المزوّد والرسوم والتخصصات ومواعيد الحجز." }, { title: "المراجعات والردود", text: "يرى الموظف المراجعات الخاصة بملفه ويرد وفق سياسة المزوّد." }, { title: "الحجوزات", text: "يرى الحجوزات المسندة والملاحظات وملخصات الدفع والمهام التشغيلية." }, { title: "ملكية مدفوعة اختيارياً", text: "عندما تكون الملكية مدفوعة، تصدر الفاتورة عبر قدرة النواة المشتركة." }], ctaTitle: "هل أنت جاهز للمطالبة بملف موظف أو إنشائه؟", ctaDescription: "ابدأ طلب الموظف ليتم ربطه بالملف وتأكيد المزوّد المطلوب.", startRequest: "ابدأ طلب الموظف",
  },
  form: { providerTitle: "طلب شراكة مزوّد", staffTitle: "طلب ملكية ملف موظف", providerType: "نوع المزوّد", relatedCenterType: "نوع المزوّد المرتبط", selectType: "اختر النوع", legalName: "الاسم القانوني", centerName: "اسم المزوّد أو العيادة", providerDisplayName: "اسم عرض المزوّد", staffDisplayName: "اسم عرض الموظف", professionalTitle: "اللقب المهني", specialtyRole: "التخصص أو الدور", existingProfileReference: "رابط أو معرّف الملف الموجود", centerContact: "مسؤول اتصال المزوّد", contactPerson: "جهة الاتصال", email: "البريد الإلكتروني", phonePrefix: "رمز الاتصال", phone: "الهاتف", website: "الموقع", professionalPage: "الصفحة المهنية", address: "العنوان", centerAddress: "عنوان المزوّد", notes: "ملاحظات إضافية", documentsNotes: "المستندات والملاحظات", staffActivationNotice: "لا تُفعّل الملكية إلا بعد تأكيد المزوّد ومراجعة LSevin والدفع عند الحاجة.", submitProvider: "إرسال الطلب", submitStaff: "إرسال طلب الموظف", registerProvider: "تسجيل مزوّد", requestStaffOwnership: "طلب ملكية صفحة موظف" },
  applications: { title: "طلبات المزوّد", description: "الطلبات المرسلة بواسطة حسابك.", newApplication: "طلب جديد", noApplications: "لا توجد طلبات", emptyDescription: "ابدأ التسجيل لإنشاء مساحة عمل مزوّد." },
  newProvider: { title: "أصبح مزوّد خدمة", description: "أرسل معلومات المزوّد ليوافق عليها مديرو LSevin وينشئوا مساحة عمل أو يربطوا مساحة موجودة." },
  newStaff: { title: "المطالبة بملف موظف أو إنشاؤه", description: "أرسل طلب الملكية. يلزم تأكيد المزوّد وموافقة LSevin قبل تفعيل الإدارة." },
};

const tr: OnboardingCopy = {
  common: { dashboard: "Kontrol paneli", open: "Aç", start: "Başlat", missingProviderType: "Sağlayıcı türü bulunamadı", statuses: { draft: "Taslak", submitted: "Gönderildi", in_review: "İncelemede", approved: "Onaylandı", rejected: "Reddedildi", disabled: "Devre dışı" } },
  providerLanding: { authBeforeCode: "LSevin üzerinden oturum açın veya yerel veritabanını geri yükledikten sonra gerçek bir", authAfterCode: "değeri yapılandırın.", badge: "LSevin Sağlayıcı Portalı", headline: "Bir LSevin kullanıcısını güvenilir bir sağlayıcı çalışma alanına dönüştürün.", intro: "Kayıtlı LSevin kullanıcılarının sağlayıcı olarak başvurabildiği veya yöneticilerin mevcut sağlayıcıları kullanıcılara bağlayabildiği; hizmet, personel, medya, uygunluk, rezervasyon, teklif, destek, finans ve raporların yönetildiği modüler portal.", primaryAction: "Sağlayıcı ol", secondaryAction: "Portalımı aç", benefits: ["Ortak LSevin girişi", "Yönetici atama desteği", "Tek klasörlü modüller"], readinessKicker: "Sağlayıcı hazırlığı", readinessTitle: "Pazar yeri yönetimi", readinessRows: [["Profil verileri", "Tamamlandı", "92%"], ["Hizmetler ve fiyatlar", "12 aktif", "78%"], ["Personel ve belgeler", "6 bağlı", "64%"], ["Finans kurulumu", "Ödemeye hazır", "88%"]], quickLinks: ["Rezervasyonlar", "Yorumlar", "Raporlar"], flowKicker: "Dönüşüm akışı", flowTitle: "Normal kullanıcıdan sağlayıcı yöneticisine", flowDescription: "Portal hem kendi kendine başvuruyu hem de mevcut sağlayıcının yönetici tarafından bir LSevin kullanıcısına atanmasını destekler.", steps: [{ title: "LSevin ile giriş", text: "Portal aynı LSevin kimliğini kullanır; mevcut kullanıcılar ikinci hesap açmaz." }, { title: "Sağlayıcı profilini gönder", text: "Sağlayıcı türünü seçin, yasal ve profil verilerini girin, belgeleri yükleyin ve inceleme isteyin." }, { title: "Pazar verilerinizi yönetin", text: "Onay veya yönetici atamasından sonra hizmetleri, personeli, medyayı, programları, teklifleri, rezervasyonları ve finansı yönetin." }], modulesKicker: "Portal modülleri", modulesTitle: "Ortak çekirdekli bağımsız modüller", multilingualReady: "Çok dilli LSevin verilerine hazır", features: [{ title: "Sağlayıcı profili", text: "İş kimliği, konum, diller, uzmanlıklar, iletişim ve pazar sunumu." }, { title: "Hizmetler", text: "Sağlayıcıya özel adlar, açıklamalar, fiyatlar, süre, kapasite, görseller ve durum." }, { title: "Personel", text: "Sağlayıcıya bağlı doktorlar, uzmanlar, eğitmenler, güzellik personeli, tercümanlar, rehberler ve çalışanlar." }, { title: "Medya", text: "Sağlayıcı ve hizmet sayfalarında kullanılan galeri fotoğraf ve videoları." }, { title: "Uygunluk", text: "Çalışma saatleri, rezerve edilebilir kaynaklar ve uygunluk kuralları." }, { title: "Finans", text: "Cüzdan, ücretlendirme, mutabakat, çekim ve ödeme hesapları." }, { title: "Rezervasyonlar", text: "Rezervasyon kuyruğu, ödeme durumu, sağlayıcı notları ve durum güncellemeleri." }, { title: "Büyüme araçları", text: "Teklifler, yorumlar, destek talepleri ve kalite kontrol listeleri." }], ctaTitle: "Sağlayıcı kaydına başlamaya hazır mısınız?", ctaDescription: "Yeni başvuru gönderin veya size atanmış sağlayıcı çalışma alanını açın.", startApplication: "Başvuruyu başlat" },
  staffLanding: { badge: "LSevin Personel Portalı", headline: "Bir LSevin kullanıcısını kendi personel profilinin sahibine dönüştürün.", intro: "Doğrulanmış bir sağlayıcıya bağlı personel sayfasını talep etmek veya oluşturmak isteyen doktorlar, uzmanlar, eğitmenler, güzellik uzmanları, tercümanlar, rehberler ve çalışanlar için özel yol.", primaryAction: "Personel profilini talep et veya oluştur", secondaryAction: "Bir klinik/sağlayıcıyı temsil ediyorum", benefits: ["Sağlayıcı onayı", "LSevin doğrulaması", "Ödeme kontrollü sahiplik"], ownershipKicker: "Personel sahipliği", ownershipTitle: "Doğrulama akışı", ownershipRows: [["Kimlik kanıtı", "Gönderildi", "72%"], ["Sağlayıcı onayı", "Bekliyor", "44%"], ["LSevin incelemesi", "Sırada", "28%"], ["Ödeme/muafiyet", "Gerekmiyor", "18%"]], quickLinks: ["Program", "Yorumlar", "Rezervasyonlar"], flowKicker: "Personel dönüşüm akışı", flowTitle: "İki yol: mevcut profili talep et veya yeni profil iste", flowDescription: "Sağlayıcı onayı ve LSevin doğrulaması olmadan bir doktor ya da çalışan sayfası devralınamaz.", steps: [{ title: "Mevcut personel profilini talep et", text: "LSevin'de zaten görünen uzmanlar ve çalışanlar için." }, { title: "Yeni personel profili iste", text: "Bir sağlayıcıya bağlı olup henüz pazar profili olmayan personel için." }, { title: "Sağlayıcı ve LSevin onayı al", text: "Sağlayıcı ilişkiyi doğrular, ardından LSevin kimliği, belgeleri ve sahiplik hakkını inceler." }, { title: "Kendi sayfanı yönet", text: "Onay ve gereken ödeme veya muafiyet sonrası izin verilen içerik, program, yorum ve rezervasyonları yönetin." }], controlsKicker: "Personel sayfası kontrolleri", controlsTitle: "Onaydan sonra personel neleri yönetebilir?", controlledAccess: "Sağlayıcı + LSevin kontrollü erişim", features: [{ title: "Profesyonel kimlik", text: "Ad, unvan, uzmanlık, biyografi, eğitim, belgeler, sertifikalar, diller ve profil görseli." }, { title: "Sağlayıcı ilişkisi", text: "Sahipliğin işletme sahibini aşmaması için profil sağlayıcıya bağlı kalır." }, { title: "Program ve zamanlama", text: "Sağlayıcı izin verdiğinde personel uygun gün, saat ve rezerve edilebilir hizmetleri yönetir." }, { title: "Portföy ve medya", text: "Galeri, sertifikalar ve profil medyası moderasyona gönderilebilir." }, { title: "Hizmetler", text: "Personel sağlayıcı hizmetlerine, ücretlere, uzmanlıklara ve aktif rezervasyon aralıklarına bağlanabilir." }, { title: "Yorumlar ve yanıtlar", text: "Personel kendi profiline yönelik yorumları görür ve sağlayıcı politikasına göre yanıtlar." }, { title: "Rezervasyonlar", text: "Atanan rezervasyonları, notları, ödeme özetlerini ve operasyon görevlerini görür." }, { title: "İsteğe bağlı ücretli sahiplik", text: "Sahiplik ücretliyse fatura ortak Core yeteneği üzerinden oluşturulur." }], ctaTitle: "Personel profilini talep etmeye veya oluşturmaya hazır mısınız?", ctaDescription: "Personel başvurusunu başlatın; yönetici bunu profile ve gerekli sağlayıcı onayına bağlasın.", startRequest: "Personel başvurusunu başlat" },
  form: { providerTitle: "Sağlayıcı ortaklık başvurusu", staffTitle: "Personel profili sahiplik talebi", providerType: "Sağlayıcı türü", relatedCenterType: "İlgili sağlayıcı türü", selectType: "Tür seçin", legalName: "Yasal ad", centerName: "Sağlayıcı veya klinik adı", providerDisplayName: "Sağlayıcı görünen adı", staffDisplayName: "Personel görünen adı", professionalTitle: "Mesleki unvan", specialtyRole: "Uzmanlık veya rol", existingProfileReference: "Mevcut profil bağlantısı veya kimliği", centerContact: "Sağlayıcı irtibat kişisi", contactPerson: "İrtibat kişisi", email: "E-posta", phonePrefix: "Ülke kodu", phone: "Telefon", website: "Web sitesi", professionalPage: "Profesyonel sayfa", address: "Adres", centerAddress: "Sağlayıcı adresi", notes: "Ek notlar", documentsNotes: "Belgeler ve notlar", staffActivationNotice: "Sahiplik yalnızca sağlayıcı onayı, LSevin incelemesi ve gerektiğinde ödeme sonrasında etkinleşir.", submitProvider: "Başvuruyu gönder", submitStaff: "Personel talebini gönder", registerProvider: "Sağlayıcı kaydet", requestStaffOwnership: "Personel sayfası sahipliği iste" },
  applications: { title: "Sağlayıcı başvuruları", description: "Hesabınızdan gönderilen başvurular.", newApplication: "Yeni başvuru", noApplications: "Başvuru yok", emptyDescription: "Bir sağlayıcı çalışma alanı oluşturmak için başvuruyu başlatın." },
  newProvider: { title: "Sağlayıcı ol", description: "Sağlayıcı bilgilerini gönderin; LSevin yöneticileri onaylayıp yeni bir çalışma alanı oluşturabilir veya mevcut olanı bağlayabilir." },
  newStaff: { title: "Personel profilini talep et veya oluştur", description: "Sahiplik talebini gönderin. Yönetim açılmadan önce sağlayıcı onayı ve LSevin doğrulaması gerekir." },
};

const es: OnboardingCopy = {
  common: { dashboard: "Panel", open: "Abrir", start: "Empezar", missingProviderType: "Falta el tipo de proveedor", statuses: { draft: "Borrador", submitted: "Enviada", in_review: "En revisión", approved: "Aprobada", rejected: "Rechazada", disabled: "Desactivada" } },
  providerLanding: { authBeforeCode: "Inicia sesión mediante LSevin o configura un valor real para", authAfterCode: "después de restaurar la base de datos local.", badge: "Portal de Proveedores LSevin", headline: "Convierte un usuario de LSevin en un espacio de trabajo confiable para proveedores.", intro: "Portal modular donde los usuarios registrados pueden solicitar ser proveedores o los administradores pueden asignar proveedores existentes para gestionar servicios, personal, medios, disponibilidad, reservas, ofertas, soporte, finanzas e informes.", primaryAction: "Ser proveedor", secondaryAction: "Abrir mi portal", benefits: ["Inicio de sesión compartido", "Asignación administrativa", "Módulos en una sola carpeta"], readinessKicker: "Preparación del proveedor", readinessTitle: "Gestión del marketplace", readinessRows: [["Datos del perfil", "Completo", "92%"], ["Servicios y precios", "12 activos", "78%"], ["Personal y credenciales", "6 vinculados", "64%"], ["Configuración financiera", "Lista para pagos", "88%"]], quickLinks: ["Reservas", "Reseñas", "Informes"], flowKicker: "Flujo de conversión", flowTitle: "De usuario normal a operador del proveedor", flowDescription: "El portal admite tanto el registro directo como la asignación administrativa de un proveedor existente a un usuario de LSevin.", steps: [{ title: "Entrar con LSevin", text: "El portal usa la misma identidad de LSevin; los usuarios existentes no necesitan otra cuenta." }, { title: "Enviar el perfil del proveedor", text: "Elige el tipo, introduce los datos legales y del perfil, adjunta documentos y solicita la revisión." }, { title: "Gestionar los datos del marketplace", text: "Tras la aprobación o asignación, gestiona servicios, personal, medios, horarios, ofertas, reservas y finanzas." }], modulesKicker: "Módulos del portal", modulesTitle: "Módulos independientes con núcleo compartido", multilingualReady: "Preparado para datos multilingües de LSevin", features: [{ title: "Perfil del proveedor", text: "Identidad comercial, ubicación, idiomas, especialidades, contacto y presentación." }, { title: "Servicios", text: "Nombres, descripciones, precios, duración, capacidad, imágenes y estado específicos." }, { title: "Personal", text: "Médicos, especialistas, entrenadores, personal de belleza, intérpretes, guías y empleados vinculados." }, { title: "Medios", text: "Fotos y vídeos de galería usados en páginas de proveedores y servicios." }, { title: "Disponibilidad", text: "Horario, recursos reservables y reglas de disponibilidad." }, { title: "Finanzas", text: "Cartera, compensación, liquidación, retiros y cuentas de pago." }, { title: "Reservas", text: "Cola de reservas, estado de pago, notas y cambios de estado." }, { title: "Herramientas de crecimiento", text: "Ofertas, reseñas, tickets de soporte y listas para mejorar la calidad." }], ctaTitle: "¿Listo para iniciar el alta del proveedor?", ctaDescription: "Envía una nueva solicitud o abre el espacio de proveedor asignado.", startApplication: "Iniciar solicitud" },
  staffLanding: { badge: "Portal de Personal LSevin", headline: "Convierte un usuario de LSevin en propietario de su perfil profesional.", intro: "Ruta dedicada a médicos, especialistas, entrenadores, expertos en belleza, intérpretes, guías y empleados que necesitan reclamar o crear una página vinculada a un proveedor verificado.", primaryAction: "Reclamar o crear perfil", secondaryAction: "Represento una clínica/proveedor", benefits: ["Confirmación del proveedor", "Verificación LSevin", "Propiedad controlada por pago"], ownershipKicker: "Propiedad del perfil", ownershipTitle: "Flujo de verificación", ownershipRows: [["Prueba de identidad", "Enviada", "72%"], ["Confirmación del proveedor", "Pendiente", "44%"], ["Revisión LSevin", "En cola", "28%"], ["Pago/exención", "No requerido", "18%"]], quickLinks: ["Horario", "Reseñas", "Reservas"], flowKicker: "Flujo del personal", flowTitle: "Dos rutas: reclamar un perfil existente o pedir uno nuevo", flowDescription: "Nadie puede tomar una página de médico o empleado sin confirmación del proveedor y verificación de LSevin.", steps: [{ title: "Reclamar un perfil existente", text: "Para profesionales y empleados que ya aparecen en LSevin." }, { title: "Solicitar un perfil nuevo", text: "Para personal vinculado a un proveedor que aún no tiene perfil en el marketplace." }, { title: "Obtener aprobación del proveedor y LSevin", text: "El proveedor confirma la relación y LSevin verifica identidad, documentos y derechos de propiedad." }, { title: "Gestionar tu propia página", text: "Tras la aprobación y cualquier pago o exención, gestiona contenido permitido, horario, reseñas y reservas." }], controlsKicker: "Controles del personal", controlsTitle: "Qué puede gestionar el personal tras la aprobación", controlledAccess: "Acceso controlado por proveedor + LSevin", features: [{ title: "Identidad profesional", text: "Nombre, título, especialidad, biografía, estudios, credenciales, certificados, idiomas e imagen." }, { title: "Relación con proveedor", text: "El perfil sigue vinculado al proveedor para no eludir al propietario del negocio." }, { title: "Horario y tiempos", text: "El personal gestiona días, horas y servicios reservables cuando el proveedor lo permite." }, { title: "Portafolio y medios", text: "Galería, certificados y medios del perfil pueden enviarse a moderación." }, { title: "Servicios", text: "El personal puede vincularse a servicios, tarifas, especialidades y franjas de reserva." }, { title: "Reseñas y respuestas", text: "Ve las reseñas dirigidas a su perfil y responde según la política del proveedor." }, { title: "Reservas", text: "Ve reservas asignadas, notas, resúmenes de pago y tareas operativas." }, { title: "Propiedad de pago opcional", text: "Si la propiedad tiene coste, la factura se emite mediante la capacidad compartida del núcleo." }], ctaTitle: "¿Listo para reclamar o crear un perfil?", ctaDescription: "Inicia la solicitud para que se vincule al perfil y a la confirmación requerida del proveedor.", startRequest: "Iniciar solicitud de personal" },
  form: { providerTitle: "Solicitud de colaboración del proveedor", staffTitle: "Solicitud de propiedad del perfil", providerType: "Tipo de proveedor", relatedCenterType: "Tipo de proveedor relacionado", selectType: "Seleccionar tipo", legalName: "Nombre legal", centerName: "Nombre del proveedor o clínica", providerDisplayName: "Nombre público del proveedor", staffDisplayName: "Nombre público del personal", professionalTitle: "Título profesional", specialtyRole: "Especialidad o función", existingProfileReference: "Enlace o ID del perfil existente", centerContact: "Contacto del proveedor", contactPerson: "Persona de contacto", email: "Correo electrónico", phonePrefix: "Prefijo", phone: "Teléfono", website: "Sitio web", professionalPage: "Página profesional", address: "Dirección", centerAddress: "Dirección del proveedor", notes: "Notas adicionales", documentsNotes: "Documentos y notas", staffActivationNotice: "La propiedad solo se activa tras la confirmación del proveedor, la revisión de LSevin y el pago cuando corresponda.", submitProvider: "Enviar solicitud", submitStaff: "Enviar solicitud de personal", registerProvider: "Registrar proveedor", requestStaffOwnership: "Solicitar propiedad de página" },
  applications: { title: "Solicitudes de proveedor", description: "Solicitudes enviadas por tu cuenta.", newApplication: "Nueva solicitud", noApplications: "No hay solicitudes", emptyDescription: "Inicia el alta para crear un espacio de proveedor." },
  newProvider: { title: "Ser proveedor", description: "Envía la información; los administradores de LSevin pueden aprobarla y crear o vincular un espacio de proveedor." },
  newStaff: { title: "Reclamar o crear un perfil", description: "Envía la solicitud de propiedad. Se requieren la confirmación del proveedor y la aprobación de LSevin antes de habilitar la gestión." },
};

const ku: OnboardingCopy = {
  common: { dashboard: "داشبۆرد", open: "بیکەرەوە", start: "دەستپێبکە", missingProviderType: "جۆری پێشکەشکەر بوونی نییە", statuses: { draft: "ڕەشنووس", submitted: "نێردراو", in_review: "لە پێداچوونەوەدا", approved: "پەسەندکراو", rejected: "ڕەتکراو", disabled: "ناچالاک" } },
  providerLanding: { authBeforeCode: "لە ڕێگەی LSevin بچۆ ژوورەوە، یان دوای گەڕاندنەوەی بنکەدراوەی ناوخۆ نرخێکی ڕاستەقینە بۆ", authAfterCode: "دابنێ.", badge: "پۆرتاڵی پێشکەشکەرانی LSevin", headline: "بەکارهێنەری LSevin بکە بە بەڕێوەبەری متمانەپێکراوی پێشکەشکەر.", intro: "پۆرتاڵێکی ماژوڵی کە بەکارهێنەرانی LSevin دەتوانن داواکاری پێشکەشکەر بنێرن یان بەڕێوەبەر پێشکەشکەرێکی هەبوو بە بەکارهێنەر ببەستێتەوە بۆ بەڕێوەبردنی خزمەتگوزاری، ستاف، میدیا، بەردەستبوون، حجز، پێشنیار، پشتگیری، دارایی و ڕاپۆرت.", primaryAction: "ببە بە پێشکەشکەر", secondaryAction: "پۆرتاڵەکەم بکەرەوە", benefits: ["چوونەژوورەوەی هاوبەش", "بەستنەوە لەلایەن بەڕێوەبەر", "ماژوڵی یەک-فۆڵدەر"], readinessKicker: "ئامادەیی پێشکەشکەر", readinessTitle: "بەڕێوەبردنی بازاڕ", readinessRows: [["دراوەکانی پڕۆفایل", "تەواو", "92%"], ["خزمەتگوزاری و نرخ", "١٢ چالاک", "78%"], ["ستاف و بڕوانامە", "٦ بەستراو", "64%"], ["ڕێکخستنی دارایی", "ئامادەی پارەدان", "88%"]], quickLinks: ["حجزەکان", "هەڵسەنگاندن", "ڕاپۆرت"], flowKicker: "ڕەوتی گۆڕان", flowTitle: "لە بەکارهێنەری ئاسایی بۆ بەڕێوەبەری پێشکەشکەر", flowDescription: "پۆرتاڵ داواکاری خۆکار و بەستنەوەی پێشکەشکەری هەبوو بە هەژماری LSevin پشتگیری دەکات.", steps: [{ title: "چوونەژوورەوە بە LSevin", text: "هەمان ناسنامەی LSevin بەکاردێت و پێویست بە هەژماری دووەم نییە." }, { title: "ناردنی پڕۆفایلی پێشکەشکەر", text: "جۆر هەڵبژێرە، زانیاری یاسایی و پڕۆفایل بنووسە، بەڵگە باربکە و داوای پێداچوونەوە بکە." }, { title: "بەڕێوەبردنی دراوەکانی بازاڕ", text: "دوای پەسەندکردن، خزمەتگوزاری، ستاف، میدیا، خشتە، پێشنیار، حجز و دارایی بەڕێوەببە." }], modulesKicker: "ماژوڵەکانی پۆرتاڵ", modulesTitle: "ماژوڵی سەربەخۆ بە ناوەندی هاوبەش", multilingualReady: "ئامادە بۆ دراوەی چەندزمانی LSevin", features: [{ title: "پڕۆفایلی پێشکەشکەر", text: "ناسنامەی بازرگانی، شوێن، زمان، پسپۆڕی، پەیوەندی و پیشاندان." }, { title: "خزمەتگوزاری", text: "ناو، باس، نرخ، ماوە، گنجایش، وێنە و دۆخی تایبەت." }, { title: "ستاف", text: "پزیشک، پسپۆڕ، ڕاهێنەر، ستافی جوانکاری، وەرگێڕ، ڕێبەر و کارمەند." }, { title: "میدیا", text: "وێنە و ڤیدیۆی گەلەری بۆ پەڕەکانی پێشکەشکەر و خزمەتگوزاری." }, { title: "بەردەستبوون", text: "کاتژمێری کار، سەرچاوەی حجزکراو و یاساکانی بەردەستبوون." }, { title: "دارایی", text: "جزدان، قەرەبوو، یەکلایی، دەرهێنان و هەژماری پارەدان." }, { title: "حجزەکان", text: "ڕیزی حجز، دۆخی پارەدان، تێبینی و گۆڕینی دۆخ." }, { title: "ئامرازی گەشە", text: "پێشنیار، هەڵسەنگاندن، تیکێتی پشتگیری و لیستی پشکنینی کوالیتی." }], ctaTitle: "ئامادەیت داواکاری پێشکەشکەر دەستپێبکەیت؟", ctaDescription: "داواکاری نوێ بنێرە یان شوێنی کاری بەستراو بکەرەوە.", startApplication: "دەستپێکردنی داواکاری" },
  staffLanding: { badge: "پۆرتاڵی ستافی LSevin", headline: "بەکارهێنەری LSevin بکە بە خاوەنی پڕۆفایلی ستافی خۆی.", intro: "ڕێگایەکی تایبەت بۆ پزیشک، پسپۆڕ، ڕاهێنەر، شارەزای جوانکاری، وەرگێڕ، ڕێبەر و کارمەند کە پێویستیان بە داواکردن یان دروستکردنی پەڕەیەکی بەستراو بە پێشکەشکەری پشتڕاستکراو هەیە.", primaryAction: "داواکردن یان دروستکردنی پڕۆفایل", secondaryAction: "نوێنەری کلینیک/پێشکەشکەرم", benefits: ["پشتڕاستکردنەوەی پێشکەشکەر", "پشکنینی LSevin", "خاوەندارێتی کۆنترۆڵکراوی پارەدان"], ownershipKicker: "خاوەندارێتی ستاف", ownershipTitle: "ڕەوتی پشتڕاستکردنەوە", ownershipRows: [["بەڵگەی ناسنامە", "نێردراو", "72%"], ["پشتڕاستکردنەوەی پێشکەشکەر", "چاوەڕوان", "44%"], ["پێداچوونەوەی LSevin", "لە ڕیزدا", "28%"], ["پارەدان/لێبوردن", "پێویست نییە", "18%"]], quickLinks: ["خشتە", "هەڵسەنگاندن", "حجز"], flowKicker: "ڕەوتی گۆڕانی ستاف", flowTitle: "دوو ڕێگا: داواکردنی پڕۆفایلی هەبوو یان داوای پڕۆفایلی نوێ", flowDescription: "بێ پشتڕاستکردنەوەی پێشکەشکەر و LSevin ناتوانرێت کۆنترۆڵی پەڕەی پزیشک یان کارمەند وەربگیرێت.", steps: [{ title: "داواکردنی پڕۆفایلی هەبوو", text: "بۆ پیشەیی و کارمەندانی کە پێشتر لە LSevin پیشاندەدرێن." }, { title: "داوای پڕۆفایلی نوێ", text: "بۆ ستافی بەستراو بە پێشکەشکەر کە هێشتا پڕۆفایلی بازاڕی نییە." }, { title: "پەسەندی پێشکەشکەر و LSevin", text: "پێشکەشکەر پەیوەندی پشتڕاست دەکات و LSevin ناسنامە، بەڵگە و مافی خاوەندارێتی دەپشکنێت." }, { title: "بەڕێوەبردنی پەڕەی خۆت", text: "دوای پەسەندکردن و پارەدان یان لێبوردن، ناوەڕۆک، خشتە، هەڵسەنگاندن و حجز بەڕێوەببە." }], controlsKicker: "کۆنترۆڵەکانی پەڕەی ستاف", controlsTitle: "ستاف دوای پەسەندکردن چی بەڕێوەدەبات؟", controlledAccess: "دەستگەیشتنی کۆنترۆڵکراوی پێشکەشکەر + LSevin", features: [{ title: "ناسنامەی پیشەیی", text: "ناو، ناونیشان، پسپۆڕی، ژیاننامە، خوێندن، بڕوانامە، زمان و وێنە." }, { title: "پەیوەندی پێشکەشکەر", text: "پڕۆفایل بە پێشکەشکەرەوە بەستراو دەمێنێت تا خاوەنی بازرگانی پشتگوێ نەخرێت." }, { title: "خشتە و کات", text: "کاتێک پێشکەشکەر ڕێگە دەدات، ستاف ڕۆژ، کات و خزمەتگوزارییە حجزکراوەکان بەڕێوەدەبات." }, { title: "نمونەکار و میدیا", text: "گەلەری، بڕوانامە و میدیای پڕۆفایل بۆ پێداچوونەوە دەنێردرێن." }, { title: "خزمەتگوزاری", text: "ستاف بە خزمەتگوزاری، کرێ، پسپۆڕی و کاتی حجزەوە دەبەسترێتەوە." }, { title: "هەڵسەنگاندن و وەڵام", text: "هەڵسەنگاندنی پڕۆفایلی خۆی دەبینێت و بە پێی سیاسەتی پێشکەشکەر وەڵام دەدات." }, { title: "حجزەکان", text: "حجزە سپێردراوەکان، تێبینی، پوختەی پارەدان و ئەرکی کار دەبینێت." }, { title: "خاوەندارێتی پارەدراوی هەڵبژاردەیی", text: "ئەگەر خاوەندارێتی بەرامبەر پارە بێت، پسوڵە لە ڕێگەی توانای ناوەندی هاوبەش دروست دەبێت." }], ctaTitle: "ئامادەیت پڕۆفایلی ستاف داوا یان دروست بکەیت؟", ctaDescription: "داواکاری ستاف دەستپێبکە تا بە پڕۆفایل و پشتڕاستکردنەوەی پێشکەشکەر ببەسترێتەوە.", startRequest: "دەستپێکردنی داواکاری ستاف" },
  form: { providerTitle: "داواکاری هاوبەشی پێشکەشکەر", staffTitle: "داواکاری خاوەندارێتی پڕۆفایلی ستاف", providerType: "جۆری پێشکەشکەر", relatedCenterType: "جۆری پێشکەشکەری پەیوەندیدار", selectType: "جۆر هەڵبژێرە", legalName: "ناوی یاسایی", centerName: "ناوی پێشکەشکەر یان کلینیک", providerDisplayName: "ناوی پیشاندانی پێشکەشکەر", staffDisplayName: "ناوی پیشاندانی ستاف", professionalTitle: "ناونیشانی پیشەیی", specialtyRole: "پسپۆڕی یان ڕۆڵ", existingProfileReference: "بەستەر یان ناسنامەی پڕۆفایلی هەبوو", centerContact: "کەسی پەیوەندی پێشکەشکەر", contactPerson: "کەسی پەیوەندی", email: "ئیمەیڵ", phonePrefix: "کۆدی وڵات", phone: "تەلەفۆن", website: "ماڵپەڕ", professionalPage: "پەڕەی پیشەیی", address: "ناونیشان", centerAddress: "ناونیشانی پێشکەشکەر", notes: "تێبینی زیاتر", documentsNotes: "بەڵگە و تێبینی", staffActivationNotice: "خاوەندارێتی تەنها دوای پشتڕاستکردنەوەی پێشکەشکەر، پێداچوونەوەی LSevin و پارەدان چالاک دەبێت.", submitProvider: "ناردنی داواکاری", submitStaff: "ناردنی داواکاری ستاف", registerProvider: "تۆمارکردنی پێشکەشکەر", requestStaffOwnership: "داوای خاوەندارێتی پەڕەی ستاف" },
  applications: { title: "داواکارییەکانی پێشکەشکەر", description: "داواکارییە نێردراوەکان لەلایەن هەژمارەکەت.", newApplication: "داواکاری نوێ", noApplications: "هیچ داواکارییەک نییە", emptyDescription: "بۆ دروستکردنی شوێنی کاری پێشکەشکەر، تۆمارکردن دەستپێبکە." },
  newProvider: { title: "ببە بە پێشکەشکەر", description: "زانیاری پێشکەشکەر بنێرە تا بەڕێوەبەرانی LSevin پەسەندی بکەن و شوێنی کار دروست یان ببەستنەوە." },
  newStaff: { title: "داواکردن یان دروستکردنی پڕۆفایلی ستاف", description: "داواکاری خاوەندارێتی بنێرە. پێش چالاککردنی بەڕێوەبردن، پشتڕاستکردنەوەی پێشکەشکەر و LSevin پێویستە." },
};

const de: OnboardingCopy = {
  common: { dashboard: "Dashboard", open: "Öffnen", start: "Starten", missingProviderType: "Anbietertyp fehlt", statuses: { draft: "Entwurf", submitted: "Eingereicht", in_review: "In Prüfung", approved: "Genehmigt", rejected: "Abgelehnt", disabled: "Deaktiviert" } },
  providerLanding: { authBeforeCode: "Melden Sie sich über LSevin an oder konfigurieren Sie nach der Wiederherstellung der lokalen Datenbank einen echten Wert für", authAfterCode: ".", badge: "LSevin-Anbieterportal", headline: "Machen Sie aus einem LSevin-Konto einen vertrauenswürdigen Anbieter-Arbeitsbereich.", intro: "Modulares Portal, in dem registrierte LSevin-Nutzer Anbieter werden können oder Admins bestehende Anbieter zuordnen, damit Dienste, Mitarbeitende, Medien, Verfügbarkeit, Buchungen, Angebote, Support, Finanzen und Berichte verwaltet werden.", primaryAction: "Anbieter werden", secondaryAction: "Mein Portal öffnen", benefits: ["Gemeinsame LSevin-Anmeldung", "Admin-Zuordnung", "Module in einem Ordner"], readinessKicker: "Anbieterbereitschaft", readinessTitle: "Marktplatzverwaltung", readinessRows: [["Profildaten", "Vollständig", "92%"], ["Dienste und Preise", "12 aktiv", "78%"], ["Mitarbeitende und Nachweise", "6 verknüpft", "64%"], ["Finanzeinrichtung", "Auszahlung bereit", "88%"]], quickLinks: ["Buchungen", "Bewertungen", "Berichte"], flowKicker: "Umwandlungsprozess", flowTitle: "Vom normalen Nutzer zum Anbieter-Operator", flowDescription: "Das Portal unterstützt Selbstregistrierung sowie die Admin-Zuordnung eines bestehenden Anbieters zu einem LSevin-Nutzer.", steps: [{ title: "Mit LSevin anmelden", text: "Das Portal nutzt dieselbe LSevin-Identität; bestehende Nutzer brauchen kein zweites Konto." }, { title: "Anbieterprofil einreichen", text: "Typ auswählen, Rechts- und Profildaten eingeben, Dokumente hochladen und Prüfung anfordern." }, { title: "Marktplatzdaten verwalten", text: "Nach Genehmigung oder Zuordnung Dienste, Mitarbeitende, Medien, Pläne, Angebote, Buchungen und Finanzen verwalten." }], modulesKicker: "Portalmodule", modulesTitle: "Eigenständige Module mit gemeinsamem Kern", multilingualReady: "Bereit für mehrsprachige LSevin-Daten", features: [{ title: "Anbieterprofil", text: "Geschäftsidentität, Standort, Sprachen, Fachgebiete, Kontaktdaten und Darstellung." }, { title: "Dienste", text: "Anbieterspezifische Namen, Beschreibungen, Preise, Dauer, Kapazität, Bilder und Status." }, { title: "Mitarbeitende", text: "Ärzte, Fachkräfte, Trainer, Beauty-Personal, Dolmetscher, Guides und Angestellte." }, { title: "Medien", text: "Galeriefotos und -videos für Anbieter- und Diensteseiten." }, { title: "Verfügbarkeit", text: "Öffnungszeiten, buchbare Ressourcen und Verfügbarkeitsregeln." }, { title: "Finanzen", text: "Wallet, Vergütung, Abrechnung, Auszahlungen und Auszahlungskonten." }, { title: "Buchungen", text: "Buchungswarteschlange, Zahlungsstatus, Anbieternotizen und Statusänderungen." }, { title: "Wachstumswerkzeuge", text: "Angebote, Bewertungen, Supporttickets und Qualitätschecklisten." }], ctaTitle: "Bereit für das Anbieter-Onboarding?", ctaDescription: "Neue Bewerbung senden oder den zugeordneten Anbieter-Arbeitsbereich öffnen.", startApplication: "Bewerbung starten" },
  staffLanding: { badge: "LSevin-Mitarbeiterportal", headline: "Machen Sie einen LSevin-Nutzer zum Eigentümer seines Mitarbeiterprofils.", intro: "Eigener Weg für Ärzte, Fachkräfte, Trainer, Beauty-Experten, Dolmetscher, Guides und Mitarbeitende, die eine mit einem verifizierten Anbieter verbundene Seite beanspruchen oder erstellen müssen.", primaryAction: "Mitarbeiterprofil beanspruchen oder erstellen", secondaryAction: "Ich vertrete eine Klinik/einen Anbieter", benefits: ["Anbieterbestätigung", "LSevin-Prüfung", "Zahlungsabhängige Inhaberschaft"], ownershipKicker: "Profilinhaberschaft", ownershipTitle: "Prüfprozess", ownershipRows: [["Identitätsnachweis", "Eingereicht", "72%"], ["Anbieterbestätigung", "Ausstehend", "44%"], ["LSevin-Prüfung", "In Warteschlange", "28%"], ["Zahlung/Befreiung", "Nicht erforderlich", "18%"]], quickLinks: ["Zeitplan", "Bewertungen", "Buchungen"], flowKicker: "Mitarbeiterprozess", flowTitle: "Zwei Wege: vorhandenes Profil beanspruchen oder neues beantragen", flowDescription: "Eine Arzt- oder Mitarbeiterseite kann nicht ohne Anbieterbestätigung und LSevin-Prüfung übernommen werden.", steps: [{ title: "Vorhandenes Profil beanspruchen", text: "Für Fachkräfte und Mitarbeitende, die bereits auf LSevin erscheinen." }, { title: "Neues Profil beantragen", text: "Für Mitarbeitende eines Anbieters ohne vorhandenes Marktplatzprofil." }, { title: "Anbieter- und LSevin-Genehmigung", text: "Der Anbieter bestätigt die Beziehung; LSevin prüft Identität, Dokumente und Inhaberrechte." }, { title: "Eigene Seite verwalten", text: "Nach Genehmigung und erforderlicher Zahlung oder Befreiung Inhalte, Zeitplan, Bewertungen und Buchungen verwalten." }], controlsKicker: "Mitarbeiterkontrollen", controlsTitle: "Was Mitarbeitende nach der Genehmigung verwalten", controlledAccess: "Durch Anbieter + LSevin kontrollierter Zugriff", features: [{ title: "Berufliche Identität", text: "Name, Titel, Fachgebiet, Biografie, Ausbildung, Nachweise, Zertifikate, Sprachen und Bild." }, { title: "Anbieterbeziehung", text: "Das Profil bleibt mit dem Anbieter verbunden, damit der Geschäftsinhaber nicht umgangen wird." }, { title: "Zeitplan und Zeiten", text: "Mitarbeitende verwalten verfügbare Tage, Zeiten und buchbare Dienste, wenn der Anbieter es erlaubt." }, { title: "Portfolio und Medien", text: "Galerie, Zertifikate und Profilmedien können zur Moderation eingereicht werden." }, { title: "Dienste", text: "Mitarbeitende können Diensten, Gebühren, Fachgebieten und aktiven Buchungszeiten zugeordnet werden." }, { title: "Bewertungen und Antworten", text: "Mitarbeitende sehen Bewertungen ihres Profils und antworten gemäß Anbieterrichtlinie." }, { title: "Buchungen", text: "Zugewiesene Buchungen, Notizen, Zahlungsübersichten und operative Aufgaben." }, { title: "Optionale bezahlte Inhaberschaft", text: "Bei kostenpflichtiger Inhaberschaft wird die Rechnung über die gemeinsame Core-Fähigkeit erstellt." }], ctaTitle: "Bereit, ein Mitarbeiterprofil zu beanspruchen oder zu erstellen?", ctaDescription: "Starten Sie den Antrag, damit er mit dem Profil und der nötigen Anbieterbestätigung verbunden wird.", startRequest: "Mitarbeiterantrag starten" },
  form: { providerTitle: "Anbieter-Partnerschaftsantrag", staffTitle: "Antrag auf Mitarbeiterprofil-Inhaberschaft", providerType: "Anbietertyp", relatedCenterType: "Zugehöriger Anbietertyp", selectType: "Typ auswählen", legalName: "Rechtlicher Name", centerName: "Name des Anbieters oder der Klinik", providerDisplayName: "Anzeigename des Anbieters", staffDisplayName: "Anzeigename der Person", professionalTitle: "Berufsbezeichnung", specialtyRole: "Fachgebiet oder Rolle", existingProfileReference: "Link oder ID des vorhandenen Profils", centerContact: "Anbieter-Ansprechperson", contactPerson: "Ansprechperson", email: "E-Mail", phonePrefix: "Ländervorwahl", phone: "Telefon", website: "Website", professionalPage: "Berufsseite", address: "Adresse", centerAddress: "Anbieteradresse", notes: "Zusätzliche Hinweise", documentsNotes: "Dokumente und Hinweise", staffActivationNotice: "Die Inhaberschaft wird erst nach Anbieterbestätigung, LSevin-Prüfung und gegebenenfalls Zahlung aktiviert.", submitProvider: "Antrag senden", submitStaff: "Mitarbeiterantrag senden", registerProvider: "Anbieter registrieren", requestStaffOwnership: "Inhaberschaft einer Mitarbeiterseite beantragen" },
  applications: { title: "Anbieteranträge", description: "Von Ihrem Konto eingereichte Anträge.", newApplication: "Neuer Antrag", noApplications: "Keine Anträge", emptyDescription: "Starten Sie das Onboarding, um einen Anbieter-Arbeitsbereich zu erstellen." },
  newProvider: { title: "Anbieter werden", description: "Senden Sie Anbieterinformationen. LSevin-Admins können sie genehmigen und einen neuen Arbeitsbereich erstellen oder einen bestehenden zuordnen." },
  newStaff: { title: "Mitarbeiterprofil beanspruchen oder erstellen", description: "Senden Sie den Inhaberschaftsantrag. Anbieterbestätigung und LSevin-Genehmigung sind vor der Verwaltung erforderlich." },
};

const fr: OnboardingCopy = {
  common: { dashboard: "Tableau de bord", open: "Ouvrir", start: "Commencer", missingProviderType: "Type de prestataire manquant", statuses: { draft: "Brouillon", submitted: "Envoyée", in_review: "En cours d’examen", approved: "Approuvée", rejected: "Rejetée", disabled: "Désactivée" } },
  providerLanding: { authBeforeCode: "Connectez-vous via LSevin ou configurez une valeur réelle pour", authAfterCode: "après la restauration de la base locale.", badge: "Portail des prestataires LSevin", headline: "Transformez un compte LSevin en espace de travail fiable pour prestataire.", intro: "Portail modulaire où les utilisateurs LSevin peuvent devenir prestataires, ou où les administrateurs peuvent leur associer un prestataire existant afin de gérer services, personnel, médias, disponibilités, réservations, offres, assistance, finances et rapports.", primaryAction: "Devenir prestataire", secondaryAction: "Ouvrir mon portail", benefits: ["Connexion LSevin partagée", "Association par un admin", "Modules dans un seul dossier"], readinessKicker: "Préparation du prestataire", readinessTitle: "Gestion de la marketplace", readinessRows: [["Données du profil", "Complètes", "92%"], ["Services et tarifs", "12 actifs", "78%"], ["Personnel et justificatifs", "6 associés", "64%"], ["Configuration financière", "Versement prêt", "88%"]], quickLinks: ["Réservations", "Avis", "Rapports"], flowKicker: "Parcours de conversion", flowTitle: "D’un utilisateur normal à un opérateur prestataire", flowDescription: "Le portail prend en charge l’inscription autonome et l’association administrative d’un prestataire existant à un compte LSevin.", steps: [{ title: "Connexion avec LSevin", text: "Le portail utilise la même identité LSevin ; aucun second compte n’est nécessaire." }, { title: "Soumettre le profil prestataire", text: "Choisissez le type, saisissez les données légales et de profil, ajoutez les documents et demandez l’examen." }, { title: "Gérer les données de la marketplace", text: "Après approbation ou association, gérez services, personnel, médias, horaires, offres, réservations et finances." }], modulesKicker: "Modules du portail", modulesTitle: "Modules autonomes avec noyau partagé", multilingualReady: "Prêt pour les données LSevin multilingues", features: [{ title: "Profil prestataire", text: "Identité commerciale, emplacement, langues, spécialités, coordonnées et présentation." }, { title: "Services", text: "Noms, descriptions, prix, durée, capacité, images et statut propres au prestataire." }, { title: "Personnel", text: "Médecins, spécialistes, coachs, personnel beauté, interprètes, guides et employés associés." }, { title: "Médias", text: "Photos et vidéos utilisées dans les pages prestataire et service." }, { title: "Disponibilités", text: "Horaires, ressources réservables et règles de disponibilité." }, { title: "Finances", text: "Portefeuille, rémunération, règlement, retraits et comptes de versement." }, { title: "Réservations", text: "File des réservations, paiement, notes et changements de statut." }, { title: "Outils de croissance", text: "Offres, avis, tickets d’assistance et listes d’amélioration de la qualité." }], ctaTitle: "Prêt à commencer l’inscription prestataire ?", ctaDescription: "Envoyez une nouvelle demande ou ouvrez l’espace prestataire qui vous est associé.", startApplication: "Commencer la demande" },
  staffLanding: { badge: "Portail du personnel LSevin", headline: "Transformez un compte LSevin en propriétaire de son profil professionnel.", intro: "Parcours dédié aux médecins, spécialistes, coachs, experts beauté, interprètes, guides et employés qui doivent revendiquer ou créer une page liée à un prestataire vérifié.", primaryAction: "Revendiquer ou créer un profil", secondaryAction: "Je représente une clinique/un prestataire", benefits: ["Confirmation du prestataire", "Vérification LSevin", "Propriété liée au paiement"], ownershipKicker: "Propriété du profil", ownershipTitle: "Parcours de vérification", ownershipRows: [["Preuve d’identité", "Envoyée", "72%"], ["Confirmation du prestataire", "En attente", "44%"], ["Examen LSevin", "En file", "28%"], ["Paiement/exemption", "Non requis", "18%"]], quickLinks: ["Planning", "Avis", "Réservations"], flowKicker: "Parcours du personnel", flowTitle: "Deux voies : revendiquer un profil existant ou en demander un nouveau", flowDescription: "Une page de médecin ou d’employé ne peut pas être reprise sans confirmation du prestataire et vérification LSevin.", steps: [{ title: "Revendiquer un profil existant", text: "Pour les professionnels et employés déjà présents sur LSevin." }, { title: "Demander un nouveau profil", text: "Pour un membre du personnel associé à un prestataire mais sans profil marketplace." }, { title: "Obtenir l’accord du prestataire et de LSevin", text: "Le prestataire confirme la relation, puis LSevin vérifie l’identité, les documents et les droits." }, { title: "Gérer sa propre page", text: "Après approbation et paiement ou exemption requis, gérez contenu autorisé, planning, avis et réservations." }], controlsKicker: "Contrôles du personnel", controlsTitle: "Ce que le personnel peut gérer après approbation", controlledAccess: "Accès contrôlé par le prestataire + LSevin", features: [{ title: "Identité professionnelle", text: "Nom, titre, spécialité, biographie, formation, justificatifs, certificats, langues et image." }, { title: "Relation avec le prestataire", text: "Le profil reste lié au prestataire afin de ne pas contourner le propriétaire de l’activité." }, { title: "Planning et horaires", text: "Le personnel gère jours, horaires et services réservables lorsque le prestataire l’autorise." }, { title: "Portfolio et médias", text: "Galerie, certificats et médias du profil peuvent être soumis à modération." }, { title: "Services", text: "Le personnel peut être associé aux services, tarifs, spécialités et créneaux actifs." }, { title: "Avis et réponses", text: "Il voit les avis ciblant son profil et répond selon la politique du prestataire." }, { title: "Réservations", text: "Il voit les réservations assignées, notes, résumés de paiement et tâches opérationnelles." }, { title: "Propriété payante optionnelle", text: "Si la propriété est payante, la facture est créée via la capacité Core partagée." }], ctaTitle: "Prêt à revendiquer ou créer un profil ?", ctaDescription: "Commencez la demande afin qu’elle soit reliée au profil et à la confirmation requise du prestataire.", startRequest: "Commencer la demande du personnel" },
  form: { providerTitle: "Demande de partenariat prestataire", staffTitle: "Demande de propriété du profil personnel", providerType: "Type de prestataire", relatedCenterType: "Type de prestataire associé", selectType: "Choisir le type", legalName: "Nom légal", centerName: "Nom du prestataire ou de la clinique", providerDisplayName: "Nom public du prestataire", staffDisplayName: "Nom public du personnel", professionalTitle: "Titre professionnel", specialtyRole: "Spécialité ou rôle", existingProfileReference: "Lien ou identifiant du profil existant", centerContact: "Contact du prestataire", contactPerson: "Personne de contact", email: "E-mail", phonePrefix: "Indicatif", phone: "Téléphone", website: "Site web", professionalPage: "Page professionnelle", address: "Adresse", centerAddress: "Adresse du prestataire", notes: "Notes complémentaires", documentsNotes: "Documents et notes", staffActivationNotice: "La propriété n’est activée qu’après confirmation du prestataire, examen LSevin et paiement si nécessaire.", submitProvider: "Envoyer la demande", submitStaff: "Envoyer la demande du personnel", registerProvider: "Inscrire un prestataire", requestStaffOwnership: "Demander la propriété d’une page" },
  applications: { title: "Demandes prestataire", description: "Demandes envoyées par votre compte.", newApplication: "Nouvelle demande", noApplications: "Aucune demande", emptyDescription: "Commencez l’inscription pour créer un espace prestataire." },
  newProvider: { title: "Devenir prestataire", description: "Envoyez les informations ; les administrateurs LSevin peuvent les approuver et créer ou associer un espace prestataire." },
  newStaff: { title: "Revendiquer ou créer un profil", description: "Envoyez la demande de propriété. La confirmation du prestataire et l’approbation LSevin sont requises avant la gestion." },
};

const dictionary: Record<PortalLocale, OnboardingCopy> = { fa, en, ar, tr, es, ku, de, fr };

export function onboardingCopy(locale: PortalLocale) {
  return dictionary[locale] ?? en;
}
