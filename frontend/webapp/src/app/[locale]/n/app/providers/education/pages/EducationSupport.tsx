"use client"

import { useTranslations } from "next-intl";

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, GraduationCap, DollarSign, BookOpen, BarChart3, CreditCard, MessageSquare, Settings, Award, UserCheck,
  Plus, HelpCircle
} from 'lucide-react';

export default function EducationSupport() {
  const t = useTranslations("SupportPages.providerGenerated");
  const navigation = [
    { label: t("navigation.dashboard"), icon: <LayoutDashboard size={20} />, path: '/provider/education/dashboard' },
    { label: t("navigation.courseCatalog"), icon: <BookOpen size={20} />, path: '/provider/education/courses' },
    { label: t("navigation.registrations"), icon: <UserCheck size={20} />, path: '/provider/education/registrations', badge: 18 },
    { label: t("navigation.students"), icon: <Users size={20} />, path: '/provider/education/students' },
    { label: t("navigation.instructors"), icon: <GraduationCap size={20} />, path: '/provider/education/instructors' },
    { label: t("navigation.classSchedule"), icon: <Calendar size={20} />, path: '/provider/education/schedule' },
    { label: t("navigation.certificates"), icon: <Award size={20} />, path: '/provider/education/certificates' },
    { label: t("navigation.analytics"), icon: <BarChart3 size={20} />, path: '/provider/education/analytics' },
    { label: t("navigation.billing"), icon: <CreditCard size={20} />, path: '/provider/education/billing' },
    { label: t("navigation.support"), icon: <MessageSquare size={20} />, path: '/provider/education/support' },
    { label: t("navigation.settings"), icon: <Settings size={20} />, path: '/provider/education/settings' },
  ];

  const tickets = [
    { id: 'TKT-5821', subject: t("tickets.courseUploadIssue"), category: t("categories.technical"), priority: 'high', status: 'open', lastReply: t("relativeTime.oneHourAgo") },
    { id: 'TKT-5820', subject: t("tickets.studentEnrollmentError"), category: t("categories.system"), priority: 'medium', status: 'in-progress', lastReply: t("relativeTime.threeHoursAgo") },
    { id: 'TKT-5819', subject: t("tickets.billingInquiry"), category: t("categories.billing"), priority: 'low', status: 'resolved', lastReply: t("relativeTime.oneDayAgo") },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle={t("supportCenter")}
      userRole="provider"
      userName="Prof. David Chen"
      providerName="Global Learning Academy"
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
                  <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded">
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

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-600 rounded-full flex items-center justify-center">
            <HelpCircle size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">{t("needHelp")}</h3>
            <p className="text-sm text-gray-700 mb-4">{t("educationHelpCenterDescription")}</p>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">{t("visitHelpCenter")}</button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
