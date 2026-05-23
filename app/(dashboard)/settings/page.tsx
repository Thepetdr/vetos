import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsTabs from '@/components/settings/SettingsTabs'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id, role')
    .eq('user_id', user?.id)
    .single()

  const { data: clinic } = await supabase
    .from('clinics')
    .select('*')
    .eq('id', staffData?.clinic_id)
    .single()

  if (!clinic) redirect('/dashboard')

  const isAdmin = ['admin', 'manager'].includes(staffData?.role ?? '')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your clinic configuration</p>
      </div>
      <SettingsTabs clinic={clinic} isAdmin={isAdmin} />
    </div>
  )
}