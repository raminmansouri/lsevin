import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  Plus, Edit2, ToggleLeft, ToggleRight, X
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  assignedStaff: string[];
  status: 'active' | 'inactive';
  featured: boolean;
  bookings: number;
  description: string;
}

export default function SalonServices() {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');

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

  const services: Service[] = [
    {
      id: '1',
      name: 'Hair Color & Cut',
      category: 'Hair',
      duration: 120,
      price: 250,
      assignedStaff: ['Anna Martinez'],
      status: 'active',
      featured: true,
      bookings: 234,
      description: 'Professional hair coloring and precision cutting'
    },
    {
      id: '2',
      name: 'Facial Treatment',
      category: 'Spa',
      duration: 60,
      price: 150,
      assignedStaff: ['Maria Santos'],
      status: 'active',
      featured: true,
      bookings: 189,
      description: 'Deep cleansing and rejuvenating facial'
    },
    {
      id: '3',
      name: 'Manicure & Pedicure',
      category: 'Nails',
      duration: 90,
      price: 120,
      assignedStaff: ['Sofia Rodriguez'],
      status: 'active',
      featured: false,
      bookings: 156,
      description: 'Complete nail care and polish'
    },
    {
      id: '4',
      name: 'Hair Extensions',
      category: 'Hair',
      duration: 180,
      price: 450,
      assignedStaff: ['Anna Martinez'],
      status: 'active',
      featured: false,
      bookings: 98,
      description: 'Premium hair extension application'
    },
    {
      id: '5',
      name: 'Bridal Makeup',
      category: 'Makeup',
      duration: 120,
      price: 300,
      assignedStaff: ['Elena Popescu'],
      status: 'active',
      featured: true,
      bookings: 45,
      description: 'Complete bridal makeup package'
    },
    {
      id: '6',
      name: 'Body Massage',
      category: 'Spa',
      duration: 90,
      price: 180,
      assignedStaff: ['Maria Santos'],
      status: 'active',
      featured: false,
      bookings: 112,
      description: 'Relaxing full body massage'
    },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Service Catalog"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Service Menu</h3>
          <p className="text-sm text-gray-500 mt-1">Manage your salon services and treatments</p>
        </div>
        
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
          <Plus size={18} />
          Add New Service
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Services</div>
          <div className="text-2xl font-bold text-gray-900">6</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Active Services</div>
          <div className="text-2xl font-bold text-green-900">6</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Featured</div>
          <div className="text-2xl font-bold text-purple-900">3</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Bookings</div>
          <div className="text-2xl font-bold text-blue-900">834</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-2">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="Hair">Hair</option>
            <option value="Spa">Spa</option>
            <option value="Nails">Nails</option>
            <option value="Makeup">Makeup</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#083f30] transition">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="font-semibold text-gray-900 text-lg">{service.name}</h4>
                  {service.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded">
                      Featured
                    </span>
                  )}
                </div>
                <span className="inline-block px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded mb-3">
                  {service.category}
                </span>
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
                <span className="text-gray-600">Duration</span>
                <div className="flex items-center gap-1 font-medium text-gray-900">
                  <Clock size={16} className="text-gray-400" />
                  {service.duration} min
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Price</span>
                <span className="font-bold text-[#083f30] text-lg">AED {service.price}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Assigned Staff</span>
                <span className="font-medium text-gray-900">{service.assignedStaff.join(', ')}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Total Bookings</span>
                <span className="font-medium text-gray-900">{service.bookings}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                {service.status === 'active' ? (
                  <ToggleRight size={24} className="text-green-600" />
                ) : (
                  <ToggleLeft size={24} className="text-gray-400" />
                )}
                <span className={`text-sm font-medium ${service.status === 'active' ? 'text-green-700' : 'text-gray-500'}`}>
                  {service.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Edit Service
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedService(null)}>
          <div className="bg-white rounded-2xl p-6 w-[600px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Edit Service</h3>
              <button onClick={() => setSelectedService(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                <input
                  type="text"
                  defaultValue={selectedService.name}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    defaultValue={selectedService.category}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  >
                    <option>Hair</option>
                    <option>Spa</option>
                    <option>Nails</option>
                    <option>Makeup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                  <input
                    type="number"
                    defaultValue={selectedService.duration}
                    className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (AED)</label>
                <input
                  type="number"
                  defaultValue={selectedService.price}
                  className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  defaultValue={selectedService.description}
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44]">
                  Save Changes
                </button>
                <button
                  onClick={() => setSelectedService(null)}
                  className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
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
