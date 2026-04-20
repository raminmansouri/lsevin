import {ProviderPageDataResponse} from "@/features/service-providers/types/provider-page-types.ts";
import { ADMIN_BASE_PATH, CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { getProviderPageDataTag, getServiceProviderIdTag } from "../../db/cache";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { cacheLife } from "next/dist/server/use-cache/cache-life";
import { BaseRequest } from "@/types/common";
import { readData } from "@/config/http/http-service.server";
import { ApiReturnType } from "@/types/network";

/**
 * Replace the URL with whatever backend you use.
 * This stub just returns a static payload; in production you would
 * call your real API (`/api/providers/${id}?lang=${locale}` etc.).
 */
export async function getProviderPageData(
  request: BaseRequest,
  providerId: string,
): Promise<ApiReturnType<ProviderPageDataResponse>> {

    "use cache: remote";
    cacheTag(getProviderPageDataTag(providerId));
    cacheLife("default");

    const res = await readData<ProviderPageDataResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/getProviderPageData/${providerId}`,
    {
        ...request,
      },           // ← no browser caching
    );

    return res;
}



const provider = {
    id: 'id' || '1',
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
  
  const services = [
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
  
  const specialists = [
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
      review: 'Exceptional service from start to finish. The provider is modern, staff is professional, and Dr. Mehmet is a true expert. Results exceeded my expectations!',
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
      review: 'Outstanding quality at a fraction of US prices. The provider arranged everything - hotel, transfer, translator. Felt safe and well cared for throughout.',
      verified: true,
      helpful: 28
    },
  ];
  // Recommendation data
  const localRecommendations = [
    {
      id: 'provider-local-1',
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
      id: 'provider-local-2',
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
      id: 'provider-int-1',
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
      id: 'provider-int-2',
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
