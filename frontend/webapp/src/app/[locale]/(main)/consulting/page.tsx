import { Suspense } from "react";

import MultiServerFetchResult from "@/components/fetcher/multi-fetch.server";
import LocaleBoundary from "@/components/locale/locale-boundary";
import { withBaseHeaders } from "@/config/http/http-service.server";
import {
  ConsultingForm,
  ConsultingFormSkeleton,
} from "@/features/consulting/components/consulting-form";
import { TRANSLATION_KEY } from "@/features/consulting/types/constants";
import { absoluteUrl } from "@/lib/seo/alternates";
import { breadcrumbList, graph, organizationId } from "@/lib/seo/entity-schema";
import { JsonLd } from "@/lib/seo/json-ld";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { getUserDocuments } from "@/features/shared/api/server/get-user-documents";
import { IUserDocuments } from "@/features/shared/types/user";
import { LocalePageProps, LocaleParams } from "@/types/next";

// The Consulting.page catalog strings are still placeholders ("Page Title") in
// several languages, so the crawler-facing copy lives here.
const SEO_COPY: Record<string, { title: string; description: string }> = {
  fa: {
    title: "مشاوره رایگان درمان در ایران | السوین",
    description:
      "درخواست مشاوره رایگان برای درمان، جراحی زیبایی، دندانپزشکی و اقامت درمانی در ایران؛ کارشناسان السوین پزشک، مرکز درمانی و هتل مناسب را پیشنهاد می‌دهند.",
  },
  en: {
    title: "Free Treatment Consultation in Iran | LSevin",
    description:
      "Request a free consultation for treatment, cosmetic surgery, dental care or a medical stay in Iran. LSevin suggests suitable specialists, clinics and hotels.",
  },
  ar: {
    title: "استشارة علاجية مجانية في إيران | LSevin",
    description:
      "اطلب استشارة مجانية للعلاج أو جراحة التجميل أو طب الأسنان أو الإقامة العلاجية في إيران، ويقترح فريق LSevin الأطباء والمراكز والفنادق المناسبة.",
  },
  tr: {
    title: "İran'da Ücretsiz Tedavi Danışmanlığı | LSevin",
    description:
      "İran'da tedavi, estetik cerrahi, diş tedavisi veya sağlık konaklaması için ücretsiz danışmanlık isteyin; LSevin uygun uzman, klinik ve oteli önerir.",
  },
  ru: {
    title: "Бесплатная консультация по лечению в Иране | LSevin",
    description:
      "Оставьте заявку на бесплатную консультацию по лечению, пластической хирургии, стоматологии или проживанию в Иране. LSevin подберёт врачей, клиники и отели.",
  },
  ku: {
    title: "ڕاوێژی بێبەرامبەری چارەسەری لە ئێران | LSevin",
    description:
      "داوای ڕاوێژی بێبەرامبەر بکە بۆ چارەسەری، نەشتەرگەری جوانکاری، ددان یان مانەوەی چارەسەری لە ئێران؛ LSevin دکتۆر، ناوەند و هۆتێلی گونجاو پێشنیار دەکات.",
  },
  tg: {
    title: "Машварати ройгони табобат дар Эрон | LSevin",
    description:
      "Барои табобат, ҷарроҳии зебоӣ, дандонпизишкӣ ё иқомати табобатӣ дар Эрон машварати ройгон дархост кунед; LSevin духтур, клиника ва меҳмонхонаи мувофиқро пешниҳод мекунад.",
  },
  zh: {
    title: "伊朗就医免费咨询 | LSevin",
    description: "免费咨询在伊朗的治疗、整形手术、牙科或医疗住宿。LSevin 为您推荐合适的专科医生、诊所和酒店。",
  },
  de: {
    title: "Kostenlose Behandlungsberatung im Iran | LSevin",
    description:
      "Kostenlose Beratung zu Behandlung, Schönheitschirurgie, Zahnmedizin oder medizinischem Aufenthalt im Iran anfragen. LSevin empfiehlt passende Ärzte, Kliniken und Hotels.",
  },
  fr: {
    title: "Consultation gratuite pour un traitement en Iran | LSevin",
    description:
      "Demandez une consultation gratuite pour un traitement, une chirurgie esthétique, des soins dentaires ou un séjour médical en Iran. LSevin propose médecins, cliniques et hôtels.",
  },
  es: {
    title: "Consulta gratuita de tratamiento en Irán | LSevin",
    description:
      "Solicita una consulta gratuita para tratamiento, cirugía estética, odontología o estancia médica en Irán. LSevin sugiere especialistas, clínicas y hoteles adecuados.",
  },
};

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const copy = SEO_COPY[locale] ?? SEO_COPY.en;
  return buildPublicMetadata({
    locale,
    path: "/consulting",
    title: copy.title,
    descriptions: [copy.description],
  });
}

const ConsultingPage = ({ params }: { params: Promise<LocaleParams> }) => {
  return (
    <>
      <ConsultingSeo params={params} />
      <Suspense fallback={<ConsultingFormSkeleton />}>
        <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
          {(_) => (
            <div className="container">
              <Suspense fallback={<ConsultingFormSkeleton />}>
                <SuspenseBoundary />
              </Suspense>
            </div>
          )}
        </LocaleBoundary>
      </Suspense>
    </>
  );
};

// Server-rendered heading and structured data, outside the form's Suspense
// boundary so both are in the initial HTML.
const ConsultingSeo = async ({ params }: { params: Promise<LocaleParams> }) => {
  const { locale } = await params;
  const copy = SEO_COPY[locale] ?? SEO_COPY.en;
  const heading = copy.title.split(" | ")[0];
  const url = absoluteUrl(locale, "/consulting");
  return (
    <>
      <JsonLd
        data={graph(
          {
            "@type": "Service",
            "@id": `${url}#service`,
            name: heading,
            description: copy.description,
            url,
            serviceType: "Medical travel consultation",
            areaServed: { "@type": "Country", name: "Iran" },
            provider: { "@id": organizationId() },
          },
          breadcrumbList([
            { name: copy.title.split(" | ")[1] ?? "LSevin", url: absoluteUrl(locale, "/n/app/mobile/home") },
            { name: heading, url },
          ])
        )}
      />
      <div className="container pt-4">
        <h1 className="text-xl font-bold">{heading}</h1>
      </div>
    </>
  );
};

const SuspenseBoundary = async () => {
  const userDocumentsPromise = withBaseHeaders((locale, token, userId) =>
    getUserDocuments({ locale, token, userId })
  );

  const [userDocuments] = await Promise.all([userDocumentsPromise]);

  return (
    <MultiServerFetchResult<[IUserDocuments[]]> results={[userDocuments]}>
      {([documentsData]) => <ConsultingForm documents={documentsData} />}
    </MultiServerFetchResult>
  );
};

export default ConsultingPage;
