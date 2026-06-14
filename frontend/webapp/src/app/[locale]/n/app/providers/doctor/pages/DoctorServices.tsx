"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  Plus, Edit2, ToggleLeft, ToggleRight, Clock, Video, MapPin, X
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  consultationType: 'Video Call' | 'In-Person' | 'Both';
  duration: number;
  price: number;
  currency: string;
  isActive: boolean;
  description: string;
  availability: string;
}

export default function DoctorServices() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showAddService, setShowAddService] = useState(false);

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

  const services: Service[] = [
    {
      id: '1',
      name: 'Initial Cardiology Consultation',
      category: 'Cardiology',
      consultationType: 'Both',
      duration: 45,
      price: 450,
      currency: 'AED',
      isActive: true,
      description: 'Comprehensive initial consultation for cardiac health assessment',
      availability: 'Mon-Fri, 9AM-5PM'
    },
    {
      id: '2',
      name: 'Follow-up Consultation',
      category: 'Cardiology',
      consultationType: 'Both',
      duration: 30,
      price: 300,
      currency: 'AED',
      isActive: true,
      description: 'Follow-up consultation for existing patients',
      availability: 'Mon-Sat, 9AM-5PM'
    },
    {
      id: '3',
      name: 'Cardiac Stress Test Review',
      category: 'Cardiology',
      consultationType: 'In-Person',
      duration: 60,
      price: 600,
      currency: 'AED',
      isActive: true,
      description: 'Comprehensive review and interpretation of cardiac stress test results',
      availability: 'Mon-Fri, 10AM-4PM'
    },
    {
      id: '4',
      name: 'Echocardiogram Consultation',
      category: 'Cardiology',
      consultationType: 'In-Person',
      duration: 45,
      price: 550,
      currency: 'AED',
      isActive: true,
      description: 'Echo examination and consultation',
      availability: 'Tue-Thu, 2PM-5PM'
    },
    {
      id: '5',
      name: 'Video Consultation',
      category: 'General Medicine',
      consultationType: 'Video Call',
      duration: 20,
      price: 200,
      currency: 'AED',
      isActive: true,
      description: 'Quick video consultation for minor concerns',
      availability: 'Mon-Sun, 8AM-8PM'
    },
    {
      id: '6',
      name: 'Second Opinion Consultation',
      category: 'Cardiology',
      consultationType: 'Both',
      duration: 60,
      price: 700,
      currency: 'AED',
      isActive: false,
      description: 'Detailed second opinion for cardiac conditions',
      availability: 'By Appointment'
    },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="My Services"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Service Catalog</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your consultation services and pricing</p>
        </div>
        
        <button
          onClick={() => setShowAddService(true)}
          className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2"
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Services</div>
          <div className="text-2xl font-bold text-gray-900">6</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active Services</div>
          <div className="text-2xl font-bold text-green-900">5</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Avg. Price</div>
          <div className="text-2xl font-bold text-gray-900">AED 467</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Bookings This Month</div>
          <div className="text-2xl font-bold text-blue-900">142</div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 gap-6">
        {services.map(service => (
          <div
            key={service.id}
            className={`bg-white rounded-xl border-2 p-6 transition ${
              service.isActive ? 'border-gray-200 hover:border-[#083f30]' : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{service.name}</h4>
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded">
                    {service.category}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{service.description}</p>
              </div>
              
              <button
                onClick={() => setSelectedService(service)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition ml-3"
              >
                <Edit2 size={16} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Consultation Type</span>
                <div className="flex items-center gap-1 font-medium text-gray-900">
                  {service.consultationType === 'Video Call' && <Video size={16} className="text-blue-600" />}
                  {service.consultationType === 'In-Person' && <MapPin size={16} className="text-purple-600" />}
                  {service.consultationType}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Duration</span>
                <div className="flex items-center gap-1 font-medium text-gray-900">
                  <Clock size={16} className="text-gray-400" />
                  {service.duration} minutes
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price</span>
                <span className="font-bold text-[#083f30] text-lg">
                  {service.currency} {service.price}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Availability</span>
                <span className="font-medium text-gray-900">{service.availability}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {service.isActive ? (
                  <ToggleRight size={24} className="text-green-600" />
                ) : (
                  <ToggleLeft size={24} className="text-gray-400" />
                )}
                <span className={`text-sm font-medium ${service.isActive ? 'text-green-700' : 'text-gray-500'}`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Service Panel */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedService(null)}>
          <div className="bg-white rounded-2xl p-6 w-[600px] max-h-[700px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Edit Service</h3>
              <button
                onClick={() => setSelectedService(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                <input
                  type="text"
                  defaultValue={selectedService.name}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    defaultValue={selectedService.category}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  >
                    <option>Cardiology</option>
                    <option>General Medicine</option>
                    <option>Internal Medicine</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Type</label>
                  <select
                    defaultValue={selectedService.consultationType}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  >
                    <option>Both</option>
                    <option>Video Call</option>
                    <option>In-Person</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    defaultValue={selectedService.duration}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (AED)</label>
                  <input
                    type="number"
                    defaultValue={selectedService.price}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  defaultValue={selectedService.description}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                <input
                  type="text"
                  defaultValue={selectedService.availability}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <button
                  className="flex-1"
                  onClick={() => {
                    // Toggle active state
                  }}
                >
                  {selectedService.isActive ? (
                    <ToggleRight size={32} className="text-green-600" />
                  ) : (
                    <ToggleLeft size={32} className="text-gray-400" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">Service Status</div>
                  <div className="text-xs text-gray-600">
                    {selectedService.isActive ? 'Service is visible to patients' : 'Service is hidden'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                  Save Changes
                </button>
                <button
                  onClick={() => setSelectedService(null)}
                  className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
