//"use client"
// import { useNavigate } from '@/hooks/use-navigate';
import { 
  Search, 
  Bell, 
  MapPin, 
  ChevronRight, 
  TrendingUp, 
  Sparkles, 
  Gift, 
  Heart,
  Star,
  BadgeCheck,
  Award,
  Map,
  Clock,
  Users,
  ChevronDown
} from 'lucide-react';
import { IconButton } from '../../design-system/mobile-components';
import { Chip } from '../../design-system/components';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { TRANSLATION_KEY } from '@/features/consulting/types/constants';
import { useNavigate } from '@/hooks/use-navigate';
// import { useLocalization } from '../../contexts/LocalizationContext';
import { ServiceProvidersCategoriesSuspenseBoundary } from './components/service-providers-category';
import LocationPicker from './components/location-picker';
import { getTranslations } from 'next-intl/server';
import { Metadata } from 'next';
import { Link, redirect } from '@/i18n/navigation';
import HomeFeaturedServicesSuspenseBoundary from './components/service-providers';
import HomeTrendingServicesSuspenseBoundary from './components/trending-services';
import HomeTrustedProvidersSuspenseBoundary from './components/trusted-providers';
import { PageProps } from "@/types/next";


/* export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations(TRANSLATION_KEY);

  return {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(","),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  };
}
 */

