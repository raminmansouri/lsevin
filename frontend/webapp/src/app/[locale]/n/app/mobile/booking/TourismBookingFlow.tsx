import { useNavigate, useParams } from 'react-router';
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
  MapPin,
  Users,
  Car,
  Plane,
  Camera,
  Globe,
  Coffee,
  Award,
  Map,
  Compass
} from 'lucide-react';
import { useState } from 'react';

export default function TourismBookingFlow() {
  const navigate = useNavigate();
  const { serviceId } = useParams();
  
  const [step, setStep] = useState<number>(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [travelerCount, setTravelerCount] = useState<number>(2);
  const [travelerName, setTravelerName] = useState<string>('');
  const [travelerEmail, setTravelerEmail] = useState<string>('');
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  
  const packages = [
    {
      id: 'city-tour',
      name: 'Full-Day City Highlights Tour',
      description: 'Explore iconic landmarks and hidden gems',
      duration: '8 hours',
      price: 85,
      priceType: 'per person',
      category: 'Sightseeing',
      includes: ['Professional guide', 'Lunch', 'All entrance fees', 'Hotel pickup'],
      groupSize: 'Max 12 people',
      popular: true,
      image: '/unsplash_images/photo-1469854523086-cc02fe5d8800__w=400&h=300&fit=crop.jpg'
    },
    {
      id: 'airport-transfer',
      name: 'Private Airport Transfer',
      description: 'Luxury vehicle with meet & greet',
      duration: '1 hour',
      price: 45,
      priceType: 'per trip',
      category: 'Transfer',
      includes: ['Professional driver', 'Flight tracking', 'Free waiting time', 'Door-to-door'],
      groupSize: 'Up to 4 passengers',
      popular: true,
      image: '/unsplash_images/photo-1449965408869-eaa3f722e40d__w=400&h=300&fit=crop.jpg'
    },
    {
      id: 'cultural-tour',
      name: 'Cultural Heritage Experience',
      description: 'Museums, temples & local traditions',
      duration: '6 hours',
      price: 95,
      priceType: 'per person',
      category: 'Cultural',
      includes: ['Expert guide', 'Museum tickets', 'Traditional lunch', 'Photos included'],
      groupSize: 'Small group',
      image: '/unsplash_images/photo-1533094602577-198d3beab8ea__w=400&h=300&fit=crop.jpg'
    },
  ];
  
  const timeSlots = [
    { time: '08:00 AM', available: true, label: 'Morning' },
    { time: '10:00 AM', available: true },
    { time: '02:00 PM', available: true, label: 'Afternoon' },
    { time: '04:00 PM', available: false },
    { time: '06:00 PM', available: true, label: 'Evening' },
  ];
  
  const addons = [
    {
      id: 'premium-vehicle',
      name: 'Premium Vehicle Upgrade',
      description: 'Mercedes-Benz luxury sedan or SUV',
      price: 35,
      priceType: 'one-time',
      icon: <Car size={24} className="text-[#083f30]" />,
      popular: true
    },
    {
      id: 'private-guide',
      name: 'Private Tour Guide',
      description: 'Exclusive personal guide just for you',
      price: 60,
      priceType: 'per group',
      icon: <Award size={24} className="text-[#083f30]" />,
      popular: true
    },
    {
      id: 'photographer',
      name: 'Professional Photographer',
      description: '50+ edited photos delivered digitally',
      price: 75,
      priceType: 'one-time',
      icon: <Camera size={24} className="text-[#083f30]" />
    },
    {
      id: 'translator',
      name: 'Live Translator Service',
      description: 'Real-time language translation',
      price: 40,
      priceType: 'per day',
      icon: <Globe size={24} className="text-[#083f30]" />
    },
  ];
  
  const steps = [
    { num: 1, label: 'Package & Date' },
    { num: 2, label: 'Details & Add-ons' },
    { num: 3, label: 'Review & Pay' },
  ];
  
  const toggleAddon = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter(id => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };
  
  const calculateTotal = () => {
    const pkg = packages.find(p => p.id === selectedPackage);
    let total = 0;
    
    if (pkg) {
      if (pkg.priceType === 'per person') {
        total = pkg.price * travelerCount;
      } else {
        total = pkg.price;
      }
    }
    
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) {
        total += addon.price;
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
    if (step === 1) return selectedPackage && selectedDate && selectedTime;
    if (step === 2) return travelerName && travelerEmail; // Traveler details required, add-ons optional
    if (step === 3) return paymentMethod;
    return false;
  };
  
  const getButtonLabel = () => {
    if (step === 1) return 'Continue to Details';
    if (step === 2) return 'Continue to Review';
    if (step === 3) return 'Confirm Booking';
    return 'Continue';
  };
  
  const selectedPackageData = packages.find(p => p.id === selectedPackage);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <button 
              onClick={handleBack}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">Book Your Experience</h1>
              <p className="text-xs text-gray-600">Step {step} of {steps.length}</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
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
        {/* Step 1: Package & Date Selection */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Select Package */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Choose Your Adventure</h2>
              <div className="space-y-3">
                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`w-full bg-white rounded-2xl overflow-hidden border-2 transition-all ${
                      selectedPackage === pkg.id
                        ? 'border-[#083f30] shadow-lg scale-[1.02]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative">
                      <img 
                        src={pkg.image}
                        alt={pkg.name}
                        className="w-full h-48 object-cover"
                      />
                      {pkg.popular && (
                        <div className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-[#eacb7f] to-[#d4b76a] text-[#083f30] rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                          <Star size={12} />
                          BESTSELLER
                        </div>
                      )}
                      <div className="absolute top-3 right-3 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg text-xs font-bold text-gray-900">
                        {pkg.category}
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-1">{pkg.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Clock size={14} className="text-[#083f30]" />
                          <span>{pkg.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Users size={14} className="text-[#083f30]" />
                          <span>{pkg.groupSize}</span>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <div className="text-xs font-semibold text-gray-700 mb-1">Includes:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {pkg.includes.map((item, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-gray-50 rounded-md text-xs text-gray-700"
                            >
                              • {item}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="text-xs text-gray-600">{pkg.priceType}</div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#083f30]">${pkg.price}</div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Select Date */}
            {selectedPackage && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Date</h2>
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-[#083f30] focus:outline-none font-semibold"
                  />
                </div>
              </div>
            )}
            
            {/* Select Time */}
            {selectedDate && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Time</h2>
                <div className="grid grid-cols-2 gap-3">
                  {timeSlots.map(slot => (
                    <button
                      key={slot.time}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                      className={`h-16 rounded-xl flex flex-col items-center justify-center font-semibold transition-all ${
                        selectedTime === slot.time
                          ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white shadow-md'
                          : slot.available
                          ? 'bg-white border-2 border-gray-200 hover:border-[#083f30] text-gray-900'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-sm">{slot.time}</span>
                      {slot.label && (
                        <span className={`text-xs ${
                          selectedTime === slot.time ? 'text-[#eacb7f]' : 'text-gray-500'
                        }`}>
                          {slot.label}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Number of Travelers */}
            {selectedTime && selectedPackageData?.priceType === 'per person' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Number of Travelers</h2>
                <div className="bg-white rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users size={20} className="text-[#083f30]" />
                      <span className="font-semibold text-gray-900">Travelers</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setTravelerCount(Math.max(1, travelerCount - 1))}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-900 transition-colors"
                      >
                        -
                      </button>
                      <span className="text-xl font-bold text-gray-900 w-8 text-center">{travelerCount}</span>
                      <button
                        onClick={() => setTravelerCount(travelerCount + 1)}
                        className="w-10 h-10 rounded-full bg-[#083f30] hover:bg-[#0a5a44] flex items-center justify-center font-bold text-white transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
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
                    <h3 className="font-bold text-green-900 mb-2">Ready for Adventure!</h3>
                    <div className="space-y-1.5 text-sm text-green-800">
                      <div className="flex items-center gap-2">
                        <Map size={14} className="flex-shrink-0" />
                        <span>Tour: {selectedPackageData?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="flex-shrink-0" />
                        <span>Date: {selectedDate} at {selectedTime}</span>
                      </div>
                      {selectedPackageData?.priceType === 'per person' && (
                        <div className="flex items-center gap-2">
                          <Users size={14} className="flex-shrink-0" />
                          <span>{travelerCount} {travelerCount === 1 ? 'traveler' : 'travelers'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Continue Button */}
                <button
                  onClick={handleNext}
                  className="w-full h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-xl font-bold hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg"
                >
                  Continue to Details
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Step 2: Traveler Details & Add-ons */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Traveler Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Traveler Information</h2>
              <div className="bg-white rounded-2xl p-4 border border-gray-200 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={travelerName}
                    onChange={(e) => setTravelerName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-[#083f30] focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={travelerEmail}
                    onChange={(e) => setTravelerEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-[#083f30] focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            {/* Optional Add-ons */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Enhance Your Experience</h2>
              <p className="text-sm text-gray-600 mb-4">
                Optional premium services (you can skip this)
              </p>
              
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
                                {addon.popular && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-bold">
                                    POPULAR
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{addon.description}</p>
                            </div>
                            
                            <div className="text-right ml-3">
                              <div className="text-lg font-bold text-[#083f30]">
                                +${addon.price}
                              </div>
                              <div className="text-xs text-gray-600">{addon.priceType}</div>
                            </div>
                          </div>
                          
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
                                Add Service
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex gap-3">
                <Compass size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-blue-900 mb-1">VIP Treatment</h3>
                  <p className="text-sm text-blue-800">
                    Add a private guide + photographer for a truly personalized experience
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
                <h2 className="text-lg font-bold text-white">Booking Summary</h2>
                <p className="text-sm text-[#eacb7f] mt-1">Review your tour details</p>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Package Details */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Map size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Selected Experience</h3>
                  </div>
                  
                  <div className="rounded-xl overflow-hidden border border-gray-200">
                    <img 
                      src={selectedPackageData?.image}
                      alt={selectedPackageData?.name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-3 bg-gray-50">
                      <h4 className="font-bold text-gray-900 mb-1">{selectedPackageData?.name}</h4>
                      <p className="text-xs text-gray-600 mb-2">{selectedPackageData?.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-700">
                        <span className="px-2 py-0.5 bg-white rounded-md font-semibold">{selectedPackageData?.category}</span>
                        <span>{selectedPackageData?.duration}</span>
                        <span>•</span>
                        <span className="font-bold text-[#083f30]">${selectedPackageData?.price} {selectedPackageData?.priceType}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Tour Details */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Calendar size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Tour Schedule</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar size={16} className="text-[#083f30]" />
                        <span className="font-semibold">Date</span>
                      </div>
                      <span className="font-bold text-gray-900">{selectedDate}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock size={16} className="text-[#083f30]" />
                        <span className="font-semibold">Time</span>
                      </div>
                      <span className="font-bold text-gray-900">{selectedTime}</span>
                    </div>
                    {selectedPackageData?.priceType === 'per person' && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users size={16} className="text-[#083f30]" />
                          <span className="font-semibold">Travelers</span>
                        </div>
                        <span className="font-bold text-gray-900">{travelerCount} {travelerCount === 1 ? 'person' : 'people'}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Traveler Info */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <BadgeCheck size={16} className="text-[#083f30]" />
                    </div>
                    <h3 className="font-bold text-gray-900">Lead Traveler</h3>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="space-y-1 text-sm">
                      <div className="font-bold text-gray-900">{travelerName}</div>
                      <div className="text-gray-600">{travelerEmail}</div>
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
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                                {addon.icon}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-semibold text-gray-900">{addon.name}</div>
                                <div className="text-xs text-gray-600">{addon.priceType}</div>
                              </div>
                            </div>
                            <span className="font-bold text-gray-900">${addon.price}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Total */}
                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {selectedPackageData?.name}
                        {selectedPackageData?.priceType === 'per person' && ` (${travelerCount} ${travelerCount === 1 ? 'person' : 'people'})`}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${selectedPackageData?.priceType === 'per person' 
                          ? (selectedPackageData?.price || 0) * travelerCount
                          : selectedPackageData?.price || 0
                        }
                      </span>
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
                      <span className="text-gray-600">Service fee</span>
                      <span className="font-semibold text-green-600">Free</span>
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
            
            {/* Trust Notices */}
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <Shield size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-green-900 mb-1">Secure Booking</h3>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Your payment is protected with 256-bit SSL encryption and instant confirmation.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <div className="flex gap-3">
                  <BadgeCheck size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Flexible Cancellation</h3>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Cancel free of charge up to 24 hours before departure for a full refund.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Terms */}
            <div className="flex items-start gap-3 text-sm text-gray-600 p-4 bg-gray-50 rounded-xl">
              <input type="checkbox" className="mt-1" id="terms" />
              <label htmlFor="terms">
                I agree to the <a href="#" className="text-[#083f30] font-semibold hover:underline">Terms & Conditions</a> and <a href="#" className="text-[#083f30] font-semibold hover:underline">Cancellation Policy</a>
              </label>
            </div>
          </div>
        )}
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
        
        {!canProceed() && step === 2 && (
          <div className="text-center mt-2">
            <span className="text-xs text-gray-500">
              Please enter your name and email to continue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
