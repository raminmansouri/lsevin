"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  Search, Filter, Plus, Edit2, CheckCircle, X, Phone, Mail, Award, Briefcase
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  specialty: string[];
  status: 'active' | 'on-break' | 'off-duty';
  rating: number;
  reviewCount: number;
  servicesCompleted: number;
  availability: string;
  profileCompletion: number;
  phone: string;
  email: string;
  joinedDate: string;
  image: string;
}

export default function SalonStaff() {
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/salon/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/salon/bookings', badge: 12 },
    { label: 'Staff', icon: <Users size={20} />, path: '/provider/salon/staff' },
    { label: 'Services', icon: <Scissors size={20} />, path: '/provider/salon/services' },
    { label: 'Time Slots', icon: <Clock size={20} />, path: '/provider/salon/timeslots' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/salon/pricing' },
    { label: 'Offers', icon: <Gift size={20} />, path: '/provider/salon/offers' },
    { label: 'Before/After', icon: <Image size={20} />, path: '/provider/salon/gallery' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/salon/reviews' },
    { label: 'Analytics', icon: <TrendingUp size={20} />, path: '/provider/salon/analytics' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/salon/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/salon/settings' },
  ];

  const staff: StaffMember[] = [
    {
      id: '1',
      name: 'Anna Martinez',
      role: 'Senior Hair Stylist',
      specialty: ['Hair Coloring', 'Hair Cutting', 'Hair Extensions'],
      status: 'active',
      rating: 4.9,
      reviewCount: 142,
      servicesCompleted: 1847,
      availability: 'Mon-Sat, 9AM-6PM',
      profileCompletion: 100,
      phone: '+971 50 123 4567',
      email: 'anna.martinez@luxurybeauty.com',
      joinedDate: '2023-01-15',
      image: 'unsplash_images/photo-1494790108377-be9c29b29330__w=400&h=400&fit=crop.jpg'
    },
    {
      id: '2',
      name: 'Maria Santos',
      role: 'Spa Specialist',
      specialty: ['Facial Treatments', 'Body Massage', 'Aromatherapy'],
      status: 'active',
      rating: 5.0,
      reviewCount: 98,
      servicesCompleted: 1234,
      availability: 'Tue-Sun, 10AM-7PM',
      profileCompletion: 95,
      phone: '+971 55 234 5678',
      email: 'maria.santos@luxurybeauty.com',
      joinedDate: '2023-03-20',
      image: 'unsplash_images/photo-1438761681033-6461ffad8d80__w=400&h=400&fit=crop.jpg'
    },
    {
      id: '3',
      name: 'Sofia Rodriguez',
      role: 'Nail Technician',
      specialty: ['Manicure', 'Pedicure', 'Nail Art'],
      status: 'on-break',
      rating: 4.8,
      reviewCount: 76,
      servicesCompleted: 892,
      availability: 'Mon-Fri, 11AM-8PM',
      profileCompletion: 85,
      phone: '+971 56 345 6789',
      email: 'sofia.rodriguez@luxurybeauty.com',
      joinedDate: '2023-06-10',
      image: 'unsplash_images/photo-1534528741775-53994a69daeb__w=400&h=400&fit=crop.jpg'
    },
    {
      id: '4',
      name: 'Elena Popescu',
      role: 'Makeup Artist',
      specialty: ['Bridal Makeup', 'Special Events', 'Permanent Makeup'],
      status: 'active',
      rating: 4.9,
      reviewCount: 54,
      servicesCompleted: 567,
      availability: 'Wed-Sun, 10AM-6PM',
      profileCompletion: 90,
      phone: '+971 52 456 7890',
      email: 'elena.popescu@luxurybeauty.com',
      joinedDate: '2024-01-05',
      image: 'unsplash_images/photo-1544005313-94ddf0286df2__w=400&h=400&fit=crop.jpg'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' };
      case 'on-break': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'On Break' };
      case 'off-duty': return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Off Duty' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Staff Management"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Team Members</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your salon staff and specialists</p>
        </div>
        
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
          <Plus size={18} />
          Add Staff Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Staff</div>
          <div className="text-2xl font-bold text-gray-900">4</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Currently Active</div>
          <div className="text-2xl font-bold text-green-900">3</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Avg. Rating</div>
          <div className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            4.9
            <Star size={20} className="text-yellow-500 fill-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Services Today</div>
          <div className="text-2xl font-bold text-blue-900">28</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff by name, role, or specialty..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
              <option>All Roles</option>
              <option>Hair Stylist</option>
              <option>Spa Specialist</option>
              <option>Nail Technician</option>
              <option>Makeup Artist</option>
            </select>

            <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
              <option>All Status</option>
              <option>Active</option>
              <option>On Break</option>
              <option>Off Duty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-2 gap-6">
        {staff.map(member => {
          const status = getStatusBadge(member.status);
          
          return (
            <div key={member.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#083f30] transition">
              <div className="flex items-start gap-4 mb-4">
                <img 
                  src={member.image}
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                    <button
                      onClick={() => setSelectedStaff(member)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
                    >
                      <Edit2 size={16} className="text-gray-600" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium text-gray-900">{member.rating}</span>
                      <span className="text-xs text-gray-500">({member.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">Specialties</div>
                  <div className="flex flex-wrap gap-1">
                    {member.specialty.map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Services Completed</div>
                    <div className="font-semibold text-gray-900">{member.servicesCompleted.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Availability</div>
                    <div className="text-sm text-gray-900">{member.availability}</div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Profile Completion</span>
                  <span className="text-xs font-semibold text-gray-900">{member.profileCompletion}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#083f30] rounded-full transition-all duration-300"
                    style={{ width: `${member.profileCompletion}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 h-9 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  View Schedule
                </button>
                <button className="flex-1 h-9 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                  View Profile
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Staff Detail Drawer */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedStaff(null)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[700px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Staff Details</h3>
              <button
                onClick={() => setSelectedStaff(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile */}
              <div className="flex items-start gap-4">
                <img 
                  src={selectedStaff.image}
                  alt={selectedStaff.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-xl mb-1">{selectedStaff.name}</h4>
                  <p className="text-gray-600 mb-3">{selectedStaff.role}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Star size={16} className="text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-gray-900">{selectedStaff.rating}</span>
                    <span className="text-sm text-gray-500">({selectedStaff.reviewCount} reviews)</span>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedStaff.status).bg} ${getStatusBadge(selectedStaff.status).text}`}>
                    {getStatusBadge(selectedStaff.status).label}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Contact Information</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Phone size={16} className="text-gray-400" />
                    {selectedStaff.phone}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <Mail size={16} className="text-gray-400" />
                    {selectedStaff.email}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Performance</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700 mb-1">Services Completed</div>
                    <div className="text-2xl font-bold text-blue-900">{selectedStaff.servicesCompleted.toLocaleString()}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-700 mb-1">Joined</div>
                    <div className="text-lg font-bold text-green-900">{selectedStaff.joinedDate}</div>
                  </div>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Specialties</div>
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.specialty.map((spec, idx) => (
                    <span key={idx} className="px-3 py-2 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                  Edit Profile
                </button>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
