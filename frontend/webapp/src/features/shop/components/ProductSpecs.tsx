import { getTranslations } from "next-intl/server";

import { getProductSpecs } from "../api/specs.repository";

export async function ProductSpecs({ productId, locale }: { productId: string; locale: string }) {
  const specs = await getProductSpecs(productId, locale).catch(() => []);
  if (!specs.length) return null;
  const t = await getTranslations({ locale, namespace: "Shop" });

  return (
    <section className="mt-2 bg-white p-4">
      <h2 className="mb-3 text-sm font-bold text-neutral-900">{t("specifications")}</h2>
      <dl className="divide-y divide-neutral-100 rounded-xl border border-neutral-100">
        {specs.map((spec) => (
          <div key={spec.attributeId} className="flex items-start justify-between gap-4 px-3 py-2.5 text-sm">
            <dt className="text-neutral-500">{spec.name}</dt>
            <dd className="text-end font-medium text-neutral-900">{spec.values.join("، ")}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}