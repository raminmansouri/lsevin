import { useState } from 'react';
import { DashboardLayout } from '../../../design-system/dashboard-components';
import { 
  LayoutDashboard, Calendar, Users, Stethoscope, DollarSign, Image, Star, 
  TrendingUp, BarChart3, CreditCard, MessageSquare, Settings, Search, Filter,
  Reply, Flag, ThumbsUp, X
} from 'lucide-react';

interface Review {
  id: string;
  patientName: string;
  rating: number;
  treatment: string;
  doctor: string;
  date: string;
  comment: string;
  status: 'pending' | 'published' | 'flagged';
  hasReply: boolean;
  reply?: string;
  helpful: number;
}

export default function ClinicReviews() {
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'published' | 'flagged'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');

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

  const reviews: Review[] = [
    {
      id: '1',
      patientName: 'Sarah Anderson',
      rating: 5,
      treatment: 'Hair Transplant',
      doctor: 'Dr. Ahmed Hassan',
      date: '2024-03-09',
      comment: 'Excellent service! The staff was very professional and the facility was spotless. Dr. Hassan explained everything clearly and I\'m very happy with the results.',
      status: 'published',
      hasReply: true,
      reply: 'Thank you for your kind words, Sarah! We\'re thrilled you had a great experience.',
      helpful: 24
    },
    {
      id: '2',
      patientName: 'Michael Chen',
      rating: 5,
      treatment: 'Dental Implants',
      doctor: 'Dr. Maria Santos',
      date: '2024-03-08',
      comment: 'Best decision I made. Dr. Santos is amazing and the results exceeded my expectations. The entire team was supportive throughout the process.',
      status: 'published',
      hasReply: false,
      helpful: 18
    },
    {
      id: '3',
      patientName: 'Emma Wilson',
      rating: 4,
      treatment: 'IVF Consultation',
      doctor: 'Dr. Fatima Al-Rashid',
      date: '2024-03-07',
      comment: 'Very good experience overall. The consultation was thorough and informative. Only downside was the waiting time.',
      status: 'published',
      hasReply: true,
      reply: 'Thank you for your feedback. We\'re working on reducing wait times.',
      helpful: 12
    },
    {
      id: '4',
      patientName: 'James Taylor',
      rating: 5,
      treatment: 'Knee Arthroscopy',
      doctor: 'Dr. James Robertson',
      date: '2024-03-06',
      comment: 'Dr. Robertson is highly skilled and caring. The recovery was smoother than expected. Highly recommend this clinic!',
      status: 'published',
      hasReply: false,
      helpful: 15
    },
    {
      id: '5',
      patientName: 'Anonymous',
      rating: 2,
      treatment: 'Dermatology Session',
      doctor: 'Dr. Priya Sharma',
      date: '2024-03-05',
      comment: 'The treatment was okay but I felt rushed during the consultation. Expected more personalized attention.',
      status: 'pending',
      hasReply: false,
      helpful: 0
    },
    {
      id: '6',
      patientName: 'Sophia Martinez',
      rating: 1,
      treatment: 'Hair Transplant',
      doctor: 'Dr. Ahmed Hassan',
      date: '2024-03-04',
      comment: 'Terrible experience. Very unprofessional staff and the results were not as promised.',
      status: 'flagged',
      hasReply: false,
      helpful: 0
    },
  ];

  const filteredReviews = reviews.filter(review => {
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    return matchesStatus && matchesRating;
  });

  const stats = {
    average: 4.5,
    total: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    flagged: reviews.filter(r => r.status === 'flagged').length,
    responseRate: 67
  };

  const ratingBreakdown = [
    { stars: 5, count: 4, percentage: 67 },
    { stars: 4, count: 1, percentage: 17 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 1, percentage: 16 },
    { stars: 1, count: 1, percentage: 0 },
  ];

  return (
    <DashboardLayout 
      navigation={navigation} 
      headerTitle="Reviews Management"
      userRole="provider"
      userName="Dr. Michael Johnson"
      providerName="Elite Medical Center"
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Patient Reviews</h1>
            <p className="text-gray-600 mt-1">Manage and respond to patient feedback</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-600">Avg Rating</div>
                <div className="text-3xl font-bold text-yellow-600 mt-2">{stats.average}</div>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Star size={24} className="text-yellow-600 fill-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Total Reviews</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-orange-600 mt-2">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Flagged</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{stats.flagged}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm font-medium text-gray-600">Response Rate</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{stats.responseRate}%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Rating Breakdown */}
          <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
            <div className="space-y-3">
              {ratingBreakdown.map(item => (
                <div key={item.stars} className="flex items-center gap-4">
                  <div className="flex items-center gap-1 min-w-[80px]">
                    {Array.from({ length: item.stars }).map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="flex-1">
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-400"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 min-w-[40px] text-right">
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full h-10 bg-[#083f30] text-white rounded-lg text-sm font-medium hover:bg-[#0a5a44] transition">
                Reply to Pending ({stats.pending})
              </button>
              <button className="w-full h-10 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition">
                Review Flagged ({stats.flagged})
              </button>
              <button className="w-full h-10 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                Export Reviews
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                className="w-full h-10 pl-10 pr-4 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
              />
            </div>
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="pending">Pending</option>
              <option value="flagged">Flagged</option>
            </select>
            <select 
              className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <select className="h-10 px-3 pr-8 border border-gray-200 rounded-lg text-sm">
              <option>All Doctors</option>
              <option>Dr. Ahmed Hassan</option>
              <option>Dr. Maria Santos</option>
              <option>Dr. Fatima Al-Rashid</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map(review => (
          <div 
            key={review.id}
            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-semibold">
                  {review.patientName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{review.patientName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">• {review.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  review.status === 'published' 
                    ? 'bg-green-100 text-green-700' 
                    : review.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {review.status === 'published' ? 'Published' : review.status === 'pending' ? 'Pending' : 'Flagged'}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">{review.treatment}</span> • {review.doctor}
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>

            {review.hasReply && review.reply && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-[#083f30]">
                <div className="flex items-center gap-2 mb-2">
                  <Reply size={14} className="text-gray-600" />
                  <span className="text-sm font-semibold text-gray-700">Your Reply</span>
                </div>
                <p className="text-sm text-gray-600">{review.reply}</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition">
                  <ThumbsUp size={16} />
                  <span>{review.helpful} helpful</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {!review.hasReply && (
                  <button 
                    onClick={() => setSelectedReview(review)}
                    className="px-3 py-1.5 bg-[#083f30] text-white rounded-lg text-sm font-medium hover:bg-[#0a5a44] transition flex items-center gap-1"
                  >
                    <Reply size={14} />
                    Reply
                  </button>
                )}
                {review.status === 'flagged' && (
                  <button className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition flex items-center gap-1">
                    <Flag size={14} />
                    Review Flag
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8" onClick={() => setSelectedReview(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Reply to Review</h3>
              <button onClick={() => setSelectedReview(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-semibold text-gray-900">{selectedReview.patientName}</div>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: selectedReview.rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700">{selectedReview.comment}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                <textarea
                  className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#083f30] focus:border-transparent"
                  placeholder="Thank you for your feedback..."
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setSelectedReview(null)}
                  className="flex-1 h-10 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button className="flex-1 h-10 bg-[#083f30] text-white rounded-lg font-medium hover:bg-[#0a5a44] transition">
                  Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
