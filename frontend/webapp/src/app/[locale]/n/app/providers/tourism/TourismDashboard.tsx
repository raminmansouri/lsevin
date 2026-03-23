import { DashboardLayout, StatCard } from '../../design-system/dashboard-components';
import { 
  LayoutDashboard,
  Calendar,
  MapPin,
  DollarSign,
  Image,
  Star,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
  Plane,
  Package,
  TrendingUp
} from 'lucide-react';

export default function TourismDashboard() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/tourism/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/tourism/bookings', badge: 15 },
    { label: 'Tour Packages', icon: <Package size={20} />, path: '/provider/tourism/packages' },
    { label: 'Destinations', icon: <MapPin size={20} />, path: '/provider/tourism/destinations' },
    { label: 'Transfer Services', icon: <Plane size={20} />, path: '/provider/tourism/transfers' },
    { label: 'Schedule', icon: <Calendar size={20} />, path: '/provider/tourism/schedule' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/tourism/pricing' },
    { label: 'Media', icon: <Image size={20} />, path: '/provider/tourism/media' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/tourism/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/tourism/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/tourism/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/tourism/settings' },
  ];
  
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Tourism Dashboard"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-cyan-600 to-sky-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, Marco!</h2>
            <p className="text-white/80 mb-4">Your tour operations overview</p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold">64</div>
                <div className="text-sm text-white/80">Active Tours</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">15</div>
                <div className="text-sm text-white/80">Today's Departures</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">4.9</div>
                <div className="text-sm text-white/80">Guest Rating</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold text-sm mb-2">
              Premium Partner
            </div>
            <div className="text-sm text-white/80">Licensed Operator</div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Monthly Revenue"
          value="$89,200"
          change={{ value: '+31.2%', trend: 'up' }}
          icon={<DollarSign size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Total Bookings"
          value="428"
          change={{ value: '+24', trend: 'up' }}
          icon={<Calendar size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Active Packages"
          value="32"
          change={{ value: '+4', trend: 'up' }}
          icon={<Package size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Fleet Utilization"
          value="87%"
          icon={<TrendingUp size={20} className="text-cyan-600" />}
          color="bg-cyan-50"
        />
      </div>
      
      {/* Charts Row */}
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
        
        {/* Popular Packages */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Top Selling Packages</h3>
          <div className="space-y-4">
            {[
              { name: 'Ubud Cultural Tour', bookings: 124, revenue: '$31,000', color: 'bg-cyan-500', percentage: 80 },
              { name: 'Beach Hopping Adventure', bookings: 98, revenue: '$24,500', color: 'bg-blue-500', percentage: 65 },
              { name: 'Volcano Sunrise Trek', bookings: 76, revenue: '$19,000', color: 'bg-purple-500', percentage: 50 },
              { name: 'Snorkeling Package', bookings: 54, revenue: '$13,500', color: 'bg-green-500', percentage: 35 },
            ].map(pkg => (
              <div key={pkg.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{pkg.name}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{pkg.revenue}</div>
                    <div className="text-xs text-gray-500">{pkg.bookings} bookings</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${pkg.color}`}
                    style={{ width: `${pkg.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Today's Schedule & Fleet Status */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Today's Departures */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Today's Departures</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View Full Schedule</button>
          </div>
          
          <div className="space-y-3">
            {[
              { time: '06:00', tour: 'Volcano Sunrise Trek', guide: 'Ketut Bali', guests: 12, vehicle: 'Van #3', status: 'departed' },
              { time: '08:00', tour: 'Ubud Cultural Tour', guide: 'Made Wirawan', guests: 8, vehicle: 'Van #1', status: 'boarding' },
              { time: '09:30', tour: 'Beach Hopping', guide: 'Wayan Sari', guests: 6, vehicle: 'Van #5', status: 'ready' },
              { time: '11:00', tour: 'Temple Tour', guide: 'Nyoman Adi', guests: 10, vehicle: 'Van #2', status: 'scheduled' },
              { time: '14:00', tour: 'Snorkeling Package', guide: 'Putu Rai', guests: 14, vehicle: 'Van #4', status: 'scheduled' },
            ].map((departure, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <div className="text-center min-w-[60px]">
                  <div className="text-sm font-bold text-[#083f30]">{departure.time}</div>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">{departure.tour}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {departure.guide} • {departure.guests} guests • {departure.vehicle}
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  departure.status === 'departed' ? 'bg-green-100 text-green-700' :
                  departure.status === 'boarding' ? 'bg-orange-100 text-orange-700' :
                  departure.status === 'ready' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {departure.status === 'departed' ? 'Departed' :
                   departure.status === 'boarding' ? 'Boarding' :
                   departure.status === 'ready' ? 'Ready' : 'Scheduled'}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Fleet Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-6">Fleet Status</h3>
          
          <div className="space-y-4">
            {[
              { vehicle: 'Van #1 - Toyota Hiace', status: 'on-tour', tour: 'Ubud Cultural Tour', driver: 'Made Wirawan', location: 'Ubud', eta: '16:30' },
              { vehicle: 'Van #2 - Mercedes Sprinter', status: 'available', tour: null, driver: 'Nyoman Adi', location: 'Base', eta: null },
              { vehicle: 'Van #3 - Toyota Hiace', status: 'on-tour', tour: 'Volcano Sunrise', driver: 'Ketut Bali', location: 'Mount Batur', eta: '12:00' },
              { vehicle: 'Van #4 - Ford Transit', status: 'maintenance', tour: null, driver: null, location: 'Workshop', eta: 'Tomorrow' },
              { vehicle: 'Van #5 - Mercedes Sprinter', status: 'ready', tour: 'Beach Hopping (09:30)', driver: 'Wayan Sari', location: 'Base', eta: null },
            ].map((fleet, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-2 ${
                fleet.status === 'on-tour' ? 'bg-blue-50 border-blue-200' :
                fleet.status === 'available' ? 'bg-green-50 border-green-200' :
                fleet.status === 'ready' ? 'bg-orange-50 border-orange-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{fleet.vehicle}</div>
                    {fleet.driver && (
                      <div className="text-sm text-gray-600 mt-1">{fleet.driver}</div>
                    )}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    fleet.status === 'on-tour' ? 'bg-blue-100 text-blue-700' :
                    fleet.status === 'available' ? 'bg-green-100 text-green-700' :
                    fleet.status === 'ready' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {fleet.status.replace('-', ' ')}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} />
                    {fleet.location}
                  </div>
                  {fleet.eta && (
                    <div>Return: {fleet.eta}</div>
                  )}
                </div>
                {fleet.tour && (
                  <div className="text-xs text-gray-700 mt-2 font-medium">{fleet.tour}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Destination Performance & Upcoming Tours */}
      <div className="grid grid-cols-2 gap-6">
        {/* Destination Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Destination Performance</h3>
            <select className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>This Month</option>
              <option>Last Month</option>
              <option>Last 3 Months</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {[
              { destination: 'Ubud', tours: 124, revenue: '$31,000', rating: 4.9, color: 'bg-purple-500', percentage: 85 },
              { destination: 'Seminyak', tours: 98, revenue: '$24,500', rating: 4.8, color: 'bg-blue-500', percentage: 70 },
              { destination: 'Nusa Penida', tours: 76, revenue: '$19,000', rating: 4.9, color: 'bg-cyan-500', percentage: 55 },
              { destination: 'Tanah Lot', tours: 54, revenue: '$13,500', rating: 4.7, color: 'bg-green-500', percentage: 40 },
            ].map(dest => (
              <div key={dest.destination}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{dest.destination}</span>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={12} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-xs text-gray-600">{dest.rating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{dest.revenue}</div>
                    <div className="text-xs text-gray-500">{dest.tours} tours</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${dest.color}`}
                    style={{ width: `${dest.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Recent Bookings */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Recent Bookings</h3>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-4">
            {[
              { guest: 'Emma Johnson', package: 'Volcano Sunrise Trek', date: 'Mar 15', guests: 2, value: '$250', time: '2 hours ago' },
              { guest: 'Carlos Rodriguez', package: 'Beach Hopping Adventure', date: 'Mar 16', guests: 4, value: '$500', time: '4 hours ago' },
              { guest: 'Yuki Tanaka', package: 'Ubud Cultural Tour', date: 'Mar 17', guests: 2, value: '$250', time: '6 hours ago' },
              { guest: 'Sophie Martin', package: 'Snorkeling Package', date: 'Mar 18', guests: 3, value: '$375', time: '1 day ago' },
            ].map((booking, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{booking.guest}</div>
                    <div className="text-sm text-gray-600 mt-1">{booking.package}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{booking.value}</div>
                    <div className="text-xs text-gray-500">{booking.guests} guests</div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                  <div>Tour Date: {booking.date}</div>
                  <div>{booking.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
