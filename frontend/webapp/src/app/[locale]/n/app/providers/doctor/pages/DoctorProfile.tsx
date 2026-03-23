"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  Upload, Award, Briefcase, MapPin, Languages, GraduationCap, FileText, CheckCircle
} from 'lucide-react';

export default function DoctorProfile() {
  const [profileCompletion, setProfileCompletion] = useState(85);

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/doctor/dashboard' },
    { label: 'My Schedule', icon: <Calendar size={20} />, path: '/provider/doctor/schedule', badge: 3 },
    { label: 'Consultations', icon: <MessageSquare size={20} />, path: '/provider/doctor/consultations' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/doctor/bookings' },
    { label: 'My Services', icon: <Stethoscope size={20} />, path: '/provider/doctor/services' },
    { label: 'Profile', icon: <User size={20} />, path: '/provider/doctor/profile' },
    { label: 'Earnings', icon: <DollarSign size={20} />, path: '/provider/doctor/earnings' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/doctor/reviews' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/doctor/settings' },
  ];

  const certifications = [
    { id: 1, name: 'Board Certification - Cardiology', issuer: 'American Board of Internal Medicine', year: 2018, file: 'cert_cardiology.pdf' },
    { id: 2, name: 'Medical License - UAE', issuer: 'Dubai Health Authority', year: 2020, file: 'license_uae.pdf' },
    { id: 3, name: 'Advanced Cardiac Life Support', issuer: 'American Heart Association', year: 2023, file: 'acls_cert.pdf' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Professional Profile"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
      {/* Profile Completion */}
      <div className="bg-gradient-to-r from-[#083f30] to-[#0a5a44] rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Profile Completion</h3>
            <p className="text-sm text-white/80 mt-1">Complete your profile to increase visibility</p>
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
            <span>Basic Info Complete</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>Certifications Uploaded</span>
          </div>
          <div className="flex items-center gap-2 opacity-50">
            <CheckCircle size={16} />
            <span>Add Biography</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main Profile Section */}
        <div className="col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Basic Information</h3>
            
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue="Sarah"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Williams"
                      className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Professional Title</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Specialty</label>
                <select className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
                  <option>Cardiology</option>
                  <option>Internal Medicine</option>
                  <option>General Medicine</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub-Specialty</label>
                <input
                  type="text"
                  defaultValue="Interventional Cardiology"
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Experience & Education */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-6">Experience & Education</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Briefcase size={16} />
                    Years of Experience
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
                    Languages Spoken
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
                  Medical School
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
                  Affiliated Clinics/Hospitals
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
            <h3 className="font-semibold text-gray-900 mb-6">Professional Biography</h3>
            
            <textarea
              defaultValue="Dr. Sarah Williams is a board-certified cardiologist with over 15 years of experience in interventional cardiology. She specializes in advanced cardiac procedures and preventive cardiovascular care. Dr. Williams completed her medical degree at Johns Hopkins University and her fellowship in interventional cardiology at Mayo Clinic.&#10;&#10;She is passionate about patient-centered care and uses the latest evidence-based treatments to help her patients achieve optimal heart health."
              rows={8}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              placeholder="Share your professional background, expertise, and approach to patient care..."
            />
            
            <div className="text-xs text-gray-500 mt-2">
              This will be visible to patients on your public profile
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Certifications */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Award size={20} className="text-[#083f30]" />
                Certifications
              </h3>
              <button className="text-sm text-[#083f30] font-medium hover:underline">
                Add New
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
              Upload Certificate
            </button>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Profile Stats</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Profile Views</span>
                <span className="text-lg font-bold text-gray-900">1,248</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Patients</span>
                <span className="text-lg font-bold text-gray-900">342</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Rating</span>
                <div className="flex items-center gap-1">
                  <Star size={16} className="text-yellow-500 fill-yellow-500" />
                  <span className="text-lg font-bold text-gray-900">4.9</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-lg font-bold text-green-600">12 min</span>
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
                <div className="font-semibold text-blue-900">Verified Profile</div>
                <div className="text-xs text-blue-700">Credentials confirmed</div>
              </div>
            </div>
            <p className="text-sm text-blue-800">
              Your profile has been verified by LSevin. This badge increases patient trust.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end gap-3">
        <button className="h-10 px-6 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
          Cancel
        </button>
        <button className="h-10 px-6 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
          Save Changes
        </button>
      </div>
    </DashboardLayout>
  );
}
