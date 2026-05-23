'use client'

import { useState } from 'react'
import { Building2, Globe, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import ClinicProfileForm from './ClinicProfileForm'
import LocalizationForm from './LocalizationForm'
import SubscriptionPanel from './SubscriptionPanel'

const tabs = [
  { id: 'profile',      label: 'Clinic Profile',  icon: Building2 },
  { id: 'localization', label: 'Localization',     icon: Globe },
  { id: 'subscription', label: 'Subscription',     icon: CreditCard },
]

export default function SettingsTabs({ clinic, isAdmin }: { clinic: any; isAdmin: boolean }) {
  const [active, setActive] = useState('profile')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
              active === id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {active === 'profile'      && <ClinicProfileForm  clinic={clinic} isAdmin={isAdmin} />}
      {active === 'localization' && <LocalizationForm   clinic={clinic} isAdmin={isAdmin} />}
      {active === 'subscription' && <SubscriptionPanel  clinic={clinic} />}
    </div>
  )
}