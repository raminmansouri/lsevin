"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles,
  Plus, X
} from 'lucide-react';

export default function HotelRooms() {
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/hotel/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/hotel/bookings', badge: 12 },
    { label: 'Room Inventory', icon: <Bed size={20} />, path: '/provider/hotel/rooms' },
    { label: 'Room Categories', icon: <Hotel size={20} />, path: '/provider/hotel/categories' },
    { label: 'Amenities', icon: <Sparkles size={20} />, path: '/provider/hotel/amenities' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/hotel/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/hotel/availability' },
    { label: 'Gallery', icon: <Image size={20} />, path: '/provider/hotel/gallery' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/hotel/reviews' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/hotel/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/hotel/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/hotel/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/hotel/settings' },
  ];

  const rooms = [
    { number: '501', type: 'Deluxe Suite', floor: '5', status: 'occupied', housekeeping: 'clean', guest: 'Robert Johnson' },
    { number: '304', type: 'Executive Room', floor: '3', status: 'available', housekeeping: 'clean', guest: null },
    { number: '208', type: 'Standard Room', floor: '2', status: 'cleaning', housekeeping: 'in-progress', guest: null },
    { number: '601', type: 'Family Suite', floor: '6', status: 'available', housekeeping: 'clean', guest: null },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'occupied': return { bg: 'bg-red-100', text: 'text-red-700', label: 'Occupied' };
      case 'available': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Available' };
      case 'cleaning': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Cleaning' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', label: status };
    }
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Room Inventory"
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Room Management</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          Add Room
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Rooms</div>
          <div className="text-2xl font-bold text-gray-900">120</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Occupied</div>
          <div className="text-2xl font-bold text-red-900">102</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Available</div>
          <div className="text-2xl font-bold text-green-900">16</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Cleaning</div>
          <div className="text-2xl font-bold text-orange-900">2</div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {rooms.map((room, idx) => {
          const status = getStatusBadge(room.status);
          
          return (
            <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6 hover:border-[#083f30] transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">#{room.number}</div>
                  <div className="text-sm text-gray-600">Floor {room.floor}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type</span>
                  <span className="font-medium text-gray-900">{room.type}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Housekeeping</span>
                  <span className={`font-medium ${room.housekeeping === 'clean' ? 'text-green-700' : 'text-orange-700'}`}>
                    {room.housekeeping === 'clean' ? 'Clean' : 'In Progress'}
                  </span>
                </div>
                {room.guest && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">Current Guest</div>
                    <div className="font-medium text-gray-900 text-sm">{room.guest}</div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedRoom(room)}
                className="w-full h-9 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                View Details
              </button>
            </div>
          );
        })}
      </div>

      {selectedRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedRoom(null)}>
          <div className="bg-white rounded-2xl p-6 w-[500px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 text-lg">Room #{selectedRoom.number}</h3>
              <button onClick={() => setSelectedRoom(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Room Number</span>
                <span className="font-medium">{selectedRoom.number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className="font-medium">{selectedRoom.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Floor</span>
                <span className="font-medium">{selectedRoom.floor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(selectedRoom.status).bg} ${getStatusBadge(selectedRoom.status).text}`}>
                  {getStatusBadge(selectedRoom.status).label}
                </span>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium">Edit Room</button>
                <button onClick={() => setSelectedRoom(null)} className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
