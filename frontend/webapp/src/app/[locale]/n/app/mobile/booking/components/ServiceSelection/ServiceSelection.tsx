"use client";
import React, { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Clock, Star, ChevronRight, CheckCircle2, Calendar, Search, } from "lucide-react";
import { useTranslations } from "next-intl";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { useGetProvidersByServiceAndSpecialist } from "@/features/booking/api/client/fetch-providers-by-service-and-specialist";
import { useGetServicesByProviderAndSpecialist } from "@/features/booking/api/client/fetch-services-by-provider-and-specialist";
import { useGetSpecialistByProviderAndService } from "@/features/booking/api/client/fetch-specialist-by-provider-and-service";
import { useBooking } from "../../hooks/use-booking";
import { TRANSLATION_KEY } from "@/features/home/types/constants";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { RichTextPreview, getRichTextPlainText } from "@/features/booking/components/rich-text-preview";
/* ----- Types & Enums ----- */
interface INode {
    name: NodeType;
    edges: NodeType[];
    isSelected: boolean;
}
enum NodeType {
    Provider,
    Service,
    Specialist
}
type ProviderItem = {
    id: string;
    name: string;
    description?: string;
    image?: string;
    popular?: boolean;
};
type ServiceItem = {
    id: string;
    name: string;
    description?: string;
    image?: string;
    popular?: boolean;
    duration?: string;
    category?: string;
    price?: number | string;
};
type SpecialistItem = {
    id: string;
    name: string;
    specialty?: string;
    experience?: string;
    patients?: string | number;
    rating?: number | string;
    nextAvailable?: string;
    image?: string;
};
const INITIAL_VISIBLE_COUNT = 3;
const LOAD_MORE_STEP = 3;
/* ----- Small UI helpers ----- */
function LoadMoreButton({ shown, total, onClick, }: {
    shown: number;
    total: number;
    onClick: () => void;
}) {
    const tBooking = useTranslations("Booking");
    if (shown >= total)
        return null;
    return (<button type="button" onClick={onClick} className="mt-4 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-[#083f30] transition hover:border-[#083f30] hover:bg-gray-50">{tBooking("loadMore")}{Math.min(LOAD_MORE_STEP, total - shown)}{tBooking("more")}</button>);
}
function SearchInput({ value, onChange, placeholder, }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (<div className="relative mb-4">
      <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-[#083f30]"/>
    </div>);
}
function ImageOrPlaceholder({ src, alt, className, }: {
    src?: string;
    alt: string;
    className: string;
}) {
    const mediaSrc = resolveHomeMediaUrl(src);
    const containerClassName = className.replace(/\bobject-[^\s]+/g, "").replace(/\s+/g, " ").trim();
    if (!mediaSrc) {
        return <div className={`${containerClassName} bg-gray-200`}/>;
    }
    return (<div className={`relative overflow-hidden ${containerClassName}`}>
      <ImageWithFallback fill src={mediaSrc} alt={alt} sizes="96px" className="object-cover" fallbackClassName={containerClassName}/>
    </div>);
}
function ProviderSkeletonList({ count = 3 }: {
    count?: number;
}) {
    return (<div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (<div key={index} className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-xl bg-gray-200"/>
            <div className="flex-1">
              <div className="mb-3 h-5 w-1/2 rounded bg-gray-200"/>
              <div className="mb-2 h-4 w-full rounded bg-gray-200"/>
              <div className="mb-2 h-4 w-4/5 rounded bg-gray-200"/>
              <div className="h-3 w-1/3 rounded bg-gray-200"/>
            </div>
          </div>
        </div>))}
    </div>);
}
function ServiceSkeletonList({ count = 3 }: {
    count?: number;
}) {
    return (<div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (<div key={index} className="overflow-hidden rounded-2xl border-2 border-gray-200 bg-white p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-xl bg-gray-200"/>
            <div className="flex-1">
              <div className="mb-3 h-5 w-1/2 rounded bg-gray-200"/>
              <div className="mb-2 h-4 w-full rounded bg-gray-200"/>
              <div className="mb-3 h-4 w-3/4 rounded bg-gray-200"/>
              <div className="flex items-center justify-between">
                <div className="h-4 w-1/3 rounded bg-gray-200"/>
                <div className="h-5 w-16 rounded bg-gray-200"/>
              </div>
            </div>
          </div>
        </div>))}
    </div>);
}
function SpecialistSkeletonList({ count = 3 }: {
    count?: number;
}) {
    return (<div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (<div key={index} className="rounded-2xl border-2 border-gray-200 bg-white p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="h-20 w-20 rounded-xl bg-gray-200"/>
            <div className="flex-1">
              <div className="mb-3 h-5 w-1/2 rounded bg-gray-200"/>
              <div className="mb-2 h-4 w-2/3 rounded bg-gray-200"/>
              <div className="mb-3 h-4 w-1/2 rounded bg-gray-200"/>
              <div className="flex items-center justify-between">
                <div className="h-4 w-16 rounded bg-gray-200"/>
                <div className="h-4 w-24 rounded bg-gray-200"/>
              </div>
            </div>
          </div>
        </div>))}
    </div>);
}
function EmptyState({ text }: {
    text: string;
}) {
    return (<div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
      {text}
    </div>);
}
function normalizeText(value: unknown) {
    if (value == null)
        return "";
    return String(value).trim().toLowerCase();
}
/* ----- Main component ----- */
export default function ServiceSelection() {
    const tBooking = useTranslations("Booking");
    const { setValue, canProceed, selectedDate, selectedTime, providerId, serviceId, specialistId, handleNext, setData, locale, } = useBooking();
    const t = useTranslations(TRANSLATION_KEY);
    const { data: providersResponse, 
    // isLoading: isProvidersLoading,
    isFetching: isProvidersFetching, refetch: refetchProviders } = useGetProvidersByServiceAndSpecialist(providerId, serviceId, specialistId, "", locale);
    const { data: servicesResponse, 
    // isLoading: isServicesLoading,
    isFetching: isServicesFetching, refetch: refetchServices } = useGetServicesByProviderAndSpecialist(providerId, serviceId, specialistId, "", locale);
    const { data: specialistsResponse, 
    // isLoading: isSpecialistsLoading,
    isFetching: isSpecialistsFetching, refetch: refetchSpecialists } = useGetSpecialistByProviderAndService(providerId, serviceId, specialistId, "", locale);
    useEffect(() => {
        if (!providerId && (!providers || providers?.length == 0))
            refetchProviders();
        if (!serviceId && (!services || services?.length == 0))
            refetchServices();
        if (!specialistId && (!specialists || specialists?.length == 0))
            refetchSpecialists();
    }, [providerId, serviceId, specialistId]);
    const providers: ProviderItem[] = providersResponse?.providers ?? [];
    const services: ServiceItem[] = servicesResponse?.services ?? [];
    const specialists: SpecialistItem[] = specialistsResponse?.specialist ?? [];
    const providersPending = isProvidersFetching;
    const servicesPending = isServicesFetching;
    const specialistsPending = isSpecialistsFetching;
    const [visibleProvidersCount, setVisibleProvidersCount] = useState(INITIAL_VISIBLE_COUNT);
    const [visibleServicesCount, setVisibleServicesCount] = useState(INITIAL_VISIBLE_COUNT);
    const [visibleSpecialistsCount, setVisibleSpecialistsCount] = useState(INITIAL_VISIBLE_COUNT);
    const [providerSearch, setProviderSearch] = useState("");
    const [serviceSearch, setServiceSearch] = useState("");
    const [specialistSearch, setSpecialistSearch] = useState("");
    useEffect(() => {
        if (providerId && providers.length > 0) {
            setData("providers", providers);
        }
        if (serviceId && services.length > 0) {
            setData("services", services);
        }
        if (specialistId && specialists.length > 0) {
            setData("specialists", specialists);
        }
    }, [
        providerId,
        serviceId,
        specialistId,
        providers,
        services,
        specialists,
        setData,
    ]);
    useEffect(() => {
        setVisibleProvidersCount(INITIAL_VISIBLE_COUNT);
    }, [serviceId, specialistId, providerSearch]);
    useEffect(() => {
        setVisibleServicesCount(INITIAL_VISIBLE_COUNT);
    }, [providerId, specialistId, serviceSearch]);
    useEffect(() => {
        setVisibleSpecialistsCount(INITIAL_VISIBLE_COUNT);
    }, [providerId, serviceId, specialistSearch]);
    const filteredProviders = useMemo(() => {
        const query = normalizeText(providerSearch);
        if (!query)
            return providers;
        return providers.filter((provider) => {
            const searchable = [
                provider.name,
                provider.description,
            ]
                .map(normalizeText)
                .join(" ");
            return searchable.includes(query);
        });
    }, [providers, providerSearch]);
    const filteredServices = useMemo(() => {
        const query = normalizeText(serviceSearch);
        if (!query)
            return services;
        return services.filter((service) => {
            const searchable = [
                service.name,
                service.description,
                service.category,
                service.duration,
                service.price,
            ]
                .map(normalizeText)
                .join(" ");
            return searchable.includes(query);
        });
    }, [services, serviceSearch]);
    const filteredSpecialists = useMemo(() => {
        const query = normalizeText(specialistSearch);
        if (!query)
            return specialists;
        return specialists.filter((doctor) => {
            const searchable = [
                doctor.name,
                doctor.specialty,
                doctor.experience,
                doctor.patients,
                doctor.rating,
                doctor.nextAvailable,
            ]
                .map(normalizeText)
                .join(" ");
            return searchable.includes(query);
        });
    }, [specialists, specialistSearch]);
    const visibleProviders = useMemo(() => filteredProviders.slice(0, visibleProvidersCount), [filteredProviders, visibleProvidersCount]);
    const visibleServices = useMemo(() => filteredServices.slice(0, visibleServicesCount), [filteredServices, visibleServicesCount]);
    const visibleSpecialists = useMemo(() => filteredSpecialists.slice(0, visibleSpecialistsCount), [filteredSpecialists, visibleSpecialistsCount]);
    const nodes = useMemo<INode[]>(() => [
        {
            name: NodeType.Provider,
            edges: [NodeType.Service, NodeType.Specialist],
            isSelected: !!providerId,
        },
        {
            name: NodeType.Service,
            edges: [NodeType.Provider, NodeType.Specialist],
            isSelected: !!serviceId,
        },
        {
            name: NodeType.Specialist,
            edges: [NodeType.Service, NodeType.Provider],
            isSelected: !!specialistId,
        },
    ], [providerId, serviceId, specialistId]);
    const selectedNode = useMemo(() => nodes.find((n) => n.isSelected) ?? nodes[0], [nodes]);
    const onServiceSelection = (service: ServiceItem) => {
        if (serviceId === service.id) {
            setValue("serviceId", undefined);
            // setValue("specialistId", undefined);
        }
        else {
            setValue("serviceId", service.id);
            // setValue("specialistId", undefined);
            setVisibleSpecialistsCount(INITIAL_VISIBLE_COUNT);
        }
    };
    const onProviderSelection = (provider: ProviderItem) => {
        if (providerId === provider.id) {
            setValue("providerId", undefined);
            // setValue("serviceId", undefined);
            // setValue("specialistId", undefined);
        }
        else {
            setValue("providerId", provider.id);
            // setValue("serviceId", undefined);
            // setValue("specialistId", undefined);
            setVisibleServicesCount(INITIAL_VISIBLE_COUNT);
            setVisibleSpecialistsCount(INITIAL_VISIBLE_COUNT);
        }
    };
    const onSpecialistSelection = (doctor: SpecialistItem) => {
        if (specialistId === doctor.id) {
            setValue("specialistId", undefined);
        }
        else {
            setValue("specialistId", doctor.id);
        }
    };
    const ContinueSummary = () => {
        const tBooking = useTranslations("Booking");
        if (!canProceed())
            return null;
        return (<div className="mt-6 rounded-2xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-600">
            <CheckCircle2 size={20} className="text-white"/>
          </div>

          <div className="flex-1">
            <h3 className="mb-2 font-bold text-green-900">{tBooking("readyToContinue")}</h3>

            <div className="space-y-1.5 text-sm text-green-800">
              <div className="flex items-center gap-2">
                <BadgeCheck size={14} className="flex-shrink-0"/>
                <span>{tBooking("doctor")}{" "}
                  {specialists.find((d) => d.id === specialistId)?.name ?? "-"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar size={14} className="flex-shrink-0"/>
                <span>{tBooking("date")}{selectedDate ?? "-"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Clock size={14} className="flex-shrink-0"/>
                <span>{tBooking("time2")}{selectedTime ?? "-"}</span>
              </div>
            </div>
          </div>
        </div>

        <button type="button" onClick={handleNext} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#083f30] to-[#0a5a44] font-bold text-white shadow-lg transition-all hover:shadow-xl active:scale-95">{tBooking("continueToAddOns")}<ChevronRight size={20}/>
        </button>
      </div>);
    };
    const ChooseYourProvider = () => {
        const tBooking = useTranslations("Booking");
        return (<div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">{tBooking("chooseYourProvider")}</h2>

        <SearchInput value={providerSearch} onChange={setProviderSearch} placeholder={tBooking("searchProviders")}/>

        {providersPending ? (<ProviderSkeletonList />) : filteredProviders.length === 0 ? (<EmptyState text={providerSearch.trim()
                    ? "No providers match your search."
                    : "No providers found."}/>) : (<>
            <div className="space-y-3">
              {visibleProviders.map((provider) => (<button key={provider.id} type="button" onClick={() => onProviderSelection(provider)} className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${providerId === provider.id
                        ? "scale-[1.02] border-[#083f30] shadow-lg"
                        : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex gap-4 p-4">
                    <div className="relative flex-shrink-0">
                      <ImageOrPlaceholder src={provider.image} alt={provider.name} className="h-24 w-24 rounded-xl object-cover"/>

                      {provider.popular && (<div className="absolute -right-2 -top-2 rounded-lg bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] px-2 py-1 text-xs font-bold text-[#083f30] shadow-md">{tBooking("pOPULAR")}</div>)}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="mb-1 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 font-bold text-gray-900">
                            {provider.name}
                          </h3>

                          <div className="mb-2 text-sm text-gray-600">
                            <RichTextPreview content={provider.description} className="text-muted-foreground leading-relaxed" fallback={<p className="text-muted-foreground leading-relaxed">
                                  {t("noDescription")}
                                </p>}/>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>))}
            </div>

            <LoadMoreButton shown={visibleProviders.length} total={filteredProviders.length} onClick={() => setVisibleProvidersCount((prev) => prev + LOAD_MORE_STEP)}/>
          </>)}
      </div>);
    };
    const SelectedProvider = () => {
        const tBooking = useTranslations("Booking");
        const selectedProviders = providers.filter((f) => providerId === f.id);
        return (<div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">{tBooking("selectedProvider")}</h2>

        {providersPending ? (<ProviderSkeletonList count={1}/>) : selectedProviders.length === 0 ? (<EmptyState text="No provider selected."/>) : (<div className="space-y-3">
            {selectedProviders.map((provider) => (<button key={provider.id} type="button" onClick={() => onProviderSelection(provider)} className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${providerId === provider.id
                        ? "scale-[1.02] border-[#083f30] shadow-lg"
                        : "border-gray-200 hover:border-gray-300"}`}>
                <div className="flex gap-4 p-4">
                  <div className="relative flex-shrink-0">
                    <ImageOrPlaceholder src={provider.image} alt={provider.name} className="h-24 w-24 rounded-xl object-cover"/>

                    {provider.popular && (<div className="absolute -right-2 -top-2 rounded-lg bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] px-2 py-1 text-xs font-bold text-[#083f30] shadow-md">{tBooking("pOPULAR")}</div>)}
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="mb-1 font-bold text-gray-900">
                      {provider.name}
                    </h3>

                    <div className="mb-2 text-sm text-gray-600">
                      <RichTextPreview content={provider.description} className="text-muted-foreground leading-relaxed" fallback={<p className="text-muted-foreground leading-relaxed">
                            {t("noDescription")}
                          </p>}/>
                    </div>
                  </div>
                </div>
              </button>))}
          </div>)}
      </div>);
    };
    const ChooseYourService = () => {
        const tBooking = useTranslations("Booking");
        return (<div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">{tBooking("chooseYourService")}</h2>

        <SearchInput value={serviceSearch} onChange={setServiceSearch} placeholder={tBooking("searchServices")}/>

        {servicesPending ? (<ServiceSkeletonList />) : filteredServices.length === 0 ? (<EmptyState text={serviceSearch.trim()
                    ? "No services match your search."
                    : "No services found."}/>) : (<>
            <div className="space-y-3">
              {visibleServices.map((service) => (<button key={service.id} type="button" onClick={() => onServiceSelection(service)} className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${serviceId === service.id
                        ? "scale-[1.02] border-[#083f30] shadow-lg"
                        : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex gap-4 p-4">
                    <div className="relative flex-shrink-0">
                      <ImageOrPlaceholder src={service.image} alt={service.name} className="h-24 w-24 rounded-xl object-cover"/>

                      {service.popular && (<div className="absolute -right-2 -top-2 rounded-lg bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] px-2 py-1 text-xs font-bold text-[#083f30] shadow-md">{tBooking("pOPULAR")}</div>)}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="mb-1 flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="mb-1 font-bold text-gray-900">
                            {service.name}
                          </h3>

                          <div className="mb-2 text-sm text-gray-600">
                            <RichTextPreview content={service.description} className="text-muted-foreground leading-relaxed" fallback={<p className="text-muted-foreground leading-relaxed">
                                  {t("noDescription")}
                                </p>}/>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock size={14}/>
                              <span>{service.duration ?? "-"}</span>
                            </div>

                            <span>•</span>

                            <span className="rounded-md bg-gray-100 px-2 py-0.5 font-semibold">
                              {service.category ?? "-"}
                            </span>
                          </div>
                        </div>

                        <div className="ml-3 text-right">
                          <div className="text-lg font-bold text-[#083f30]">
                            {service.price != null ? `$${service.price}` : "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>))}
            </div>

            <LoadMoreButton shown={visibleServices.length} total={filteredServices.length} onClick={() => setVisibleServicesCount((prev) => prev + LOAD_MORE_STEP)}/>
          </>)}
      </div>);
    };
    const SelectedService = () => {
        const tBooking = useTranslations("Booking");
        const selectedServices = services.filter((f) => serviceId === f.id);
        return (<div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">{tBooking("selectedService")}</h2>

        {servicesPending ? (<ServiceSkeletonList count={1}/>) : selectedServices.length === 0 ? (<EmptyState text="No service selected."/>) : (<div className="space-y-3">
            {selectedServices.map((service) => (<button key={service.id} type="button" onClick={() => onServiceSelection(service)} className={`w-full overflow-hidden rounded-2xl border-2 bg-white transition-all ${serviceId === service.id
                        ? "scale-[1.02] border-[#083f30] shadow-lg"
                        : "border-gray-200 hover:border-gray-300"}`}>
                <div className="flex gap-4 p-4">
                  <div className="relative flex-shrink-0">
                    <ImageOrPlaceholder src={service.image} alt={service.name} className="h-24 w-24 rounded-xl object-cover"/>

                    {service.popular && (<div className="absolute -right-2 -top-2 rounded-lg bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] px-2 py-1 text-xs font-bold text-[#083f30] shadow-md">{tBooking("pOPULAR")}</div>)}
                  </div>

                  <div className="flex-1 text-left">
                    <div className="mb-1 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1 font-bold text-gray-900">
                          {service.name}
                        </h3>

                        <div className="mb-2 text-sm text-gray-600">
                          <RichTextPreview content={service.description} className="text-muted-foreground leading-relaxed" fallback={<p className="text-muted-foreground leading-relaxed">
                                {t("noDescription")}
                              </p>}/>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock size={14}/>
                            <span>{service.duration ?? "-"}</span>
                          </div>

                          <span>•</span>

                          <span className="rounded-md bg-gray-100 px-2 py-0.5 font-semibold">
                            {service.category ?? "-"}
                          </span>
                        </div>
                      </div>

                      <div className="ml-3 text-right">
                        <div className="text-lg font-bold text-[#083f30]">
                          {service.price != null ? `$${service.price}` : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </button>))}
          </div>)}
      </div>);
    };
    const ChooseYourSpecialist = () => {
        const tBooking = useTranslations("Booking");
        return (<div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">{tBooking("chooseYourSpecialist")}</h2>

        <SearchInput value={specialistSearch} onChange={setSpecialistSearch} placeholder={tBooking("searchSpecialists")}/>

        {specialistsPending ? (<SpecialistSkeletonList />) : filteredSpecialists.length === 0 ? (<EmptyState text={specialistSearch.trim()
                    ? "No specialists match your search."
                    : "No specialists found."}/>) : (<>
            <div className="space-y-3">
              {visibleSpecialists.map((doctor) => (<button key={doctor.id} type="button" onClick={() => onSpecialistSelection(doctor)} className={`w-full rounded-2xl border-2 bg-white p-4 transition-all ${specialistId === doctor.id
                        ? "border-[#083f30] shadow-md"
                        : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex gap-4">
                    <div className="relative flex-shrink-0">
                      <ImageOrPlaceholder src={doctor.image} alt={doctor.name} className="h-20 w-20 rounded-xl object-cover"/>

                      <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#083f30]">
                        <BadgeCheck size={14} className="text-[#eacb7f]"/>
                      </div>
                    </div>

                    <div className="flex-1 text-left">
                      <h3 className="mb-1 font-bold text-gray-900">
                        {doctor.name}
                      </h3>

                      <p className="mb-2 text-sm text-gray-600">
                        {doctor.specialty ?? "-"}
                      </p>

                      <div className="mb-2 flex items-center gap-3 text-xs text-gray-600">
                        <span>{doctor.experience ?? "-"}</span>
                        <span>•</span>
                        <span>{doctor.patients ?? "-"}{tBooking("patients")}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Star size={14} className="fill-yellow-400 text-yellow-400"/>
                          <span className="text-sm font-bold text-gray-900">
                            {doctor.rating ?? "-"}
                          </span>
                        </div>

                        <span className="text-xs font-semibold text-[#083f30]">{tBooking("next")}{doctor.nextAvailable ?? "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>))}
            </div>

            <LoadMoreButton shown={visibleSpecialists.length} total={filteredSpecialists.length} onClick={() => setVisibleSpecialistsCount((prev) => prev + LOAD_MORE_STEP)}/>
          </>)}
      </div>);
    };
    const SelectedSpecialist = () => {
        const tBooking = useTranslations("Booking");
        const selectedSpecialists = specialists.filter((f) => specialistId === f.id);
        return (<div>
        <h2 className="mb-4 text-xl font-bold text-gray-900">{tBooking("selectedSpecialist")}</h2>



        {specialistsPending ? (<SpecialistSkeletonList count={1}/>) : selectedSpecialists.length === 0 ? (<EmptyState text="No specialist selected."/>) : (<div className="space-y-3">
            {selectedSpecialists.map((doctor) => (<button key={doctor.id} type="button" onClick={() => onSpecialistSelection(doctor)} className={`w-full rounded-2xl border-2 bg-white p-4 transition-all ${specialistId === doctor.id
                        ? "border-[#083f30] shadow-md"
                        : "border-gray-200 hover:border-gray-300"}`}>
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <ImageOrPlaceholder src={doctor.image} alt={doctor.name} className="h-20 w-20 rounded-xl object-cover"/>

                    <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#083f30]">
                      <BadgeCheck size={14} className="text-[#eacb7f]"/>
                    </div>
                  </div>

                  <div className="flex-1 text-left">
                    <h3 className="mb-1 font-bold text-gray-900">
                      {doctor.name}
                    </h3>

                    <p className="mb-2 text-sm text-gray-600">
                      {doctor.specialty ?? "-"}
                    </p>

                    <div className="mb-2 flex items-center gap-3 text-xs text-gray-600">
                      <span>{doctor.experience ?? "-"}</span>
                      <span>•</span>
                      <span>{doctor.patients ?? "-"}{tBooking("patients")}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400"/>
                        <span className="text-sm font-bold text-gray-900">
                          {doctor.rating ?? "-"}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-[#083f30]">{tBooking("next")}{doctor.nextAvailable ?? "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>))}
          </div>)}
      </div>);
    };
    const edgeComponentMap = {
        [NodeType.Provider]: ChooseYourProvider(),
        [NodeType.Service]: ChooseYourService(),
        [NodeType.Specialist]: ChooseYourSpecialist(),
    };
    const edgeComponentSelectedMap = {
        [NodeType.Provider]: SelectedProvider(),
        [NodeType.Service]: SelectedService(),
        [NodeType.Specialist]: SelectedSpecialist(),
    };
    if (!selectedNode)
        return <>{tBooking("pleaseSelectANode")}</>;
    return (<div>
      {/* providerId={providerId},<br/>
  serviceId={serviceId},<br/>
  specialistId={specialistId}<br/>
   */}
      {nodes.map((n) => (<div key={n.name} className="mb-6">
          {n.isSelected
                ? edgeComponentSelectedMap[n.name]
                : edgeComponentMap[n.name]}
        </div>))}

      <ContinueSummary />
    </div>);
}
