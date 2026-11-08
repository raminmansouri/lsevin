import type { Metadata } from "next";
import { headers } from "next/headers";

import { SHOP_API_RATE_LIMIT_PER_MINUTE } from "@/features/shop-api/server/auth";
import { SHOP_API_MAX_BODY_BYTES } from "@/features/shop-api/server/route";

/**
 * Persian guide for client websites that use the Shop API (given to clients together with their
 * token). Written in Persian on purpose; code samples stay left-to-right.
 */

export const metadata: Metadata = {
  title: "راهنمای API فروشگاه السوین برای فروشندگان",
  description: "راهنمای اتصال وب‌سایت فروشندگان به فروشگاه السوین: توکن، دسترسی‌ها، محصولات، قیمت و موجودی، خطاها.",
  robots: { index: false, follow: false },
};

async function apiBase() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "appmain.lsevin.com";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/api/shop/v1`;
}

function Code({ children }: { children: string }) {
  return (
    <pre dir="ltr" className="overflow-x-auto rounded-xl bg-gray-900 p-4 text-left text-[13px] leading-6 text-gray-100">
      <code>{children}</code>
    </pre>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

const Ltr = ({ children }: { children: React.ReactNode }) => (
  <code dir="ltr" className="rounded bg-gray-100 px-1.5 py-0.5 text-[13px] text-gray-800">{children}</code>
);

const SCOPES: Array<[string, string]> = [
  ["products:read", "دیدن محصولاتی که خودتان ساخته‌اید"],
  ["products:write", "ساخت محصول جدید و ویرایش محصولات خودتان"],
  ["products:delete", "حذف محصولات خودتان"],
  ["offers:read", "دیدن قیمت و موجودی‌هایی که ثبت کرده‌اید"],
  ["offers:write", "ثبت و تغییر قیمت و موجودی"],
  ["offers:delete", "حذف قیمت و موجودی (توقف فروش)"],
  ["catalog:read", "دیدن کاتالوگ عمومی فروشگاه و دسته‌بندی‌ها"],
];

const ENDPOINTS: Array<[string, string, string, string]> = [
  ["GET", "/me", "—", "مشخصات توکن: نام، فروشنده و دسترسی‌ها (برای آزمایش اتصال)"],
  ["GET", "/products", "products:read", "فهرست محصولات خودتان (صفحه‌بندی؛ فیلتر ?status=draft|active|archived)"],
  ["POST", "/products", "products:write", "ساخت محصول (پیش‌نویس، در انتظار تأیید)"],
  ["GET", "/products/{id}", "products:read", "جزئیات یک محصول خودتان"],
  ["PATCH", "/products/{id}", "products:write", "ویرایش محتوای محصول"],
  ["DELETE", "/products/{id}", "products:delete", "حذف محصول"],
  ["GET", "/offers", "offers:read", "فهرست قیمت و موجودی‌های شما (?productId=)"],
  ["POST", "/offers", "offers:write", "ثبت قیمت و موجودی برای یک کالا"],
  ["GET", "/offers/{id}", "offers:read", "جزئیات یک پیشنهاد"],
  ["PATCH", "/offers/{id}", "offers:write", "تغییر قیمت، موجودی یا فعال/غیرفعال کردن فروش"],
  ["DELETE", "/offers/{id}", "offers:delete", "حذف پیشنهاد (توقف فروش آن کالا)"],
  ["GET", "/catalog/products", "catalog:read", "جستجو در کاتالوگ عمومی (?search=&categoryId=)"],
  ["GET", "/catalog/products/{id}/variants", "catalog:read", "مدل‌های (سایز/رنگ) یک کالای کاتالوگ"],
  ["GET", "/catalog/categories", "catalog:read", "دسته‌بندی‌های فروشگاه"],
];

const ERRORS: Array<[string, string, string]> = [
  ["401", "unauthorized", "توکن ارسال نشده، اشتباه است، باطل یا منقضی شده، یا فروشنده غیرفعال است."],
  ["403", "forbidden", "توکن این دسترسی را ندارد (نام دسترسی لازم در details.requiredScope آمده است)."],
  ["404", "not_found", "چنین موردی وجود ندارد یا متعلق به فروشنده دیگری است."],
  ["409", "conflict", "تکراری است؛ مثلاً برای این کالا قبلاً قیمت ثبت کرده‌اید."],
  ["413", "payload_too_large", `بدنه درخواست از ${SHOP_API_MAX_BODY_BYTES / 1024} کیلوبایت بزرگ‌تر است.`],
  ["422", "validation_error", "داده‌ها معتبر نیست؛ فهرست فیلدهای مشکل‌دار در details آمده است."],
  ["429", "rate_limited", `بیش از ${SHOP_API_RATE_LIMIT_PER_MINUTE} درخواست در دقیقه؛ به اندازه سرآیند Retry-After صبر کنید.`],
  ["500", "internal_error", "خطای سمت ما؛ کمی بعد دوباره تلاش کنید و اگر تکرار شد به ما خبر دهید."],
];

export default async function ShopApiGuidePage() {
  const base = await apiBase();

  return (
    <article lang="fa" dir="rtl" className="mx-auto max-w-4xl space-y-10 px-5 py-10 leading-8 text-gray-800" data-testid="shop-api-guide">
      <header className="space-y-3">
        <h1 className="text-3xl font-extrabold text-gray-900">راهنمای API فروشگاه السوین</h1>
        <p>
          این راهنما برای تیم فنی وب‌سایت‌هایی است که می‌خواهند محصولات، قیمت و موجودی خود را از طریق برنامه خودشان در فروشگاه
          السوین مدیریت کنند. هر وب‌سایت یک «فروشنده» در السوین است و با توکنی که از ما می‌گیرد فقط به داده‌های خودش دسترسی دارد.
        </p>
        <nav aria-label="فهرست مطالب" className="rounded-2xl bg-gray-50 p-4 text-sm">
          <ol className="list-decimal space-y-1 pr-5">
            <li><a className="text-[#083f30] underline" href="#basics">شروع کار و امنیت توکن</a></li>
            <li><a className="text-[#083f30] underline" href="#scopes">دسترسی‌ها</a></li>
            <li><a className="text-[#083f30] underline" href="#rules">قواعد: داده‌های شما، تأیید و انتشار</a></li>
            <li><a className="text-[#083f30] underline" href="#endpoints">فهرست آدرس‌ها</a></li>
            <li><a className="text-[#083f30] underline" href="#products">محصولات</a></li>
            <li><a className="text-[#083f30] underline" href="#offers">قیمت و موجودی (پیشنهادها)</a></li>
            <li><a className="text-[#083f30] underline" href="#catalog">کاتالوگ و دسته‌بندی‌ها</a></li>
            <li><a className="text-[#083f30] underline" href="#errors">خطاها، محدودیت‌ها و صفحه‌بندی</a></li>
            <li><a className="text-[#083f30] underline" href="#checklist">چک‌لیست راه‌اندازی</a></li>
          </ol>
        </nav>
      </header>

      <Section id="basics" title="۱. شروع کار و امنیت توکن">
        <p>آدرس پایه همه درخواست‌ها:</p>
        <Code>{base}</Code>
        <p>
          توکن را در سرآیند <Ltr>Authorization</Ltr> هر درخواست بفرستید. بدنه درخواست‌ها و پاسخ‌ها JSON است، پس سرآیند{" "}
          <Ltr>Content-Type: application/json</Ltr> را هم بفرستید. برای آزمایش اتصال:
        </p>
        <Code>{`curl ${base}/me \\
  -H "Authorization: Bearer lsv_YOUR_TOKEN"`}</Code>
        <p>پاسخ نمونه:</p>
        <Code>{`{
  "data": {
    "tokenName": "Mehr pharmacy website",
    "seller": { "id": "8c1d…", "slug": "mehr-pharmacy" },
    "scopes": ["products:read", "products:write", "offers:read", "offers:write", "catalog:read"]
  }
}`}</Code>
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-bold">نکات امنیتی مهم</p>
          <ul className="list-disc space-y-1 pr-5">
            <li>توکن مثل رمز عبور است. آن را فقط روی سرور خود نگه دارید (مثلاً در متغیر محیطی)، نه در کد سمت مرورگر، اپلیکیشن موبایل یا مخزن کد.</li>
            <li>درخواست‌ها را فقط از سرور خود بفرستید. مرورگرها اجازه فراخوانی مستقیم این API را ندارند.</li>
            <li>توکن فقط یک بار به ما نمایش داده می‌شود و ما نسخه قابل‌خواندن آن را نگه نمی‌داریم. اگر گم شد یا احتمال افشا دارد، فوراً به ما خبر دهید تا باطلش کنیم و توکن تازه بدهیم.</li>
            <li>هر توکن ممکن است تاریخ انقضا داشته باشد. پیش از انقضا برای توکن جدید با ما هماهنگ کنید.</li>
          </ul>
        </div>
      </Section>

      <Section id="scopes" title="۲. دسترسی‌ها">
        <p>هر توکن فقط کارهایی را می‌تواند انجام دهد که دسترسی آن را دارد. اگر به دسترسی دیگری نیاز دارید، از ما بخواهید.</p>
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-right">دسترسی</th><th className="p-3 text-right">کاربرد</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {SCOPES.map(([scope, text]) => (
                <tr key={scope}><td className="p-3"><Ltr>{scope}</Ltr></td><td className="p-3">{text}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="rules" title="۳. قواعد: داده‌های شما، تأیید و انتشار">
        <ul className="list-disc space-y-2 pr-5">
          <li><strong>فقط داده‌های خودتان:</strong> هر چیزی که متعلق به فروشنده دیگری باشد برای شما «پیدا نشد» (۴۰۴) برمی‌گرداند؛ حتی وجودش هم معلوم نمی‌شود.</li>
          <li><strong>محصول جدید</strong> به‌صورت پیش‌نویس (<Ltr>status: draft</Ltr>) ساخته می‌شود و پس از تأیید کارشناس السوین در فروشگاه نمایش داده می‌شود (<Ltr>active</Ltr>). وضعیت بررسی در <Ltr>review.status</Ltr> است: <Ltr>pending</Ltr> (در انتظار)، <Ltr>approved</Ltr> (تأییدشده) یا <Ltr>rejected</Ltr> (ردشده، با دلیل در <Ltr>review.note</Ltr>).</li>
          <li><strong>ویرایش محصولی که هنوز تأیید نشده</strong> همان لحظه اعمال می‌شود و محصول دوباره در صف بررسی می‌رود (برای محصول ردشده هم همین است؛ ایراد را اصلاح کنید و دوباره بفرستید).</li>
          <li><strong>ویرایش محصول تأییدشده</strong> تا تأیید ما منتظر می‌ماند و نسخه فعلی در فروشگاه تغییر نمی‌کند. پاسخ آن کد <Ltr>202</Ltr> با <Ltr>&quot;pendingReview&quot;: true</Ltr> است و تغییرات در انتظار در <Ltr>review.pendingChanges</Ltr> دیده می‌شود. ویرایش‌های بعدی با ویرایش در انتظار ادغام می‌شوند.</li>
          <li><strong>قیمت و موجودی</strong> (پیشنهادها) نیاز به تأیید ندارد و بلافاصله اعمال می‌شود.</li>
          <li><strong>واحد پول</strong> محصول هنگام ساخت تعیین می‌شود (پیش‌فرض <Ltr>IRR</Ltr> یعنی ریال) و همه قیمت‌های آن محصول با همان واحد است. مبلغ‌ها عدد هستند، بدون جداکننده.</li>
          <li><strong>تصاویر</strong> را با آدرس عمومی <Ltr>https</Ltr> بفرستید (حداکثر ۱۰ تصویر؛ اولی تصویر اصلی است).</li>
          <li><strong>متن‌های چندزبانه</strong> (نام، توضیح کوتاه، توضیحات) شیئی با کلید زبان هستند، مثل <Ltr>{`{"fa": "…", "en": "…"}`}</Ltr>. حداقل یک زبان برای نام لازم است. زبان‌های مجاز: fa, en, ar, tr, es, ku, de, fr, ru, tg, zh.</li>
          <li>فیلدهای ناشناخته پذیرفته نمی‌شوند (خطای ۴۲۲)؛ پس غلط تایپی بی‌صدا نادیده گرفته نمی‌شود.</li>
        </ul>
      </Section>

      <Section id="endpoints" title="۴. فهرست آدرس‌ها">
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr><th className="p-3 text-right">متد</th><th className="p-3 text-right">آدرس</th><th className="p-3 text-right">دسترسی لازم</th><th className="p-3 text-right">کار</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ENDPOINTS.map(([method, path, scope, text]) => (
                <tr key={`${method} ${path}`}>
                  <td className="p-3"><Ltr>{method}</Ltr></td>
                  <td className="p-3"><Ltr>{path}</Ltr></td>
                  <td className="p-3">{scope === "—" ? "—" : <Ltr>{scope}</Ltr>}</td>
                  <td className="p-3">{text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="products" title="۵. محصولات">
        <h3 className="font-bold">ساخت محصول</h3>
        <p>
          محصول را همراه با قیمت و موجودی (اختیاری) بسازید. اگر <Ltr>slug</Ltr> (نامک انگلیسی آدرس) نفرستید از نام انگلیسی
          ساخته می‌شود و اگر تکراری باشد شماره به آخرش اضافه می‌شود.
        </p>
        <Code>{`curl -X POST ${base}/products \\
  -H "Authorization: Bearer lsv_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": { "fa": "ویتامین D3 هزار واحد", "en": "Vitamin D3 1000 IU" },
    "shortDescription": { "fa": "۶۰ عدد کپسول نرم" },
    "description": { "fa": "مکمل ویتامین D3 برای ..." },
    "slug": "vitamin-d3-1000",
    "categoryIds": ["CATEGORY_ID"],
    "primaryCategoryId": "CATEGORY_ID",
    "images": ["https://example.com/images/d3.jpg"],
    "currency": "IRR",
    "offer": { "price": 4500000, "compareAtPrice": 5200000, "stockQuantity": 40, "sellerSku": "D3-1000" }
  }'`}</Code>
        <p>پاسخ (کد <Ltr>201</Ltr>):</p>
        <Code>{`{
  "data": {
    "id": "5b0e…",
    "slug": "vitamin-d3-1000",
    "status": "draft",
    "review": { "status": "pending", "note": null, "pendingChanges": null },
    "name": { "fa": "ویتامین D3 هزار واحد", "en": "Vitamin D3 1000 IU" },
    "shortDescription": { "fa": "۶۰ عدد کپسول نرم" },
    "description": { "fa": "مکمل ویتامین D3 برای ..." },
    "currency": "IRR",
    "primaryCategoryId": "CATEGORY_ID",
    "categoryIds": ["CATEGORY_ID"],
    "images": ["https://example.com/images/d3.jpg"],
    "createdAt": "2026-11-07T09:30:00.000Z",
    "updatedAt": "2026-11-07T09:30:00.000Z"
  }
}`}</Code>
        <p>فیلدهای محصول:</p>
        <ul className="list-disc space-y-1 pr-5 text-sm">
          <li><Ltr>name</Ltr> (الزامی، حداکثر ۲۰۰ نویسه در هر زبان) — <Ltr>shortDescription</Ltr> (حداکثر ۵۰۰) — <Ltr>description</Ltr> (حداکثر ۲۰٬۰۰۰، متن ساده)</li>
          <li><Ltr>slug</Ltr>: حروف کوچک انگلیسی، عدد و خط تیره، مثل <Ltr>vitamin-d3-1000</Ltr></li>
          <li><Ltr>categoryIds</Ltr> (حداکثر ۲۰) و <Ltr>primaryCategoryId</Ltr>: شناسه‌ها را از <Ltr>/catalog/categories</Ltr> بگیرید</li>
          <li><Ltr>images</Ltr>: حداکثر ۱۰ آدرس — <Ltr>currency</Ltr>: سه حرف، پیش‌فرض <Ltr>IRR</Ltr> (فقط هنگام ساخت)</li>
          <li><Ltr>offer</Ltr>: همان فیلدهای بخش قیمت و موجودی (بدون <Ltr>productId</Ltr>)</li>
        </ul>

        <h3 className="font-bold">فهرست و جزئیات</h3>
        <Code>{`curl "${base}/products?page=1&pageSize=20&status=active" -H "Authorization: Bearer lsv_YOUR_TOKEN"
curl ${base}/products/PRODUCT_ID -H "Authorization: Bearer lsv_YOUR_TOKEN"`}</Code>

        <h3 className="font-bold">ویرایش</h3>
        <p>فقط فیلدهایی را که تغییر می‌کنند بفرستید. قیمت و موجودی را از بخش پیشنهادها تغییر دهید.</p>
        <Code>{`curl -X PATCH ${base}/products/PRODUCT_ID \\
  -H "Authorization: Bearer lsv_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "shortDescription": { "fa": "۹۰ عدد کپسول نرم" } }'`}</Code>
        <p>
          پاسخ <Ltr>200</Ltr> یعنی تغییر اعمال شد (محصول هنوز تأیید نشده بود). پاسخ <Ltr>202</Ltr> با{" "}
          <Ltr>&quot;pendingReview&quot;: true</Ltr> یعنی محصول تأییدشده است و تغییر پس از تأیید ما منتشر می‌شود.
        </p>

        <h3 className="font-bold">حذف</h3>
        <p>محصول از فروشگاه برداشته می‌شود و همه قیمت‌ها و ویرایش‌های در انتظار آن هم حذف می‌شوند. پاسخ <Ltr>204</Ltr> بدون بدنه است.</p>
        <Code>{`curl -X DELETE ${base}/products/PRODUCT_ID -H "Authorization: Bearer lsv_YOUR_TOKEN"`}</Code>
      </Section>

      <Section id="offers" title="۶. قیمت و موجودی (پیشنهادها)">
        <p>
          «پیشنهاد» یعنی قیمت و موجودی شما برای یک کالا. می‌توانید برای محصولات خودتان و نیز برای کالاهای فعال کاتالوگ عمومی
          السوین پیشنهاد ثبت کنید. برای هر کالا (یا هر مدلِ آن) فقط یک پیشنهاد دارید؛ برای تغییرش از <Ltr>PATCH</Ltr> استفاده کنید.
          این تغییرات بلافاصله اعمال می‌شود.
        </p>
        <Code>{`curl -X POST ${base}/offers \\
  -H "Authorization: Bearer lsv_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "productId": "PRODUCT_ID", "price": 4300000, "stockQuantity": 25, "sellerSku": "D3-1000", "handlingDays": 2 }'

curl -X PATCH ${base}/offers/OFFER_ID \\
  -H "Authorization: Bearer lsv_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{ "price": 4100000, "stockQuantity": 18 }'`}</Code>
        <ul className="list-disc space-y-1 pr-5 text-sm">
          <li><Ltr>price</Ltr> (الزامی هنگام ساخت) و <Ltr>compareAtPrice</Ltr> (قیمت قبل از تخفیف؛ نباید کمتر از price باشد)</li>
          <li><Ltr>stockQuantity</Ltr>: موجودی؛ <Ltr>null</Ltr> یعنی موجودی را پیگیری نمی‌کنید</li>
          <li><Ltr>sellerSku</Ltr>: کد کالای شما — <Ltr>handlingDays</Ltr>: روزهای آماده‌سازی ارسال</li>
          <li><Ltr>isActive</Ltr>: با <Ltr>false</Ltr> فروش آن کالا موقتاً متوقف می‌شود</li>
          <li><Ltr>variantId</Ltr>: برای کالاهای چندمدلی (سایز/رنگ) لازم است؛ از آدرس variants کاتالوگ بگیرید</li>
          <li>واحد پول پیشنهاد همیشه همان واحد پول محصول است.</li>
        </ul>
      </Section>

      <Section id="catalog" title="۷. کاتالوگ و دسته‌بندی‌ها">
        <Code>{`curl "${base}/catalog/categories" -H "Authorization: Bearer lsv_YOUR_TOKEN"
curl "${base}/catalog/products?search=vitamin&page=1" -H "Authorization: Bearer lsv_YOUR_TOKEN"
curl "${base}/catalog/products/PRODUCT_ID/variants" -H "Authorization: Bearer lsv_YOUR_TOKEN"`}</Code>
        <p>کاتالوگ عمومی فقط کالاهای فعال خود السوین را نشان می‌دهد؛ محصولات فروشندگان دیگر در آن نیست.</p>
      </Section>

      <Section id="errors" title="۸. خطاها، محدودیت‌ها و صفحه‌بندی">
        <p>همه خطاها این شکل را دارند:</p>
        <Code>{`{
  "error": {
    "code": "validation_error",
    "message": "The request body or query is not valid.",
    "details": [ { "field": "offer.price", "message": "Too small: expected number to be >=0" } ]
  }
}`}</Code>
        <div className="overflow-x-auto rounded-2xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-right">کد HTTP</th><th className="p-3 text-right">code</th><th className="p-3 text-right">معنی</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {ERRORS.map(([status, code, text]) => (
                <tr key={code}><td className="p-3"><Ltr>{status}</Ltr></td><td className="p-3"><Ltr>{code}</Ltr></td><td className="p-3">{text}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="list-disc space-y-1 pr-5">
          <li>حداکثر {SHOP_API_RATE_LIMIT_PER_MINUTE.toLocaleString("fa-IR")} درخواست در دقیقه برای هر توکن. در پاسخ ۴۲۹ به اندازه سرآیند <Ltr>Retry-After</Ltr> (ثانیه) صبر کنید.</li>
          <li>فهرست‌ها صفحه‌بندی دارند: <Ltr>page</Ltr> (از ۱) و <Ltr>pageSize</Ltr> (پیش‌فرض ۲۰، حداکثر ۱۰۰). پاسخ شامل <Ltr>data</Ltr>، <Ltr>page</Ltr>، <Ltr>pageSize</Ltr> و <Ltr>total</Ltr> است.</li>
          <li>زمان‌ها به وقت جهانی (UTC) و در قالب ISO 8601 هستند.</li>
          <li>برای خطای ۵۰۰ و ۴۲۹ می‌توانید با فاصله دوباره تلاش کنید؛ برای ۴۰۰‌ها داده را اصلاح کنید.</li>
        </ul>
      </Section>

      <Section id="checklist" title="۹. چک‌لیست راه‌اندازی">
        <ol className="list-decimal space-y-1 pr-5">
          <li>توکن را از السوین بگیرید و در متغیر محیطی سرور خود ذخیره کنید.</li>
          <li>با <Ltr>GET /me</Ltr> اتصال و دسترسی‌ها را بررسی کنید.</li>
          <li>شناسه دسته‌ها را از <Ltr>/catalog/categories</Ltr> بگیرید و با دسته‌های خودتان تطبیق دهید.</li>
          <li>محصولات را با <Ltr>POST /products</Ltr> بسازید و <Ltr>id</Ltr> هر کدام را در سیستم خودتان نگه دارید.</li>
          <li>با <Ltr>GET /products?status=draft</Ltr> وضعیت بررسی را دنبال کنید؛ دلیل رد در <Ltr>review.note</Ltr> است.</li>
          <li>تغییرات قیمت و موجودی را با <Ltr>PATCH /offers/{"{id}"}</Ltr> همگام کنید (مثلاً بعد از هر فروش در سایت خودتان).</li>
        </ol>
        <p>برای پرسش یا درخواست دسترسی جدید با پشتیبانی السوین تماس بگیرید.</p>
      </Section>
    </article>
  );
}
