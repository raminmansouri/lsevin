"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Car, Copy, Footprints, MapPin, Navigation } from "lucide-react";
import { useTranslations } from "next-intl";

import { MAPBOX_STYLE, MAPBOX_TOKEN } from "@/components/map/map-provider";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { preferWalking } from "../../domain/geo";
import type { PropertyDetail } from "../../types";
import { useDistance } from "../common";

// The interactive map (mapbox-gl, ~450 KB) is only downloaded when the guest asks for it.
const TourMap = dynamic(() => import("@/features/tours/ui/shared/tour-map").then((m) => m.TourMap), {
  ssr: false,
  loading: () => <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />,
});

/** One static picture instead of a live map: no map script, fonts or tiles until asked for. */
function staticMapUrl(lat: number, lng: number, approximate: boolean): string | null {
  if (!MAPBOX_TOKEN) return null;
  const style = MAPBOX_STYLE.replace(/^mapbox:\/\/styles\//, "");
  const overlay = approximate ? "" : `pin-l+047857(${lng.toFixed(5)},${lat.toFixed(5)})/`;
  return `https://api.mapbox.com/styles/v1/${style}/static/${overlay}${lng.toFixed(5)},${lat.toFixed(5)},${approximate ? 13 : 15},0/640x320@2x?access_token=${MAPBOX_TOKEN}&language=fa&logo=false`;
}

export function directionsLinks(lat: number, lng: number) {
  const ll = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  return [
    { id: "google", href: `https://www.google.com/maps/dir/?api=1&destination=${ll}` },
    { id: "neshan", href: `https://neshan.org/maps/@${ll},17z,0p` },
    { id: "balad", href: `https://balad.ir/location?latitude=${lat.toFixed(6)}&longitude=${lng.toFixed(6)}&zoom=17` },
    { id: "waze", href: `https://waze.com/ul?ll=${ll}&navigate=yes` },
  ] as const;
}

export function StayLocation({ property, name }: { property: PropertyDetail; name: string }) {
  const t = useTranslations("StayApp.detail");
  const { length, travel } = useDistance();
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const loc = property.location;
  const img = loc ? staticMapUrl(loc.latitude, loc.longitude, loc.approximate) : null;

  return (
    <section id="location" aria-labelledby="stay-location" className="scroll-mt-28" data-testid="stay-location">
      <h2 id="stay-location" className="text-lg font-extrabold text-slate-900">
        {t("location")}
      </h2>
      {property.address && !loc?.approximate ? <p className="mt-1 text-sm text-slate-600">{property.address.value}</p> : null}
      {loc ? (
        <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-slate-200">
          {live ? (
            <TourMap
              points={[{ id: property.id, lat: loc.latitude, lng: loc.longitude, label: name, kind: "destination", exact: !loc.approximate, radiusM: loc.radiusM || undefined }]}
              labels={{ region: t("map"), unavailable: t("mapUnavailable"), approximate: t("approximateLocation") }}
              height={288}
            />
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group relative block h-44 w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 text-start focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
              aria-label={t("directionsOpen", { name })}
              data-testid="stay-map-preview"
            >
              {img && !imgFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img} alt="" loading="lazy" decoding="async" onError={() => setImgFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <span className="flex size-14 items-center justify-center rounded-full bg-white shadow-md">
                    <MapPin className="size-7 text-emerald-700" />
                  </span>
                </span>
              )}
              {loc.approximate ? (
                <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                  <span className="size-28 rounded-full bg-emerald-600/20 ring-2 ring-emerald-600/40" />
                </span>
              ) : null}
              <span className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
                <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-bold text-emerald-800 shadow">
                  <Navigation className="size-4" aria-hidden="true" />
                  {loc.approximate ? t("openArea") : t("directions")}
                </span>
              </span>
            </button>
          )}
          <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 text-xs text-slate-600">
            <span>{loc.approximate ? t("approximateLocation") : t("mapHint")}</span>
            {!live ? (
              <button type="button" onClick={() => setLive(true)} className="min-h-9 shrink-0 rounded-full px-3 font-semibold text-emerald-800 hover:bg-emerald-50" data-testid="stay-map-live">
                {t("interactiveMap")}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-600">{t("approximateLocation")}</p>
      )}

      {property.nearby.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-slate-900">{t("nearby")}</h3>
          <ul className="mt-2 divide-y divide-slate-100 rounded-2xl bg-white ring-1 ring-slate-200" data-testid="stay-nearby">
            {property.nearby.slice(0, 8).map((n, i) => {
              const Walk = preferWalking(n.distanceM) ? Footprints : Car;
              return (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-800">{n.name}</span>
                    <span className="text-xs text-slate-500">{t(`nearbyKinds.${n.kind}` as never)}</span>
                  </span>
                  <span className="shrink-0 text-end text-xs text-slate-600">
                    <span className="block font-semibold text-slate-800">{length(n.distanceM)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Walk className="size-3.5" aria-hidden="true" />
                      {travel(n.distanceM)}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-xs text-slate-500">{t("medicalNote")}</p>
        </div>
      ) : null}

      {loc ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="bottom" className="mx-auto max-w-lg rounded-t-3xl pb-[calc(1rem+env(safe-area-inset-bottom))]" data-testid="stay-directions-sheet">
            <SheetHeader className="pe-12">
              <SheetTitle>{loc.approximate ? t("openArea") : t("directions")}</SheetTitle>
              <SheetDescription>{loc.approximate ? t("approximateLocation") : t("directionsHelp", { name })}</SheetDescription>
            </SheetHeader>
            <ul className="grid grid-cols-2 gap-2 px-4">
              {directionsLinks(loc.latitude, loc.longitude).map((l) => (
                <li key={l.id}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-50 px-3 text-sm font-bold text-slate-800 ring-1 ring-slate-200 hover:bg-emerald-50 hover:ring-emerald-300"
                    data-testid={`stay-directions-${l.id}`}
                  >
                    <Navigation className="size-4 text-emerald-700" aria-hidden="true" />
                    {t(`mapApps.${l.id}`)}
                  </a>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 px-4">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    /* clipboard blocked */
                  }
                }}
                className={cn("inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold ring-1 ring-slate-300", copied && "text-emerald-800 ring-emerald-400")}
              >
                <Copy className="size-4" aria-hidden="true" />
                {copied ? t("copiedCoords") : t("copyCoords")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setLive(true);
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full text-sm font-semibold ring-1 ring-slate-300"
              >
                <MapPin className="size-4" aria-hidden="true" />
                {t("interactiveMap")}
              </button>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}
    </section>
  );
}
