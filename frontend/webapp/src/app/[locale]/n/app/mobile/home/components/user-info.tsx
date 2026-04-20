"use client"
import { useCurrentSession } from '@/hooks/use-current-session';
import { UserRole } from '@/types/common';
import { useTranslations } from 'next-intl';
import Link from 'next/link'
import React from 'react'
import { Button, Skeleton } from '../../../design-system/components';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { LogOut, User } from 'lucide-react';
import { signOut } from 'next-auth/react';
import NotificationsBar from '@/features/shared/components/Notifications/notifications-bar';
import LocaleSwitcher from '@/components/locale/locale-switcher';
import UserInfo from '@/components/user-info';

export default function UserInfoSubBar() {
    const { user, status } = useCurrentSession(true);
      const isAdmin = user?.roles?.includes(UserRole.Admin);
      const t = useTranslations("UserInfo");
    
      if (status === "loading") {
        return (
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-full" />
          </div>
        );
      }
    
      if (!user) return null;
    
      const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`;

  return (
    <>
    
      <div className="flex items-center justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-0.5">Good Morning</p>
            <h1 className="text-lg font-bold text-gray-900">
                            {user.firstName} {user.lastName}

            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* <NotificationsBar/> */}
            {/* <Link  
            href='/n/app/mobile/notifications'
            >
             <IconButton 
              icon={<Bell size={22} />} 
              badge={3}
              //onClick={() => navigate('/n/app/mobile/notifications')}
            /> 
            </Link> */}
{/* 
 <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="relative size-8 rounded-full">
          <Avatar>
            <AvatarImage src="/unsplash_images/photo-1494790108377-be9c29b29330__w=100&h=100&fit=crop.jpg"
             alt={user.firstName} />
            <AvatarFallback className="bg-secondary">{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="mb-2 font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none font-medium">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-muted-foreground text-xs leading-none">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            {isAdmin ? (
              <Link href="/admin/dashboard">
                <User className="mr-2 h-4 w-4" />
                <span>{t("adminPanel")}</span>
              </Link>
            ) : (
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                <span>{t("profile")}</span>
              </Link>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu> */}
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

              {/*  <div className="flex items-center gap-4">
          <NotificationsBar/>
          <LocaleSwitcher />
          <UserInfo />
        </div> */}
          </div>
        </div>
        </>
  )
}
