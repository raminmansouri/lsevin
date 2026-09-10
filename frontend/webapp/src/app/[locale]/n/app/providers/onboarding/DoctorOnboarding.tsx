"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { User, ArrowLeft, ArrowRight, Upload, Award, Calendar, MapPin, Phone, Mail, Save, Building2, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function DoctorOnboarding() {
  const t = useTranslations('ProviderOnboarding');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    specialty: '',
    subSpecialty: '',
    consultationType: '',
    yearsOfExperience: '',
    affiliatedClinic: '',
    country: '',
    city: '',
    phone: '',
    email: '',
    certifications: '',
    availability: '',
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
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">{t("providerType")}</div>
              <div className="font-bold text-gray-900">{t("doctorSpecialist")}</div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{t("step1Of3")}</span>
            <span className="text-sm text-gray-500">{t("professionalProfile")}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full transition-all" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("medicalProfessionalRegistration")}</h1>
            <p className="text-gray-600 leading-relaxed">
              {t("createYourProfessionalProfileToConnectWithPatients")}
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-8">
            {/* Personal Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <User className="text-purple-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("personalInformation")}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("fullNameAsPerMedicalLicense")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder={t("drFirstNameLastName")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("primarySpecialty")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  >
                    <option value="">{t("selectSpecialty")}</option>
                    <option value="cardiology">{t("cardiology")}</option>
                    <option value="dermatology">{t("dermatology")}</option>
                    <option value="dentistry">{t("dentistry")}</option>
                    <option value="orthopedics">{t("orthopedics")}</option>
                    <option value="neurology">{t("neurology")}</option>
                    <option value="plastic-surgery">{t("plasticSurgery")}</option>
                    <option value="ophthalmology">{t("ophthalmology")}</option>
                    <option value="general-practice">{t("generalPractice")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("subSpecialtyIfApplicable")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("eGInterventionalCardiology")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.subSpecialty}
                    onChange={(e) => setFormData({ ...formData, subSpecialty: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("yearsOfExperience")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder={t("eG15")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("consultationType")} <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    value={formData.consultationType}
                    onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                  >
                    <option value="">{t("selectType")}</option>
                    <option value="in-person">{t("inPersonOnly")}</option>
                    <option value="online">{t("onlineOnly")}</option>
                    <option value="both">{t("bothInPersonOnline")}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Practice Information */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Building2 className="text-blue-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("practiceLocation")}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("affiliatedClinicHospital")}
                  </label>
                  <input
                    type="text"
                    placeholder={t("eGDubaiMedicalCenter")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.affiliatedClinic}
                    onChange={(e) => setFormData({ ...formData, affiliatedClinic: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-2">{t("leaveBlankIfYouPracticeIndependently")}</p>
                </div>

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
                    placeholder={t("eGDubai")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Phone className="text-green-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("contactDetails")}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("phoneNumber")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder={t("n97150XxxXxxx")}
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
                    placeholder={t("doctorExampleCom")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Availability */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                  <Clock className="text-indigo-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("scheduleAvailability")}</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t("typicalAvailability")} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Weekday Mornings', 'Weekday Afternoons', 'Weekday Evenings', 'Weekend Mornings', 'Weekend Afternoons', 'Flexible / By Appointment'].map((time) => (
                      <label key={time} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]"
                        />
                        <span className="text-sm text-gray-700">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Award className="text-amber-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("medicalCredentials")}</h2>
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
                    {t("uploadProfessionalIdPassport")} <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700 mb-1">{t("clickToUploadIdentityDocument")}</p>
                    <p className="text-xs text-gray-500">{t("pdfJpgOrPngMax10mb")}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("certificationsBoardMemberships")}
                  </label>
                  <textarea
                    rows={4}
                    placeholder={t("listYourBoardCertificationsFellowshipsAndProfessionalMemberships")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent resize-none"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
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
