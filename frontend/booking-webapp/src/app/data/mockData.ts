import { Professional, Service, ProfessionalSchedule } from "../types/booking";

export const mockProfessionals: Professional[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Senior Stylist",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Hair Specialist",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    role: "Color Expert",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
  },
  {
    id: "4",
    name: "David Kim",
    role: "Barber",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
  },
];

export const mockServices: Service[] = [
  {
    id: "1",
    name: "Women's Haircut",
    duration: 60,
    price: 65,
    category: "Hair",
    description: "Professional haircut with styling, includes consultation and finishing products",
    actions: [
      { id: "1-1", name: "Consultation", duration: 10 },
      { id: "1-2", name: "Wash & Condition", duration: 15 },
      { id: "1-3", name: "Haircut", duration: 30 },
      { id: "1-4", name: "Styling", duration: 5 },
    ],
  },
  {
    id: "2",
    name: "Men's Haircut",
    duration: 30,
    price: 35,
    category: "Hair",
    description: "Quick and professional men's haircut",
    actions: [
      { id: "2-1", name: "Haircut", duration: 25 },
      { id: "2-2", name: "Styling", duration: 5 },
    ],
  },
  {
    id: "3",
    name: "Hair Coloring",
    duration: 120,
    price: 120,
    originalPrice: 150,
    category: "Hair",
    description: "Full hair coloring service with premium products",
    actions: [
      { id: "3-1", name: "Color Consultation", duration: 15 },
      { id: "3-2", name: "Color Application", duration: 45 },
      { id: "3-3", name: "Processing Time", duration: 40 },
      { id: "3-4", name: "Wash & Style", duration: 20 },
    ],
  },
  {
    id: "4",
    name: "Haircut & Clean Shave",
    duration: 45,
    price: 30,
    originalPrice: 45,
    category: "Hair",
    description: "Complete grooming package for men",
    actions: [
      { id: "4-1", name: "The Haircut", duration: 30 },
      { id: "4-2", name: "The Clean Shave", duration: 15 },
    ],
  },
  {
    id: "5",
    name: "Manicure",
    duration: 45,
    price: 40,
    category: "Nails",
    description: "Professional nail care and polish",
    actions: [
      { id: "5-1", name: "Nail Shaping", duration: 15 },
      { id: "5-2", name: "Cuticle Care", duration: 10 },
      { id: "5-3", name: "Polish Application", duration: 20 },
    ],
  },
  {
    id: "6",
    name: "Pedicure",
    duration: 60,
    price: 55,
    category: "Nails",
    description: "Relaxing foot care treatment",
    actions: [
      { id: "6-1", name: "Foot Soak", duration: 10 },
      { id: "6-2", name: "Exfoliation", duration: 15 },
      { id: "6-3", name: "Nail Care", duration: 20 },
      { id: "6-4", name: "Massage & Polish", duration: 15 },
    ],
  },
  {
    id: "7",
    name: "Facial Treatment",
    duration: 90,
    price: 85,
    originalPrice: 100,
    category: "Skincare",
    description: "Deep cleansing and rejuvenating facial treatment",
    actions: [
      { id: "7-1", name: "Cleansing", duration: 15 },
      { id: "7-2", name: "Exfoliation", duration: 20 },
      { id: "7-3", name: "Facial Massage", duration: 30 },
      { id: "7-4", name: "Mask & Moisturizer", duration: 25 },
    ],
  },
  {
    id: "8",
    name: "Deep Tissue Massage",
    duration: 90,
    price: 95,
    category: "Wellness",
    description: "Therapeutic massage for muscle tension relief",
    actions: [
      { id: "8-1", name: "Consultation", duration: 10 },
      { id: "8-2", name: "Full Body Massage", duration: 75 },
      { id: "8-3", name: "Cool Down", duration: 5 },
    ],
  },
];

// Generate mock schedules for the next 30 days
const generateMockSchedule = (professionalId: string): ProfessionalSchedule => {
  const availableDates: string[] = [];
  const daysOff: string[] = [];
  
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Random days off (about 20% of days)
    if (Math.random() > 0.8) {
      daysOff.push(dateStr);
    } else {
      availableDates.push(dateStr);
    }
  }

  return {
    professionalId,
    availableDates,
    workingHours: {
      start: "09:00",
      end: "18:00",
    },
    daysOff,
  };
};

export const mockSchedules: ProfessionalSchedule[] = mockProfessionals.map(
  (prof) => generateMockSchedule(prof.id)
);

// Generate time slots based on service duration
export const generateTimeSlots = (
  date: Date,
  serviceDuration: number,
  professionalSchedule: ProfessionalSchedule
): string[] => {
  const slots: string[] = [];
  const dateStr = date.toISOString().split('T')[0];
  
  // Check if this date is available for the professional
  if (!professionalSchedule.availableDates.includes(dateStr)) {
    return [];
  }

  const startHour = parseInt(professionalSchedule.workingHours.start.split(':')[0]);
  const startMin = parseInt(professionalSchedule.workingHours.start.split(':')[1]);
  const endHour = parseInt(professionalSchedule.workingHours.end.split(':')[0]);
  const endMin = parseInt(professionalSchedule.workingHours.end.split(':')[1]);

  let currentTime = new Date(date);
  currentTime.setHours(startHour, startMin, 0, 0);
  
  const endTime = new Date(date);
  endTime.setHours(endHour, endMin, 0, 0);

  while (currentTime.getTime() + serviceDuration * 60000 <= endTime.getTime()) {
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    slots.push(`${hours}:${minutes}`);
    
    // Next slot is 15 minutes later
    currentTime.setMinutes(currentTime.getMinutes() + 15);
  }

  return slots;
};