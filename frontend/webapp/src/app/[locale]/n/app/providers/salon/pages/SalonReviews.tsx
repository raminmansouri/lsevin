"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Scissors, Clock, DollarSign, Gift, Image, Star, TrendingUp, MessageSquare, Settings,
  Reply
} from 'lucide-react';

export default function SalonReviews() {
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

  const reviews = [
    { id: 1, customer: 'Sarah Miller', rating: 5, service: 'Hair Color & Cut', staff: 'Anna', date: '2026-03-08', comment: 'Amazing service! Anna did a fantastic job with my hair.', hasReply: true },
    { id: 2, customer: 'Emma Davis', rating: 5, service: 'Facial Treatment', staff: 'Maria', date: '2026-03-07', comment: 'Best facial I\'ve ever had. Maria is so professional.', hasReply: true },
    { id: 3, customer: 'Lisa Johnson', rating: 5, service: 'Manicure & Pedicure', staff: 'Sofia', date: '2026-03-06', comment: 'Love the atmosphere and the results!', hasReply: false },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} className={i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
    ));
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Reviews & Ratings"
      userRole="provider"
      userName="Maria Santos"
      providerName="Luxury Beauty & Spa"
    >
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
          <div className="text-5xl font-bold text-gray-900 mb-2">4.9</div>
          <div className="flex items-center justify-center gap-1 mb-3">
            {renderStars(5)}
          </div>
          <div className="text-sm text-gray-600">Based on 370 reviews</div>
        </div>

        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[{stars: 5, count: 342, percentage: 92}, {stars: 4, count: 18, percentage: 5}, {stars: 3, count: 8, percentage: 2}, {stars: 2, count: 2, percentage: 1}].map(item => (
              <div key={item.stars} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{item.stars}</span>
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#083f30]" style={{ width: `${item.percentage}%` }} />
                </div>
                <div className="text-sm text-gray-600 w-12 text-right">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="font-semibold text-gray-900">{review.customer}</div>
                  <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{review.service}</span>
                  <span>•</span>
                  <span>with {review.staff}</span>
                  <span>•</span>
                  <span>{review.date}</span>
                </div>
              </div>
              {!review.hasReply && (
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  <Reply size={16} />
                  Reply
                </button>
              )}
            </div>
            <p className="text-gray-700">{review.comment}</p>
            {review.hasReply && (
              <div className="mt-4 ml-6 p-4 bg-gray-50 border-l-4 border-[#083f30] rounded-r-lg">
                <div className="font-semibold text-gray-900 text-sm mb-1">Luxury Beauty & Spa</div>
                <p className="text-sm text-gray-700">Thank you so much for your kind words! We're thrilled you enjoyed your experience.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
