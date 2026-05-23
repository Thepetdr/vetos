import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Users, Stethoscope, ShieldCheck, UserCog, Search } from 'lucide-react'
import StaffList from '@/components/staff/StaffList'

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; q?: string }>
}) {
  const { role, q } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id')
    .eq('user_id', user?.id)
    .single()

  let query = supabase
    .from('staff')
    .select('*')
    .eq('clinic_id', staffData?.clinic_id)
    .order('full_name')

  if (role && role !== 'all') query = query.eq('role', role)
  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data: staffList } = await query

  const total    = staffList?.length ?? 0
  const active   = staffList?.filter((s) => s.is_active).length ?? 0
  const vets     = staffList?.filter((s) => s.role === 'veterinarian').length ?? 0
  const inactive = total - active

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Staff</h1>
          <p className="text-slate-500 text-sm mt-1">{total} team members</p>
        </div>
        <Link href="/staff/new">
          <Button className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-xl shadow-md shadow-violet-100 border-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff',    value: total,    icon: Users,       color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'Active',         value: active,   icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Veterinarians',  value: vets,     icon: Stethoscope, color: 'text-blue-500',    bg: 'bg-blue-50' },
          { label: 'Inactive',       value: inactive, icon: UserCog,     color: 'text-slate-400',   bg: 'bg-slate-100' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card-premium p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 tabular-nums">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      <StaffList staffList={staffList ?? []} activeRole={role ?? 'all'} search={q ?? ''} />
    </div>
  )
}