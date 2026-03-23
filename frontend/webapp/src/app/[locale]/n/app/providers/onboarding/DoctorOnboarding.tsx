"use client"

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { User, ArrowLeft, ArrowRight, Upload, Award, Calendar, MapPin, Phone, Mail, Save, Building2, Clock } from 'lucide-react';

export default function DoctorOnboarding() {
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
            <span className="font-medium">Back to Provider Selection</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Provider Type</div>
              <div className="font-bold text-gray-900">Doctor / Specialist</div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Step 1 of 3</span>
            <span className="text-sm text-gray-500">Professional Profile</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full transition-all" style={{ width: '33%' }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Medical Professional Registration</h1>
            <p className="text-gray-600 leading-relaxed">
              Create your professional profile to connect with patients seeking your expertise. 
              Your credentials and experience help build trust with potential patients.
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
                <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name (as per medical license) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. [First Name] [Last Name]"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Primary Specialty <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  >
                    <option value="">Select specialty</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="dermatology">Dermatology</option>
                    <option value="dentistry">Dentistry</option>
                    <option value="orthopedics">Orthopedics</option>
                    <option value="neurology">Neurology</option>
                    <option value="plastic-surgery">Plastic Surgery</option>
                    <option value="ophthalmology">Ophthalmology</option>
                    <option value="general-practice">General Practice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sub-Specialty (if applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Interventional Cardiology"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.subSpecialty}
                    onChange={(e) => setFormData({ ...formData, subSpecialty: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Experience <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 15"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Consultation Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    value={formData.consultationType}
                    onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                  >
                    <option value="">Select type</option>
                    <option value="in-person">In-Person Only</option>
                    <option value="online">Online Only</option>
                    <option value="both">Both In-Person & Online</option>
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
                <h2 className="text-xl font-bold text-gray-900">Practice Location</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Affiliated Clinic / Hospital
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dubai Medical Center"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.affiliatedClinic}
                    onChange={(e) => setFormData({ ...formData, affiliatedClinic: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-2">Leave blank if you practice independently</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  >
                    <option value="">Select country</option>
                    <option value="turkey">Turkey</option>
                    <option value="uae">United Arab Emirates</option>
                    <option value="cyprus">Cyprus</option>
                    <option value="indonesia">Indonesia</option>
                    <option value="thailand">Thailand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Dubai"
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
                <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+971 50 xxx xxxx"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="doctor@example.com"
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
                <h2 className="text-xl font-bold text-gray-900">Schedule & Availability</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Typical Availability <span className="text-red-500">*</span>
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
                <h2 className="text-xl font-bold text-gray-900">Medical Credentials</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Medical License <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Upload Professional ID / Passport <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#083f30] transition cursor-pointer">
                    <Upload className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload identity document</p>
                    <p className="text-xs text-gray-500">PDF, JPG, or PNG (max 10MB)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Certifications & Board Memberships
                  </label>
                  <textarea
                    rows={4}
                    placeholder="List your board certifications, fellowships, and professional memberships..."
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
