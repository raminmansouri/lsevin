import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Building2, ArrowLeft, ArrowRight, Upload, MapPin, Phone, Mail, Award, Users, Stethoscope, Save } from 'lucide-react';

export default function ClinicOnboarding() {
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
            <span className="font-medium">Back to Provider Selection</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="text-white" size={24} />
            </div>
            <div>
              <div className="text-sm text-gray-500">Provider Type</div>
              <div className="font-bold text-gray-900">Clinic / Hospital</div>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">Step 1 of 4</span>
            <span className="text-sm text-gray-500">Basic Information</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#083f30] rounded-full transition-all" style={{ width: '25%' }} />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Medical Facility Registration</h1>
            <p className="text-gray-600 leading-relaxed">
              Please provide detailed information about your medical facility. This helps us verify your credentials 
              and connect you with patients seeking quality healthcare services.
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
                <h2 className="text-xl font-bold text-gray-900">Facility Information</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Facility Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Istanbul Medical Center"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.facilityName}
                    onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Facility Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent appearance-none bg-white"
                    value={formData.facilityType}
                    onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                  >
                    <option value="">Select facility type</option>
                    <option value="hospital">Hospital</option>
                    <option value="clinic">Clinic</option>
                    <option value="medical-center">Medical Center</option>
                    <option value="specialized-hospital">Specialized Hospital</option>
                    <option value="day-surgery">Day Surgery Center</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Number of Doctors <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 25"
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
                <h2 className="text-xl font-bold text-gray-900">Location Details</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
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
                    placeholder="e.g., Istanbul"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter complete facility address"
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
                <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+90 212 xxx xxxx"
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
                    placeholder="contact@facility.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Website URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.facility.com"
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
                <h2 className="text-xl font-bold text-gray-900">Departments & Specialties</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Main Departments <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-3">Select all departments available at your facility</p>
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
                    Services & Treatments Offered
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe the main services and treatments your facility provides..."
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
                <h2 className="text-xl font-bold text-gray-900">Licensing & Accreditation</h2>
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
                    Accreditation & Certifications
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., JCI Accredited, ISO 9001 Certified"
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
