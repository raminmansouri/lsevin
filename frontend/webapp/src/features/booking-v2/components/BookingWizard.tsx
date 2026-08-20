"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, BadgeCheck, Building2, Calendar, Car, Check, CheckCircle2, ChevronRight, Clock3, CreditCard, Hotel, Landmark, Loader2, Shield, Upload, UserRound, } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { z } from "zod";
import { PendingDraftsPanel } from "./PendingDraftsPanel";
import type { AvailabilityDate, AvailabilityTime, BookingAddon, BookingCatalogProvider, BookingCatalogService, BookingCatalogSpecialist, BookingDraftRecord, CheckoutResponse, PaymentMethod, SelectedAddon, UploadedDraftDocument, } from "@/features/booking-v2/lib/types";
import { RichTextPreview } from "@/features/booking/components/rich-text-preview";
import { useTranslations } from "next-intl";
const addonConfigSchema = z.record(z.any());
const formSchema = z.object({
    draftId: z.string().uuid().optional(),
    providerId: z.string().uuid({ message: "Select a provider." }),
    serviceId: z.string().uuid({ message: "Select a service." }),
    specialistId: z.string().uuid({ message: "Select a specialist." }),
    selectedDate: z.string().min(1, "Select a date."),
    selectedTime: z.string().min(1, "Select a time."),
    selectedTimeFrom: z.string().min(1),
    selectedTimeTo: z.string().min(1),
    useLsevin: z.boolean().default(false),
    paymentMethod: z.enum(["manual_transfer", "online_gateway", "pay_on_arrival"]),
    selectedAddons: z
        .array(z.object({
        addonId: z.string(),
        sourceType: z.enum(["provider", "lsevin"]),
        addonKind: z.enum([
            "simple",
            "hotel",
            "airport_pickup",
            "transport",
            "insurance",
            "other",
        ]),
        quantity: z.number().int().min(1),
        unitPrice: z.number().min(0),
        config: addonConfigSchema,
    }))
        .default([]),
    documents: z
        .array(z.object({
        id: z.string().optional(),
        requirementId: z.string().nullable().optional(),
        title: z.string(),
        fileName: z.string(),
        fileUrl: z.string(),
        mimeType: z.string().nullable().optional(),
        sizeBytes: z.number().nullable().optional(),
    }))
        .default([]),
});
type FormValues = z.infer<typeof formSchema>;
type CatalogResponse = {
    providers: BookingCatalogProvider[];
    services: BookingCatalogService[];
    specialists: BookingCatalogSpecialist[];
};
const STEPS = [
    { id: 1, label: "Service" },
    { id: 2, label: "Schedule" },
    { id: 3, label: "Add-ons" },
    { id: 4, label: "Documents" },
    { id: 5, label: "Review & Pay" },
] as const;
async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers || {});
    if (!(init?.body instanceof FormData) && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }
    const response = await fetch(url, {
        ...init,
        headers,
        cache: "no-store",
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.message || "Request failed.");
    }
    return response.json() as Promise<T>;
}
export function BookingWizard({ initialProviderId, initialServiceId, initialSpecialistId, locale, }: {
    initialProviderId?: string | null;
    initialServiceId?: string | null;
    initialSpecialistId?: string | null;
    locale?: string;
}) {
    const tBooking = useTranslations("Booking");
    const methods = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            providerId: initialProviderId || undefined,
            serviceId: initialServiceId || undefined,
            specialistId: initialSpecialistId || undefined,
            selectedDate: "",
            selectedTime: "",
            selectedTimeFrom: "",
            selectedTimeTo: "",
            useLsevin: false,
            paymentMethod: "manual_transfer",
            selectedAddons: [],
            documents: [],
        },
    });
    const [step, setStep] = useState(1);
    const [catalog, setCatalog] = useState<CatalogResponse>({ providers: [], services: [], specialists: [] });
    const [addons, setAddons] = useState<BookingAddon[]>([]);
    const [dates, setDates] = useState<AvailabilityDate[]>([]);
    const [times, setTimes] = useState<AvailabilityTime[]>([]);
    const [pendingDrafts, setPendingDrafts] = useState<any[]>([]);
    const [loading, setLoading] = useState({ catalog: true, addons: false, dates: false, times: false, submit: false });
    const [saveState, setSaveState] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);
    const values = methods.watch();
    const selectedProvider = useMemo(() => catalog.providers.find((item) => item.id === values.providerId), [catalog.providers, values.providerId]);
    const selectedService = useMemo(() => catalog.services.find((item) => item.id === values.serviceId), [catalog.services, values.serviceId]);
    const selectedSpecialist = useMemo(() => catalog.specialists.find((item) => item.id === values.specialistId), [catalog.specialists, values.specialistId]);
    const total = useMemo(() => {
        const servicePrice = Number(selectedService?.price || 0);
        const addOnTotal = (values.selectedAddons || []).reduce((sum, addon) => sum + addon.unitPrice * addon.quantity, 0);
        return servicePrice + addOnTotal;
    }, [selectedService?.price, values.selectedAddons]);
    const loadCatalog = useCallback(async () => {
        setLoading((state) => ({ ...state, catalog: true }));
        try {
            const query = new URLSearchParams();
            if (values.providerId)
                query.set("providerId", values.providerId);
            if (values.serviceId)
                query.set("serviceId", values.serviceId);
            if (values.specialistId)
                query.set("specialistId", values.specialistId);
            if (locale)
                query.set("locale", locale);
            const data = await fetchJson<CatalogResponse>(`/api/booking-v2/bootstrap?${query.toString()}`);
            setCatalog(data);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load booking data.");
        }
        finally {
            setLoading((state) => ({ ...state, catalog: false }));
        }
    }, [locale, values.providerId, values.serviceId, values.specialistId]);
    const loadPendingDrafts = useCallback(async () => {
        try {
            const result = await fetchJson<{
                drafts: any[];
            }>("/api/booking-v2/drafts");
            setPendingDrafts(result.drafts || []);
        }
        catch {
            setPendingDrafts([]);
        }
    }, []);
    const loadAddons = useCallback(async () => {
        if (!values.serviceId) {
            setAddons([]);
            return;
        }
        setLoading((state) => ({ ...state, addons: true }));
        try {
            const query = new URLSearchParams({
                serviceId: values.serviceId,
                includeLsevin: String(values.useLsevin),
                locale: locale || "fa-IR",
            });
            const result = await fetchJson<{
                addons: BookingAddon[];
            }>(`/api/booking-v2/addons?${query.toString()}`);
            setAddons(result.addons || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load add-ons.");
        }
        finally {
            setLoading((state) => ({ ...state, addons: false }));
        }
    }, [locale, values.serviceId, values.useLsevin]);
    const loadDates = useCallback(async () => {
        if (!values.specialistId) {
            setDates([]);
            return;
        }
        setLoading((state) => ({ ...state, dates: true }));
        try {
            const result = await fetchJson<{
                dates: AvailabilityDate[];
            }>(`/api/booking-v2/availability/dates?specialistId=${values.specialistId}`);
            setDates(result.dates || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load dates.");
        }
        finally {
            setLoading((state) => ({ ...state, dates: false }));
        }
    }, [values.specialistId]);
    const loadTimes = useCallback(async () => {
        if (!values.specialistId || !values.serviceId || !values.selectedDate) {
            setTimes([]);
            return;
        }
        setLoading((state) => ({ ...state, times: true }));
        try {
            const query = new URLSearchParams({
                specialistId: values.specialistId,
                serviceId: values.serviceId,
                selectedDate: values.selectedDate,
            });
            const result = await fetchJson<{
                times: AvailabilityTime[];
            }>(`/api/booking-v2/availability/times?${query.toString()}`);
            setTimes(result.times || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load times.");
        }
        finally {
            setLoading((state) => ({ ...state, times: false }));
        }
    }, [values.selectedDate, values.serviceId, values.specialistId]);
    const saveDraft = useCallback(async (targetStep = step) => {
        const payload = {
            draftId: values.draftId,
            providerId: values.providerId,
            serviceId: values.serviceId,
            specialistId: values.specialistId,
            selectedDate: values.selectedDate || null,
            selectedTime: values.selectedTime || null,
            selectedTimeFrom: values.selectedTimeFrom || null,
            selectedTimeTo: values.selectedTimeTo || null,
            useLsevin: values.useLsevin,
            currentStep: targetStep,
            paymentMethod: values.paymentMethod,
            currency: selectedService?.currency || "USD",
            selectedAddons: values.selectedAddons,
            documents: values.documents,
        };
        setSaveState("Saving draft...");
        try {
            const method = values.draftId ? "PATCH" : "POST";
            const url = values.draftId ? `/api/booking-v2/drafts/${values.draftId}` : "/api/booking-v2/drafts";
            const result = await fetchJson<{
                draft: BookingDraftRecord;
            }>(url, {
                method,
                body: JSON.stringify(payload),
            });
            methods.setValue("draftId", result.draft.id);
            setSaveState("Draft saved");
            await loadPendingDrafts();
            return result.draft;
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save draft.");
            setSaveState("");
            return null;
        }
    }, [loadPendingDrafts, methods, selectedService?.currency, step, values]);
    const hydrateDraft = useCallback(async (draftId: string) => {
        try {
            const result = await fetchJson<{
                draft: BookingDraftRecord;
            }>(`/api/booking-v2/drafts/${draftId}`);
            const draft = result.draft;
            methods.reset({
                draftId: draft.id,
                providerId: draft.providerId || undefined,
                serviceId: draft.serviceId || undefined,
                specialistId: draft.specialistId || undefined,
                selectedDate: draft.selectedDate || "",
                selectedTime: draft.selectedTime || "",
                selectedTimeFrom: draft.selectedTimeFrom || "",
                selectedTimeTo: draft.selectedTimeTo || "",
                useLsevin: draft.useLsevin,
                paymentMethod: (draft.paymentMethod || "manual_transfer") as PaymentMethod,
                selectedAddons: draft.selectedAddons || [],
                documents: draft.documents || [],
            });
            // booking-pro writes the same booking.booking_drafts row and now persists
            // a step 6 (its free-consultation step) that this wizard has no section
            // for. Unclamped, resuming such a draft here renders an empty body with a
            // dead Continue button, recoverable only by pressing Back.
            setStep(Math.min(draft.currentStep || 1, STEPS.length));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Failed to continue draft.");
        }
    }, [methods]);
    useEffect(() => {
        loadCatalog();
        loadPendingDrafts();
    }, [loadCatalog, loadPendingDrafts]);
    useEffect(() => {
        loadAddons();
    }, [loadAddons]);
    useEffect(() => {
        loadDates();
    }, [loadDates]);
    useEffect(() => {
        loadTimes();
    }, [loadTimes]);
    useEffect(() => {
        if (!saveState)
            return;
        const timeout = setTimeout(() => setSaveState(""), 2000);
        return () => clearTimeout(timeout);
    }, [saveState]);
    const canContinue = () => {
        if (step === 1)
            return Boolean(values.providerId && values.serviceId && values.specialistId);
        if (step === 2)
            return Boolean(values.selectedDate && values.selectedTime && values.selectedTimeFrom && values.selectedTimeTo);
        if (step === 3)
            return true;
        if (step === 4)
            return true;
        if (step === 5)
            return Boolean(values.paymentMethod);
        return false;
    };
    const goNext = async () => {
        if (!canContinue())
            return;
        const nextStep = Math.min(step + 1, STEPS.length);
        await saveDraft(nextStep);
        setStep(nextStep);
    };
    const goBack = () => {
        if (step === 1)
            return;
        setStep((current) => Math.max(1, current - 1));
    };
    const toggleAddon = (addon: BookingAddon) => {
        const current = methods.getValues("selectedAddons") || [];
        const exists = current.find((item) => item.addonId === addon.id);
        if (exists) {
            methods.setValue("selectedAddons", current.filter((item) => item.addonId !== addon.id), { shouldDirty: true });
            return;
        }
        methods.setValue("selectedAddons", [
            ...current,
            {
                addonId: addon.id,
                sourceType: addon.sourceType,
                addonKind: addon.addonKind,
                quantity: 1,
                unitPrice: addon.price,
                config: {},
            },
        ], { shouldDirty: true });
    };
    const updateAddonConfig = (addonId: string, patch: Record<string, unknown>) => {
        const current = methods.getValues("selectedAddons") || [];
        methods.setValue("selectedAddons", current.map((item) => item.addonId === addonId
            ? { ...item, config: { ...item.config, ...patch } }
            : item), { shouldDirty: true });
    };
    const uploadDocument = async (file: File, title: string) => {
        const formData = new FormData();
        formData.set("file", file);
        formData.set("title", title);
        const response = await fetch("/api/booking-v2/uploads", {
            method: "POST",
            body: formData,
        });
        if (!response.ok) {
            const body = await response.json().catch(() => ({}));
            throw new Error(body.message || "Upload failed.");
        }
        const document = (await response.json()) as UploadedDraftDocument;
        const current = methods.getValues("documents") || [];
        methods.setValue("documents", [...current, document], { shouldDirty: true });
        await saveDraft(step);
    };
    const removeDocument = async (index: number) => {
        const current = methods.getValues("documents") || [];
        methods.setValue("documents", current.filter((_, currentIndex) => currentIndex !== index), { shouldDirty: true });
        await saveDraft(step);
    };
    const submitCheckout = methods.handleSubmit(async (formValues) => {
        setLoading((state) => ({ ...state, submit: true }));
        setError("");
        try {
            const draft = await saveDraft(5);
            if (!draft?.id) {
                throw new Error(tBooking("draftBookingCouldNotBeSavedBeforeCheckout"));
            }
            const result = await fetchJson<CheckoutResponse>("/api/booking-v2/checkout", {
                method: "POST",
                body: JSON.stringify({
                    draftId: draft.id,
                    paymentMethod: formValues.paymentMethod,
                    currency: selectedService?.currency || "USD",
                }),
            });
            setCheckoutResult(result);
            await loadPendingDrafts();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Checkout failed.");
        }
        finally {
            setLoading((state) => ({ ...state, submit: false }));
        }
    });
    if (checkoutResult) {
        return (<div className="mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600"/>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">{tBooking("bookingCreated")}</h1>
          <p className="mt-2 text-slate-600">{tBooking("yourBookingAndPaymentRecordWereSavedToThe")}</p>
          <div className="mt-6 grid gap-3 text-left sm:grid-cols-2">
            <InfoCard label="Booking ID" value={checkoutResult.bookingId}/>
            <InfoCard label="Payment ID" value={checkoutResult.paymentId}/>
            <InfoCard label="Booking status" value={checkoutResult.bookingStatus}/>
            <InfoCard label="Payment status" value={checkoutResult.paymentStatus}/>
          </div>
        </div>
      </div>);
    }
    return (<FormProvider {...methods}>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <button type="button" onClick={goBack} className="rounded-full border border-slate-200 p-2 text-slate-700 hover:bg-slate-50">
            <ArrowLeft className="h-5 w-5"/>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{tBooking("bookingCheckout")}</h1>
            <p className="text-sm text-slate-600">{tBooking("standaloneBookingProcessWithDraftPersistenceAndCheckout")}</p>
          </div>
        </div>

        <PendingDraftsPanel drafts={pendingDrafts} onContinue={hydrateDraft}/>

        {error ? (<div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4"/>
              <span>{error}</span>
            </div>
          </div>) : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.7fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {STEPS.map((item) => (<div key={item.id} className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${step >= item.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                      {step > item.id ? <Check className="h-4 w-4"/> : item.id}
                    </div>
                    <span className={`text-sm font-medium ${step >= item.id ? "text-slate-900" : "text-slate-400"}`}>{item.label}</span>
                  </div>))}
              </div>
              <div className="text-xs text-slate-500">{saveState || "Auto-save ready"}</div>
            </div>

            {loading.catalog ? (<div className="flex min-h-[240px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400"/></div>) : null}

            {!loading.catalog && step === 1 ? (<section className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{tBooking("chooseProviderServiceAndSpecialist")}</h2>
                  <p className="mt-1 text-sm text-slate-600">{tBooking("thisStepCreatesTheBaseBookingContext")}</p>
                </div>

                <SelectionGrid title={tBooking("provider")} icon={<Building2 className="h-4 w-4"/>} items={catalog.providers.map((item) => ({ id: item.id, title: item.name, subtitle: [item.city, item.country].filter(Boolean).join(", ") }))} value={values.providerId} onSelect={(value) => {
                methods.setValue("providerId", value, { shouldDirty: true });
                methods.setValue("serviceId", undefined as never);
                methods.setValue("specialistId", undefined as never);
            }}/>

                <SelectionGrid title={tBooking("service")} icon={<BadgeCheck className="h-4 w-4"/>} items={catalog.services
                .filter((item) => !values.providerId || item.providerId === values.providerId)
                .map((item) => ({ id: item.id, title: item.name, subtitle: `${item.currency} ${item.price} • ${item.durationMinutes} min` }))} value={values.serviceId} onSelect={(value) => {
                methods.setValue("serviceId", value, { shouldDirty: true });
                methods.setValue("specialistId", undefined as never);
            }}/>

                <SelectionGrid title={tBooking("specialist")} icon={<UserRound className="h-4 w-4"/>} items={catalog.specialists.map((item) => ({ id: item.id, title: item.name, subtitle: item.title || "Specialist" }))} value={values.specialistId} onSelect={(value) => methods.setValue("specialistId", value, { shouldDirty: true })}/>
              </section>) : null}

            {!loading.catalog && step === 2 ? (<section className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{tBooking("scheduleAppointment")}</h2>
                  <p className="mt-1 text-sm text-slate-600">{tBooking("availableDatesAndTimesComeFromStaffAvailabilityAnd")}</p>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Calendar className="h-4 w-4"/>{tBooking("selectDate2")}</div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-5">
                    {loading.dates ? <Loader2 className="h-5 w-5 animate-spin text-slate-400"/> : null}
                    {dates.map((date) => (<button type="button" key={date.date} disabled={!date.available} onClick={() => {
                    methods.setValue("selectedDate", date.date, { shouldDirty: true });
                    methods.setValue("selectedTime", "");
                    methods.setValue("selectedTimeFrom", "");
                    methods.setValue("selectedTimeTo", "");
                }} className={`rounded-2xl border p-3 text-left ${values.selectedDate === date.date ? "border-slate-900 bg-slate-900 text-white" : date.available ? "border-slate-200 bg-white hover:border-slate-300" : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"}`}>
                        <div className="text-xs uppercase tracking-wide">{date.dayLabel}</div>
                        <div className="mt-1 text-sm font-bold">{date.date}</div>
                      </button>))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900"><Clock3 className="h-4 w-4"/>{tBooking("selectTime2")}</div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {loading.times ? <Loader2 className="h-5 w-5 animate-spin text-slate-400"/> : null}
                    {times.map((time) => (<button type="button" key={`${time.timeFrom}-${time.timeTo}`} disabled={!time.available} onClick={() => {
                    methods.setValue("selectedTime", time.time, { shouldDirty: true });
                    methods.setValue("selectedTimeFrom", time.timeFrom, { shouldDirty: true });
                    methods.setValue("selectedTimeTo", time.timeTo, { shouldDirty: true });
                }} className={`rounded-2xl border p-3 text-center ${values.selectedTime === time.time ? "border-slate-900 bg-slate-900 text-white" : time.available ? "border-slate-200 bg-white hover:border-slate-300" : "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400"}`}>
                        <div className="text-sm font-bold">{time.time}</div>
                        <div className="mt-1 text-xs">{time.timeFrom} - {time.timeTo}</div>
                      </button>))}
                  </div>
                </div>
              </section>) : null}

            {!loading.catalog && step === 3 ? (<section className="space-y-6">
                <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{tBooking("addOns")}</h2>
                    <p className="mt-1 text-sm text-slate-600">{tBooking("providerAddOnsAlwaysAppearTurnOnLSevinAdd")}</p>
                  </div>
                  <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-900">
                    <input type="checkbox" checked={values.useLsevin} onChange={(event) => methods.setValue("useLsevin", event.target.checked, { shouldDirty: true })} className="h-4 w-4 rounded border-slate-300"/>{tBooking("iWantToUseLSevin")}</label>
                </div>

                {loading.addons ? <Loader2 className="h-5 w-5 animate-spin text-slate-400"/> : null}

                <div className="space-y-4">
                  {addons.map((addon) => {
                const selected = (values.selectedAddons || []).find((item) => item.addonId === addon.id);
                return (<div key={addon.id} className={`rounded-2xl border p-4 ${selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="rounded-lg bg-slate-100 p-2">
                                {addon.addonKind === "hotel" ? <Hotel className="h-4 w-4"/> : addon.addonKind === "airport_pickup" ? <Car className="h-4 w-4"/> : <Shield className="h-4 w-4"/>}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900">{addon.name}</div>
                                <div className="text-xs text-slate-500">{addon.sourceType === "lsevin" ? "Provided by LSevin" : "Provided by clinic/provider"}</div>
                              </div>
                            </div>
                            <RichTextPreview content={addon.description} className="mt-3 text-sm text-slate-600"/>
                            {addon.details.length ? <div className="mt-3 flex flex-wrap gap-2">{addon.details.map((detail) => <span key={detail} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{detail}</span>)}</div> : null}
                          </div>
                          <div className="text-right">
                            <div className="text-base font-bold text-slate-900">{selectedService?.currency || "USD"} {addon.price}</div>
                            <button type="button" onClick={() => toggleAddon(addon)} className={`mt-3 rounded-xl px-4 py-2 text-sm font-semibold ${selected ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-900"}`}>
                              {selected ? "Added" : "Add"}
                            </button>
                          </div>
                        </div>

                        {selected && addon.addonKind === "hotel" ? (<div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                            <TextField label="Check-in" value={String(selected.config.checkIn || "")} onChange={(value) => updateAddonConfig(addon.id, { checkIn: value })}/>
                            <TextField label="Check-out" value={String(selected.config.checkOut || "")} onChange={(value) => updateAddonConfig(addon.id, { checkOut: value })}/>
                            <TextField label="Guests" value={String(selected.config.guests || "1")} onChange={(value) => updateAddonConfig(addon.id, { guests: value })}/>
                            <TextField label="Room preference" value={String(selected.config.roomType || "")} onChange={(value) => updateAddonConfig(addon.id, { roomType: value })}/>
                          </div>) : null}

                        {selected && addon.addonKind === "airport_pickup" ? (<div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                            <TextField label="Arrival airport" value={String(selected.config.airport || "")} onChange={(value) => updateAddonConfig(addon.id, { airport: value })}/>
                            <TextField label="Flight number" value={String(selected.config.flightNumber || "")} onChange={(value) => updateAddonConfig(addon.id, { flightNumber: value })}/>
                            <TextField label="Arrival date" value={String(selected.config.arrivalDate || "")} onChange={(value) => updateAddonConfig(addon.id, { arrivalDate: value })}/>
                            <TextField label="Arrival time" value={String(selected.config.arrivalTime || "")} onChange={(value) => updateAddonConfig(addon.id, { arrivalTime: value })}/>
                          </div>) : null}
                      </div>);
            })}
                </div>
              </section>) : null}

            {!loading.catalog && step === 4 ? (<section className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{tBooking("documents")}</h2>
                  <p className="mt-1 text-sm text-slate-600">{tBooking("uploadMedicalFilesOrTravelDocumentsFilesAreAttached")}</p>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 text-center">
                    <Upload className="h-6 w-6 text-slate-500"/>
                    <span className="text-sm font-medium text-slate-900">{tBooking("clickToUploadADocument")}</span>
                    <span className="text-xs text-slate-500">{tBooking("pDFJPGPNG")}</span>
                    <input type="file" className="hidden" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file)
                    return;
                try {
                    await uploadDocument(file, file.name);
                }
                catch (err) {
                    setError(err instanceof Error ? err.message : "Upload failed.");
                }
                finally {
                    event.currentTarget.value = "";
                }
            }}/>
                  </label>
                </div>
                <div className="space-y-3">
                  {(values.documents || []).map((document, index) => (<div key={`${document.fileUrl}-${index}`} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{document.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{document.fileName}</div>
                      </div>
                      <button type="button" onClick={() => removeDocument(index)} className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">{tBooking("remove")}</button>
                    </div>))}
                </div>
              </section>) : null}

            {!loading.catalog && step === 5 ? (<section className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{tBooking("reviewAndPayment")}</h2>
                  <p className="mt-1 text-sm text-slate-600">{tBooking("finalReviewBeforeCreatingTheBookingAndPaymentRecord")}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <InfoCard label="Provider" value={selectedProvider?.name || "-"}/>
                  <InfoCard label="Service" value={selectedService?.name || "-"}/>
                  <InfoCard label="Specialist" value={selectedSpecialist?.name || "-"}/>
                  <InfoCard label="Schedule" value={values.selectedDate && values.selectedTime ? `${values.selectedDate} ${values.selectedTime}` : "-"}/>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 text-sm font-semibold text-slate-900">{tBooking("paymentMethod2")}</div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <PaymentChoice value={values.paymentMethod} current="manual_transfer" title={tBooking("manualTransfer")} icon={<Landmark className="h-4 w-4"/>} onSelect={(value) => methods.setValue("paymentMethod", value)}/>
                    <PaymentChoice value={values.paymentMethod} current="online_gateway" title={tBooking("onlineGateway")} icon={<CreditCard className="h-4 w-4"/>} onSelect={(value) => methods.setValue("paymentMethod", value)}/>
                    <PaymentChoice value={values.paymentMethod} current="pay_on_arrival" title={tBooking("payOnArrival")} icon={<Shield className="h-4 w-4"/>} onSelect={(value) => methods.setValue("paymentMethod", value)}/>
                  </div>
                </div>

                <button type="button" onClick={submitCheckout} disabled={loading.submit} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60">
                  {loading.submit ? <Loader2 className="h-4 w-4 animate-spin"/> : <CreditCard className="h-4 w-4"/>}{tBooking("createBookingAndPayment")}</button>
              </section>) : null}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <button type="button" onClick={goBack} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{tBooking("back")}</button>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => saveDraft(step)} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">{tBooking("saveDraft")}</button>
                {step < 5 ? (<button type="button" disabled={!canContinue()} onClick={goNext} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">{tBooking("continue")}<ChevronRight className="h-4 w-4"/>
                  </button>) : null}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
            <h2 className="text-lg font-bold text-slate-900">{tBooking("summary")}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <SummaryRow icon={<Building2 className="h-4 w-4"/>} label="Provider" value={selectedProvider?.name || "Not selected"}/>
              <SummaryRow icon={<BadgeCheck className="h-4 w-4"/>} label="Service" value={selectedService?.name || "Not selected"}/>
              <SummaryRow icon={<UserRound className="h-4 w-4"/>} label="Specialist" value={selectedSpecialist?.name || "Not selected"}/>
              <SummaryRow icon={<Calendar className="h-4 w-4"/>} label="Date" value={values.selectedDate || "Not selected"}/>
              <SummaryRow icon={<Clock3 className="h-4 w-4"/>} label="Time" value={values.selectedTime || "Not selected"}/>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="mb-3 text-sm font-semibold text-slate-900">{tBooking("selectedAddOns2")}</div>
              <div className="space-y-2">
                {(values.selectedAddons || []).length === 0 ? (<div className="text-sm text-slate-500">{tBooking("noAddOnsSelected")}</div>) : (values.selectedAddons.map((addon) => {
            const details = addons.find((item) => item.id === addon.addonId);
            return (<div key={addon.addonId} className="rounded-xl bg-slate-50 p-3">
                        <div className="text-sm font-semibold text-slate-900">{details?.name || addon.addonId}</div>
                        <div className="mt-1 text-xs text-slate-500">{addon.sourceType} • {selectedService?.currency || "USD"} {addon.unitPrice}</div>
                      </div>);
        }))}
              </div>
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>{tBooking("service")}</span>
                <span>{selectedService?.currency || "USD"} {selectedService?.price || 0}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
                <span>{tBooking("addOns")}</span>
                <span>{selectedService?.currency || "USD"} {(values.selectedAddons || []).reduce((sum, addon) => sum + addon.unitPrice * addon.quantity, 0)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-base font-bold text-slate-900">
                <span>{tBooking("total")}</span>
                <span>{selectedService?.currency || "USD"} {total}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </FormProvider>);
}
function SelectionGrid({ title, icon, items, value, onSelect, }: {
    title: string;
    icon: ReactNode;
    items: {
        id: string;
        title: string;
        subtitle?: string;
    }[];
    value?: string;
    onSelect: (id: string) => void;
}) {
    return (<div>
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">{icon} {title}</div>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => (<button key={item.id} type="button" onClick={() => onSelect(item.id)} className={`rounded-2xl border p-4 text-left transition ${value === item.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"}`}>
            <div className="text-sm font-bold">{item.title}</div>
            {item.subtitle ? <RichTextPreview content={item.subtitle} className={`mt-1 text-xs ${value === item.id ? "text-slate-200" : "text-slate-500"}`}/> : null}
          </button>))}
      </div>
    </div>);
}
function TextField({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (<label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none ring-0 transition focus:border-slate-400"/>
    </label>);
}
function PaymentChoice({ value, current, title, icon, onSelect, }: {
    value: PaymentMethod;
    current: PaymentMethod;
    title: string;
    icon: ReactNode;
    onSelect: (value: PaymentMethod) => void;
}) {
    const selected = value === current;
    return (<button type="button" onClick={() => onSelect(current)} className={`rounded-2xl border p-4 text-left ${selected ? "border-slate-900 bg-white" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">{icon} {title}</div>
    </button>);
}
function InfoCard({ label, value }: {
    label: string;
    value: string;
}) {
    return (<div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 break-all text-sm font-semibold text-slate-900">{value}</div>
    </div>);
}
function SummaryRow({ icon, label, value }: {
    icon: ReactNode;
    label: string;
    value: string;
}) {
    return (<div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
        <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
      </div>
    </div>);
}
