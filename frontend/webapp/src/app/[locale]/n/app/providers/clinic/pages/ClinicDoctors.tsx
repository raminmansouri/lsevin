
"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Search, Plus,
  X, CheckCircle, XCircle, Phone, Mail, MapPin, Award, Clock, BadgeCheck
} from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  department: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  rating: number;
  reviews: number;
  profileCompletion: number;
  availability: string;
  patients: number;
  image: string;
  yearsExperience: number;
  languages: string[];
  education: string;
}

export default function ClinicDoctors() {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/clinic/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/clinic/bookings', badge: 5 },
    { label: 'Doctors', icon: <Users size={20} />, path: '/provider/clinic/doctors' },
    { label: 'Treatments', icon: <Stethoscope size={20} />, path: '/provider/clinic/treatments' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/clinic/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/clinic/availability' },
    { label: 'Media Gallery', icon: <Image size={20} />, path: '/provider/clinic/media' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/clinic/reviews' },
    { label: 'Promotions', icon: <TrendingUp size={20} />, path: '/provider/clinic/promotions' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/clinic/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/clinic/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/clinic/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/clinic/settings' },
  ];

  const doctors: Doctor[] = [
    {
      id: '1',
      name: 'Dr. Ahmed Hassan',
      specialty: 'Hair Transplant Surgeon',
      department: 'Cosmetic Surgery',
      email: 'ahmed.hassan@elitemedical.ae',
      phone: '+971 50 123 4567',
      status: 'active',
      rating: 4.9,
      reviews: 234,
      profileCompletion: 100,
      availability: 'Mon-Fri 9:00-17:00',
      patients: 456,
      image: 'AH',
      yearsExperience: 12,
      languages: ['English', 'Arabic', 'French'],
      education: 'MD, FACS - Harvard Medical School'
    },
    {
      id: '2',
      name: 'Dr. Maria Santos',
      specialty: 'Dental Surgeon',
      department: 'Dentistry',
      email: 'maria.santos@elitemedical.ae',
      phone: '+971 55 234 5678',
      status: 'active',
      rating: 4.8,
      reviews: 189,
      profileCompletion: 95,
      availability: 'Mon-Sat 8:00-16:00',
      patients: 389,
      image: 'MS',
      yearsExperience: 10,
      languages: ['English', 'Spanish', 'Portuguese'],
      education: 'DDS, MSD - University of São Paulo'
    },
    {
      id: '3',
      name: 'Dr. Fatima Al-Rashid',
      specialty: 'Fertility Specialist',
      department: 'Reproductive Health',
      email: 'fatima.alrashid@elitemedical.ae',
      phone: '+971 56 345 6789',
      status: 'active',
      rating: 5.0,
      reviews: 156,
      profileCompletion: 100,
      availability: 'Mon-Thu 10:00-18:00',
      patients: 234,
      image: 'FA',
      yearsExperience: 15,
      languages: ['English', 'Arabic', 'Urdu'],
      education: 'MD, PhD - Johns Hopkins University'
    },
    {
      id: '4',
      name: 'Dr. James Robertson',
      specialty: 'Orthopedic Surgeon',
      department: 'Orthopedics',
      email: 'james.robertson@elitemedical.ae',
      phone: '+971 52 456 7890',
      status: 'active',
      rating: 4.7,
      reviews: 198,
      profileCompletion: 90,
      availability: 'Tue-Sat 9:00-17:00',
      patients: 412,
      image: 'JR',
      yearsExperience: 18,
      languages: ['English', 'German'],
      education: 'MD, FRCS - Oxford University'
    },
    {
      id: '5',
      name: 'Dr. Priya Sharma',
      specialty: 'Dermatologist',
      department: 'Dermatology',
      email: 'priya.sharma@elitemedical.ae',
      phone: '+971 50 567 8901',
      status: 'inactive',
      rating: 4.6,
      reviews: 167,
      profileCompletion: 85,
      availability: 'Currently unavailable',
      patients: 298,
      image: 'PS',
      yearsExperience: 8,
      languages: ['English', 'Hindi', 'Arabic'],
      education: 'MBBS, MD - All India Institute of Medical Sciences'
    },
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doctor.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doctor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Doctor Management"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Doctor & Specialist Management</h1>
            <p className="text-gray-600 mt-1">Manage your medical staff and their profiles</p>
          </div>
          <button className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
            <Plus size={18} />
            Add New Doctor
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Total Doctors</div>
                <div className="text-3xl font-bold text-gray-900 mt-2">{doctors.length}</div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Active</div>
                <div className="text-3xl font-bold text-green-600 mt-2">
                  {doctors.filter(d => d.status === 'active').length}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Avg Rating</div>
                <div className="text-3xl font-bold text-yellow-600 mt-2">4.8</div>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Star size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Departments</div>
                <div className="text-3xl font-bold text-purple-600 mt-2">5</div>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Award size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search doctors by name, specialty, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              />
            </div>
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>All Departments</option>
              <option>Cosmetic Surgery</option>
              <option>Dentistry</option>
              <option>Reproductive Health</option>
              <option>Orthopedics</option>
              <option>Dermatology</option>
            </select>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredDoctors.map(doctor => (
          <div 
            key={doctor.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition cursor-pointer"
            onClick={() => setSelectedDoctor(doctor)}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-[#083f30] rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {doctor.image}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                      {doctor.status === 'active' && (
                        <BadgeCheck size={18} className="text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{doctor.specialty}</p>
                    <p className="text-xs text-gray-500">{doctor.department}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    doctor.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {doctor.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">{doctor.rating}</span>
                    <span className="text-sm text-gray-500">({doctor.reviews} reviews)</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{doctor.patients}</span> patients
                  </div>
                </div>

                {/* Profile Completion */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Profile Completion</span>
                    <span className="font-semibold text-gray-900">{doctor.profileCompletion}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${doctor.profileCompletion === 100 ? 'bg-green-500' : 'bg-yellow-500'}`}
                      style={{ width: `${doctor.profileCompletion}%` }}
                    />
                  </div>
                </div>

                {/* Availability */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Clock size={14} />
                  {doctor.availability}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDoctor(doctor);
                    }}
                    className="flex-1 h-9 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
                  >
                    View Profile
                  </button>
                  <button className="flex-1 h-9 bg-[#083f30] text-white rounded-lg text-sm font-medium hover:bg-[#0a5a44] transition">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Doctor Detail Panel */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={() => setSelectedDoctor(null)}>
          <div className="w-[500px] h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Doctor Profile</h3>
              <button 
                onClick={() => setSelectedDoctor(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Doctor Info */}
              <div className="text-center">
                <div className="w-24 h-24 bg-[#083f30] rounded-full flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4">
                  {selectedDoctor.image}
                </div>
                <h3 className="font-bold text-xl text-gray-900">{selectedDoctor.name}</h3>
                <p className="text-gray-600">{selectedDoctor.specialty}</p>
                <p className="text-sm text-gray-500">{selectedDoctor.department}</p>
                
                <div className="flex items-center justify-center gap-2 mt-3">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-gray-900">{selectedDoctor.rating}</span>
                  <span className="text-sm text-gray-500">({selectedDoctor.reviews} reviews)</span>
                </div>

                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold mt-3 ${
                  selectedDoctor.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedDoctor.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Contact */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Phone</div>
                      <div className="font-medium text-gray-900">{selectedDoctor.phone}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-500">Email</div>
                      <div className="font-medium text-gray-900">{selectedDoctor.email}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Professional Details</h4>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-500">Education</div>
                    <div className="font-medium text-gray-900">{selectedDoctor.education}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Years of Experience</div>
                    <div className="font-medium text-gray-900">{selectedDoctor.yearsExperience} years</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Languages</div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {selectedDoctor.languages.map(lang => (
                        <span key={lang} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Availability</h4>
                <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
                  <Clock size={18} className="text-gray-600" />
                  <span className="text-gray-900">{selectedDoctor.availability}</span>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedDoctor.patients}</div>
                    <div className="text-sm text-gray-600">Total Patients</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedDoctor.reviews}</div>
                    <div className="text-sm text-gray-600">Reviews</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                  Edit Profile
                </button>
                <button className="flex-1 h-10 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition">
                  {selectedDoctor.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
