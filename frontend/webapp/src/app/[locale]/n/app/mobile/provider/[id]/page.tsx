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
import { useParams, useSearchParams } from 'next/navigation';
import { useFetchProviderPageData } from '@/features/service-providers/api/client/fetch-provider-page-data';
import { useLocale, useTranslations } from 'next-intl';
import { CardContent } from '@/components/ui/card';
import { ZodErrorProvider } from '@/components/providers/zod-error-provider';
import { CATEGORY_TRANSLATION_KEY } from '@/features/categories/constants';
import { Skeleton } from '@/components/ui/skeleton';
import { hasLexicalContent, LexicalRenderer } from '@/components/editor/lexical-renderer';
import { TRANSLATION_KEY } from '@/features/service-providers/types/constants';
import { localeToHeader } from '@/config/locales';
import { LocaleTypes } from '@/types/common';
import { env } from "@/config/env/client";
import { getLocalizedValue } from '@/features/shared/utils/localization';
import Image from 'next/image';

export default function ClinicDetail() {
  const navigate = useNavigate();
  const searchParams=useSearchParams();
  // const id = searchParams.get("id");
  const { id } = useParams();   // → id === '1'

  const [selectedTab, setSelectedTab] = useState<'overview' | 'treatments' | 'doctors' | 'reviews'>('overview');
  const [isFavorited, setIsFavorited] = useState(false);
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: provider.name,
          text: `Check out ${provider.name} - ${provider.tagline}`,
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
  


  
  const locale=useLocale();
  const { data,
    error,
    isFetching,} = useFetchProviderPageData(id,locale);


      const provider=data?.provider; 
      const services=data?.services; 
      const specialists=data?.specialists; 
      const recentReviews=data?.recentReviews;
      const localRecommendations=data?.localRecommendations;
      const internationalRecommendations=data?.internationalRecommendations;;


  
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
    const t = useTranslations(TRANSLATION_KEY);
  

    const localeHeader = localeToHeader(locale as LocaleTypes);

  if(!data)
  return (<><ProviderPageSkeleton/></>);
  
  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Image Gallery */}
      <div className="relative">
        <div className="relative h-80 overflow-hidden">
          {/* <img 
            src={`/files/${provider.images[currentImageIndex]}`}
            alt={provider.name}
            className="w-full h-full object-cover"
          /> */}
          
           <Image
                        src={`${env.NEXT_PUBLIC_FILES_URL}/${provider.images[currentImageIndex]}`}
                        // alt={getLocalizedValue(provider.name, localeHeader)}
                        alt={provider.name}
                        fill
            className="w-full h-full object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
            {currentImageIndex + 1} / {provider.images.length}
          </button>
          
          {/* Image Dots */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {provider.images.map((_, idx) => (
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
            {provider.verified && (
              <span className="flex items-center gap-1 px-3 py-1 bg-[#083f30] rounded-full text-white text-xs font-bold">
                <BadgeCheck size={14} />
                Verified
              </span>
            )}
            {provider.accredited && (
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
            {provider.name}
          </h1>
          <p className="text-base text-gray-600 mb-3">
            {provider.tagline && hasLexicalContent(provider.tagline) ? (
                          <LexicalRenderer
                            content={provider.tagline}
                            className="text-muted-foreground leading-relaxed"
                          />
                        ) : (
                          <p className="text-muted-foreground leading-relaxed">
                            {t("noDescription")}
                          </p>
                        )}
          </p>
          
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-700 mb-4">
            <MapPin size={16} className="text-[#083f30]" />
            <span className="font-medium">{provider.location}</span>
          </div>
          
          {/* Rating & Reviews */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star size={20} className="fill-yellow-400 text-yellow-400" />
                <span className="text-xl font-bold text-gray-900">{provider.rating}</span>
              </div>
              <span className="text-sm text-gray-600">
                ({provider.reviews.toLocaleString()} reviews)
              </span>
            </div>
            
            <div className="h-4 w-px bg-gray-300" />
            
            <div className="flex items-center gap-1.5">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700 font-medium">
                {provider.responseTime}
              </span>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900 mb-0.5">
              {provider.totalPatients}
            </div>
            <div className="text-xs text-gray-600">Patients</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900 mb-0.5">
              {provider.successRate}
            </div>
            <div className="text-xs text-gray-600">Success Rate</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-gray-900 mb-0.5">
              {provider.established}
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
            {provider.certifications.map((cert, idx) => (
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
            {provider.languages.map((lang, idx) => (
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
            {services.map(treatment => (
              <div
                key={treatment.id}
                onClick={() => navigate(`/n/app/mobile/service/${treatment.id}`)}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex gap-4 p-4">
                  <img 
                    src={`/files/${treatment.image}`}
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
            {specialists.map(doctor => (
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
                providerName={provider.name}
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



export function ProviderPageSkeleton() {
  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={CATEGORY_TRANSLATION_KEY}>
        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>

          {/* Category Image Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-40 w-full rounded-md" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Parent Category Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      </ZodErrorProvider>
    </CardContent>
  );
}