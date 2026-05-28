import { useNavigate } from '@/hooks/use-navigate';
<<<<<<< HEAD
import { CheckCircle2, Download, Calendar, MapPin, Clock, Phone, Mail, Share2, BadgeCheck, ChevronRight, Plane, Hotel as HotelIcon, FileText } from 'lucide-react';
import { useTranslations } from "next-intl";
export default function PaymentSuccess() {
    const tBooking = useTranslations("Booking");
    const navigate = useNavigate();
    const booking = {
        confirmationNumber: 'LSV-2026-0847',
        treatment: 'Premium Hair Transplant - FUE Method',
        clinic: 'Istanbul Medical Center',
        clinicAddress: 'Sisli, Istanbul, Turkey',
        doctor: 'Dr. Mehmet Yavuz',
        date: 'March 15, 2026',
        time: '09:00 AM',
        duration: '6-8 hours',
        total: 2849,
        currency: 'USD',
        addons: [
            { name: '4-Star Hotel Package', included: true },
            { name: 'VIP Airport Transfer', included: true },
            { name: 'Personal Translator', included: true },
        ],
        patientName: 'Sarah Anderson',
        email: 'sarah.anderson@email.com',
        phone: '+971 50 123 4567',
    };
    const nextSteps = [
        {
            step: 1,
            title: 'Confirmation Email Sent',
            description: 'Check your email for booking details and travel information',
            completed: true,
            icon: <Mail size={20}/>,
        },
        {
            step: 2,
            title: 'Pre-Treatment Consultation',
            description: 'Our team will contact you within 24 hours to schedule virtual consultation',
            completed: false,
            icon: <Phone size={20}/>,
        },
        {
            step: 3,
            title: 'Travel Arrangements',
            description: 'Hotel booking and airport transfer details will be sent 7 days before',
            completed: false,
            icon: <Plane size={20}/>,
        },
        {
            step: 4,
            title: 'Arrival & Treatment',
            description: 'Check-in at clinic on March 15, 2026 at 8:30 AM',
            completed: false,
            icon: <Calendar size={20}/>,
        },
    ];
    return (<div className="min-h-screen bg-gradient-to-b from-[#083f30] to-[#0a5a44] pb-8">
      {/* Success Animation Area */}
      <div className="px-5 pt-12 pb-8 text-center">
        <div className="w-24 h-24 bg-[#eacb7f] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <CheckCircle2 size={48} className="text-[#083f30]"/>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">{tBooking("bookingConfirmed")}</h1>
        <p className="text-white/90 text-base mb-6 max-w-sm mx-auto">{tBooking("yourMedicalJourneyIsScheduledWeLlTakeCare")}</p>
        
        {/* Confirmation Number */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <span className="text-white/80 text-sm">{tBooking("confirmationNumber")}</span>
=======
import { 
  CheckCircle2, 
  Download,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Mail,
  Share2,
  BadgeCheck,
  ChevronRight,
  Plane,
  Hotel as HotelIcon,
  FileText
} from 'lucide-react';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  
  const booking = {
    confirmationNumber: 'LSV-2026-0847',
    treatment: 'Premium Hair Transplant - FUE Method',
    clinic: 'Istanbul Medical Center',
    clinicAddress: 'Sisli, Istanbul, Turkey',
    doctor: 'Dr. Mehmet Yavuz',
    date: 'March 15, 2026',
    time: '09:00 AM',
    duration: '6-8 hours',
    total: 2849,
    currency: 'USD',
    addons: [
      { name: '4-Star Hotel Package', included: true },
      { name: 'VIP Airport Transfer', included: true },
      { name: 'Personal Translator', included: true },
    ],
    patientName: 'Sarah Anderson',
    email: 'sarah.anderson@email.com',
    phone: '+971 50 123 4567',
  };
  
  const nextSteps = [
    {
      step: 1,
      title: 'Confirmation Email Sent',
      description: 'Check your email for booking details and travel information',
      completed: true,
      icon: <Mail size={20} />,
    },
    {
      step: 2,
      title: 'Pre-Treatment Consultation',
      description: 'Our team will contact you within 24 hours to schedule virtual consultation',
      completed: false,
      icon: <Phone size={20} />,
    },
    {
      step: 3,
      title: 'Travel Arrangements',
      description: 'Hotel booking and airport transfer details will be sent 7 days before',
      completed: false,
      icon: <Plane size={20} />,
    },
    {
      step: 4,
      title: 'Arrival & Treatment',
      description: 'Check-in at clinic on March 15, 2026 at 8:30 AM',
      completed: false,
      icon: <Calendar size={20} />,
    },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#083f30] to-[#0a5a44] pb-8">
      {/* Success Animation Area */}
      <div className="px-5 pt-12 pb-8 text-center">
        <div className="w-24 h-24 bg-[#eacb7f] rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
          <CheckCircle2 size={48} className="text-[#083f30]" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-3">
          Booking Confirmed!
        </h1>
        <p className="text-white/90 text-base mb-6 max-w-sm mx-auto">
          Your medical journey is scheduled. We'll take care of everything from here.
        </p>
        
        {/* Confirmation Number */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
          <span className="text-white/80 text-sm">Confirmation #</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          <span className="text-white font-bold">{booking.confirmationNumber}</span>
        </div>
      </div>
      
      {/* Main Content Card */}
      <div className="px-5">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Booking Details */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-4">
<<<<<<< HEAD
              <BadgeCheck size={20} className="text-[#083f30]"/>
              <h2 className="text-lg font-bold text-gray-900">{tBooking("bookingDetails")}</h2>
=======
              <BadgeCheck size={20} className="text-[#083f30]" />
              <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
            
            <div className="space-y-4">
              {/* Treatment */}
              <div>
<<<<<<< HEAD
                <div className="text-xs text-gray-500 mb-1">{tBooking("treatment")}</div>
=======
                <div className="text-xs text-gray-500 mb-1">Treatment</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                <div className="font-bold text-gray-900">{booking.treatment}</div>
              </div>
              
              {/* Clinic */}
              <div>
<<<<<<< HEAD
                <div className="text-xs text-gray-500 mb-1">{tBooking("clinic")}</div>
                <div className="font-bold text-gray-900">{booking.clinic}</div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                  <MapPin size={14}/>
=======
                <div className="text-xs text-gray-500 mb-1">Clinic</div>
                <div className="font-bold text-gray-900">{booking.clinic}</div>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                  <MapPin size={14} />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                  <span>{booking.clinicAddress}</span>
                </div>
              </div>
              
              {/* Doctor */}
              <div>
<<<<<<< HEAD
                <div className="text-xs text-gray-500 mb-1">{tBooking("doctor2")}</div>
=======
                <div className="text-xs text-gray-500 mb-1">Doctor</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                <div className="font-bold text-gray-900">{booking.doctor}</div>
              </div>
              
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
<<<<<<< HEAD
                  <div className="text-xs text-gray-500 mb-1">{tBooking("date2")}</div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#083f30]"/>
=======
                  <div className="text-xs text-gray-500 mb-1">Date</div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#083f30]" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    <span className="font-bold text-gray-900">{booking.date}</span>
                  </div>
                </div>
                <div>
<<<<<<< HEAD
                  <div className="text-xs text-gray-500 mb-1">{tBooking("time")}</div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#083f30]"/>
=======
                  <div className="text-xs text-gray-500 mb-1">Time</div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#083f30]" />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                    <span className="font-bold text-gray-900">{booking.time}</span>
                  </div>
                </div>
              </div>
              
              {/* Add-ons */}
<<<<<<< HEAD
              {booking.addons.length > 0 && (<div>
                  <div className="text-xs text-gray-500 mb-2">{tBooking("includedServices")}</div>
                  <div className="flex flex-wrap gap-2">
                    {booking.addons.map((addon, idx) => (<span key={idx} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={14}/>
                        {addon.name}
                      </span>))}
                  </div>
                </div>)}
=======
              {booking.addons.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-2">Included Services</div>
                  <div className="flex flex-wrap gap-2">
                    {booking.addons.map((addon, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} />
                        {addon.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
          </div>
          
          {/* Payment Summary */}
          <div className="p-6 bg-gray-50 border-b border-gray-100">
<<<<<<< HEAD
            <h3 className="font-bold text-gray-900 mb-3">{tBooking("paymentSummary")}</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{tBooking("totalPaid")}</span>
=======
            <h3 className="font-bold text-gray-900 mb-3">Payment Summary</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Paid</span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              <span className="text-2xl font-bold text-[#083f30]">
                ${booking.total.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
<<<<<<< HEAD
              <CheckCircle2 size={16} className="text-green-600"/>
              <span className="text-sm text-green-700 font-semibold">{tBooking("paymentConfirmed")}</span>
=======
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-sm text-green-700 font-semibold">
                Payment confirmed
              </span>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
          </div>
          
          {/* Next Steps */}
          <div className="p-6">
<<<<<<< HEAD
            <h3 className="font-bold text-gray-900 mb-4">{tBooking("whatHappensNext")}</h3>
            <div className="space-y-4">
              {nextSteps.map((step, idx) => (<div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step.completed
                ? 'bg-green-100 text-green-600'
                : 'bg-gray-100 text-gray-400'}`}>
                      {step.completed ? <CheckCircle2 size={20}/> : step.icon}
                    </div>
                    {idx < nextSteps.length - 1 && (<div className={`w-0.5 h-12 my-1 ${step.completed ? 'bg-green-200' : 'bg-gray-200'}`}/>)}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <h4 className={`font-bold mb-1 ${step.completed ? 'text-gray-900' : 'text-gray-700'}`}>
=======
            <h3 className="font-bold text-gray-900 mb-4">What Happens Next</h3>
            <div className="space-y-4">
              {nextSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step.completed
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {step.completed ? <CheckCircle2 size={20} /> : step.icon}
                    </div>
                    {idx < nextSteps.length - 1 && (
                      <div className={`w-0.5 h-12 my-1 ${
                        step.completed ? 'bg-green-200' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <h4 className={`font-bold mb-1 ${
                      step.completed ? 'text-gray-900' : 'text-gray-700'
                    }`}>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                      {step.title}
                    </h4>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
<<<<<<< HEAD
                </div>))}
=======
                </div>
              ))}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
          </div>
          
          {/* Actions */}
          <div className="p-6 pt-0 space-y-3">
<<<<<<< HEAD
            <button onClick={() => navigate('/app/bookings')} className="w-full h-12 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2">{tBooking("viewMyBookings")}<ChevronRight size={18}/>
=======
            <button 
              onClick={() => navigate('/app/bookings')}
              className="w-full h-12 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-2"
            >
              View My Bookings
              <ChevronRight size={18} />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </button>
            
            <div className="grid grid-cols-2 gap-3">
              <button className="h-11 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
<<<<<<< HEAD
                <Download size={18}/>{tBooking("download")}</button>
              <button className="h-11 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <Share2 size={18}/>{tBooking("share")}</button>
=======
                <Download size={18} />
                Download
              </button>
              <button className="h-11 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                <Share2 size={18} />
                Share
              </button>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
            </div>
          </div>
        </div>
        
        {/* Help Section */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5">
<<<<<<< HEAD
          <h3 className="font-bold text-white mb-3">{tBooking("needHelp")}</h3>
          <div className="space-y-3">
            <a href="tel:+905551234567" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Phone size={18}/>
              </div>
              <div>
                <div className="text-sm font-semibold">{tBooking("twentyFourSevenSupport")}</div>
=======
          <h3 className="font-bold text-white mb-3">Need Help?</h3>
          <div className="space-y-3">
            <a 
              href="tel:+905551234567"
              className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Phone size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">24/7 Support</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
                <div className="text-xs text-white/70">+90 555 123 45 67</div>
              </div>
            </a>
            
<<<<<<< HEAD
            <a href="mailto:support@lsevin.com" className="flex items-center gap-3 text-white/90 hover:text-white transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Mail size={18}/>
              </div>
              <div>
                <div className="text-sm font-semibold">{tBooking("emailSupport")}</div>
                <div className="text-xs text-white/70">{tBooking("supportLsevinCom")}</div>
=======
            <a 
              href="mailto:support@lsevin.com"
              className="flex items-center gap-3 text-white/90 hover:text-white transition-colors"
            >
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Mail size={18} />
              </div>
              <div>
                <div className="text-sm font-semibold">Email Support</div>
                <div className="text-xs text-white/70">support@lsevin.com</div>
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
              </div>
            </a>
          </div>
        </div>
        
        {/* Return Home */}
<<<<<<< HEAD
        <button onClick={() => navigate('/app/home')} className="w-full mt-6 h-12 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors">{tBooking("returnToHome")}</button>
      </div>
    </div>);
=======
        <button 
          onClick={() => navigate('/app/home')}
          className="w-full mt-6 h-12 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-xl font-semibold hover:bg-white/20 transition-colors"
        >
          Return to Home
        </button>
      </div>
    </div>
  );
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
}
