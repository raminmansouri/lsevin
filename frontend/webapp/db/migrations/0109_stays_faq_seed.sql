-- ---------------------------------------------------------------------------
-- 0109 — Stays FAQ (scope 'app', entity_key 'stays').
--
-- Shown on /stays, /stays/intro and every /stays/city/* page (and as FAQPage
-- structured data). Answers describe only what the platform actually does
-- (0108 + src/features/stays). Admins can edit or deactivate each item in
-- Admin → Site content; seed_key keeps a re-run from duplicating them.
-- ---------------------------------------------------------------------------

insert into content.faq_items (scope, entity_key, question_translations, answer_translations, display_order, seed_key)
values
  ('app', 'stays',
   '{"fa-IR":"چطور هتل یا اقامتگاه رزرو کنم؟","en-US":"How do I book a hotel or place to stay?","ar-SA":"كيف أحجز فندقاً أو مكان إقامة؟"}',
   '{"fa-IR":"مقصد، تاریخ ورود و خروج و تعداد مسافران و اتاق‌ها را انتخاب کنید. در صفحه اقامتگاه، اتاق و نرخ دلخواه را بزنید، مشخصات تماس و نام مهمان اصلی هر اتاق را وارد کنید، قوانین لغو را بپذیرید و رزرو را ثبت کنید. تا پایان این مراحل اتاق برای مدت کوتاهی برای شما نگه داشته می‌شود.","en-US":"Choose a destination, your check-in and check-out dates, guests and rooms. On the stay page pick a room and rate, enter your contact details and the main guest of each room, accept the cancellation rules and confirm. Your room is held for a short time while you finish.","ar-SA":"اختر الوجهة وتاريخي الوصول والمغادرة وعدد الضيوف والغرف. في صفحة مكان الإقامة اختر الغرفة والسعر، وأدخل بيانات التواصل واسم الضيف الرئيسي لكل غرفة، ثم وافق على شروط الإلغاء وأكّد الحجز. تبقى الغرفة محجوزة لك لفترة قصيرة حتى تُكمل الخطوات."}',
   10, 'stays:faq:how-to-book'),
  ('app', 'stays',
   '{"fa-IR":"قیمتی که می‌بینم شامل چه چیزهایی است؟","en-US":"What does the price I see include?","ar-SA":"ماذا يشمل السعر المعروض؟"}',
   '{"fa-IR":"وقتی تاریخ سفر را وارد کنید، مبلغ نمایش داده‌شده کل هزینه اقامت است: همه شب‌ها، همه اتاق‌ها، نفرات اضافه، مالیات و کارمزد. بدون تاریخ، فقط «قیمت از … برای هر شب» نشان داده می‌شود که قیمت قطعی نیست. پیش از پرداخت، مبلغ دوباره محاسبه می‌شود و اگر تغییر کرده باشد قبل از ثبت به شما گفته می‌شود.","en-US":"Once you enter dates, the amount shown is the full stay: every night, every room, extra guests, taxes and fees. Without dates only a \"from … per night\" price is shown, which is not a quote. The amount is recalculated before you pay, and if it changed you are told before anything is booked.","ar-SA":"عند إدخال التواريخ يكون المبلغ المعروض تكلفة الإقامة كاملة: كل الليالي والغرف والضيوف الإضافيين والضرائب والرسوم. بدون تواريخ يظهر فقط سعر «ابتداءً من … لليلة» وهو ليس عرض سعر نهائياً. يُعاد حساب المبلغ قبل الدفع، وإذا تغيّر نخبرك قبل تسجيل الحجز."}',
   20, 'stays:faq:price'),
  ('app', 'stays',
   '{"fa-IR":"رزرو فوری با رزرو «با تأیید میزبان» چه فرقی دارد؟","en-US":"What is the difference between instant and host-confirmed booking?","ar-SA":"ما الفرق بين الحجز الفوري والحجز بتأكيد المضيف؟"}',
   '{"fa-IR":"در رزرو فوری، رزرو شما با پرداخت قطعی می‌شود. در رزرو با تأیید میزبان، ابتدا درخواست شما برای میزبان فرستاده می‌شود و تا وقتی نپذیرد مبلغی کسر نمی‌شود. اگر بپذیرد، مهلت پرداخت به شما داده می‌شود؛ اگر رد کند یا در مهلت مشخص پاسخ ندهد، درخواست بدون هزینه بسته می‌شود.","en-US":"With instant booking your stay is confirmed as soon as you pay. With host-confirmed booking your request goes to the host first and nothing is charged until they accept. If they accept you get a time window to pay; if they decline or do not answer in time, the request closes at no cost.","ar-SA":"في الحجز الفوري يتأكد حجزك فور الدفع. في الحجز بتأكيد المضيف يُرسل طلبك إلى المضيف أولاً ولا يُخصم أي مبلغ قبل قبوله. إذا قبل تحصل على مهلة للدفع، وإذا رفض أو لم يرد في الوقت المحدد يُغلق الطلب دون أي تكلفة."}',
   30, 'stays:faq:instant-vs-request'),
  ('app', 'stays',
   '{"fa-IR":"اگر رزرو را لغو کنم چقدر به من برمی‌گردد؟","en-US":"How much is refunded if I cancel?","ar-SA":"كم يُسترد إذا ألغيت الحجز؟"}',
   '{"fa-IR":"قوانین لغو هر اقامتگاه پیش از رزرو نشان داده می‌شود و همان قوانینی که پذیرفته‌اید همراه رزرو شما می‌ماند، حتی اگر اقامتگاه بعداً آن‌ها را تغییر دهد. پیش از تأیید لغو در «سفرهای من» مبلغ قابل استرداد را می‌بینید. نرخ‌های غیرقابل استرداد بازپرداختی ندارند.","en-US":"Each stay shows its cancellation rules before you book, and the rules you accepted stay with your booking even if the property changes them later. Before you confirm a cancellation in \"Your trips\" you see the exact refund. Non-refundable rates are not refunded.","ar-SA":"تظهر شروط الإلغاء لكل مكان إقامة قبل الحجز، وتبقى الشروط التي وافقت عليها مرتبطة بحجزك حتى لو غيّرها المكان لاحقاً. قبل تأكيد الإلغاء في «رحلاتي» ترى مبلغ الاسترداد بدقة. الأسعار غير القابلة للاسترداد لا يُسترد منها شيء."}',
   40, 'stays:faq:cancellation'),
  ('app', 'stays',
   '{"fa-IR":"چرا نشانی دقیق بعضی اقامتگاه‌ها نمایش داده نمی‌شود؟","en-US":"Why is the exact address of some stays hidden?","ar-SA":"لماذا يُخفى العنوان الدقيق لبعض أماكن الإقامة؟"}',
   '{"fa-IR":"برای حفظ حریم خصوصی خانه‌ها و ویلاهای شخصی، موقعیت آن‌ها تا پیش از رزرو تقریبی نشان داده می‌شود. پس از قطعی شدن رزرو، نشانی دقیق، مسیریابی و تلفن میزبان در صفحه رزرو شما نمایش داده می‌شود.","en-US":"To protect the privacy of private homes and villas, their location is shown approximately until you book. Once your booking is confirmed, the exact address, directions and the host phone number appear on your booking page.","ar-SA":"حفاظاً على خصوصية المنازل والفلل الخاصة، يظهر موقعها بشكل تقريبي حتى تحجز. بعد تأكيد الحجز يظهر العنوان الدقيق والاتجاهات ورقم هاتف المضيف في صفحة حجزك."}',
   50, 'stays:faq:address'),
  ('app', 'stays',
   '{"fa-IR":"چرا سن کودکان را می‌پرسید؟","en-US":"Why do you ask for children''s ages?","ar-SA":"لماذا تسألون عن أعمار الأطفال؟"}',
   '{"fa-IR":"ظرفیت اتاق و قیمت به سن کودکان بستگی دارد. نوزادان زیر دو سال جای جداگانه‌ای نمی‌گیرند و رایگان‌اند، و هر اقامتگاه سنی را مشخص می‌کند که کمتر از آن اقامت کودک رایگان است. با سن درست، فقط اتاق‌هایی به شما نشان داده می‌شوند که واقعاً برای خانواده شما جا دارند.","en-US":"Room capacity and price depend on children''s ages. Infants under two take no bed and stay free, and each property sets the age under which children stay free. With the right ages you only see rooms that really fit your family.","ar-SA":"تعتمد سعة الغرفة والسعر على أعمار الأطفال. الرضّع دون السنتين لا يحتاجون سريراً ويقيمون مجاناً، ويحدد كل مكان إقامة العمر الذي يقيم الأطفال دونه مجاناً. مع الأعمار الصحيحة ترى فقط الغرف التي تتسع لعائلتك فعلاً."}',
   60, 'stays:faq:children'),
  ('app', 'stays',
   '{"fa-IR":"چطور پرداخت کنم و اگر پرداخت ناموفق شد چه می‌شود؟","en-US":"How do I pay, and what if the payment fails?","ar-SA":"كيف أدفع، وماذا لو فشل الدفع؟"}',
   '{"fa-IR":"با کیف پول السوین یا کارت بانکی از طریق درگاه پرداخت کنید. تا پایان مهلت پرداخت می‌توانید دوباره تلاش کنید. اگر مبلغ از حساب شما کسر شده ولی رزرو قطعی نشده باشد، رزرو به‌طور خودکار قطعی می‌شود و نیازی به پرداخت دوباره نیست.","en-US":"Pay with your Lsevin wallet or by card through the payment gateway. You can retry until the payment deadline. If money was taken but the booking does not show as confirmed yet, it confirms automatically; do not pay twice.","ar-SA":"ادفع من محفظة لسوين أو بالبطاقة عبر بوابة الدفع. يمكنك إعادة المحاولة حتى انتهاء مهلة الدفع. إذا خُصم المبلغ ولم يظهر الحجز مؤكداً بعد، فسيتأكد تلقائياً؛ لا تدفع مرتين."}',
   70, 'stays:faq:payment'),
  ('app', 'stays',
   '{"fa-IR":"چه کسانی می‌توانند برای اقامتگاه نظر بدهند؟","en-US":"Who can review a stay?","ar-SA":"من يمكنه تقييم مكان الإقامة؟"}',
   '{"fa-IR":"فقط مهمانانی که از طریق السوین رزرو کرده‌اند و اقامتشان تمام شده است، برای هر رزرو یک بار. متن و امتیاز مهمان ویرایش نمی‌شود؛ نظرها فقط از نظر رعایت قوانین بررسی می‌شوند.","en-US":"Only guests who booked through Lsevin and completed their stay, once per booking. A guest''s words and score are never edited; reviews are only checked against the content rules.","ar-SA":"فقط الضيوف الذين حجزوا عبر لسوين وأنهوا إقامتهم، مرة واحدة لكل حجز. لا يُعدّل نص الضيف أو تقييمه؛ تُراجع التقييمات فقط للتأكد من التزامها بالقواعد."}',
   80, 'stays:faq:reviews'),
  ('app', 'stays',
   '{"fa-IR":"برای درمان سفر می‌کنم؛ اقامتگاه مناسب بیمار و همراه را چطور پیدا کنم؟","en-US":"I am travelling for treatment. How do I find a stay that suits a patient and companion?","ar-SA":"أسافر للعلاج، كيف أجد إقامة مناسبة للمريض ومرافقه؟"}',
   '{"fa-IR":"در فیلترها «دسترسی بدون پله» یا امکان «نزدیک بیمارستان» را انتخاب کنید. در صفحه هر اقامتگاه فاصله تا بیمارستان‌ها و درمانگاه‌های نزدیک آمده است؛ این فاصله خط مستقیم است، نه زمان رسیدن. دسترس‌پذیری‌ای که هنوز توسط السوین بررسی نشده، «طبق اعلام میزبان» نوشته می‌شود.","en-US":"Use the \"Step-free access\" filter or the \"Near a hospital\" amenity. Each stay page lists nearby hospitals and clinics with straight-line distances, not travel times. Accessibility that Lsevin has not checked yet is labelled as the host''s statement.","ar-SA":"استخدم مرشح «دخول بدون درج» أو ميزة «قريب من مستشفى». تعرض صفحة كل إقامة المستشفيات والعيادات القريبة بمسافات خط مستقيم وليس زمن الوصول. إمكانية الوصول التي لم تتحقق منها لسوين بعد تُذكر كتصريح من المضيف."}',
   90, 'stays:faq:medical')
on conflict (seed_key) do nothing;
