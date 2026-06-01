"use client"

import { useNavigate, useParams } from 'react-router';
import { 
  ArrowLeft, 
  Share2,
  Heart,
  BadgeCheck,
  Award,
  GraduationCap,
  Users,
  Star,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Globe,
  Building
} from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const t = useTranslations('MobileDoctorProfile');
  const [selectedTab, setSelectedTab] = useState<'about' | 'reviews' | 'credentials'>('about');
  const [isFavorited, setIsFavorited] = useState(false);
  
  const doctor = {
    id: id || '1',
    name: t('sample.name'),
    title: t('sample.title'),
    specialty: t('sample.specialty'),
    image: '/unsplash_images/photo-1612349317150-e413f6a5b16d__w=800&h=800&fit=crop.jpg',
    rating: 4.9,
    reviews: 847,
    experience: 18,
    patients: '12,000+',
    successRate: '98.5%',
    verified: true,
    languages: [t('languages.english'), t('languages.turkish'), t('languages.arabic')],
    clinic: t('sample.clinic'),
    clinicId: '1',
    location: t('sample.location'),
    responseTime: t('sample.responseTime'),
    consultationFee: 0,
  };

  const doctorShortName = doctor.name.split(' ')[1] || doctor.name;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doctor.name,
          text: t('share.text', { name: doctor.name, specialty: doctor.specialty }),
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(t('share.linkCopied'));
    }
  };
  
  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
  };
  
  const education = [
    {
      degree: t('education.md.degree'),
      institution: t('education.md.institution'),
      year: '2002',
    },
    {
      degree: t('education.fellowship.degree'),
      institution: t('education.fellowship.institution'),
      year: '2006',
    },
    {
      degree: t('education.fue.degree'),
      institution: t('education.fue.institution'),
      year: '2008',
    },
  ];
  
  const certifications = [
    { name: t('certifications.ishrs.name'), issuer: t('certifications.ishrs.issuer'), verified: true },
    { name: t('certifications.board.name'), issuer: t('certifications.board.issuer'), verified: true },
    { name: t('certifications.fue.name'), issuer: t('certifications.fue.issuer'), verified: true },
    { name: t('certifications.sapphire.name'), issuer: t('certifications.sapphire.issuer'), verified: true },
  ];
  
  const specializations = [
    t('specializations.fue'),
    t('specializations.sapphireFue'),
    t('specializations.dhi'),
    t('specializations.beardEyebrow'),
    t('specializations.revision'),
    t('specializations.prp'),
  ];
  
  const achievements = [
    { icon: <Award size={24} />, title: t('achievements.bestSurgeon.title'), organization: t('achievements.bestSurgeon.organization') },
    { icon: <Users size={24} />, title: t('achievements.patients.title'), organization: t('achievements.patients.organization') },
    { icon: <Star size={24} />, title: t('achievements.topPercent.title'), organization: t('achievements.topPercent.organization') },
    { icon: <TrendingUp size={24} />, title: t('achievements.success.title'), organization: t('achievements.success.organization') },
  ];
  
  const recentReviews = [
    {
      id: 1,
      name: 'Michael Thompson',
      country: t('countries.usa'),
      date: t('dates.twoWeeksAgo'),
      rating: 5,
      treatment: t('treatments.hairTransplant'),
      review: t('reviews.sample.first'),
      verified: true,
      helpful: 124,
      images: [
        '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg',
        'https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=300&fit=crop'
      ]
    },
    {
      id: 2,
      name: 'Ahmed Al-Farsi',
      country: t('countries.saudiArabia'),
      date: t('dates.oneMonthAgo'),
      rating: 5,
      treatment: t('treatments.hairTransplant'),
      review: t('reviews.sample.second'),
      verified: true,
      helpful: 89
    },
    {
      id: 3,
      name: 'David Chen',
      country: t('countries.uk'),
      date: t('dates.oneMonthAgo'),
      rating: 5,
      treatment: t('treatments.hairTransplant'),
      review: t('reviews.sample.third'),
      verified: true,
      helpful: 67
    },
  ];
  
  const beforeAfter = [
    {
      before: '/unsplash_images/photo-1629909613654-28e377c37b09__w=400&h=300&fit=crop.jpg',
      after: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg',
      procedure: t('results.cases.case1.procedure'),
      months: t('results.cases.case1.months')
    },
    {
      before: '/unsplash_images/photo-1629909613654-28e377c37b09__w=400&h=300&fit=crop.jpg',
      after: 'https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=300&fit=crop',
      procedure: t('results.cases.case2.procedure'),
      months: t('results.cases.case2.months')
    },
  ];
  
  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-[#083f30] to-[#0a5a44] h-48" />
        
        <div className="relative z-10 flex items-center justify-between px-5 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
            aria-label={t('actions.back')}
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          
          <button 
            onClick={handleShare}
            className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
            aria-label={t('actions.share')}
          >
            <Share2 size={20} className="text-gray-900" />
          </button>
        </div>
        
        <div className="relative z-10 px-5 pb-6">
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex gap-4 mb-4">
              <div className="relative flex-shrink-0">
                <img 
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-24 h-24 rounded-2xl object-cover"
                />
                {doctor.verified && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#083f30] rounded-full flex items-center justify-center shadow-lg">
                    <BadgeCheck size={18} className="text-[#eacb7f]" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  {doctor.name}
                </h1>
                <p className="text-sm text-gray-600 mb-1">{doctor.title}</p>
                <p className="text-sm font-semibold text-[#083f30]">
                  {doctor.specialty}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 mb-0.5">
                  {doctor.rating}
                </div>
                <div className="flex items-center justify-center gap-0.5 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="text-xs text-gray-600">{t('stats.reviews', { count: doctor.reviews })}</div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 mb-0.5">
                  {doctor.experience}
                </div>
                <div className="text-xs text-gray-600">{t('stats.yearsExperience')}</div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 mb-0.5">
                  {doctor.patients}
                </div>
                <div className="text-xs text-gray-600">{t('stats.patients')}</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <Building size={16} className="text-[#083f30]" />
                <span className="font-semibold text-gray-900">{doctor.clinic}</span>
              </div>
              
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">{t('status.available')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-5">
        <div className="flex gap-2 mb-6 border-b border-gray-200 -mx-5 px-5">
          {[
            { id: 'about', label: t('tabs.about') },
            { id: 'reviews', label: t('tabs.reviews') },
            { id: 'credentials', label: t('tabs.credentials') },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as 'about' | 'reviews' | 'credentials')}
              className={`pb-3 px-4 font-semibold text-sm transition-colors relative ${
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
        
        {selectedTab === 'about' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">{t('about.title', { name: doctorShortName })}</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {t('about.body', { name: doctor.name })}
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('achievements.title')}</h3>
              <div className="space-y-3">
                {achievements.map((achievement, idx) => (
                  <div key={idx} className="flex gap-4 bg-gray-50 rounded-xl p-4">
                    <div className="w-12 h-12 bg-[#083f30]/10 rounded-xl flex items-center justify-center text-[#083f30] flex-shrink-0">
                      {achievement.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-0.5">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.organization}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t('sections.specializations')}</h3>
              <div className="flex flex-wrap gap-2">
                {specializations.map((spec, idx) => (
                  <span 
                    key={idx}
                    className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">{t('sections.languages')}</h3>
              <div className="flex items-center gap-2">
                <Globe size={20} className="text-[#083f30]" />
                <span className="text-sm text-gray-700">
                  {doctor.languages.join(', ')}
                </span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t('results.title')}</h3>
              <div className="space-y-4">
                {beforeAfter.map((case_, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-2 gap-px bg-gray-200">
                      <div className="relative">
                        <img 
                          src={case_.before}
                          alt={t('results.before')}
                          className="w-full aspect-[4/3] object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                          {t('results.before')}
                        </div>
                      </div>
                      <div className="relative">
                        <img 
                          src={case_.after}
                          alt={t('results.after')}
                          className="w-full aspect-[4/3] object-cover"
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">
                          {t('results.after')}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="font-semibold text-sm text-gray-900 mb-0.5">{case_.procedure}</div>
                      <div className="text-xs text-gray-600">{case_.months}</div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-3 h-11 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                {t('results.viewFullGallery')}
              </button>
            </div>
          </div>
        )}
        
        {selectedTab === 'reviews' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl p-6 text-white">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-2">{doctor.rating}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="fill-[#eacb7f] text-[#eacb7f]" />
                  ))}
                </div>
                <div className="text-white/90">{t('reviews.basedOn', { count: doctor.reviews })}</div>
              </div>
              
              <div className="pt-4 border-t border-white/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#eacb7f] mb-1">{doctor.successRate}</div>
                    <div className="text-sm text-white/80">{t('stats.successRate')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#eacb7f] mb-1">99%</div>
                    <div className="text-sm text-white/80">{t('stats.wouldRecommend')}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
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
                    <div className="flex gap-2 mb-3 overflow-x-auto hide-scrollbar">
                      {review.images.map((img, idx) => (
                        <img 
                          key={idx}
                          src={img}
                          alt={t('reviews.reviewImage')}
                          className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                        />
                      ))}
                    </div>
                  )}
                  
                  <button className="text-xs text-gray-600 hover:text-gray-900 font-medium">
                    {t('reviews.helpful', { count: review.helpful })}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {selectedTab === 'credentials' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap size={22} className="text-[#083f30]" />
                {t('sections.education')}
              </h3>
              <div className="space-y-3">
                {education.map((edu, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{edu.degree}</h4>
                      <span className="text-sm font-semibold text-[#083f30]">{edu.year}</span>
                    </div>
                    <p className="text-sm text-gray-600">{edu.institution}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award size={22} className="text-[#083f30]" />
                {t('sections.certifications')}
              </h3>
              <div className="space-y-2">
                {certifications.map((cert, idx) => (
                  <div 
                    key={idx}
                    className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-4"
                  >
                    {cert.verified && (
                      <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-0.5">{cert.name}</h4>
                      <p className="text-sm text-gray-600">{cert.issuer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <div className="flex gap-3">
                <BadgeCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-900 mb-1">{t('verification.title')}</h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    {t('verification.description', { name: doctorShortName })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 shadow-2xl z-40 safe-area-bottom rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-600 mb-0.5">{t('consultation.title')}</div>
            <div className="font-bold text-[#083f30] text-lg">
              {doctor.consultationFee === 0 ? t('consultation.free') : `$${doctor.consultationFee}`}
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/app/book-consultation')}
            className="h-14 px-8 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
          >
            <Calendar size={20} />
            {t('actions.bookNow')}
          </button>
        </div>
      </div>
    </div>
  );
}
