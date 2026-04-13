// lib/store.ts
import { Addon } from '@/features/booking/api/client/fetch-addons';
import { AvailableDate } from '@/features/booking/api/client/fetch-available-dates';
import { TimeSlot } from '@/features/booking/api/client/fetch-available-timeslots';
import { GetBookingServiceSelectionDataProvider, GetBookingServiceSelectionDataService, GetBookingServiceSelectionDataSpecialist } from '@/features/service-providers/types';
import  {create, StateCreator, StoreApi, UseBoundStore } from 'zustand'
import { persist } from 'zustand/middleware'
import { BookingFormValues } from '../../types';

/** Types for each slice of state */
interface BookingState {
  addons: Addon[]
  services: GetBookingServiceSelectionDataService[];
  specialists: GetBookingServiceSelectionDataSpecialist[];
  providers: GetBookingServiceSelectionDataProvider[];
  booking: BookingFormValues;
//   inc: () => void
}


/** Combined state type */
type RootState = BookingState

/** Create the store with persist middleware (only for the UI slice in this example) */

export const useBookingStore = create<RootState>((set, get) => ({
    addons: [],
    selectedAddons: [],
    services: [],
    specialists: [],
    providers: [],
    booking:{},
    setBookingInitData: (name,data) => set({ [name]:data }),
}));
