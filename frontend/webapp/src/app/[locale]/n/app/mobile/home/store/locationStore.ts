import { create } from "zustand";

/**
 * Global store that holds the currently selected location.
 */
export const useLocationStore = create<{
    selectedLocation: Location | null;
    setLocation: (loc: Location) => void;
}>((set) => ({
    selectedLocation: null,
    setLocation: (loc) => set(() => ({ selectedLocation: loc })),
}));
