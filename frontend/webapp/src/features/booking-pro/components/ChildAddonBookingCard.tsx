'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Hotel, Layers3, PlusCircle } from 'lucide-react';
import { DynamicServiceForm } from '@/features/form-builder/components/DynamicServiceForm';
import type { ChildBookingDraft, ProviderCardItem, ProviderTypeAddonItem, ServiceCardItem, SpecialistCardItem, UploadRequirementItem } from '../types';
import { EntityCard, providerMeta, serviceMeta } from './EntityCard';
import { SearchLoadMoreList } from './SearchLoadMoreList';
import { RichTextPreview } from '@/features/booking/components/rich-text-preview';
import { useTranslations } from "next-intl";
interface Props {
    locale: string;
    draftId: string;
    addon: ProviderTypeAddonItem;
    value?: ChildBookingDraft;
    onChange: (next: ChildBookingDraft) => void;
    onSaved: (next: ChildBookingDraft, totals?: {
        subtotalAmount?: number;
        addonsAmount?: number;
        totalAmount?: number;
    }) => void;
}
async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok)
        throw new Error(`Failed request: ${url}`);
    return res.json();
}
export function ChildAddonBookingCard({ locale, draftId, addon, value, onChange, onSaved }: Props) {
    const tBooking = useTranslations("Booking");
    const [expanded, setExpanded] = useState(Boolean(addon.isRequired || value?.providerId));
    const [providerSearch, setProviderSearch] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [specialistSearch, setSpecialistSearch] = useState('');
    const [providerOffset, setProviderOffset] = useState(0);
    const [serviceOffset, setServiceOffset] = useState(0);
    const [specialistOffset, setSpecialistOffset] = useState(0);
    const [providers, setProviders] = useState<ProviderCardItem[]>([]);
    const [services, setServices] = useState<ServiceCardItem[]>([]);
    const [specialists, setSpecialists] = useState<SpecialistCardItem[]>([]);
    const [hasMoreProviders, setHasMoreProviders] = useState(false);
    const [hasMoreServices, setHasMoreServices] = useState(false);
    const [hasMoreSpecialists, setHasMoreSpecialists] = useState(false);
    const [serviceForm, setServiceForm] = useState<any>(null);
    const model = useMemo<ChildBookingDraft>(() => ({
        providerTypeId: addon.providerTypeId,
        bookingUiMode: value?.bookingUiMode ?? 'default_slot',
        requiresSpecialist: value?.requiresSpecialist ?? true,
        ...value,
    }), [addon.providerTypeId, value]);
    useEffect(() => {
        if (!expanded)
            return;
        getJson<{
            items: ProviderCardItem[];
            hasMore: boolean;
        }>(`/api/booking-pro/catalog/providers?locale=${locale}&providerTypeId=${addon.providerTypeId}&search=${encodeURIComponent(providerSearch)}&offset=${providerOffset}&take=3`)
            .then((data) => {
            setProviders((prev) => (providerOffset === 0 ? data.items : [...prev, ...data.items]));
            setHasMoreProviders(data.hasMore);
        })
            .catch(console.error);
    }, [expanded, locale, addon.providerTypeId, providerSearch, providerOffset]);
    useEffect(() => {
        if (!expanded || !model.providerId)
            return;
        getJson<{
            items: ServiceCardItem[];
            hasMore: boolean;
        }>(`/api/booking-pro/catalog/services?locale=${locale}&providerId=${model.providerId}&search=${encodeURIComponent(serviceSearch)}&offset=${serviceOffset}&take=3`)
            .then((data) => {
            setServices((prev) => (serviceOffset === 0 ? data.items : [...prev, ...data.items]));
            setHasMoreServices(data.hasMore);
        })
            .catch(console.error);
    }, [expanded, locale, model.providerId, serviceSearch, serviceOffset]);
    useEffect(() => {
        if (!expanded || !model.providerId || !model.serviceId || !model.requiresSpecialist)
            return;
        getJson<{
            items: SpecialistCardItem[];
            hasMore: boolean;
        }>(`/api/booking-pro/catalog/specialists?locale=${locale}&providerId=${model.providerId}&serviceId=${model.serviceId}&search=${encodeURIComponent(specialistSearch)}&offset=${specialistOffset}&take=3`)
            .then((data) => {
            setSpecialists((prev) => (specialistOffset === 0 ? data.items : [...prev, ...data.items]));
            setHasMoreSpecialists(data.hasMore);
        })
            .catch(console.error);
    }, [expanded, locale, model.providerId, model.serviceId, model.requiresSpecialist, specialistSearch, specialistOffset]);
    useEffect(() => {
        if (!model.serviceId)
            return;
        getJson<{
            item: {
                booking_ui_mode: string;
                requires_specialist: boolean;
                service_definition_id: string;
                value: number;
                currency: string;
            };
        }>(`/api/booking-pro/service-mode?serviceId=${model.serviceId}`)
            .then((data) => {
            const next: ChildBookingDraft = {
                ...model,
                serviceDefinitionId: data.item.service_definition_id,
                bookingUiMode: data.item.booking_ui_mode as any,
                requiresSpecialist: data.item.requires_specialist,
                subtotalAmount: Number(data.item.value ?? 0),
                currency: data.item.currency ?? 'USD',
            };
            onChange(next);
            if (data.item.booking_ui_mode === 'custom_form') {
                return getJson<{
                    form: any | null;
                }>(`/api/form-builder/service-form?serviceDefinitionId=${data.item.service_definition_id}&usageScope=child_addon_booking`)
                    .then((formData) => setServiceForm(formData.form));
            }
            setServiceForm(null);
        })
            .catch(console.error);
    }, [model.serviceId]);
    const complete = Boolean(model.providerId && model.serviceId && (!model.requiresSpecialist || model.specialistId) && (model.bookingUiMode !== 'custom_form' || model.formSubmissionId));
    async function saveChild() {
        if (!complete)
            return;
        const res = await fetch('/api/booking-pro/child-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ draftId, child: model }),
        });
        if (!res.ok)
            throw new Error(tBooking("failedToSaveChildBooking"));
        const data = await res.json();
        onSaved({ ...model, status: 'Completed' }, data.totals);
    }
    return (<div className={`rounded-3xl border ${complete ? 'border-[#083f30]/20 bg-white shadow-lg' : 'border-slate-200 bg-white'}`}>
      <button type="button" onClick={() => setExpanded((x) => !x)} className="flex w-full items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#083f30]/10 text-[#083f30]">
            <Hotel className="h-5 w-5"/>
          </div>
          <div>
            <div className="text-base font-bold text-slate-900">{addon.label}</div>
            {complete ? (<div className="text-sm text-slate-500">{tBooking("subBookingCompleted")}</div>) : (<RichTextPreview content={addon.description} className="text-sm text-slate-500" fallback={<div className="text-sm text-slate-500">{tBooking("selectProviderAndServiceForThisAddOn")}</div>}/>)}
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-slate-500"/> : <ChevronDown className="h-5 w-5 text-slate-500"/>}
      </button>

      {expanded ? (<div className="space-y-5 border-t border-slate-100 p-5">
          <SearchLoadMoreList title={tBooking("addonProvidersTitle", { addon: addon.label })} search={providerSearch} onSearchChange={(v) => {
                setProviderOffset(0);
                setProviderSearch(v);
            }} items={providers} hasMore={hasMoreProviders} emptyText={tBooking("noProvidersFound")} onLoadMore={() => setProviderOffset((x) => x + 3)} renderItem={(item) => (<EntityCard title={item.name} subtitle={[item.city, item.country].filter(Boolean).join(', ')} description={item.description} imageUrl={item.imageUrl} selected={model.providerId === item.id} featured={Boolean(item.featuredScore || item.isSponsored)} meta={providerMeta(item, tBooking)} onClick={() => {
                    setServiceOffset(0);
                    setSpecialistOffset(0);
                    setServices([]);
                    setSpecialists([]);
                    onChange({ ...model, providerId: item.id, serviceId: undefined, specialistId: undefined, formSubmissionId: undefined });
                }}/>)}/>

          {model.providerId ? (<SearchLoadMoreList title={tBooking("addonServicesTitle", { addon: addon.label })} search={serviceSearch} onSearchChange={(v) => {
                    setServiceOffset(0);
                    setServiceSearch(v);
                }} items={services} hasMore={hasMoreServices} emptyText={tBooking("noServicesFound")} onLoadMore={() => setServiceOffset((x) => x + 3)} renderItem={(item) => (<EntityCard title={item.name} subtitle={`${item.currency} ${item.value}`} description={item.description} imageUrl={item.imageUrl} selected={model.serviceId === item.id} featured={Boolean(item.isPopular)} meta={serviceMeta(item, tBooking)} onClick={() => {
                        setSpecialistOffset(0);
                        setSpecialists([]);
                        onChange({ ...model, serviceId: item.id, serviceDefinitionId: item.serviceDefinitionId, specialistId: undefined, requiresSpecialist: Boolean(item.requiresSpecialist), bookingUiMode: (item.bookingUiMode ?? 'default_slot') as any, subtotalAmount: item.value, currency: item.currency, selectedDate: undefined, selectedDateFrom: undefined, selectedDateTo: undefined, selectedTime: undefined, selectedTimeFrom: undefined, selectedTimeTo: undefined, formSubmissionId: undefined });
                    }}/>)}/>) : null}

          {model.providerId && model.serviceId && model.requiresSpecialist ? (<SearchLoadMoreList title={tBooking("specialists")} search={specialistSearch} onSearchChange={(v) => {
                    setSpecialistOffset(0);
                    setSpecialistSearch(v);
                }} items={specialists} hasMore={hasMoreSpecialists} emptyText={tBooking("noSpecialistsFound")} onLoadMore={() => setSpecialistOffset((x) => x + 3)} renderItem={(item) => (<EntityCard title={item.name} subtitle={item.title || item.specialty || undefined} description={item.nextAvailableLabel || item.experience || undefined} imageUrl={item.imageUrl} selected={model.specialistId === item.id} meta={serviceMeta({ rating: item.rating, reviewCount: item.reviewCount, successRate: item.successRate }, tBooking)} onClick={() => onChange({ ...model, specialistId: item.id })}/>)}/>) : null}

          {model.serviceId ? (<div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              {model.bookingUiMode === 'default_slot' ? (<div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <label className="text-sm font-medium text-slate-700">{tBooking("date2")}<input type="date" value={model.selectedDate ?? ''} onChange={(e) => onChange({ ...model, selectedDate: e.target.value, selectedDateFrom: e.target.value, selectedDateTo: e.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none focus:border-[#155e75]"/>
                  </label>
                  <label className="text-sm font-medium text-slate-700">{tBooking("timeFrom")}<input type="time" value={model.selectedTimeFrom ?? ''} onChange={(e) => onChange({ ...model, selectedTimeFrom: e.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none focus:border-[#155e75]"/>
                  </label>
                  <label className="text-sm font-medium text-slate-700">{tBooking("timeTo")}<input type="time" value={model.selectedTimeTo ?? ''} onChange={(e) => onChange({ ...model, selectedTimeTo: e.target.value, selectedTime: e.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none focus:border-[#155e75]"/>
                  </label>
                </div>) : null}

              {model.bookingUiMode === 'date_range' ? (<div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                  <label className="text-sm font-medium text-slate-700">{tBooking("checkIn")}<input type="date" value={model.selectedDateFrom ?? ''} onChange={(e) => onChange({ ...model, selectedDateFrom: e.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none focus:border-[#155e75]"/></label>
                  <label className="text-sm font-medium text-slate-700">{tBooking("checkOut")}<input type="date" value={model.selectedDateTo ?? ''} onChange={(e) => onChange({ ...model, selectedDateTo: e.target.value })} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none focus:border-[#155e75]"/></label>
                  <label className="text-sm font-medium text-slate-700">{tBooking("adults")}<input type="number" min={1} value={model.adults ?? 1} onChange={(e) => onChange({ ...model, adults: Number(e.target.value || 1) })} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none focus:border-[#155e75]"/></label>
                  <label className="text-sm font-medium text-slate-700">{tBooking("rooms")}<input type="number" min={1} value={model.rooms ?? 1} onChange={(e) => onChange({ ...model, rooms: Number(e.target.value || 1) })} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none focus:border-[#155e75]"/></label>
                </div>) : null}

              {model.bookingUiMode === 'custom_form' && serviceForm ? (<DynamicServiceForm form={serviceForm} initialValues={{}} locales={[locale]} onSubmit={async (values) => {
                        const res = await fetch('/api/form-builder/submissions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                formVersionId: serviceForm.formVersionId,
                                serviceDefinitionId: model.serviceDefinitionId,
                                bookingDraftId: draftId,
                                status: 'submitted',
                                payload: values,
                            }),
                        });
                        const data = await res.json();
                        onChange({ ...model, formSubmissionId: data.submissionId });
                    }} submitLabel={tBooking("saveAddOnForm")}/>) : null}
            </div>) : null}

          <button type="button" disabled={!complete} onClick={() => saveChild().catch(console.error)} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold ${complete ? 'bg-[#083f30] text-white shadow-lg' : 'bg-slate-200 text-slate-500'}`}>
            <PlusCircle className="h-4 w-4"/>{tBooking("saveAddonSubBooking", { addon: addon.label })}</button>
        </div>) : null}
    </div>);
}
