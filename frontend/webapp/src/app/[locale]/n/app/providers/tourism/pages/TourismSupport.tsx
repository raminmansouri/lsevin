import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MapPin, DollarSign, Image, BarChart3, CreditCard, MessageSquare, Settings, Plane, Package,
  Plus, HelpCircle
} from 'lucide-react';

export default function TourismSupport() {
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

  const tickets = [
    { id: 'TKT-5621', subject: 'Package sync issue', category: 'Technical', priority: 'high', status: 'open', lastReply: '1 hour ago' },
    { id: 'TKT-5620', subject: 'Transfer booking error', category: 'Bookings', priority: 'medium', status: 'in-progress', lastReply: '3 hours ago' },
    { id: 'TKT-5619', subject: 'Payment settlement question', category: 'Billing', priority: 'low', status: 'resolved', lastReply: '1 day ago' },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Support Center"
      userRole="provider"
      userName="Marco Santini"
      providerName="Bali Adventures Tours"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Support Tickets</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />
          New Ticket
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Open</div>
          <div className="text-2xl font-bold text-gray-900">1</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">In Progress</div>
          <div className="text-2xl font-bold text-blue-900">1</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Resolved</div>
          <div className="text-2xl font-bold text-green-900">1</div>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {tickets.map(ticket => (
          <div key={ticket.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono text-sm text-gray-500">{ticket.id}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    ticket.status === 'open' ? 'bg-red-100 text-red-700' :
                    ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {ticket.status.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    ticket.priority === 'high' ? 'bg-red-50 text-red-700' :
                    ticket.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {ticket.priority.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-cyan-50 text-cyan-700 text-xs font-semibold rounded">
                    {ticket.category}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h4>
                <p className="text-sm text-gray-600">Last reply: {ticket.lastReply}</p>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center">
            <HelpCircle size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-700 mb-4">Browse our help center for answers to common questions about tour operations.</p>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Visit Help Center
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
