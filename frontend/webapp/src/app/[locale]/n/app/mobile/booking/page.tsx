"use client"

import { useNavigate } from '@/hooks/use-navigate';
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
import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form';
import { BookingFormValues, bookingSchema } from './types';
import { zodResolver } from '@hookform/resolvers/zod';
import ServiceSelection from './components/ServiceSelection/ServiceSelection';
import UploadFiles from './components/UploadFiles/UploadFiles';
import { useBookingCheckout } from '@/features/booking/api/client/post-booking-checkout';
import { useGetAddons } from '@/features/booking/api/client/fetch-addons';
import { useLocale } from 'next-intl';
import { useGetAvailableDates } from '@/features/booking/api/client/fetch-available-dates';
import { useGetAvailableTimeslots } from '@/features/booking/api/client/fetch-available-timeslots';

export default function BookingServiceWizardPage() {
    const locale = useLocale();
  const navigate = useNavigate();
  const searchParams = useSearchParams();
      const methods = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
    },
  });


  const { mutate: bookingCheckout, isPending, error } = useBookingCheckout();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookingCheckout({
     
    });
  };



  const providerId = methods.watch({ name: 'providerId' });
  const serviceId   = methods.watch({ name: 'serviceId' });
  const specialistId = methods.watch({ name: 'specialistId' });
  const id:string= searchParams.get('id');
  // const { serviceId } = router.get;
  
  const [step, setStep] = useState<number>(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [depositOption, setDepositOption] = useState<'full' | 'deposit'>('deposit');
  const [promoCode, setPromoCode] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  

  



  const service = {
    id: '1',
    name: 'Premium Hair Transplant - FUE Method',
    clinic: 'Istanbul Medical Center',
    city: 'Istanbul',
    country: 'Turkey',
    rating: 4.9,
    reviews: 2847,
    verified: true,
    duration: '6-8 hours',
    recovery: '7-10 days',
    depositAmount: 24599,
    price: 2499,
    currency: 'USD',
    image: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg',
    category: 'Hair Transplant',
    accreditation: 'JCI Accredited'
  };
  
  const specialists = [
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


  const SelectDate=()=>{
    const { setValue,resetField } = useFormContext();

    
    const {
      data: availableDatesResponse,
      refetch: refetchAvailableDates
    } = useGetAvailableDates(
      providerId,
      serviceId,
      specialistId,
      locale);


    return (<>
    
     {/* Select Date */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Select Date</h2>
              <div className="bg-white rounded-2xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-gray-600 rotate-180" />
                  </button>
                  <span className="font-bold text-gray-900">March 2026</span>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight size={20} className="text-gray-600" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-2">
                  {availableDatesResponse?.dates?.map(date => (
                    <button
                      key={date.date}
                      onClick={() => 
                        {
                          if(date.available)
                        {
                          setSelectedDate(date.date)
                          
                         setValue('selectedDate',date.date)
                        }
                        }
                         
                      }
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
                </div>
              </div>
            </div></>)
  }
  
  const ChooseYourServiceCanProceed=()=>{
return (<>
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
                        <span>Doctor: {specialists.find(d => d.id === selectedDoctor)?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span>Date: {selectedDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="flex-shrink-0" />
                        <span>Time: {selectedTime}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Continue Button - Directly in Summary */}
                <button
                  onClick={handleNext}
                  className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Continue to Add-ons
                  <ChevronRight size={20} />
                </button>
              </div>
            )}</>) 
  }

  const SelectTime=()=>{
    const { setValue,resetField } = useFormContext();

     const {
      data: availableTimesResponse,
      refetch: refetchAvailableTimes
    } = useGetAvailableTimeslots(
      selectedDate,
      providerId,
      serviceId,
      specialistId,
      locale);


    return (<>
     {/* Select Time */}
            {selectedDate && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Time</h2>
                <div className="grid grid-cols-2 gap-3">
                  {availableTimesResponse?.slots?.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => 
                        {
                          if(slot.available)
                          {
                            setSelectedTime(slot.time)
                            setValue('selectedTime',slot.time)
                          }
                        }}
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
            )}</>)
  }

  
  const AddOns=()=>{

    
    const {
      data: addOnsResponse,
      refetch: refetchAddOns
    } = useGetAddons(
      providerId,
      serviceId,
      specialistId,
      locale);


    const { setValue,resetField } = useFormContext();
    const toggleAddon = (addonId: string) => {
      if (selectedAddons.includes(addonId)) {
        const temp=selectedAddons.filter(id => id !== addonId);
        setSelectedAddons(temp);
        setValue('selectedAddons',temp)
      } else {
        const temp=[...selectedAddons, addonId];
        setSelectedAddons(temp);
        setValue('selectedAddons',temp)
      }
    };

    return (<>
     <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enhance Your Experience</h2>
              <p className="text-sm text-gray-600 mb-4">
                Optional add-ons to make your medical journey seamless
              </p>
            </div>
            
            <div className="space-y-3">
              {addOnsResponse?.addons.map(addon => (
                <div
                  key={addon.id}
                  className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                    selectedAddons.includes(addon.id)
                      ? 'border-[#083f30] shadow-md'
                      : 'border-gray-200'
                  }`}
                >
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
                              {addon.popular && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-bold">
                                  POPULAR
                                </span>
                              )}
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
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">Save with Bundles</h3>
                  <p className="text-sm text-blue-800">
                    Add 3 or more services and get 10% off all add-ons
                  </p>
                </div>
              </div>
            </div>
            
            {/* Continue Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
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
                  </p>
                </div>
              </div>
              
              {/* Continue Button */}
              <button
                onClick={handleNext}
                className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {selectedAddons.length > 0 ? 'Continue to Medical Files' : 'Skip to Medical Files'}
                <ChevronRight size={20} />
              </button>
            </div>
            
            </>)
  }
 
  const ReviewPay=()=>{
    return (<>
     {/* Booking Summary */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-[#083f30] to-[#0a5a44]">
                <h2 className="text-lg font-bold text-white">Booking Summary</h2>
                <p className="text-sm text-[#eacb7f] mt-1">Review your medical booking details</p>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Treatment & Doctor */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <BadgeCheck size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Treatment & Specialist</h3>
                  </div>
                  
                  <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                    <img 
                      src={service.image}
                      alt={service.name}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-1 text-sm">{service.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{service.clinic}</p>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-[#083f30] text-white rounded-md text-xs font-semibold">
                          {service.accreditation}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star size={12} className="fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-semibold text-gray-900">{service.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">${service.price}</div>
                    </div>
                  </div>
                  
                  {/* Selected Doctor */}
                  <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-3">
                      <img 
                        src={specialists.find(d => d.id === selectedDoctor)?.image}
                        alt={specialists.find(d => d.id === selectedDoctor)?.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-sm">
                          {specialists.find(d => d.id === selectedDoctor)?.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {specialists.find(d => d.id === selectedDoctor)?.specialty}
                        </div>
                      </div>
                      <BadgeCheck size={20} className="text-[#083f30]" />
                    </div>
                  </div>
                </div>
                
                {/* Appointment Details */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Appointment Schedule</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Calendar size={14} />
                        <span className="text-xs font-semibold">Date</span>
                      </div>
                      <div className="font-bold text-gray-900">{selectedDate}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Clock size={14} />
                        <span className="text-xs font-semibold">Time</span>
                      </div>
                      <div className="font-bold text-gray-900">{selectedTime}</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-2 text-green-800 text-sm">
                      <CheckCircle2 size={16} className="text-green-600" />
                      <span className="font-semibold">Confirmed availability</span>
                    </div>
                  </div>
                </div>
                
                {/* Add-ons */}
                {selectedAddons.length > 0 && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                        <Plus size={16} className="text-[#083f30]" />
                      </div>
                      <h3 className="font-bold text-gray-900">Additional Services</h3>
                    </div>
                    
                    <div className="space-y-2">
                      {selectedAddons.map(addonId => {
                        const addon = addons.find(a => a.id === addonId);
                        if (!addon) return null;
                        return (
                          <div key={addonId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                {addon.icon}
                              </div>
                              <span className="text-sm font-semibold text-gray-900">{addon.name}</span>
                            </div>
                            <span className="font-bold text-gray-900">${addon.price}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Medical Files Status */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
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
                </div>
                
                {/* Total */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Treatment fee</span>
                      <span className="font-semibold text-gray-900">${service.price}</span>
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
                      <span className="font-semibold text-green-600">$0</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#083f30]/5 to-[#0a5a44]/5 rounded-xl">
                    <span className="text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-2xl font-bold text-[#083f30]">${calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Methods */}
            <div>
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
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[#083f30]">
                      {method.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{method.name}</h3>
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
              </div>
            </div>
            
            {/* Security & Trust Notices */}
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Secure Payment</h3>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Your payment is protected by bank-grade 256-bit SSL encryption. We never store your card details.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <Headphones size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">24/7 Medical Support</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      A dedicated medical coordinator will be assigned to you immediately after booking confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Terms */}
            <div className="flex items-start gap-3 text-sm text-gray-600 p-4 bg-gray-50 rounded-xl">
              <input type="checkbox" className="mt-1" id="terms" />
              <label htmlFor="terms">
                I agree to the <a href="#" className="text-[#083f30] font-semibold hover:underline">Terms & Conditions</a>, <a href="#" className="text-[#083f30] font-semibold hover:underline">Privacy Policy</a>, and <a href="#" className="text-[#083f30] font-semibold hover:underline">Cancellation Policy</a>
              </label>
            </div></>)
  }

  const StepDefinitions={
ChooseYourService:<ServiceSelection/>,
SelectDate:<SelectDate/>,
SelectTime:<SelectTime/>,
ChooseYourServiceCanProceed:<ChooseYourServiceCanProceed/>,
AddOns:<AddOns/>,
UploadFiles:<UploadFiles documentsFromServer={[
                  { title: 'Blood Test Results', required: true, description: 'Recent CBC and chemistry panel' },
                  { title: 'Medical History Form', required: true, description: 'Complete health background' },
                  { title: 'Previous Treatment Records', required: false, description: 'If applicable' },
                  { title: 'Allergy Information', required: false, description: 'Known allergies or reactions' },
                ]}/>,
ReviewPay:<ReviewPay/>,
  }
  
  const steps = [
    { num: 1, label: 'Doctor & Date',components:[
      StepDefinitions.ChooseYourService,
      StepDefinitions.SelectDate,
      StepDefinitions.SelectTime,
      
    ] },
    { num: 2, label: 'Add-ons' ,components:[
      StepDefinitions.AddOns

    ]},
    { num: 3, label: 'Medical Files',components:[
      StepDefinitions.UploadFiles
    ] },
    { num: 4, label: 'Review & Pay' ,components:[
      StepDefinitions.ReviewPay
    ]},
  ];
  
  
  
  const calculateTotal = () => {
    // const service = services.find(s => s.id === selectedService);
    let total = 0 //service?.price || 0;
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) total += addon.price;
    });
    return total;
  };
  
  const getDepositAmount = () => {
    return depositOption === "deposit"
      ? service.depositAmount
      : calculateTotal();
  };


  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };



  
  const canProceed = () => {
    if (step === 1) return providerId && serviceId && specialistId;
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
     <FormProvider {...methods}>
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Book Treatment</h1>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
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
                    {s.label}
                  </span>
                </div>
                
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-colors ${
                    step > s.num ? 'bg-[#083f30]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-5 py-6">
        {/* Step 1: Doctor & Date Selection */}

        {steps.filter(f=>f.num===step).map(s=>{
          
         return (<>
         {s.components.map(c=>{
              return (c);
            })}
         </>)
        })}
       
      </div>
      
      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-xl z-50">
        <div className="flex items-center gap-3">
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
            <span className="text-xs text-gray-500">
              {!selectedDoctor && 'Select a doctor to continue'}
              {selectedDoctor && !selectedDate && 'Select a date to continue'}
              {selectedDoctor && selectedDate && !selectedTime && 'Select a time to continue'}
            </span>
          </div>
        )}
      </div>
       {/* Sticky Bottom CTA */}
      <div className="fixed right-0 bottom-10 left-0 z-50 border-t border-gray-200 bg-white px-5 py-4 shadow-2xl">
        {" "}
        <div className="mb-3 flex items-center gap-3">
          {" "}
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex h-14 items-center gap-2 rounded-xl bg-gray-100 px-6 font-bold text-gray-900 transition-colors hover:bg-gray-200 active:scale-95"
            >
              {" "}
              <ChevronLeft size={20} /> Back{" "}
            </button>
          )}{" "}
          <button
            onClick={() => {
              if (step === 8 && canProceed()) {
                navigate("/app/booking/success");
              } else if (canProceed()) {
                handleNext();
              }
            }}
            disabled={!canProceed()}
            className={`flex h-14 flex-1 items-center justify-center gap-2 rounded-xl font-bold transition-all ${canProceed() ? "bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white hover:shadow-xl active:scale-95" : "cursor-not-allowed bg-gray-200 text-gray-400"}`}
          >
            {" "}
            {step === 8 ? (
              <>
                {" "}
                <Shield size={20} /> Confirm & Pay ${getDepositAmount()}{" "}
              </>
            ) : (
              <>
                {" "}
                Continue <ChevronRight size={20} />{" "}
              </>
            )}{" "}
          </button>{" "}
        </div>{" "}
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          {" "}
          <Shield size={12} />{" "}
          <span>
            Secure & encrypted • {steps.length - step} steps remaining
          </span>{" "}
        </div>{" "}
      </div>{" "}
    </div>
    </FormProvider>
  );
}