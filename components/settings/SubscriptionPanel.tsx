'use client'

import { format } from 'date-fns'
import { CheckCircle2, XCircle, Zap, Star, Building2, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'

const tierConfig: Record<string, { label: string; color: string; bg: string; icon: any; features: string[] }> = {
  starter: {
    label: 'Starter',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    icon: Zap,
    features: [
      'Up to 3 staff members',
      'Appointments & scheduling',
      'Basic EMR / SOAP notes',
      'Client & patient management',
      'Basic billing',
    ],
  },
  growth: {
    label: 'Growth',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    icon: Star,
    features: [
      'Up to 10 staff members',
      'Everything in Starter',
      'AI SOAP notes',
      'Inventory management',
      'Analytics dashboard',
      'Vaccination tracking',
      'WhatsApp reminders',
    ],
  },
  clinic: {
    label: 'Clinic',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    icon: Building2,
    features: [
      'Unlimited staff',
      'Everything in Growth',
      'Voice-to-SOAP',
      'Boarding & grooming',
      'Multi-branch support',
      'Advanced reporting',
      'Priority support',
    ],
  },
  enterprise: {
    label: 'Enterprise',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    icon: Crown,
    features: [
      'Everything in Clinic',
      'Shelter & rescue module',
      'Custom integrations',
      'Dedicated account manager',
      'Custom onboarding',
      'SLA guarantee',
    ],
  },
}

export default function SubscriptionPanel({ clinic }: { clinic: any }) {
  const tier = clinic.subscription_tier ?? 'starter'
  const config = tierConfig[tier] ?? tierConfig.starter
  const TierIcon = config.icon
  const isActive = clinic.subscription_active ?? true
  const endsAt = clinic.subscription_ends_at ? new Date(clinic.subscription_ends_at) : null

  return (
    <div className="space-y-5">
      {/* Current plan */}
      <div className="card-premium p-5 sm:p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Current Plan</h2>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl ${config.bg} flex items-center justify-center shrink-0`}>
            <TierIcon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-bold text-slate-800">{config.label}</h3>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
              }`}>
                {isActive
                  ? <><CheckCircle2 className="h-3 w-3" /> Active</>
                  : <><XCircle className="h-3 w-3" /> Inactive</>
                }
              </span>
            </div>
            {endsAt && (
              <p className="text-sm text-slate-500 mt-1">
                {isActive ? 'Renews' : 'Expired'} on {format(endsAt, 'dd MMM yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="mt-5 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Included in your plan</p>
          {config.features.map((f) => (
            <div key={f} className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-slate-600">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA — hide if enterprise */}
      {tier !== 'enterprise' && (
        <div className="card-premium p-5 sm:p-6 bg-gradient-to-br from-violet-50 to-indigo-50 border-violet-100">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-slate-800">Upgrade your plan</h3>
              <p className="text-sm text-slate-500 mt-1">
                Unlock AI features, multi-branch support, and more.
              </p>
            </div>
            <Button
              className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-xl border-0 shadow-md shadow-violet-200 shrink-0"
              onClick={() => window.open('mailto:sales@vetcareos.com?subject=Upgrade Inquiry', '_blank')}
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>

          {/* All tiers preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {Object.entries(tierConfig).map(([key, t]) => {
              const Icon = t.icon
              const isCurrent = key === tier
              return (
                <div
                  key={key}
                  className={`rounded-xl p-3 text-center border transition-all ${
                    isCurrent
                      ? 'border-violet-300 bg-white shadow-sm'
                      : 'border-slate-200 bg-white/60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center mx-auto mb-2`}>
                    <Icon className={`h-4 w-4 ${t.color}`} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{t.label}</p>
                  {isCurrent && (
                    <p className="text-[10px] text-violet-600 font-medium mt-0.5">Current</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}