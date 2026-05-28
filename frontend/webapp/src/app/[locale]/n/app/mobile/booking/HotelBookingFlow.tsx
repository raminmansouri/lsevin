import { useNavigate, useParams } from 'react-router';
<<<<<<< HEAD
import { ArrowLeft, Calendar, Clock, ChevronRight, CheckCircle2, Plus, Shield, CreditCard, Building, Smartphone, BadgeCheck, Star, Wifi, Coffee, MapPin, Users, Bed, Maximize2, Utensils, Car, Sun, Sparkles, Award, Moon } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from "next-intl";
export default function HotelBookingFlow() {
    const tBooking = useTranslations("Booking");
    const navigate = useNavigate();
    const { serviceId } = useParams();
    const [step, setStep] = useState<number>(1);
    const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
    const [checkInDate, setCheckInDate] = useState<string | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
    const [guestCount, setGuestCount] = useState<number>(2);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const rooms = [
        {
            id: 'deluxe-room',
            name: 'Deluxe Sea View Room',
            description: 'Spacious room with panoramic ocean views',
            size: '42 m²',
            beds: 'King Bed or 2 Twin Beds',
            capacity: '2 guests',
            price: 180,
            perNight: true,
            amenities: ['Sea View', 'Free WiFi', 'Mini Bar', 'Smart TV'],
            popular: true,
            image: '/unsplash_images/photo-1582719478250-c89cae4dc85b__w=400&h=300&fit=crop.jpg'
        },
        {
            id: 'executive-suite',
            name: 'Executive Suite',
            description: 'Luxurious suite with living area',
            size: '65 m²',
            beds: 'King Bed + Sofa Bed',
            capacity: '3 guests',
            price: 280,
            perNight: true,
            amenities: ['Sea View', 'Living Room', 'Balcony', 'Coffee Machine'],
            popular: true,
            image: '/unsplash_images/photo-1590490360182-c33d57733427__w=400&h=300&fit=crop.jpg'
        },
        {
            id: 'standard-room',
            name: 'Superior City View',
            description: 'Comfortable room with city skyline',
            size: '35 m²',
            beds: 'Queen Bed',
            capacity: '2 guests',
            price: 120,
            perNight: true,
            amenities: ['City View', 'Free WiFi', 'Work Desk', 'Rain Shower'],
            image: '/unsplash_images/photo-1611892440504-42a792e24d32__w=400&h=300&fit=crop.jpg'
        },
    ];
    const addons = [
        {
            id: 'breakfast',
            name: 'Daily Breakfast Buffet',
            description: 'International breakfast for all guests',
            price: 25,
            priceType: 'per night',
            icon: <Utensils size={24} className="text-[#083f30]"/>,
            popular: true
        },
        {
            id: 'airport-transfer',
            name: 'Airport Pickup & Drop-off',
            description: 'Private luxury car transfer service',
            price: 60,
            priceType: 'one-time',
            icon: <Car size={24} className="text-[#083f30]"/>,
            popular: true
        },
        {
            id: 'late-checkout',
            name: 'Late Check-out (6 PM)',
            description: 'Enjoy your room until evening',
            price: 40,
            priceType: 'one-time',
            icon: <Moon size={24} className="text-[#083f30]"/>
        },
        {
            id: 'spa-package',
            name: 'Wellness Spa Package',
            description: '90-min massage + pool access',
            price: 85,
            priceType: 'per person',
            icon: <Sparkles size={24} className="text-[#083f30]"/>
        },
    ];
    const steps = [
        { num: 1, label: 'Room & Dates' },
        { num: 2, label: 'Add-ons' },
        { num: 3, label: 'Review & Pay' },
    ];
    const toggleAddon = (addonId: string) => {
        if (selectedAddons.includes(addonId)) {
            setSelectedAddons(selectedAddons.filter(id => id !== addonId));
        }
        else {
            setSelectedAddons([...selectedAddons, addonId]);
        }
    };
    const calculateNights = () => {
        if (!checkInDate || !checkOutDate)
            return 0;
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const diff = checkOut.getTime() - checkIn.getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };
    const calculateTotal = () => {
        const room = rooms.find(r => r.id === selectedRoom);
        const nights = calculateNights();
        let total = (room?.price || 0) * nights;
        selectedAddons.forEach(addonId => {
            const addon = addons.find(a => a.id === addonId);
            if (addon) {
                if (addon.priceType === 'per night') {
                    total += addon.price * nights;
                }
                else if (addon.priceType === 'per person') {
                    total += addon.price * guestCount;
                }
                else {
                    total += addon.price;
                }
            }
        });
        return total;
    };
    const handleNext = () => {
        if (step < 3)
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
            return selectedRoom && checkInDate && checkOutDate && guestCount > 0;
        if (step === 2)
            return true; // Add-ons are optional
        if (step === 3)
            return paymentMethod;
        return false;
    };
    const getButtonLabel = () => {
        if (step === 1)
            return 'Continue to Add-ons';
        if (step === 2)
            return selectedAddons.length > 0 ? 'Continue to Review' : 'Skip to Review';
        if (step === 3)
            return 'Confirm Reservation';
        return 'Continue';
    };
    const selectedRoomData = rooms.find(r => r.id === selectedRoom);
    return (<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
=======
import { 
  ArrowLeft, 
  Calendar,
  Clock,
  ChevronRight,
  CheckCircle2,
  Plus,
  Shield,
  CreditCard,
  Building,
  Smartphone,
  BadgeCheck,
  Star,
  Wifi,
  Coffee,
  MapPin,
  Users,
  Bed,
  Maximize2,
  Utensils,
  Car,
  Sun,
  Sparkles,
  Award,
  Moon
} from 'lucide-react';
import { useState } from 'react';

export default function HotelBookingFlow() {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  
  const [step, setStep] = useState<number>(1);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [checkInDate, setCheckInDate] = useState<string | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState<number>(2);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  
  const rooms = [
    {
      id: 'deluxe-room',
      name: 'Deluxe Sea View Room',
      description: 'Spacious room with panoramic ocean views',
      size: '42 m²',
      beds: 'King Bed or 2 Twin Beds',
      capacity: '2 guests',
      price: 180,
      perNight: true,
      amenities: ['Sea View', 'Free WiFi', 'Mini Bar', 'Smart TV'],
      popular: true,
      image: '/unsplash_images/photo-1582719478250-c89cae4dc85b__w=400&h=300&fit=crop.jpg'
    },
    {
      id: 'executive-suite',
      name: 'Executive Suite',
      description: 'Luxurious suite with living area',
      size: '65 m²',
      beds: 'King Bed + Sofa Bed',
      capacity: '3 guests',
      price: 280,
      perNight: true,
      amenities: ['Sea View', 'Living Room', 'Balcony', 'Coffee Machine'],
      popular: true,
      image: '/unsplash_images/photo-1590490360182-c33d57733427__w=400&h=300&fit=crop.jpg'
    },
    {
      id: 'standard-room',
      name: 'Superior City View',
      description: 'Comfortable room with city skyline',
      size: '35 m²',
      beds: 'Queen Bed',
      capacity: '2 guests',
      price: 120,
      perNight: true,
      amenities: ['City View', 'Free WiFi', 'Work Desk', 'Rain Shower'],
      image: '/unsplash_images/photo-1611892440504-42a792e24d32__w=400&h=300&fit=crop.jpg'
    },
  ];
  
  const addons = [
    {
      id: 'breakfast',
      name: 'Daily Breakfast Buffet',
      description: 'International breakfast for all guests',
      price: 25,
      priceType: 'per night',
      icon: <Utensils size={24} className="text-[#083f30]" />,
      popular: true
    },
    {
      id: 'airport-transfer',
      name: 'Airport Pickup & Drop-off',
      description: 'Private luxury car transfer service',
      price: 60,
      priceType: 'one-time',
      icon: <Car size={24} className="text-[#083f30]" />,
      popular: true
    },
    {
      id: 'late-checkout',
      name: 'Late Check-out (6 PM)',
      description: 'Enjoy your room until evening',
      price: 40,
      priceType: 'one-time',
      icon: <Moon size={24} className="text-[#083f30]" />
    },
    {
      id: 'spa-package',
      name: 'Wellness Spa Package',
      description: '90-min massage + pool access',
      price: 85,
      priceType: 'per person',
      icon: <Sparkles size={24} className="text-[#083f30]" />
    },
  ];
  
  const steps = [
    { num: 1, label: 'Room & Dates' },
    { num: 2, label: 'Add-ons' },
    { num: 3, label: 'Review & Pay' },
  ];
  
  const toggleAddon = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter(id => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };
  
  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diff = checkOut.getTime() - checkIn.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };
  
  const calculateTotal = () => {
    const room = rooms.find(r => r.id === selectedRoom);
    const nights = calculateNights();
    let total = (room?.price || 0) * nights;
    
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        if (addon.priceType === 'per night') {
          total += addon.price * nights;
        } else if (addon.priceType === 'per person') {
          total += addon.price * guestCount;
        } else {
          total += addon.price;
        }
      }
    });
    return total;
  };
  
  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };
  
  const canProceed = () => {
    if (step === 1) return selectedRoom && checkInDate && checkOutDate && guestCount > 0;
    if (step === 2) return true; // Add-ons are optional
    if (step === 3) return paymentMethod;
    return false;
  };
  
  const getButtonLabel = () => {
    if (step === 1) return 'Continue to Add-ons';
    if (step === 2) return selectedAddons.length > 0 ? 'Continue to Review' : 'Skip to Review';
    if (step === 3) return 'Confirm Reservation';
    return 'Continue';
  };
  
  const selectedRoomData = rooms.find(r => r.id === selectedRoom);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
