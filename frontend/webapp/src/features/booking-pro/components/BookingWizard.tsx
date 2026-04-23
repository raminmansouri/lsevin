'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, CreditCard, FileStack, Layers3, RefreshCcw, ShieldCheck } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { DynamicServiceForm } from '@/features/form-builder/components/DynamicServiceForm';
import type { BookingDraftState, ChildBookingDraft, ProviderCardItem, ProviderTypeAddonItem, ServiceCardItem, SpecialistCardItem, UploadRequirementItem } from '../types';
import { ChildAddonBookingCard } from './ChildAddonBookingCard';
import { PaymentMethodsPanel } from './PaymentMethodsPanel';
import { EntityCard, providerMeta, serviceMeta } from './EntityCard';
import { SearchLoadMoreList } from './SearchLoadMoreList';

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${url}`);
  }
  return response.json();
}

const steps = [
  { key: 1, label: 'Service' },
  { key: 2, label: 'Schedule' },
  { key: 3, label: 'Add-ons' },
  { key: 4, label: 'Files' },
  { key: 5, label: 'Review & Pay' },
] as const;

export function BookingWizard() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const seededProviderId = searchParams.get('id') ?? undefined;
  const seededServiceId = searchParams.get('serviceId') ?? undefined;
  const seededSpecialistId = searchParams.get('specialistId') ?? undefined;

  const [draft, setDraft] = useState<BookingDraftState | null>(null);
  const [resumeChoiceRequired, setResumeChoiceRequired] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [providerSearch, setProviderSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [specialistSearch, setSpecialistSearch] = useState('');
  const [providerOffset, setProviderOffset] = useState(0);
  const [serviceOffset, setServiceOffset] = useState(0);
  const [specialistOffset, setSpecialistOffset] = useState(0);
  const [providers, setProviders] = useState<ProviderCardItem[]>([]);
  const [services, setServices] = useState<ServiceCardItem[]>([]);
  const [specialists, setSpecialists] = useState<SpecialistCardItem[]>([]);
  const [providerHasMore, setProviderHasMore] = useState(false);
  const [serviceHasMore, setServiceHasMore] = useState(false);
  const [specialistHasMore, setSpecialistHasMore] = useState(false);
  const [addonProviderTypes, setAddonProviderTypes] = useState<ProviderTypeAddonItem[]>([]);
  const [uploadRequirements, setUploadRequirements] = useState<UploadRequirementItem[]>([]);
  const [mainServiceForm, setMainServiceForm] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);
  const [paymentIntentResult, setPaymentIntentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { draft } = await getJson<{ draft: BookingDraftState | null }>('/api/booking-pro/draft');
        if (cancelled) return;
        if (draft) {
          const hasExistingSelection = Boolean(draft.providerId || draft.serviceId || draft.childBookings?.length || draft.uploadFiles?.length);
          if (hasExistingSelection) {
            setDraft(draft);
            setResumeChoiceRequired(true);
          } else {
            const created = await getJson<{ draft: BookingDraftState }>('/api/booking-pro/draft', { method: 'POST' });
            setDraft({ ...created.draft, providerId: seededProviderId, serviceId: seededServiceId, specialistId: seededSpecialistId });
          }
        } else {
          const created = await getJson<{ draft: BookingDraftState }>('/api/booking-pro/draft', { method: 'POST' });
          setDraft({ ...created.draft, providerId: seededProviderId, serviceId: seededServiceId, specialistId: seededSpecialistId });
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load booking draft');
      } finally {
        setLoadingDraft(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const currentStep = draft?.currentStep ?? 1;

  useEffect(() => {
    if (!draft || resumeChoiceRequired) return;
    getJson<{ items: ProviderCardItem[]; hasMore: boolean }>(`/api/booking-pro/catalog/providers?locale=${locale}&search=${encodeURIComponent(providerSearch)}&offset=${providerOffset}&take=3`)
      .then((data) => {
        setProviders((prev) => (providerOffset === 0 ? data.items : [...prev, ...data.items]));
        setProviderHasMore(data.hasMore);
      })
      .catch((e) => setError(e.message));
  }, [draft?.id, providerSearch, providerOffset, locale, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft?.providerId || resumeChoiceRequired) return;
    getJson<{ items: ServiceCardItem[]; hasMore: boolean }>(`/api/booking-pro/catalog/services?locale=${locale}&providerId=${draft.providerId}&search=${encodeURIComponent(serviceSearch)}&offset=${serviceOffset}&take=3`)
      .then((data) => {
        setServices((prev) => (serviceOffset === 0 ? data.items : [...prev, ...data.items]));
        setServiceHasMore(data.hasMore);
      })
      .catch((e) => setError(e.message));
  }, [draft?.providerId, serviceSearch, serviceOffset, locale, resumeChoiceRequired]);

  useEffect(() => {
    if (!draft?.providerId || !draft?.serviceId || !draft?.requiresSpecialist || resumeChoiceRequired) return;
    getJson<{ items: SpecialistCardItem[]; hasMore: boolean }>(`/api/booking-pro/catalog/specialists?locale=${locale}&providerId=${draft.providerId}&serviceId=${draft.serviceId}&search=${encodeURIComponent(specialistSearch)}&offset=${specialistOffset}&take=3`)
      .then((data) => {
        setSpecialists((prev) => (specialistOffset === 0 ? data.items : [...prev, ...data.items]));
        setSpecialistHasMore(data.hasMore);
      })
      .catch((e) => setError(e.message));
  }, [draft?.providerId, draft?.serviceId, draft?.requiresSpecialist, specialistSearch, specialistOffset, locale, resumeChoiceRequired]);

  useEffect(() => {
    debugger
    if (!draft?.serviceId || resumeChoiceRequired) return;
    getJson<{ item: { service_definition_id: string; booking_ui_mode: string; requires_specialist: boolean; value: number; currency: string } }>(`/api/booking-pro/service-mode?serviceId=${draft.serviceId}`)
      .then(async ({ item }) => {
        const next: BookingDraftState = {
          ...(draft as BookingDraftState),
          serviceDefinitionId: item.service_definition_id,
          bookingUiMode: item.booking_ui_mode as any,
          requiresSpecialist: item.requires_specialist,
          currency: item.currency,
          subtotalAmount: Number(item.value ?? 0),
        };
        setDraft(next);
        if (item.booking_ui_mode === 'custom_form') {
          const formData = await getJson<{ form: any | null }>(`/api/form-builder/service-form?serviceDefinitionId=${item.service_definition_id}&usageScope=main_booking`);
          setMainServiceForm(formData.form);
        } else {
          setMainServiceForm(null);
        }
      })
      .catch((e) => setError(e.message));

    getJson<{ items: ProviderTypeAddonItem[] }>(`/api/booking-pro/addon-provider-types?serviceId=${draft.serviceId}&locale=${locale}`)
      .then((data) => setAddonProviderTypes(data.items))
      .catch((e) => setError(e.message));

    getJson<{ items: UploadRequirementItem[] }>(`/api/booking-pro/uploads/requirements?serviceId=${draft.serviceId}&locale=${locale}`)
      .then((data) => setUploadRequirements(data.items))
      .catch((e) => setError(e.message));
  }, [draft?.serviceId, locale, resumeChoiceRequired]);

  async function patchDraft(patch: Partial<BookingDraftState>) {
    if (!draft) return;
    const payload = { ...patch, draftId: draft.id };
    const response = await getJson<{ draft?: BookingDraftState; totals?: { subtotalAmount: number; addonsAmount: number; totalAmount: number } }>('/api/booking-pro/draft', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setDraft((prev) => ({ ...(prev as BookingDraftState), ...patch, ...(response.totals ?? {}) }));
  }

  const chosenProvider = useMemo(() => providers.find((p) => p.id === draft?.providerId), [providers, draft?.providerId]);
  const chosenService = useMemo(() => services.find((p) => p.id === draft?.serviceId), [services, draft?.serviceId]);
  const chosenSpecialist = useMemo(() => specialists.find((p) => p.id === draft?.specialistId), [specialists, draft?.specialistId]);

  const childMap = useMemo(() => Object.fromEntries((draft?.childBookings ?? []).map((child) => [child.providerTypeId, child])), [draft?.childBookings]);
  const allRequiredUploadsPresent = useMemo(() => {
    const requiredIds = uploadRequirements.filter((x) => x.isRequired).map((x) => x.id);
    const uploadedIds = new Set((draft?.uploadFiles ?? []).map((x) => x.requirementId));
    return requiredIds.every((id) => uploadedIds.has(id));
  }, [uploadRequirements, draft?.uploadFiles]);
  const allChildBookingsCompleted = useMemo(() => addonProviderTypes.every((addon) => !addon.isRequired || childMap[addon.providerTypeId]), [addonProviderTypes, childMap]);

  const canContinueServiceStep = Boolean(draft?.providerId && draft?.serviceId && (!draft?.requiresSpecialist || draft?.specialistId));
  const canContinueScheduleStep = Boolean(
    draft && (
      draft.bookingUiMode === 'custom_form'
        ? draft.formSubmissionId
        : draft.bookingUiMode === 'date_range'
          ? draft.selectedDateFrom && draft.selectedDateTo
          : draft.selectedDate && draft.selectedTimeFrom && draft.selectedTimeTo
    )
  );
  const canContinueAddonsStep = allChildBookingsCompleted;
  const canContinueFilesStep = allRequiredUploadsPresent;

  function goNext() {
    if (!draft) return;
    const next = Math.min(currentStep + 1, 5);
    patchDraft({ currentStep: next }).catch((e) => setError(e.message));
  }

  function goBack() {
    if (!draft) return;
    if (currentStep === 1) {
      router.back();
      return;
    }
    patchDraft({ currentStep: currentStep - 1 }).catch((e) => setError(e.message));
  }

  async function handleCheckout() {
    if (!draft?.id) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await getJson('/api/booking-pro/checkout', {
        method: 'POST',
        body: JSON.stringify({ draftId: draft.id, paymentMethod: draft.paymentMethod || 'card' }),
      });
      setCheckoutResult(result);
    } catch (e: any) {
      setError(e.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  }


async function handleCreatePaymentIntent() {
  if (!checkoutResult?.bookingId) return;
  setSubmitting(true);
  setError(null);
  try {
    const result = await getJson('/api/booking-pro/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: checkoutResult.bookingId,
        paymentMethodCode: draft.paymentMethod || 'card',
        returnUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    });
    setPaymentIntentResult(result);
  } catch (e: any) {
    setError(e.message || 'Failed to start payment');
  } finally {
    setSubmitting(false);
  }
}

  if (loadingDraft || !draft) {
    return <div className="min-h-screen bg-slate-50 p-6 text-sm text-slate-500">Loading booking…</div>;
  }

  if (resumeChoiceRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#083f30] text-white"><RefreshCcw className="h-6 w-6" /></div>
          <h1 className="text-2xl font-bold text-slate-900">Continue your pending booking?</h1>
          <p className="mt-2 text-sm text-slate-600">Only one active booking draft exists per user. You can continue where you left off or discard it and start a fresh booking.</p>
          <div className="mt-6 rounded-3xl border border-[#083f30]/10 bg-[#083f30]/5 p-5">
            <div className="text-sm text-slate-700">Current draft step: <span className="font-bold text-[#083f30]">{steps.find((s) => s.key === currentStep)?.label}</span></div>
            <div className="mt-2 text-sm text-slate-600">Provider: {draft.providerId || 'Not selected'} · Service: {draft.serviceId || 'Not selected'} · Add-on sub-bookings: {draft.childBookings.length}</div>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="flex-1 rounded-2xl bg-[#083f30] px-5 py-3 font-bold text-white shadow-lg" onClick={() => setResumeChoiceRequired(false)}>Continue pending booking</button>
            <button className="flex-1 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700" onClick={async () => { await getJson('/api/booking-pro/draft', { method: 'PATCH', body: JSON.stringify({ action: 'abandon' }) }); const created = await getJson<{ draft: BookingDraftState }>('/api/booking-pro/draft', { method: 'POST' }); setDraft(created.draft); setResumeChoiceRequired(false); }}>Discard and start new</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 pb-28">
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-5 py-4">
          <div className="mb-4 flex items-center gap-3">
            <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"><ArrowLeft className="h-5 w-5" /></button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Book with LSevin</h1>
              <p className="text-sm text-slate-500">Draft-first booking with child add-on sub-bookings and one combined checkout.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center gap-2">
                <div className={`flex h-9 min-w-9 items-center justify-center rounded-full text-sm font-bold ${currentStep >= step.key ? 'bg-[#083f30] text-white' : 'bg-slate-200 text-slate-500'}`}>{currentStep > step.key ? <CheckCircle2 className="h-4 w-4" /> : step.key}</div>
                <div className={`text-sm font-medium ${currentStep >= step.key ? 'text-[#083f30]' : 'text-slate-500'}`}>{step.label}</div>
                {index < steps.length - 1 ? <div className={`mx-2 h-0.5 w-10 ${currentStep > step.key ? 'bg-[#083f30]' : 'bg-slate-200'}`} /> : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

          {currentStep === 1 ? (
            <div className="space-y-6">
              <SearchLoadMoreList
                title="Providers"
                search={providerSearch}
                onSearchChange={(v) => { setProviderOffset(0); setProviderSearch(v); }}
                items={providers}
                hasMore={providerHasMore}
                emptyText="No providers found"
                onLoadMore={() => setProviderOffset((x) => x + 3)}
                renderItem={(item) => (
                  <EntityCard
                    title={item.name}
                    subtitle={[item.city, item.country].filter(Boolean).join(', ')}
                    description={item.description}
                    imageUrl={item.imageUrl}
                    selected={draft.providerId === item.id}
                    featured={Boolean(item.featuredScore || item.isSponsored)}
                    meta={providerMeta(item)}
                    onClick={() => {
                      setServiceOffset(0);
                      setSpecialistOffset(0);
                      setServices([]);
                      setSpecialists([]);
                      const next = { ...draft, providerId: item.id, serviceId: undefined, specialistId: undefined, currentStep: 1 };
                      setDraft(next);
                      patchDraft(next).catch((e) => setError(e.message));
                    }}
                  />
                )}
              />

              {draft.providerId ? (
                <SearchLoadMoreList
                  title="Services"
                  search={serviceSearch}
                  onSearchChange={(v) => { setServiceOffset(0); setServiceSearch(v); }}
                  items={services}
                  hasMore={serviceHasMore}
                  emptyText="No services found"
                  onLoadMore={() => setServiceOffset((x) => x + 3)}
                  renderItem={(item) => (
                    <EntityCard
                      title={item.name}
                      subtitle={`${item.currency} ${item.value}`}
                      description={item.description}
                      imageUrl={item.imageUrl}
                      selected={draft.serviceId === item.id}
                      featured={Boolean(item.isPopular)}
                      meta={serviceMeta(item)}
                      onClick={() => {
                        const next = { ...draft, serviceId: item.id, serviceDefinitionId: item.serviceDefinitionId, specialistId: undefined, requiresSpecialist: item.requiresSpecialist, bookingUiMode: item.bookingUiMode, subtotalAmount: item.value, currency: item.currency };
                        setDraft(next);
                        patchDraft(next).catch((e) => setError(e.message));
                      }}
                    />
                  )}
                />
              ) : null}

              {draft.providerId && draft.serviceId && draft.requiresSpecialist ? (
                <SearchLoadMoreList
                  title="Specialists"
                  search={specialistSearch}
                  onSearchChange={(v) => { setSpecialistOffset(0); setSpecialistSearch(v); }}
                  items={specialists}
                  hasMore={specialistHasMore}
                  emptyText="No specialists found"
                  onLoadMore={() => setSpecialistOffset((x) => x + 3)}
                  renderItem={(item) => (
                    <EntityCard
                      title={item.name}
                      subtitle={item.title || item.specialty || undefined}
                      description={item.nextAvailableLabel || item.experience || undefined}
                      imageUrl={item.imageUrl}
                      selected={draft.specialistId === item.id}
                      meta={serviceMeta({ rating: item.rating, reviewCount: item.reviewCount, successRate: item.successRate })}
                      onClick={() => {
                        const next = { ...draft, specialistId: item.id };
                        setDraft(next);
                        patchDraft(next).catch((e) => setError(e.message));
                      }}
                    />
                  )}
                />
              ) : null}
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Schedule and booking details</h2>
              {draft.bookingUiMode === 'default_slot' ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <label className="text-sm font-semibold text-slate-700">Date<input type="date" value={draft.selectedDate ?? ''} onChange={(e) => { const next = { ...draft, selectedDate: e.target.value, selectedDateFrom: e.target.value, selectedDateTo: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                  <label className="text-sm font-semibold text-slate-700">Time from<input type="time" value={draft.selectedTimeFrom ?? ''} onChange={(e) => { const next = { ...draft, selectedTimeFrom: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                  <label className="text-sm font-semibold text-slate-700">Time to<input type="time" value={draft.selectedTimeTo ?? ''} onChange={(e) => { const next = { ...draft, selectedTimeTo: e.target.value, selectedTime: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                </div>
              ) : null}

              {draft.bookingUiMode === 'date_range' ? (
                <div className="grid gap-4 md:grid-cols-4">
                  <label className="text-sm font-semibold text-slate-700">From date<input type="date" value={draft.selectedDateFrom ?? ''} onChange={(e) => { const next = { ...draft, selectedDateFrom: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                  <label className="text-sm font-semibold text-slate-700">To date<input type="date" value={draft.selectedDateTo ?? ''} onChange={(e) => { const next = { ...draft, selectedDateTo: e.target.value }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                  <label className="text-sm font-semibold text-slate-700">Adults<input type="number" min={1} value={draft.adults ?? 1} onChange={(e) => { const next = { ...draft, adults: Number(e.target.value || 1) }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                  <label className="text-sm font-semibold text-slate-700">Rooms<input type="number" min={1} value={draft.rooms ?? 1} onChange={(e) => { const next = { ...draft, rooms: Number(e.target.value || 1) }; setDraft(next); patchDraft(next).catch((er) => setError(er.message)); }} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-[#155e75]" /></label>
                </div>
              ) : null}

              {draft.bookingUiMode === 'custom_form' && mainServiceForm ? (
                <DynamicServiceForm
                  form={mainServiceForm}
                  locales={[locale]}
                  onSubmit={async (values) => {
                    const res = await getJson<{ submissionId: string }>('/api/form-builder/submissions', {
                      method: 'POST',
                      body: JSON.stringify({
                        formVersionId: mainServiceForm.formVersionId,
                        serviceDefinitionId: draft.serviceDefinitionId,
                        bookingDraftId: draft.id,
                        status: 'submitted',
                        payload: values,
                      }),
                    });
                    const next = { ...draft, formSubmissionId: res.submissionId, metadata: { ...(draft.metadata ?? {}), formValues: values } };
                    setDraft(next);
                    patchDraft(next).catch((er) => setError(er.message));
                  }}
                  submitLabel="Save form and continue"
                />
              ) : null}
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900">Add-on sub-bookings</h2>
                <p className="mt-2 text-sm text-slate-600">Every selected provider-type add-on starts an embedded child booking. Add-ons do not open add-ons of their own.</p>
              </div>
              {addonProviderTypes.map((addon) => (
                <ChildAddonBookingCard
                  key={addon.providerTypeId}
                  locale={locale}
                  draftId={draft.id!}
                  addon={addon}
                  value={childMap[addon.providerTypeId]}
                  onChange={(next) => setDraft((prev) => ({ ...(prev as BookingDraftState), childBookings: [...(prev?.childBookings ?? []).filter((x) => x.providerTypeId !== next.providerTypeId), next] }))}
                  onSaved={(next, totals) => setDraft((prev) => ({ ...(prev as BookingDraftState), childBookings: [...(prev?.childBookings ?? []).filter((x) => x.providerTypeId !== next.providerTypeId), next], ...(totals ?? {}) }))}
                />
              ))}
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#083f30]/10 text-[#083f30]"><FileStack className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Required files</h2>
                  <p className="text-sm text-slate-600">These requirements come from the selected service definition. Use your media picker and store ids/urls in the fields below.</p>
                </div>
              </div>
              <div className="space-y-4">
                {uploadRequirements.map((item) => {
                  const existing = (draft.uploadFiles ?? []).find((x) => x.requirementId === item.id);
                  return (
                    <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-2 text-sm font-bold text-slate-900">{item.title} {item.isRequired ? <span className="text-red-500">*</span> : null}</div>
                      {item.description ? <div className="mb-3 text-xs text-slate-500">{item.description}</div> : null}
                      <input
                        type="text"
                        value={existing?.fileUrl ?? existing?.mediaIds ?? ''}
                        onChange={(e) => {
                          const nextFiles = [
                            ...(draft.uploadFiles ?? []).filter((x) => x.requirementId !== item.id),
                            { requirementId: item.id, title: item.title, fileUrl: e.target.value, mediaIds: e.target.value },
                          ];
                          const next = { ...draft, uploadFiles: nextFiles };
                          setDraft(next);
                        }}
                        placeholder="Use RHFSingleMediaPickerField / RHFMultiMediaPickerField hidden value here"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 outline-none focus:border-[#155e75]"
                      />
                    </div>
                  );
                })}
              </div>
              <button type="button" onClick={() => getJson('/api/booking-pro/draft', { method: 'PATCH', body: JSON.stringify({ action: 'documents', draftId: draft.id, documents: draft.uploadFiles }) }).then(() => {}).catch((e) => setError(e.message))} className="mt-5 rounded-2xl bg-[#083f30] px-5 py-3 text-sm font-bold text-white shadow-lg">Save file selections</button>
            </div>
          ) : null}

          {currentStep === 5 ? (
            <div className="space-y-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900">Review and pay</h2>
                <div className="mt-4 space-y-3 text-sm text-slate-700">
                  <div className="flex justify-between"><span>Main booking</span><span>{chosenProvider?.name} / {chosenService?.name}{chosenSpecialist ? ` / ${chosenSpecialist.name}` : ''}</span></div>
                  <div className="flex justify-between"><span>Main subtotal</span><span>{draft.currency} {draft.subtotalAmount ?? 0}</span></div>
                  <div className="flex justify-between"><span>Add-on sub-bookings</span><span>{draft.childBookings.length}</span></div>
                  <div className="flex justify-between"><span>Add-on subtotal</span><span>{draft.currency} {draft.addonsAmount ?? 0}</span></div>
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-700">Payment method</div>
                      <div className="mt-2">
                        <PaymentMethodsPanel
                          selected={draft.paymentMethod ?? 'card'}
                          onChange={(code) => {
                            const next = { ...draft, paymentMethod: code };
                            setDraft(next);
                            patchDraft(next).catch((er) => setError(er.message));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {checkoutResult ? (
                <div className="rounded-[28px] border border-green-200 bg-green-50 p-6 text-green-800 shadow-lg">
                  <div className="text-lg font-bold">Booking submitted</div>
                  <div className="mt-2 text-sm">Booking ID: {checkoutResult.bookingId}</div>
                  <div className="text-sm">Payment status: {checkoutResult.paymentStatus}</div>
                  <button type="button" onClick={handleCreatePaymentIntent} className="mt-4 rounded-2xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white">Continue to payment</button>
                </div>
              ) : null}

              {paymentIntentResult ? (
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-lg">
                  <div className="text-lg font-bold text-slate-900">Payment action</div>
                  <div className="mt-2 text-sm text-slate-600">Method: {paymentIntentResult.method}</div>
                  <div className="text-sm text-slate-600">Status: {paymentIntentResult.status}</div>
                  {paymentIntentResult.instructions ? <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{paymentIntentResult.instructions}</div> : null}
                  {paymentIntentResult.actionUrl ? <a href={paymentIntentResult.actionUrl} className="mt-4 inline-flex rounded-2xl bg-[#083f30] px-4 py-3 text-sm font-semibold text-white">Open gateway action</a> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eacb7f] text-[#083f30]"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <div className="font-bold text-slate-900">Current draft</div>
                <div className="text-xs text-slate-500">Only one active pending booking is kept for this user.</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div>Provider: <span className="font-semibold text-slate-900">{chosenProvider?.name ?? 'Not selected'}</span></div>
              <div>Service: <span className="font-semibold text-slate-900">{chosenService?.name ?? 'Not selected'}</span></div>
              <div>Specialist: <span className="font-semibold text-slate-900">{draft.requiresSpecialist ? (chosenSpecialist?.name ?? 'Not selected') : 'Not required'}</span></div>
              <div>Mode: <span className="font-semibold text-slate-900">{draft.bookingUiMode ?? 'default_slot'}</span></div>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex justify-between text-sm"><span>Main subtotal</span><span>{draft.currency ?? 'USD'} {draft.subtotalAmount ?? 0}</span></div>
              <div className="mt-1 flex justify-between text-sm"><span>Add-ons subtotal</span><span>{draft.currency ?? 'USD'} {draft.addonsAmount ?? 0}</span></div>
              <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-900"><span>Total</span><span>{draft.currency ?? 'USD'} {draft.totalAmount ?? ((draft.subtotalAmount ?? 0) + (draft.addonsAmount ?? 0))}</span></div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">Continue</div>
            <button
              type="button"
              disabled={
                (currentStep === 1 && !canContinueServiceStep) ||
                (currentStep === 2 && !canContinueScheduleStep) ||
                (currentStep === 3 && !canContinueAddonsStep) ||
                (currentStep === 4 && !canContinueFilesStep) ||
                (currentStep === 5 && submitting)
              }
              onClick={() => currentStep === 5 ? handleCheckout() : goNext()}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold shadow-lg ${((currentStep === 1 && !canContinueServiceStep) || (currentStep === 2 && !canContinueScheduleStep) || (currentStep === 3 && !canContinueAddonsStep) || (currentStep === 4 && !canContinueFilesStep) || (currentStep === 5 && submitting)) ? 'bg-slate-200 text-slate-500' : 'bg-[#083f30] text-white'}`}
            >
              {currentStep === 5 ? <CreditCard className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              {currentStep === 5 ? 'Submit combined checkout' : 'Continue'}
            </button>
            {currentStep === 3 ? <div className="mt-3 text-xs text-slate-500">Required add-on provider types must be completed before checkout.</div> : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
