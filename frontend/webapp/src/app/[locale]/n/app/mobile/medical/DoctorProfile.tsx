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
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { useState } from 'react';

export default function DoctorProfile() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedTab, setSelectedTab] = useState<'about' | 'reviews' | 'credentials'>('about');
  const [isFavorited, setIsFavorited] = useState(false);
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: doctor.name,
          text: `Check out ${doctor.name} - ${doctor.specialty}`,
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
  
  const doctor = {
    id: id || '1',
    name: 'Dr. Mehmet Yavuz',
    title: 'MD, FISHRS',
    specialty: 'Hair Transplant & Restoration Surgeon',
    image: '/unsplash_images/photo-1612349317150-e413f6a5b16d__w=800&h=800&fit=crop.jpg',
    rating: 4.9,
    reviews: 847,
    experience: 18,
    patients: '12,000+',
    successRate: '98.5%',
    verified: true,
    languages: ['English', 'Turkish', 'Arabic'],
    clinic: 'Istanbul Medical Center',
    clinicId: '1',
    location: 'Istanbul, Turkey',
    responseTime: '< 1 hour',
    consultationFee: 0,
  };
  
  const education = [
    {
      degree: 'Doctor of Medicine (MD)',
      institution: 'Istanbul University Medical School',
      year: '2002',
    },
    {
      degree: 'Hair Transplant Surgery Fellowship',
      institution: 'American Academy of Cosmetic Surgery',
      year: '2006',
    },
    {
      degree: 'Advanced FUE Training',
      institution: 'International Society of Hair Restoration Surgery',
      year: '2008',
    },
  ];
  
  const certifications = [
    { name: 'Fellow of ISHRS', issuer: 'International Society of Hair Restoration Surgery', verified: true },
    { name: 'Board Certified Surgeon', issuer: 'Turkish Medical Board', verified: true },
    { name: 'FUE Master Certificate', issuer: 'European Hair Institute', verified: true },
    { name: 'Advanced Sapphire FUE', issuer: 'World Hair Academy', verified: true },
  ];
  
  const specializations = [
    'FUE Hair Transplant',
    'Sapphire FUE Technique',
    'DHI (Direct Hair Implantation)',
    'Beard & Eyebrow Transplant',
    'Revision Hair Transplant',
    'PRP Therapy for Hair Loss',
  ];
  
  const achievements = [
    { icon: <Award size={24} />, title: 'Best Hair Surgeon 2023', organization: 'Turkish Medical Excellence' },
    { icon: <Users size={24} />, title: '12,000+ Patients', organization: 'From 65+ Countries' },
    { icon: <Star size={24} />, title: 'Top 1% Worldwide', organization: 'Hair Transplant Surgeons' },
    { icon: <TrendingUp size={24} />, title: '98.5% Success Rate', organization: 'Verified Patient Outcomes' },
  ];
  
  const recentReviews = [
    {
      id: 1,
      name: 'Michael Thompson',
      country: 'USA',
      date: '2 weeks ago',
      rating: 5,
      treatment: 'Hair Transplant',
      review: 'Dr. Yavuz is an absolute master of his craft. The results are beyond my expectations - natural hairline, dense coverage, minimal scarring. His attention to detail and artistic approach are exceptional. The entire team was professional and caring throughout the journey.',
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
      country: 'Saudi Arabia',
      date: '1 month ago',
      rating: 5,
      treatment: 'Hair Transplant',
      review: 'Flew from Riyadh specifically for Dr. Yavuz and it was worth every mile. His expertise is unmatched. He took time to explain every step, designed a perfect hairline, and the procedure was painless. 6 months post-op and growth is fantastic!',
      verified: true,
      helpful: 89
    },
    {
      id: 3,
      name: 'David Chen',
      country: 'UK',
      date: '1 month ago',
      rating: 5,
      treatment: 'Hair Transplant',
      review: 'After researching 20+ surgeons worldwide, I chose Dr. Yavuz and couldn\'t be happier. His technique is flawless, results look completely natural, and his team provided excellent care. Highly recommend!',
      verified: true,
      helpful: 67
    },
  ];
  
  const beforeAfter = [
    {
      before: '/unsplash_images/photo-1629909613654-28e377c37b09__w=400&h=300&fit=crop.jpg',
      after: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg',
      procedure: 'Hair Transplant - 4500 Grafts',
      months: '12 months post-op'
    },
    {
      before: '/unsplash_images/photo-1629909613654-28e377c37b09__w=400&h=300&fit=crop.jpg',
      after: 'https://images.unsplash.com/photo-1629909615957-be38eea5915d?w=400&h=300&fit=crop',
      procedure: 'Hair Transplant - 3800 Grafts',
      months: '10 months post-op'
    },
  ];
  
  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#083f30] to-[#0a5a44] h-48" />
        
        {/* Navigation */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
          >
            <ArrowLeft size={20} className="text-gray-900" />
          </button>
          
          <button 
            onClick={handleShare}
            className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform active:scale-95"
          >
            <Share2 size={20} className="text-gray-900" />
          </button>
        </div>
        
        {/* Profile Card */}
        <div className="relative z-10 px-5 pb-6">
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex gap-4 mb-4">
              {/* Avatar */}
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
              
              {/* Info */}
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
            
            {/* Stats Grid */}
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
                <div className="text-xs text-gray-600">{doctor.reviews} reviews</div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 mb-0.5">
                  {doctor.experience}
                </div>
                <div className="text-xs text-gray-600">Years Exp.</div>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-gray-900 mb-0.5">
                  {doctor.patients}
                </div>
                <div className="text-xs text-gray-600">Patients</div>
              </div>
            </div>
            
            {/* Quick Info */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <Building size={16} className="text-[#083f30]" />
                <span className="font-semibold text-gray-900">{doctor.clinic}</span>
              </div>
              
              <div className="flex items-center gap-1 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-gray-600">Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-5">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 -mx-5 px-5">
          {[
            { id: 'about', label: 'About' },
            { id: 'reviews', label: 'Reviews' },
            { id: 'credentials', label: 'Credentials' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
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
        
        {/* About Tab */}
        {selectedTab === 'about' && (
          <div className="space-y-6">
            {/* Bio */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">About Dr. {doctor.name.split(' ')[1]}</h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                Dr. Mehmet Yavuz is one of the world's leading hair transplant surgeons with over 18 years of experience. He has performed more than 12,000 successful hair restoration procedures for patients from 65+ countries. His expertise in advanced FUE techniques, combined with an artistic eye for natural hairline design, has earned him international recognition.
              </p>
            </div>
            
            {/* Achievements */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Achievements & Recognition</h3>
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
            
            {/* Specializations */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Specializations</h3>
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
            
            {/* Languages */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Languages</h3>
              <div className="flex items-center gap-2">
                <Globe size={20} className="text-[#083f30]" />
                <span className="text-sm text-gray-700">
                  {doctor.languages.join(', ')}
                </span>
              </div>
            </div>
            
            {/* Before/After */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Results Gallery</h3>
              <div className="space-y-4">
                {beforeAfter.map((case_, idx) => (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-2 gap-px bg-gray-200">
                      <div className="relative">
                        <img 
                          src={case_.before}
                          alt="Before"
                          className="w-full aspect-[4/3] object-cover"
                        />
                        <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-lg">
                          Before
                        </div>
                      </div>
                      <div className="relative">
                        <img 
                          src={case_.after}
                          alt="After"
                          className="w-full aspect-[4/3] object-cover"
                        />
                        <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-lg">
                          After
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
                View Full Gallery
              </button>
            </div>
          </div>
        )}
        
        {/* Reviews Tab */}
        {selectedTab === 'reviews' && (
          <div className="space-y-6">
            {/* Rating Summary */}
            <div className="bg-gradient-to-br from-[#083f30] to-[#0a5a44] rounded-2xl p-6 text-white">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold mb-2">{doctor.rating}</div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} className="fill-[#eacb7f] text-[#eacb7f]" />
                  ))}
                </div>
                <div className="text-white/90">Based on {doctor.reviews} reviews</div>
              </div>
              
              <div className="pt-4 border-t border-white/20">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#eacb7f] mb-1">{doctor.successRate}</div>
                    <div className="text-sm text-white/80">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#eacb7f] mb-1">99%</div>
                    <div className="text-sm text-white/80">Would Recommend</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Reviews List */}
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
        )}
        
        {/* Credentials Tab */}
        {selectedTab === 'credentials' && (
          <div className="space-y-6">
            {/* Education */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <GraduationCap size={22} className="text-[#083f30]" />
                Education
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
            
            {/* Certifications */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Award size={22} className="text-[#083f30]" />
                Certifications & Memberships
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
            
            {/* Verification Notice */}
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
              <div className="flex gap-3">
                <BadgeCheck size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-900 mb-1">Verified by LSevin</h3>
                  <p className="text-sm text-green-800 leading-relaxed">
                    All credentials have been verified by our medical board. Dr. {doctor.name.split(' ')[1]} meets the highest standards of medical excellence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 shadow-2xl z-40 safe-area-bottom rounded-t-3xl">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-gray-600 mb-0.5">Consultation</div>
            <div className="font-bold text-[#083f30] text-lg">
              {doctor.consultationFee === 0 ? 'Free' : `$${doctor.consultationFee}`}
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/app/book-consultation')}
            className="h-14 px-8 bg-gradient-to-r from-[#083f30] to-[#0a5a44] text-white rounded-2xl font-bold hover:shadow-xl transition-all active:scale-95 flex items-center gap-2"
          >
            <Calendar size={20} />
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}