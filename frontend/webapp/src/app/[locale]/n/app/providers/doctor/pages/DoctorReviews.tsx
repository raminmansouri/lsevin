"use client"

import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, MessageSquare, Stethoscope, User, DollarSign, Star, Settings,
  Filter, Search, ThumbsUp, Reply, Flag
} from 'lucide-react';

interface Review {
  id: string;
  patientName: string;
  rating: number;
  date: string;
  service: string;
  reviewText: string;
  hasReply: boolean;
  reply?: string;
  helpful: number;
}

export default function DoctorReviews() {
  const [filterRating, setFilterRating] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const navigation = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/provider/doctor/dashboard' },
    { label: 'My Schedule', icon: <Calendar size={20} />, path: '/provider/doctor/schedule', badge: 3 },
    { label: 'Consultations', icon: <MessageSquare size={20} />, path: '/provider/doctor/consultations' },
    { label: 'Bookings', icon: <Calendar size={20} />, path: '/provider/doctor/bookings' },
    { label: 'My Services', icon: <Stethoscope size={20} />, path: '/provider/doctor/services' },
    { label: 'Profile', icon: <User size={20} />, path: '/provider/doctor/profile' },
    { label: 'Earnings', icon: <DollarSign size={20} />, path: '/provider/doctor/earnings' },
    { label: 'Reviews', icon: <Star size={20} />, path: '/provider/doctor/reviews' },
    { label: 'Settings', icon: <Settings size={20} />, path: '/provider/doctor/settings' },
  ];

  const reviews: Review[] = [
    {
      id: '1',
      patientName: 'Sarah Anderson',
      rating: 5,
      date: '2026-03-08',
      service: 'Initial Cardiology Consultation',
      reviewText: 'Dr. Williams was incredibly thorough and took the time to explain everything in detail. She made me feel at ease and answered all my questions. Highly recommend!',
      hasReply: true,
      reply: 'Thank you so much for your kind words! It was a pleasure helping you with your cardiac health.',
      helpful: 12
    },
    {
      id: '2',
      patientName: 'Michael Chen',
      rating: 5,
      date: '2026-03-05',
      service: 'Follow-up Consultation',
      reviewText: 'Excellent doctor with great bedside manner. Very knowledgeable and caring. The follow-up was comprehensive and I felt well cared for.',
      hasReply: true,
      reply: 'I appreciate your feedback! Looking forward to seeing you at your next appointment.',
      helpful: 8
    },
    {
      id: '3',
      patientName: 'Emma Wilson',
      rating: 4,
      date: '2026-03-02',
      service: 'Video Consultation',
      reviewText: 'Great consultation overall. The video call was clear and Dr. Williams was very professional. Would have liked a bit more time for questions.',
      hasReply: false,
      helpful: 5
    },
    {
      id: '4',
      patientName: 'James Taylor',
      rating: 5,
      date: '2026-02-28',
      service: 'Cardiac Stress Test Review',
      reviewText: 'Dr. Williams explained my test results clearly and provided excellent guidance on next steps. Very happy with the care I received.',
      hasReply: true,
      reply: 'Thank you! Please don\'t hesitate to reach out if you have any questions.',
      helpful: 15
    },
    {
      id: '5',
      patientName: 'Lisa Brown',
      rating: 5,
      date: '2026-02-25',
      service: 'Initial Consultation',
      reviewText: 'Outstanding experience! Dr. Williams is clearly an expert in her field. She took the time to understand my concerns and provided a clear treatment plan.',
      hasReply: true,
      reply: 'I\'m so glad I could help! Wishing you the best on your health journey.',
      helpful: 10
    },
  ];

  const ratingDistribution = [
    { stars: 5, count: 142, percentage: 85 },
    { stars: 4, count: 18, percentage: 11 },
    { stars: 3, count: 5, percentage: 3 },
    { stars: 2, count: 1, percentage: 0.6 },
    { stars: 1, count: 1, percentage: 0.4 },
  ];

  const totalReviews = ratingDistribution.reduce((sum, item) => sum + item.count, 0);
  const averageRating = 4.9;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}
      />
    ));
  };

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Reviews & Ratings"
      userRole="provider"
      userName="Dr. Sarah Williams"
      providerName="Specialist - Cardiology"
    >
      {/* Summary Section */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Overall Rating */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">{averageRating}</div>
            <div className="flex items-center justify-center gap-1 mb-3">
              {renderStars(5)}
            </div>
            <div className="text-sm text-gray-600">Based on {totalReviews} reviews</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {ratingDistribution.map(item => (
              <div key={item.stars} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium text-gray-900">{item.stars}</span>
                  <Star size={14} className="text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#083f30] rounded-full transition-all duration-300"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="text-sm text-gray-600 w-12 text-right">{item.count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
              <option>All Services</option>
              <option>Initial Consultation</option>
              <option>Follow-up</option>
              <option>Video Consultation</option>
            </select>

            <select className="h-10 px-3 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent">
              <option>Most Recent</option>
              <option>Highest Rating</option>
              <option>Lowest Rating</option>
              <option>Most Helpful</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#083f30] flex items-center justify-center text-white font-semibold">
                  {review.patientName.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{review.patientName}</div>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      {renderStars(review.rating)}
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
              </div>
              
              <button className="text-gray-400 hover:text-gray-600">
                <Flag size={18} />
              </button>
            </div>

            <div className="mb-4">
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full mb-3">
                {review.service}
              </div>
              <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <ThumbsUp size={16} />
                <span>Helpful ({review.helpful})</span>
              </button>
              
              {!review.hasReply ? (
                <button
                  onClick={() => setSelectedReview(review)}
                  className="flex items-center gap-2 text-sm text-[#083f30] font-medium hover:underline"
                >
                  <Reply size={16} />
                  <span>Reply</span>
                </button>
              ) : (
                <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <Reply size={16} />
                  <span>Replied</span>
                </span>
              )}
            </div>

            {/* Doctor's Reply */}
            {review.hasReply && review.reply && (
              <div className="mt-4 ml-16 p-4 bg-gray-50 border-l-4 border-[#083f30] rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-gray-900 text-sm">Dr. Sarah Williams</div>
                  <span className="px-2 py-0.5 bg-[#083f30] text-white text-xs font-semibold rounded">
                    DOCTOR
                  </span>
                </div>
                <p className="text-gray-700 text-sm">{review.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedReview(null)}>
          <div className="bg-white rounded-2xl p-6 w-[600px]" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 text-lg mb-4">Reply to Review</h3>
            
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="font-medium text-gray-900">{selectedReview.patientName}</div>
                <div className="flex items-center gap-1">
                  {renderStars(selectedReview.rating)}
                </div>
              </div>
              <p className="text-sm text-gray-700">{selectedReview.reviewText}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
              <textarea
                rows={4}
                placeholder="Thank you for your feedback..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              />
              <div className="text-xs text-gray-500 mt-2">
                Your reply will be public and visible to all users
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                Send Reply
              </button>
              <button
                onClick={() => setSelectedReview(null)}
                className="flex-1 h-10 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
