import { DashboardLayout, StatCard } from '../../design-system/dashboard-components';
import { 
  LayoutDashboard,
  Calendar,
  Users,
  Stethoscope,
  DollarSign,
  Image,
  Star,
  TrendingUp,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings
} from 'lucide-react';

export default function ClinicDashboard() {
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
  
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Clinic Dashboard"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, Dr. Johnson!</h2>
            <p className="text-white/80 mb-4">Here's what's happening with your clinic today</p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold">5</div>
                <div className="text-sm text-white/80">New Bookings</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">12</div>
                <div className="text-sm text-white/80">Today's Appointments</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">98%</div>
                <div className="text-sm text-white/80">Satisfaction Rate</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="px-4 py-2 bg-[#eacb7f] text-[#083f30] rounded-lg font-semibold text-sm mb-2">
              Premium Plan
            </div>
            <div className="text-sm text-white/80">Valid until Dec 2024</div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Revenue"
          value="$124,500"
          change={{ value: '+18.2%', trend: 'up' }}
          icon={<DollarSign size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Total Bookings"
          value="847"
          change={{ value: '+12.5%', trend: 'up' }}
          icon={<Calendar size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Avg Rating"
          value="4.9"
          change={{ value: '+0.2', trend: 'up' }}
          icon={<Star size={20} className="text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          label="Active Doctors"
          value="8"
          icon={<Users size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Booking Trends */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Booking Trends</h3>
            <select className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>Last 30 days</option>
              <option>Last 3 months</option>
              <option>Last 6 months</option>
            </select>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            Line Chart - Bookings Over Time
          </div>
        </div>
        
        {/* Popular Treatments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Popular Treatments</h3>
          <div className="space-y-4">
            {[
              { name: 'Hair Transplant', bookings: 234, revenue: '$58,500', color: 'bg-blue-500', percentage: 45 },
              { name: 'Dental Implants', bookings: 189, revenue: '$47,250', color: 'bg-green-500', percentage: 35 },
              { name: 'IVF Treatment', bookings: 124, revenue: '$31,000', color: 'bg-purple-500', percentage: 20 },
            ].map(treatment => (
              <div key={treatment.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{treatment.name}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{treatment.revenue}</div>
                    <div className="text-xs text-gray-500">{treatment.bookings} bookings</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${treatment.color}`}
                    style={{ width: `${treatment.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Today's Appointments</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {[
              { time: '09:00', patient: 'Sarah Anderson', treatment: 'Hair Transplant Consultation', doctor: 'Dr. Smith' },
              { time: '10:30', patient: 'Michael Chen', treatment: 'Follow-up Checkup', doctor: 'Dr. Johnson' },
              { time: '13:00', patient: 'Emma Wilson', treatment: 'Initial Assessment', doctor: 'Dr. Brown' },
              { time: '14:30', patient: 'James Taylor', treatment: 'Treatment Session', doctor: 'Dr. Smith' },
            ].map((apt, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center min-w-[60px]">
                  <div className="text-lg font-bold text-[#083f30]">{apt.time}</div>
                  <div className="text-xs text-gray-500">Today</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{apt.patient}</div>
                  <div className="text-sm text-gray-600">{apt.treatment}</div>
                  <div className="text-xs text-gray-500 mt-1">with {apt.doctor}</div>
                </div>
                <button className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-white transition">
                  Details
                </button>
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
              { name: 'Sarah Anderson', rating: 5, review: 'Excellent service! The staff was very professional and the facility was spotless.', date: '2 hours ago' },
              { name: 'Michael Chen', rating: 5, review: 'Best decision I made. Dr. Smith is amazing and the results exceeded my expectations.', date: '5 hours ago' },
              { name: 'Emma Wilson', rating: 4, review: 'Very good experience overall. The consultation was thorough and informative.', date: '1 day ago' },
            ].map((review, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{review.name}</div>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
                <p className="text-sm text-gray-600">{review.review}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}