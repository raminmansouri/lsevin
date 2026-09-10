"use client"
import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { Building2, ArrowLeft, ArrowRight, Upload, MapPin, Phone, Mail, Award, Users, Stethoscope, Save } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ClinicOnboarding() {
  const t = useTranslations('ProviderOnboarding');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    facilityName: '',
    facilityType: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    departments: [] as string[],
    doctorsCount: '',
    servicesOffered: '',
    accreditation: '',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/provider/login')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft size={20} />
            <span className="font-medium">{t("backToProviderSelection")}</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">{t("providerType")}</div>
              <div className="font-bold text-gray-900">{t("clinicHospital")}</div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{t("step1Of4")}</span>
            <span className="text-sm text-gray-500">{t("basicInformation")}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full transition-all" style={{ width: '25%' }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("medicalFacilityRegistration")}</h1>
            <p className="text-gray-600 leading-relaxed">
              {t("pleaseProvideDetailedInformationAboutYourMedicalFacility")}
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-8">
            {/* Facility Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="text-blue-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("facilityInformation")}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("facilityName")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("eGIstanbulMedicalCenter")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.facilityName}
                    onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("facilityType")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    value={formData.facilityType}
                    onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                  >
                    <option value="">{t("selectFacilityType")}</option>
                    <option value="hospital">{t("hospital")}</option>
                    <option value="clinic">{t("clinic")}</option>
                    <option value="medical-center">{t("medicalCenter")}</option>
                    <option value="specialized-hospital">{t("specializedHospital")}</option>
                    <option value="day-surgery">{t("daySurgeryCenter")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("numberOfDoctors")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder={t("eG25")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.doctorsCount}
                    onChange={(e) => setFormData({ ...formData, doctorsCount: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <MapPin className="text-green-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("locationDetails")}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("country")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  >
                    <option value="">{t("selectCountry")}</option>
                    <option value="turkey">{t("turkey")}</option>
                    <option value="uae">{t("unitedArabEmirates")}</option>
                    <option value="cyprus">{t("cyprus")}</option>
                    <option value="indonesia">{t("indonesia")}</option>
                    <option value="thailand">{t("thailand")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("city")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("eGIstanbul")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("fullAddress")} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t("enterCompleteFacilityAddress")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent resize-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Phone className="text-purple-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("contactInformation")}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("phoneNumber")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder={t("n90212XxxXxxx")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("emailAddress")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder={t("contactFacilityCom")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("websiteUrlOptional")}
                  </label>
                  <input
                    type="url"
                    placeholder={t("httpsWwwFacilityCom")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Departments & Services */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Stethoscope className="text-indigo-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("departmentsSpecialties")}</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("mainDepartments")} <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-3">{t("selectAllDepartmentsAvailableAtYourFacility")}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['Cardiology', 'Dermatology', 'Dentistry', 'Orthopedics', 'Neurology', 'Ophthalmology', 'Plastic Surgery', 'Urology', 'Gynecology'].map((dept) => (
                      <label key={dept} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                        />
                        <span className="text-sm text-gray-700">{dept}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("servicesTreatmentsOffered")}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={t("describeTheMainServicesAndTreatmentsYourFacility")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent resize-none"
                    value={formData.servicesOffered}
                    onChange={(e) => setFormData({ ...formData, servicesOffered: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Licensing & Accreditation */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Award className="text-amber-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("licensingAccreditation")}</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("uploadMedicalLicense")} <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700 mb-1">{t("clickToUploadOrDragAndDrop")}</p>
                    <p className="text-xs text-gray-500">{t("pdfJpgOrPngMax10mb")}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("accreditationCertifications")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("eGJciAccreditedIso9001Certified")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.accreditation}
                    onChange={(e) => setFormData({ ...formData, accreditation: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
