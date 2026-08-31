'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FormBuilderDesigner } from '@/features/form-builder/components/FormBuilderDesigner';

async function getForm(formId: string, failedMessage: string) {
  const res = await fetch(`/api/form-builder/forms?formId=${formId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(failedMessage);
  return res.json();
}

export default function AdminFormBuilderDetailPage({ params }: { params: Promise<{ formId: string; locale?: string }> }) {
  const router = useRouter();
  const t = useTranslations('FormBuilder.pages');
  const [initial, setInitial] = useState<any>(undefined);
  const [formId, setFormId] = useState<string | null>(null);
  const [locale, setLocale] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    params
      .then(async ({ formId, locale }) => {
        if (cancelled) return;
        setFormId(formId);
        setLocale(locale ?? null);
        setLoadError(null);

        if (formId === 'new') {
          setInitial(undefined);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        const { item } = await getForm(formId, t('failedToLoadForm'));
        if (!cancelled) {
          setInitial(item);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : t('failedToLoadForm'));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params, t]);

  return (
    <div className="w-full max-w-none px-6 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{formId === 'new' ? t('createForm') : t('editForm')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('detailDescription')}</p>
        </div>
        {formId && formId !== 'new' ? (
          <Link href={locale ? `/${locale}/admin/form-builder/${formId}/submissions` : `/admin/form-builder/${formId}/submissions`} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            {t('viewSubmittedValues')}
          </Link>
        ) : null}
      </div>

      {loadError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div> : null}

      {isLoading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">{t('loadingFormDefinition')}</div>
      ) : (
        <FormBuilderDesigner
          initial={initial}
          onSave={async (value) => {
            const res = await fetch('/api/form-builder/forms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...value, formId: formId === 'new' ? undefined : formId }),
            });

            if (!res.ok) {
              const body = await res.json().catch(() => null);
              throw new Error(body?.error ?? body?.message ?? t('failedToSaveForm'));
            }

            const body = await res.json().catch(() => null);
            const savedFormId = body?.formId ?? body?.result?.formId ?? body?.item?.formId;

            if (savedFormId) {
              // Record the new id before reloading. If only the reload fails the
              // form is still saved, and without the id every later save would
              // post without one and be matched by key instead.
              setFormId(savedFormId);

              try {
                const { item } = await getForm(savedFormId, t('failedToLoadForm'));
                setInitial(item);
              } catch {
                // Saved, but could not be read back — keep what is on screen.
              }
            }

            if (formId === 'new' && savedFormId) {
              router.replace(locale ? `/${locale}/admin/form-builder/${savedFormId}` : `/admin/form-builder/${savedFormId}`);
            }

            router.refresh();
          }}
        />
      )}
    </div>
  );
}