<<<<<<< HEAD
            <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95">
              <ArrowLeft size={20} className="text-gray-900"/>
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{tBooking("bookYourStay")}</h1>
              <p className="text-xs text-gray-600">{tBooking("step2")}{step} of {steps.length}</p>
=======
            <button 
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Book Your Stay</h1>
              <p className="text-xs text-gray-600">Step {step} of {steps.length}</p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
<<<<<<< HEAD
            {steps.map((s, idx) => (<div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s.num
                ? 'bg-gradient-to-br from-[#083f30] to-[#0a5a44] text-white shadow-md'
                : 'bg-gray-200 text-gray-500'}`}>
                    {step > s.num ? <CheckCircle2 size={18}/> : s.num}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${step >= s.num ? 'text-[#083f30]' : 'text-gray-500'}`}>
=======
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    step >= s.num
                      ? 'bg-gradient-to-br from-[#083f30] to-[#0a5a44] text-white shadow-md'
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
        {/* Step 1: Room Selection & Dates */}
<<<<<<< HEAD
        {step === 1 && (<div className="space-y-6">
            {/* Select Room */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("selectYourRoom")}</h2>
              <div className="space-y-3">
                {rooms.map(room => (<button key={room.id} onClick={() => setSelectedRoom(room.id)} className={`w-full bg-white rounded-2xl overflow-hidden border-2 transition-all ${selectedRoom === room.id
                    ? 'border-[#083f30] shadow-lg scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="relative">
                      <img src={room.image} alt={room.name} className="w-full h-48 object-cover"/>
                      {room.popular && (<div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] text-[#083f30] rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                          <Award size={12}/>{tBooking("mOSTPOPULAR")}</div>)}
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-lg">
                        <div className="text-xs text-gray-600">{tBooking("from")}</div>
                        <div className="text-lg font-bold text-[#083f30]">${room.price}</div>
                        <div className="text-xs text-gray-600">{tBooking("perNight")}</div>
=======
        {step === 1 && (
          <div className="space-y-6">
            {/* Select Room */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Your Room</h2>
              <div className="space-y-3">
                {rooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`w-full bg-white rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedRoom === room.id
                        ? 'border-[#083f30] shadow-lg scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={room.image}
                        alt={room.name}
                        className="w-full h-48 object-cover"
                      />
                      {room.popular && (
                        <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] text-[#083f30] rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                          <Award size={12} />
                          MOST POPULAR
                        </div>
                      )}
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/95 backdrop-blur-sm rounded-lg">
                        <div className="text-xs text-gray-600">from</div>
                        <div className="text-lg font-bold text-[#083f30]">${room.price}</div>
                        <div className="text-xs text-gray-600">per night</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">{room.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{room.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
<<<<<<< HEAD
                          <Maximize2 size={14} className="text-[#083f30]"/>
                          <span>{room.size}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Bed size={14} className="text-[#083f30]"/>
                          <span>{room.beds}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Users size={14} className="text-[#083f30]"/>
=======
                          <Maximize2 size={14} className="text-[#083f30]" />
                          <span>{room.size}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Bed size={14} className="text-[#083f30]" />
                          <span>{room.beds}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Users size={14} className="text-[#083f30]" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                          <span>{room.capacity}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5">
<<<<<<< HEAD
                        {room.amenities.map((amenity, idx) => (<span key={idx} className="px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700">
                            • {amenity}
                          </span>))}
                      </div>
                    </div>
                  </button>))}
=======
                        {room.amenities.map((amenity, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700"
                          >
                            • {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                ))}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </div>
            </div>
            
            {/* Select Dates */}
<<<<<<< HEAD
            {selectedRoom && (<div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("checkInAndCheckOut")}</h2>
                <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Sun size={16} className="text-[#083f30]"/>{tBooking("checkInDate")}</label>
                    <input type="date" value={checkInDate || ''} onChange={(e) => setCheckInDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-[#083f30] focus:outline-none font-semibold"/>
=======
            {selectedRoom && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Check-in & Check-out</h2>
                <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-3">
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Sun size={16} className="text-[#083f30]" />
                      Check-in Date
                    </label>
                    <input
                      type="date"
                      value={checkInDate || ''}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-[#083f30] focus:outline-none font-semibold"
                    />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </div>
                  
                  <div>
                    <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
<<<<<<< HEAD
                      <Moon size={16} className="text-[#083f30]"/>{tBooking("checkOutDate")}</label>
                    <input type="date" value={checkOutDate || ''} onChange={(e) => setCheckOutDate(e.target.value)} min={checkInDate || new Date().toISOString().split('T')[0]} className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-[#083f30] focus:outline-none font-semibold"/>
                  </div>
                  
                  {checkInDate && checkOutDate && (<div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-900 font-semibold">{tBooking("totalNights")}</span>
                        <span className="text-blue-700 font-bold text-lg">{calculateNights()}{tBooking("nights")}</span>
                      </div>
                    </div>)}
                </div>
              </div>)}
            
            {/* Guest Count */}
            {checkInDate && checkOutDate && (<div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("numberOfGuests")}</h2>
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={20} className="text-[#083f30]"/>
                      <span className="font-semibold text-gray-900">{tBooking("guests")}</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button onClick={() => setGuestCount(Math.max(1, guestCount - 1))} className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-900 transition-colors">
                        -
                      </button>
                      <span className="text-xl font-bold text-gray-900 w-8 text-center">{guestCount}</span>
                      <button onClick={() => setGuestCount(guestCount + 1)} className="w-10 h-10 rounded-full bg-[#083f30] hover:bg-[#0a5a44] flex items-center justify-center font-bold text-white transition-colors">
=======
                      <Moon size={16} className="text-[#083f30]" />
                      Check-out Date
                    </label>
                    <input
                      type="date"
                      value={checkOutDate || ''}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      min={checkInDate || new Date().toISOString().split('T')[0]}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-[#083f30] focus:outline-none font-semibold"
                    />
                  </div>
                  
                  {checkInDate && checkOutDate && (
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-900 font-semibold">Total Nights:</span>
                        <span className="text-blue-700 font-bold text-lg">{calculateNights()} nights</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Guest Count */}
            {checkInDate && checkOutDate && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Number of Guests</h2>
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={20} className="text-[#083f30]" />
                      <span className="font-semibold text-gray-900">Guests</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-900 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-gray-900 w-8 text-center">{guestCount}</span>
                      <button
                        onClick={() => setGuestCount(guestCount + 1)}
                        className="w-10 h-10 rounded-full bg-[#083f30] hover:bg-[#0a5a44] flex items-center justify-center font-bold text-white transition-colors"
                      >
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                        +
                      </button>
                    </div>
                  </div>
                </div>
<<<<<<< HEAD
              </div>)}
            
            {/* Selection Summary - Step 1 */}
            {canProceed() && (<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-md">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white"/>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">{tBooking("yourStayIsReady")}</h3>
                    <div className="space-y-1.5 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <Bed size={14} className="flex-shrink-0"/>
                        <span>{tBooking("room")}{selectedRoomData?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="flex-shrink-0"/>
                        <span>{checkInDate} to {checkOutDate} ({calculateNights()}{tBooking("nights2")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="flex-shrink-0"/>
=======
              </div>
            )}
            
            {/* Selection Summary - Step 1 */}
            {canProceed() && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-md">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Your Stay is Ready!</h3>
                    <div className="space-y-1.5 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <Bed size={14} className="flex-shrink-0" />
                        <span>Room: {selectedRoomData?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span>{checkInDate} to {checkOutDate} ({calculateNights()} nights)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="flex-shrink-0" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                        <span>{guestCount} {guestCount === 1 ? 'guest' : 'guests'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Continue Button */}
<<<<<<< HEAD
                <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">{tBooking("continueToAddOns")}<ChevronRight size={20}/>
                </button>
              </div>)}
          </div>)}
        
        {/* Step 2: Add-ons */}
        {step === 2 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{tBooking("enhanceYourStay")}</h2>
              <p className="text-sm text-gray-600 mb-4">{tBooking("optionalServicesToMakeYourExperienceUnforgettable")}</p>
            </div>
            
            <div className="space-y-3">
              {addons.map(addon => (<div key={addon.id} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${selectedAddons.includes(addon.id)
                    ? 'border-[#083f30] shadow-lg'
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
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enhance Your Stay</h2>
              <p className="text-sm text-gray-600 mb-4">
                Optional services to make your experience unforgettable
              </p>
            </div>
            
            <div className="space-y-3">
              {addons.map(addon => (
                <div
                  key={addon.id}
                  className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                    selectedAddons.includes(addon.id)
                      ? 'border-[#083f30] shadow-lg'
                      : 'border-gray-200'
                  }`}
                >
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  <div className="p-4">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#083f30]/10 to-[#0a5a44]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        {addon.icon}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
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
                            <p className="text-sm text-gray-600">{addon.description}</p>
                          </div>
                          
                          <div className="text-right ml-3">
                            <div className="text-lg font-bold text-[#083f30]">
                              ${addon.price}
                            </div>
                            <div className="text-xs text-gray-600">{addon.priceType}</div>
                          </div>
                        </div>
                        
<<<<<<< HEAD
                        <button onClick={() => toggleAddon(addon.id)} className={`w-full h-10 rounded-xl font-semibold transition-all ${selectedAddons.includes(addon.id)
                    ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white shadow-md'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                          {selectedAddons.includes(addon.id) ? (<span className="flex items-center justify-center gap-2">
                              <CheckCircle2 size={18}/>{tBooking("added")}</span>) : (<span className="flex items-center justify-center gap-2">
                              <Plus size={18}/>{tBooking("addToBooking")}</span>)}
=======
                        <button
                          onClick={() => toggleAddon(addon.id)}
                          className={`w-full h-10 rounded-xl font-semibold transition-all ${
                            selectedAddons.includes(addon.id)
                              ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white shadow-md'
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
                              Add to Booking
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
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex gap-3">
<<<<<<< HEAD
                <Sparkles size={20} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">{tBooking("luxuryExperience")}</h3>
                  <p className="text-sm text-blue-800">{tBooking("addBreakfastPlusSpaPackageForTheCompleteRelaxation")}</p>
                </div>
              </div>
            </div>
          </div>)}
        
        {/* Step 3: Review & Payment */}
        {step === 3 && (<div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="p-4 bg-gradient-to-r from-[#083f30] to-[#0a5a44]">
                <h2 className="text-lg font-bold text-white">{tBooking("reservationSummary")}</h2>
                <p className="text-sm text-[#eacb7f] mt-1">{tBooking("reviewYourBookingDetails")}</p>
=======
                <Sparkles size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">Luxury Experience</h3>
                  <p className="text-sm text-blue-800">
                    Add breakfast + spa package for the complete relaxation getaway
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 3: Review & Payment */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="p-4 bg-gradient-to-r from-[#083f30] to-[#0a5a44]">
                <h2 className="text-lg font-bold text-white">Reservation Summary</h2>
                <p className="text-sm text-[#eacb7f] mt-1">Review your booking details</p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </div>
              
              <div className="p-4 space-y-4">
                {/* Room Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
<<<<<<< HEAD
                      <Bed size={16} className="text-[#083f30]"/>
                    </div>
                    <h3 className="font-bold text-gray-900">{tBooking("selectedRoom")}</h3>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img src={selectedRoomData?.image} alt={selectedRoomData?.name} className="w-full h-32 object-cover"/>
=======
                      <Bed size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Selected Room</h3>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img 
                      src={selectedRoomData?.image}
                      alt={selectedRoomData?.name}
                      className="w-full h-32 object-cover"
                    />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    <div className="p-3 bg-gray-50">
                      <h4 className="font-bold text-gray-900 mb-1">{selectedRoomData?.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{selectedRoomData?.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-700">
                        <span>{selectedRoomData?.size}</span>
                        <span>•</span>
                        <span>{selectedRoomData?.capacity}</span>
                        <span>•</span>
<<<<<<< HEAD
                        <span className="font-bold text-[#083f30]">${selectedRoomData?.price}{tBooking("night")}</span>
=======
                        <span className="font-bold text-[#083f30]">${selectedRoomData?.price}/night</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stay Details */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
<<<<<<< HEAD
                      <Calendar size={16} className="text-[#083f30]"/>
                    </div>
                    <h3 className="font-bold text-gray-900">{tBooking("stayDetails")}</h3>
=======
                      <Calendar size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Stay Details</h3>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
<<<<<<< HEAD
                        <Sun size={16} className="text-[#083f30]"/>
                        <span className="font-semibold">{tBooking("checkIn")}</span>
=======
                        <Sun size={16} className="text-[#083f30]" />
                        <span className="font-semibold">Check-in</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                      <span className="font-bold text-gray-900">{checkInDate}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
<<<<<<< HEAD
                        <Moon size={16} className="text-[#083f30]"/>
                        <span className="font-semibold">{tBooking("checkOut")}</span>
=======
                        <Moon size={16} className="text-[#083f30]" />
                        <span className="font-semibold">Check-out</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                      <span className="font-bold text-gray-900">{checkOutDate}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
<<<<<<< HEAD
                        <Users size={16} className="text-[#083f30]"/>
                        <span className="font-semibold">{tBooking("guests")}</span>
=======
                        <Users size={16} className="text-[#083f30]" />
                        <span className="font-semibold">Guests</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      </div>
                      <span className="font-bold text-gray-900">{guestCount} {guestCount === 1 ? 'guest' : 'guests'}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between text-sm">
<<<<<<< HEAD
                      <span className="text-blue-900 font-semibold">{tBooking("totalDuration")}</span>
                      <span className="text-blue-700 font-bold">{calculateNights()}{tBooking("nights")}</span>
=======
                      <span className="text-blue-900 font-semibold">Total Duration</span>
                      <span className="text-blue-700 font-bold">{calculateNights()} nights</span>
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
                    let addonTotal = addon.price;
                    if (addon.priceType === 'per night')
                        addonTotal *= calculateNights();
                    if (addon.priceType === 'per person')
                        addonTotal *= guestCount;
                    return (<div key={addonId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
=======
                        const addon = addons.find(a => a.id === addonId);
                        if (!addon) return null;
                        
                        let addonTotal = addon.price;
                        if (addon.priceType === 'per night') addonTotal *= calculateNights();
                        if (addon.priceType === 'per person') addonTotal *= guestCount;
                        
                        return (
                          <div key={addonId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                {addon.icon}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">{addon.name}</div>
                                <div className="text-xs text-gray-600">{addon.priceType}</div>
                              </div>
                            </div>
                            <span className="font-bold text-gray-900">${addonTotal}</span>
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
                
                {/* Total */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
<<<<<<< HEAD
                      <span className="text-gray-600">{tBooking("room2")}{calculateNights()}{tBooking("nights2")}</span>
                      <span className="font-semibold text-gray-900">${(selectedRoomData?.price || 0) * calculateNights()}</span>
                    </div>
                    {selectedAddons.length > 0 && (<div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{tBooking("additionalServices2")}</span>
                        <span className="font-semibold text-gray-900">
                          ${calculateTotal() - (selectedRoomData?.price || 0) * calculateNights()}
                        </span>
                      </div>)}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{tBooking("serviceFee")}</span>
                      <span className="font-semibold text-green-600">{tBooking("free")}</span>
=======
                      <span className="text-gray-600">Room ({calculateNights()} nights)</span>
                      <span className="font-semibold text-gray-900">${(selectedRoomData?.price || 0) * calculateNights()}</span>
                    </div>
                    {selectedAddons.length > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Additional services</span>
                        <span className="font-semibold text-gray-900">
                          ${calculateTotal() - (selectedRoomData?.price || 0) * calculateNights()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Service fee</span>
                      <span className="font-semibold text-green-600">Free</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
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
            
            {/* Trust Notices */}
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex gap-3">
<<<<<<< HEAD
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">{tBooking("secureBooking")}</h3>
                    <p className="text-sm text-green-800 leading-relaxed">{tBooking("yourReservationIsProtectedWith256BitSSLEncryption")}</p>
=======
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Secure Booking</h3>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Your reservation is protected with 256-bit SSL encryption and instant confirmation.
                    </p>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex gap-3">
<<<<<<< HEAD
                  <BadgeCheck size={20} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">{tBooking("freeCancellation")}</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">{tBooking("cancelFreeOfChargeUpTo48HoursBefore")}</p>
=======
                  <BadgeCheck size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Free Cancellation</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Cancel free of charge up to 48 hours before check-in. Full refund guaranteed.
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
              <label htmlFor="terms">{tBooking("iAgreeToThe")}<a href="#" className="text-[#083f30] font-semibold hover:underline">{tBooking("termsAndConditions")}</a> and <a href="#" className="text-[#083f30] font-semibold hover:underline">{tBooking("cancellationPolicy")}</a>
              </label>
            </div>
          </div>)}
=======
              <input type="checkbox" className="mt-1" id="terms" />
              <label htmlFor="terms">
                I agree to the <a href="#" className="text-[#083f30] font-semibold hover:underline">Terms & Conditions</a> and <a href="#" className="text-[#083f30] font-semibold hover:underline">Cancellation Policy</a>
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
            if (step === 3 && canProceed()) {
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
        
        {step === 3 && (<div className="text-center mt-2">
            <span className="text-sm text-gray-600">{tBooking("total2")}<span className="font-bold text-[#083f30]">${calculateTotal()}</span>
            </span>
          </div>)}
      </div>
    </div>);
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
              if (step === 3 && canProceed()) {
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
        
        {step === 3 && (
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              Total: <span className="font-bold text-[#083f30]">${calculateTotal()}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
}
