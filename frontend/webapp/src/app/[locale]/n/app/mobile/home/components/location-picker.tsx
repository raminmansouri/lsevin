"use client"
import React, { useState } from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";

export default function LocationPicker() {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState({
    city: "Dubai",
    country: "UAE",
  });

  return (
      <>
        {/* Premium Location */}
        <button
            onClick={() => setShowLocationPicker(true)}
            className="group flex items-center gap-1.5 text-sm"
        >
          <MapPin size={16} className="text-[#083f30]" />
          <span className="font-semibold text-gray-900">
          {selectedLocation.city}, {selectedLocation.country}
        </span>
          <ChevronRight
              size={16}
              className="text-gray-400 transition-transform group-hover:translate-x-0.5"
          />
        </button>

        {/* Location Picker */}
        {showLocationPicker && (
            <div className="absolute top-20 right-5 left-5 z-50 rounded-2xl bg-white p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Select Location</h3>
                <button
                    onClick={() => setShowLocationPicker(false)}
                    className="text-gray-500 hover:text-gray-700"
                >
                  <ChevronDown size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                    onClick={() =>
                        setSelectedLocation({ city: "Dubai", country: "UAE" })
                    }
                    className="flex flex-col items-center gap-2 rounded-2xl bg-gray-100 p-3 transition-colors hover:bg-gray-200"
                >
                  <img
                      src="/unsplash_images/photo-1560066984-138dadb4c035__w=100&h=100&fit=crop.jpg"
                      alt="Dubai"
                      className="h-10 w-10 object-cover"
                  />
                  <span className="text-sm font-medium text-gray-900">
                Dubai, UAE
              </span>
                </button>
                <button
                    onClick={() =>
                        setSelectedLocation({ city: "Istanbul", country: "Turkey" })
                    }
                    className="flex flex-col items-center gap-2 rounded-2xl bg-gray-100 p-3 transition-colors hover:bg-gray-200"
                >
                  <img
                      src="/unsplash_images/photo-1631217868264-e5b90bb7e133__w=100&h=100&fit=crop.jpg"
                      alt="Istanbul"
                      className="h-10 w-10 object-cover"
                  />
                  <span className="text-sm font-medium text-gray-900">
                Istanbul, Turkey
              </span>
                </button>
                <button
                    onClick={() =>
                        setSelectedLocation({ city: "Bali", country: "Indonesia" })
                    }
                    className="flex flex-col items-center gap-2 rounded-2xl bg-gray-100 p-3 transition-colors hover:bg-gray-200"
                >
                  <img
                      src="/unsplash_images/photo-1540555700478-4be289fbecef__w=100&h=100&fit=crop.jpg"
                      alt="Bali"
                      className="h-10 w-10 object-cover"
                  />
                  <span className="text-sm font-medium text-gray-900">
                Bali, Indonesia
              </span>
                </button>
              </div>
            </div>
        )}
      </>
  );
}
