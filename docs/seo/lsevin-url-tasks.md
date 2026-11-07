# اصلاح URL های سایت (SEO)

قانون کلی برای URL های عمومی از این به بعد:

```
/<locale>/<section>/<slug>
```

همه حروف کوچک، کلمه‌ها با خط تیره، بدون اسلش آخر، بدون UUID، بدون `n/app/mobile`، بدون `-v2` و `-new`.

پنل‌ها (admin، provider-portal، provider-panel، financial) و `/api` فعلا دست نمی‌خورن. پشت لاگین هستن و تغییرشون فقط لینک‌ها و کلاینت‌ها رو می‌شکنه.

---

## فاز ۱ — بستن صفحه‌های خصوصی و رفع canonical تکراری

### T1. noindex برای صفحه‌های خصوصی موبایل — 🟡
الان `robots.ts` فقط `/*/profile` و امثالش رو سطح اول می‌بنده. نسخه‌های زیر `n/app/mobile` بازن.

صفحه‌هایی که باید `robots: { index: false, follow: false }` توی `generateMetadata` بگیرن:
- `n/app/mobile/profile/**`
- `n/app/mobile/bookings/**`
- `n/app/mobile/booking` و `booking-v2`
- `n/app/mobile/shop/` → `cart`، `checkout`، `orders`، `order`، `addresses`، `wishlist`، `compare`
- `n/app/mobile/notifications`، `support`، `bug-reports`
- `n/app/mobile/search` و `search-results`
- `n/app/mobile/home`

**تحویل:** روی هر کدوم `meta robots` با noindex دیده بشه. فقط به robots.txt اکتفا نکنید.

**وضعیت فعلی:** به‌جای `generateMetadata` هر صفحه، یه `layout.tsx` با `privateMetadata` (noindex,nofollow) یا `searchMetadata` (noindex,follow) از `src/lib/seo/robots-policy.ts` گذاشته شده. این روش قابل قبوله.
- ✅ بسته شده: `profile`، `bookings`، `booking`، `booking-v2`، `bug-reports`، `notifications`، همه زیرمسیرهای خصوصی `shop` (+ `shop/search`)، `medical`، `care`.
- ✅ با `searchMetadata` (noindex,follow): `search`، `search-results`، `map-discovery`.
- ❌ **`support`** هنوز robots نداره (نه layout نه generateMetadata). باید اضافه بشه.
- ⚠️ **`home`** عمدا indexable شده: ریشه `/` و `/<locale>` با ریدایرکت 307 به `/n/app/mobile/home` می‌رن و home توی sitemap هست. یعنی home فعلا صفحه اصلی سایته و نباید noindex بشه. **این بند رو از T1 حذف کنید**؛ حل درستش انتقال home به `/<locale>` توی فاز ۴ است.
- ⚠️ `medical/clinics` الان از layout پدرش noindex گرفته، ولی توی T8 قراره صفحه عمومی `/fa/clinics` بشه. موقع T8 حواستون باشه.

### T2. تکمیل robots.txt — ⬜
همین مسیرهای T1 به `disallow` در `robots.ts` اضافه بشن.

**وضعیت فعلی:** `src/app/robots.ts` هیچ‌کدوم از مسیرهای `n/app/mobile` رو نداره (نه روی `Lsevin-New` نه روی برنچ‌های SEO). فقط `search` و `map-discovery` رو disallow نکنید، چون noindex,follow هستن و باید کرال بشن تا لینک‌هاشون دنبال بشه.

### T3. یکی کردن canonical صفحه‌های تکراری — 🟡
این‌ها دو نسخه دارن و هر دو canonical روی خودشون می‌زنن:

| نسخه قدیمی | نسخه موبایل | وضعیت |
|---|---|---|
| `/service-providers/[id]` | `/n/app/mobile/provider/[id]` | ✅ ریدایرکت **308** در `next.config.ts` (کامیت `98df0b7c`) |
| `/type/[id]` | `/n/app/mobile/categories` و `explore` | 🟡 ریدایرکت 308 به `/n/app/mobile/categories` (همه typeها به یه صفحه می‌رن، id از دست می‌ره) |
| `/profile` | `/n/app/mobile/profile` | ⬜ هنوز دو نسخه هست؛ نسخه قدیمی noindex داره پس مشکل SEO نداره |

نسخه موبایل رو اصلی بگیرید (کامل‌تره). canonical نسخه قدیمی باید به نسخه موبایل اشاره کنه.

