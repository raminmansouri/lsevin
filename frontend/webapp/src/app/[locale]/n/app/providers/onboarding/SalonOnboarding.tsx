"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { Scissors, ArrowLeft, ArrowRight, Upload, MapPin, Phone, Mail, Save, Users, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function SalonOnboarding() {
  const t = useTranslations('ProviderOnboarding');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/provider/login')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
            <span className="font-medium">{t("backToProviderSelection")}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
              <Scissors className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">{t("providerType")}</div>
              <div className="font-bold text-gray-900">{t("beautySalonSpa")}</div>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{t("step1Of3")}</span>
            <span className="text-sm text-gray-500">{t("businessProfile")}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("beautyWellnessBusinessRegistration")}</h1>
            <p className="text-gray-600 leading-relaxed">
              {t("showcaseYourBeautyAndWellnessServicesToClients")}
            </p>
          </div>

          <div className="p-8 space-y-8">
            {/* Business Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                  <Sparkles className="text-pink-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("businessInformation")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("businessName")} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder={t("eGSerenitySpaWellness")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("businessType")} <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                    <option value="">{t("selectType")}</option>
                    <option value="beauty-salon">{t("beautySalon")}</option>
                    <option value="spa">{t("daySpa")}</option>
                    <option value="wellness-center">{t("wellnessCenter")}</option>
                    <option value="nail-studio">{t("nailStudio")}</option>
                    <option value="barbershop">{t("barbershop")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("numberOfStaff")} <span className="text-red-500">*</span></label>
                  <input type="number" placeholder={t("eG8")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            {/* Services Offered */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Scissors className="text-purple-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("servicesOffered")}</h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">{t("selectAllServicesYouProvide")}</label>
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
                <h2 className="text-xl font-bold text-gray-900">{t("location")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("country")} <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                    <option value="">{t("selectCountry")}</option>
                    <option value="turkey">{t("turkey")}</option>
                    <option value="uae">{t("uae")}</option>
                    <option value="cyprus">{t("cyprus")}</option>
                    <option value="indonesia">{t("indonesia")}</option>
                    <option value="thailand">{t("thailand")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("city")} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder={t("eGDubai")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("fullAddress")} <span className="text-red-500">*</span></label>
                  <textarea rows={3} placeholder={t("enterCompleteAddress")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] resize-none" />
                </div>
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="text-green-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("contactInformation")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("phone")} <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder={t("n9714XxxXxxx")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("email")} <span className="text-red-500">*</span></label>
                  <input type="email" placeholder={t("contactSalonCom")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            {/* Gallery Upload */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Upload className="text-amber-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("visualGallery")}</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("uploadSalonPhotos")}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700 mb-1">{t("uploadPhotosOfYourSalonSpa")}</p>
                    <p className="text-xs text-gray-500">{t("jpgOrPngMax10mbEachUpTo")}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("businessLicense")} <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={28} />
                    <p className="text-sm font-semibold text-gray-700">{t("uploadBusinessLicense")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-8 border-t border-gray-200 flex items-center justify-between">
            <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-white transition">
              <Save size={18} />
              {t("saveAsDraft")}
            </button>
            <button className="flex items-center gap-2 px-8 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#083f30]/90 shadow-lg transition">
              {t("continueToNextStep")}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
