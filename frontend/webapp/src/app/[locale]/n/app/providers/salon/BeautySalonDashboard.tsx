"use client"

import { DashboardLayout, StatCard } from '../../design-system/dashboard-components';
import { 
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Clock,
  DollarSign,
  Gift,
  Image,
  Star,
  TrendingUp,
  MessageSquare,
  Settings
} from 'lucide-react';

export default function BeautySalonDashboard() {
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
  
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Salon Dashboard"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      {/* Quick Actions Banner */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Welcome back, Maria!</h2>
            <p className="text-white/90">You have 12 bookings today and 3 walk-ins waiting</p>
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-white/90 transition">
              View Today's Schedule
            </button>
            <button className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition">
              Add Walk-in
            </button>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Today's Revenue"
          value="$2,450"
          change={{ value: '+18%', trend: 'up' }}
          icon={<DollarSign size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Today's Bookings"
          value="12"
          icon={<Calendar size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Occupancy Rate"
          value="85%"
          change={{ value: '+5%', trend: 'up' }}
          icon={<TrendingUp size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Avg Rating"
          value="4.9"
          icon={<Star size={20} className="text-yellow-600" />}
          color="bg-yellow-50"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Today's Appointments */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Today's Appointments</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                All Staff
              </button>
              <button className="px-3 py-1.5 bg-[#083f30] text-white rounded-lg text-sm font-medium">
                + New Booking
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {[
              { time: '09:00', client: 'Sarah Miller', service: 'Hair Color & Cut', staff: 'Anna', status: 'in-progress', color: 'bg-blue-100 border-blue-300 text-blue-700' },
              { time: '10:00', client: 'Emma Davis', service: 'Facial Treatment', staff: 'Maria', status: 'confirmed', color: 'bg-green-100 border-green-300 text-green-700' },
              { time: '11:00', client: 'Lisa Johnson', service: 'Manicure & Pedicure', staff: 'Sofia', status: 'confirmed', color: 'bg-green-100 border-green-300 text-green-700' },
              { time: '12:00', client: 'Break', service: 'Lunch Break', staff: '-', status: 'break', color: 'bg-gray-100 border-gray-300 text-gray-700' },
              { time: '13:00', client: 'Rachel White', service: 'Hair Extensions', staff: 'Anna', status: 'confirmed', color: 'bg-green-100 border-green-300 text-green-700' },
              { time: '14:30', client: 'Amanda Brown', service: 'Spa Package', staff: 'Maria', status: 'pending', color: 'bg-yellow-100 border-yellow-300 text-yellow-700' },
            ].map((apt, idx) => (
              <div 
                key={idx} 
                className={`flex items-center gap-4 p-4 rounded-lg border-2 ${apt.color}`}
              >
                <div className="font-semibold min-w-[60px]">{apt.time}</div>
                <div className="flex-1">
                  <div className="font-medium">{apt.client}</div>
                  <div className="text-sm opacity-80">{apt.service}</div>
                </div>
                <div className="text-sm font-medium">
                  {apt.staff !== '-' ? `with ${apt.staff}` : apt.staff}
                </div>
                {apt.status !== 'break' && (
                  <button className="px-3 py-1.5 bg-white rounded-lg text-xs font-medium hover:bg-gray-50 transition">
                    Details
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Staff Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Staff Performance Today</h3>
          <div className="space-y-4">
            {[
              { name: 'Anna Martinez', services: 8, revenue: '$840', image: 'unsplash_images/photo-1494790108377-be9c29b29330__w=100&h=100&fit=crop.jpg' },
              { name: 'Maria Santos', services: 6, revenue: '$720', image: 'unsplash_images/photo-1438761681033-6461ffad8d80__w=100&h=100&fit=crop.jpg' },
              { name: 'Sofia Rodriguez', services: 7, revenue: '$680', image: 'unsplash_images/photo-1534528741775-53994a69daeb__w=100&h=100&fit=crop.jpg' },
              { name: 'Elena Popescu', services: 5, revenue: '$560', image: 'unsplash_images/photo-1544005313-94ddf0286df2__w=100&h=100&fit=crop.jpg' },
            ].map((staff, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <img 
                  src={staff.image} 
                  alt={staff.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{staff.name}</div>
                  <div className="text-xs text-gray-600">{staff.services} services</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm">{staff.revenue}</div>
                </div>
              </div>
            ))}
          </div>
          
          <button className="w-full mt-4 h-10 border-2 border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition">
            View Full Report
          </button>
        </div>
      </div>
      
      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Most Booked Services</h3>
          <div className="space-y-4">
            {[
              { service: 'Hair Color & Cut', bookings: 234, revenue: '$14,040', percentage: 35 },
              { service: 'Facial Treatment', bookings: 189, revenue: '$11,340', percentage: 28 },
              { service: 'Manicure & Pedicure', bookings: 156, revenue: '$7,800', percentage: 23 },
              { service: 'Hair Extensions', bookings: 98, revenue: '$9,800', percentage: 14 },
            ].map(item => (
              <div key={item.service}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{item.service}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{item.revenue}</div>
                    <div className="text-xs text-gray-500">{item.bookings} bookings</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Recent Reviews</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'Sarah Miller', rating: 5, comment: 'Amazing service! Anna did a fantastic job with my hair.', time: '1 hour ago' },
              { name: 'Emma Davis', rating: 5, comment: 'Best facial I\'ve ever had. Maria is so professional.', time: '3 hours ago' },
              { name: 'Lisa Johnson', rating: 5, comment: 'Love the atmosphere and the results. Highly recommend!', time: '5 hours ago' },
            ].map((review, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{review.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{review.time}</span>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}