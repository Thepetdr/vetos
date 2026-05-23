'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

const timezones = [
  { value: 'Asia/Dubai',     label: 'Asia/Dubai (GST +4)' },
  { value: 'Asia/Riyadh',    label: 'Asia/Riyadh (AST +3)' },
  { value: 'Asia/Kuwait',    label: 'Asia/Kuwait (AST +3)' },
  { value: 'Asia/Bahrain',   label: 'Asia/Bahrain (AST +3)' },
  { value: 'Asia/Muscat',    label: 'Asia/Muscat (GST +4)' },
  { value: 'Asia/Qatar',     label: 'Asia/Qatar (AST +3)' },
  { value: 'Europe/London',  label: 'Europe/London (GMT/BST)' },
  { value: 'UTC',            label: 'UTC' },
]

const currencies = [
  { value: 'AED', label: 'AED — UAE Dirham' },
  { value: 'SAR', label: 'SAR — Saudi Riyal' },
  { value: 'QAR', label: 'QAR — Qatari Riyal' },
  { value: 'KWD', label: 'KWD — Kuwaiti Dinar' },
  { value: 'BHD', label: 'BHD — Bahraini Dinar' },
  { value: 'OMR', label: 'OMR — Omani Rial' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'EUR', label: 'EUR — Euro' },
]

export default function LocalizationForm({ clinic, isAdmin }: { clinic: any; isAdmin: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    timezone: clinic.timezone ?? 'Asia/Dubai',
    currency: clinic.currency ?? 'AED',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setLoading(true)

    const { error } = await supabase
      .from('clinics')
      .update({ timezone: form.timezone, currency: form.currency })
      .eq('id', clinic.id)

    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success('Localization settings updated')
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Only admins and managers can edit clinic settings.
        </div>
      )}

      <div className="card-premium p-5 sm:p-6 space-y-5">
        <h2 className="font-semibold text-slate-700">Regional Settings</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select
              value={form.timezone}
              onValueChange={(v) => setForm((p) => ({ ...p, timezone: v }))}
              disabled={!isAdmin}
            >
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">Used for appointment scheduling and reminders</p>
          </div>

          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select
              value={form.currency}
              onValueChange={(v) => setForm((p) => ({ ...p, currency: v }))}
              disabled={!isAdmin}
            >
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">Used across billing, invoices and analytics</p>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-slate-50 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Preview</p>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Current time in your timezone</span>
            <span className="font-medium text-slate-700 tabular-nums">
              {new Date().toLocaleTimeString('en-AE', { timeZone: form.timezone, hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Sample invoice amount</span>
            <span className="font-medium text-slate-700 tabular-nums">
              {form.currency} 1,250.00
            </span>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-xl border-0 shadow-md shadow-violet-100"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      )}
    </form>
  )
}