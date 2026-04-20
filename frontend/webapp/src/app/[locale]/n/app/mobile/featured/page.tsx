import { useFetchCpCategoryGroups } from '@/features/service-providers/api/client/fetch-cp-category-groups';
import { useFetchExplore } from '@/features/service-providers/api/client/fetch-explore';
import { CpCategoryGroup, ExploreCategory } from '@/features/service-providers/types';
import { Link, useRouter } from '@/i18n/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Suspense,   } from 'react';
import HomeFeaturedServicesSuspenseBoundary from '../home/components/service-providers';
import { PageProps } from "@/types/next";

export default function CategoryBrowser(
  { params, searchParams }: PageProps
) {
  // const router = useRouter();


  


  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 pt-3 pb-4">
        <div className="flex items-center gap-3">
         <Link
            href="/n/app/mobile/home"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </Link> 
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Featured Services</h1>
            <p className="text-sm text-gray-600">Browse all services</p>
          </div>
        </div>
      </div>

      {/* Category Groups */}
      <div className="px-5 py-6 space-y-8">
        <div className="grid grid-cols-4 gap-3">
        <Suspense fallback={<div>hi</div>} >
                  <HomeFeaturedServicesSuspenseBoundary
                    params={params}
                    searchParams={searchParams}
                  />
                </Suspense> 
      </div>
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
            <Link 
             href='/n/app/mobile/search'
              className="bg-[#eacb7f] text-[#083f30] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#e0b654] transition-all shadow-lg"
            >
              Search Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}