**نکته:** چون ریدایرکت زده شده، فایل‌های `(main)/service-providers/[id]/page.tsx` و `(main)/type/[id]/page.tsx` دیگه رندر نمی‌شن ولی هنوز `alternatesFor` روی آدرس خودشون دارن. کد مرده‌ان؛ دست نزنید، فقط بدونید. توی T9 این ریدایرکت‌ها باید مستقیم به مقصد نهایی (`/providers/[slug]`) عوض بشن تا زنجیره درست نشه.

### T4. canonical صفحه‌های فیلتر و جستجو — 🟡
`explore`، `shop` و `search` با هر پارامتری که باز بشن، canonical باید نسخه بدون پارامتر باشه.

**وضعیت فعلی:**
- ✅ `explore`: canonical ثابت `alternatesFor(locale, "/n/app/mobile/explore")`.
- ✅ `shop`: با `buildPublicMetadata` و path ثابت.
- 🟡 `search`: canonical نداره ولی noindex,follow شده؛ کافیه.
- ⬜ `offers` و `featured` هیچ metadata ای ندارن (نه canonical نه title). `offers` پارامتر query می‌گیره.

---

## فاز ۲ — sitemap

### T5. اضافه کردن صفحه‌های موجود به sitemap — ✅ (نیمه‌کامل)
الان `sitemap.ts` فقط خانه، `consulting`، `type/[id]` و `service-providers/[id]` رو داره. صفحه‌های `shop`، `explore`، `provider`، `service`، `specialist` و پکیج‌ها canonical دارن ولی توی sitemap نیستن.

**تحویل:** هر URL ای که توی sitemap هست، canonical خودش باشه و 200 بده. هیچ URL ریدایرکتی توی sitemap نباشه.

**وضعیت فعلی:** `sitemap.ts` بازنویسی شده (روی `feat/seo-checklist-20261029` با محدودیت زبان):
- ✅ دارد: `home`، `categories`، `explore`، `shop`، `consulting`، `privacy-policy`، guideها (`/medical-tourism/...`)، `provider/[id]`، `service/[id]`، `specialist/[id]`، `shop/product/[slug]`، `shop/category/[slug]`.
- ✅ `type/[id]` و `service-providers/[id]` (که حالا ریدایرکت‌ان) حذف شدن.
- ✅ hreflang فقط برای زبان‌هایی که ترجمه واقعی دارن؛ categories فقط fa/en، shop فقط fa.
- ⬜ ندارد: `packages` و `packages/[packageId]` (این صفحه‌ها اصلا metadata/canonical ندارن)، `offers`، `featured`، `medical/clinics` (noindex).
- طبق چک‌لیست SEO برنچ، live روی production هنوز نسخه قبلیه (۱۰٬۳۱۷ آدرس). وضعیت برنچ: **NOT READY FOR RELEASE**.

---

## فاز ۳ — slug (بعد از تایید من) — ⬜

### T6. ستون slug
یه فایل مایگریشن بنویسید، فقط اضافه کردنی و nullable:

```sql
alter table category.service_providers add column if not exists slug text null;
alter table category.provider_types   add column if not exists slug text null;

create unique index if not exists service_providers_slug_uq
  on category.service_providers (slug) where slug is not null;
create unique index if not exists provider_types_slug_uq
  on category.provider_types (slug) where slug is not null;
```

برای خدمات، متخصص‌ها و پکیج‌ها هم همین کار. اسم دقیق جدول‌ها رو چک کنید.
پر کردن slug برای داده‌های فعلی رو **بدون هماهنگی با من** انجام ندید.

**اسم جدول‌ها (از کوئری sitemap):** `category.service_providers`، `category.provider_services` (خدمات)، `category.staff` (متخصص‌ها)، `category.provider_types`. پکیج‌ها از `features/special-packages` خونده می‌شن؛ جدولشون رو چک کنید. `shop.products` و `shop.categories` از قبل `slug` دارن.

### T7. پذیرفتن هم slug هم UUID در route
توی دوره گذار:
- اگه صفحه با UUID باز شد و slug داشت، `permanentRedirect` به آدرس slug.
- اگه slug خالی بود، همون UUID کار کنه.

هیچ صفحه‌ای نباید 404 بشه. slug بعد از انتشار عوض نشه. اگه لازم شد عوض بشه، slug قبلی رو یه جا نگه داریم و 301 بدیم.

---

## فاز ۴ — مسیرهای جدید و ریدایرکت (بعد از تایید من) — ⬜

### T8. ساخت مسیرهای جدید

