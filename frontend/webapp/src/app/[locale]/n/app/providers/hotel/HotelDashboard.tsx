"use client"

import { DashboardLayout, StatCard } from '../../design-system/dashboard-components';
import { 
  LayoutDashboard,
  Calendar,
  Hotel,
  DollarSign,
  Image,
  Star,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
  Bed,
  Sparkles,
  TrendingUp
} from 'lucide-react';

export default function HotelDashboard() {
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
  
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Hotel Dashboard"
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, Amanda!</h2>
            <p className="text-white/80 mb-4">Your property performance summary</p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold">94%</div>
                <div className="text-sm text-white/80">Occupancy Rate</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">42</div>
                <div className="text-sm text-white/80">Check-ins Today</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">4.8</div>
                <div className="text-sm text-white/80">Guest Rating</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="px-4 py-2 bg-[#eacb7f] text-[#083f30] rounded-lg font-semibold text-sm mb-2">
              Premium Partner
            </div>
            <div className="text-sm text-white/80">5 Star Property</div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Monthly Revenue"
          value="$186,300"
          change={{ value: '+24.8%', trend: 'up' }}
          icon={<DollarSign size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Total Bookings"
          value="342"
          change={{ value: '+18', trend: 'up' }}
          icon={<Calendar size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Avg. Nightly Rate"
          value="$245"
          change={{ value: '+$12', trend: 'up' }}
          icon={<TrendingUp size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Available Rooms"
          value="18/120"
          icon={<Bed size={20} className="text-indigo-600" />}
          color="bg-indigo-50"
        />
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Revenue Trends */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Revenue Trends</h3>
            <select className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last 6 months</option>
            </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            Bar Chart - Daily Revenue
          </div>
        </div>
        
        {/* Room Category Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Room Category Performance</h3>
          <div className="space-y-4">
            {[
              { category: 'Deluxe Suite', bookings: 124, revenue: '$74,400', color: 'bg-indigo-500', percentage: 85 },
              { category: 'Executive Room', bookings: 98, revenue: '$39,200', color: 'bg-blue-500', percentage: 65 },
              { category: 'Standard Room', bookings: 86, revenue: '$25,800', color: 'bg-purple-500', percentage: 55 },
              { category: 'Family Suite', bookings: 34, revenue: '$17,000', color: 'bg-green-500', percentage: 40 },
            ].map(room => (
              <div key={room.category}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{room.category}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{room.revenue}</div>
                    <div className="text-xs text-gray-500">{room.bookings} bookings</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${room.color}`}
                    style={{ width: `${room.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Occupancy Calendar & Today's Activity */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Today's Check-ins/Check-outs */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Today's Activity</h3>
          
          {/* Check-ins */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <h4 className="text-sm font-semibold text-gray-700">Check-ins (42)</h4>
              </div>
              <button className="text-xs text-[#083f30] font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {[
                { guest: 'Robert Johnson', room: 'Deluxe Suite 501', time: '14:00', status: 'Confirmed' },
                { guest: 'Maria Garcia', room: 'Executive 304', time: '15:30', status: 'Pending' },
                { guest: 'David Chen', room: 'Standard 208', time: '16:00', status: 'Confirmed' },
              ].map((checkin, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{checkin.guest}</div>
                    <div className="text-xs text-gray-600">{checkin.room}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{checkin.time}</div>
                    <div className="text-xs text-green-600">{checkin.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Check-outs */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <h4 className="text-sm font-semibold text-gray-700">Check-outs (38)</h4>
              </div>
              <button className="text-xs text-[#083f30] font-medium hover:underline">View All</button>
            </div>
            <div className="space-y-3">
              {[
                { guest: 'Sarah Williams', room: 'Deluxe Suite 302', time: '11:00', status: 'Completed' },
                { guest: 'James Brown', room: 'Executive 405', time: '12:00', status: 'In Progress' },
                { guest: 'Lisa Anderson', room: 'Family Suite 601', time: '12:00', status: 'Pending' },
              ].map((checkout, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{checkout.guest}</div>
                    <div className="text-xs text-gray-600">{checkout.room}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{checkout.time}</div>
                    <div className="text-xs text-orange-600">{checkout.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Room Availability Overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Room Availability</h3>
            <select className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>Today</option>
              <option>Tomorrow</option>
              <option>This Week</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {[
              { type: 'Deluxe Suite', total: 24, occupied: 22, available: 2, cleaning: 0 },
              { type: 'Executive Room', total: 36, occupied: 34, available: 1, cleaning: 1 },
              { type: 'Standard Room', total: 48, occupied: 42, available: 4, cleaning: 2 },
              { type: 'Family Suite', total: 12, occupied: 10, available: 2, cleaning: 0 },
            ].map(room => (
              <div key={room.type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium text-gray-900">{room.type}</div>
                  <div className="text-sm text-gray-600">{room.total} total</div>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{room.occupied}</div>
                    <div className="text-xs text-gray-600">Occupied</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{room.available}</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded-lg">
                    <div className="text-lg font-bold text-orange-600">{room.cleaning}</div>
                    <div className="text-xs text-gray-600">Cleaning</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Reviews & Upcoming Reservations */}
      <div className="grid grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Recent Guest Reviews</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {[
              { guest: 'Emma Thompson', rating: 5, review: 'Absolutely stunning property! The service was impeccable and the room was beautifully appointed.', room: 'Deluxe Suite', date: '3 hours ago' },
              { guest: 'Michael Zhang', rating: 5, review: 'Best hotel experience ever. The staff went above and beyond to make our stay memorable.', room: 'Executive Room', date: '1 day ago' },
              { guest: 'Sophie Martin', rating: 4, review: 'Great location and facilities. The breakfast spread was excellent.', room: 'Standard Room', date: '2 days ago' },
            ].map((review, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{review.guest}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{review.room}</div>
                  </div>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
                <p className="text-sm text-gray-600">{review.review}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* Upcoming High-Value Reservations */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Upcoming VIP Reservations</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {[
              { guest: 'Alexander Petrov', room: 'Presidential Suite', checkin: 'Mar 15', nights: 7, value: '$12,600', vip: true },
              { guest: 'Jennifer Lee', room: 'Deluxe Suite 501', checkin: 'Mar 16', nights: 3, value: '$2,700', vip: false },
              { guest: 'Carlos Rodriguez', room: 'Executive Room 401', checkin: 'Mar 17', nights: 5, value: '$2,000', vip: false },
              { guest: 'Diana Foster', room: 'Family Suite 603', checkin: 'Mar 18', nights: 4, value: '$2,400', vip: true },
            ].map((booking, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{booking.guest}</div>
                      {booking.vip && (
                        <span className="px-2 py-0.5 bg-[#eacb7f] text-[#083f30] text-xs font-semibold rounded">VIP</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{booking.room}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{booking.value}</div>
                    <div className="text-xs text-gray-500">{booking.nights} nights</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">Check-in: {booking.checkin}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
