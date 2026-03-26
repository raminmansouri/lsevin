"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Dumbbell, DollarSign, TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Package, Activity,
  Plus, Search, Filter, Award, CheckCircle, X
} from 'lucide-react';

interface Trainer {
  id: string;
  name: string;
  specialties: string[];
  certifications: string[];
  availability: string;
  rating: number;
  reviewCount: number;
  status: 'active' | 'on-break' | 'inactive';
  profileCompletion: number;
  classesThisWeek: number;
  image: string;
}

export default function GymTrainers() {
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/gym/dashboard' },
    { label: 'Class Schedule', icon: <Calendar size={20} />, path: '/provider/gym/schedule' },
    { label: 'Trainers', icon: <Users size={20} />, path: '/provider/gym/trainers' },
    { label: 'Memberships', icon: <Package size={20} />, path: '/provider/gym/memberships' },
    { label: 'Services', icon: <Dumbbell size={20} />, path: '/provider/gym/services' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/gym/bookings', badge: 8 },
    { label: 'Live Status', icon: <Activity size={20} />, path: '/provider/gym/live-status' },
    { label: 'Offers', icon: <TrendingUp size={20} />, path: '/provider/gym/offers' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/gym/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/gym/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/gym/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/gym/settings' },
  ];

  const trainers: Trainer[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      specialties: ['HIIT', 'CrossFit', 'Functional Training'],
      certifications: ['ACE Certified', 'CrossFit Level 2', 'Nutrition Coach'],
      availability: 'Mon-Sat, 6AM-2PM',
      rating: 4.9,
      reviewCount: 87,
      status: 'active',
      profileCompletion: 100,
      classesThisWeek: 12,
      image: '/unsplash_images/photo-1594381898411-846e7d193883__w=400&h=400&fit=crop.jpg'
    },
    {
      id: '2',
      name: 'Emma Chen',
      specialties: ['Yoga', 'Pilates', 'Meditation'],
      certifications: ['RYT 500', 'Pilates Instructor', 'Mindfulness Coach'],
      availability: 'Tue-Sun, 7AM-3PM',
      rating: 5.0,
      reviewCount: 124,
      status: 'active',
      profileCompletion: 95,
      classesThisWeek: 10,
      image: '/unsplash_images/photo-1544005313-94ddf0286df2__w=400&h=400&fit=crop.jpg'
    },
    {
      id: '3',
      name: 'Mike Ross',
      specialties: ['Strength Training', 'Bodybuilding', 'Powerlifting'],
      certifications: ['NSCA-CPT', 'CSCS', 'Sports Nutrition'],
      availability: 'Mon-Fri, 12PM-8PM',
      rating: 4.8,
      reviewCount: 65,
      status: 'on-break',
      profileCompletion: 90,
      classesThisWeek: 8,
      image: '/unsplash_images/photo-1567013127542-490d757e51fc__w=400&h=400&fit=crop.jpg'
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' };
      case 'on-break': return { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'On Break' };
      case 'inactive': return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Inactive' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Trainer Management"
      userRole="provider"
      userName="Mike Patterson"
      providerName="PowerFit Gym"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Training Team</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your fitness trainers and instructors</p>
        </div>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Trainer
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Trainers</div>
          <div className="text-2xl font-bold text-gray-900">3</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active Today</div>
          <div className="text-2xl font-bold text-green-900">2</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Avg. Rating</div>
          <div className="text-2xl font-bold text-gray-900">4.9</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Classes This Week</div>
          <div className="text-2xl font-bold text-blue-900">30</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search trainers by name or specialty..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>All Status</option>
              <option>Active</option>
              <option>On Break</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {trainers.map(trainer => {
          const status = getStatusBadge(trainer.status);
          
          return (
            <div key={trainer.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#083f30] transition">
              <div className="flex items-start gap-4 mb-4">
                <img src={trainer.image} alt={trainer.name} className="w-20 h-20 rounded-full object-cover" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg mb-1">{trainer.name}</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                      {status.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <Award size={14} className="text-yellow-500" />
                      <span className="text-sm font-medium">{trainer.rating}</span>
                      <span className="text-xs text-gray-500">({trainer.reviewCount})</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">Specialties</div>
                  <div className="flex flex-wrap gap-1">
                    {trainer.specialties.map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">Certifications</div>
                  <div className="flex flex-wrap gap-1">
                    {trainer.certifications.slice(0, 2).map((cert, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded flex items-center gap-1">
                        <CheckCircle size={12} />
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Classes This Week</div>
                    <div className="font-semibold text-gray-900">{trainer.classesThisWeek}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Availability</div>
                    <div className="text-sm text-gray-900">{trainer.availability.split(',')[0]}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Profile Completion</span>
                  <span className="text-xs font-semibold text-gray-900">{trainer.profileCompletion}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#083f30] rounded-full"
                    style={{ width: `${trainer.profileCompletion}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => setSelectedTrainer(trainer)}
                className="w-full h-9 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                View Full Profile
              </button>
            </div>
          );
        })}
      </div>

      {selectedTrainer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedTrainer(null)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[700px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Trainer Profile</h3>
              <button onClick={() => setSelectedTrainer(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <img src={selectedTrainer.image} alt={selectedTrainer.name} className="w-24 h-24 rounded-full object-cover" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-xl mb-2">{selectedTrainer.name}</h4>
                  <div className="flex items-center gap-2 mb-3">
                    <Award size={16} className="text-yellow-500" />
                    <span className="font-semibold">{selectedTrainer.rating}</span>
                    <span className="text-sm text-gray-500">({selectedTrainer.reviewCount} reviews)</span>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedTrainer.status).bg} ${getStatusBadge(selectedTrainer.status).text}`}>
                    {getStatusBadge(selectedTrainer.status).label}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Specialties</div>
                <div className="flex flex-wrap gap-2">
                  {selectedTrainer.specialties.map((spec, idx) => (
                    <span key={idx} className="px-3 py-2 bg-orange-50 text-orange-700 text-sm font-medium rounded-lg">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Certifications</div>
                <div className="space-y-2">
                  {selectedTrainer.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <CheckCircle size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-3">Performance</div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm text-orange-700 mb-1">Classes This Week</div>
                    <div className="text-2xl font-bold text-orange-900">{selectedTrainer.classesThisWeek}</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-700 mb-1">Availability</div>
                    <div className="text-sm font-bold text-green-900">{selectedTrainer.availability}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44]">
                  Edit Profile
                </button>
                <button onClick={() => setSelectedTrainer(null)} className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
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
