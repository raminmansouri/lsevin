"use client"

import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  Star, 
  BadgeCheck,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Shield,
  Award,
  TrendingUp,
  Users,
  Image as ImageIcon,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';
import RecommendationSection from '../components/RecommendationSection';

export default function TreatmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: treatment.name,
          text: `Check out ${treatment.name} at ${treatment.clinic}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };
  
  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };
  
  const treatment = {
    id: id || '1',
    name: 'Premium Hair Transplant - FUE Method',
    subtitle: 'Advanced Follicular Unit Extraction',
    clinic: 'Istanbul Medical Center',
    clinicId: '1',
    location: 'Istanbul, Turkey',
    price: 2499,
    originalPrice: 3200,
    currency: 'USD',
    otherCurrencies: [
      { code: 'EUR', amount: 2299 },
      { code: 'GBP', amount: 1999 },
      { code: 'AED', amount: 9175 },
    ],
    rating: 4.9,
    reviews: 1247,
    images: [
      'unsplash_images/photo-1622296089863-eb7fc530daa8__w=1200&h=800&fit=crop.jpg',
      'https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=1200&h=800&fit=crop',
      'unsplash_images/photo-1551190822-a9333d879b1f__w=1200&h=800&fit=crop.jpg',
      'unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=1200&h=800&fit=crop.jpg',
    ],
    duration: '6-8 hours',
    recovery: '7-10 days',
    anesthesia: 'Local',
    stayRequired: '2-3 nights',
    verified: true,
    popular: true,
    successRate: '98.5%',
    satisfaction: '99.2%',
  };
  
  const included = [
    'Pre-operative consultation & hair analysis',
    'FUE hair transplant procedure (3000-5000 grafts)',
    'Post-operative medications & care kit',
    '3 PRP sessions for enhanced growth',
    'Airport VIP transfer (pick-up & drop-off)',
    '2 nights at 4-star partner hotel',
    'Professional medical translator',
    '1-year follow-up & guarantee',
    'Before/after photos & certificate',
  ];
  
  const process = [
    {
      step: 1,
      title: 'Consultation',
      description: 'Hair analysis, design hairline, discuss expectations',
      duration: '30-45 min'
    },
    {
      step: 2,
      title: 'Extraction',
      description: 'Extract follicles from donor area using micro-punch',
      duration: '3-4 hours'
    },
    {
      step: 3,
      title: 'Implantation',
      description: 'Carefully implant grafts in recipient area',
      duration: '2-3 hours'
    },
    {
      step: 4,
      title: 'Recovery',
      description: 'Instructions, medications, first wash at clinic',
      duration: '7-10 days'
    },
  ];
  
  const faqs = [
    {
      q: 'Is the result permanent?',
      a: 'Yes, transplanted hair is permanent as it comes from the DHT-resistant donor area. You can expect 95-98% of grafts to grow successfully.'
    },
    {
      q: 'When will I see results?',
      a: 'Initial growth starts at 3-4 months. Full results are visible at 12-18 months as hair grows and thickens naturally.'
    },
    {
      q: 'Is the procedure painful?',
      a: 'No, the procedure is performed under local anesthesia. You may feel slight discomfort during anesthesia injection, but the procedure itself is painless.'
    },
    {
      q: 'What is the recovery time?',
      a: 'Most patients return to work within 7-10 days. Redness fades in 2-3 weeks. You can resume exercise after 2 weeks and see final results in 12 months.'
    },
  ];
  
  const topReviews = [
    {
      id: 1,
      name: 'David Thompson',
      country: 'UK',
      date: '1 month ago',
      rating: 5,
      review: 'Life-changing experience! Dr. Mehmet is a true artist. 6 months post-op and my hair is growing beautifully. The entire package was seamless - hotel, transfer, translator, everything was perfect.',
      verified: true,
      helpful: 89,
      images: [
        'unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg',
        'https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=300&fit=crop'
      ]
    },
    {
      id: 2,
      name: 'Ahmed Al-Farsi',
      country: 'Saudi Arabia',
      date: '2 months ago',
      rating: 5,
      review: 'Exceptional service and natural-looking results. The clinic is modern, clean, and professional. Communication was excellent throughout. Highly recommend for anyone considering hair transplant.',
      verified: true,
      helpful: 67
    },
  ];

  // Recommendation data
  const localRecommendations = [
    {
      id: 'treat-local-1',
      image: 'https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=400&fit=crop',
      title: 'Sapphire FUE Hair Transplant',
      provider: 'Ankara Hair Center',
      rating: 4.8,
      reviewCount: 892,
      city: 'Ankara',
      country: 'Turkey',
      price: 2299,
      currency: '$',
      verified: true,
      link: '/app/treatment/2'
    },
    {
      id: 'treat-local-2',
      image: 'unsplash_images/photo-1551190822-a9333d879b1f__w=400&h=400&fit=crop.jpg',
      title: 'DHI Hair Transplant Premium',
      provider: 'Bodrum Medical Clinic',
      rating: 4.9,
      reviewCount: 654,
      city: 'Bodrum',
      country: 'Turkey',
      price: 2699,
      currency: '$',
      verified: true,
      link: '/app/treatment/3'
    },
  ];

  const internationalRecommendations = [
    {
      id: 'treat-int-1',
      image: 'unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=400&h=400&fit=crop.jpg',
      title: 'Advanced FUE Hair Restoration',
      provider: 'Tehran Excellence Clinic',
      rating: 4.7,
      reviewCount: 1124,
      city: 'Tehran',
      country: 'Iran',
      price: 1899,
      currency: '$',
      verified: true,
      link: '/app/treatment/4'
    },
    {
      id: 'treat-int-2',
      image: 'unsplash_images/photo-1588776814546-1ffcf47267a5__w=400&h=400&fit=crop.jpg',
      title: 'Premium Hair Transplant Package',
      provider: 'Dubai Wellness Center',
      rating: 4.8,
      reviewCount: 976,
      city: 'Dubai',
      country: 'UAE',
      price: 3499,
      currency: '$',
      verified: true,
      link: '/app/treatment/5'
    },
  ];
  
  const [showAllFAQs, setShowAllFAQs] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  
  const displayPrice = selectedCurrency === 'USD' 
    ? treatment.price 
    : treatment.otherCurrencies.find(c => c.code === selectedCurrency)?.amount || treatment.price;
  
  const displayOriginalPrice = selectedCurrency === 'USD'
    ? treatment.originalPrice
    : Math.round((treatment.otherCurrencies.find(c => c.code === selectedCurrency)?.amount || treatment.price) * 1.28);
  
  return (
    <div className="min-h-screen bg-white pb-36">
      {/* Image Gallery */}
      <div className="relative">
        <div className="relative h-80 overflow-hidden">
          <img 
            src={treatment.images[currentImageIndex]}
            alt={treatment.name}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Navigation */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4">
            <button 
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
            >
              <ArrowLeft size={20} className="text-gray-900" />
            </button>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleShare}
                className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
              >
                <Share2 size={20} className="text-gray-900" />
              </button>
              <button 
                onClick={handleFavorite}
                className={`w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95 ${
                  isFavorited ? 'text-red-500' : 'text-gray-900'
                }`}
              >
                <Heart size={20} />
              </button>
            </div>
          </div>
          
          {/* Image Counter */}
          <button 
            onClick={() => navigate(`/app/treatment/${id}/gallery`)}
            className="absolute bottom-4 right-4 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-xl text-white text-sm font-semibold flex items-center gap-2 hover:bg-black/80 transition-colors"
          >
            <ImageIcon size={16} />
            {currentImageIndex + 1} / {treatment.images.length}
          </button>
          
          {/* Image Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {treatment.images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentImageIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentImageIndex 
                    ? 'bg-white w-6' 
                    : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="px-5 py-6">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-3">
          {treatment.verified && (
            <span className="flex items-center gap-1 px-3 py-1 bg-[#083f30] rounded-full text-white text-xs font-bold">
              <BadgeCheck size={14} />
              Verified
            </span>
          )}
          {treatment.popular && (
            <span className="flex items-center gap-1 px-3 py-1 bg-orange-500 rounded-full text-white text-xs font-bold">
              <TrendingUp size={14} />
              Most Popular
            </span>
          )}
          <span className="flex items-center gap-1 px-3 py-1 bg-blue-600 rounded-full text-white text-xs font-bold">
            <Award size={14} />
            Top Rated
          </span>
        </div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
          {treatment.name}
        </h1>
        <p className="text-base text-gray-600 mb-4">
          {treatment.subtitle}
        </p>
        
        {/* Clinic Info */}
        <button
          onClick={() => navigate(`/app/clinic/${treatment.clinicId}`)}
          className="flex items-center gap-3 mb-4 w-full text-left hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors"
        >
          <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-[#083f30]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-gray-900">{treatment.clinic}</h3>
              <BadgeCheck size={16} className="text-[#083f30]" />
            </div>
            <p className="text-sm text-gray-600">{treatment.location}</p>
          </div>
          <ChevronRight size={20} className="text-gray-400" />
        </button>
        
        {/* Rating & Stats */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Star size={20} className="fill-yellow-400 text-yellow-400" />
            <span className="text-xl font-bold text-gray-900">{treatment.rating}</span>
            <span className="text-sm text-gray-600">
              ({treatment.reviews.toLocaleString()} reviews)
            </span>
          </div>
        </div>
        
        {/* Price Section */}
        <div className="mb-6 p-4 bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white/80 text-sm mb-1">Package Price</p>
              <div className="flex items-baseline gap-3">
                <div className="text-3xl font-bold text-white">
                  {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : 'AED '}
                  {displayPrice.toLocaleString()}
                </div>
                <div className="text-white/60 line-through text-lg">
                  {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : 'AED '}
                  {displayOriginalPrice.toLocaleString()}
                </div>
              </div>
              <p className="text-[#eacb7f] text-sm font-semibold mt-1">
                Save {Math.round(((displayOriginalPrice - displayPrice) / displayOriginalPrice) * 100)}% • All-inclusive package
              </p>
            </div>
          </div>
          
          {/* Currency Selector */}
          <div className="flex gap-2">
            {['USD', 'EUR', 'GBP', 'AED'].map(currency => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  selectedCurrency === currency
                    ? 'bg-[#eacb7f] text-[#083f30]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>
        
        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <Clock size={20} className="text-[#083f30] mb-2" />
            <div className="text-xs text-gray-600 mb-1">Duration</div>
            <div className="font-bold text-gray-900">{treatment.duration}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <Calendar size={20} className="text-[#083f30] mb-2" />
            <div className="text-xs text-gray-600 mb-1">Recovery</div>
            <div className="font-bold text-gray-900">{treatment.recovery}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <Shield size={20} className="text-[#083f30] mb-2" />
            <div className="text-xs text-gray-600 mb-1">Success Rate</div>
            <div className="font-bold text-gray-900">{treatment.successRate}</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <Users size={20} className="text-[#083f30] mb-2" />
            <div className="text-xs text-gray-600 mb-1">Satisfaction</div>
            <div className="font-bold text-gray-900">{treatment.satisfaction}</div>
          </div>
        </div>
        
        {/* What's Included */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What's Included</h2>
          <div className="space-y-3">
            {included.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Treatment Process */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Treatment Process</h2>
          <div className="space-y-4">
            {process.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-10 h-10 bg-[#083f30] rounded-full flex items-center justify-center text-white font-bold">
                    {step.step}
                  </div>
                  {idx < process.length - 1 && (
                    <div className="w-0.5 h-12 bg-gray-200 my-1" />
                  )}
                </div>
                
                <div className="flex-1 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                    <span className="text-xs text-gray-500 font-medium">{step.duration}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Important Information */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 mb-2">Important Information</h3>
              <ul className="space-y-1.5 text-sm text-blue-800">
                <li>• Consultation required before booking confirmation</li>
                <li>• Stop blood thinners 1 week before procedure</li>
                <li>• Avoid alcohol and smoking 3 days before</li>
                <li>• Plan to stay 2-3 nights in Istanbul</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Recommendations */}
        <RecommendationSection 
          localRecommendations={localRecommendations}
          internationalRecommendations={internationalRecommendations}
          userCountry="Turkey"
        />
        
        {/* Reviews */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Patient Reviews</h2>
            <button 
              onClick={() => navigate(`/app/treatment/${id}/reviews`)}
              className="text-sm font-semibold text-[#083f30] hover:underline"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            {topReviews.map(review => (
              <div
                key={review.id}
                className="bg-white border border-gray-200 rounded-2xl p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold flex-shrink-0">
                    {review.name.charAt(0)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">{review.name}</h4>
                      {review.verified && (
                        <BadgeCheck size={16} className="text-[#083f30]" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                      <span>{review.country}</span>
                      <span>•</span>
                      <span>{review.date}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-0.5">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={14} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {review.review}
                </p>
                
                {review.images && (
                  <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
                    {review.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img}
                        alt="Review"
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                    ))}
                  </div>
                )}
                
                <button className="text-xs text-gray-600 hover:text-gray-900 font-medium">
                  👍 Helpful ({review.helpful})
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* FAQs */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.slice(0, showAllFAQs ? faqs.length : 2).map((faq, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
          
          {!showAllFAQs && faqs.length > 2 && (
            <button 
              onClick={() => setShowAllFAQs(true)}
              className="mt-3 text-sm font-semibold text-[#083f30] hover:underline"
            >
              Show {faqs.length - 2} more questions
            </button>
          )}
        </div>
      </div>
      
      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 shadow-2xl z-40 safe-area-bottom rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-600 mb-0.5">Total Package Price</div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-[#083f30]">
                {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : 'AED '}
                {displayPrice.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 line-through">
                {selectedCurrency === 'USD' ? '$' : selectedCurrency === 'EUR' ? '€' : selectedCurrency === 'GBP' ? '£' : 'AED '}
                {displayOriginalPrice.toLocaleString()}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate(`/app/booking/${id}`)}
            className="h-14 px-8 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}