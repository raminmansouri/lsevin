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
  Tag,
  Wallet,
  AlertTriangle,
  Download
} from 'lucide-react';
import { useState } from 'react';

export default function BookingFlowRefined() {
  const navigate = useNavigate();
  const { treatmentId } = useParams();
  
  const [step, setStep] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, type: string, size: string}[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [depositOption, setDepositOption] = useState<'full' | 'deposit'>('deposit');
  const [promoCode, setPromoCode] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');
  const [agreeToTerms, setAgreeToTerms] = useState<boolean>(false);
  
  // Patient Details Form State
  const [patientDetails, setPatientDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    passportNumber: '',
    medicalNotes: ''
  });
  
  const treatment = {
    id: treatmentId || '1',
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
    depositAmount: 500,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1622296089863-eb7fc530daa8?w=600&h=400&fit=crop',
    category: 'Hair Transplant',
    accreditation: 'JCI Accredited',
    clinicImage: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&h=300&fit=crop'
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
      image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
      nextAvailable: 'Mar 15, 2026',
      bio: 'Leading hair transplant specialist with expertise in FUE and DHI techniques'
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
      image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
      nextAvailable: 'Mar 12, 2026',
      bio: 'Internationally recognized expert in advanced hair restoration procedures'
    },
  ];
  
  const addons = [
    {
      id: 'hotel',
      name: '4-Star Hotel Package',
      description: '3 nights accommodation near clinic',
      price: 180,
      icon: <HotelIcon size={20} className=\"text-[#083f30]\" />,
      popular: true,
      details: ['Breakfast included', 'Free WiFi', '10 min from clinic', 'Daily housekeeping']
    },
    {
      id: 'transfer',
      name: 'VIP Airport Transfer',
      description: 'Round-trip luxury car service',
      price: 80,
      icon: <Car size={20} className=\"text-[#083f30]\" />,
      popular: true,
      details: ['Meet & greet', 'Premium vehicle', 'Professional driver', 'Flight tracking']
    },
    {
      id: 'translator',
      name: 'Personal Translator',
      description: 'Dedicated translator for your stay',
      price: 120,
      icon: <Globe size={20} className=\"text-[#083f30]\" />,
      details: ['Available 24/7', 'Medical terminology expert', 'Multiple languages', 'Cultural assistance']
    },
    {
      id: 'vip',
      name: 'VIP Patient Support',
      description: 'Priority support & concierge service',
      price: 150,
      icon: <Headphones size={20} className=\"text-[#083f30]\" />,
      details: ['24/7 hotline', 'Dedicated coordinator', 'Priority scheduling', 'Concierge service']
    },
    {
      id: 'insurance',
      name: 'Medical Travel Insurance',
      description: 'Comprehensive coverage for your trip',
      price: 95,
      icon: <Shield size={20} className=\"text-[#083f30]\" />,
      details: ['Trip cancellation', 'Medical complications', 'Lost baggage', 'Emergency evacuation']
    },
  ];
  
  const steps = [
    { num: 1, label: 'Overview' },
    { num: 2, label: 'Doctor' },
    { num: 3, label: 'Date & Time' },
    { num: 4, label: 'Medical Files' },
    { num: 5, label: 'Patient Info' },
    { num: 6, label: 'Add-ons' },
    { num: 7, label: 'Review' },
    { num: 8, label: 'Payment' },
  ];
  
  const toggleAddon = (addonId: string) => {
    if (selectedAddons.includes(addonId)) {
      setSelectedAddons(selectedAddons.filter(id => id !== addonId));
    } else {
      setSelectedAddons([...selectedAddons, addonId]);
    }
  };
  
  const calculateSubtotal = () => {
    let total = treatment.price;
    selectedAddons.forEach(addonId => {
      const addon = addons.find(a => a.id === addonId);
      if (addon) total += addon.price;
    });
    return total;
  };
  
  const calculateServiceFee = () => {
    return Math.round(calculateSubtotal() * 0.03); // 3% service fee
  };
  
  const calculateTotal = () => {
    return calculateSubtotal() + calculateServiceFee();
  };
  
  const getDepositAmount = () => {
    return depositOption === 'deposit' ? treatment.depositAmount : calculateTotal();
  };
  
  const handleNext = () => {
    if (step < 8) setStep(step + 1);
  };
  
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate(-1);
  };
  
  const canProceed = () => {
    if (step === 1) return true; // Overview
    if (step === 2) return selectedDoctor !== null; // Doctor selection
    if (step === 3) return selectedDate && selectedTime; // Date & Time
    if (step === 4) return uploadedFiles.length >= 2; // Medical files (at least 2)
    if (step === 5) return patientDetails.fullName && patientDetails.email && patientDetails.phone; // Patient info
    if (step === 6) return true; // Add-ons optional
    if (step === 7) return true; // Review
    if (step === 8) return paymentMethod && agreeToTerms; // Payment
    return false;
  };
  
  const addMockFile = () => {
    const mockFiles = [
      { name: 'Blood_Test_Results.pdf', type: 'PDF', size: '2.4 MB' },
      { name: 'Medical_History.pdf', type: 'PDF', size: '1.8 MB' },
      { name: 'Previous_Treatment.jpg', type: 'Image', size: '3.2 MB' },
    ];
    
    const newFile = mockFiles[uploadedFiles.length % mockFiles.length];
    if (!uploadedFiles.find(f => f.name === newFile.name)) {
      setUploadedFiles([...uploadedFiles, newFile]);
    }
  };
  
  return (
    <div className=\"min-h-screen bg-gray-50 pb-32\">\n      {/* Header */}
      <div className=\"bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm\">\n        <div className=\"px-5 py-4\">\n          <div className=\"flex items-center gap-3 mb-5\">\n            <button \n              onClick={handleBack}\n              className=\"w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95\"\n            >\n              <ArrowLeft size={20} className=\"text-gray-900\" />\n            </button>\n            <div className=\"flex-1\">\n              <h1 className=\"font-bold text-gray-900\">Complete Your Booking</h1>\n              <p className=\"text-xs text-gray-600 mt-0.5\">Step {step} of {steps.length}</p>\n            </div>\n          </div>\n          \n          {/* Premium Progress Bar */}
          <div className=\"relative\">\n            <div className=\"h-2 bg-gray-100 rounded-full overflow-hidden\">\n              <div \n                className=\"h-full bg-gradient-to-r from-[#083f30] to-[#0a5a44] transition-all duration-500 ease-out rounded-full\"\n                style={{ width: `${(step / steps.length) * 100}%` }}\n              />\n            </div>\n            <div className=\"flex items-center justify-between mt-3\">\n              {steps.slice(0, 4).map((s) => (\n                <div \n                  key={s.num}\n                  className={`text-xs font-medium transition-colors ${\n                    step >= s.num ? 'text-[#083f30]' : 'text-gray-400'\n                  }`}\n                >\n                  {s.label}\n                </div>\n              ))}\n            </div>\n          </div>\n        </div>\n      </div>\n      \n      {/* Content */}
      <div className=\"px-5 py-6\">\n        {/* Step 1: Treatment Overview */}
        {step === 1 && (
          <div className=\"space-y-6\">\n            <div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Treatment Overview</h2>\n              <p className=\"text-gray-600\">Review your selected treatment details</p>\n            </div>\n            
            {/* Hero Image */}
            <div className=\"relative rounded-2xl overflow-hidden h-56\">\n              <img \n                src={treatment.image}\n                alt={treatment.name}\n                className=\"w-full h-full object-cover\"\n              />\n              <div className=\"absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent\" />\n              <div className=\"absolute bottom-0 left-0 right-0 p-5 text-white\">\n                <div className=\"flex items-center gap-2 mb-2\">\n                  <BadgeCheck size={18} className=\"text-[#eacb7f]\" />\n                  <span className=\"text-xs font-semibold bg-[#eacb7f]/20 backdrop-blur-sm px-2 py-1 rounded-md\">\n                    {treatment.accreditation}\n                  </span>\n                </div>\n                <h3 className=\"text-xl font-bold mb-1\">{treatment.name}</h3>\n              </div>\n            </div>\n            
            {/* Clinic Info Card */}
            <div className=\"bg-white rounded-2xl p-5 border border-gray-200 shadow-sm\">\n              <div className=\"flex items-start gap-4 mb-4 pb-4 border-b border-gray-100\">\n                <img \n                  src={treatment.clinicImage}\n                  alt={treatment.clinic}\n                  className=\"w-20 h-20 rounded-xl object-cover\"\n                />\n                <div className=\"flex-1\">\n                  <h3 className=\"font-bold text-gray-900 mb-1\">{treatment.clinic}</h3>\n                  <div className=\"flex items-center gap-2 text-sm text-gray-600 mb-2\">\n                    <MapPin size={14} />\n                    <span>{treatment.city}, {treatment.country}</span>\n                  </div>\n                  <div className=\"flex items-center gap-2\">\n                    <div className=\"flex items-center gap-1\">\n                      <Star size={14} className=\"fill-yellow-400 text-yellow-400\" />\n                      <span className=\"font-bold text-sm text-gray-900\">{treatment.rating}</span>\n                      <span className=\"text-xs text-gray-500\">({treatment.reviews} reviews)</span>\n                    </div>\n                  </div>\n                </div>\n                <BadgeCheck size={24} className=\"text-[#083f30] flex-shrink-0\" />\n              </div>\n              
              {/* Treatment Details Grid */}
              <div className=\"grid grid-cols-2 gap-4\">\n                <div className=\"bg-gray-50 rounded-xl p-3\">\n                  <div className=\"flex items-center gap-2 mb-1\">\n                    <Clock size={16} className=\"text-gray-600\" />\n                    <span className=\"text-xs font-semibold text-gray-600 uppercase\">Duration</span>\n                  </div>\n                  <p className=\"font-bold text-gray-900\">{treatment.duration}</p>\n                </div>\n                <div className=\"bg-gray-50 rounded-xl p-3\">\n                  <div className=\"flex items-center gap-2 mb-1\">\n                    <Calendar size={16} className=\"text-gray-600\" />\n                    <span className=\"text-xs font-semibold text-gray-600 uppercase\">Recovery</span>\n                  </div>\n                  <p className=\"font-bold text-gray-900\">{treatment.recovery}</p>\n                </div>\n              </div>\n            </div>\n            
            {/* Pricing Card */}
            <div className=\"bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl p-5 text-white\">\n              <div className=\"flex items-center justify-between mb-3\">\n                <div>\n                  <p className=\"text-sm text-white/80 mb-1\">Starting from</p>\n                  <div className=\"text-3xl font-bold\">${treatment.price}</div>\n                  <p className=\"text-xs text-white/70 mt-1\">All-inclusive package</p>\n                </div>\n                <div className=\"w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center\">\n                  <Tag size={24} className=\"text-[#eacb7f]\" />\n                </div>\n              </div>\n              <div className=\"flex items-center gap-2 pt-3 border-t border-white/10\">\n                <Info size={14} className=\"text-white/80\" />\n                <span className=\"text-xs text-white/80\">Pay only ${treatment.depositAmount} deposit to secure your booking</span>\n              </div>\n            </div>\n            
            {/* What's Included */}
            <div className=\"bg-white rounded-2xl p-5 border border-gray-200\">\n              <h3 className=\"font-bold text-gray-900 mb-4\">What's Included</h3>\n              <div className=\"space-y-3\">\n                {[\n                  'Pre-treatment consultation',\n                  'All medical procedures & medications',\n                  'Post-treatment follow-ups',\n                  'Medical coordinator support',\n                  'Digital medical records',\n                  '1-year aftercare program'\n                ].map((item, idx) => (\n                  <div key={idx} className=\"flex items-center gap-3\">\n                    <div className=\"w-5 h-5 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0\">\n                      <Check size={12} className=\"text-green-600\" />\n                    </div>\n                    <span className=\"text-sm text-gray-700\">{item}</span>\n                  </div>\n                ))}\n              </div>\n            </div>\n          </div>\n        )}\n        
        {/* Step 2: Choose Doctor */}
        {step === 2 && (
          <div className=\"space-y-6\">\n            <div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Choose Your Specialist</h2>\n              <p className=\"text-gray-600\">Select from our verified medical professionals</p>\n            </div>\n            
            <div className=\"space-y-4\">\n              {doctors.map(doctor => (\n                <button\n                  key={doctor.id}\n                  onClick={() => setSelectedDoctor(doctor.id)}\n                  className={`w-full bg-white rounded-2xl p-5 border-2 transition-all text-left ${\n                    selectedDoctor === doctor.id\n                      ? 'border-[#083f30] shadow-lg'\n                      : 'border-gray-200 hover:border-gray-300 shadow-sm'\n                  }`}\n                >\n                  <div className=\"flex gap-4 mb-4\">\n                    <div className=\"relative flex-shrink-0\">\n                      <img \n                        src={doctor.image}\n                        alt={doctor.name}\n                        className=\"w-24 h-24 rounded-2xl object-cover\"\n                      />\n                      <div className=\"absolute -bottom-2 -right-2 w-8 h-8 bg-[#083f30] rounded-full flex items-center justify-center shadow-md\">\n                        <BadgeCheck size={16} className=\"text-[#eacb7f]\" />\n                      </div>\n                    </div>\n                    \n                    <div className=\"flex-1\">\n                      <h3 className=\"font-bold text-gray-900 mb-1\">{doctor.name}</h3>\n                      <p className=\"text-sm text-gray-600 mb-3\">{doctor.specialty}</p>\n                      \n                      <div className=\"flex flex-wrap gap-2\">\n                        {doctor.credentials.map((cred, idx) => (\n                          <span \n                            key={idx}\n                            className=\"px-2 py-1 bg-[#083f30]/5 rounded-md text-xs font-semibold text-[#083f30]\"\n                          >\n                            {cred}\n                          </span>\n                        ))}\n                      </div>\n                    </div>\n                  </div>\n                  
n                  <div className=\"grid grid-cols-2 gap-3 mb-4\">\n                    <div className=\"bg-gray-50 rounded-xl p-3\">\n                      <div className=\"flex items-center gap-1 mb-1\">\n                        <Award size={14} className=\"text-gray-600\" />\n                        <span className=\"text-xs font-semibold text-gray-600\">Experience</span>\n                      </div>\n                      <p className=\"text-sm font-bold text-gray-900\">{doctor.experience}</p>\n                    </div>\n                    <div className=\"bg-gray-50 rounded-xl p-3\">\n                      <div className=\"flex items-center gap-1 mb-1\">\n                        <Users size={14} className=\"text-gray-600\" />\n                        <span className=\"text-xs font-semibold text-gray-600\">Patients</span>\n                      </div>\n                      <p className=\"text-sm font-bold text-gray-900\">{doctor.patients}</p>\n                    </div>\n                  </div>\n                  
                  <div className=\"flex items-center gap-2 mb-4\">\n                    <Languages size={16} className=\"text-gray-600\" />\n                    <div className=\"flex flex-wrap gap-1.5\">\n                      {doctor.languages.map((lang, idx) => (\n                        <span key={idx} className=\"text-xs text-gray-700\">\n                          {lang}{idx < doctor.languages.length - 1 ? ',' : ''}\n                        </span>\n                      ))}\n                    </div>\n                  </div>\n                  
                  <div className=\"flex items-center justify-between pt-3 border-t border-gray-100\">\n                    <div className=\"flex items-center gap-2\">\n                      <Star size={16} className=\"fill-yellow-400 text-yellow-400\" />\n                      <span className=\"font-bold text-gray-900\">{doctor.rating}</span>\n                      <span className=\"text-sm text-gray-500\">({doctor.reviews} reviews)</span>\n                    </div>\n                    <span className=\"text-sm font-semibold text-[#083f30]\">\n                      Next: {doctor.nextAvailable}\n                    </span>\n                  </div>\n                </button>\n              ))}\n            </div>\n          </div>\n        )}\n        
        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div className=\"space-y-6\">\n            <div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Select Date & Time</h2>\n              <p className=\"text-gray-600\">Choose your preferred appointment slot</p>\n            </div>\n            
            {/* Calendar */}
            <div className=\"bg-white rounded-2xl p-5 border border-gray-200 shadow-sm\">\n              <div className=\"flex items-center justify-between mb-5\">\n                <button className=\"w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors\">\n                  <ChevronLeft size={20} className=\"text-gray-600\" />\n                </button>\n                <h3 className=\"font-bold text-gray-900\">March 2026</h3>\n                <button className=\"w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors\">\n                  <ChevronRight size={20} className=\"text-gray-600\" />\n                </button>\n              </div>\n              
              {/* Day labels */}
              <div className=\"grid grid-cols-7 gap-2 mb-2\">\n                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (\n                  <div key={day} className=\"text-center text-xs font-semibold text-gray-500 py-1\">\n                    {day}\n                  </div>\n                ))}\n              </div>\n              \n              {/* Dates */}
              <div className=\"grid grid-cols-7 gap-2\">\n                {[\n                  { date: '2026-03-15', day: 15, available: true },\n                  { date: '2026-03-16', day: 16, available: true },\n                  { date: '2026-03-17', day: 17, available: false },\n                  { date: '2026-03-18', day: 18, available: true },\n                  { date: '2026-03-19', day: 19, available: true },\n                  { date: '2026-03-20', day: 20, available: false },\n                  { date: '2026-03-21', day: 21, available: false },\n                ].map(date => (\n                  <button\n                    key={date.date}\n                    onClick={() => date.available && setSelectedDate(date.date)}\n                    disabled={!date.available}\n                    className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${\n                      selectedDate === date.date\n                        ? 'bg-[#083f30] text-white shadow-lg scale-105'\n                        : date.available\n                        ? 'bg-gray-50 hover:bg-gray-100 text-gray-900 hover:scale-105'\n                        : 'bg-gray-50 text-gray-300 cursor-not-allowed'\n                    }`}\n                  >\n                    {date.day}\n                  </button>\n                ))}\n              </div>\n            </div>\n            
            {/* Time Slots */}
            {selectedDate && (\n              <div>\n                <h3 className=\"font-bold text-gray-900 mb-4\">Available Time Slots</h3>\n                <div className=\"grid grid-cols-2 gap-3\">\n                  {[\n                    { time: '09:00 AM', available: true },\n                    { time: '10:00 AM', available: true },\n                    { time: '11:00 AM', available: false },\n                    { time: '02:00 PM', available: true },\n                    { time: '03:00 PM', available: true },\n                    { time: '04:00 PM', available: false },\n                  ].map(slot => (\n                    <button\n                      key={slot.time}\n                      onClick={() => slot.available && setSelectedTime(slot.time)}\n                      disabled={!slot.available}\n                      className={`h-14 rounded-xl flex items-center justify-center font-semibold transition-all ${\n                        selectedTime === slot.time\n                          ? 'bg-[#083f30] text-white shadow-lg'\n                          : slot.available\n                          ? 'bg-white border-2 border-gray-200 hover:border-[#083f30] text-gray-900'\n                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'\n                      }`}\n                    >\n                      <Clock size={16} className=\"mr-2\" />\n                      {slot.time}\n                    </button>\n                  ))}\n                </div>\n              </div>\n            )}\n            
            {/* Timezone Notice */}
            <div className=\"bg-blue-50 border border-blue-100 rounded-xl p-4\">\n              <div className=\"flex gap-3\">\n                <Info size={18} className=\"text-blue-600 flex-shrink-0 mt-0.5\" />\n                <div>\n                  <p className=\"text-sm font-semibold text-blue-900 mb-1\">Timezone Notice</p>\n                  <p className=\"text-sm text-blue-800\">\n                    All times shown are in Istanbul Time (GMT+3). We'll send you a confirmation with your local time.\n                  </p>\n                </div>\n              </div>\n            </div>\n          </div>\n        )}\n        
        {/* Step 4: Medical Files */}
        {step === 4 && (
          <div className=\"space-y-6\">\n            <div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Upload Medical Documents</h2>\n              <p className=\"text-gray-600\">Share your medical history to help us prepare</p>\n            </div>\n            
            {/* Upload Area */}
            <button \n              onClick={addMockFile}\n              className=\"w-full bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#083f30] hover:bg-[#083f30]/5 transition-all\"\n            >\n              <div className=\"w-16 h-16 bg-[#083f30]/10 rounded-2xl flex items-center justify-center mx-auto mb-4\">\n                <Upload size={28} className=\"text-[#083f30]\" />\n              </div>\n              <h3 className=\"font-bold text-gray-900 mb-2\">Upload or Drag Files</h3>\n              <p className=\"text-sm text-gray-600 mb-4\">\n                PDF, JPG, PNG up to 10MB each\n              </p>\n              <div className=\"inline-flex items-center gap-2 px-6 py-3 bg-[#083f30] text-white rounded-xl font-semibold\">\n                <Plus size={18} />\n                Choose Files\n              </div>\n            </button>\n            
            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (\n              <div>\n                <h3 className=\"font-bold text-gray-900 mb-3\">Uploaded Files ({uploadedFiles.length})</h3>\n                <div className=\"space-y-2\">\n                  {uploadedFiles.map((file, idx) => (\n                    <div \n                      key={idx}\n                      className=\"flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-200\"\n                    >\n                      <div className=\"w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center\">\n                        <FileText size={20} className=\"text-green-600\" />\n                      </div>\n                      <div className=\"flex-1 min-w-0\">\n                        <p className=\"font-semibold text-gray-900 truncate\">{file.name}</p>\n                        <p className=\"text-xs text-gray-500\">{file.type} • {file.size}</p>\n                      </div>\n                      <div className=\"flex items-center gap-2\">\n                        <CheckCircle2 size={20} className=\"text-green-600\" />\n                        <button className=\"w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors\">\n                          <X size={16} className=\"text-gray-500\" />\n                        </button>\n                      </div>\n                    </div>\n                  ))}\n                </div>\n              </div>\n            )}\n            
            {/* Required Documents Checklist */}
            <div className=\"bg-white rounded-2xl p-5 border border-gray-200\">\n              <h3 className=\"font-bold text-gray-900 mb-4\">Required Documents</h3>\n              <div className=\"space-y-3\">\n                {[\n                  { name: 'Blood Test Results (within 3 months)', required: true },\n                  { name: 'Medical History Form', required: true },\n                  { name: 'Previous Treatment Records', required: false },\n                  { name: 'Current Medications List', required: false },\n                ].map((doc, idx) => (\n                  <div key={idx} className=\"flex items-center gap-3\">\n                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${\n                      uploadedFiles.length > idx ? 'bg-green-50' : 'bg-gray-100'\n                    }`}>\n                      {uploadedFiles.length > idx ? (\n                        <Check size={12} className=\"text-green-600\" />\n                      ) : (\n                        <div className=\"w-2 h-2 bg-gray-400 rounded-full\" />\n                      )}\n                    </div>\n                    <div className=\"flex-1\">\n                      <p className=\"text-sm font-medium text-gray-900\">{doc.name}</p>\n                      {doc.required && (\n                        <span className=\"text-xs text-red-600\">Required</span>\n                      )}\n                    </div>\n                  </div>\n                ))}\n              </div>\n            </div>\n            
            {/* Privacy Notice */}
            <div className=\"bg-green-50 border border-green-100 rounded-xl p-4\">\n              <div className=\"flex gap-3\">\n                <Shield size={18} className=\"text-green-600 flex-shrink-0 mt-0.5\" />\n                <div>\n                  <p className=\"text-sm font-semibold text-green-900 mb-1\">HIPAA Compliant & Encrypted</p>\n                  <p className=\"text-sm text-green-800\">\n                    All documents are encrypted end-to-end and only accessible by your assigned medical team.\n                  </p>\n                </div>\n              </div>\n            </div>\n          </div>\n        )}\n        
        {/* Step 5: Patient Details */}
        {step === 5 && (
          <div className=\"space-y-6\">\n            <div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Patient Information</h2>\n              <p className=\"text-gray-600\">Provide your personal and contact details</p>\n            </div>\n            
            <div className=\"space-y-4\">\n              {/* Full Name */}
              <div>\n                <label className=\"block text-sm font-semibold text-gray-900 mb-2\">Full Name *</label>\n                <input \n                  type=\"text\"\n                  value={patientDetails.fullName}\n                  onChange={(e) => setPatientDetails({...patientDetails, fullName: e.target.value})}\n                  placeholder=\"John Doe\"\n                  className=\"w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#083f30] focus:outline-none transition-colors\"\n                />\n              </div>\n              
              {/* Email */}
              <div>\n                <label className=\"block text-sm font-semibold text-gray-900 mb-2\">Email Address *</label>\n                <input \n                  type=\"email\"\n                  value={patientDetails.email}\n                  onChange={(e) => setPatientDetails({...patientDetails, email: e.target.value})}\n                  placeholder=\"john.doe@example.com\"\n                  className=\"w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#083f30] focus:outline-none transition-colors\"\n                />\n              </div>\n              
              {/* Phone */}
              <div>\n                <label className=\"block text-sm font-semibold text-gray-900 mb-2\">Phone Number *</label>\n                <input \n                  type=\"tel\"\n                  value={patientDetails.phone}\n                  onChange={(e) => setPatientDetails({...patientDetails, phone: e.target.value})}\n                  placeholder=\"+1 (555) 123-4567\"\n                  className=\"w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#083f30] focus:outline-none transition-colors\"\n                />\n              </div>\n              
              {/* Date of Birth & Gender */}
              <div className=\"grid grid-cols-2 gap-4\">\n                <div>\n                  <label className=\"block text-sm font-semibold text-gray-900 mb-2\">Date of Birth</label>\n                  <input \n                    type=\"date\"\n                    value={patientDetails.dateOfBirth}\n                    onChange={(e) => setPatientDetails({...patientDetails, dateOfBirth: e.target.value})}\n                    className=\"w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:border-[#083f30] focus:outline-none transition-colors\"\n                  />\n                </div>\n                <div>\n                  <label className=\"block text-sm font-semibold text-gray-900 mb-2\">Gender</label>\n                  <select \n                    value={patientDetails.gender}\n                    onChange={(e) => setPatientDetails({...patientDetails, gender: e.target.value})}\n                    className=\"w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 focus:border-[#083f30] focus:outline-none transition-colors appearance-none\"\n                  >\n                    <option value=\"\">Select</option>\n                    <option value=\"male\">Male</option>\n                    <option value=\"female\">Female</option>\n                    <option value=\"other\">Other</option>\n                  </select>\n                </div>\n              </div>\n              
              {/* Nationality & Passport */}
              <div className=\"grid grid-cols-2 gap-4\">\n                <div>\n                  <label className=\"block text-sm font-semibold text-gray-900 mb-2\">Nationality</label>\n                  <input \n                    type=\"text\"\n                    value={patientDetails.nationality}\n                    onChange={(e) => setPatientDetails({...patientDetails, nationality: e.target.value})}\n                    placeholder=\"United States\"\n                    className=\"w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#083f30] focus:outline-none transition-colors\"\n                  />\n                </div>\n                <div>\n                  <label className=\"block text-sm font-semibold text-gray-900 mb-2\">Passport Number</label>\n                  <input \n                    type=\"text\"\n                    value={patientDetails.passportNumber}\n                    onChange={(e) => setPatientDetails({...patientDetails, passportNumber: e.target.value})}\n                    placeholder=\"Optional\"\n                    className=\"w-full h-12 px-4 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#083f30] focus:outline-none transition-colors\"\n                  />\n                </div>\n              </div>\n              
              {/* Medical Notes */}
              <div>\n                <label className=\"block text-sm font-semibold text-gray-900 mb-2\">Medical Notes or Concerns</label>\n                <textarea \n                  value={patientDetails.medicalNotes}\n                  onChange={(e) => setPatientDetails({...patientDetails, medicalNotes: e.target.value})}\n                  placeholder=\"Any allergies, current medications, or special requirements...\"\n                  rows={4}\n                  className=\"w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#083f30] focus:outline-none transition-colors resize-none\"\n                />\n              </div>\n            </div>\n            
            {/* Info Notice */}
            <div className=\"bg-blue-50 border border-blue-100 rounded-xl p-4\">\n              <div className=\"flex gap-3\">\n                <Info size={18} className=\"text-blue-600 flex-shrink-0 mt-0.5\" />\n                <div>\n                  <p className=\"text-sm font-semibold text-blue-900 mb-1\">International Patients</p>\n                  <p className=\"text-sm text-blue-800\">\n                    Your passport information helps us arrange visa support and travel documents if needed.\n                  </p>\n                </div>\n              </div>\n            </div>\n          </div>\n        )}\n        
        {/* Step 6: Add-ons */}
        {step === 6 && (
          <div className=\"space-y-6\">\n            <div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Enhance Your Journey</h2>\n              <p className=\"text-gray-600\">Optional services to make your experience seamless</p>\n            </div>\n            
            <div className=\"space-y-3\">\n              {addons.map(addon => (\n                <div\n                  key={addon.id}\n                  className={`bg-white rounded-2xl border-2 transition-all ${\n                    selectedAddons.includes(addon.id)\n                      ? 'border-[#083f30] shadow-lg'\n                      : 'border-gray-200 shadow-sm'\n                  }`}\n                >\n                  <div className=\"p-5\">\n                    <div className=\"flex gap-4 mb-4\">\n                      <div className=\"w-14 h-14 bg-[#083f30]/5 rounded-2xl flex items-center justify-center flex-shrink-0\">\n                        {addon.icon}\n                      </div>\n                      \n                      <div className=\"flex-1\">\n                        <div className=\"flex items-start justify-between mb-2\">\n                          <div>\n                            <div className=\"flex items-center gap-2 mb-1\">\n                              <h3 className=\"font-bold text-gray-900\">{addon.name}</h3>\n                              {addon.popular && (\n                                <span className=\"px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-bold\">\n                                  POPULAR\n                                </span>\n                              )}\n                            </div>\n                            <p className=\"text-sm text-gray-600\">{addon.description}</p>\n                          </div>\n                          <div className=\"text-right ml-4\">\n                            <div className=\"text-xl font-bold text-[#083f30]\">+${addon.price}</div>\n                          </div>\n                        </div>\n                        \n                        {/* Benefits List */}
                        <div className=\"grid grid-cols-2 gap-2 mb-4\">\n                          {addon.details.map((detail, idx) => (\n                            <div key={idx} className=\"flex items-center gap-2\">\n                              <div className=\"w-4 h-4 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0\">\n                                <Check size={10} className=\"text-green-600\" />\n                              </div>\n                              <span className=\"text-xs text-gray-700\">{detail}</span>\n                            </div>\n                          ))}\n                        </div>\n                        
                        <button\n                          onClick={() => toggleAddon(addon.id)}\n                          className={`w-full h-11 rounded-xl font-semibold transition-all ${\n                            selectedAddons.includes(addon.id)\n                              ? 'bg-[#083f30] text-white shadow-md'\n                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'\n                          }`}\n                        >\n                          {selectedAddons.includes(addon.id) ? (\n                            <span className=\"flex items-center justify-center gap-2\">\n                              <CheckCircle2 size={18} />\n                              Added to Package\n                            </span>\n                          ) : (\n                            <span className=\"flex items-center justify-center gap-2\">\n                              <Plus size={18} />\n                              Add Service\n                            </span>\n                          )}\n                        </button>\n                      </div>\n                    </div>\n                  </div>\n                </div>\n              ))}\n            </div>\n            
            {/* Bundle Discount Notice */}
            {selectedAddons.length >= 3 && (\n              <div className=\"bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4\">\n                <div className=\"flex gap-3\">\n                  <Percent size={20} className=\"text-green-600 flex-shrink-0 mt-0.5\" />\n                  <div>\n                    <p className=\"text-sm font-bold text-green-900 mb-1\">Bundle Discount Applied!</p>\n                    <p className=\"text-sm text-green-800\">\n                      You've saved 10% on add-ons by selecting 3 or more services.\n                    </p>\n                  </div>\n                </div>\n              </div>\n            )}\n          </div>\n        )}\n        
        {/* Step 7: Booking Summary */}
        {step === 7 && (
          <div className=\"space-y-6\">\n            <div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Review Your Booking</h2>\n              <p className=\"text-gray-600\">Please verify all details before payment</p>\n            </div>\n            
            {/* Treatment Summary Card */}
            <div className=\"bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden\">\n              <div className=\"p-5 bg-gray-50 border-b border-gray-200\">\n                <h3 className=\"font-bold text-gray-900\">Treatment Details</h3>\n              </div>\n              <div className=\"p-5\">\n                <div className=\"flex gap-4 mb-4 pb-4 border-b border-gray-100\">\n                  <img \n                    src={treatment.image}\n                    alt={treatment.name}\n                    className=\"w-24 h-24 rounded-xl object-cover\"\n                  />\n                  <div className=\"flex-1\">\n                    <h3 className=\"font-bold text-gray-900 mb-1\">{treatment.name}</h3>\n                    <p className=\"text-sm text-gray-600 mb-2\">{treatment.clinic}</p>\n                    <div className=\"flex items-center gap-2 text-xs text-gray-600\">\n                      <MapPin size={12} />\n                      <span>{treatment.city}, {treatment.country}</span>\n                    </div>\n                  </div>\n                </div>\n                
                {selectedDoctor && (\n                  <div className=\"mb-4 pb-4 border-b border-gray-100\">\n                    <p className=\"text-xs font-semibold text-gray-600 mb-2\">SELECTED DOCTOR</p>\n                    <div className=\"flex items-center gap-3\">\n                      <img \n                        src={doctors.find(d => d.id === selectedDoctor)?.image}\n                        alt=\"Doctor\"\n                        className=\"w-12 h-12 rounded-xl object-cover\"\n                      />\n                      <div>\n                        <p className=\"font-bold text-gray-900 text-sm\">\n                          {doctors.find(d => d.id === selectedDoctor)?.name}\n                        </p>\n                        <p className=\"text-xs text-gray-600\">\n                          {doctors.find(d => d.id === selectedDoctor)?.specialty}\n                        </p>\n                      </div>\n                    </div>\n                  </div>\n                )}\n                
                <div className=\"grid grid-cols-2 gap-3\">\n                  <div className=\"bg-gray-50 rounded-xl p-3\">\n                    <div className=\"flex items-center gap-2 mb-1\">\n                      <Calendar size={14} className=\"text-gray-600\" />\n                      <span className=\"text-xs font-semibold text-gray-600\">Date</span>\n                    </div>\n                    <p className=\"text-sm font-bold text-gray-900\">{selectedDate || 'Not selected'}</p>\n                  </div>\n                  <div className=\"bg-gray-50 rounded-xl p-3\">\n                    <div className=\"flex items-center gap-2 mb-1\">\n                      <Clock size={14} className=\"text-gray-600\" />\n                      <span className=\"text-xs font-semibold text-gray-600\">Time</span>\n                    </div>\n                    <p className=\"text-sm font-bold text-gray-900\">{selectedTime || 'Not selected'}</p>\n                  </div>\n                </div>\n              </div>\n            </div>\n            
            {/* Cost Breakdown */}
            <div className=\"bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden\">\n              <div className=\"p-5 bg-gray-50 border-b border-gray-200\">\n                <h3 className=\"font-bold text-gray-900\">Cost Breakdown</h3>\n              </div>\n              <div className=\"p-5 space-y-3\">\n                <div className=\"flex items-center justify-between\">\n                  <span className=\"text-gray-700\">Treatment Fee</span>\n                  <span className=\"font-bold text-gray-900\">${treatment.price}</span>\n                </div>\n                \n                {selectedAddons.length > 0 && (\n                  <>\n                    <div className=\"pt-3 border-t border-gray-100\">\n                      <p className=\"text-sm font-semibold text-gray-900 mb-2\">Add-on Services</p>\n                      {selectedAddons.map(addonId => {\n                        const addon = addons.find(a => a.id === addonId);\n                        return addon ? (\n                          <div key={addonId} className=\"flex items-center justify-between py-1\">\n                            <span className=\"text-sm text-gray-600\">{addon.name}</span>\n                            <span className=\"text-sm font-semibold text-gray-900\">${addon.price}</span>\n                          </div>\n                        ) : null;\n                      })}\n                    </div>\n                  </>\n                )}\n                \n                <div className=\"flex items-center justify-between pt-3 border-t border-gray-100\">\n                  <span className=\"text-gray-700\">Subtotal</span>\n                  <span className=\"font-bold text-gray-900\">${calculateSubtotal()}</span>\n                </div>\n                \n                <div className=\"flex items-center justify-between\">\n                  <span className=\"text-gray-600 text-sm\">Service Fee (3%)</span>\n                  <span className=\"text-sm font-semibold text-gray-900\">${calculateServiceFee()}</span>\n                </div>\n                
                <div className=\"flex items-center justify-between pt-4 border-t-2 border-gray-200\">\n                  <span className=\"text-lg font-bold text-gray-900\">Total Amount</span>\n                  <span className=\"text-2xl font-bold text-[#083f30]\">${calculateTotal()}</span>\n                </div>\n              </div>\n            </div>\n            
            {/* Promo Code */}
            <div className=\"bg-white rounded-2xl border border-gray-200 p-4\">\n              <div className=\"flex gap-3\">\n                <input \n                  type=\"text\"\n                  value={promoCode}\n                  onChange={(e) => setPromoCode(e.target.value)}\n                  placeholder=\"Enter promo code\"\n                  className=\"flex-1 h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:border-[#083f30] focus:outline-none transition-colors\"\n                />\n                <button className=\"h-11 px-6 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors\">\n                  Apply\n                </button>\n              </div>\n            </div>\n            
            {/* Trust Badges */}
            <div className=\"grid grid-cols-2 gap-3\">\n              <div className=\"bg-green-50 border border-green-100 rounded-xl p-4 text-center\">\n                <BadgeCheck size={24} className=\"text-green-600 mx-auto mb-2\" />\n                <p className=\"text-xs font-semibold text-green-900\">Verified Provider</p>\n              </div>\n              <div className=\"bg-blue-50 border border-blue-100 rounded-xl p-4 text-center\">\n                <Shield size={24} className=\"text-blue-600 mx-auto mb-2\" />\n                <p className=\"text-xs font-semibold text-blue-900\">Secure Payment</p>\n              </div>\n            </div>\n          </div>\n        )}\n        
        {/* Step 8: Payment */}
        {step === 8 && (
          <div className=\"space-y-6\">\n            <div>\n              <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Complete Payment</h2>\n              <p className=\"text-gray-600\">Choose your preferred payment method</p>\n            </div>\n            
            {/* Payment Option Toggle */}
            <div className=\"bg-white rounded-2xl border border-gray-200 p-2 flex gap-2\">\n              <button\n                onClick={() => setDepositOption('deposit')}\n                className={`flex-1 h-11 rounded-xl font-semibold transition-all ${\n                  depositOption === 'deposit'\n                    ? 'bg-[#083f30] text-white shadow-md'\n                    : 'text-gray-600 hover:bg-gray-50'\n                }`}\n              >\n                Pay Deposit (${treatment.depositAmount})\n              </button>\n              <button\n                onClick={() => setDepositOption('full')}\n                className={`flex-1 h-11 rounded-xl font-semibold transition-all ${\n                  depositOption === 'full'\n                    ? 'bg-[#083f30] text-white shadow-md'\n                    : 'text-gray-600 hover:bg-gray-50'\n                }`}\n              >\n                Pay Full (${calculateTotal()})\n              </button>\n            </div>\n            
            {/* Amount Summary */}
            <div className=\"bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl p-5 text-white\">\n              <div className=\"flex items-center justify-between\">\n                <div>\n                  <p className=\"text-sm text-white/80 mb-1\">\n                    {depositOption === 'deposit' ? 'Deposit Amount' : 'Total Amount'}\n                  </p>\n                  <div className=\"text-3xl font-bold\">${getDepositAmount()}</div>\n                  {depositOption === 'deposit' && (\n                    <p className=\"text-xs text-white/70 mt-2\">\n                      Remaining ${calculateTotal() - treatment.depositAmount} due before treatment\n                    </p>\n                  )}\n                </div>\n                <CreditCard size={40} className=\"text-white/20\" />\n              </div>\n            </div>\n            
            {/* Payment Methods */}
            <div>\n              <h3 className=\"font-bold text-gray-900 mb-4\">Select Payment Method</h3>\n              <div className=\"space-y-3\">\n                {[\n                  { \n                    id: 'card', \n                    name: 'Credit / Debit Card', \n                    subtitle: 'Visa, Mastercard, Amex',\n                    icon: <CreditCard size={24} />, \n                    popular: true \n                  },\n                  { \n                    id: 'wallet', \n                    name: 'Digital Wallet', \n                    subtitle: 'Apple Pay, Google Pay',\n                    icon: <Wallet size={24} /> \n                  },\n                  { \n                    id: 'bank', \n                    name: 'Bank Transfer', \n                    subtitle: 'Wire transfer or ACH',\n                    icon: <Building size={24} /> \n                  },\n                ].map(method => (\n                  <button\n                    key={method.id}\n                    onClick={() => setPaymentMethod(method.id)}\n                    className={`w-full bg-white rounded-2xl p-5 border-2 transition-all flex items-center gap-4 ${\n                      paymentMethod === method.id\n                        ? 'border-[#083f30] shadow-lg'\n                        : 'border-gray-200 hover:border-gray-300 shadow-sm'\n                    }`}\n                  >\n                    <div className=\"w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-[#083f30]\">\n                      {method.icon}\n                    </div>\n                    <div className=\"flex-1 text-left\">\n                      <div className=\"flex items-center gap-2 mb-1\">\n                        <h3 className=\"font-bold text-gray-900\">{method.name}</h3>\n                        {method.popular && (\n                          <span className=\"px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs font-bold\">\n                            RECOMMENDED\n                          </span>\n                        )}\n                      </div>\n                      <p className=\"text-sm text-gray-600\">{method.subtitle}</p>\n                    </div>\n                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${\n                      paymentMethod === method.id\n                        ? 'border-[#083f30]'\n                        : 'border-gray-300'\n                    }`}>\n                      {paymentMethod === method.id && (\n                        <div className=\"w-3 h-3 bg-[#083f30] rounded-full\" />\n                      )}\n                    </div>\n                  </button>\n                ))}\n              </div>\n            </div>\n            
            {/* Security Badges */}
            <div className=\"bg-green-50 border border-green-100 rounded-xl p-4\">\n              <div className=\"flex gap-3\">\n                <Shield size={20} className=\"text-green-600 flex-shrink-0 mt-0.5\" />\n                <div>\n                  <p className=\"text-sm font-bold text-green-900 mb-1\">256-bit SSL Encryption</p>\n                  <p className=\"text-sm text-green-800\">\n                    Your payment is secured by bank-grade encryption. We never store your card details.\n                  </p>\n                </div>\n              </div>\n            </div>\n            
            {/* Cancellation Policy */}
            <div className=\"bg-yellow-50 border border-yellow-100 rounded-xl p-4\">\n              <div className=\"flex gap-3\">\n                <AlertTriangle size={18} className=\"text-yellow-600 flex-shrink-0 mt-0.5\" />\n                <div>\n                  <p className=\"text-sm font-bold text-yellow-900 mb-1\">Cancellation Policy</p>\n                  <p className=\"text-sm text-yellow-800\">\n                    Free cancellation up to 14 days before treatment. 50% refund within 7 days.\n                  </p>\n                </div>\n              </div>\n            </div>\n            
            {/* Terms Checkbox */}
            <label className=\"flex items-start gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl cursor-pointer hover:border-[#083f30] transition-colors\">\n              <input \n                type=\"checkbox\" \n                checked={agreeToTerms}\n                onChange={(e) => setAgreeToTerms(e.target.checked)}\n                className=\"w-5 h-5 rounded border-2 border-gray-300 text-[#083f30] focus:ring-2 focus:ring-[#083f30]/20 mt-0.5\" \n              />\n              <div className=\"flex-1 text-sm\">\n                <p className=\"text-gray-900\">\n                  I agree to the{' '}\n                  <a href=\"#\" className=\"text-[#083f30] font-semibold hover:underline\">Terms & Conditions</a>,{' '}\n                  <a href=\"#\" className=\"text-[#083f30] font-semibold hover:underline\">Privacy Policy</a>, and{' '}\n                  <a href=\"#\" className=\"text-[#083f30] font-semibold hover:underline\">Cancellation Policy</a>\n                </p>\n              </div>\n            </label>\n            
            {/* Support Notice */}
            <div className=\"bg-blue-50 border border-blue-100 rounded-xl p-4\">\n              <div className=\"flex gap-3\">\n                <Headphones size={18} className=\"text-blue-600 flex-shrink-0 mt-0.5\" />\n                <div>\n                  <p className=\"text-sm font-semibold text-blue-900 mb-1\">24/7 Medical Coordinator Support</p>\n                  <p className=\"text-sm text-blue-800\">\n                    A dedicated coordinator will be assigned after booking confirmation.\n                  </p>\n                </div>\n              </div>\n            </div>\n          </div>\n        )}\n      </div>\n      
      {/* Sticky Bottom CTA */}
      <div className=\"fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 shadow-2xl z-50\">\n        <div className=\"flex items-center gap-3 mb-3\">\n          {step > 1 && (\n            <button \n              onClick={handleBack}\n              className=\"h-14 px-6 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors active:scale-95 flex items-center gap-2\"\n            >\n              <ChevronLeft size={20} />\n              Back\n            </button>\n          )}\n          \n          <button \n            onClick={() => {\n              if (step === 8 && canProceed()) {\n                navigate('/app/booking/success');\n              } else if (canProceed()) {\n                handleNext();\n              }\n            }}\n            disabled={!canProceed()}\n            className={`flex-1 h-14 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${\n              canProceed()\n                ? 'bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white hover:shadow-xl active:scale-95'\n                : 'bg-gray-200 text-gray-400 cursor-not-allowed'\n            }`}\n          >\n            {step === 8 ? (\n              <>\n                <Shield size={20} />\n                Confirm & Pay ${getDepositAmount()}\n              </>\n            ) : (\n              <>\n                Continue\n                <ChevronRight size={20} />\n              </>\n            )}\n          </button>\n        </div>\n        \n        <div className=\"flex items-center justify-center gap-2 text-xs text-gray-500\">\n          <Shield size={12} />\n          <span>Secure & encrypted • {steps.length - step} steps remaining</span>\n        </div>\n      </div>\n    </div>\n  );\n}
