<<<<<<< HEAD
import { getNotificationsPageData, parseNotificationsFilters } from "./notifications.data";
import NotificationsClient from "./NotificationsClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};
  const filters = parseNotificationsFilters(resolvedSearchParams);
  const data = await getNotificationsPageData({ locale, filters });

  return <NotificationsClient {...data} filters={filters} />;
=======
"use client"

import { useState } from 'react';
import { useNavigate } from '@/hooks/use-navigate';
import { ChevronLeft, Calendar, Tag, MessageCircle, Bell } from 'lucide-react';

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  
  const notifications = [
    {
      id: 1,
      type: 'booking',
      icon: Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Appointment Confirmed',
      message: 'Your appointment with Dr. Sarah Johnson is confirmed for March 15, 2026 at 10:00 AM',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      type: 'offer',
      icon: Tag,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      title: '25% Off Dental Checkup',
      message: 'Special offer at Dubai Healthcare City Clinic. Book now and save!',
      time: '5 hours ago',
      read: false,
    },
    {
      id: 3,
      type: 'booking',
      icon: Calendar,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Appointment Reminder',
      message: 'Your spa appointment is tomorrow at 3:00 PM. Please arrive 10 minutes early.',
      time: '1 day ago',
      read: true,
    },
    {
      id: 4,
      type: 'system',
      icon: MessageCircle,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      title: 'New Message from Support',
      message: 'We\'ve responded to your inquiry about booking cancellation.',
      time: '2 days ago',
      read: true,
    },
  ];
  
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'booking', label: 'Bookings' },
    { id: 'offer', label: 'Offers' },
    { id: 'system', label: 'System' },
  ];
  
  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === activeTab);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/app/profile')}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-gray-600"
            >
              <ChevronLeft size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600">{unreadCount} unread</p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button className="text-sm font-medium text-[#083f30]">Mark all read</button>
          )}
        </div>
        
        {/* Tabs */}
        <div className="px-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'bg-[#083f30] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl border p-4 ${
                    notification.read ? 'border-gray-200' : 'border-[#083f30] bg-[#083f30]/5'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`w-12 h-12 ${notification.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon size={24} className={notification.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="font-bold text-gray-900">{notification.title}</h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-[#083f30] rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-2">{notification.message}</p>
                      <p className="text-xs text-gray-500">{notification.time}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
}
