"use client"

import { useNavigate } from '@/hooks/use-navigate';
import { GraduationCap, ArrowLeft, ArrowRight, Upload, MapPin, Phone, Save, Award } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function EducationOnboarding() {
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
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">{t("providerType")}</div>
              <div className="font-bold text-gray-900">{t("educationProvider")}</div>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{t("step1Of3")}</span>
            <span className="text-sm text-gray-500">{t("institutionProfile")}</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full" style={{ width: '33%' }} />
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t("educationalInstitutionRegistration")}</h1>
            <p className="text-gray-600 leading-relaxed">
              {t("registerYourEducationalInstitutionToOfferCoursesAnd")}
            </p>
          </div>

          <div className="p-8 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                  <GraduationCap className="text-amber-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("institutionInformation")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("institutionName")} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder={t("eGGlobalLearningAcademy")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("institutionType")} <span className="text-red-500">*</span></label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                    <option value="">{t("selectType")}</option>
                    <option value="university">{t("university")}</option>
                    <option value="college">{t("college")}</option>
                    <option value="training-center">{t("trainingCenter")}</option>
                    <option value="language-school">{t("languageSchool")}</option>
                    <option value="vocational">{t("vocationalSchool")}</option>
                    <option value="online">{t("onlineLearningPlatform")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("numberOfInstructors")}</label>
                  <input type="number" placeholder={t("eG45")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Award className="text-blue-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("coursesPrograms")}</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t("courseCategoriesOffered")}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['Medical Training', 'Language Courses', 'Business & Finance', 'IT & Technology', 'Arts & Design', 'Health & Wellness', 'Professional Certifications', 'Skills Development', 'Academic Programs'].map((course) => (
                      <label key={course} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 text-[#083f30] border-gray-300 rounded focus:ring-[#083f30]" />
                        <span className="text-sm text-gray-700">{course}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t("deliveryMode")} <span className="text-red-500">*</span></label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                      <option value="">{t("selectMode")}</option>
                      <option value="in-person">{t("inPersonOnly")}</option>
                      <option value="online">{t("onlineOnly")}</option>
                      <option value="hybrid">{t("hybridBoth")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">{t("certificationsOffered")}</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] appearance-none bg-white">
                      <option value="none">{t("noCertification")}</option>
                      <option value="institution">{t("institutionCertificate")}</option>
                      <option value="accredited">{t("accreditedCertificate")}</option>
                      <option value="degree">{t("degreePrograms")}</option>
                    </select>
                  </div>
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
                    <option value="cyprus">{t("cyprus")}</option>
                    <option value="uk">{t("unitedKingdom")}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("city")} <span className="text-red-500">*</span></label>
                  <input type="text" placeholder={t("eGLondon")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("campusAddress")}</label>
                  <textarea rows={3} placeholder={t("enterCampusAddressIfApplicable")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] resize-none" />
                  <p className="text-xs text-gray-500 mt-2">{t("leaveBlankIfOnlineOnlyInstitution")}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Phone className="text-purple-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("contactInformation")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("phone")} <span className="text-red-500">*</span></label>
                  <input type="tel" placeholder={t("n4420XxxxXxxx")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("email")} <span className="text-red-500">*</span></label>
                  <input type="email" placeholder={t("admissionsInstitutionCom")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("websiteUrl")}</label>
                  <input type="url" placeholder={t("httpsWwwInstitutionCom")} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Upload className="text-red-600" size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{t("accreditationDocuments")}</h2>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("educationalLicense")} <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700">{t("uploadEducationalLicense")}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t("accreditationDocuments2")}</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-2" size={28} />
                    <p className="text-sm font-semibold text-gray-700">{t("uploadAccreditationCertificates")}</p>
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
