import type { Guide } from "../types";

export const guide: Guide = {
  slug: "ivf",
  reviewedAt: "2026-10-27",
  related: ["", "visa", "medical-hotels", "tehran", "mashhad", "from-iraq"],
  copy: {
    fa: {
      title: "آی وی اف؛ مراحل، مدت اقامت و هزینه آی وی اف | السوین",
      description:
        "آی وی اف و ایکسی چه مراحلی دارند، هر مرحله چند روز طول می‌کشد، چقدر باید در شهر مرکز درمان بمانید و هزینه آی وی اف به چه بستگی دارد. مشاورهٔ رایگان السوین.",
      h1: "آی وی اف و ایکسی در ایران: مراحل، زمان‌بندی، مدت اقامت و انتخاب مرکز درمان ناباروری",
      navLabel: "آی وی اف",
      intro:
        "آی وی اف (IVF) یعنی تخمک در آزمایشگاه با اسپرم بارور می‌شود و جنین به رحم منتقل می‌شود؛ یک دورهٔ درمان از تحریک تخمدان تا انتقال جنین معمولاً چند هفته طول می‌کشد. هزینهٔ آی وی اف به پروتکل دارویی، نیاز به ایکسی، فریز جنین و مرکز درمان بستگی دارد و یک بیمارستان دانشگاهی تهران در بهمن ۱۴۰۳ برای بیماران بین‌الملل ۲۵۰۰ تا ۴۰۰۰ دلار اعلام کرده است. این راهنما آموزشی است؛ مناسب بودن درمان و پروتکل را پزشک متخصص ناباروری تعیین می‌کند.",
      sections: [
        {
          id: "ivf-icsi",
          heading: "آی وی اف و ایکسی چه فرقی دارند؟",
          paragraphs: [
            "طبق انجمن اروپایی تولید مثل انسانی و جنین‌شناسی (ESHRE)، ایکسی (ICSI) بسیار شبیه آی وی اف است و تنها فرق آن روش ترکیب تخمک و اسپرم است: در ایکسی یک اسپرم مستقیم به داخل هر تخمک تزریق می‌شود.",
            "ESHRE می‌گوید مطالعات زیادی نشان می‌دهد ایکسی در نبود ناباروری مردانه شانس موفقیت را بیشتر نمی‌کند و باید به موارد ناباروری با عامل مردانه محدود شود. انتخاب بین این دو را پزشک بر اساس آزمایش اسپرم انجام می‌دهد.",
            "سازمان جهانی بهداشت (WHO) ناباروری را باردار نشدن پس از ۱۲ ماه یا بیشتر رابطهٔ منظم بدون پیشگیری تعریف می‌کند و تخمین می‌زند حدود یک نفر از هر شش نفر در سن باروری در طول زندگی ناباروری را تجربه می‌کند.",
          ],
        },
        {
          id: "steps-timeline",
          heading: "مراحل آی وی اف و زمان‌بندی هر مرحله",
          paragraphs: [
            "زمان‌بندی زیر کلی است و پروتکل هر بیمار را پزشک تعیین می‌کند.",
          ],
          table: {
            caption: "مراحل معمول یک دورهٔ آی وی اف یا ایکسی",
            columns: ["مرحله", "آنچه معمولاً اتفاق می‌افتد", "منبع"],
            rows: [
              ["تحریک تخمدان", "معمولاً ۸ تا ۱۴ روز دارو، با سونوگرافی و آزمایش خون برای پایش", "ASRM"],
              ["آمپول نهایی", "تخمک‌ها معمولاً ۳۴ تا ۳۶ ساعت پس از تزریق برداشته می‌شوند", "ASRM"],
              ["برداشت تخمک (پانکچر)", "با آرام‌بخش خفیف، معمولاً کمتر از نیم ساعت؛ بیمار همان روز به خانه می‌رود", "ESHRE"],
              ["روز بعد", "جنین‌شناس نشانه‌های لقاح را بررسی می‌کند", "ESHRE"],
              ["۱ تا ۶ روز پس از برداشت", "انتقال جنین به رحم؛ جنین روز پنجم بلاستوسیست نام دارد", "ASRM"],
              ["حدود ۲ هفته پس از انتقال", "آزمایش بارداری", "ESHRE"],
            ],
          },
        },
        {
          id: "stay-length",
          heading: "چند روز باید در شهر مرکز درمان بمانید؟",
          paragraphs: [
            "با توجه به ۸ تا ۱۴ روز تحریک تخمدان و انتقال جنین تا ۶ روز پس از برداشت تخمک، بیشتر بیماران برای یک دورهٔ کامل باید چند هفته برنامه‌ریزی کنند. مدت دقیق به پروتکل شما بستگی دارد.",
            "از مرکز درمان بپرسید آیا شروع داروها و پایش اولیه را می‌توان در کشور خودتان زیر نظر پزشک محلی انجام داد، و آیا آزمایش بارداری پس از بازگشت انجام می‌شود. طبق ESHRE جنین‌های اضافه را می‌توان فریز کرد و انتقال جنین فریزشده می‌تواند به اندازهٔ جنین تازه موفق باشد؛ در این حالت ممکن است برای انتقال، سفر جداگانه‌ای لازم باشد.",
          ],
        },
        {
          id: "legal-framework",
          heading: "چارچوب قانونی و شرعی در ایران",
          paragraphs: [
            "طبق مقاله‌ای مروری در مجلهٔ Journal of Reproduction and Infertility (۲۰۱۵)، مجلس ایران با استناد به فتوای مراجع شیعه، قانون نحوهٔ اهدای جنین به زوجین نابارور و آیین‌نامهٔ آن را تصویب کرده است. این قانون اهدای جنین حاصل از زوجین قانونی به زوجین نابارور را مجاز می‌داند.",
            "همان مقاله می‌گوید بسیاری از جنبه‌های حقوقی در این قانون مشخص نشده است. اگر درمان شما به اهدای جنین یا روش‌های مشابه نیاز دارد، شرایط، مدارک لازم و مراحل قانونی را پیش از سفر کتبی از مرکز درمان بپرسید.",
          ],
        },
        {
          id: "choosing-centre",
          heading: "مرکز درمان ناباروری را چطور انتخاب کنیم؟",
          bullets: [
            "مرکز مجوز معتبر وزارت بهداشت داشته باشد و برای بیماران خارجی، مجوز IPD؛ مراکز درمان ناباروری هم مشمول این مجوز هستند.",
            "تخصص پزشک معالج و اینکه چه کسی پایش، پانکچر و انتقال را انجام می‌دهد.",
            "سیاست مرکز دربارهٔ تعداد جنین منتقل‌شده؛ ESHRE می‌گوید معمولاً یک جنین منتقل و بقیه فریز می‌شوند.",
            "هزینهٔ فریز و نگهداری جنین و شرایط انتقال در سفر بعدی.",
            "زبان ارتباط با پزشک و جنین‌شناس.",
            "تصمیم را فقط بر اساس قیمت یا وعدهٔ موفقیت نگیرید.",
          ],
        },
        {
          id: "risks-success",
          heading: "عوارض و عوامل مؤثر بر نتیجه",
          paragraphs: [
            "ESHRE مهم‌ترین عامل نتیجه را سن زن می‌داند و به داده‌های بریتانیا اشاره می‌کند که در آن شانس تولد نوزاد برای زنان زیر ۳۵ سال حدود ۳۰ درصد و برای زنان بالای ۴۴ سال کمتر از ۳ درصد است. بسیاری از افراد به چند دوره درمان نیاز دارند و برخی با چند دوره هم باردار نمی‌شوند. این ارقام عمومی است و نتیجهٔ هیچ مرکزی را تضمین نمی‌کند.",
            "طبق انجمن آمریکایی پزشکی باروری (ASRM)، تا ۲۰ درصد دوره‌ها ممکن است پیش از برداشت تخمک لغو شوند، معمولاً به دلیل پاسخ ناکافی تخمدان، و تا ۲ درصد زنان دچار نوع شدید سندرم تحریک بیش از حد تخمدان (OHSS) می‌شوند. ESHRE هم خونریزی یا عفونت ناشی از سوزن پانکچر را خطری کوچک ذکر می‌کند.",
          ],
        },
        {
          id: "companions-travel",
          heading: "همراه، هتل و سفر",
          paragraphs: [
            "معمولاً حضور همسر برای نمونهٔ اسپرم و امضای رضایت‌نامه‌ها لازم است؛ مدارک لازم مانند سند ازدواج را از مرکز بپرسید. السوین هتل نزدیک مرکز درمان و ترانسفر روزهای پایش و پانکچر را هماهنگ می‌کند.",
            "از ۲۶ اکتبر ۲۰۲۶ دولت بریتانیا از هرگونه سفر به ایران منع می‌کند. پیش از رزرو، آخرین هشدار سفر کشور خودتان را بخوانید.",
          ],
        },
      ],
      faq: [
        {
          question: "هزینهٔ آی وی اف چقدر است؟",
          answer:
            "به پروتکل دارویی، ایکسی، فریز جنین و مرکز درمان بستگی دارد. بیمارستان فیروزآبادی دانشگاه علوم پزشکی ایران در بهمن ۱۴۰۳ برای بیماران بین‌الملل ۲۵۰۰ تا ۴۰۰۰ دلار اعلام کرده است. پیش‌فاکتور دقیق را پس از مشاوره دریافت می‌کنید.",
        },
        {
          question: "یک دورهٔ آی وی اف چقدر طول می‌کشد؟",
          answer:
            "طبق ASRM تحریک تخمدان معمولاً ۸ تا ۱۴ روز است و انتقال جنین ۱ تا ۶ روز پس از برداشت تخمک انجام می‌شود. آزمایش بارداری طبق ESHRE حدود دو هفته پس از انتقال است.",
        },
        {
          question: "ایکسی برای چه کسانی است؟",
          answer:
            "ESHRE می‌گوید ایکسی باید به ناباروری با عامل مردانه محدود شود، چون در نبود آن شانس موفقیت را بیشتر نمی‌کند. پزشک بر اساس آزمایش اسپرم تصمیم می‌گیرد.",
        },
        {
          question: "پانکچر تخمک دردناک است؟",
          answer:
            "طبق ESHRE پانکچر با آرام‌بخش خفیف انجام می‌شود، معمولاً کمتر از نیم ساعت طول می‌کشد و بیمار همان روز به خانه می‌رود.",
        },
        {
          question: "آیا جنین را می‌توان فریز کرد؟",
          answer:
            "بله. ESHRE می‌گوید جنین‌های اضافهٔ مناسب فریز می‌شوند و انتقال جنین فریزشده می‌تواند به اندازهٔ جنین تازه موفق باشد. هزینه و مدت نگهداری را از مرکز بپرسید.",
        },
        {
          question: "شانس موفقیت آی وی اف چقدر است؟",
          answer:
            "بیشتر از همه به سن زن بستگی دارد. ESHRE به داده‌های بریتانیا اشاره می‌کند: حدود ۳۰ درصد برای زنان زیر ۳۵ سال و کمتر از ۳ درصد برای زنان بالای ۴۴ سال. پزشک شما بر اساس پرونده‌تان توضیح می‌دهد و هیچ نتیجه‌ای تضمین‌شده نیست.",
        },
      ],
      sources: [
        { label: "ESHRE: ایکسی چیست (بروشور بیماران)", url: "https://eshre.eu/-/media/sitecore-files/SIGs/GSCA/IRHEC/Leaflets/ESHRE---What-is-ICSI-copia.pdf" },
        { label: "ASRM: Assisted Reproductive Technology, A Guide for Patients (ویرایش ۲۰۱۸)", url: "https://reproductivefacts.org/link/f99731bcfdb94d30a01e15c94e222e43.aspx" },
        { label: "سازمان جهانی بهداشت: ناباروری (۲۰۲۵)", url: "https://www.who.int/news-room/fact-sheets/detail/infertility" },
        { label: "Behjati-Ardakani و همکاران: اهدای جنین در نظام حقوقی ایران (J Reprod Infertil، ۲۰۱۵)", url: "https://pubmed.ncbi.nlm.nih.gov/26913231/" },
        { label: "دانشگاه علوم پزشکی ایران، بیمارستان فیروزآبادی: هزینه‌های درمان در ایران (۲۰۲۵)", url: "https://en-hospfa.iums.ac.ir/articles/Medical-Treatment-Costs-in-Iran" },
        { label: "سفارت ایران در نایروبی: اطلاعیهٔ وزارت بهداشت دربارهٔ مراکز IPD", url: "https://kenya.mfa.gov.ir/en/NewsView/793222" },
        { label: "GOV.UK: هشدار سفر به ایران", url: "https://www.gov.uk/foreign-travel-advice/iran" },
      ],
      cta: {
        heading: "پرونده‌تان را بفرستید و مشاورهٔ رایگان بگیرید",
        body: "کارشناس السوین آزمایش‌ها و سوابق درمان را به متخصص ناباروری و مرکز دارای مجوز می‌رساند و پیش‌فاکتور کتبی شامل درمان، هتل و خدمات جانبی می‌فرستد.",
        button: "درخواست مشاورهٔ رایگان",
      },
    },
    ar: {
      title: "أطفال الأنابيب في ايران: المراحل والمدة والتكلفة | لسوين",
      description:
        "أطفال الأنابيب في ايران: مراحل IVF والحقن المجهري، مدة كل مرحلة، كم تبقى في المدينة، اختيار مركز الخصوبة وما يحدد التكلفة. معلومات موثقة واستشارة مجانية.",
      h1: "أطفال الأنابيب والحقن المجهري في ايران: المراحل والجدول الزمني ومدة البقاء واختيار المركز",
      navLabel: "أطفال الأنابيب",
      intro:
        "أطفال الأنابيب (IVF) يعني تخصيب البويضة بالحيوان المنوي في المختبر ثم نقل الجنين إلى الرحم، وتستغرق الدورة الواحدة من تنشيط المبيض حتى نقل الجنين عادة عدة أسابيع. تعتمد التكلفة على البروتوكول الدوائي والحاجة إلى الحقن المجهري وتجميد الأجنة والمركز، وقد ذكر مستشفى جامعي في طهران في يناير 2025 نطاق 2,500 إلى 4,000 دولار للمرضى الدوليين. هذا المحتوى تثقيفي، وطبيب الخصوبة المعالج هو من يقرر ملاءمة العلاج والبروتوكول.",
      sections: [
        {
          id: "ivf-icsi",
          heading: "ما الفرق بين أطفال الأنابيب والحقن المجهري؟",
          paragraphs: [
            "بحسب الجمعية الأوروبية للتكاثر البشري وعلم الأجنة (ESHRE)، الحقن المجهري (ICSI) يشبه أطفال الأنابيب كثيراً، والفرق الوحيد طريقة جمع البويضة والحيوان المنوي: في الحقن المجهري يُحقن حيوان منوي واحد مباشرة في كل بويضة.",
            "وتقول ESHRE إن دراسات كثيرة تُظهر أن الحقن المجهري لا يرفع فرص النجاح عند غياب العامل الذكري، لذلك يُقصر على حالات العقم الذكري. ويحدد الطبيب الخيار بناءً على تحليل السائل المنوي.",
            "وتعرّف منظمة الصحة العالمية العقم بعدم حدوث الحمل بعد 12 شهراً أو أكثر من العلاقة المنتظمة دون وسائل منع، وتقدّر أن نحو شخص من كل ستة في سن الإنجاب يعاني العقم خلال حياته.",
          ],
        },
        {
          id: "steps-timeline",
          heading: "مراحل أطفال الأنابيب ومدة كل مرحلة",
          paragraphs: [
            "الجدول التالي عام، ويحدد الطبيب بروتوكول كل مريضة.",
          ],
          table: {
            caption: "المراحل المعتادة لدورة أطفال الأنابيب أو الحقن المجهري",
            columns: ["المرحلة", "ما يحدث عادة", "المصدر"],
            rows: [
              ["تنشيط المبيض", "أدوية لمدة 8 إلى 14 يوماً عادة مع متابعة بالسونار وتحاليل الدم", "ASRM"],
              ["الحقنة التفجيرية", "تُسحب البويضات عادة بعد 34 إلى 36 ساعة من الحقنة", "ASRM"],
              ["سحب البويضات", "بتهدئة خفيفة، عادة أقل من نصف ساعة، وتعود المريضة إلى منزلها في اليوم نفسه", "ESHRE"],
              ["اليوم التالي", "يفحص أخصائي الأجنة علامات الإخصاب", "ESHRE"],
              ["من يوم إلى 6 أيام بعد السحب", "نقل الجنين إلى الرحم؛ ويسمى جنين اليوم الخامس الكيسة الأريمية", "ASRM"],
              ["نحو أسبوعين بعد النقل", "اختبار الحمل", "ESHRE"],
            ],
          },
        },
        {
          id: "stay-length",
          heading: "كم يوماً تبقين في المدينة؟",
          paragraphs: [
            "مع 8 إلى 14 يوماً من التنشيط ونقل الجنين حتى 6 أيام بعد سحب البويضات، تحتاج معظم المريضات إلى التخطيط لعدة أسابيع للدورة الكاملة. وتعتمد المدة الدقيقة على بروتوكولك.",
            "اسألي المركز هل يمكن بدء الأدوية والمتابعة الأولى في بلدك تحت إشراف طبيب محلي، وهل يُجرى اختبار الحمل بعد العودة. وبحسب ESHRE يمكن تجميد الأجنة الإضافية، وقد يكون نقل الجنين المجمد ناجحاً مثل الجنين الطازج؛ وفي هذه الحالة قد تحتاجين إلى رحلة منفصلة للنقل.",
          ],
        },
        {
          id: "legal-framework",
          heading: "الإطار القانوني والشرعي في ايران",
          paragraphs: [
            "بحسب مقالة مراجعة في مجلة Journal of Reproduction and Infertility (2015)، أقر البرلمان الإيراني استناداً إلى فتاوى مراجع الشيعة قانون التبرع بالأجنة للأزواج المصابين بالعقم ولائحته التنفيذية، ويجيز القانون التبرع بالأجنة الناتجة عن زوجين شرعيين لزوجين مصابين بالعقم.",
            "وتذكر المقالة نفسها أن جوانب قانونية كثيرة لم يحددها القانون. إذا كان علاجك يتطلب التبرع بالأجنة أو ما شابه، فاطلبي من المركز كتابةً الشروط والوثائق والإجراءات القانونية قبل السفر.",
          ],
        },
        {
          id: "choosing-centre",
          heading: "كيف تختارين مركز علاج العقم؟",
          bullets: [
            "أن يكون المركز مرخصاً من وزارة الصحة الإيرانية، وللمرضى الأجانب حاصلاً على ترخيص IPD؛ وتشمل هذه التراخيص مراكز علاج العقم.",
            "تخصص الطبيب المعالج ومن يتولى المتابعة وسحب البويضات والنقل.",
            "سياسة المركز في عدد الأجنة المنقولة؛ تقول ESHRE إنه يُنقل عادة جنين واحد ويُجمد الباقي.",
            "تكلفة تجميد الأجنة وحفظها وشروط النقل في رحلة لاحقة.",
            "لغة التواصل مع الطبيب وأخصائي الأجنة.",
            "لا تختاري على أساس السعر أو وعود النجاح وحدها.",
          ],
        },
        {
          id: "risks-success",
          heading: "المضاعفات والعوامل المؤثرة في النتيجة",
          paragraphs: [
            "تعتبر ESHRE عمر المرأة العامل الأهم، وتشير إلى بيانات بريطانية تبلغ فيها فرصة الولادة نحو 30% للنساء دون 35 عاماً وأقل من 3% لمن تجاوزن 44 عاماً. ويحتاج كثيرون إلى عدة دورات، وبعضهم لا يحدث لديه حمل رغم ذلك. هذه أرقام عامة ولا تضمن نتيجة أي مركز.",
            "وبحسب الجمعية الأمريكية للطب التناسلي (ASRM) قد تُلغى حتى 20% من الدورات قبل سحب البويضات، غالباً لضعف استجابة المبيض، وتصاب حتى 2% من النساء بالنوع الشديد من متلازمة فرط تنشيط المبيض (OHSS). وتذكر ESHRE أيضاً خطراً صغيراً للنزف أو العدوى من إبرة السحب.",
          ],
        },
        {
          id: "companions-travel",
          heading: "المرافق والفندق والسفر",
          paragraphs: [
            "يلزم عادة حضور الزوج لعينة السائل المنوي وتوقيع الموافقات، فاسألي المركز عن الوثائق المطلوبة مثل عقد الزواج. وتنسق لسوين فندقاً قريباً من المركز والنقل في أيام المتابعة والسحب.",
            "ابتداءً من 26 أكتوبر 2026 تنصح الحكومة البريطانية بعدم السفر إلى ايران إطلاقاً. اقرئي أحدث تحذير سفر في بلدك قبل الحجز.",
          ],
        },
      ],
      faq: [
        {
          question: "كم تكلفة أطفال الأنابيب في ايران؟",
          answer:
            "تعتمد على البروتوكول الدوائي والحقن المجهري وتجميد الأجنة والمركز. ذكر مستشفى فيروزآبادي التابع لجامعة ايران للعلوم الطبية في يناير 2025 نطاق 2,500 إلى 4,000 دولار. تستلمين عرض السعر الدقيق بعد الاستشارة.",
        },
        {
          question: "كم تستغرق دورة أطفال الأنابيب؟",
          answer:
            "بحسب ASRM يستمر تنشيط المبيض عادة 8 إلى 14 يوماً، ويُنقل الجنين بعد يوم إلى 6 أيام من سحب البويضات. ويكون اختبار الحمل بحسب ESHRE بعد نحو أسبوعين من النقل.",
        },
        {
          question: "لمن يناسب الحقن المجهري؟",
          answer:
            "تقول ESHRE إن الحقن المجهري يُقصر على العقم الذكري لأنه لا يرفع فرص النجاح عند غيابه. ويقرر الطبيب بناءً على تحليل السائل المنوي.",
        },
        {
          question: "هل سحب البويضات مؤلم؟",
          answer:
            "بحسب ESHRE يُجرى السحب بتهدئة خفيفة، ويستغرق عادة أقل من نصف ساعة، وتعود المريضة إلى منزلها في اليوم نفسه.",
        },
        {
          question: "هل يمكن تجميد الأجنة؟",
          answer:
            "نعم. تقول ESHRE إن الأجنة الإضافية المناسبة تُجمد، وقد يكون نقل الجنين المجمد ناجحاً مثل الطازج. اسألي المركز عن تكلفة الحفظ ومدته.",
        },
        {
          question: "ما نسبة نجاح أطفال الأنابيب؟",
          answer:
            "تعتمد أولاً على عمر المرأة. تشير ESHRE إلى بيانات بريطانية: نحو 30% دون 35 عاماً وأقل من 3% فوق 44 عاماً. يشرح لك طبيبك ما يخص حالتك، ولا توجد نتيجة مضمونة.",
        },
      ],
      sources: [
        { label: "ESHRE: ما هو الحقن المجهري (نشرة للمرضى)", url: "https://eshre.eu/-/media/sitecore-files/SIGs/GSCA/IRHEC/Leaflets/ESHRE---What-is-ICSI-copia.pdf" },
        { label: "ASRM: Assisted Reproductive Technology, A Guide for Patients (مراجعة 2018)", url: "https://reproductivefacts.org/link/f99731bcfdb94d30a01e15c94e222e43.aspx" },
        { label: "منظمة الصحة العالمية: العقم (2025)", url: "https://www.who.int/news-room/fact-sheets/detail/infertility" },
        { label: "Behjati-Ardakani وآخرون: التبرع بالأجنة في النظام القانوني الإيراني (J Reprod Infertil، 2015)", url: "https://pubmed.ncbi.nlm.nih.gov/26913231/" },
        { label: "جامعة ايران للعلوم الطبية، مستشفى فيروزآبادي: تكاليف العلاج في ايران (2025)", url: "https://en-hospfa.iums.ac.ir/articles/Medical-Treatment-Costs-in-Iran" },
        { label: "سفارة ايران في نيروبي: إعلان وزارة الصحة حول مراكز IPD", url: "https://kenya.mfa.gov.ir/en/NewsView/793222" },
        { label: "GOV.UK: نصائح السفر إلى ايران", url: "https://www.gov.uk/foreign-travel-advice/iran" },
      ],
      cta: {
        heading: "أرسلي ملفك واحصلي على استشارة مجانية",
        body: "يوصل فريق لسوين تحاليلك وتاريخك العلاجي إلى طبيب خصوبة ومركز مرخص، ويرسل لك عرض سعر مكتوباً يشمل العلاج والفندق والخدمات الإضافية.",
        button: "اطلبي استشارة مجانية",
      },
    },
    en: {
      title: "IVF in Iran: Steps, Timeline, Cost and How Long to Stay",
      description:
        "IVF in Iran explained: IVF and ICSI steps, how long each stage takes, how long to stay, choosing a fertility centre and what drives cost. Free consultation.",
      h1: "IVF and ICSI in Iran: Steps, Timeline, Length of Stay and Choosing a Fertility Centre",
      navLabel: "IVF",
      intro:
        "IVF (in vitro fertilisation) means eggs are fertilised with sperm in a laboratory and an embryo is transferred to the womb; one cycle, from ovarian stimulation to embryo transfer, usually takes several weeks. IVF cost in Iran depends on the medication protocol, whether ICSI or embryo freezing is needed and the centre, and one Tehran university hospital published a range of $2,500 to $4,000 for international patients in January 2025. This guide is general information, not medical advice: your fertility specialist decides whether treatment suits you and which protocol to use.",
      sections: [
        {
          id: "ivf-icsi",
          heading: "IVF and ICSI: what is the difference?",
          paragraphs: [
            "According to the European Society of Human Reproduction and Embryology (ESHRE), ICSI (intracytoplasmic sperm injection) is very similar to IVF; the only difference is how eggs and sperm are brought together. In ICSI, a single sperm is injected directly into each egg.",
            "ESHRE says many studies show ICSI does not improve the chance of success when there is no male factor infertility, so it should be restricted to male factor cases. Your doctor decides based on semen analysis.",
            "The World Health Organization defines infertility as failure to achieve a pregnancy after 12 months or more of regular unprotected intercourse, and estimates that about one in six people of reproductive age experience it in their lifetime.",
          ],
        },
        {
          id: "steps-timeline",
          heading: "IVF steps and timeline",
          paragraphs: [
            "This timeline is general. Your doctor sets your individual protocol.",
          ],
          table: {
            caption: "Typical stages of an IVF or ICSI cycle",
            columns: ["Stage", "What usually happens", "Source"],
            rows: [
              ["Ovarian stimulation", "Usually 8 to 14 days of medication, monitored by ultrasound and blood tests", "ASRM"],
              ["Trigger injection", "Eggs are usually retrieved 34 to 36 hours after the injection", "ASRM"],
              ["Egg collection", "Under light sedation, usually under half an hour; home the same day", "ESHRE"],
              ["Next day", "The embryologist checks for signs of fertilisation", "ESHRE"],
              ["1 to 6 days after collection", "Embryo transfer; a day-5 embryo is called a blastocyst", "ASRM"],
              ["About 2 weeks after transfer", "Pregnancy test", "ESHRE"],
            ],
          },
        },
        {
          id: "stay-length",
          heading: "How long to stay in Iran",
          paragraphs: [
            "With 8 to 14 days of stimulation and transfer up to six days after egg collection, most patients need to plan for several weeks for a full cycle. The exact length depends on your protocol.",
            "Ask the centre whether you can start medication and early monitoring at home under a local doctor, and whether the pregnancy test can be done after you return. ESHRE notes that extra embryos can be frozen and that frozen embryo transfers can be just as successful as fresh ones; in that case the transfer may need a separate trip.",
          ],
        },
        {
          id: "legal-framework",
          heading: "Legal and religious framework in Iran",
          paragraphs: [
            "According to a 2015 review in the Journal of Reproduction and Infertility, Iran's parliament, with reference to the opinions (fatwas) of Shiite clerics, enacted the Act concerning Embryo Donation to Infertile Couples and its bylaw. The Act permits embryo donation from legally married couples to infertile couples.",
            "The same review notes that many legal aspects are not specified in the Act. If your treatment may involve embryo donation or similar options, ask the centre in writing about conditions, documents and legal steps before you travel.",
          ],
        },
        {
          id: "choosing-centre",
          heading: "How to choose a fertility centre",
          bullets: [
            "The centre should be licensed by Iran's Ministry of Health and, for international patients, hold an IPD licence; fertility centres fall under this licensing.",
            "Your doctor's specialty, and who carries out monitoring, egg collection and transfer.",
            "The centre's policy on how many embryos are transferred; ESHRE says usually one is transferred and suitable extras are frozen.",
            "Costs of freezing and storing embryos and the terms for a later transfer.",
            "The language you can use with the doctor and embryologist.",
            "Do not choose on price or promised success rates alone.",
          ],
        },
        {
          id: "risks-success",
          heading: "Risks and what affects the outcome",
          paragraphs: [
            "ESHRE names the woman's age as the main factor and cites UK data in which women under 35 have about a 30% chance of having a baby, falling to under 3% for women over 44. Many people need several cycles, and some do not conceive despite many attempts. These are general figures and do not predict any centre's results.",
            "The American Society for Reproductive Medicine (ASRM) says up to 20% of cycles may be cancelled before egg retrieval, usually because of a low response, and up to 2% of women develop severe ovarian hyperstimulation syndrome (OHSS). ESHRE adds a small risk of bleeding or infection from the collection needle.",
          ],
        },
        {
          id: "companions-travel",
          heading: "Companions, hotel and travel",
          paragraphs: [
            "The husband usually needs to be present for the sperm sample and consent forms; ask the centre which documents it needs, such as a marriage certificate. LSevin arranges a hotel near the centre and transfers on monitoring and collection days.",
            "As of 26 October 2026 the UK advises against all travel to Iran. Read your own government's latest advisory before you book.",
          ],
        },
      ],
      faq: [
        {
          question: "How much does IVF cost in Iran?",
          answer:
            "It depends on the protocol, ICSI, embryo freezing and the centre. Firoozabadi Hospital of Iran University of Medical Sciences stated in January 2025 that IVF in Iran costs $2,500 to $4,000. You receive an exact written quote after the consultation.",
        },
        {
          question: "How long does one IVF cycle take?",
          answer:
            "ASRM says stimulation usually lasts 8 to 14 days, and transfer takes place one to six days after egg collection. ESHRE puts the pregnancy test about two weeks after transfer.",
        },
        {
          question: "Who needs ICSI?",
          answer:
            "ESHRE says ICSI should be restricted to male factor infertility, as it does not improve success without it. Your doctor decides based on semen analysis.",
        },
        {
          question: "Is egg collection painful?",
          answer:
            "According to ESHRE, egg collection is done under light sedation, usually takes less than half an hour, and you go home the same day.",
        },
        {
          question: "Can embryos be frozen?",
          answer:
            "Yes. ESHRE says suitable extra embryos are frozen and frozen transfers can be just as successful as fresh ones. Ask the centre about storage costs and duration.",
        },
        {
          question: "What is the IVF success rate?",
          answer:
            "It depends mostly on the woman's age. ESHRE cites UK data of about 30% under 35 and under 3% over 44. Your doctor will explain what applies to you, and no outcome can be promised.",
        },
      ],
      sources: [
        { label: "ESHRE: What is ICSI (patient leaflet)", url: "https://eshre.eu/-/media/sitecore-files/SIGs/GSCA/IRHEC/Leaflets/ESHRE---What-is-ICSI-copia.pdf" },
        { label: "ASRM: Assisted Reproductive Technology, A Guide for Patients (revised 2018)", url: "https://reproductivefacts.org/link/f99731bcfdb94d30a01e15c94e222e43.aspx" },
        { label: "World Health Organization: Infertility fact sheet (2025)", url: "https://www.who.int/news-room/fact-sheets/detail/infertility" },
        { label: "Behjati-Ardakani et al.: Embryo Donation in Iranian Legal System, a Critical Review (J Reprod Infertil, 2015)", url: "https://pubmed.ncbi.nlm.nih.gov/26913231/" },
        { label: "Iran University of Medical Sciences, Firoozabadi Hospital: Medical Treatment Costs in Iran (2025)", url: "https://en-hospfa.iums.ac.ir/articles/Medical-Treatment-Costs-in-Iran" },
        { label: "Embassy of Iran in Nairobi: Ministry of Health notice on IPD centres", url: "https://kenya.mfa.gov.ir/en/NewsView/793222" },
        { label: "GOV.UK: Iran travel advice", url: "https://www.gov.uk/foreign-travel-advice/iran" },
      ],
      cta: {
        heading: "Send your records for a free consultation",
        body: "A LSevin coordinator passes your test results and treatment history to a fertility specialist at a licensed centre, then sends a written quote covering treatment, hotel and extras.",
        button: "Request a free consultation",
      },
    },
  },
};
