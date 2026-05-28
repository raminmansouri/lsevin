'use client'
import { LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import React from 'react'

export default function SignOutButton() {
  const t = useTranslations('MobileProfile.common')

  return (
    <>
    <button onClick={() => signOut()} className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition text-red-600">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <LogOut size={20} />
          </div>
          <span className="flex-1 text-left font-medium">{t('logOut')}</span>
        </button>
        </>
  )
}
