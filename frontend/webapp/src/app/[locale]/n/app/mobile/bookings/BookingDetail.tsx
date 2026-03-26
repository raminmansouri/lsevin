"use client"

import { useNavigate, useParams } from 'react-router';
import { 
  ChevronLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  BadgeCheck,
  CheckCircle,
  Phone,
  Mail,
  Download,
  MessageCircle,
  AlertCircle,
  CreditCard,
  Users,
  FileText,
  Navigation,
  XCircle
} from 'lucide-react';
import { useState } from 'react';

export default function BookingDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Mock booking data
  const booking = {
    id: 'BK-2024-001',
    service: 'Premium Hair Transplant Package',
    provider: 'Istanbul Medical Center',
    providerImage: '/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=600&h=400&fit=crop.jpg',
    date: 'March 18, 2026',
    time: '09:00 AM',
    duration: '4-6 hours',
    location: 'Şişli, Istanbul, Turkey',
    fullAddress: 'Halaskargazi Cad. No:38/6, 34371 Şişli/Istanbul',
    status: 'confirmed',
    paymentStatus: 'paid',
    price: 2499,
    deposit: 500,
    remaining: 1999,
    verified: true,
    bookingDate: 'February 28, 2026',
    confirmationCode: 'LSEVIN-HT-2024-001',
    included: [
      'FUE Hair Transplant (4000 grafts)',
      '3 nights hotel accommodation',
      'Airport transfers',
      'Post-op medications',
      '1-year follow-up'
    ],
    contact: {
      phone: '+90 212 555 0123',
      email: 'info@istanbulmedical.com'
    },
    doctor: {
      name: 'Dr. Mehmet Yilmaz',
      title: 'Hair Transplant Specialist',
      experience: '15+ years',
      image: '/unsplash_images/photo-1559839734-2b71ea197ec2__w=200&h=200&fit=crop.jpg'
    }
  };

  const getStatusBadge = () => {
    const badges = {
      confirmed: { icon: CheckCircle, text: 'Confirmed', color: 'bg-green-50 text-green-700 border-green-200' },
      pending: { icon: AlertCircle, text: 'Pending Confirmation', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    };
    return badges[booking.status as keyof typeof badges];
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
            
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-sm text-gray-600">{booking.id}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Status Card */}
        <div className={`p-4 rounded-2xl border-2 ${statusBadge.color}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <StatusIcon size={24} className={statusBadge.color.split(' ')[1]} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{statusBadge.text}</h3>
              <p className="text-sm opacity-80">Booking confirmed and paid</p>
            </div>
          </div>
        </div>

        {/* Service Card */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="relative h-48">
            <img 
              src={booking.providerImage}
              alt={booking.service}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-xl font-bold text-white mb-1">{booking.service}</h2>
              <div className="flex items-center gap-2">
                <span className="text-white/90">{booking.provider}</span>
                {booking.verified && (
                  <div className="w-5 h-5 bg-[#083f30] rounded-full flex items-center justify-center">
                    <BadgeCheck size={14} className="text-[#eacb7f]" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Date & Time */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">Appointment Details</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar size={20} className="text-[#083f30]" />
                  <div>
                    <p className="text-xs text-gray-600">Date</p>
                    <p className="font-semibold text-gray-900">{booking.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Clock size={20} className="text-[#083f30]" />
                  <div>
                    <p className="text-xs text-gray-600">Time</p>
                    <p className="font-semibold text-gray-900">{booking.time}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <MapPin size={20} className="text-[#083f30] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 mb-0.5">Location</p>
                  <p className="font-semibold text-gray-900 mb-0.5">{booking.location}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{booking.fullAddress}</p>
                </div>
                <button className="flex-shrink-0 w-9 h-9 bg-[#083f30] rounded-full flex items-center justify-center">
                  <Navigation size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Your Doctor</h3>
          <div className="flex items-center gap-3">
            <img 
              src={booking.doctor.image}
              alt={booking.doctor.name}
              className="w-14 h-14 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-bold text-gray-900">{booking.doctor.name}</p>
              <p className="text-sm text-gray-600">{booking.doctor.title}</p>
              <p className="text-xs text-[#083f30] font-medium">{booking.doctor.experience} experience</p>
            </div>
          </div>
        </div>

        {/* Package Includes */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Package Includes</h3>
          <div className="space-y-2">
            {booking.included.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={20} className="text-[#083f30]" />
            <h3 className="font-bold text-gray-900">Payment Summary</h3>
          </div>
          
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-semibold text-gray-900">${booking.price.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Deposit Paid</span>
              <span className="font-semibold text-green-600">-${booking.deposit.toLocaleString()}</span>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Remaining</span>
              <span className="text-xl font-bold text-[#083f30]">${booking.remaining.toLocaleString()}</span>
            </div>
          </div>

          <div className="px-3 py-2 bg-green-50 rounded-xl border border-green-200">
            <p className="text-xs text-green-700">
              <span className="font-semibold">✓ Paid:</span> Deposit of ${booking.deposit} paid on {booking.bookingDate}
            </p>
          </div>
        </div>

        {/* Contact Provider */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Contact Provider</h3>
          <div className="space-y-2">
            <a 
              href={`tel:${booking.contact.phone}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-[#083f30] rounded-full flex items-center justify-center">
                <Phone size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900">{booking.contact.phone}</p>
              </div>
            </a>
            
            <a 
              href={`mailto:${booking.contact.email}`}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-[#083f30] rounded-full flex items-center justify-center">
                <Mail size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{booking.contact.email}</p>
              </div>
            </a>
          </div>
        </div>

        {/* Booking Info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3">Booking Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Booking ID</span>
              <span className="font-semibold text-gray-900">{booking.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Confirmation Code</span>
              <span className="font-semibold text-gray-900">{booking.confirmationCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Booked On</span>
              <span className="font-semibold text-gray-900">{booking.bookingDate}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button className="w-full h-12 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#0a5a44] transition-colors flex items-center justify-center gap-2">
            <Download size={20} />
            Download Confirmation
          </button>
          
          <button 
            onClick={() => navigate('/app/support')}
            className="w-full h-12 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            Contact Support
          </button>
          
          <button 
            onClick={() => setShowCancelModal(true)}
            className="w-full h-12 border-2 border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors"
          >
            Cancel Booking
          </button>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl animate-scale-up">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle size={24} className="text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Cancel Booking?</h2>
                </div>
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to cancel this booking? This action cannot be undone.
              </p>
              
              {/* Booking Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Booking</p>
                <p className="font-bold text-gray-900 mb-2">{booking.service}</p>
                <p className="text-sm text-gray-600">{booking.date} at {booking.time}</p>
              </div>
              
              {/* Cancellation Policy Warning */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs text-red-700">
                  <span className="font-semibold">⚠️ Cancellation Policy:</span> Your deposit of ${booking.deposit} may not be refundable depending on the provider's cancellation policy.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 h-12 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={() => {
                  // In real app: API call to cancel booking
                  setShowCancelModal(false);
                  navigate('/app/bookings');
                }}
                className="flex-1 h-12 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors active:scale-95"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}