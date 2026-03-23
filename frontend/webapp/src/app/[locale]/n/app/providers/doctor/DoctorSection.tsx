"use client"

import ProviderSectionPlaceholder from '../ProviderSectionPlaceholder';
import { LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings } from 'lucide-react';

export default function DoctorSection({ title }: { title: string }) {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/doctor/dashboard' },
    { label: 'My Schedule', icon: <Calendar size={20} />, path: '/provider/doctor/schedule', badge: 3 },
    { label: 'Consultations', icon: <MessageSquare size={20} />, path: '/provider/doctor/consultations' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/doctor/bookings' },
    { label: 'My Services', icon: <Stethoscope size={20} />, path: '/provider/doctor/services' },
    { label: 'Profile', icon: <User size={20} />, path: '/provider/doctor/profile' },
    { label: 'Earnings', icon: <DollarSign size={20} />, path: '/provider/doctor/earnings' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/doctor/reviews' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/doctor/settings' },
  ];

  return (
    <ProviderSectionPlaceholder
      navigation={navigation}
      sectionTitle={title}
      providerName="Specialist - Cardiology"
      userName="Dr. Sarah Williams"
      dashboardPath="/provider/doctor/dashboard"
    />
  );
}
