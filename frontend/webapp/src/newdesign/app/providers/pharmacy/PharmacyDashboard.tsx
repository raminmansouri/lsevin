import { DashboardLayout, StatCard } from '../../design-system/dashboard-components';
import { 
  LayoutDashboard,
  Pill,
  DollarSign,
  Package,
  BarChart3,
  CreditCard,
  MessageSquare,
  Settings,
  Clock,
  FileText,
  Truck,
  Activity
} from 'lucide-react';

export default function PharmacyDashboard() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/pharmacy/dashboard' },
    { label: 'Prescription Inbox', icon: <FileText size={20} />, path: '/provider/pharmacy/prescriptions', badge: 7 },
    { label: 'Medicine Requests', icon: <Pill size={20} />, path: '/provider/pharmacy/requests', badge: 12 },
    { label: 'Orders', icon: <Package size={20} />, path: '/provider/pharmacy/orders' },
    { label: 'Delivery Tracking', icon: <Truck size={20} />, path: '/provider/pharmacy/delivery' },
    { label: 'Inventory', icon: <Package size={20} />, path: '/provider/pharmacy/inventory' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/pharmacy/pricing' },
    { label: 'Operating Hours', icon: <Clock size={20} />, path: '/provider/pharmacy/hours' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/pharmacy/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/pharmacy/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/pharmacy/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/pharmacy/settings' },
  ];
  
  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Pharmacy Dashboard"
      userRole="provider"
      userName="Dr. Sarah Al-Mansoori"
      providerName="HealthPlus Pharmacy"
    >
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Welcome back, Dr. Al-Mansoori!</h2>
            <p className="text-white/80 mb-4">Your pharmacy operations overview</p>
            <div className="flex items-center gap-6">
              <div>
                <div className="text-3xl font-bold">19</div>
                <div className="text-sm text-white/80">Pending Requests</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">8</div>
                <div className="text-sm text-white/80">Active Deliveries</div>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div>
                <div className="text-3xl font-bold">4.9</div>
                <div className="text-sm text-white/80">Service Rating</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold text-sm mb-2">
              Licensed Pharmacy
            </div>
            <div className="text-sm text-white/80">24/7 Service</div>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Daily Revenue"
          value="$4,280"
          change={{ value: '+18.3%', trend: 'up' }}
          icon={<DollarSign size={20} className="text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="Orders Fulfilled"
          value="124"
          change={{ value: '+12', trend: 'up' }}
          icon={<Package size={20} className="text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Prescriptions"
          value="42"
          change={{ value: '+8', trend: 'up' }}
          icon={<FileText size={20} className="text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Active Deliveries"
          value="8"
          icon={<Truck size={20} className="text-orange-600" />}
          color="bg-orange-50"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Prescription Inbox */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Prescription Inbox</h3>
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">7 New</span>
            </div>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-3">
            {[
              { patient: 'Ahmed Hassan', doctor: 'Dr. Khalil', medicines: 3, submitted: '15 min ago', status: 'pending', urgent: true },
              { patient: 'Fatima Al-Said', doctor: 'Dr. Rahman', medicines: 2, submitted: '32 min ago', status: 'pending', urgent: false },
              { patient: 'Omar Youssef', doctor: 'Dr. Khan', medicines: 4, submitted: '1 hour ago', status: 'processing', urgent: false },
              { patient: 'Layla Ibrahim', doctor: 'Dr. Ahmed', medicines: 1, submitted: '2 hours ago', status: 'ready', urgent: false },
            ].map((prescription, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-2 ${
                prescription.status === 'pending' && prescription.urgent ? 'bg-red-50 border-red-200' :
                prescription.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                prescription.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                'bg-green-50 border-green-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{prescription.patient}</div>
                      {prescription.urgent && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded">URGENT</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Prescribed by {prescription.doctor}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    prescription.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {prescription.status}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <div>{prescription.medicines} medicines</div>
                  <div>{prescription.submitted}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button className="flex-1 py-1.5 px-3 bg-[#083f30] text-white rounded-lg text-xs font-medium hover:bg-[#083f30]/90 transition">
                    Review
                  </button>
                  {prescription.status === 'ready' && (
                    <button className="flex-1 py-1.5 px-3 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition">
                      Complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Medicine Requests */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Medicine Requests</h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">12 Pending</span>
            </div>
            <button className="text-sm font-medium text-[#083f30] hover:underline">View All</button>
          </div>
          
          <div className="space-y-3">
            {[
              { patient: 'Sara Ahmed', medicine: 'Paracetamol 500mg', quantity: '30 tablets', submitted: '10 min ago', status: 'pending' },
              { patient: 'Mohammed Ali', medicine: 'Amoxicillin 250mg', quantity: '20 capsules', submitted: '25 min ago', status: 'quoted' },
              { patient: 'Noor Hassan', medicine: 'Omeprazole 20mg', quantity: '28 tablets', submitted: '45 min ago', status: 'pending' },
              { patient: 'Tariq Rahman', medicine: 'Metformin 500mg', quantity: '60 tablets', submitted: '1 hour ago', status: 'confirmed' },
            ].map((request, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                request.status === 'confirmed' ? 'bg-green-50 border-green-200' :
                request.status === 'quoted' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-gray-900">{request.patient}</div>
                    <div className="text-sm text-gray-700 mt-1 font-medium">{request.medicine}</div>
                    <div className="text-xs text-gray-600 mt-1">{request.quantity}</div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    request.status === 'quoted' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {request.status}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mb-3">{request.submitted}</div>
                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Enter price" 
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs"
                    />
                    <button className="px-4 py-1.5 bg-[#083f30] text-white rounded-lg text-xs font-medium hover:bg-[#083f30]/90 transition">
                      Quote
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Delivery Status & Recent Orders */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Active Deliveries */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Active Deliveries</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Live Tracking</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {[
              { orderId: '#PHR-2847', customer: 'Ahmed Hassan', driver: 'Khalid Mohammed', location: 'Al Barsha', eta: '12 min', status: 'in-transit' },
              { orderId: '#PHR-2846', customer: 'Fatima Al-Said', driver: 'Omar Youssef', location: 'JBR', eta: '8 min', status: 'nearby' },
              { orderId: '#PHR-2845', customer: 'Sara Ahmed', driver: 'Hassan Ali', location: 'Marina', eta: '18 min', status: 'in-transit' },
              { orderId: '#PHR-2844', customer: 'Mohammed Ali', driver: 'Tariq Rahman', location: 'Downtown', eta: '25 min', status: 'picked-up' },
            ].map((delivery, idx) => (
              <div key={idx} className={`p-4 rounded-lg border-2 ${
                delivery.status === 'nearby' ? 'bg-green-50 border-green-200' :
                delivery.status === 'in-transit' ? 'bg-blue-50 border-blue-200' :
                'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-900">{delivery.orderId}</div>
                      <div className={`w-2 h-2 rounded-full ${
                        delivery.status === 'nearby' ? 'bg-green-500' :
                        delivery.status === 'in-transit' ? 'bg-blue-500' :
                        'bg-orange-500'
                      } animate-pulse`} />
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{delivery.customer}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">ETA {delivery.eta}</div>
                    <div className={`text-xs mt-1 ${
                      delivery.status === 'nearby' ? 'text-green-600' :
                      delivery.status === 'in-transit' ? 'text-blue-600' :
                      'text-orange-600'
                    }`}>
                      {delivery.status === 'nearby' ? 'Arriving Soon' :
                       delivery.status === 'in-transit' ? 'In Transit' : 'Picked Up'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600 mt-2">
                  <div className="flex items-center gap-1">
                    <Truck size={12} />
                    {delivery.driver}
                  </div>
                  <div>{delivery.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Order Statistics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-gray-900">Today's Statistics</h3>
            <select className="h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
              <option>Today</option>
              <option>Yesterday</option>
              <option>This Week</option>
            </select>
          </div>
          
          <div className="space-y-4">
            {/* Order Status Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">86</div>
                <div className="text-sm text-gray-700 mt-1">Completed</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">24</div>
                <div className="text-sm text-gray-700 mt-1">In Progress</div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">19</div>
                <div className="text-sm text-gray-700 mt-1">Pending</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-600">3</div>
                <div className="text-sm text-gray-700 mt-1">Cancelled</div>
              </div>
            </div>
            
            {/* Top Selling Medicines */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Top Selling Medicines</h4>
              <div className="space-y-3">
                {[
                  { name: 'Paracetamol 500mg', units: 234, color: 'bg-green-500', percentage: 90 },
                  { name: 'Amoxicillin 250mg', units: 186, color: 'bg-blue-500', percentage: 70 },
                  { name: 'Omeprazole 20mg', units: 142, color: 'bg-purple-500', percentage: 55 },
                  { name: 'Metformin 500mg', units: 98, color: 'bg-orange-500', percentage: 40 },
                ].map(med => (
                  <div key={med.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{med.name}</span>
                      <span className="text-sm font-semibold text-gray-900">{med.units} units</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${med.color}`} style={{ width: `${med.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Recent Activity</h3>
        
        <div className="space-y-3">
          {[
            { type: 'prescription', message: 'New prescription from Dr. Khalil for Ahmed Hassan', time: '5 min ago', icon: <FileText size={16} />, color: 'bg-purple-100 text-purple-600' },
            { type: 'delivery', message: 'Order #PHR-2846 delivered successfully to Fatima Al-Said', time: '12 min ago', icon: <Truck size={16} />, color: 'bg-green-100 text-green-600' },
            { type: 'request', message: 'New medicine request: Paracetamol 500mg from Sara Ahmed', time: '18 min ago', icon: <Pill size={16} />, color: 'bg-blue-100 text-blue-600' },
            { type: 'order', message: 'Order #PHR-2845 confirmed - Payment received', time: '25 min ago', icon: <Package size={16} />, color: 'bg-orange-100 text-orange-600' },
            { type: 'prescription', message: 'Prescription #PRX-342 completed and ready for pickup', time: '32 min ago', icon: <FileText size={16} />, color: 'bg-purple-100 text-purple-600' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <div className={`w-8 h-8 rounded-lg ${activity.color} flex items-center justify-center flex-shrink-0`}>
                {activity.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-900">{activity.message}</div>
                <div className="text-xs text-gray-500 mt-1">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