| الان | بعد |
|---|---|
| `/fa/n/app/mobile/home` (و ریدایرکت 307 از `/fa`) | `/fa` |
| `/fa/n/app/mobile/explore` | `/fa/explore` |
| `/fa/type/[id]` | `/fa/specialties/[slug]` * |
| `/fa/n/app/mobile/categories` | `/fa/categories` |
| `/fa/service-providers/[id]` و `/fa/n/app/mobile/provider/[id]` | `/fa/providers/[slug]` |
| `/fa/n/app/mobile/medical/clinics` | `/fa/clinics` |
| `/fa/n/app/mobile/service/[id]` | `/fa/services/[slug]` |
| `.../service/[id]/gallery` | `/fa/services/[slug]/gallery` |
| `/fa/n/app/mobile/specialist/[id]` | `/fa/doctors/[slug]` * |
| `/fa/n/app/mobile/packages[/id]` | `/fa/packages[/slug]` |
| `/fa/n/app/mobile/offers` | `/fa/offers` |
| `/fa/n/app/mobile/featured` | `/fa/featured` |
| `/fa/n/app/mobile/shop` | `/fa/shop` |
| `.../shop/category/[slug]` | `/fa/shop/[slug]` |
| `.../shop/product/[slug]` | `/fa/products/[slug]` |
| `/fa/n/app/mobile/map-discovery` | `/fa/map` |

\* اسم نهایی منتظر تصمیم منه.

canonical هر صفحه جدید با `alternatesFor(locale, <مسیر جدید>)` ساخته بشه (یا `buildPublicMetadata` از `src/lib/seo/metadata.ts` که الان صفحه‌های عمومی ازش استفاده می‌کنن و hreflang رو هم فقط برای زبان‌های ترجمه‌شده می‌زنه).

**نمونه موفق:** guideها از اول روی `/<locale>/medical-tourism/<slug>` ساخته شدن و همین الگو رو دارن.

### T9. ریدایرکت 301 از آدرس‌های قدیمی
- مثل ریدایرکت `sponsered-slider` که قبلا زدیم. هم با locale هم بدون locale.
- ریدایرکت UUID به slug توی خود page، نه توی config.
- **زنجیره ممنوع.** مثلا `/service-providers/[id]` مستقیم بره `/providers/[slug]`. ← ریدایرکت‌های 308 فعلی `service-providers` و `type` در `next.config.ts` باید همزمان عوض بشن.
- ریدایرکت‌های فعلی `service-providers` و `type` فقط نسخه با locale رو دارن؛ نسخه بدون locale اضافه بشه.
- چون `next.config.ts` رو عوض می‌کنه، قبل از merge با من چک کنید.

### T10. آپدیت لینک‌های داخلی
همه `Link` و `router.push` هایی که `/n/app/mobile/` دارن به آدرس جدید عوض بشن. بعدش sitemap (T5) رو هم با آدرس‌های جدید آپدیت کنید (کوئری sitemap مسیرها رو به‌صورت رشته `'/n/app/mobile/provider/' || id` می‌سازه).

### T11. تست
از هر الگو یه نمونه با `curl -I` بزنید: باید یه 301 بده و بعد 200. نتیجه رو توی PR بذارید. تست e2e موجود `e2e/public-seo.spec.ts` رو هم برای آدرس‌های جدید گسترش بدید.

---

## فاز ۵ — یکپارچه‌سازی حساب کاربری — ⬜

### T12. یکی کردن profile زیر account

| الان | بعد |
|---|---|
| `/profile/**` و `/n/app/mobile/profile/**` | `/account/**` |
| `.../profile/EditProfile` | `/account/edit` |
| `.../my-wallet/**` و `.../wallet` | `/account/wallet/**` |
| `/n/app/mobile/bookings/[id]` | `/account/bookings/[id]` |
| `.../shop/orders` | `/account/orders` |
| `notifications`، `support`، `bug-reports` | `/account/...` |
| `/n/app/mobile/search`، `search-results` | `/search?q=` |

همه noindex بمونن و به robots اضافه بشن (`/*/account`، `/*/book`، `/*/shop/cart`، `/*/shop/checkout`). `/*/search` رو disallow نکنید، چون noindex,follow است (بالای T2 رو ببینید).

### T13. حذف booking-v2
فقط یه نسخه بمونه، زیر `/fa/book`. قبلی‌ها 301 بگیرن. (هر دو `booking` و `booking-v2` هنوز هستن و noindex دارن.)

---

## کارهای کوچیک جدا