function Home({ params, searchParams }: PageProps)  {


    const t = useTranslations();
  
  const navigate = redirect //useNavigate();
  // const { isRTL } = useLocalization();

  const categories = [
    { 
      id: 1,
      label: 'Medical', 
      path: '/n/app/mobile/medical/clinics', 
      image: '/unsplash_images/photo-1631217868264-e5b90bb7e133__w=400&h=300&fit=crop.jpg',
      gradient: 'from-red-500/90 to-red-600/90'
    },
    { 
      id: 2,
      label: 'Beauty & Spa', 
      path: '/n/app/mobile/beauty', 
      image: '/unsplash_images/photo-1560066984-138dadb4c035__w=400&h=300&fit=crop.jpg',
      gradient: 'from-pink-500/90 to-rose-600/90'
    },
    { 
      id: 3,
      label: 'Fitness', 
      path: '/n/n/app/mobile/mobile/fitness', 
      image: '/unsplash_images/photo-1534438327276-14e5300c3a48__w=400&h=300&fit=crop.jpg',
      gradient: 'from-purple-500/90 to-purple-600/90'
    },
    { 
      id: 4,
      label: 'Hotels', 
      path: '/n/app/mobile/hotels', 
      image: '/unsplash_images/photo-1566073771259-6a8506099945__w=400&h=300&fit=crop.jpg',
      gradient: 'from-blue-500/90 to-blue-600/90'
    },
    { 
      id: 5,
      label: 'Pharmacy', 
      path: '/n/app/mobile/pharmacy', 
      image: '/unsplash_images/photo-1576602976047-174e57a47881__w=400&h=300&fit=crop.jpg',
      gradient: 'from-teal-500/90 to-teal-600/90'
    },
    { 
      id: 6,
      label: 'Education', 
      path: '/n/app/mobile/education', 
      image: '/unsplash_images/photo-1523240795612-9a054b0db644__w=400&h=300&fit=crop.jpg',
      gradient: 'from-amber-500/90 to-orange-600/90'
    },
  ];
  
  const quickSearches = [
    'Hair Transplant',
    'Dental Veneers', 
    'Spa Day',
    'IVF Treatment',
    'Gym Membership'
  ];
  
  
  
  
  
  
  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <div className="bg-white px-5 pt-3 pb-4 border-b border-gray-100 sticky top-0 z-40 backdrop-blur-xl bg-white/95">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Good Morning</p>
            <h1 className="text-lg font-bold text-gray-900">Sarah Anderson</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link 
            href='/n/app/mobile/notifications'
            >
             <IconButton 
              icon={<Bell size={22} />} 
              badge={3}
              //onClick={() => navigate('/n/app/mobile/notifications')}
            /> 
            </Link>

            <Link 
              href='/n/app/mobile/profile'
              className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#eacb7f]/30"
            >
              <img 
                src="/unsplash_images/photo-1494790108377-be9c29b29330__w=100&h=100&fit=crop.jpg" 
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </Link>
          </div>
        </div>
        
     
     <LocationPicker/>
      </div>
      
      {/* Premium Search Bar */}
      <div className="px-5 py-4 bg-gray-50">
        <Link
        href='/n/app/mobile/search'
          // onClick={() => navigate('/n/app/mobile/search')}
          className="w-full h-14 bg-white rounded-2xl px-5 flex items-center gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-all"
        >
          <Search size={22} className="text-[#083f30]" />
          <span className="text-gray-500 font-medium">Search treatments, clinics...</span>
        </Link>
        
        {/* Quick Search Chips */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mt-3 pb-1">
          {quickSearches.map(search => (
            <button
              key={search}
              className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200 hover:border-[#083f30] hover:text-[#083f30] transition-colors whitespace-nowrap"
            >
              {search}
            </button>
          ))}
        </div>
      </div>
      
      {/* Hero Banner - Premium */}
      <div className="px-5 py-6">
        <div className="relative rounded-3xl overflow-hidden h-48 shadow-lg">
          <img 
            src="/unsplash_images/photo-1540555700478-4be289fbecef__w=1200&h=600&fit=crop.jpg"
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#083f30]/95 via-[#083f30]/85 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-center px-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-[#eacb7f]" />
              <span className="text-xs font-bold text-[#eacb7f] uppercase tracking-wide">Limited Time</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
              Get 20% Off<br />Premium Packages
            </h2>
            <p className="text-white/90 text-sm mb-4 font-medium">
              First-time bookings only • Valid until Mar 15
            </p>
            <div>
              <Link
              href='/n/app/mobile/offers' 
                // onClick={() => navigate('/n/app/mobile/offers')}
                className="bg-[#eacb7f] text-[#083f30] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e0b654] transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                Explore Offers
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Premium Categories Grid */}
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Explore Services</h2>
          <Link
          href='/n/app/mobile/categories' 

            // onClick={() => navigate('/n/app/mobile/categories')}
            className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
          >
            View All
            <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-3">

         <Suspense fallback={<div>hi</div>} >
                  <ServiceProvidersCategoriesSuspenseBoundary
                    params={params}
                    searchParams={searchParams}
                  />
                </Suspense> 

          {/* {categories.map(cat => (
            <Link
            href={cat.path}
              key={cat.id}
              // onClick={() => navigate(cat.path)}
              className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-xl transition-all active:scale-95"
            >
              <img 
                src={cat.image}
                alt={cat.label}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${cat.gradient}`} />
              
              <div className="relative z-10 h-full flex items-end p-4">
                <h3 className="text-white font-bold text-lg">{cat.label}</h3>
              </div>
            </Link>
          ))} */}
        </div>
      </div>
      
      {/* Featured Services - Premium Horizontal Scroll */}
      <div className="pb-8">
        <div className="px-5 flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Featured Services</h2>
            <p className="text-sm text-gray-600">Handpicked by our experts</p>
          </div>
          <Link
          href='/n/app/mobile/featured' 
            // onClick={() => navigate('/n/app/mobile/featured')}
            className="text-sm font-semibold text-[#083f30] hover:underline flex items-center gap-1"
          >
            See All
            <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">

 <Suspense fallback={<div>hi</div>} >
                  <HomeFeaturedServicesSuspenseBoundary
                    params={params}
                    searchParams={searchParams}
                  />
                </Suspense> 
         
        </div>
      </div>
      
      {/* Native Ad Banner - Premium */}
      <div className="px-5 pb-8">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img 
            src="/unsplash_images/photo-1544367567-0f2fcb009e0b__w=1200&h=400&fit=crop.jpg"
            alt="Sponsored"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-transparent" />
          
          <div className="relative z-10 p-6">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white uppercase tracking-wide mb-3">
              Sponsored
            </span>
            <h3 className="text-xl font-bold text-white mb-2">
              Premium Wellness Retreat in Bali
            </h3>
            <p className="text-white/90 text-sm mb-4 max-w-xs">
              Transform your health with our exclusive 7-day detox & rejuvenation program
            </p>
            <button className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all shadow-lg">
              Learn More
            </button>
          </div>
        </div>
      </div>
      
      {/* Trending Treatments */}
      <div className="pb-8">
        <div className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={22} className="text-orange-500" />
            <h2 className="text-xl font-bold text-gray-900">Trending This Month</h2>
          </div>
          <p className="text-sm text-gray-600">Most booked treatments right now</p>
        </div>
        
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-5 pb-2">
        
 <Suspense fallback={<div>hi</div>} >
                  <HomeTrendingServicesSuspenseBoundary
                    params={params}
                    searchParams={searchParams}
                  />
                </Suspense> 
        
        
         
        </div>
      </div>
      
      {/* Map Discovery Preview */}
      <div className="px-5 pb-8">
        <Link 
        href={'/n/app/mobile/map'}
          // onClick={() => navigate('/n/app/mobile/map')}
          className="w-full relative rounded-2xl overflow-hidden h-48 shadow-lg hover:shadow-xl transition-all active:scale-98"
        >
          <img 
            src="/unsplash_images/photo-1524661135-423995f22d0b__w=1200&h=600&fit=crop.jpg"
            alt="Map"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <div className="relative z-10 h-full flex flex-col justify-end p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Map size={20} className="text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-white font-bold text-lg">Explore Nearby</h3>
                <p className="text-white/90 text-sm">124 providers near you</p>
              </div>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Trusted Providers */}
      <div className="pb-8">
        <div className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Award size={22} className="text-[#083f30]" />
            <h2 className="text-xl font-bold text-gray-900">Trusted Providers</h2>
          </div>
          <p className="text-sm text-gray-600">Verified by our medical board</p>
        </div>
        
        <div className="flex gap-4 overflow-x-auto hide-scrollbar px-5 pb-2">
             <Suspense fallback={<div>hi</div>} >
                  <HomeTrustedProvidersSuspenseBoundary
                    params={params}
                    searchParams={searchParams}
                  />
                </Suspense> 

        </div>
      </div>
      
      {/* Premium Packages Banner */}
      <div className="px-5 pb-8">
        <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#eacb7f]/10 rounded-full -mr-8 -mt-8" />
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-[#eacb7f]/10 rounded-full mr-6 -mb-12" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-12 h-12 bg-[#eacb7f]/20 rounded-xl flex items-center justify-center">
                <Sparkles size={24} className="text-[#eacb7f]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Premium Packages</h3>
                <p className="text-white/80 text-sm">Save up to 40%</p>
              </div>
            </div>
            
            <p className="text-white/90 text-sm mb-4 leading-relaxed">
              Bundle services and save big. All-inclusive packages with accommodation, transfers, and aftercare.
            </p>
            
            <button className="bg-[#eacb7f] text-[#083f30] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e0b654] transition-all shadow-lg">
              View Packages
            </button>
          </div>
        </div>
      </div>
      
      {/* Loyalty Club CTA */}
      <div className="px-5 pb-28">
        <div className="relative rounded-2xl overflow-hidden shadow-lg">
          <img 
            src="/unsplash_images/photo-1545205597-3d9d02c29597__w=1200&h=400&fit=crop.jpg"
            alt="Loyalty"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#eacb7f]/95 to-[#e0b654]/90" />
          
          <div className="relative z-10 p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-[#083f30]/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Gift size={28} className="text-[#083f30]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-xl text-[#083f30] mb-2">
                  Join Loyalty Club
                </h3>
                <p className="text-[#083f30]/80 text-sm mb-4 leading-relaxed">
                  Earn points on every booking, unlock exclusive rewards, and get priority access to new services.
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-[#083f30]">5%</span>
                    </div>
                    <span className="text-xs font-semibold text-[#083f30]">Cashback</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Award size={16} className="text-[#083f30]" />
                    </div>
                    <span className="text-xs font-semibold text-[#083f30]">Rewards</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-8 h-8 bg-[#083f30]/10 rounded-lg flex items-center justify-center">
                      <Star size={16} className="text-[#083f30]" />
                    </div>
                    <span className="text-xs font-semibold text-[#083f30]">VIP Access</span>
                  </div>
                </div>
                <Link
                href='/n/app/mobile/profile/rewards' 
                  // onClick={() => navigate('/n/app/mobile/rewards')}
                  className="bg-[#083f30] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#0a5a44] transition-all shadow-lg active:scale-95"
                >
                  Join Now - It's Free
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Home.getInitialProps = async ({ context }) => {
//   // Access and process additional data as needed
//   const { locales } = await getLocales();

//   return { context };
// }

export default Home;