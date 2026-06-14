"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useNavigate } from '@/hooks/use-navigate';
import { ArrowLeft, Camera, Save } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
  const t = useTranslations("MobileProfile.editProfile");
  const [formData, setFormData] = useState({
    firstName: 'Sarah',
    lastName: 'Anderson',
    email: 'sarah.anderson@email.com',
    phone: '+1 (555) 123-4567',
    dateOfBirth: '1992-03-15',
    gender: 'female',
    address: '123 Main Street, Apt 4B',
    city: 'New York',
    country: 'United States',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{t("title")}</h1>
          </div>
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Profile Photo */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden">
              <img 
                src="/unsplash_images/photo-1494790108377-be9c29b29330__w=200&h=200&fit=crop.jpg" 
                alt={t("profileAlt")}
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-9 h-9 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0a5a44] transition-colors">
              <Camera size={16} className="text-white" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">{t("changeProfilePhoto")}</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-5 space-y-5">
          {/* {t("fields.firstName")} */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.firstName")}
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* {t("fields.lastName")} */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.lastName")}
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.email")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.phone")}
            </label>
            <input
              type="tel"
              value={formData.phone}
              readOnly
              disabled
              className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-gray-500">
              {t("phoneLockedDescription")}
            </p>
          </div>

          {/* {t("fields.dateOfBirth")} */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.dateOfBirth")}
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* {t("fields.gender")} */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.gender")}
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors bg-white"
            >
              <option value="female">{t("gender.female")}</option>
              <option value="male">{t("gender.male")}</option>
              <option value="other">{t("gender.other")}</option>
              <option value="prefer-not-to-say">{t("gender.preferNotToSay")}</option>
            </select>
          </div>

          {/* {t("fields.address")} */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.address")}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* {t("fields.city")} */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.city")}
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* {t("fields.country")} */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              {t("fields.country")}
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => handleInputChange('country', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t("saving")}</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>{t("saveChanges")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