- **T14.** ⬜ توی `next.config.ts` مقدار `localePattern` هنوز `"en|fa|tr|ar|es|ku|de|fr"` است، ولی `routing.locales` ۱۱ زبانه (`ru`، `tg`، `zh` جا افتادن). فقط روی rewrite های `booking` اثر داره و اون rewrite ها فقط وقتی `BOOKING_ORIGIN` ست شده فعالن (production پشت Caddy خالیه). چک کنید و به من خبر بدید. ریدایرکت‌های جدید درست از `routing.locales.join("|")` استفاده می‌کنن.
- **T15.** ⬜ `service-definitions-new` توی admin باید با `service-definitions` یکی بشه. کار کدیه، عجله‌ای نیست.
- **T16.** ⬜ صفحه‌های جدید پنل از `new` و `[id]/edit` استفاده کنن. صفحه‌های قدیمی که `add` و `update` دارن رو دست نزنید.
- `trailingSlash` رو تنظیم نکنید. پیش‌فرض Next (بدون اسلش) همونیه که می‌خوایم. (هنوز تنظیم نشده ✅)
- **T17 (جدید).** `support`، `offers`، `featured`، `packages` و `packages/[packageId]` هیچ robots یا canonical ندارن. `support` noindex بشه (T1)؛ بقیه با `buildPublicMetadata` canonical بگیرن و به sitemap اضافه بشن (T5).
- **T18 (جدید).** برنچ‌های `feat/seo-checklist-20261029` و `feat/seo-geo-lsevincare` هنوز توی `Lsevin-New` merge نشدن. قبل از شروع فاز ۳ اول این‌ها merge بشن تا روی sitemap و `categories/page.tsx` کانفلیکت نخوریم.

---

## چیزهایی که باید من تصمیم بگیرم
قبل از فاز ۳ جوابشون رو می‌دم:
1. `doctors` یا `specialists`؟ (gym و tour و transfer هم داریم)
2. `/type/[id]` بشه `specialties` یا `categories`؟ (الان همه‌شون با 308 به `categories` می‌رن)
3. **(جدید)** home: بمونه روی `/n/app/mobile/home` تا فاز ۴، یا الان با T8 بیاد روی `/<locale>`؟

---

## چک‌لیست قبل از merge هر صفحه عمومی جدید
- [ ] آدرس `/<locale>/<section>/<slug>`، حروف کوچک، بدون اسلش آخر
- [ ] canonical با `alternatesFor` یا `buildPublicMetadata` روی آدرس جدید
- [ ] توی sitemap هست و 200 می‌ده
- [ ] آدرس قدیمی با یه 301 مستقیم میاد اینجا
- [ ] لینک‌های داخلی آپدیت شدن
- [ ] صفحه‌های فیلتر و جستجو canonical بدون پارامتر دارن (یا noindex,follow)

## Decisions recorded 1 November 2026

- Specialist public path: `/<locale>/specialists/[slug]`.
- Provider-type public path: `/<locale>/specialties/[slug]`.
- Home stays at `/<locale>/n/app/mobile/home` for this migration.
- Existing-data slug values still require a separate reviewed backfill; the nullable schema migration does not populate them.

## Implementation note — branch `feat/seo-url-tasks-20261101`

- Added support and package-checkout private robots metadata; added matching private mobile paths to robots.txt. Home remains indexable, and search remains crawlable with `noindex,follow`.
- Added canonical metadata for offers, featured services, package listing, and package detail; added eligible Persian paths to the sitemap. Other locales remain reachable with `noindex,follow` until their main content is reviewed.
- `0091_public_url_slugs.sql` adds nullable, unique slug columns to providers, provider types, provider services, staff, and special packages. It does not populate slugs or change public routes.
- An isolated copy of the earlier SEO fixture accepted the migration: all five columns are nullable, all five unique indexes exist, and a duplicate provider slug was rejected. That fixture has no package rows and does not establish the current production migration state.
- The final route migration, internal-link changes, redirects, deployment, and production verification remain open.
- Verification on the exact branch commit: SEO unit suite 121/121 passed; a production-mode build on F: exited successfully after compiling and generating 2,313 static pages. That build used a non-production database endpoint and logged connection failures, so it is not a runtime or data-integrity pass.
- Repository-wide typecheck still exits nonzero with 2,285 diagnostic lines; the changed SEO files have no remaining type diagnostic. Targeted lint reports four existing app-import boundary violations in the offers, featured, and packages pages. The persistent Playwright suite has not run against a deployed candidate.
- No production slug backfill was run. A reviewed mapping of current production records is required before the slug-based redirects and internal-link cutover can safely ship.
