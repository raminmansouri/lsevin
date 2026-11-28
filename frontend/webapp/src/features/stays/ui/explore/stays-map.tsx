"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useRef, useState } from "react";
import { MapPinOff } from "lucide-react";

import { MAPBOX_STYLE, MAPBOX_TOKEN } from "@/components/map/map-provider";
import { useMapboxSdk } from "@/components/map/use-mapbox-sdk";
import { useNearViewport } from "@/components/map/use-near-viewport";

export type StayMapPoint = { id: string; lat: number; lng: number; name: string; price: string | null; href: string; approximate: boolean };

/** A circle as a 64-point polygon (GeoJSON has no circles). */
function circle(lat: number, lng: number, radiusM: number) {
  const coords: [number, number][] = [];
  const dLat = radiusM / 111320;
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= 64; i++) {
    const a = (i / 64) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return { type: "Feature" as const, properties: {}, geometry: { type: "Polygon" as const, coordinates: [coords] } };
}

function pricePin(p: StayMapPoint) {
  const el = document.createElement("a");
  el.href = p.href;
  el.textContent = p.price ?? "•";
  el.title = p.name;
  el.setAttribute("aria-label", p.price ? `${p.name} — ${p.price}` : p.name);
  el.style.cssText =
    "display:inline-block;padding:4px 8px;border-radius:9999px;background:#fff;color:#0f172a;font:700 12px/1.2 system-ui,sans-serif;" +
    "box-shadow:0 1px 4px rgba(0,0,0,.35);border:1px solid #cbd5e1;white-space:nowrap;text-decoration:none;" +
    (p.approximate ? "border-style:dashed;" : "");
  return el;
}

function dot(color: string, size = 18) {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);`;
  return el;
}

/**
 * Results on a map (H02): one price pin per stay (dashed when the location is
 * approximate), the place the search is anchored to with its radius, and —
 * tapping the map — a point to search around ("within 1 km of here").
 * Without a map (no token, SDK blocked, offline) a notice is shown and the
 * text controls above keep working.
 */
export function StaysMap({
  points,
  anchor,
  radiusM,
  picked,
  onPick,
  labels,
  height = 440,
}: {
  points: StayMapPoint[];
  anchor: { lat: number; lng: number; name: string | null } | null;
  radiusM: number | null;
  picked: { lat: number; lng: number } | null;
  onPick: (p: { lat: number; lng: number }) => void;
  labels: { region: string; unavailable: string; tapHint: string };
  height?: number;
}) {
  const configured = Boolean(MAPBOX_TOKEN);
  const containerRef = useRef<HTMLDivElement | null>(null);
  // mapbox-gl only once the map is near the screen.
  const near = useNearViewport(containerRef);
  const { mapbox, error } = useMapboxSdk(configured && near);
  const mapRef = useRef<any>(null);
  const pickedMarker = useRef<any>(null);
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [failed, setFailed] = useState(false);
  const key = JSON.stringify([points.map((p) => [p.id, p.lat, p.lng, p.price]), anchor, radiusM]);

  useEffect(() => {
    if (!mapbox || !containerRef.current) return;
    let map: any;
    const markers: any[] = [];
    try {
      const center = anchor ?? points[0] ?? { lat: 32.4, lng: 53.7 };
      map = new mapbox.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: [center.lng, center.lat],
        zoom: anchor || points.length ? 12 : 4.5,
        accessToken: MAPBOX_TOKEN,
        attributionControl: true,
        cooperativeGestures: true,
      });
      mapRef.current = map;
      map.on("error", () => undefined);
      for (const p of points) markers.push(new mapbox.Marker({ element: pricePin(p) }).setLngLat([p.lng, p.lat]).addTo(map));
      if (anchor) markers.push(new mapbox.Marker({ element: dot("#047857", 20) }).setLngLat([anchor.lng, anchor.lat]).addTo(map));
      const bounds = new mapbox.LngLatBounds();
      points.forEach((p) => bounds.extend([p.lng, p.lat]));
      if (anchor) bounds.extend([anchor.lng, anchor.lat]);
      if (!bounds.isEmpty() && points.length + (anchor ? 1 : 0) > 1) map.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
      map.on("load", () => {
        if (anchor && radiusM) {
          map.addSource("stay-radius", { type: "geojson", data: circle(anchor.lat, anchor.lng, radiusM) });
          map.addLayer({ id: "stay-radius-fill", type: "fill", source: "stay-radius", paint: { "fill-color": "#059669", "fill-opacity": 0.08 } });
          map.addLayer({ id: "stay-radius-line", type: "line", source: "stay-radius", paint: { "line-color": "#047857", "line-width": 2, "line-dasharray": [2, 2] } });
        }
      });
      map.on("click", (e: any) => onPickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }));
    } catch {
      setFailed(true);
    }
    return () => {
      markers.forEach((m) => m.remove());
      pickedMarker.current?.remove();
      pickedMarker.current = null;
      mapRef.current = null;
      map?.remove();
    };
    // `key` captures points/anchor/radius.
  }, [mapbox, key]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapbox || !map) return;
    pickedMarker.current?.remove();
    pickedMarker.current = picked ? new mapbox.Marker({ element: dot("#ea580c") }).setLngLat([picked.lng, picked.lat]).addTo(map) : null;
  }, [mapbox, picked]);

  if (!configured || error || failed) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-8 text-center text-sm text-slate-600" data-testid="stays-map-unavailable">
        <MapPinOff className="size-4 shrink-0" aria-hidden="true" />
        {labels.unavailable}
      </div>
    );
  }
  return (
    <figure className="space-y-1.5">
      <div ref={containerRef} role="region" aria-label={labels.region} data-testid="stays-map" className="w-full overflow-hidden rounded-2xl bg-slate-100" style={{ height }} />
      <figcaption className="text-xs text-slate-500">{labels.tapHint}</figcaption>
    </figure>
  );
}
