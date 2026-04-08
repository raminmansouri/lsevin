"use client"

import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  MapPin, 
  Star, 
  BadgeCheck,
  Award,
  Clock,
  Phone,
  Globe,
  Shield,
  Users,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import ReviewForm from '../../../components/ReviewForm';
import RecommendationSection from '../../components/RecommendationSection';
import { useNavigate } from '@/hooks/use-navigate';
import { useSearchParams } from 'next/navigation';

export default function ClinicDetail() {
  const navigate = useNavigate();
  const searchParams=useSearchParams();
  const id = searchParams.get("id");
  const [selectedTab, setSelectedTab] = useState<'overview' | 'treatments' | 'doctors' | 'reviews'>('overview');
  const [isFavorited, setIsFavorited] = useState(false);
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: clinic.name,
          text: `Check out ${clinic.name} - ${clinic.tagline}`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };
  
  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    // In production, you would save to favorites context/backend here
  };
  
  const clinic = {
    id: id || '1',
    name: 'Istanbul Medical Center',
    tagline: 'World-Class Hair Transplant & Aesthetic Surgery',
    location: 'Sisli, Istanbul, Turkey',
    rating: 4.9,
    reviews: 2847,
    verified: true,
    accredited: true,
    responseTime: '< 2 hours',
    images: [
      '/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=1200&h=800&fit=crop.jpg',
      '/unsplash_images/photo-1631217868264-e5b90bb7e133__w=1200&h=800&fit=crop.jpg',
      '/unsplash_images/photo-1586773860418-d37222d8fce3__w=1200&h=800&fit=crop.jpg',
      '/unsplash_images/photo-1512678080530-7760d81faba6__w=1200&h=800&fit=crop.jpg',
    ],
    certifications: [
      { name: 'JCI Accredited', verified: true },
      { name: 'ISO 9001:2015', verified: true },
      { name: 'ISHRS Member', verified: true },
      { name: 'Turkey Ministry of Health', verified: true },
    ],
    languages: ['English', 'Arabic', 'Turkish', 'Russian'],
    established: 2008,
    totalPatients: '50,000+',
    successRate: '98.5%',
  };
  
  const treatments = [
    {
      id: 1,
      name: 'Premium Hair Transplant - FUE',
      price: 2499,
      currency: 'USD',
      duration: '6-8 hours',
      recovery: '7-10 days',
      rating: 4.9,
      reviews: 1247,
      popular: true,
      image: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=600&h=400&fit=crop.jpg'
    },
    {
      id: 2,
      name: 'Rhinoplasty (Nose Surgery)',
      price: 3200,
      currency: 'USD',
      duration: '2-3 hours',
      recovery: '10-14 days',
      rating: 4.8,
      reviews: 892,
      image: '/unsplash_images/photo-1576091160399-112ba8d25d1d__w=600&h=400&fit=crop.jpg'
    },
    {
      id: 3,
      name: 'Dental Implants - Full Set',
      price: 4500,
      currency: 'USD',
      duration: '3-5 days',
      recovery: '3-6 months',
      rating: 4.9,
      reviews: 654,
      image: '/unsplash_images/photo-1588776814546-1ffcf47267a5__w=600&h=400&fit=crop.jpg'
    },
  ];
  
  const doctors = [
    {
      id: 1,
      name: 'Dr. Mehmet Yavuz',
      specialty: 'Hair Transplant Surgeon',
      experience: '18 years',
      patients: '12,000+',
      rating: 4.9,
      image: '/unsplash_images/photo-1612349317150-e413f6a5b16d__w=400&h=400&fit=crop.jpg',
      verified: true
    },
    {
      id: 2,
      name: 'Dr. Ayse Demir',
      specialty: 'Plastic Surgeon',
      experience: '15 years',
      patients: '8,500+',
      rating: 4.8,
      image: '/unsplash_images/photo-1594824476967-48c8b964273f__w=400&h=400&fit=crop.jpg',
      verified: true
    },
    {
      id: 3,
      name: 'Dr. Can Ozturk',
      specialty: 'Cosmetic Dentist',
      experience: '12 years',
      patients: '6,200+',
      rating: 4.9,
      image: '/unsplash_images/photo-1622253692010-333f2da6031d__w=400&h=400&fit=crop.jpg',
      verified: true
    },
  ];
  
  const recentReviews = [
    {
      id: 1,
      name: 'James Morrison',
      country: 'UK',
      date: '2 weeks ago',
      rating: 5,
      treatment: 'Hair Transplant',
      review: 'Exceptional service from start to finish. The clinic is modern, staff is professional, and Dr. Mehmet is a true expert. Results exceeded my expectations!',
      verified: true,
      helpful: 47,
      images: ['/unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg']
    },
    {
      id: 2,
      name: 'Sarah Al-Mansouri',
      country: 'UAE',
      date: '1 month ago',
      rating: 5,
      treatment: 'Rhinoplasty',
      review: 'Best decision ever! The entire team was caring and attentive. Dr. Ayse understood exactly what I wanted. Recovery was smooth with excellent aftercare support.',
      verified: true,
      helpful: 32
    },
    {
      id: 3,
      name: 'Michael Chen',
      country: 'USA',
      date: '1 month ago',
      rating: 5,
      treatment: 'Dental Implants',
      review: 'Outstanding quality at a fraction of US prices. The clinic arranged everything - hotel, transfer, translator. Felt safe and well cared for throughout.',
      verified: true,
      helpful: 28
    },
  ];

  // Recommendation data
  const localRecommendations = [
    {
      id: 'clinic-local-1',
      image: 'https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=400&fit=crop',
      title: 'Ankara Medical Excellence',
      rating: 4.8,
      reviewCount: 1543,
      city: 'Ankara',
      country: 'Turkey',
      verified: true,
      link: '/n/app/mobile/provider/2'
    },
    {
      id: 'clinic-local-2',
      image: '/unsplash_images/photo-1631217868264-e5b90bb7e133__w=400&h=400&fit=crop.jpg',
      title: 'Bodrum Aesthetic Center',
      rating: 4.7,
      reviewCount: 967,
      city: 'Bodrum',
      country: 'Turkey',
      verified: true,
      link: '/n/app/mobile/provider/3'
    },
  ];

  const internationalRecommendations = [
    {
      id: 'clinic-int-1',
      image: '/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=400&h=400&fit=crop.jpg',
      title: 'Tehran Premium Healthcare',
      rating: 4.6,
      reviewCount: 2187,
      city: 'Tehran',
      country: 'Iran',
      verified: true,
      link: '/n/app/mobile/provider/4'
    },
    {
      id: 'clinic-int-2',
      image: '/unsplash_images/photo-1586773860418-d37222d8fce3__w=400&h=400&fit=crop.jpg',
      title: 'Dubai Excellence Medical',
      rating: 4.9,
      reviewCount: 1876,
      city: 'Dubai',
      country: 'UAE',
      verified: true,
      link: '/n/app/mobile/provider/5'
    },
  ];
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Image Gallery */}
      <div className="relative">
        <div className="relative h-80 overflow-hidden">
          <img 
            src={clinic.images[currentImageIndex]}
            alt={clinic.name}
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
                className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
              >
                <Heart size={20} className={isFavorited ? "text-[#083f30]" : "text-gray-900"} />
              </button>
            </div>
          </div>
          
          {/* Image Counter */}
          <button 
            onClick={() => navigate(`/n/app/mobile/provider/${id}/gallery`)}
            className="absolute bottom-4 right-4 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-xl text-white text-sm font-semibold flex items-center gap-2 hover:bg-black/80 transition-colors"
          >
            <ImageIcon size={16} />
            {currentImageIndex + 1} / {clinic.images.length}
          </button>
          
          {/* Image Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {clinic.images.map((_, idx) => (
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
        {/* Header */}
        <div className="mb-6">
          {/* Verification Badges */}
          <div className="flex items-center gap-2 mb-3">
            {clinic.verified && (
              <span className="flex items-center gap-1 px-3 py-1 bg-[#083f30] rounded-full text-white text-xs font-bold">
                <BadgeCheck size={14} />
                Verified
              </span>
            )}
            {clinic.accredited && (
              <span className="flex items-center gap-1 px-3 py-1 bg-blue-600 rounded-full text-white text-xs font-bold">
                <Award size={14} />
                JCI Accredited
              </span>
            )}
            <span className="flex items-center gap-1 px-3 py-1 bg-orange-500 rounded-full text-white text-xs font-bold">
              <TrendingUp size={14} />
              Top Rated
            </span>
          </div>
          
          {/* Name & Location */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
            {clinic.name}
          </h1>
          <p className="text-base text-gray-600 mb-3">
            {clinic.tagline}
          </p>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <MapPin size={16} className="text-[#083f30]" />
            <span className="font-medium">{clinic.location}</span>
          </div>
          
          {/* Rating & Reviews */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-gray-900">{clinic.rating}</span>
              </div>
              <span className="text-sm text-gray-600">
                ({clinic.reviews.toLocaleString()} reviews)
              </span>
            </div>
            
            <div className="h-4 w-px bg-gray-300" />
            
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">
                {clinic.responseTime}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900 mb-0.5">
              {clinic.totalPatients}
            </div>
            <div className="text-xs text-gray-600">Patients</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900 mb-0.5">
              {clinic.successRate}
            </div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900 mb-0.5">
              {clinic.established}
            </div>
            <div className="text-xs text-gray-600">Established</div>
          </div>
        </div>
        
        {/* Certifications */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Shield size={18} className="text-[#083f30]" />
            Certifications & Accreditations
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {clinic.certifications.map((cert, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100"
              >
                <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-green-900 line-clamp-1">
                  {cert.name}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Languages */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Globe size={18} className="text-[#083f30]" />
            Languages Spoken
          </h3>
          <div className="flex flex-wrap gap-2">
            {clinic.languages.map((lang, idx) => (
              <span 
                key={idx}
                className="px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-900"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 -mx-5 px-5">
          <div className="flex gap-6 overflow-x-auto hide-scrollbar">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'treatments', label: 'Treatments' },
              { id: 'doctors', label: 'Doctors' },
              { id: 'reviews', label: 'Reviews' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`pb-3 font-semibold text-sm whitespace-nowrap transition-colors relative ${
                  selectedTab === tab.id
                    ? 'text-[#083f30]'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
                {selectedTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#083f30]" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        {/* Tab Content */}
        {selectedTab === 'treatments' && (
          <div className="space-y-4">
            {treatments.map(treatment => (
              <div
                key={treatment.id}
                onClick={() => navigate(`/n/app/mobile/service/${treatment.id}`)}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex gap-4 p-4">
                  <img 
                    src={treatment.image}
                    alt={treatment.name}
                    className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    {treatment.popular && (
                      <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 rounded-md text-xs font-bold mb-2">
                        POPULAR
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-1">
                      {treatment.name}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                      <span>{treatment.duration}</span>
                      <span>•</span>
                      <span>{treatment.recovery} recovery</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-sm text-gray-900">{treatment.rating}</span>
                        <span className="text-xs text-gray-500">({treatment.reviews})</span>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#083f30]">
                          ${treatment.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedTab === 'doctors' && (
          <div className="space-y-4">
            {doctors.map(doctor => (
              <div
                key={doctor.id}
                onClick={() => navigate(`/n/app/mobile/specialist/${doctor.id}`)}
                className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={doctor.image}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    {doctor.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#083f30] rounded-full flex items-center justify-center">
                        <BadgeCheck size={14} className="text-[#eacb7f]" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {doctor.specialty}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                      <span>{doctor.experience} exp</span>
                      <span>•</span>
                      <span>{doctor.patients} patients</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="font-bold text-sm text-gray-900">{doctor.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedTab === 'reviews' && (
          <div className="space-y-4">
            {/* Write Review Button */}
            <button
              onClick={() => setShowReviewForm(true)}
              className="w-full h-14 bg-[#083f30] text-white rounded-xl font-bold hover:bg-[#0a5a44] transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              Write a Review
            </button>
            
            {recentReviews.map(review => (
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
                
                <span className="inline-block px-2 py-1 bg-gray-100 rounded-md text-xs font-semibold text-gray-700 mb-3">
                  {review.treatment}
                </span>
                
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {review.review}
                </p>
                
                {review.images && (
                  <div className="flex gap-2 mb-3">
                    {review.images.map((img, idx) => (
                      <img 
                        key={idx}
                        src={img}
                        alt="Review"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    ))}
                  </div>
                )}
                
                <button className="text-xs text-gray-600 hover:text-gray-900 font-medium">
                  👍 Helpful ({review.helpful})
                </button>
              </div>
            ))}
            
            {/* Add a Review */}
            {showReviewForm && (
              <ReviewForm 
                providerName={clinic.name}
                onClose={() => setShowReviewForm(false)}
              />
            )}
          </div>
        )}
        
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* About */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">About</h3>
              <p className="text-sm text-gray-700 leading-relaxed">
                Istanbul Medical Center is a world-renowned healthcare facility specializing in hair transplant, plastic surgery, and dental treatments. With over 15 years of experience and 50,000+ satisfied patients from 80+ countries, we combine Turkish hospitality with medical excellence.
              </p>
            </div>
            
            {/* Why Choose Us */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Why Choose Us</h3>
              <div className="space-y-3">
                {[
                  'JCI accredited facility with international standards',
                  'Expert surgeons with 10-20 years experience',
                  'Lifetime guarantee on hair transplant procedures',
                  'All-inclusive packages with hotel & transfer',
                  'Multilingual staff and 24/7 patient support',
                  'State-of-the-art equipment and technology',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 size={20} className="text-[#083f30] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Contact</h3>
              <div className="space-y-3">
                <a 
                  href="tel:+905551234567"
                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#083f30] transition-colors"
                >
                  <Phone size={18} className="text-[#083f30]" />
                  <span>+90 555 123 45 67</span>
                </a>
                <a 
                  href="https://istanbulmedical.com"
                  className="flex items-center gap-3 text-sm text-gray-700 hover:text-[#083f30] transition-colors"
                >
                  <Globe size={18} className="text-[#083f30]" />
                  <span>istanbulmedical.com</span>
                </a>
              </div>
            </div>
            
            {/* Recommendations */}
            <RecommendationSection 
              localRecommendations={localRecommendations}
              internationalRecommendations={internationalRecommendations}
              userCountry="Turkey"
            />
          </div>
        )}
      </div>
      
      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 shadow-2xl z-40 safe-area-bottom rounded-t-3xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/app/support')}
            className="flex-1 h-14 bg-gray-100 text-gray-900 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Phone size={18} />
            Contact
          </button>
          <button 
            onClick={() => setSelectedTab('treatments')}
            className="flex-[2] h-14 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95"
          >
            View Treatments
          </button>
        </div>
      </div>
    </div>
  );
}