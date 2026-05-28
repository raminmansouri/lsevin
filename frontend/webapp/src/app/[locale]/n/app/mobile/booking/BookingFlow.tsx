<<<<<<< HEAD
"use client";
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, Clock, ChevronRight, CheckCircle2, Upload, X, Plus, Shield, CreditCard, Building, Smartphone, Info, AlertCircle, BadgeCheck, Star, Car, Hotel as HotelIcon, Globe, Headphones, FileText, MapPin, Users, Phone, Mail, Award, Languages, ChevronLeft, Check, Percent, Tag } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from "next-intl";
export default function BookingFlow() {
    const tBooking = useTranslations("Booking");
    const navigate = useNavigate();
    const { serviceId } = useParams();
    const [step, setStep] = useState<number>(1);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const [depositOption, setDepositOption] = useState<'full' | 'deposit'>('deposit');
    const [promoCode, setPromoCode] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
    const treatment = {
        id: serviceId || '1',
        name: 'Premium Hair Transplant - FUE Method',
        clinic: 'Istanbul Medical Center',
        city: 'Istanbul',
        country: 'Turkey',
        rating: 4.9,
        reviews: 2847,
        verified: true,
        duration: '6-8 hours',
        recovery: '7-10 days',
        price: 2499,
        currency: 'USD',
        image: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg',
        category: 'Hair Transplant',
        accreditation: 'JCI Accredited'
    };
    const doctors = [
        {
            id: '1',
            name: 'Dr. Mehmet Yavuz',
            specialty: 'Hair Transplant Surgeon',
            experience: '18 years',
            rating: 4.9,
            reviews: 1247,
            patients: '12,000+',
            languages: ['English', 'Turkish', 'Arabic'],
            credentials: ['MD', 'ISHRS Member', 'Board Certified'],
            verified: true,
            consultation: 0,
            image: '/unsplash_images/photo-1612349317150-e413f6a5b16d__w=400&h=400&fit=crop.jpg',
            nextAvailable: 'Mar 15, 2026'
        },
        {
            id: '2',
            name: 'Dr. Can Ozturk',
            specialty: 'Hair Restoration Expert',
            experience: '15 years',
            rating: 4.8,
            reviews: 892,
            patients: '10,500+',
            languages: ['English', 'Turkish', 'German'],
            credentials: ['MD', 'FUE Specialist', 'ABHRS'],
            verified: true,
            consultation: 0,
            image: '/unsplash_images/photo-1622253692010-333f2da6031d__w=400&h=400&fit=crop.jpg',
            nextAvailable: 'Mar 12, 2026'
        },
    ];
    const availableDates = [
        { date: '2026-03-15', day: 'Mon', available: true },
        { date: '2026-03-16', day: 'Tue', available: true },
        { date: '2026-03-17', day: 'Wed', available: false },
        { date: '2026-03-18', day: 'Thu', available: true },
        { date: '2026-03-19', day: 'Fri', available: true },
        { date: '2026-03-20', day: 'Sat', available: false },
        { date: '2026-03-21', day: 'Sun', available: false },
    ];
    const timeSlots = [
        { time: '09:00 AM', available: true },
        { time: '10:00 AM', available: true },
        { time: '11:00 AM', available: false },
        { time: '02:00 PM', available: true },
        { time: '03:00 PM', available: true },
    ];
    const addons = [
        {
            id: 'hotel',
            name: '4-Star Hotel Package',
            description: '3 nights accommodation near clinic',
            price: 180,
            icon: <HotelIcon size={24} className="text-[#083f30]"/>,
            popular: true,
            details: ['Breakfast included', 'Free WiFi', '10 min from clinic']
        },
        {
            id: 'transfer',
            name: 'VIP Airport Transfer',
            description: 'Round-trip luxury car service',
            price: 80,
            icon: <Car size={24} className="text-[#083f30]"/>,
            popular: true,
            details: ['Meet & greet', 'Premium vehicle', 'Professional driver']
        },
        {
            id: 'translator',
            name: 'Personal Translator',
            description: 'Dedicated translator for your stay',
            price: 120,
            icon: <Globe size={24} className="text-[#083f30]"/>,
            details: ['Available 24/7', 'Medical terminology expert', 'Multiple languages']
        },
        {
            id: 'vip',
            name: 'VIP Patient Support',
            description: 'Priority support & concierge service',
            price: 150,
            icon: <Headphones size={24} className="text-[#083f30]"/>,
            details: ['24/7 hotline', 'Dedicated coordinator', 'Priority scheduling']
        },
        {
            id: 'insurance',
            name: 'Medical Travel Insurance',
            description: 'Comprehensive coverage for your trip',
            price: 95,
            icon: <Shield size={24} className="text-[#083f30]"/>,
            details: ['Trip cancellation', 'Medical complications', 'Lost baggage']
        },
    ];
    const steps = [
        { num: 1, label: 'Doctor & Date' },
        { num: 2, label: 'Add-ons' },
        { num: 3, label: 'Medical Files' },
        { num: 4, label: 'Review & Pay' },
    ];
    const toggleAddon = (addonId: string) => {
        if (selectedAddons.includes(addonId)) {
            setSelectedAddons(selectedAddons.filter(id => id !== addonId));
        }
        else {
            setSelectedAddons([...selectedAddons, addonId]);
        }
    };
    const calculateTotal = () => {
        let total = treatment.price;
        selectedAddons.forEach(addonId => {
            const addon = addons.find(a => a.id === addonId);
            if (addon)
                total += addon.price;
        });
        return total;
    };
    const handleNext = () => {
        if (step < 4)
            setStep(step + 1);
    };
    const handleBack = () => {
        if (step > 1)
            setStep(step - 1);
        else
            navigate(-1);
    };
    const canProceed = () => {
        if (step === 1)
            return selectedDoctor && selectedDate && selectedTime;
        if (step === 2)
            return true; // Add-ons are optional
        if (step === 3)
            return true; // Medical files are optional for now (can be uploaded later)
        if (step === 4)
            return paymentMethod;
        return false;
    };
    const getButtonLabel = () => {
        if (step === 1)
            return 'Continue to Add-ons';
        if (step === 2)
            return selectedAddons.length > 0 ? 'Continue to Medical Files' : 'Skip to Medical Files';
        if (step === 3)
            return uploadedFiles.length > 0 ? 'Continue to Review' : 'Skip to Review';
        if (step === 4)
            return 'Confirm & Pay';
        return 'Continue';
    };
    return (<div className="min-h-screen bg-gray-50 pb-24">
=======
"use client"

import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  Upload,
  X,
  Plus,
  Shield,
  CreditCard,
  Building,
  Smartphone,
  Info,
  AlertCircle,
  BadgeCheck,
  Star,
  Car,
  Hotel as HotelIcon,
  Globe,
  Headphones,
  FileText,
  MapPin,
  Users,
  Phone,
  Mail,
  Award,
  Languages,
  ChevronLeft,
  Check,
  Percent,
  Tag
} from 'lucide-react';
import { useState } from 'react';

export default function BookingFlow() {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  
  const [step, setStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [depositOption, setDepositOption] = useState<'full' | 'deposit'>('deposit');
  const [promoCode, setPromoCode] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  
  const treatment = {
    id: serviceId || '1',
    name: 'Premium Hair Transplant - FUE Method',
    clinic: 'Istanbul Medical Center',
    city: 'Istanbul',
    country: 'Turkey',
    rating: 4.9,
    reviews: 2847,
    verified: true,
    duration: '6-8 hours',
    recovery: '7-10 days',
    price: 2499,
    currency: 'USD',
    image: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg',
    category: 'Hair Transplant',
    accreditation: 'JCI Accredited'
  };
  
  const doctors = [
    {
      id: '1',
      name: 'Dr. Mehmet Yavuz',
      specialty: 'Hair Transplant Surgeon',
      experience: '18 years',
      rating: 4.9,
      reviews: 1247,
      patients: '12,000+',
      languages: ['English', 'Turkish', 'Arabic'],
      credentials: ['MD', 'ISHRS Member', 'Board Certified'],
      verified: true,
      consultation: 0,
      image: '/unsplash_images/photo-1612349317150-e413f6a5b16d__w=400&h=400&fit=crop.jpg',
      nextAvailable: 'Mar 15, 2026'
    },
    {
      id: '2',
      name: 'Dr. Can Ozturk',
      specialty: 'Hair Restoration Expert',
      experience: '15 years',
      rating: 4.8,
      reviews: 892,
      patients: '10,500+',
      languages: ['English', 'Turkish', 'German'],
      credentials: ['MD', 'FUE Specialist', 'ABHRS'],
      verified: true,
      consultation: 0,
      image: '/unsplash_images/photo-1622253692010-333f2da6031d__w=400&h=400&fit=crop.jpg',
      nextAvailable: 'Mar 12, 2026'
    },
  ];
  
  const availableDates = [
    { date: '2026-03-15', day: 'Mon', available: true },
    { date: '2026-03-16', day: 'Tue', available: true },
    { date: '2026-03-17', day: 'Wed', available: false },
    { date: '2026-03-18', day: 'Thu', available: true },
    { date: '2026-03-19', day: 'Fri', available: true },
    { date: '2026-03-20', day: 'Sat', available: false },
    { date: '2026-03-21', day: 'Sun', available: false },
  ];
  
  const timeSlots = [
    { time: '09:00 AM', available: true },
    { time: '10:00 AM', available: true },
    { time: '11:00 AM', available: false },
    { time: '02:00 PM', available: true },
    { time: '03:00 PM', available: true },
  ];
  
  const addons = [
    {
      id: 'hotel',
      name: '4-Star Hotel Package',
      description: '3 nights accommodation near clinic',
      price: 180,
      icon: <HotelIcon size={24} className="text-[#083f30]" />,
      popular: true,
      details: ['Breakfast included', 'Free WiFi', '10 min from clinic']
    },
    {
      id: 'transfer',
      name: 'VIP Airport Transfer',
      description: 'Round-trip luxury car service',
      price: 80,
      icon: <Car size={24} className="text-[#083f30]" />,
      popular: true,
      details: ['Meet & greet', 'Premium vehicle', 'Professional driver']
    },
    {
      id: 'translator',
      name: 'Personal Translator',
      description: 'Dedicated translator for your stay',
      price: 120,
      icon: <Globe size={24} className="text-[#083f30]" />,
      details: ['Available 24/7', 'Medical terminology expert', 'Multiple languages']
    },
    {
      id: 'vip',
      name: 'VIP Patient Support',
      description: 'Priority support & concierge service',
      price: 150,
      icon: <Headphones size={24} className="text-[#083f30]" />,
      details: ['24/7 hotline', 'Dedicated coordinator', 'Priority scheduling']
    },
    {
      id: 'insurance',
      name: 'Medical Travel Insurance',
      description: 'Comprehensive coverage for your trip',
      price: 95,
      icon: <Shield size={24} className="text-[#083f30]" />,
      details: ['Trip cancellation', 'Medical complications', 'Lost baggage']
    },
  ];
  
  const steps = [
    { num: 1, label: 'Doctor & Date' },
    { num: 2, label: 'Add-ons' },
    { num: 3, label: 'Medical Files' },
    { num: 4, label: 'Review & Pay' },
  ];
  
  const toggleAddon = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter(id => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };
  
  const calculateTotal = () => {
    let total = treatment.price;
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) total += addon.price;
    });
    return total;
  };
  
  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };
  
  const canProceed = () => {
    if (step === 1) return selectedDoctor && selectedDate && selectedTime;
    if (step === 2) return true; // Add-ons are optional
    if (step === 3) return true; // Medical files are optional for now (can be uploaded later)
    if (step === 4) return paymentMethod;
    return false;
  };
  
  const getButtonLabel = () => {
    if (step === 1) return 'Continue to Add-ons';
    if (step === 2) return selectedAddons.length > 0 ? 'Continue to Medical Files' : 'Skip to Medical Files';
    if (step === 3) return uploadedFiles.length > 0 ? 'Continue to Review' : 'Skip to Review';
    if (step === 4) return 'Confirm & Pay';
    return 'Continue';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
<<<<<<< HEAD
            <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95">
              <ArrowLeft size={20} className="text-gray-900"/>
            </button>
            <h1 className="text-lg font-bold text-gray-900">{tBooking("bookTreatment")}</h1>
=======
            <button 
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Book Treatment</h1>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
<<<<<<< HEAD
            {steps.map((s, idx) => (<div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.num
                ? 'bg-[#083f30] text-white'
                : 'bg-gray-200 text-gray-500'}`}>
                    {step > s.num ? <CheckCircle2 size={18}/> : s.num}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${step >= s.num ? 'text-[#083f30]' : 'text-gray-500'}`}>
=======
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                    step >= s.num
                      ? 'bg-[#083f30] text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? <CheckCircle2 size={18} /> : s.num}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${
                    step >= s.num ? 'text-[#083f30]' : 'text-gray-500'
                  }`}>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    {s.label}
                  </span>
                </div>
                
<<<<<<< HEAD
                {idx < steps.length - 1 && (<div className={`h-0.5 flex-1 mx-2 transition-colors ${step > s.num ? 'bg-[#083f30]' : 'bg-gray-200'}`}/>)}
              </div>))}
=======
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                    step > s.num ? 'bg-[#083f30]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-5 py-6">
        {/* Step 1: Doctor & Date Selection */}
<<<<<<< HEAD
        {step === 1 && (<div className="space-y-6">
            {/* Select Doctor */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("chooseYourDoctor")}</h2>
              <div className="space-y-3">
                {doctors.map(doctor => (<button key={doctor.id} onClick={() => setSelectedDoctor(doctor.id)} className={`w-full bg-white rounded-2xl p-4 border-2 transition-all ${selectedDoctor === doctor.id
                    ? 'border-[#083f30] shadow-md'
                    : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <img src={doctor.image} alt={doctor.name} className="w-20 h-20 rounded-xl object-cover"/>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#083f30] rounded-full flex items-center justify-center">
                          <BadgeCheck size={14} className="text-[#eacb7f]"/>
=======
        {step === 1 && (
          <div className="space-y-6">
            {/* Select Doctor */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Choose Your Doctor</h2>
              <div className="space-y-3">
                {doctors.map(doctor => (
                  <button
                    key={doctor.id}
                    onClick={() => setSelectedDoctor(doctor.id)}
                    className={`w-full bg-white rounded-2xl p-4 border-2 transition-all ${
                      selectedDoctor === doctor.id
                        ? 'border-[#083f30] shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={doctor.image}
                          alt={doctor.name}
                          className="w-20 h-20 rounded-xl object-cover"
                        />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#083f30] rounded-full flex items-center justify-center">
                          <BadgeCheck size={14} className="text-[#eacb7f]" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                        </div>
                      </div>
                      
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-gray-900 mb-1">{doctor.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{doctor.specialty}</p>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                          <span>{doctor.experience}</span>
                          <span>•</span>
<<<<<<< HEAD
                          <span>{doctor.patients}{tBooking("patients")}</span>
=======
                          <span>{doctor.patients} patients</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
<<<<<<< HEAD
                            <Star size={14} className="fill-yellow-400 text-yellow-400"/>
                            <span className="font-bold text-sm text-gray-900">{doctor.rating}</span>
                          </div>
                          
                          <span className="text-xs text-[#083f30] font-semibold">{tBooking("next")}{doctor.nextAvailable}
=======
                            <Star size={14} className="fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-sm text-gray-900">{doctor.rating}</span>
                          </div>
                          
                          <span className="text-xs text-[#083f30] font-semibold">
                            Next: {doctor.nextAvailable}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                          </span>
                        </div>
                      </div>
                    </div>
<<<<<<< HEAD
                  </button>))}
=======
                  </button>
                ))}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </div>
            </div>
            
            {/* Select Date */}
            <div>
<<<<<<< HEAD
              <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("selectDate")}</h2>
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-gray-600 rotate-180"/>
                  </button>
                  <span className="font-bold text-gray-900">{tBooking("march2026")}</span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-gray-600"/>
=======
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Date</h2>
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-gray-600 rotate-180" />
                  </button>
                  <span className="font-bold text-gray-900">March 2026</span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-gray-600" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
<<<<<<< HEAD
                  {availableDates.map(date => (<button key={date.date} onClick={() => date.available && setSelectedDate(date.date)} disabled={!date.available} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${selectedDate === date.date
                    ? 'bg-[#083f30] text-white shadow-md'
                    : date.available
                        ? 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                      <span className="text-xs mb-0.5">{date.day}</span>
                      <span className="font-bold">{date.date.split('-')[2]}</span>
                    </button>))}
=======
                  {availableDates.map(date => (
                    <button
                      key={date.date}
                      onClick={() => date.available && setSelectedDate(date.date)}
                      disabled={!date.available}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${
                        selectedDate === date.date
                          ? 'bg-[#083f30] text-white shadow-md'
                          : date.available
                          ? 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-xs mb-0.5">{date.day}</span>
                      <span className="font-bold">{date.date.split('-')[2]}</span>
                    </button>
                  ))}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                </div>
              </div>
            </div>
            
            {/* Select Time */}
<<<<<<< HEAD
            {selectedDate && (<div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("selectTime")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map(slot => (<button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available} className={`h-14 rounded-xl flex items-center justify-center font-semibold transition-all ${selectedTime === slot.time
                        ? 'bg-[#083f30] text-white shadow-md'
                        : slot.available
                            ? 'bg-white border-2 border-gray-200 hover:border-[#083f30] text-gray-900'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                      {slot.time}
                    </button>))}
                </div>
              </div>)}
            
            {/* Selection Summary - Step 1 */}
            {canProceed() && (<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white"/>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">{tBooking("readyToContinue")}</h3>
                    <div className="space-y-1.5 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <BadgeCheck size={14} className="flex-shrink-0"/>
                        <span>{tBooking("doctor")}{doctors.find(d => d.id === selectedDoctor)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="flex-shrink-0"/>
                        <span>{tBooking("date")}{selectedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="flex-shrink-0"/>
                        <span>{tBooking("time2")}{selectedTime}</span>
=======
            {selectedDate && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Time</h2>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`h-14 rounded-xl flex items-center justify-center font-semibold transition-all ${
                        selectedTime === slot.time
                          ? 'bg-[#083f30] text-white shadow-md'
                          : slot.available
                          ? 'bg-white border-2 border-gray-200 hover:border-[#083f30] text-gray-900'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Selection Summary - Step 1 */}
            {canProceed() && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Ready to Continue!</h3>
                    <div className="space-y-1.5 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <BadgeCheck size={14} className="flex-shrink-0" />
                        <span>Doctor: {doctors.find(d => d.id === selectedDoctor)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span>Date: {selectedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="flex-shrink-0" />
                        <span>Time: {selectedTime}</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Continue Button - Directly in Summary */}
<<<<<<< HEAD
                <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">{tBooking("continueToAddOns")}<ChevronRight size={20}/>
                </button>
              </div>)}
          </div>)}
        
        {/* Step 2: Add-ons */}
        {step === 2 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{tBooking("enhanceYourExperience")}</h2>
              <p className="text-sm text-gray-600 mb-4">{tBooking("optionalAddOnsToMakeYourMedicalJourneySeamless")}</p>
            </div>
            
            <div className="space-y-3">
              {addons.map(addon => (<div key={addon.id} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${selectedAddons.includes(addon.id)
                    ? 'border-[#083f30] shadow-md'
                    : 'border-gray-200'}`}>
=======
                <button
                  onClick={handleNext}
                  className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Continue to Add-ons
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Add-ons */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enhance Your Experience</h2>
              <p className="text-sm text-gray-600 mb-4">
                Optional add-ons to make your medical journey seamless
              </p>
            </div>
            
            <div className="space-y-3">
              {addons.map(addon => (
                <div
                  key={addon.id}
                  className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                    selectedAddons.includes(addon.id)
                      ? 'border-[#083f30] shadow-md'
                      : 'border-gray-200'
                  }`}
                >
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  <div className="p-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-[#083f30]/5 rounded-xl flex items-center justify-center flex-shrink-0">
                        {addon.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900">{addon.name}</h3>
<<<<<<< HEAD
                              {addon.popular && (<span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-bold">{tBooking("pOPULAR")}</span>)}
=======
                              {addon.popular && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-bold">
                                  POPULAR
                                </span>
                              )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{addon.description}</p>
                          </div>
                          
                          <div className="text-right ml-3">
                            <div className="text-lg font-bold text-[#083f30]">
                              +${addon.price}
                            </div>
                          </div>
                        </div>
                        
                        {/* Details */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
<<<<<<< HEAD
                          {addon.details.map((detail, idx) => (<span key={idx} className="px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700">
                              • {detail}
                            </span>))}
                        </div>
                        
                        <button onClick={() => toggleAddon(addon.id)} className={`w-full h-10 rounded-xl font-semibold transition-all ${selectedAddons.includes(addon.id)
                    ? 'bg-[#083f30] text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                          {selectedAddons.includes(addon.id) ? (<span className="flex items-center justify-center gap-2">
                              <CheckCircle2 size={18}/>{tBooking("added")}</span>) : (<span className="flex items-center justify-center gap-2">
                              <Plus size={18}/>{tBooking("addToPackage")}</span>)}
=======
                          {addon.details.map((detail, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700"
                            >
                              • {detail}
                            </span>
                          ))}
                        </div>
                        
                        <button
                          onClick={() => toggleAddon(addon.id)}
                          className={`w-full h-10 rounded-xl font-semibold transition-all ${
                            selectedAddons.includes(addon.id)
                              ? 'bg-[#083f30] text-white'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {selectedAddons.includes(addon.id) ? (
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle2 size={18} />
                              Added
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              <Plus size={18} />
                              Add to Package
                            </span>
                          )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                        </button>
                      </div>
                    </div>
                  </div>
<<<<<<< HEAD
                </div>))}
=======
                </div>
              ))}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex gap-3">
<<<<<<< HEAD
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">{tBooking("saveWithBundles")}</h3>
                  <p className="text-sm text-blue-800">{tBooking("add3OrMoreServicesAndGet10Percent")}</p>
=======
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">Save with Bundles</h3>
                  <p className="text-sm text-blue-800">
                    Add 3 or more services and get 10% off all add-ons
                  </p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                </div>
              </div>
            </div>
            
            {/* Continue Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
<<<<<<< HEAD
                  <CheckCircle2 size={20} className="text-white"/>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-1">
                    {selectedAddons.length > 0
                ? `${selectedAddons.length} Add-on${selectedAddons.length > 1 ? 's' : ''} Selected`
                : 'Ready to Continue'}
                  </h3>
                  <p className="text-sm text-blue-800">
                    {selectedAddons.length > 0
                ? 'Enhance your treatment with premium services'
                : 'You can add services later or continue to the next step'}
=======
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-1">
                    {selectedAddons.length > 0 
                      ? `${selectedAddons.length} Add-on${selectedAddons.length > 1 ? 's' : ''} Selected`
                      : 'Ready to Continue'
                    }
                  </h3>
                  <p className="text-sm text-blue-800">
                    {selectedAddons.length > 0 
                      ? 'Enhance your treatment with premium services'
                      : 'You can add services later or continue to the next step'
                    }
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </p>
                </div>
              </div>
              
              {/* Continue Button */}
<<<<<<< HEAD
              <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">
                {selectedAddons.length > 0 ? 'Continue to Medical Files' : 'Skip to Medical Files'}
                <ChevronRight size={20}/>
              </button>
            </div>
          </div>)}
        
        {/* Step 3: Medical Files */}
        {step === 3 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{tBooking("medicalDocumentation")}</h2>
              <p className="text-sm text-gray-600 mb-4">{tBooking("uploadYourMedicalRecordsToHelpOurSpecialistsPrepare")}</p>
            </div>
            
            {/* Upload Area */}
            <div onClick={() => {
                // In real implementation, this would trigger file picker
                if (uploadedFiles.length === 0) {
                    setUploadedFiles(['blood', 'history']);
                }
            }} className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#083f30] hover:bg-[#083f30]/5 transition-all cursor-pointer group">
              <div className="w-16 h-16 bg-[#083f30]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#083f30]/20 transition-colors">
                <Upload size={28} className="text-[#083f30]"/>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{tBooking("uploadMedicalDocuments")}</h3>
              <p className="text-sm text-gray-600 mb-4">{tBooking("pDFJPGPNGUpTo10MBPerFile")}</p>
              <div className="inline-flex px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors">{tBooking("chooseFiles")}</div>
=======
              <button
                onClick={handleNext}
                className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {selectedAddons.length > 0 ? 'Continue to Medical Files' : 'Skip to Medical Files'}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Medical Files */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Medical Documentation</h2>
              <p className="text-sm text-gray-600 mb-4">
                Upload your medical records to help our specialists prepare the best treatment plan for you
              </p>
            </div>
            
            {/* Upload Area */}
            <div 
              onClick={() => {
                // In real implementation, this would trigger file picker
                if (uploadedFiles.length === 0) {
                  setUploadedFiles(['blood', 'history']);
                }
              }}
              className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#083f30] hover:bg-[#083f30]/5 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-[#083f30]/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#083f30]/20 transition-colors">
                <Upload size={28} className="text-[#083f30]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Upload Medical Documents</h3>
              <p className="text-sm text-gray-600 mb-4">
                PDF, JPG, PNG • Up to 10MB per file
              </p>
              <div className="inline-flex px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors">
                Choose Files
              </div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
            
            {/* Required Documents Checklist */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
<<<<<<< HEAD
                  <FileText size={18}/>{tBooking("documentChecklist")}</h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                { name: 'Blood Test Results', required: true, uploaded: uploadedFiles.includes('blood'), description: 'Recent CBC and chemistry panel' },
                { name: 'Medical History Form', required: true, uploaded: uploadedFiles.includes('history'), description: 'Complete health background' },
                { name: 'Previous Treatment Records', required: false, uploaded: uploadedFiles.includes('previous'), description: 'If applicable' },
                { name: 'Allergy Information', required: false, uploaded: uploadedFiles.includes('allergy'), description: 'Known allergies or reactions' },
            ].map((doc, idx) => (<div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${doc.uploaded
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.uploaded
                    ? 'bg-green-600'
                    : 'bg-gray-300'}`}>
                      {doc.uploaded ? (<CheckCircle2 size={20} className="text-white"/>) : (<FileText size={20} className="text-gray-600"/>)}
=======
                  <FileText size={18} />
                  Document Checklist
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {[
                  { name: 'Blood Test Results', required: true, uploaded: uploadedFiles.includes('blood'), description: 'Recent CBC and chemistry panel' },
                  { name: 'Medical History Form', required: true, uploaded: uploadedFiles.includes('history'), description: 'Complete health background' },
                  { name: 'Previous Treatment Records', required: false, uploaded: uploadedFiles.includes('previous'), description: 'If applicable' },
                  { name: 'Allergy Information', required: false, uploaded: uploadedFiles.includes('allergy'), description: 'Known allergies or reactions' },
                ].map((doc, idx) => (
                  <div 
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      doc.uploaded 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      doc.uploaded 
                        ? 'bg-green-600' 
                        : 'bg-gray-300'
                    }`}>
                      {doc.uploaded ? (
                        <CheckCircle2 size={20} className="text-white" />
                      ) : (
                        <FileText size={20} className="text-gray-600" />
                      )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-semibold text-gray-900 text-sm">{doc.name}</div>
<<<<<<< HEAD
                        {doc.required && !doc.uploaded && (<span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold">{tBooking("rEQUIRED")}</span>)}
                        {doc.uploaded && (<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-bold">{tBooking("uPLOADED")}</span>)}
=======
                        {doc.required && !doc.uploaded && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-xs font-bold">
                            REQUIRED
                          </span>
                        )}
                        {doc.uploaded && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-bold">
                            UPLOADED
                          </span>
                        )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                      <p className="text-xs text-gray-600">{doc.description}</p>
                    </div>
                    
<<<<<<< HEAD
                    {!doc.uploaded && (<button onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFiles([...uploadedFiles, doc.name.toLowerCase().split(' ')[0]]);
                    }} className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-semibold hover:bg-[#0a5a44] transition-colors">{tBooking("upload")}</button>)}
                  </div>))}
=======
                    {!doc.uploaded && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadedFiles([...uploadedFiles, doc.name.toLowerCase().split(' ')[0]]);
                        }}
                        className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-semibold hover:bg-[#0a5a44] transition-colors"
                      >
                        Upload
                      </button>
                    )}
                  </div>
                ))}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </div>
            </div>
            
            {/* Upload Later Option */}
<<<<<<< HEAD
            {uploadedFiles.length === 0 && (<div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <h3 className="font-bold text-amber-900 mb-1">{tBooking("uploadLater")}</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">{tBooking("youCanSkipThisStepAndUploadYourMedical")}</p>
                  </div>
                </div>
              </div>)}
=======
            {uploadedFiles.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-amber-900 mb-1">Upload Later</h3>
                    <p className="text-sm text-amber-800 leading-relaxed">
                      You can skip this step and upload your medical files later through your patient portal. However, uploading now helps us prepare your treatment plan faster.
                    </p>
                  </div>
                </div>
              </div>
            )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            
            {/* Continue Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
<<<<<<< HEAD
                  <CheckCircle2 size={20} className="text-white"/>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 mb-1">
                    {uploadedFiles.length > 0
                ? `${uploadedFiles.length} Document${uploadedFiles.length > 1 ? 's' : ''} Uploaded`
                : 'Ready to Continue'}
                  </h3>
                  <p className="text-sm text-green-800">
                    {uploadedFiles.length > 0
                ? 'Medical files uploaded successfully'
                : 'You can upload documents later or continue to review your booking'}
=======
                  <CheckCircle2 size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-900 mb-1">
                    {uploadedFiles.length > 0 
                      ? `${uploadedFiles.length} Document${uploadedFiles.length > 1 ? 's' : ''} Uploaded`
                      : 'Ready to Continue'
                    }
                  </h3>
                  <p className="text-sm text-green-800">
                    {uploadedFiles.length > 0 
                      ? 'Medical files uploaded successfully'
                      : 'You can upload documents later or continue to review your booking'
                    }
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </p>
                </div>
              </div>
              
              {/* Continue Button */}
<<<<<<< HEAD
              <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">
                {uploadedFiles.length > 0 ? 'Continue to Review' : 'Skip to Review'}
                <ChevronRight size={20}/>
              </button>
            </div>
          </div>)}
        
        {/* Step 4: Review & Payment */}
        {step === 4 && (<div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-[#083f30] to-[#0a5a44]">
                <h2 className="text-lg font-bold text-white">{tBooking("bookingSummary")}</h2>
                <p className="text-sm text-[#eacb7f] mt-1">{tBooking("reviewYourMedicalBookingDetails")}</p>
=======
              <button
                onClick={handleNext}
                className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {uploadedFiles.length > 0 ? 'Continue to Review' : 'Skip to Review'}
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Review & Payment */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-[#083f30] to-[#0a5a44]">
                <h2 className="text-lg font-bold text-white">Booking Summary</h2>
                <p className="text-sm text-[#eacb7f] mt-1">Review your medical booking details</p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </div>
              
              <div className="p-4 space-y-4">
                {/* Treatment & Doctor */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
<<<<<<< HEAD
                      <BadgeCheck size={16} className="text-[#083f30]"/>
                    </div>
                    <h3 className="font-bold text-gray-900">{tBooking("treatmentAndSpecialist")}</h3>
                  </div>
                  
                  <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                    <img src={treatment.image} alt={treatment.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0"/>
=======
                      <BadgeCheck size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Treatment & Specialist</h3>
                  </div>
                  
                  <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                    <img 
                      src={treatment.image}
                      alt={treatment.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1 text-sm">{treatment.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{treatment.clinic}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#083f30] text-white rounded-md text-xs font-semibold">
                          {treatment.accreditation}
                        </span>
                        <div className="flex items-center gap-1">
<<<<<<< HEAD
                          <Star size={12} className="fill-yellow-400 text-yellow-400"/>
=======
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                          <span className="text-xs font-semibold text-gray-900">{treatment.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${treatment.price}</div>
                    </div>
                  </div>
                  
                  {/* Selected Doctor */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
<<<<<<< HEAD
                      <img src={doctors.find(d => d.id === selectedDoctor)?.image} alt={doctors.find(d => d.id === selectedDoctor)?.name} className="w-12 h-12 rounded-lg object-cover"/>
=======
                      <img 
                        src={doctors.find(d => d.id === selectedDoctor)?.image}
                        alt={doctors.find(d => d.id === selectedDoctor)?.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">
                          {doctors.find(d => d.id === selectedDoctor)?.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {doctors.find(d => d.id === selectedDoctor)?.specialty}
                        </div>
                      </div>
<<<<<<< HEAD
                      <BadgeCheck size={20} className="text-[#083f30]"/>
=======
                      <BadgeCheck size={20} className="text-[#083f30]" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    </div>
                  </div>
                </div>
                
                {/* Appointment Details */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
<<<<<<< HEAD
                      <Calendar size={16} className="text-[#083f30]"/>
                    </div>
                    <h3 className="font-bold text-gray-900">{tBooking("appointmentSchedule")}</h3>
=======
                      <Calendar size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Appointment Schedule</h3>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
<<<<<<< HEAD
                        <Calendar size={14}/>
                        <span className="text-xs font-semibold">{tBooking("date2")}</span>
=======
                        <Calendar size={14} />
                        <span className="text-xs font-semibold">Date</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                      <div className="font-bold text-gray-900">{selectedDate}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
<<<<<<< HEAD
                        <Clock size={14}/>
                        <span className="text-xs font-semibold">{tBooking("time")}</span>
=======
                        <Clock size={14} />
                        <span className="text-xs font-semibold">Time</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                      <div className="font-bold text-gray-900">{selectedTime}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
<<<<<<< HEAD
                      <CheckCircle2 size={16} className="text-green-600"/>
                      <span className="font-semibold">{tBooking("confirmedAvailability")}</span>
=======
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="font-semibold">Confirmed availability</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    </div>
                  </div>
                </div>
                
                {/* Add-ons */}
<<<<<<< HEAD
                {selectedAddons.length > 0 && (<div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                        <Plus size={16} className="text-[#083f30]"/>
                      </div>
                      <h3 className="font-bold text-gray-900">{tBooking("additionalServices")}</h3>
=======
                {selectedAddons.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                        <Plus size={16} className="text-[#083f30]" />
                      </div>
                      <h3 className="font-bold text-gray-900">Additional Services</h3>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    </div>
                    
                    <div className="space-y-2">
                      {selectedAddons.map(addonId => {
<<<<<<< HEAD
                    const addon = addons.find(a => a.id === addonId);
                    if (!addon)
                        return null;
                    return (<div key={addonId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
=======
                        const addon = addons.find(a => a.id === addonId);
                        if (!addon) return null;
                        return (
                          <div key={addonId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                {addon.icon}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{addon.name}</span>
                            </div>
                            <span className="font-bold text-gray-900">${addon.price}</span>
<<<<<<< HEAD
                          </div>);
                })}
                    </div>
                  </div>)}
=======
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                
                {/* Medical Files Status */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
<<<<<<< HEAD
                      <FileText size={16} className="text-[#083f30]"/>
                    </div>
                    <h3 className="font-bold text-gray-900">{tBooking("medicalDocuments")}</h3>
                  </div>
                  
                  {uploadedFiles.length > 0 ? (<div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-green-600"/>
                          <span className="font-semibold text-green-900 text-sm">
                            {uploadedFiles.length}{tBooking("document")}{uploadedFiles.length > 1 ? 's' : ''}{tBooking("uploaded")}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {uploadedFiles.map((file, idx) => (<div key={idx} className="flex items-center gap-2 text-xs text-green-800">
                            <div className="w-1 h-1 bg-green-600 rounded-full"/>
                            <span className="capitalize">{file}{tBooking("records")}</span>
                          </div>))}
                      </div>
                    </div>) : (<div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2">
                        <Info size={18} className="text-amber-600"/>
                        <span className="font-semibold text-amber-900 text-sm">{tBooking("noDocumentsUploadedYet")}</span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1 ml-6">{tBooking("youCanUploadMedicalFilesAfterBookingConfirmation")}</p>
                    </div>)}
=======
                      <FileText size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Medical Documents</h3>
                  </div>
                  
                  {uploadedFiles.length > 0 ? (
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-green-600" />
                          <span className="font-semibold text-green-900 text-sm">
                            {uploadedFiles.length} document{uploadedFiles.length > 1 ? 's' : ''} uploaded
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {uploadedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-green-800">
                            <div className="w-1 h-1 bg-green-600 rounded-full" />
                            <span className="capitalize">{file} records</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <div className="flex items-center gap-2">
                        <Info size={18} className="text-amber-600" />
                        <span className="font-semibold text-amber-900 text-sm">
                          No documents uploaded yet
                        </span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1 ml-6">
                        You can upload medical files after booking confirmation
                      </p>
                    </div>
                  )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                </div>
                
                {/* Total */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
<<<<<<< HEAD
                      <span className="text-gray-600">{tBooking("treatmentFee")}</span>
                      <span className="font-semibold text-gray-900">${treatment.price}</span>
                    </div>
                    {selectedAddons.length > 0 && (<div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{tBooking("additionalServices2")}</span>
                        <span className="font-semibold text-gray-900">
                          ${selectedAddons.reduce((sum, id) => {
                    const addon = addons.find(a => a.id === id);
                    return sum + (addon?.price || 0);
                }, 0)}
                        </span>
                      </div>)}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{tBooking("platformFee")}</span>
=======
                      <span className="text-gray-600">Treatment fee</span>
                      <span className="font-semibold text-gray-900">${treatment.price}</span>
                    </div>
                    {selectedAddons.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Additional services</span>
                        <span className="font-semibold text-gray-900">
                          ${selectedAddons.reduce((sum, id) => {
                            const addon = addons.find(a => a.id === id);
                            return sum + (addon?.price || 0);
                          }, 0)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Platform fee</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      <span className="font-semibold text-green-600">$0</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#083f30]/5 to-[#0a5a44]/5 rounded-xl">
<<<<<<< HEAD
                    <span className="text-lg font-bold text-gray-900">{tBooking("totalAmount")}</span>
=======
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    <span className="text-2xl font-bold text-[#083f30]">${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div>
<<<<<<< HEAD
              <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("paymentMethod")}</h2>
              <div className="space-y-3">
                {[
                { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard size={24}/>, popular: true },
                { id: 'bank', name: 'Bank Transfer', icon: <Building size={24}/> },
                { id: 'wallet', name: 'Digital Wallet', icon: <Smartphone size={24}/> },
            ].map(method => (<button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`w-full bg-white rounded-xl p-4 border-2 transition-all flex items-center gap-4 ${paymentMethod === method.id
                    ? 'border-[#083f30] shadow-md'
                    : 'border-gray-200 hover:border-gray-300'}`}>
=======
              <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard size={24} />, popular: true },
                  { id: 'bank', name: 'Bank Transfer', icon: <Building size={24} /> },
                  { id: 'wallet', name: 'Digital Wallet', icon: <Smartphone size={24} /> },
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`w-full bg-white rounded-xl p-4 border-2 transition-all flex items-center gap-4 ${
                      paymentMethod === method.id
                        ? 'border-[#083f30] shadow-md'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#083f30]">
                      {method.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{method.name}</h3>
<<<<<<< HEAD
                        {method.popular && (<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-bold">{tBooking("rECOMMENDED")}</span>)}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id
                    ? 'border-[#083f30]'
                    : 'border-gray-300'}`}>
                      {paymentMethod === method.id && (<div className="w-3 h-3 bg-[#083f30] rounded-full"/>)}
                    </div>
                  </button>))}
=======
                        {method.popular && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-bold">
                            RECOMMENDED
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === method.id
                        ? 'border-[#083f30]'
                        : 'border-gray-300'
                    }`}>
                      {paymentMethod === method.id && (
                        <div className="w-3 h-3 bg-[#083f30] rounded-full" />
                      )}
                    </div>
                  </button>
                ))}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </div>
            </div>
            
            {/* Security & Trust Notices */}
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex gap-3">
<<<<<<< HEAD
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">{tBooking("securePayment")}</h3>
                    <p className="text-sm text-green-800 leading-relaxed">{tBooking("yourPaymentIsProtectedByBankGrade256Bit")}</p>
=======
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Secure Payment</h3>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Your payment is protected by bank-grade 256-bit SSL encryption. We never store your card details.
                    </p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex gap-3">
<<<<<<< HEAD
                  <Headphones size={20} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">{tBooking("twentyFourSevenMedicalSupport")}</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">{tBooking("aDedicatedMedicalCoordinatorWillBeAssignedToYou")}</p>
=======
                  <Headphones size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">24/7 Medical Support</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      A dedicated medical coordinator will be assigned to you immediately after booking confirmation.
                    </p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </div>
                </div>
              </div>
            </div>
            
            {/* Terms */}
            <div className="flex items-start gap-3 text-sm text-gray-600 p-4 bg-gray-50 rounded-xl">
<<<<<<< HEAD
              <input type="checkbox" className="mt-1" id="terms"/>
              <label htmlFor="terms">{tBooking("iAgreeToThe")}<a href="#" className="text-[#083f30] font-semibold hover:underline">{tBooking("termsAndConditions")}</a>, <a href="#" className="text-[#083f30] font-semibold hover:underline">{tBooking("privacyPolicy")}</a>{tBooking("and")}<a href="#" className="text-[#083f30] font-semibold hover:underline">{tBooking("cancellationPolicy")}</a>
              </label>
            </div>
          </div>)}
=======
              <input type="checkbox" className="mt-1" id="terms" />
              <label htmlFor="terms">
                I agree to the <a href="#" className="text-[#083f30] font-semibold hover:underline">Terms & Conditions</a>, <a href="#" className="text-[#083f30] font-semibold hover:underline">Privacy Policy</a>, and <a href="#" className="text-[#083f30] font-semibold hover:underline">Cancellation Policy</a>
              </label>
            </div>
          </div>
        )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      </div>
      
      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
<<<<<<< HEAD
          {step > 1 && (<button onClick={handleBack} className="h-12 px-6 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95">{tBooking("back")}</button>)}
          
          <button onClick={() => {
            if (step === 4 && canProceed()) {
                navigate('/app/booking/success');
            }
            else if (canProceed()) {
                handleNext();
            }
        }} disabled={!canProceed()} className={`flex-1 h-14 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${canProceed()
            ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white hover:shadow-xl active:scale-95 shadow-lg'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {getButtonLabel()}
            {canProceed() && <ChevronRight size={20}/>}
          </button>
        </div>
        
        {step === 4 && (<div className="text-center mt-2">
            <span className="text-sm text-gray-600">{tBooking("total2")}<span className="font-bold text-[#083f30]">${calculateTotal()}</span>
            </span>
          </div>)}
        
        {/* Progress Indicator */}
        {!canProceed() && step === 1 && (<div className="text-center mt-2">
=======
          {step > 1 && (
            <button 
              onClick={handleBack}
              className="h-12 px-6 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95"
            >
              Back
            </button>
          )}
          
          <button 
            onClick={() => {
              if (step === 4 && canProceed()) {
                navigate('/app/booking/success');
              } else if (canProceed()) {
                handleNext();
              }
            }}
            disabled={!canProceed()}
            className={`flex-1 h-14 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              canProceed()
                ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white hover:shadow-xl active:scale-95 shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {getButtonLabel()}
            {canProceed() && <ChevronRight size={20} />}
          </button>
        </div>
        
        {step === 4 && (
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              Total: <span className="font-bold text-[#083f30]">${calculateTotal()}</span>
            </span>
          </div>
        )}
        
        {/* Progress Indicator */}
        {!canProceed() && step === 1 && (
          <div className="text-center mt-2">
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            <span className="text-xs text-gray-500">
              {!selectedDoctor && 'Select a doctor to continue'}
              {selectedDoctor && !selectedDate && 'Select a date to continue'}
              {selectedDoctor && selectedDate && !selectedTime && 'Select a time to continue'}
            </span>
<<<<<<< HEAD
          </div>)}
      </div>
    </div>);
}
=======
          </div>
        )}
      </div>
    </div>
  );
}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
