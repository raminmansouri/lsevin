// lib/store.ts
import  {create, StateCreator, StoreApi, UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'

/** Types for each slice of state */
interface BookingState {
  count: number
//   inc: () => void
}


/** Combined state type */
type RootState = BookingState

/** Create the store with persist middleware (only for the UI slice in this example) */

export const useBookingStore = create<RootState>((set, get) => ({
    count: null,
    // setConnection: (connection) => set({ connection }),
}));
