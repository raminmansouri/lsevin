"use client"
import { useRouter } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoryBrowser() {
  const router = useRouter();

  
  const categoryGroups = [
    {
      title: 'Medical Services',
      categories: [
        { 
          name: 'Hair Transplant', 
          image: '/unsplash_images/photo-1622296089863-eb7fc530daa8__w=400&h=300&fit=crop.jpg',
          count: 142,
          gradient: 'from-red-500/90 to-red-600/90'
        },
        { 
          name: 'Dental Care', 
          image: '/unsplash_images/photo-1606811971618-4486d14f3f99__w=400&h=300&fit=crop.jpg',
          count: 198,
          gradient: 'from-blue-500/90 to-blue-600/90'
        },
        { 
          name: 'IVF & Fertility', 
          image: '/unsplash_images/photo-1584515979956-d9f6e5d09982__w=400&h=300&fit=crop.jpg',
          count: 67,
          gradient: 'from-pink-500/90 to-pink-600/90'
        },
        { 
          name: 'Plastic Surgery', 
          image: '/unsplash_images/photo-1512678080530-7760d81faba6__w=400&h=300&fit=crop.jpg',
          count: 89,
          gradient: 'from-purple-500/90 to-purple-600/90'
        },
        { 
          name: 'Eye Surgery', 
          image: '/unsplash_images/photo-1585435557343-3b092031a831__w=400&h=300&fit=crop.jpg',
          count: 54,
          gradient: 'from-cyan-500/90 to-cyan-600/90'
        },
        { 
          name: 'Orthopedics', 
          image: '/unsplash_images/photo-1579684385127-1ef15d508118__w=400&h=300&fit=crop.jpg',
          count: 76,
          gradient: 'from-green-500/90 to-green-600/90'
        },
      ]
    },
    {
      title: 'Beauty & Wellness',
      categories: [
        { 
          name: 'Spa & Massage', 
          image: '/unsplash_images/photo-1540555700478-4be289fbecef__w=400&h=300&fit=crop.jpg',
          count: 124,
          gradient: 'from-emerald-500/90 to-emerald-600/90'
        },
        { 
          name: 'Hair Salon', 
          image: '/unsplash_images/photo-1560066984-138dadb4c035__w=400&h=300&fit=crop.jpg',
          count: 156,
          gradient: 'from-rose-500/90 to-rose-600/90'
        },
        { 
          name: 'Skin Care', 
          image: '/unsplash_images/photo-1570172619644-dfd03ed5d881__w=400&h=300&fit=crop.jpg',
          count: 92,
          gradient: 'from-amber-500/90 to-amber-600/90'
        },
        { 
          name: 'Nail Studio', 
          image: '/unsplash_images/photo-1604654894610-df63bc536371__w=400&h=300&fit=crop.jpg',
          count: 78,
          gradient: 'from-pink-500/90 to-pink-600/90'
        },
      ]
    },
    {
      title: 'Fitness & Sports',
      categories: [
        { 
          name: 'Gym & Fitness', 
          image: '/unsplash_images/photo-1534438327276-14e5300c3a48__w=400&h=300&fit=crop.jpg',
          count: 89,
          gradient: 'from-orange-500/90 to-orange-600/90'
        },
        { 
          name: 'Yoga Studio', 
          image: '/unsplash_images/photo-1544367567-0f2fcb009e0b__w=400&h=300&fit=crop.jpg',
          count: 45,
          gradient: 'from-purple-500/90 to-purple-600/90'
        },
        { 
          name: 'Personal Training', 
          image: '/unsplash_images/photo-1571019614242-c5c5dee9f50b__w=400&h=300&fit=crop.jpg',
          count: 67,
          gradient: 'from-red-500/90 to-red-600/90'
        },
        { 
          name: 'Pilates', 
          image: '/unsplash_images/photo-1518611012118-696072aa579a__w=400&h=300&fit=crop.jpg',
          count: 34,
          gradient: 'from-teal-500/90 to-teal-600/90'
        },
      ]
    },
    {
      title: 'Hospitality',
      categories: [
        { 
          name: 'Hotels', 
          image: '/unsplash_images/photo-1566073771259-6a8506099945__w=400&h=300&fit=crop.jpg',
          count: 189,
          gradient: 'from-blue-500/90 to-blue-600/90'
        },
        { 
          name: 'Resorts', 
          image: '/unsplash_images/photo-1520250497591-112f2f40a3f4__w=400&h=300&fit=crop.jpg',
          count: 98,
          gradient: 'from-cyan-500/90 to-cyan-600/90'
        },
        { 
          name: 'Wellness Retreats', 
          image: '/unsplash_images/photo-1545205597-3d9d02c29597__w=400&h=300&fit=crop.jpg',
          count: 56,
          gradient: 'from-emerald-500/90 to-emerald-600/90'
        },
      ]
    },
    {
      title: 'Other Services',
      categories: [
        { 
          name: 'Pharmacy', 
          image: '/unsplash_images/photo-1576602976047-174e57a47881__w=400&h=300&fit=crop.jpg',
          count: 92,
          gradient: 'from-teal-500/90 to-teal-600/90'
        },
        { 
          name: 'Health Education', 
          image: '/unsplash_images/photo-1523240795612-9a054b0db644__w=400&h=300&fit=crop.jpg',
          count: 45,
          gradient: 'from-indigo-500/90 to-indigo-600/90'
        },
        { 
          name: 'Medical Tourism', 
          image: '/unsplash_images/photo-1469854523086-cc02fe5d8800__w=400&h=300&fit=crop.jpg',
          count: 234,
          gradient: 'from-violet-500/90 to-violet-600/90'
        },
      ]
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
            <p className="text-sm text-gray-600">Browse all services</p>
          </div>
        </div>
      </div>

      {/* Category Groups */}
      <div className="px-5 py-6 space-y-8">
        {categoryGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">{group.title}</h2>
              <span className="text-sm font-medium text-gray-500">
                {group.categories.reduce((sum, cat) => sum + cat.count, 0)} providers
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {group.categories.map((category, catIdx) => (
                <button
                  key={catIdx}
                  onClick={() => router.push(`/app/search-results?q=${encodeURIComponent(category.name)}`)}
                  className="relative rounded-2xl overflow-hidden aspect-[4/3] group shadow-sm hover:shadow-xl transition-all active:scale-95"
                >
                  <img 
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient}`} />
                  
                  <div className="relative z-10 h-full flex flex-col justify-end p-4">
                    <h3 className="text-white font-bold text-base mb-1 leading-tight">
                      {category.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-white/90 text-xs">{category.count} providers</p>
                      <ChevronRight size={16} className="text-white/90" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* CTA Banner */}
      <div className="px-5 pb-8">
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#083f30] to-[#0a5a44] p-6">
          <div className="relative z-10">
            <h3 className="text-white font-bold text-lg mb-2">
              Can't find what you're looking for?
            </h3>
            <p className="text-white/90 text-sm mb-4">
              Use our smart search to find exactly what you need
            </p>
            <button 
              onClick={() => router.push('/app/search')}
              className="bg-[#eacb7f] text-[#083f30] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e0b654] transition-all shadow-lg"
            >
              Search Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}