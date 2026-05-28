"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { ArrowLeft, Camera, Save } from 'lucide-react';

export default function EditProfile() {
  const navigate = useNavigate();
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
            <h1 className="text-lg font-bold text-gray-900">Edit Profile</h1>
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
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-0 right-0 w-9 h-9 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg hover:bg-[#0a5a44] transition-colors">
              <Camera size={16} className="text-white" />
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">Change profile photo</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-5 space-y-5">
          {/* First Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              First Name
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Last Name
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
              Email Address
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
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
<<<<<<< HEAD
              readOnly
              disabled
              className="w-full h-12 px-4 border border-gray-200 rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed"
            />
            <p className="mt-2 text-xs text-gray-500">
              Mobile number is the base account identity and cannot be changed from profile.
            </p>
=======
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Gender
            </label>
            <select
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors bg-white"
            >
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* City */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="w-full h-12 px-4 border border-gray-300 rounded-xl focus:border-[#083f30] focus:outline-none transition-colors"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Country
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
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
