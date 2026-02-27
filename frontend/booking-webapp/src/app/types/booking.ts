export interface Professional {
  id: string;
  name: string;
  avatar?: string;
  role: string;
}

export interface ServiceAction {
  id: string;
  name: string;
  duration: number; // in minutes
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  duration: number; // in minutes (total duration)
  price: number;
  originalPrice?: number; // for showing discount
  category: string;
  description?: string;
  actions: ServiceAction[]; // sub-services included
  requiresMultipleDays?: boolean;
  numberOfDays?: number;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  professionalId?: string;
}

export interface Availability {
  professionalId: string;
  date: string;
  slots: TimeSlot[];
}

export interface BookingSelection {
  services?: Service[]; // Changed to array for multi-select
  professional?: Professional | "any";
  date?: Date;
  endDate?: Date; // for multi-day services
  timeSlot?: string;
  timeSlots?: string[]; // for multi-day services
}

export interface ProfessionalSchedule {
  professionalId: string;
  availableDates: string[]; // ISO date strings
  workingHours: {
    start: string; // "09:00"
    end: string; // "18:00"
  };
  daysOff: string[]; // ISO date strings
}