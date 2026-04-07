"use client"
import { IconButton } from '@/app/[locale]/n/app/design-system/mobile-components'
import { withBaseHeaders } from '@/config/http/http-service.server';
import { useNotificationCount } from '@/features/notification/api/client/get-notification-count';
import { Link } from '@/i18n/navigation'
import { Bell } from 'lucide-react'
import { useLocale } from 'next-intl';
import React from 'react'

export default  function NotificationsBar() {

    const locale = useLocale()          // e.g. "en", "fr", etc.
 
 const {
    data,
    error,
    isFetching,
    refetch,
  } = useNotificationCount(locale);

  // const data = await withBaseHeaders((locale, token) => {
  //   return getNotificationCount( { locale, token });
  // });
console.log('notificationbar',data)

    
  return (
    <>
     <Link 
            href='/n/app/mobile/notifications'
            >
             <IconButton 
              icon={<Bell size={22} />} 
              badge={data?.count }
              //onClick={() => navigate('/n/app/mobile/notifications')}
            /> 
            </Link>
    </>
  )
}
