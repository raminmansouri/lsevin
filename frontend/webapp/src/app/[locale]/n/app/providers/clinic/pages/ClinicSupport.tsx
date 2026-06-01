
"use client"

import { useTranslations } from "next-intl";
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
  const t = useTranslations("SupportPages.providerGenerated");
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

  const navigation = [
    { label: t("navigation.dashboard"), icon: <LayoutDashboard size={20} />, path: '/provider/clinic/dashboard' },
    { label: t("navigation.bookings"), icon: <Calendar size={20} />, path: '/provider/clinic/bookings', badge: 5 },
    { label: t("navigation.doctors"), icon: <Users size={20} />, path: '/provider/clinic/doctors' },
    { label: t("navigation.treatments"), icon: <Stethoscope size={20} />, path: '/provider/clinic/treatments' },
    { label: t("navigation.pricing"), icon: <DollarSign size={20} />, path: '/provider/clinic/pricing' },
    { label: t("navigation.availability"), icon: <Calendar size={20} />, path: '/provider/clinic/availability' },
    { label: t("navigation.mediaGallery"), icon: <Image size={20} />, path: '/provider/clinic/media' },
    { label: t("navigation.reviews"), icon: <Star size={20} />, path: '/provider/clinic/reviews' },
    { label: t("navigation.promotions"), icon: <TrendingUp size={20} />, path: '/provider/clinic/promotions' },
    { label: t("navigation.analytics"), icon: <BarChart3 size={20} />, path: '/provider/clinic/analytics' },
    { label: t("navigation.billing"), icon: <CreditCard size={20} />, path: '/provider/clinic/billing' },
    { label: t("navigation.support"), icon: <MessageSquare size={20} />, path: '/provider/clinic/support' },
    { label: t("navigation.settings"), icon: <Settings size={20} />, path: '/provider/clinic/settings' },
  ];

  const tickets: Ticket[] = [
    {
      id: 'TKT-1234',
      subject: t("tickets.issueWithBookingCalendarSync"),
      category: t("categories.technical"),
      status: 'in-progress',
      priority: 'high',
      created: '2024-03-10 09:30',
      lastReply: t("relativeTime.twoHoursAgo")
    },
    {
      id: 'TKT-1233',
      subject: t("tickets.questionAboutPremiumFeatures"),
      category: t("categories.billing"),
      status: 'resolved',
      priority: 'medium',
      created: '2024-03-09 14:20',
      lastReply: t("relativeTime.oneDayAgo")
    },
    {
      id: 'TKT-1232',
      subject: t("tickets.needHelpWithDoctorProfileSetup"),
      category: t("categories.account"),
      status: 'open',
      priority: 'low',
      created: '2024-03-08 11:15',
      lastReply: t("relativeTime.twoDaysAgo")
    },
  ];

  const helpResources = [
    { icon: FileText, title: t("documentation"), desc: t("detailedGuidesAndTutorials"), link: '#' },
    { icon: Video, title: t("videoTutorials"), desc: t("stepByStepVideoGuides"), link: '#' },
    { icon: HelpCircle, title: t("faq"), desc: t("frequentlyAskedQuestions"), link: '#' },
    { icon: MessageSquare, title: t("communityForum"), desc: t("connectWithOtherProviders"), link: '#' },
  ];

  const filteredTickets = tickets.filter(ticket => 
    statusFilter === 'all' || ticket.status === statusFilter
  );

  const statusConfig = {
    open: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t("open") },
    'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', label: t("inProgress") },
    resolved: { bg: 'bg-green-100', text: 'text-green-700', label: t("resolved") },
  };

  const priorityConfig = {
    low: { bg: 'bg-gray-100', text: 'text-gray-700', label: t("priority.low") },
    medium: { bg: 'bg-orange-100', text: 'text-orange-700', label: t("priority.medium") },
    high: { bg: 'bg-red-100', text: 'text-red-700', label: t("priority.high") },
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle={t("supportCenter")}
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("supportCenter")}</h1>
            <p className="text-gray-600 mt-1">{t("supportCenterDescription")}</p>
          </div>
          <button className="px-4 py-2.5 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition flex items-center gap-2">
            <Plus size={18} />{t("newSupportTicket")}</button>
        </div>

        {/* Quick Contact */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Mail size={24} className="text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t("emailSupport")}</h3>
            <p className="text-sm text-gray-600 mb-3">{t("respondWithin24Hours")}</p>
            <a href="mailto:support@lsevin.com" className="text-sm font-medium text-[#083f30] hover:underline">
              support@lsevin.com
            </a>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
              <Phone size={24} className="text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t("phoneSupport")}</h3>
            <p className="text-sm text-gray-600 mb-3">{t("phoneHours")}</p>
            <a href="tel:+97144567890" className="text-sm font-medium text-[#083f30] hover:underline">
              +971 4 456 7890
            </a>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
              <Clock size={24} className="text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t("responseTime")}</h3>
            <p className="text-sm text-gray-600 mb-3">{t("averageResponseTime")}</p>
            <p className="text-sm font-medium text-[#083f30]">{t("twoToFourHours")}</p>
          </div>
        </div>

        {/* Help Resources */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{t("helpResources")}</h3>
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
                placeholder={t("searchTickets")}
                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              />
            </div>
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">{t("allStatus")}</option>
              <option value="open">{t("open")}</option>
              <option value="in-progress">{t("inProgress")}</option>
              <option value="resolved">{t("resolved")}</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>{t("allCategories")}</option>
              <option>{t("categories.technical")}</option>
              <option>{t("categories.billing")}</option>
              <option>{t("categories.account")}</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>{t("allPriority")}</option>
              <option>{t("priority.high")}</option>
              <option>{t("priority.medium")}</option>
              <option>{t("priority.low")}</option>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t("ticketId")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t("subject")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t("categoryLabel")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t("priorityLabel")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t("statusLabel")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t("created")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t("lastReply")}</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{t("actionsLabel")}</th>
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
                    >{t("view")}</button>
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
                <h3 className="font-bold text-gray-900">{t("ticketDetails")}</h3>
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
                  {priorityConfig[selectedTicket.priority].label} {t("priorityLabel")}
                </span>
              </div>

              {/* Subject */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t("subject")}</h4>
                <p className="text-gray-700">{selectedTicket.subject}</p>
              </div>

              {/* Details */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t("details")}</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t("categoryLabel")}</span>
                    <span className="font-medium text-gray-900">{selectedTicket.category}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t("created")}</span>
                    <span className="font-medium text-gray-900">{selectedTicket.created}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{t("lastReply")}</span>
                    <span className="font-medium text-gray-900">{selectedTicket.lastReply}</span>
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t("conversation")}</h4>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-[#083f30] rounded-full flex items-center justify-center text-white text-sm font-semibold">{t("you")}</div>
                      <div>
                        <div className="font-medium text-gray-900">{t("you")}</div>
                        <div className="text-xs text-gray-500">{selectedTicket.created}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      {t("mockConversation.customerBookingCalendarIssue")}
                    </p>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        S
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{t("supportTeam")}</div>
                        <div className="text-xs text-gray-500">{t("relativeTime.twoHoursAgo")}</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">
                      {t("mockConversation.supportLookingIntoIssue")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Reply Box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t("addReply")}</label>
                <textarea
                  className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  placeholder={t("typeYourMessage")}
                />
                <button className="w-full h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition mt-3">{t("sendReply")}</button>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200">
                <button className="w-full h-10 border border-green-200 text-green-600 rounded-lg font-medium hover:bg-green-50 transition flex items-center justify-center gap-2">
                  <CheckCircle size={16} />{t("markAsResolved")}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
