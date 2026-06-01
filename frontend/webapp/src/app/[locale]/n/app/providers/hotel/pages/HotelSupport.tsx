"use client"

import { useTranslations } from "next-intl";

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles,
  Plus, HelpCircle
} from 'lucide-react';

export default function HotelSupport() {
  const t = useTranslations("SupportPages.providerGenerated");
  const navigation = [
    { label: t("navigation.dashboard"), icon: <LayoutDashboard size={20} />, path: '/provider/hotel/dashboard' },
    { label: t("navigation.bookings"), icon: <Calendar size={20} />, path: '/provider/hotel/bookings', badge: 12 },
    { label: t("navigation.roomInventory"), icon: <Bed size={20} />, path: '/provider/hotel/rooms' },
    { label: t("navigation.roomCategories"), icon: <Hotel size={20} />, path: '/provider/hotel/categories' },
    { label: t("navigation.amenities"), icon: <Sparkles size={20} />, path: '/provider/hotel/amenities' },
    { label: t("navigation.pricing"), icon: <DollarSign size={20} />, path: '/provider/hotel/pricing' },
    { label: t("navigation.availability"), icon: <Calendar size={20} />, path: '/provider/hotel/availability' },
    { label: t("navigation.gallery"), icon: <Image size={20} />, path: '/provider/hotel/gallery' },
    { label: t("navigation.reviews"), icon: <Star size={20} />, path: '/provider/hotel/reviews' },
    { label: t("navigation.analytics"), icon: <BarChart3 size={20} />, path: '/provider/hotel/analytics' },
    { label: t("navigation.billing"), icon: <CreditCard size={20} />, path: '/provider/hotel/billing' },
    { label: t("navigation.support"), icon: <MessageSquare size={20} />, path: '/provider/hotel/support' },
    { label: t("navigation.settings"), icon: <Settings size={20} />, path: '/provider/hotel/settings' },
  ];

  const tickets = [
    { id: 'TKT-3948', subject: t("tickets.roomSyncIssue"), category: t("categories.technical"), priority: 'high', status: 'open', lastReply: t("relativeTime.twoHoursAgo") },
    { id: 'TKT-3947', subject: t("tickets.bookingConfirmationProblem"), category: t("categories.bookings"), priority: 'medium', status: 'in-progress', lastReply: t("relativeTime.fiveHoursAgo") },
    { id: 'TKT-3946', subject: t("tickets.paymentSettlementQuestion"), category: t("categories.billing"), priority: 'low', status: 'resolved', lastReply: t("relativeTime.oneDayAgo") },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle={t("supportCenter")}
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{t("supportTickets")}</h3>
        <button className="h-10 px-4 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] flex items-center gap-2">
          <Plus size={18} />{t("newTicket")}</button>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{t("open")}</div>
          <div className="text-2xl font-bold text-gray-900">1</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{t("inProgress")}</div>
          <div className="text-2xl font-bold text-blue-900">1</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">{t("resolved")}</div>
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
                    {t(`status.${ticket.status.replaceAll("-", "_")}`).toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    ticket.priority === 'high' ? 'bg-red-50 text-red-700' :
                    ticket.priority === 'medium' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {t(`priority.${ticket.priority}`).toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded">
                    {ticket.category}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{ticket.subject}</h4>
                <p className="text-sm text-gray-600">{t("lastReply")}: {ticket.lastReply}</p>
              </div>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">{t("viewDetails")}</button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border-2 border-indigo-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <HelpCircle size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">{t("needHelp")}</h3>
            <p className="text-sm text-gray-700 mb-4">{t("hotelHelpCenterDescription")}</p>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">{t("visitHelpCenter")}</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
