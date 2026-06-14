"use client"

import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Hotel, DollarSign, Image, Star, BarChart3, CreditCard, MessageSquare, Settings, Bed, Sparkles,
  Filter
} from 'lucide-react';

export default function HotelReviews() {
  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/hotel/dashboard' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/hotel/bookings', badge: 12 },
    { label: 'Room Inventory', icon: <Bed size={20} />, path: '/provider/hotel/rooms' },
    { label: 'Room Categories', icon: <Hotel size={20} />, path: '/provider/hotel/categories' },
    { label: 'Amenities', icon: <Sparkles size={20} />, path: '/provider/hotel/amenities' },
    { label: 'Pricing', icon: <DollarSign size={20} />, path: '/provider/hotel/pricing' },
    { label: 'Availability', icon: <Calendar size={20} />, path: '/provider/hotel/availability' },
    { label: 'Gallery', icon: <Image size={20} />, path: '/provider/hotel/gallery' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/hotel/reviews' },
    { label: 'Analytics', icon: <BarChart3 size={20} />, path: '/provider/hotel/analytics' },
    { label: 'Billing', icon: <CreditCard size={20} />, path: '/provider/hotel/billing' },
    { label: 'Support', icon: <MessageSquare size={20} />, path: '/provider/hotel/support' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/hotel/settings' },
  ];

  const reviews = [
    { guest: 'Emma Thompson', rating: 5, room: 'Deluxe Suite', date: '2026-03-08', review: 'Absolutely stunning property! The service was impeccable and the room was beautifully appointed.', replied: true },
    { guest: 'Michael Zhang', rating: 5, room: 'Executive Room', date: '2026-03-07', review: 'Best hotel experience ever. The staff went above and beyond to make our stay memorable.', replied: true },
    { guest: 'Sophie Martin', rating: 4, room: 'Standard Room', date: '2026-03-06', review: 'Great location and facilities. The breakfast spread was excellent.', replied: false },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Guest Reviews"
      userRole="provider"
      userName="Amanda Rodriguez"
      providerName="Grand Palace Hotel"
    >
      <div className="grid grid-cols-5 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Average Rating</div>
          <div className="text-2xl font-bold text-gray-900">4.8</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Total Reviews</div>
          <div className="text-2xl font-bold text-gray-900">342</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">5 Stars</div>
          <div className="text-2xl font-bold text-yellow-900">278</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">4 Stars</div>
          <div className="text-2xl font-bold text-blue-900">52</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="text-sm font-medium text-gray-600 mb-2">Reply Rate</div>
          <div className="text-2xl font-bold text-green-900">94%</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter size={18} className="text-gray-500" />
          <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <option>All Ratings</option>
            <option>5 Stars</option>
            <option>4 Stars</option>
            <option>3 Stars or less</option>
          </select>
          <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <option>All Categories</option>
            <option>Deluxe Suite</option>
            <option>Executive Room</option>
          </select>
          <select className="h-10 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            <option>All Status</option>
            <option>Replied</option>
            <option>Pending Reply</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-semibold text-gray-900 text-lg mb-2">{review.guest}</div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{review.room}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-600">{review.date}</span>
                </div>
              </div>
              {review.replied ? (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                  Replied
                </span>
              ) : (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                  Pending Reply
                </span>
              )}
            </div>

            <p className="text-gray-700 mb-4">{review.review}</p>

            {!review.replied && (
              <button className="px-4 py-2 bg-[#083f30] text-white rounded-lg text-sm font-medium hover:bg-[#0a5a44]">
                Reply to Review
              </button>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
