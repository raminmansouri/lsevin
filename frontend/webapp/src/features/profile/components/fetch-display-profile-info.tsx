'use client'
import { useNavigate } from '@/hooks/use-navigate';
import React, { useMemo } from 'react'
import { EditProfileInitialData } from '../schemas/profile.schema';
import { resolveMediaUrl } from './profile-image-picker';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';
import { ImageWithFallback } from '@/components/ui/image-with-fallback';

export default function FetchDisplayProfileInfo({profile}:{profile:EditProfileInitialData}) {
  const navigate = useNavigate();
  const resolvedImageUrl = useMemo(
    () => resolveHomeMediaUrl(profile?.profileImageUrl),
    [profile?.profileImageUrl]
  );

  const fullName=`${profile?.firstName} ${profile?.lastName}`;


  const initials = useMemo(() => {
    const value = fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");

    return value || "U";
  }, [fullName]);

  return (
    <><div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden">
            {/* <img 
              src="/unsplash_images/photo-1494790108377-be9c29b29330__w=200&h=200&fit=crop.jpg" 
              alt="Profile"
              className="w-full h-full object-cover"
            /> */}
         {/*    <Avatar>
              
            <ImageWithFallback width={100} height={100} src={resolvedImageUrl}
             alt={`${profile.firstName} ${profile.lastName}`} />
            <AvatarFallback className="bg-secondary">{initials}</AvatarFallback>
          </Avatar>
            */} 
              <ImageWithFallback width={100} height={100} src={resolvedImageUrl}
             alt={`${profile?.firstName} ${profile?.lastName}`} />
     
 

 {/* 
  */}
      
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">{profile.firstName} {profile.lastName}</h1>
            <p className="text-sm text-gray-500">{profile.email}</p>
           
            <button 
              onClick={() => navigate('/n/app/mobile/profile/EditProfile')}
              className="mt-2 text-sm font-semibold text-[#083f30] hover:underline"
            >
              Edit Profile
            </button>
          </div>
        </div>
        </>
  )
}
