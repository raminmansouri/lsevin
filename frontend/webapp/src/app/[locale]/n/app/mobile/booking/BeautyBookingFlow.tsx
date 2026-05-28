import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Calendar, Clock, ChevronRight, CheckCircle2, Plus, Shield, CreditCard, Building, Smartphone, BadgeCheck, Star, Sparkles, Crown, Gift, Heart, ChevronLeft, Tag, Users } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from "next-intl";
export default function BeautyBookingFlow() {
    const tBooking = useTranslations("Booking");
    const navigate = useNavigate();
    const { serviceId } = useParams();
    const [step, setStep] = useState<number>(1);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [selectedService, setSelectedService] = useState<string | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
    const services = [
        {
            id: 'hair-treatment',
            name: 'Keratin Hair Treatment',
            description: 'Professional smoothing treatment',
            duration: '2.5 hours',
            price: 180,
            category: 'Hair Care',
            popular: true,
            image: '/unsplash_images/photo-1560066984-138dadb4c035__w=400&h=300&fit=crop.jpg'
        },
        {
            id: 'spa-facial',
            name: 'Luxury Facial Spa',
            description: 'Deep cleansing and rejuvenation',
            duration: '90 min',
            price: 120,
            category: 'Facial',
            popular: true,
            image: '/unsplash_images/photo-1570172619644-dfd03ed5d881__w=400&h=300&fit=crop.jpg'
        },
        {
            id: 'manicure-pedicure',
            name: 'Premium Manicure & Pedicure',
            description: 'Complete nail care package',
            duration: '60 min',
            price: 85,
            category: 'Nails',
            image: '/unsplash_images/photo-1604654894610-df63bc536371__w=400&h=300&fit=crop.jpg'
        },
    ];
    const staff = [
        {
            id: '1',
            name: 'Emma Rodriguez',
            specialty: 'Senior Hair Stylist',
            experience: '12 years',
            rating: 4.9,
            reviews: 847,
            clients: '2,500+',
            image: '/unsplash_images/photo-1580489944761-15a19d654956__w=400&h=400&fit=crop.jpg',
            verified: true,
            nextAvailable: 'Mar 15, 2026'
        },
        {
            id: '2',
            name: 'Sophia Chen',
            specialty: 'Spa & Facial Expert',
            experience: '10 years',
            rating: 4.8,
            reviews: 692,
            clients: '2,200+',
            image: '/unsplash_images/photo-1573496359142-b8d87734a5a2__w=400&h=400&fit=crop.jpg',
            verified: true,
            nextAvailable: 'Mar 12, 2026'
        },
        {
            id: '3',
            name: 'Isabella Martinez',
            specialty: 'Nail Artist',
            experience: '8 years',
            rating: 4.9,
            reviews: 534,
            clients: '1,800+',
            image: '/unsplash_images/photo-1594744803329-e58b31de8bf5__w=400&h=400&fit=crop.jpg',
            verified: true,
            nextAvailable: 'Mar 14, 2026'
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
        { time: '04:30 PM', available: true },
    ];
    const addons = [
        {
            id: 'premium-products',
            name: 'Premium Product Upgrade',
            description: 'Luxury organic and professional-grade products',
            price: 45,
            icon: <Sparkles size={24} className="text-[#083f30]"/>,
            popular: true
        },
        {
            id: 'vip-room',
            name: 'VIP Private Suite',
            description: 'Exclusive private room with premium amenities',
            price: 60,
            icon: <Crown size={24} className="text-[#083f30]"/>,
            popular: true
        },
        {
            id: 'scalp-massage',
            name: 'Relaxing Scalp Massage',
            description: '15-minute therapeutic scalp treatment',
            price: 25,
            icon: <Heart size={24} className="text-[#083f30]"/>
        },
        {
            id: 'gift-package',
            name: 'Take-Home Care Package',
            description: 'Professional products for at-home maintenance',
            price: 55,
            icon: <Gift size={24} className="text-[#083f30]"/>
        },
    ];
    const steps = [
        { num: 1, label: 'Service & Date' },
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
    const calculateTotal = () => {
        const service = services.find(s => s.id === selectedService);
        let total = service?.price || 0;
        selectedAddons.forEach(addonId => {
            const addon = addons.find(a => a.id === addonId);
            if (addon)
                total += addon.price;
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
            return selectedService && selectedStaff && selectedDate && selectedTime;
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
            return 'Confirm Booking';
        return 'Continue';
    };
    const selectedServiceData = services.find(s => s.id === selectedService);
    const selectedStaffData = staff.find(s => s.id === selectedStaff);
    return (<div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={handleBack} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95">
              <ArrowLeft size={20} className="text-gray-900"/>
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">{tBooking("bookYourService")}</h1>
              <p className="text-xs text-gray-600">{tBooking("step2")}{step} of {steps.length}</p>
            </div>
          </div>
          
          {/* Elegant Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => (<div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${step >= s.num
                ? 'bg-gradient-to-br from-[#083f30] to-[#0a5a44] text-white shadow-md'
                : 'bg-gray-200 text-gray-500'}`}>
                    {step > s.num ? <CheckCircle2 size={18}/> : s.num}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${step >= s.num ? 'text-[#083f30]' : 'text-gray-500'}`}>
                    {s.label}
                  </span>
                </div>
                
                {idx < steps.length - 1 && (<div className={`h-0.5 flex-1 mx-2 transition-colors ${step > s.num ? 'bg-[#083f30]' : 'bg-gray-200'}`}/>)}
              </div>))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-5 py-6">
        {/* Step 1: Service, Staff & Date Selection */}
        {step === 1 && (<div className="space-y-6">
            {/* Select Service */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("chooseYourService")}</h2>
              <div className="space-y-3">
                {services.map(service => (<button key={service.id} onClick={() => setSelectedService(service.id)} className={`w-full bg-white rounded-2xl overflow-hidden border-2 transition-all ${selectedService === service.id
                    ? 'border-[#083f30] shadow-lg scale-[1.02]'
                    : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex gap-4 p-4">
                      <div className="relative flex-shrink-0">
                        <img src={service.image} alt={service.name} className="w-24 h-24 rounded-xl object-cover"/>
                        {service.popular && (<div className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] text-[#083f30] rounded-lg text-xs font-bold shadow-md">{tBooking("pOPULAR")}</div>)}
                      </div>
                      
                      <div className="flex-1 text-left">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-1">{service.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock size={14}/>
                                <span>{service.duration}</span>
                              </div>
                              <span>•</span>
                              <span className="px-2 py-0.5 bg-gray-100 rounded-md font-semibold">
                                {service.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right ml-3">
                            <div className="text-lg font-bold text-[#083f30]">
                              ${service.price}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>))}
              </div>
            </div>
            
            {/* Select Staff */}
            {selectedService && (<div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("chooseYourSpecialist")}</h2>
                <div className="space-y-3">
                  {staff.map(person => (<button key={person.id} onClick={() => setSelectedStaff(person.id)} className={`w-full bg-white rounded-2xl p-4 border-2 transition-all ${selectedStaff === person.id
                        ? 'border-[#083f30] shadow-md'
                        : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex gap-4">
                        <div className="relative flex-shrink-0">
                          <img src={person.image} alt={person.name} className="w-20 h-20 rounded-xl object-cover"/>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#083f30] rounded-full flex items-center justify-center">
                            <BadgeCheck size={14} className="text-[#eacb7f]"/>
                          </div>
                        </div>
                        
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-gray-900 mb-1">{person.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{person.specialty}</p>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                            <span>{person.experience}</span>
                            <span>•</span>
                            <span>{person.clients}{tBooking("clients")}</span>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Star size={14} className="fill-yellow-400 text-yellow-400"/>
                              <span className="font-bold text-sm text-gray-900">{person.rating}</span>
                              <span className="text-xs text-gray-600">({person.reviews})</span>
                            </div>
                            
                            <span className="text-xs text-[#083f30] font-semibold">{tBooking("available")}{person.nextAvailable}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>))}
                </div>
              </div>)}
            
            {/* Select Date */}
            {selectedStaff && (<div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("selectDate")}</h2>
                <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <ChevronRight size={20} className="text-gray-600 rotate-180"/>
                    </button>
                    <span className="font-bold text-gray-900">{tBooking("march2026")}</span>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <ChevronRight size={20} className="text-gray-600"/>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-2">
                    {availableDates.map(date => (<button key={date.date} onClick={() => date.available && setSelectedDate(date.date)} disabled={!date.available} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all ${selectedDate === date.date
                        ? 'bg-gradient-to-br from-[#083f30] to-[#0a5a44] text-white shadow-md'
                        : date.available
                            ? 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                        <span className="text-xs mb-0.5">{date.day}</span>
                        <span className="font-bold">{date.date.split('-')[2]}</span>
                      </button>))}
                  </div>
                </div>
              </div>)}
            
            {/* Select Time */}
            {selectedDate && (<div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("selectTime")}</h2>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map(slot => (<button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available} className={`h-14 rounded-xl flex items-center justify-center font-semibold transition-all ${selectedTime === slot.time
                        ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white shadow-md'
                        : slot.available
                            ? 'bg-white border-2 border-gray-200 hover:border-[#083f30] text-gray-900'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                      {slot.time}
                    </button>))}
                </div>
              </div>)}
            
            {/* Selection Summary - Step 1 */}
            {canProceed() && (<div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 shadow-md">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={20} className="text-white"/>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">{tBooking("perfectYourBookingIsReady")}</h3>
                    <div className="space-y-1.5 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="flex-shrink-0"/>
                        <span>{tBooking("service2")}{selectedServiceData?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={14} className="flex-shrink-0"/>
                        <span>{tBooking("specialist2")}{selectedStaffData?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="flex-shrink-0"/>
                        <span>{tBooking("date")}{selectedDate} at {selectedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Continue Button */}
                <button onClick={handleNext} className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg">{tBooking("continueToAddOns")}<ChevronRight size={20}/>
                </button>
              </div>)}
          </div>)}
        
        {/* Step 2: Add-ons */}
        {step === 2 && (<div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{tBooking("enhanceYourExperience")}</h2>
              <p className="text-sm text-gray-600 mb-4">{tBooking("addPremiumUpgradesToMakeYourVisitEvenMore")}</p>
            </div>
            
            <div className="space-y-3">
              {addons.map(addon => (<div key={addon.id} className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${selectedAddons.includes(addon.id)
                    ? 'border-[#083f30] shadow-lg'
                    : 'border-gray-200'}`}>
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
                              {addon.popular && (<span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-bold">{tBooking("pOPULAR")}</span>)}
                            </div>
                            <p className="text-sm text-gray-600">{addon.description}</p>
                          </div>
                          
                          <div className="text-right ml-3">
                            <div className="text-lg font-bold text-[#083f30]">
                              +${addon.price}
                            </div>
                          </div>
                        </div>
                        
                        <button onClick={() => toggleAddon(addon.id)} className={`w-full h-10 rounded-xl font-semibold transition-all ${selectedAddons.includes(addon.id)
                    ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white shadow-md'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>
                          {selectedAddons.includes(addon.id) ? (<span className="flex items-center justify-center gap-2">
                              <CheckCircle2 size={18}/>{tBooking("added")}</span>) : (<span className="flex items-center justify-center gap-2">
                              <Plus size={18}/>{tBooking("addToPackage")}</span>)}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>))}
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex gap-3">
                <Sparkles size={20} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">{tBooking("vIPTreatment")}</h3>
                  <p className="text-sm text-blue-800">{tBooking("add2OrMorePremiumServicesForTheUltimate")}</p>
                </div>
              </div>
            </div>
          </div>)}
        
        {/* Step 3: Review & Payment */}
        {step === 3 && (<div className="space-y-6">
            {/* Booking Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
              <div className="p-4 bg-gradient-to-r from-[#083f30] to-[#0a5a44]">
                <h2 className="text-lg font-bold text-white">{tBooking("bookingSummary")}</h2>
                <p className="text-sm text-[#eacb7f] mt-1">{tBooking("reviewYourBeautyAppointment")}</p>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Service Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Sparkles size={16} className="text-[#083f30]"/>
                    </div>
                    <h3 className="font-bold text-gray-900">{tBooking("selectedService")}</h3>
                  </div>
                  
                  <div className="flex gap-4 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <img src={selectedServiceData?.image} alt={selectedServiceData?.name} className="w-20 h-20 rounded-lg object-cover flex-shrink-0"/>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1">{selectedServiceData?.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{selectedServiceData?.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-white rounded-md text-xs font-semibold text-gray-900">
                          {selectedServiceData?.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock size={12}/>
                          <span>{selectedServiceData?.duration}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${selectedServiceData?.price}</div>
                    </div>
                  </div>
                  
                  {/* Selected Staff */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <img src={selectedStaffData?.image} alt={selectedStaffData?.name} className="w-12 h-12 rounded-lg object-cover"/>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">
                          {selectedStaffData?.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {selectedStaffData?.specialty}
                        </div>
                      </div>
                      <BadgeCheck size={20} className="text-[#083f30]"/>
                    </div>
                  </div>
                </div>
                
                {/* Appointment Details */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-[#083f30]"/>
                    </div>
                    <h3 className="font-bold text-gray-900">{tBooking("appointmentTime")}</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar size={14}/>
                        <span className="text-xs font-semibold">{tBooking("date2")}</span>
                      </div>
                      <div className="font-bold text-gray-900">{selectedDate}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Clock size={14}/>
                        <span className="text-xs font-semibold">{tBooking("time")}</span>
                      </div>
                      <div className="font-bold text-gray-900">{selectedTime}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <CheckCircle2 size={16} className="text-green-600"/>
                      <span className="font-semibold">{tBooking("confirmedAvailability")}</span>
                    </div>
                  </div>
                </div>
                
                {/* Add-ons */}
                {selectedAddons.length > 0 && (<div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                        <Plus size={16} className="text-[#083f30]"/>
                      </div>
                      <h3 className="font-bold text-gray-900">{tBooking("premiumAddOns")}</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedAddons.map(addonId => {
                    const addon = addons.find(a => a.id === addonId);
                    if (!addon)
                        return null;
                    return (<div key={addonId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                {addon.icon}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{addon.name}</span>
                            </div>
                            <span className="font-bold text-gray-900">${addon.price}</span>
                          </div>);
                })}
                    </div>
                  </div>)}
                
                {/* Total */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{tBooking("serviceFee")}</span>
                      <span className="font-semibold text-gray-900">${selectedServiceData?.price}</span>
                    </div>
                    {selectedAddons.length > 0 && (<div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{tBooking("premiumAddOns2")}</span>
                        <span className="font-semibold text-gray-900">
                          ${selectedAddons.reduce((sum, id) => {
                    const addon = addons.find(a => a.id === id);
                    return sum + (addon?.price || 0);
                }, 0)}
                        </span>
                      </div>)}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{tBooking("bookingFee")}</span>
                      <span className="font-semibold text-green-600">{tBooking("free")}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#083f30]/5 to-[#0a5a44]/5 rounded-xl">
                    <span className="text-lg font-bold text-gray-900">{tBooking("totalAmount")}</span>
                    <span className="text-2xl font-bold text-[#083f30]">${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{tBooking("paymentMethod")}</h2>
              <div className="space-y-3">
                {[
                { id: 'card', name: 'Credit / Debit Card', icon: <CreditCard size={24}/>, popular: true },
                { id: 'bank', name: 'Bank Transfer', icon: <Building size={24}/> },
                { id: 'wallet', name: 'Digital Wallet', icon: <Smartphone size={24}/> },
            ].map(method => (<button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`w-full bg-white rounded-xl p-4 border-2 transition-all flex items-center gap-4 ${paymentMethod === method.id
                    ? 'border-[#083f30] shadow-md'
                    : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#083f30]">
                      {method.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{method.name}</h3>
                        {method.popular && (<span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-bold">{tBooking("rECOMMENDED")}</span>)}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id
                    ? 'border-[#083f30]'
                    : 'border-gray-300'}`}>
                      {paymentMethod === method.id && (<div className="w-3 h-3 bg-[#083f30] rounded-full"/>)}
                    </div>
                  </button>))}
              </div>
            </div>
            
            {/* Trust Notices */}
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">{tBooking("securePayment")}</h3>
                    <p className="text-sm text-green-800 leading-relaxed">{tBooking("yourPaymentIsProtectedBy256BitSSLEncryption")}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <Tag size={20} className="text-blue-600 flex-shrink-0 mt-0.5"/>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">{tBooking("flexibleCancellation")}</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">{tBooking("freeCancellationUpTo24HoursBeforeYourAppointment")}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Terms */}
            <div className="flex items-start gap-3 text-sm text-gray-600 p-4 bg-gray-50 rounded-xl">
              <input type="checkbox" className="mt-1" id="terms"/>
              <label htmlFor="terms">{tBooking("iAgreeToThe")}<a href="#" className="text-[#083f30] font-semibold hover:underline">{tBooking("termsAndConditions")}</a> and <a href="#" className="text-[#083f30] font-semibold hover:underline">{tBooking("cancellationPolicy")}</a>
              </label>
            </div>
          </div>)}
      </div>
      
      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
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
        
        {/* Progress Indicator */}
        {!canProceed() && step === 1 && (<div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              {!selectedService && 'Select a service to continue'}
              {selectedService && !selectedStaff && 'Choose your specialist'}
              {selectedService && selectedStaff && !selectedDate && 'Select a date'}
              {selectedService && selectedStaff && selectedDate && !selectedTime && 'Select a time'}
            </span>
          </div>)}
      </div>
    </div>);
}
