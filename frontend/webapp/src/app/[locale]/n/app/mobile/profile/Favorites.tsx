"use client"

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useNavigate } from '@/hooks/use-navigate';
import { ChevronLeft, Heart, MapPin, Star, X } from 'lucide-react';

export default function Favorites() {
  const navigate = useNavigate();
  const t = useTranslations("MobileProfile.favorites");
  const [activeTab, setActiveTab] = useState('all');
  
  const favorites = [
    { id: 1, type: 'clinic', name: 'Dubai Healthcare City Clinic', location: 'Healthcare City, Dubai', rating: 4.9, reviews: 1248, image: '/unsplash_images/photo-1519494026892-80bbd2d6fd0d__w=400.jpg' },
    { id: 2, type: 'doctor', name: 'Dr. Sarah Johnson', specialty: 'Cardiologist', location: 'Jumeirah, Dubai', rating: 4.8, reviews: 892, image: '/unsplash_images/photo-1559839734-2b71ea197ec2__w=400.jpg' },
    { id: 3, type: 'salon', name: 'Elegance Beauty Spa', location: 'Marina, Dubai', rating: 4.9, reviews: 654, image: '/unsplash_images/photo-1560066984-138dadb4c035__w=400.jpg' },
    { id: 4, type: 'gym', name: 'FitZone Wellness Center', location: 'Downtown, Dubai', rating: 4.7, reviews: 432, image: '/unsplash_images/photo-1534438327276-14e5300c3a48__w=400.jpg' },
  ];
  
  const tabs = [
    { id: 'all', label: t('tabs.all') },
    { id: 'clinic', label: t('tabs.clinics') },
    { id: 'doctor', label: t('tabs.doctors') },
    { id: 'salon', label: t('tabs.salons') },
    { id: 'gym', label: t('tabs.gyms') },
  ];
  
  const filteredFavorites = activeTab === 'all' 
    ? favorites 
    : favorites.filter(f => f.type === activeTab);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-6 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/app/profile')}
            className="w-10 h-10 -ml-2 flex items-center justify-center text-gray-600"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">{t("title")}</h1>
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
        {filteredFavorites.length > 0 ? (
          <div className="space-y-4">
            {filteredFavorites.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex">
                  <img src={item.image} alt={item.name} className="w-24 h-24 object-cover" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{item.name}</h3>
                        {'specialty' in item && (
                          <p className="text-sm text-gray-600 mb-1">{item.specialty}</p>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin size={14} />
                          <span>{item.location}</span>
                        </div>
                      </div>
                      <button className="w-8 h-8 flex items-center justify-center text-red-500">
                        <Heart size={20} fill="currentColor" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-amber-500" fill="currentColor" />
                      <span className="text-sm font-semibold text-gray-900">{item.rating}</span>
                      <span className="text-sm text-gray-500">({item.reviews})</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Heart size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t("emptyTitle")}</h3>
            <p className="text-gray-600 mb-6">{t("emptyDescription")}</p>
            <button
              onClick={() => navigate('/app/explore')}
              className="px-6 py-3 bg-[#083f30] text-white rounded-xl font-medium"
            >
              {t("exploreServices")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
