"use client";

// import Map, { Marker, NavigationControl, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import type { NearbyProvider } from "./nearby.data";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";

export default function NearbyMap({
  providers,
  selectedProvider,
  onSelectProvider,
  center,
}: {
  providers: NearbyProvider[];
  selectedProvider: NearbyProvider | null;
  onSelectProvider: (id: string | null) => void;
  center: { lat: number; lng: number; zoom: number };
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  if (!token) {
    return (
      <div className="relative h-[calc(100vh-240px)] overflow-hidden bg-gray-100 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="font-semibold text-gray-900 mb-1">Map is not configured</p>
          <p className="text-sm text-gray-600">Set NEXT_PUBLIC_MAPBOX_TOKEN to render the live map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-240px)] overflow-hidden bg-gray-100">
      <Map
        mapboxAccessToken={token}
        initialViewState={{ latitude: center.lat, longitude: center.lng, zoom: center.zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        reuseMaps
      >
        <NavigationControl position="bottom-right" />

        {providers
          .filter((provider) => provider.coordinates)
          .map((provider) => {
            const isSelected = selectedProvider?.id === provider.id;
            return (
              <Marker
                key={provider.id}
                longitude={provider.coordinates!.lng}
                latitude={provider.coordinates!.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  onSelectProvider(provider.id);
                }}
              >
                <button
                  className={`relative transition-all shadow-lg hover:scale-110 ${
                    isSelected ? "z-20 scale-125" : "z-10"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute inset-0 w-12 h-12 bg-[#083f30] rounded-full animate-ping opacity-20" />
                  )}
                  <div
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center ${
                      isSelected ? "bg-[#083f30]" : "bg-white"
                    }`}
                  >
                    {isSelected ? (
                      <MapPin size={24} className="text-[#eacb7f]" fill="#eacb7f" />
                    ) : (
                      <MapPin size={20} className="text-[#083f30]" />
                    )}
                  </div>
                </button>
              </Marker>
            );
          })}

        {selectedProvider?.coordinates && (
          <Popup
            longitude={selectedProvider.coordinates.lng}
            latitude={selectedProvider.coordinates.lat}
            anchor="top"
            closeButton={false}
            closeOnClick={false}
            offset={20}
            onClose={() => onSelectProvider(null)}
          >
            <div className="text-sm font-medium">{selectedProvider.name}</div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
