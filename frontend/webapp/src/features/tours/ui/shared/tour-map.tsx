"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useRef, useState } from "react";
import { MapPinOff } from "lucide-react";

import { MAPBOX_STYLE, MAPBOX_TOKEN } from "@/components/map/map-provider";
import { useMapboxSdk } from "@/components/map/use-mapbox-sdk";
import { cn } from "@/lib/utils";

export type MapPoint = {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** meeting / finish are drawn distinctly from ordinary stops (C-052). */
  kind: "meeting" | "finish" | "stop" | "position" | "destination";
  /** 1-based order shown in the pin. */
  order?: number;
  exact: boolean;
  radiusM?: number;
  /** A planned leg (transport/travel data) exists from the previous point. */
  legFromPrev?: boolean;
};

export type TourMapLabels = {
  region: string;
  unavailable: string;
  approximate: string;
  /** Explains that connectors show the order of stops, not a road route. */
  routeNote?: string;
};

const COLORS: Record<MapPoint["kind"], string> = {
  meeting: "#047857",
  finish: "#b91c1c",
  stop: "#1e3a8a",
  position: "#7c3aed",
  destination: "#0f766e",
};

function pinElement(p: MapPoint, approximateLabel: string) {
  const el = document.createElement("div");
  el.setAttribute("aria-hidden", "true");
  el.style.cssText = `width:30px;height:30px;border-radius:9999px;background:${COLORS[p.kind]};color:#fff;font:700 13px/30px system-ui,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.35);border:2px solid #fff;${p.exact ? "" : "outline:2px dashed " + COLORS[p.kind] + ";outline-offset:6px;opacity:.85;"}`;
  el.textContent = p.order != null ? String(p.order) : p.kind === "position" ? "●" : "";
  el.title = p.exact ? p.label : `${p.label} (${approximateLabel})`;
  return el;
}

/**
 * Itinerary / meeting-point map (C-052, C-043, AT-04). Pins keep the saved stop
 * order; meeting and finish points have their own colour. Connectors are drawn
 * only between points that have a planned leg and never carry distance/time —
 * those come from the operator's data or are labelled unavailable. Whenever the
 * map cannot render (no token, SDK failure, offline) the caller's textual
 * itinerary remains the source of truth; this component shows a notice instead.
 */
export function TourMap({
  points,
  labels,
  height = 280,
  className,
}: {
  points: MapPoint[];
  labels: TourMapLabels;
  height?: number;
  className?: string;
}) {
  const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const configured = Boolean(MAPBOX_TOKEN) && valid.length > 0;
  const { mapbox, error } = useMapboxSdk(configured);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const key = JSON.stringify(valid.map((p) => [p.id, p.lat, p.lng, p.order, p.exact]));

  useEffect(() => {
    if (!mapbox || !containerRef.current || valid.length === 0) return;
    let map: any;
    const markers: any[] = [];
    try {
      map = new mapbox.Map({
        container: containerRef.current,
        style: MAPBOX_STYLE,
        center: [valid[0].lng, valid[0].lat],
        zoom: 10,
        accessToken: MAPBOX_TOKEN,
        attributionControl: true,
        cooperativeGestures: true,
      });
      map.on("error", () => undefined);
      for (const p of valid) {
        markers.push(new mapbox.Marker({ element: pinElement(p, labels.approximate) }).setLngLat([p.lng, p.lat]).addTo(map));
      }
      if (valid.length > 1) {
        const bounds = new mapbox.LngLatBounds();
        valid.forEach((p) => bounds.extend([p.lng, p.lat]));
        map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });
      }
      const legs = valid
        .map((p, i) => (i > 0 && p.legFromPrev ? [[valid[i - 1].lng, valid[i - 1].lat], [p.lng, p.lat]] : null))
        .filter(Boolean);
      if (legs.length > 0) {
        map.on("load", () => {
          map.addSource("tour-legs", {
            type: "geojson",
            data: { type: "FeatureCollection", features: legs.map((coords) => ({ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: coords } })) },
          });
          map.addLayer({ id: "tour-legs", type: "line", source: "tour-legs", paint: { "line-color": "#1e3a8a", "line-width": 2, "line-dasharray": [2, 2] } });
        });
      }
    } catch {
      setFailed(true);
    }
    return () => {
      markers.forEach((m) => m.remove());
      map?.remove();
    };
    // `key` captures the points; labels are static per render tree.
  }, [mapbox, key]);

  if (!configured || error || failed) {
    return (
      <div
        className={cn("flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 text-center text-sm text-slate-600", className)}
        style={{ minHeight: 96 }}
        data-testid="tour-map-unavailable"
      >
        <MapPinOff className="size-4 shrink-0" aria-hidden="true" />
        {labels.unavailable}
      </div>
    );
  }

  const hasLegs = valid.some((p) => p.legFromPrev);
  return (
    <figure className={cn("space-y-1.5", className)}>
      <div
        ref={containerRef}
        role="region"
        aria-label={labels.region}
        data-testid="tour-map"
        className="w-full overflow-hidden rounded-2xl bg-slate-100"
        style={{ height }}
      />
      {hasLegs && labels.routeNote ? <figcaption className="text-xs text-slate-500">{labels.routeNote}</figcaption> : null}
    </figure>
  );
}
