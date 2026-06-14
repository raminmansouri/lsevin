"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { Scissors, ArrowLeft, ArrowRight, Upload, MapPin, Phone, Mail, Save, Users, Sparkles } from 'lucide-react';

export default function SalonOnboarding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/provider/login')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
            <span className="font-medium">Back to Provider Selection</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
              <Scissors className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Provider Type</div>
              <div className="font-bold text-gray-900">Beauty Salon / Spa</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Step 1 of 3</span>
            <span className="text-sm text-gray-500">Business Profile</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Beauty & Wellness Business Registration</h1>
            <p className="text-gray-600 leading-relaxed">
              Showcase your beauty and wellness services to clients seeking premium treatments. Create an elegant profile that reflects your brand's quality.
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Business Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-pink-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Business Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g., Serenity Spa & Wellness" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business Type <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                    <option value="">Select type</option>
                    <option value="beauty-salon">Beauty Salon</option>
                    <option value="spa">Day Spa</option>
                    <option value="wellness-center">Wellness Center</option>
                    <option value="nail-studio">Nail Studio</option>
                    <option value="barbershop">Barbershop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Staff <span className="text-red-500">*</span></label>
                  <input type="number" placeholder="e.g., 8" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            {/* Services Offered */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Scissors className="text-purple-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Services Offered</h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Select all services you provide</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Hair Styling', 'Hair Color', 'Manicure & Pedicure', 'Facial Treatments', 'Massage Therapy', 'Body Treatments', 'Makeup Services', 'Waxing & Threading', 'Eyelash Extensions'].map((service) => (
                    <label key={service} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]" />
                      <span className="text-sm text-gray-700">{service}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <MapPin className="text-indigo-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Location</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                    <option value="">Select country</option>
                    <option value="turkey">Turkey</option>
                    <option value="uae">UAE</option>
                    <option value="cyprus">Cyprus</option>
                    <option value="indonesia">Indonesia</option>
                    <option value="thailand">Thailand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="e.g., Dubai" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Address <span className="text-red-500">*</span></label>
                  <textarea rows={3} placeholder="Enter complete address" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] resize-none" />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="text-green-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder="+971 4 xxx xxxx" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="contact@salon.com" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            {/* Gallery Upload */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Upload className="text-amber-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Visual Gallery</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Salon Photos</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Upload photos of your salon/spa</p>
                    <p className="text-xs text-gray-500">JPG or PNG (max 10MB each, up to 10 photos)</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Business License <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={28} />
                    <p className="text-sm font-semibold text-gray-700">Upload business license</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-8 border-t border-gray-200 flex items-center justify-between">
            <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-white transition">
              <Save size={18} />
              Save as Draft
            </button>
            <button className="flex items-center gap-2 px-8 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#083f30]/90 shadow-lg transition">
              Continue to Next Step
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
