"use client"

import { useNavigate } from '@/hooks/use-navigate';
import { Plane, ArrowLeft, ArrowRight, Upload, MapPin, Phone, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function TourismOnboarding() {
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
            <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center">
              <Plane className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">{t("providerType")}</div>
              <div className="font-bold text-gray-900">{t("tourismProvider")}</div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{t("step1Of3")}</span>
            <span className="text-sm text-gray-500">{t("serviceProfile")}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full" style={{ width: '33%' }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-50 to-sky-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("tourismServicesRegistration")}</h1>
            <p className="text-gray-600 leading-relaxed">
              {t("registerYourTourismOperationsToConnectWithTravelers")}
            </p>
          </div>

          <div className="p-8 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                  <Plane className="text-cyan-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("providerInformation")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("providerName")} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder={t("eGBaliAdventuresTours")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("serviceType")} <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                    <option value="">{t("selectServiceType")}</option>
                    <option value="tours">{t("tourOperator")}</option>
                    <option value="transfers">{t("airportCityTransfers")}</option>
                    <option value="experiences">{t("localExperiences")}</option>
                    <option value="adventure">{t("adventureActivities")}</option>
                    <option value="cruise">{t("cruiseServices")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("fleetSize")}</label>
                  <input type="number" placeholder={t("numberOfVehiclesBoats")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <MapPin className="text-blue-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("operatingDestinations")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("primaryCountry")} <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                    <option value="">{t("selectCountry")}</option>
                    <option value="turkey">{t("turkey")}</option>
                    <option value="uae">{t("uae")}</option>
                    <option value="indonesia">{t("indonesia")}</option>
                    <option value="thailand">{t("thailand")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("mainCitiesServed")} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder={t("eGUbudCangguSeminyak")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t("tourServiceCategories")}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['City Tours', 'Cultural Tours', 'Adventure Tours', 'Beach Activities', 'Airport Transfer', 'Private Tours', 'Group Tours', 'Day Trips', 'Multi-Day Packages'].map((cat) => (
                      <label key={cat} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]" />
                        <span className="text-sm text-gray-700">{cat}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                  <input type="tel" placeholder={t("n62361XxxXxxx")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("email")} <span className="text-red-500">*</span></label>
                  <input type="email" placeholder={t("infoToursCom")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Upload className="text-amber-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("licensesPermits")}</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("tourOperatorLicense")} <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700">{t("uploadTourOperatorLicense")}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("insuranceDocuments")}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={28} />
                    <p className="text-sm font-semibold text-gray-700">{t("uploadInsuranceProof")}</p>
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
