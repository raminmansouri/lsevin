import { BadgeCheck, Building, Calendar, CheckCircle2, Clock, CreditCard, FileText, Headphones, Info, Plus, Shield, Smartphone, Star } from "lucide-react";
import { useBookingStore } from "../store/BookingStore";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { BookingFormValues, bookingSchema } from "../../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useBooking } from "../../hooks/use-booking";



export const ReviewPay=()=>{
 const [promoCode, setPromoCode] = useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'EUR' | 'GBP'>('USD');


  const {
    setValue,
    calculateTotal,
        addons,
        selectedAddons,
        services,
        providers,
        specialists,
        selectedDate,
        selectedTime,
        uploadedFiles,
        service,
        provider,
        selectedSpecialist,
        providerId,
        serviceId,
        specialistId,
        paymentMethod,
    } = useBooking();
  
    
      
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
                src={service?.image}
                alt={service?.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 mb-1 text-sm">{service?.name}</h4>
                <p className="text-xs text-gray-600 mb-2">{service?.provider}</p>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#083f30] text-white rounded-md text-xs font-semibold">
                    {service?.accreditation}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-semibold text-gray-900">{service?.rating}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-900">${service?.price}</div>
              </div>
            </div>

            {/* Selected Doctor */}
            <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-center gap-3">
                <img
                  src={specialists.find(d => d.id === specialistId)?.image}
                  alt={specialists.find(d => d.id === specialistId)?.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-sm">
                    {specialists.find(d => d.id === specialistId)?.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {specialists.find(d => d.id === specialistId)?.specialty}
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
                {selectedAddons.map(_addOn => {
                  const addonId=_addOn.id;
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

            {uploadedFiles?.length > 0 ? (
              <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-green-600" />
                    <span className="font-semibold text-green-900 text-sm">
                      {uploadedFiles?.length} document{uploadedFiles?.length > 1 ? 's' : ''} uploaded
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  {uploadedFiles?.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-green-800">
                      <div className="w-1 h-1 bg-green-600 rounded-full" />
                      <span className="capitalize">{file.description} records</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="flex items-center gap-2">
                  <Info  size={18} className="text-amber-600" />
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
                <span className="font-semibold text-gray-900">${service?.price}</span>
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
              onClick={() => setValue('paymentMethod',method.id)}
              className={`w-full bg-white rounded-xl p-4 border-2 transition-all flex items-center gap-4 ${paymentMethod === method.id
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
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id
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