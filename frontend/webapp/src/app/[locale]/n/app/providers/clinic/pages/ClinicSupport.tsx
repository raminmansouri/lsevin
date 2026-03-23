
"use client"
import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Plus, Search,
  HelpCircle, FileText, Video, Mail, Phone, Clock, AlertCircle, CheckCircle, X
} from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  created: string;
  lastReply: string;
}

export default function ClinicSupport() {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

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

  const tickets: Ticket[] = [
    {
      id: 'TKT-1234',
      subject: 'Issue with booking calendar sync',
      category: 'Technical',
      status: 'in-progress',
      priority: 'high',
      created: '2024-03-10 09:30',
      lastReply: '2 hours ago'
    },
    {
      id: 'TKT-1233',
      subject: 'Question about premium features',
      category: 'Billing',
      status: 'resolved',
      priority: 'medium',
      created: '2024-03-09 14:20',
      lastReply: '1 day ago'
    },
    {
      id: 'TKT-1232',
      subject: 'Need help with doctor profile setup',
      category: 'Account',
      status: 'open',
      priority: 'low',
      created: '2024-03-08 11:15',
      lastReply: '2 days ago'
    },
  ];

  const helpResources = [
    { icon: FileText, title: 'Documentation', desc: 'Detailed guides and tutorials', link: '#' },
    { icon: Video, title: 'Video Tutorials', desc: 'Step-by-step video guides', link: '#' },
    { icon: HelpCircle, title: 'FAQ', desc: 'Frequently asked questions', link: '#' },
    { icon: MessageSquare, title: 'Community Forum', desc: 'Connect with other providers', link: '#' },
  ];

  const filteredTickets = tickets.filter(ticket => 
    statusFilter === 'all' || ticket.status === statusFilter
  );

  const statusConfig = {
    open: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Open' },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    resolved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Resolved' },
  };

  const priorityConfig = {
    low: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Low' },
    medium: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Medium' },
    high: { bg: 'bg-red-100', text: 'text-red-700', label: 'High' },
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Support Center"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
            <p className="text-gray-600 mt-1">Get help and manage support tickets</p>
          </div>
          <button className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
            <Plus size={18} />
            New Support Ticket
          </button>
        </div>

        {/* Quick Contact */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Mail size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
            <p className="text-sm text-gray-600 mb-3">We typically respond within 24 hours</p>
            <a href="mailto:support@lsevin.com" className="text-sm font-medium text-[#083f30] hover:underline">
              support@lsevin.com
            </a>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
              <Phone size={24} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Phone Support</h3>
            <p className="text-sm text-gray-600 mb-3">Mon-Fri, 9:00 AM - 6:00 PM GST</p>
            <a href="tel:+97144567890" className="text-sm font-medium text-[#083f30] hover:underline">
              +971 4 456 7890
            </a>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
              <Clock size={24} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Response Time</h3>
            <p className="text-sm text-gray-600 mb-3">Average response time</p>
            <p className="text-sm font-medium text-[#083f30]">2-4 hours</p>
          </div>
        </div>

        {/* Help Resources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Help Resources</h3>
          <div className="grid grid-cols-4 gap-4">
            {helpResources.map((resource, idx) => {
              const Icon = resource.icon;
              return (
                <a 
                  key={idx}
                  href={resource.link}
                  className="p-4 border border-gray-200 rounded-lg hover:border-[#083f30] hover:bg-gray-50 transition group"
                >
                  <Icon size={24} className="text-gray-600 group-hover:text-[#083f30] mb-2" />
                  <div className="font-medium text-gray-900 mb-1">{resource.title}</div>
                  <div className="text-sm text-gray-600">{resource.desc}</div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              />
            </div>
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>All Categories</option>
              <option>Technical</option>
              <option>Billing</option>
              <option>Account</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>All Priority</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Last Reply</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTickets.map(ticket => (
                <tr 
                  key={ticket.id}
                  className="hover:bg-gray-50 transition cursor-pointer"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm text-gray-900">{ticket.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{ticket.subject}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      {ticket.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${priorityConfig[ticket.priority].bg} ${priorityConfig[ticket.priority].text}`}>
                      {priorityConfig[ticket.priority].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig[ticket.status].bg} ${statusConfig[ticket.status].text}`}>
                      {statusConfig[ticket.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{ticket.created}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">{ticket.lastReply}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(ticket);
                      }}
                      className="text-sm font-medium text-[#083f30] hover:underline"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end" onClick={() => setSelectedTicket(null)}>
          <div className="w-[600px] h-full bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Ticket Details</h3>
                <p className="text-sm text-gray-500 font-mono">{selectedTicket.id}</p>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status & Priority */}
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusConfig[selectedTicket.status].bg} ${statusConfig[selectedTicket.status].text}`}>
                  {statusConfig[selectedTicket.status].label}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${priorityConfig[selectedTicket.priority].bg} ${priorityConfig[selectedTicket.priority].text}`}>
                  {priorityConfig[selectedTicket.priority].label} Priority
                </span>
              </div>

              {/* Subject */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Subject</h4>
                <p className="text-gray-700">{selectedTicket.subject}</p>
              </div>

              {/* Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Details</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium text-gray-900">{selectedTicket.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created</span>
                    <span className="font-medium text-gray-900">{selectedTicket.created}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Last Reply</span>
                    <span className="font-medium text-gray-900">{selectedTicket.lastReply}</span>
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Conversation</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-[#083f30] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        You
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">You</div>
                        <div className="text-xs text-gray-500">{selectedTicket.created}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      I'm experiencing issues with the booking calendar sync. The appointments are not showing up correctly...
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        S
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Support Team</div>
                        <div className="text-xs text-gray-500">2 hours ago</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      Thank you for reaching out. We're looking into this issue and will get back to you shortly with a solution.
                    </p>
                  </div>
                </div>
              </div>

              {/* Reply Box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Add Reply</label>
                <textarea
                  className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  placeholder="Type your message..."
                />
                <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition mt-3">
                  Send Reply
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <button className="w-full h-10 border border-green-200 text-green-600 rounded-lg font-medium hover:bg-green-50 transition flex items-center justify-center gap-2">
                  <CheckCircle size={16} />
                  Mark as Resolved
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
