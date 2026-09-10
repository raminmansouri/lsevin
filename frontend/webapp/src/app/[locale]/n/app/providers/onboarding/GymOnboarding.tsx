"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { Dumbbell, ArrowLeft, ArrowRight, Upload, MapPin, Phone, Mail, Save, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function GymOnboarding() {
  const t = useTranslations('ProviderOnboarding');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/provider/login')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
            <ArrowLeft size={20} />
            <span className="font-medium">{t("back")}</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
              <Dumbbell className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">{t("providerType")}</div>
              <div className="font-bold text-gray-900">{t("gymFitnessCenter")}</div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{t("step1Of3")}</span>
            <span className="text-sm text-gray-500">{t("facilityProfile")}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full" style={{ width: '33%' }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("fitnessFacilityRegistration")}</h1>
            <p className="text-gray-600 leading-relaxed">
              {t("registerYourGymOrFitnessServicesToReach")}
            </p>
          </div>

          <div className="p-8 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Dumbbell className="text-orange-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("facilityInformation")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("facilityTrainerName")} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder={t("eGPowerfitGym")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("businessType")} <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                    <option value="">{t("selectType")}</option>
                    <option value="gym">{t("gymFitnessCenter")}</option>
                    <option value="personal-trainer">{t("personalTrainer")}</option>
                    <option value="yoga-studio">{t("yogaStudio")}</option>
                    <option value="crossfit">{t("crossfitBox")}</option>
                    <option value="pilates">{t("pilatesStudio")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("numberOfTrainers")}</label>
                  <input type="number" placeholder={t("eG12")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Clock className="text-blue-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("trainingPrograms")}</h2>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">{t("selectProgramsAndServicesOffered")}</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Strength Training', 'Cardio Programs', 'HIIT Classes', 'Personal Training', 'Group Classes', 'Yoga & Pilates', 'Nutrition Coaching', 'Recovery & Rehab', 'Online Training'].map((prog) => (
                    <label key={prog} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]" />
                      <span className="text-sm text-gray-700">{prog}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <MapPin className="text-green-600" size={20} />
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
                    <option value="thailand">{t("thailand")}</option>
                    <option value="indonesia">{t("indonesia")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("city")} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder={t("eGBangkok")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Phone className="text-purple-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("contactHours")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("phone")} <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder={t("n662XxxXxxx")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("email")} <span className="text-red-500">*</span></label>
                  <input type="email" placeholder={t("infoGymCom")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("operatingHours")}</label>
                  <input type="text" placeholder={t("eGMonFri6am10pmSatSun")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Upload className="text-amber-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("documentsPhotos")}</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("facilityPhotos")}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700 mb-1">{t("uploadFacilityPhotos")}</p>
                    <p className="text-xs text-gray-500">{t("jpgOrPngUpTo10Photos")}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("businessLicense")} <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={28} />
                    <p className="text-sm font-semibold text-gray-700">{t("uploadLicenseCertification")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-8 border-t border-gray-200 flex items-center justify-between">
            <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 font-semibold hover:bg-white transition">
              <Save size={18} />
              {t("saveAsDraft")}
            </button>
            <button className="flex items-center gap-2 px-8 py-3 bg-[#083f30] text-white rounded-xl font-semibold hover:bg-[#083f30]/90 shadow-lg transition">
              {t("continue")}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
