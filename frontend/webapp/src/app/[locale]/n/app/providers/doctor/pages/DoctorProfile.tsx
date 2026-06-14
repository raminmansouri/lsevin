"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  Upload, Award, Briefcase, MapPin, Languages, GraduationCap, FileText, CheckCircle
} from 'lucide-react';

export default function DoctorProfile() {
  const t = useTranslations("ProviderDoctorProfile");
  const [profileCompletion, setProfileCompletion] = useState(85);

  const navigation = [
    { label: t('navigation.dashboard'), icon: <LayoutDashboard size={20} />, path: '/provider/doctor/dashboard' },
    { label: t('navigation.mySchedule'), icon: <Calendar size={20} />, path: '/provider/doctor/schedule', badge: 3 },
    { label: t('navigation.consultations'), icon: <MessageSquare size={20} />, path: '/provider/doctor/consultations' },
    { label: t('navigation.bookings'), icon: <Calendar size={20} />, path: '/provider/doctor/bookings' },
    { label: t('navigation.myServices'), icon: <Stethoscope size={20} />, path: '/provider/doctor/services' },
    { label: t('navigation.profile'), icon: <User size={20} />, path: '/provider/doctor/profile' },
    { label: t('navigation.earnings'), icon: <DollarSign size={20} />, path: '/provider/doctor/earnings' },
    { label: t('navigation.reviews'), icon: <Star size={20} />, path: '/provider/doctor/reviews' },
    { label: t('navigation.settings'), icon: <Settings size={20} />, path: '/provider/doctor/settings' },
  ];

  const certifications = [
    { id: 1, name: t('certifications.sample.cardiology.name'), issuer: t('certifications.sample.cardiology.issuer'), year: 2018, file: 'cert_cardiology.pdf' },
    { id: 2, name: t('certifications.sample.uaeLicense.name'), issuer: t('certifications.sample.uaeLicense.issuer'), year: 2020, file: 'license_uae.pdf' },
    { id: 3, name: t('certifications.sample.acls.name'), issuer: t('certifications.sample.acls.issuer'), year: 2023, file: 'acls_cert.pdf' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle={t("headerTitle")}
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName={t("providerName")}
    >
      {/* {t("completion.title")} */}
      <div className="bg-gradient-to-r from-[#083f30] to-[#0a5a44] rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">{t("completion.title")}</h3>
            <p className="text-sm text-white/80 mt-1">{t("completion.description")}</p>
          </div>
          <div className="text-4xl font-bold">{profileCompletion}%</div>
        </div>
        
        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#eacb7f] rounded-full transition-all duration-300"
            style={{ width: `${profileCompletion}%` }}
          />
        </div>

        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{t("completion.basicInfoComplete")}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{t("completion.certificationsUploaded")}</span>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <CheckCircle size={16} />
            <span>{t("completion.addBiography")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="col-span-2 space-y-6">
          {/* {t("basicInformation.title")} */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">{t("basicInformation.title")}</h3>
            
            <div className="flex items-start gap-6 mb-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#083f30] flex items-center justify-center text-white text-3xl font-bold">
                  SW
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition">
                  <Upload size={14} className="text-gray-600" />
                </button>
              </div>
              
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.firstName")}</label>
                    <input
                      type="text"
                      defaultValue="Sarah"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.lastName")}</label>
                    <input
                      type="text"
                      defaultValue="Williams"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.professionalTitle")}</label>
                  <input
                    type="text"
                    defaultValue="Cardiologist, MD, FACC"
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.primarySpecialty")}</label>
                <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                  <option>{t("specialties.cardiology")}</option>
                  <option>{t("specialties.internalMedicine")}</option>
                  <option>{t("specialties.generalMedicine")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("fields.subSpecialty")}</label>
                <input
                  type="text"
                  defaultValue={t("specialties.interventionalCardiology")}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* {t("experienceEducation.title")} */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">{t("experienceEducation.title")}</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase size={16} />
                    {t("fields.yearsOfExperience")}
                  </label>
                  <input
                    type="number"
                    defaultValue="15"
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Languages size={16} />
                    {t("fields.languagesSpoken")}
                  </label>
                  <input
                    type="text"
                    defaultValue="English, Arabic, French"
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <GraduationCap size={16} />
                  {t("fields.medicalSchool")}
                </label>
                <input
                  type="text"
                  defaultValue="Johns Hopkins University School of Medicine"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin size={16} />
                  {t("fields.affiliatedClinics")}
                </label>
                <textarea
                  defaultValue="Prime Medical Center, Dubai&#10;City Hospital, Abu Dhabi&#10;Elite Healthcare Clinic, Sharjah"
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">{t("biography.title")}</h3>
            
            <textarea
              defaultValue="Dr. Sarah Williams is a board-certified cardiologist with over 15 years of experience in interventional cardiology. She specializes in advanced cardiac procedures and preventive cardiovascular care. Dr. Williams completed her medical degree at Johns Hopkins University and her fellowship in interventional cardiology at Mayo Clinic.&#10;&#10;She is passionate about patient-centered care and uses the latest evidence-based treatments to help her patients achieve optimal heart health."
              rows={8}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              placeholder={t("biography.placeholder")}
            />
            
            <div className="text-xs text-gray-500 mt-2">
              {t("biography.visibilityNote")}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* {t("certifications.title")} */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Award size={20} className="text-[#083f30]" />
                {t("certifications.title")}
              </h3>
              <button className="text-sm text-[#083f30] font-medium hover:underline">
                {t("certifications.addNew")}
              </button>
            </div>

            <div className="space-y-3">
              {certifications.map(cert => (
                <div key={cert.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">{cert.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{cert.issuer}</div>
                    </div>
                    <div className="text-xs font-semibold text-gray-500">{cert.year}</div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600 hover:underline cursor-pointer">
                    <FileText size={12} />
                    {cert.file}
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-4 h-9 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:border-[#083f30] hover:text-[#083f30] transition flex items-center justify-center gap-2">
              <Upload size={16} />
              {t("certifications.uploadCertificate")}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">{t("stats.title")}</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("stats.profileViews")}</span>
                <span className="text-lg font-bold text-gray-900">1,248</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("stats.totalPatients")}</span>
                <span className="text-lg font-bold text-gray-900">342</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("stats.averageRating")}</span>
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-bold text-gray-900">4.9</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t("stats.responseTime")}</span>
                <span className="text-lg font-bold text-green-600">{t("stats.responseTimeValue")}</span>
              </div>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle size={24} className="text-white" />
              </div>
              <div>
                <div className="font-semibold text-blue-900">{t("verification.title")}</div>
                <div className="text-xs text-blue-700">{t("verification.subtitle")}</div>
              </div>
            </div>
            <p className="text-sm text-blue-800">
              {t("verification.description")}
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end gap-3">
        <button className="h-10 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
          {t("buttons.cancel")}
        </button>
        <button className="h-10 px-6 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
          {t("buttons.saveChanges")}
        </button>
      </div>
    </DashboardLayout>
  );
}
