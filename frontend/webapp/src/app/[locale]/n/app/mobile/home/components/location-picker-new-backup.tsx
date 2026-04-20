/*  components/LocationPicker.tsx   */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import {useLocationStore} from "@/app/[locale]/n/app/mobile/home/store/locationStore.ts";
import { useFetchGetLocations } from "../hooks/use-get-locations";

// import { useLocationStore } from "@/store/locationStore";
// import type { Location } from "@/types/location";



/**
 * A client‑side component that renders the list of available
 * locations (fetched from the backend) and stores the user’s
 * selection in a global zustand store.
 */
const LocationPicker = () => {
  /* ---- 1.  Router / Query helpers ------------------------------------- */
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---- 2.  Fetch the list of locations -------------------------------- */
  const { data } = useFetchGetLocations ();

  /* ---- 3.  Local state for the currently selected location ---------- */
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
      null
  );
  const locationStore = useLocationStore ();

  /* ---- 4.  Initialise from URL parameter (if any) ------------------- */
  useEffect(() => {
    if (!data?.locations) return;

    /* If the user already has a selected location we keep that value.
       If not we look for a `location` query param, fall back to the
       first location in the list, and set the global store.       */
    if (!selectedLocation) {
      const param = searchParams.get("location");
      if (param) {
        const [city, country] = param.split("-");
        const match = data.locations.find(
            (l) => l.city === city && l.country === country
        );
        if (match) {
          setSelectedLocation(match);
          locationStore.setLocation(match);
          return;
        }
      }

      const first = data.locations[0];
      if (first) {
        setSelectedLocation(first);
        locationStore.setLocation(first);
      }
    }
  }, [data]);

  /* ---- 5.  Handler for when the user selects a location -------------- */
  const handleSelect = (loc: Location) => {
    setSelectedLocation(loc);
    locationStore.setLocation(loc);

    /* Persist the selection to the query string so the URL can be
       re‑loaded or shared. */
    const params = new URLSearchParams();
    params.set("location", `${loc.city}-${loc.country}`);
    router.push(`${router.pathname}?${params.toString()}`);
  };

  /* ---- 6.  Render ----------------------------------------------------- */
  if (isLoading) {
    return <div className="text-center py-4">Loading locations…</div>;
  }

  return (
      <section className="bg-white rounded-md p-4 shadow-sm">
        <h3 className="font-semibold text-base">Select Location</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
          {data.locations.map((loc) => (
              <button
                  key={loc.id}
                  onClick={() => handleSelect(loc)}
                  className="flex flex-col rounded-md overflow-hidden border-2 transition-all ease-linear duration-200 hover:border-primary cursor-pointer group relative"
              >
                <div
                    className="bg-slate-50 grid h-44 grid-rows-2 items-center p-5 text-center group-hover:bg-slate-100"
                >
                  <div className="text-3xl">
                    <img
                        src={loc.image}
                        alt={`${loc.city} ${loc.country}`}
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-gray-700">
                    {loc.city} – {loc.country}
                  </h3>
                </div>
              </button>
          ))}
        </div>

        {selectedLocation && (
            <div className="mt-4 flex gap-3 items-center">
              <h3 className="text-gray-700">You have selected:</h3>
              <div className="flex flex-row gap-2 items-center">
                <Users className="text-blue-500" />
                <span>
              {selectedLocation.city} – {selectedLocation.country}
            </span>
              </div>
            </div>
        )}
      </section>
  );
};

export default LocationPicker;
