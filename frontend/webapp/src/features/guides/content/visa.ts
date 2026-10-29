import type { Guide } from "../types";

export const guide: Guide = {
  slug: "visa",
  reviewedAt: "2026-10-26",
  howTo: true,
  related: ["", "medical-hotels", "mashhad", "rhinoplasty"],
  copy: {
    fa: {
      title: "ویزای درمان ایران؛ مراحل، مدارک و مدت اعتبار | السوین",
      description:
        "ویزای درمان ایران قدم به قدم: پذیرش در مرکز دارای مجوز IPD، ثبت در evisa.mfa.ir، مدارک لازم، بیمه، اعتبار ویزا، همراه بیمار و کشورهای معاف از روادید.",
      h1: "ویزای درمان ایران: راهنمای قدم‌به‌قدم برای بیماران خارجی",
      navLabel: "ویزای درمان",
      intro:
        "ویزای درمان ایران روادیدی است که به اتباع خارجی پس از پذیرش در یک مرکز درمانی معتبر و تأیید وزارت امور خارجه داده می‌شود. درخواست آن از سامانهٔ رسمی evisa.mfa.ir ثبت می‌شود و معمولاً از طریق شرکت‌های گردشگری سلامت دارای مجوز پیش می‌رود. این راهنما مراحل، مدارک و نکته‌های اعتبار ویزا را بر اساس صفحه‌های رسمی وزارت امور خارجه توضیح می‌دهد. اگر بیمار هستید که از داخل ایران اقدام می‌کنید یا برای خانوادهٔ مقیم خارج برنامه می‌ریزید، همین مراحل را برای آن‌ها دنبال کنید.",
      sections: [
        {
          id: "who-needs",
          heading: "چه کسانی به ویزای درمان نیاز دارند؟",
          paragraphs: [
            "طبق سامانهٔ ویزای وزارت امور خارجه، شهروندان آذربایجان، ترکیه، سوریه، گرجستان، ارمنستان، مصر، چین، عراق، عمان و قزاقستان مشمول قواعد لغو روادید هستند. اتباع لبنان، ونزوئلا و مالزی نیز می‌توانند مجوز ورود را در مبادی تعیین‌شده دریافت کنند.",
            "دارندگان گذرنامهٔ عادی ۲۷ کشور، از جمله امارات، بحرین، عربستان، قطر و کویت، می‌توانند برای «گردشگری» تا ۱۵ روز و هر شش ماه یک بار بدون ویزا بمانند و این مدت قابل تمدید نیست. چون درمان گردشگری نیست و نقاهت ممکن است طولانی‌تر شود، این بیماران پیش از سفر نوع ویزای مناسب را از سفارت یا کنسولگری بپرسند.",
            "بقیهٔ اتباع خارجی، از جمله اتباع افغانستان و پاکستان، برای درمان باید ویزا بگیرند.",
          ],
        },
        {
          id: "steps",
          heading: "مراحل گرفتن ویزای درمان ایران",
          paragraphs: [
            "ترتیب زیر بر اساس صفحه‌های رسمی کنسولگری‌های ایران و سامانهٔ evisa.mfa.ir است. جزئیات ممکن است بسته به ملیت و محل درخواست فرق کند.",
          ],
          steps: [
            "مدارک پزشکی را برای مشاوره بفرستید تا پزشک یا مرکز درمانی امکان درمان و مدت تقریبی اقامت را مشخص کند.",
            "مرکز درمانی دارای مجوز IPD شما را می‌پذیرد و شرکت گردشگری سلامت دارای مجوز درخواست را دنبال می‌کند.",
            "فرم درخواست ویزا را در سامانهٔ evisa.mfa.ir تکمیل کنید. گذرنامه باید دست‌کم شش ماه اعتبار داشته باشد و نشانی ایمیل در طول فرایند تأیید می‌شود.",
            "منتظر تأیید وزارت امور خارجه بمانید. وضعیت درخواست را با شمارهٔ پیگیری یا شمارهٔ گذرنامه در همان سامانه بررسی کنید.",
            "پس از تأیید، اصل گذرنامه، فرم درخواست، رسید پرداخت هزینهٔ ویزا و در صورت لزوم رضایت‌نامهٔ ولی (برای زیر ۱۸ سال) را به سفارت یا کنسولگری تعیین‌شده تحویل دهید. ممکن است برای مصاحبه دعوت شوید.",
            "ویزا را دریافت کنید و تاریخ اعتبار درج‌شده روی برچسب ویزا را بررسی کنید. اگر در مدت اعتبار وارد ایران نشوید، باید دوباره درخواست بدهید.",
            "اگر در ایران به اقامت بیشتر نیاز داشتید، برای تمدید به ادارهٔ کل امور اتباع و مهاجرین خارجی پلیس مراجعه کنید.",
          ],
        },
        {
          id: "documents",
          heading: "چک‌لیست مدارک",
          table: {
            caption: "مدارک رایج ویزای درمان طبق صفحه‌های کنسولی وزارت امور خارجه",
            columns: ["مدرک", "توضیح"],
            rows: [
              ["اصل گذرنامه", "دست‌کم شش ماه اعتبار"],
              ["فرم درخواست از سامانهٔ E-Visa", "همراه با شمارهٔ مرجع تأیید وزارت امور خارجه"],
              ["پذیرش مرکز درمانی معتبر", "از مرکز دارای مجوز IPD، از طریق شرکت گردشگری سلامت مجاز"],
              ["رسید پرداخت هزینهٔ ویزا", "مبلغ بر اساس ملیت و نمایندگی تعیین می‌شود"],
              ["رضایت‌نامهٔ ولی برای زیر ۱۸ سال", "تأییدشده در دفتر اسناد رسمی، مگر ولی حضوراً مراجعه کند"],
              ["کارت اقامت کشور محل درخواست", "برای کسانی که در کشوری غیر از کشور تابعیت خود درخواست می‌دهند"],
              ["بیمهٔ حوادث و درمان مسافرتی", "برخی نمایندگی‌ها، مانند سفارت ایران در برن، آن را الزامی می‌دانند"],
            ],
          },
        },
        {
          id: "processing-validity",
          heading: "مدت بررسی و اعتبار ویزا",
          paragraphs: [
            "وزارت امور خارجه زمان ثابتی برای ویزای درمان منتشر نکرده است. زمان کل به سرعت پذیرش مرکز درمانی، تأیید وزارت امور خارجه و نوبت سفارت بستگی دارد. برای مقایسه، سفارت ایران در برن مدت رسیدگی به ویزای گردشگری را دو هفته پس از تحویل کامل مدارک اعلام کرده است.",
            "سفارت ایران در برن اعلام کرده که از ۱۱ اردیبهشت ۱۴۰۴ (۱ مه ۲۰۲۵) اعتبار ویزاهای گردشگری و فرودگاهی از ۹۰ به ۴۵ روز کاهش یافته است. برای ویزای درمان، مدت اعتبار و مدت اقامت روی برچسب ویزا درج می‌شود و ملاک همان است.",
          ],
        },
        {
          id: "insurance",
          heading: "بیمهٔ مسافرتی",
          paragraphs: [
            "برخی نمایندگی‌های ایران، مثل سفارت ایران در برن، کپی بیمهٔ حوادث و درمان معتبر برای مدت اقامت را جزو مدارک ویزا می‌خواهند. این بیمه معمولاً هزینهٔ درمان انتخابی را پوشش نمی‌دهد. همچنین بعضی دولت‌ها هشدار داده‌اند که سفر برخلاف توصیهٔ رسمی ممکن است بیمه را باطل کند، پس شرایط بیمه‌نامه را پیش از سفر بخوانید.",
          ],
        },
        {
          id: "companions",
          heading: "ویزای همراه بیمار",
          paragraphs: [
            "همراه بیمار اگر مشمول لغو روادید نباشد، ویزای جداگانه نیاز دارد. نوع ویزای همراه و مدارک آن را شرکت تسهیل‌گر و نمایندگی محل درخواست تعیین می‌کنند. بهتر است درخواست بیمار و همراه هم‌زمان ثبت شود تا تاریخ‌ها با هم هماهنگ باشد.",
          ],
        },
        {
          id: "lsevin-role",
          heading: "السوین در این مسیر چه کاری می‌کند؟",
          paragraphs: [
            "السوین ویزا یا دعوت‌نامه صادر نمی‌کند. کار ما بررسی اولیهٔ پرونده، معرفی مراکز دارای مجوز IPD، هماهنگی با شرکت گردشگری سلامت مجاز برای دعوت‌نامه و رزرو هتل و ترانسفر است تا تاریخ ویزا، نوبت درمان و اقامت با هم جور باشد.",
          ],
        },
      ],
      faq: [
        {
          question: "گرفتن ویزای درمان ایران چقدر طول می‌کشد؟",
          answer:
            "زمان رسمی ثابتی منتشر نشده است و به پذیرش مرکز درمانی، تأیید وزارت امور خارجه و نوبت سفارت بستگی دارد. سفارت ایران در برن برای ویزای گردشگری دو هفته پس از تحویل کامل مدارک را اعلام کرده است.",
        },
        {
          question: "اتباع عراق برای درمان در ایران ویزا لازم دارند؟",
          answer:
            "طبق سامانهٔ ویزای وزارت امور خارجه، شهروندان عراق مشمول لغو روادید هستند. مدت اقامت مجاز را مرز تعیین می‌کند و برای اقامت طولانی‌تر باید تمدید گرفت.",
        },
        {
          question: "اتباع افغانستان چطور؟",
          answer:
            "افغانستان در فهرست کشورهای معاف از روادید نیست، بنابراین بیماران افغانستانی باید ویزای مناسب، معمولاً ویزای درمان، بگیرند.",
        },
        {
          question: "آیا همراه بیمار هم ویزا می‌گیرد؟",
          answer:
            "بله، اگر مشمول لغو روادید نباشد. درخواست همراه بهتر است هم‌زمان با درخواست بیمار ثبت شود.",
        },
        {
          question: "آیا السوین دعوت‌نامهٔ IPD صادر می‌کند؟",
          answer:
            "نه. دعوت‌نامه را مرکز درمانی دارای مجوز و شرکت گردشگری سلامت مجاز صادر می‌کنند. السوین هماهنگی میان شما، مرکز و تسهیل‌گر را انجام می‌دهد.",
        },
        {
          question: "اگر درمانم طول بکشد، ویزا قابل تمدید است؟",
          answer:
            "به گفتهٔ کنسولگری‌های ایران، برای تمدید اقامت باید در ایران به ادارهٔ کل امور اتباع و مهاجرین خارجی پلیس مراجعه کرد. گواهی پزشک معالج دربارهٔ ادامهٔ درمان را همراه داشته باشید.",
        },
      ],
      sources: [
        { label: "کنسولگری ایران در حیدرآباد: ویزای درمان", url: "https://hyderabad.mfa.gov.ir/en/GeneralCategoryServices/15436" },
        { label: "کنسولگری ایران در بمبئی: ویزای درمان", url: "https://mumbai.mfa.gov.ir/en/GeneralCategoryServices/15391" },
        { label: "سامانهٔ ویزای الکترونیک وزارت امور خارجه", url: "https://evisa.mfa.ir/en/" },
        { label: "سفارت ایران در برن: بخش ویزا (کاهش اعتبار به ۴۵ روز و مدارک)", url: "https://bern.mfa.gov.ir/en/viewpage/9664" },
        { label: "سفارت ایران در نایروبی: اطلاعیهٔ وزارت بهداشت دربارهٔ مراکز IPD", url: "https://kenya.mfa.gov.ir/en/NewsView/793222" },
        { label: "GOV.UK: هشدار سفر به ایران و بیمهٔ مسافرتی", url: "https://www.gov.uk/foreign-travel-advice/iran" },
      ],
      cta: {
        heading: "پیش از درخواست ویزا، پرونده‌تان را بررسی کنیم",
        body: "در مشاورهٔ رایگان السوین مرکز درمانی مناسب، مدت تقریبی اقامت و مدارک لازم برای ویزا را مشخص می‌کنیم.",
        button: "مشاورهٔ رایگان",
      },
    },
    ar: {
      title: "تأشيرة العلاج في ايران: الخطوات والوثائق والمدة | لسوين",
      description:
        "تأشيرة العلاج في ايران خطوة بخطوة: القبول في مركز مرخص IPD، التقديم عبر evisa.mfa.ir، الوثائق، التأمين، صلاحية التأشيرة، المرافق والدول المعفاة.",
      h1: "تأشيرة العلاج في ايران: دليل خطوة بخطوة للمرضى",
      navLabel: "تأشيرة العلاج",
      intro:
        "تأشيرة العلاج في ايران تُمنح للأجنبي بعد قبوله في مركز طبي معتمد وموافقة وزارة الخارجية الإيرانية. يُقدَّم الطلب عبر المنصة الرسمية evisa.mfa.ir، وغالباً بمساعدة شركة سياحة علاجية مرخصة. يشرح هذا الدليل الخطوات والوثائق ومدة الصلاحية استناداً إلى صفحات وزارة الخارجية الإيرانية الرسمية، مع تنبيه خاص للمرضى من العراق ودول الخليج.",
      sections: [
        {
          id: "who-needs",
          heading: "من يحتاج إلى تأشيرة العلاج؟",
          paragraphs: [
            "بحسب منصة التأشيرات التابعة للخارجية الإيرانية، يخضع مواطنو أذربيجان وتركيا وسوريا وجورجيا وأرمينيا ومصر والصين والعراق وعُمان وكازاخستان لقواعد الإعفاء من التأشيرة. ويمكن لمواطني لبنان وفنزويلا وماليزيا الحصول على إذن الدخول في المنافذ المحددة.",
            "أما حاملو الجوازات العادية من 27 دولة، منها الإمارات والبحرين والسعودية وقطر والكويت، فيمكنهم البقاء لأغراض «السياحة» مدة 15 يوماً غير قابلة للتمديد مرة كل ستة أشهر. ولأن العلاج ليس سياحة وقد تطول فترة النقاهة، ننصح هؤلاء المرضى بسؤال السفارة أو القنصلية عن نوع التأشيرة المناسب قبل السفر.",
            "بقية الجنسيات، ومنها الأفغانية والباكستانية، تحتاج إلى تأشيرة للعلاج.",
          ],
        },
        {
          id: "steps",
          heading: "خطوات الحصول على تأشيرة العلاج في ايران",
          paragraphs: [
            "الترتيب التالي مأخوذ من صفحات القنصليات الإيرانية ومنصة evisa.mfa.ir، وقد تختلف التفاصيل حسب الجنسية ومكان التقديم.",
          ],
          steps: [
            "أرسل تقاريرك الطبية للاستشارة ليحدد الطبيب أو المركز إمكانية العلاج ومدة الإقامة التقريبية.",
            "يقبلك مركز طبي حاصل على ترخيص IPD، وتتابع شركة سياحة علاجية مرخصة طلبك.",
            "املأ استمارة التأشيرة على منصة evisa.mfa.ir. يجب أن يكون الجواز صالحاً ستة أشهر على الأقل، ويُطلب بريد إلكتروني يتم التحقق منه.",
            "انتظر موافقة وزارة الخارجية الإيرانية، وتابع حالة الطلب برقم المرجع أو رقم الجواز على المنصة نفسها.",
            "بعد الموافقة قدّم أصل الجواز واستمارة الطلب وإيصال دفع رسوم التأشيرة، وموافقة ولي الأمر لمن هم دون 18 عاماً، إلى السفارة أو القنصلية المحددة. قد تُستدعى لمقابلة.",
            "استلم التأشيرة وتحقق من تاريخ الصلاحية المطبوع على الملصق. إذا لم تدخل ايران خلال الصلاحية فعليك التقديم من جديد.",
            "إذا احتجت إلى إقامة أطول داخل ايران، راجع الإدارة العامة لشؤون الرعايا والمهاجرين الأجانب في الشرطة لتمديدها.",
          ],
        },
        {
          id: "documents",
          heading: "قائمة الوثائق",
          table: {
            caption: "الوثائق المعتادة لتأشيرة العلاج وفق صفحات القنصليات الإيرانية",
            columns: ["الوثيقة", "ملاحظات"],
            rows: [
              ["أصل جواز السفر", "صالح ستة أشهر على الأقل"],
              ["استمارة الطلب من منصة E-Visa", "مع رقم المرجع الصادر بموافقة وزارة الخارجية"],
              ["قبول من مركز طبي معتمد", "من مركز مرخص IPD عبر شركة سياحة علاجية مرخصة"],
              ["إيصال دفع رسوم التأشيرة", "تختلف الرسوم حسب الجنسية ومكان التقديم"],
              ["موافقة ولي الأمر لمن هم دون 18 عاماً", "موثقة لدى كاتب العدل، إلا إذا حضر ولي الأمر شخصياً"],
              ["إقامة بلد التقديم", "لمن يقدّم في بلد غير بلد جنسيته"],
              ["تأمين الحوادث والصحة للسفر", "تشترطه بعض البعثات مثل سفارة ايران في برن"],
            ],
          },
        },
        {
          id: "processing-validity",
          heading: "مدة المعالجة وصلاحية التأشيرة",
          paragraphs: [
            "لم تنشر وزارة الخارجية مدة ثابتة لتأشيرة العلاج، فالمدة الكلية تعتمد على سرعة قبول المركز الطبي وموافقة الوزارة ومواعيد السفارة. وللمقارنة، تذكر سفارة ايران في برن أن معالجة التأشيرة السياحية تستغرق أسبوعين بعد تقديم الوثائق كاملة.",
            "وأعلنت سفارة ايران في برن أنه اعتباراً من 1 مايو 2025 خُفّضت صلاحية التأشيرات السياحية وتأشيرات الوصول من 90 إلى 45 يوماً. أما تأشيرة العلاج فتُطبع صلاحيتها ومدة الإقامة على ملصق التأشيرة، وهي المرجع.",
          ],
        },
        {
          id: "insurance",
          heading: "تأمين السفر",
          paragraphs: [
            "تطلب بعض البعثات الإيرانية، مثل السفارة في برن، نسخة من تأمين حوادث وصحة ساري المفعول طوال الإقامة. هذا التأمين لا يغطي عادة تكاليف العلاج المخطط له. كما تحذر بعض الحكومات من أن السفر خلافاً لنصائحها الرسمية قد يُبطل التأمين، فاقرأ شروط وثيقتك قبل السفر.",
          ],
        },
        {
          id: "companions",
          heading: "تأشيرة المرافق",
          paragraphs: [
            "يحتاج المرافق إلى تأشيرة مستقلة إذا لم يكن من الدول المعفاة. تحدد شركة السياحة العلاجية والبعثة الإيرانية نوع تأشيرته ووثائقها. من الأفضل تقديم طلب المريض والمرافق معاً حتى تتطابق التواريخ.",
          ],
        },
        {
          id: "lsevin-role",
          heading: "ما دور لسوين؟",
          paragraphs: [
            "لا تصدر لسوين التأشيرات أو الدعوات. نحن نراجع ملفك مبدئياً، ونعرّفك على مراكز مرخصة IPD، وننسق مع شركة سياحة علاجية مرخصة لإصدار الدعوة، ونحجز الفندق والنقل حتى تتوافق مواعيد التأشيرة والعلاج والإقامة.",
          ],
        },
      ],
      faq: [
        {
          question: "كم يستغرق الحصول على تأشيرة العلاج في ايران؟",
          answer:
            "لا توجد مدة رسمية ثابتة؛ فهي تعتمد على قبول المركز الطبي وموافقة الخارجية ومواعيد السفارة. تذكر سفارة ايران في برن أسبوعين للتأشيرة السياحية بعد اكتمال الوثائق.",
        },
        {
          question: "هل يحتاج العراقيون إلى تأشيرة للعلاج في ايران؟",
          answer:
            "وفق منصة الخارجية الإيرانية، مواطنو العراق مشمولون بالإعفاء من التأشيرة. تُحدَّد مدة الإقامة عند الحدود، ويجب تمديدها إذا طال العلاج.",
        },
        {
          question: "هل يكفي الإعفاء لمدة 15 يوماً لمواطني الخليج؟",
          answer:
            "هذا الإعفاء مخصص للسياحة وغير قابل للتمديد. إذا كان العلاج أو النقاهة قد يتجاوز 15 يوماً، اسأل السفارة عن تأشيرة العلاج قبل السفر.",
        },
        {
          question: "هل يحصل المرافق على تأشيرة؟",
          answer:
            "نعم إذا لم يكن من الدول المعفاة، ويُفضَّل تقديم طلبه مع طلب المريض.",
        },
        {
          question: "هل تصدر لسوين دعوة IPD؟",
          answer:
            "لا. الدعوة يصدرها المركز الطبي المرخص وشركة السياحة العلاجية المرخصة، ولسوين تنسق بينك وبينهما.",
        },
        {
          question: "هل يمكن تمديد التأشيرة إذا طال العلاج؟",
          answer:
            "بحسب القنصليات الإيرانية، يُطلب التمديد داخل ايران من الإدارة العامة لشؤون الرعايا والمهاجرين الأجانب في الشرطة. احمل تقريراً من الطبيب المعالج يوضح استمرار العلاج.",
        },
      ],
      sources: [
        { label: "القنصلية الإيرانية في حيدر آباد: تأشيرة العلاج", url: "https://hyderabad.mfa.gov.ir/en/GeneralCategoryServices/15436" },
        { label: "القنصلية الإيرانية في مومباي: تأشيرة العلاج", url: "https://mumbai.mfa.gov.ir/en/GeneralCategoryServices/15391" },
        { label: "منصة التأشيرة الإلكترونية لوزارة الخارجية الإيرانية", url: "https://evisa.mfa.ir/en/" },
        { label: "سفارة ايران في برن: قسم التأشيرات (تخفيض الصلاحية إلى 45 يوماً والوثائق)", url: "https://bern.mfa.gov.ir/en/viewpage/9664" },
        { label: "سفارة ايران في نيروبي: إعلان وزارة الصحة حول مراكز IPD", url: "https://kenya.mfa.gov.ir/en/NewsView/793222" },
        { label: "GOV.UK: نصائح السفر إلى ايران والتأمين", url: "https://www.gov.uk/foreign-travel-advice/iran" },
      ],
      cta: {
        heading: "قبل التقديم على التأشيرة، دعنا نراجع ملفك",
        body: "في الاستشارة المجانية تحدد لسوين المركز المناسب ومدة الإقامة التقريبية والوثائق المطلوبة للتأشيرة.",
        button: "استشارة مجانية",
      },
    },
    en: {
      title: "Iran Medical Visa (T Visa): Steps, Documents, Validity",
      description:
        "Iran medical visa step by step: acceptance by an IPD-licensed hospital, applying on evisa.mfa.ir, documents, insurance, validity and visa-free countries.",
      h1: "Iran Medical (Treatment) Visa: Step-by-Step Guide",
      navLabel: "Medical visa",
      intro:
        "An Iran medical visa, often called the T visa or treatment visa, is issued to foreign nationals after a reputable Iranian medical centre accepts them and the Ministry of Foreign Affairs approves the application. You apply on the official portal evisa.mfa.ir, usually with help from a licensed health tourism company. This guide sets out the steps, documents and validity rules based on official Iranian foreign ministry pages.",
      sections: [
        {
          id: "who-needs",
          heading: "Who needs a treatment visa?",
          paragraphs: [
            "According to the foreign ministry's e-visa portal, citizens of Azerbaijan, Turkey, Syria, Georgia, Armenia, Egypt, China, Iraq, Oman and Kazakhstan fall under visa waiver rules. Nationals of Lebanon, Venezuela and Malaysia can obtain entry permits at designated entry points.",
            "Ordinary passport holders from 27 countries, including the UAE, Bahrain, Saudi Arabia, Qatar and Kuwait, may stay for tourism for a non-extendable 15 days once every six months. Treatment is not tourism and recovery can run longer, so these patients should ask the embassy or consulate which visa fits before travelling.",
            "Other nationalities, including Afghan and Pakistani citizens, need a visa for treatment.",
          ],
        },
        {
          id: "steps",
          heading: "How to get an Iran medical visa",
          paragraphs: [
            "This order follows Iranian consulate pages and the evisa.mfa.ir portal. Details can differ by nationality and where you apply.",
          ],
          steps: [
            "Send your medical records for a consultation so a doctor or hospital can confirm the treatment and your likely length of stay.",
            "An IPD-licensed medical centre accepts you, and a licensed health tourism company takes the application forward.",
            "Complete the visa application on evisa.mfa.ir. Your passport must be valid for at least six months, and your email address is verified during the process.",
            "Wait for approval from the Ministry of Foreign Affairs. Track the status on the same portal with your reference number or passport number.",
            "Once approved, submit your original passport, the application form, the visa fee receipt and, for applicants under 18, a guardian's consent letter to the named embassy or consulate. You may be called for an interview.",
            "Collect the visa and check the validity printed on the sticker. If you do not enter Iran within that period, you must apply again.",
            "If you need to stay longer once in Iran, apply for an extension at the police General Directorate of Foreign Nationals and Immigration.",
          ],
        },
        {
          id: "documents",
          heading: "Documents checklist",
          table: {
            caption: "Typical treatment visa documents, per Iranian consulate pages",
            columns: ["Document", "Details"],
            rows: [
              ["Original passport", "Valid for at least six months"],
              ["E-Visa application form", "With the reference number issued on foreign ministry approval"],
              ["Acceptance by a reputable medical centre", "From an IPD-licensed facility, via a licensed health tourism company"],
              ["Visa fee receipt", "The amount depends on nationality and the mission"],
              ["Guardian consent for under-18s", "Notarised, unless the guardian attends in person"],
              ["Residence permit of the country where you apply", "If you apply outside your country of citizenship"],
              ["Travel accident and health insurance", "Required by some missions, such as the Iranian embassy in Bern"],
            ],
          },
        },
        {
          id: "processing-validity",
          heading: "Processing time and validity",
          paragraphs: [
            "The foreign ministry does not publish a fixed processing time for treatment visas. The total depends on how quickly the hospital accepts you, ministry approval and embassy appointments. For comparison, the Iranian embassy in Bern states that tourist visas take two weeks once all documents are submitted.",
            "The Bern embassy also states that from 1 May 2025 the validity of tourist and arrival visas was cut from 90 to 45 days. For a treatment visa, the validity and permitted stay are printed on the visa sticker, and that is what counts.",
          ],
        },
        {
          id: "insurance",
          heading: "Travel insurance",
          paragraphs: [
            "Some Iranian missions, including the embassy in Bern, ask for a copy of valid accident and health insurance covering your stay. This cover usually excludes planned treatment. Some governments also warn that travelling against their advice can invalidate insurance, so read your policy before you go.",
          ],
        },
        {
          id: "companions",
          heading: "Visas for companions",
          paragraphs: [
            "A companion needs their own visa unless their nationality is visa-exempt. The health tourism company and the Iranian mission decide the companion's visa type and documents. Submit the patient's and companion's applications together so the dates line up.",
          ],
        },
        {
          id: "lsevin-role",
          heading: "What LSevin does",
          paragraphs: [
            "LSevin does not issue visas or invitations. We review your case, introduce IPD-licensed facilities, coordinate with a licensed health tourism company for the invitation, and book your hotel and transfers so the visa dates, treatment and stay fit together.",
          ],
        },
      ],
      faq: [
        {
          question: "How long does an Iran medical visa take?",
          answer:
            "There is no fixed official time. It depends on hospital acceptance, foreign ministry approval and embassy appointments. The Iranian embassy in Bern quotes two weeks for tourist visas once documents are complete.",
        },
        {
          question: "Do Iraqi citizens need a visa for treatment in Iran?",
          answer:
            "The foreign ministry's e-visa portal lists Iraq under visa waiver rules. The permitted stay is set at the border, and longer treatment requires an extension.",
        },
        {
          question: "Do Afghan patients need a visa?",
          answer:
            "Yes. Afghanistan is not on the visa waiver list, so Afghan patients need an appropriate visa, normally a treatment visa.",
        },
        {
          question: "Can a companion get a visa?",
          answer:
            "Yes, if their nationality is not visa-exempt. Apply at the same time as the patient.",
        },
        {
          question: "Can LSevin issue the IPD invitation?",
          answer:
            "No. The licensed medical centre and a licensed health tourism company issue the invitation. LSevin coordinates between you and them.",
        },
        {
          question: "Can I extend my visa if treatment takes longer?",
          answer:
            "Iranian consulates say extensions are handled inside Iran by the police General Directorate of Foreign Nationals and Immigration. Bring a letter from your treating physician confirming ongoing treatment.",
        },
      ],
      sources: [
        { label: "Consulate General of Iran in Hyderabad: Treatment (Medical) Visa", url: "https://hyderabad.mfa.gov.ir/en/GeneralCategoryServices/15436" },
        { label: "Consulate General of Iran in Mumbai: Treatment (Medical) Visa", url: "https://mumbai.mfa.gov.ir/en/GeneralCategoryServices/15391" },
        { label: "Iran Ministry of Foreign Affairs e-visa portal", url: "https://evisa.mfa.ir/en/" },
        { label: "Embassy of Iran in Bern: Visa Section (45-day validity change, documents)", url: "https://bern.mfa.gov.ir/en/viewpage/9664" },
        { label: "Embassy of Iran in Nairobi: Ministry of Health notice on IPD centres", url: "https://kenya.mfa.gov.ir/en/NewsView/793222" },
        { label: "GOV.UK: Iran travel advice (warnings and insurance)", url: "https://www.gov.uk/foreign-travel-advice/iran" },
      ],
      cta: {
        heading: "Check your case before you apply",
        body: "In a free consultation, LSevin identifies a suitable licensed facility, your likely length of stay and the documents your visa application will need.",
        button: "Free consultation",
      },
    },
  },
};
