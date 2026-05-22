import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Stethoscope, ClipboardList, ShieldCheck, UserCog } from 'lucide-react'

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  admin: { label: 'Admin', color: 'bg-purple-50 text-purple-700', icon: ShieldCheck },
  manager: { label: 'Manager', color: 'bg-indigo-50 text-indigo-700', icon: UserCog },
  veterinarian: { label: 'Veterinarian', color: 'bg-blue-50 text-blue-700', icon: Stethoscope },
  vet_nurse: { label: 'Vet Nurse', color: 'bg-emerald-50 text-emerald-700', icon: ClipboardList },
  receptionist: { label: 'Receptionist', color: 'bg-amber-50 text-amber-700', icon: UserCog },
  groomer: { label: 'Groomer', color: 'bg-pink-50 text-pink-700', icon: Users },
}

export default async function StaffPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id')
    .eq('user_id', user?.id)
    .single()

  const { data: staffList } = await supabase
    .from('staff')
    .select('*')
    .eq('clinic_id', staffData?.clinic_id)
    .order('created_at', { ascending: false })

  const total = staffList?.length ?? 0
  const active = staffList?.filter((s) => s.is_active).length ?? 0
const vets = staffList?.filter((s) => s.role === 'veterinarian').length ?? 0
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Staff', value: total, icon: Users, color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'Active', value: active, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Veterinarians', value: vets, icon: Stethoscope, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Inactive', value: inactive, icon: UserCog, color: 'text-slate-400', bg: 'bg-slate-100' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card-premium p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {(!staffList || staffList.length === 0) ? (
        <div className="card-premium p-16 flex flex-col items-center justify-center text-center">
          <div className="bg-violet-50 p-4 rounded-2xl mb-4">
            <Users className="h-8 w-8 text-violet-400" />
          </div>
          <h3 className="font-semibold text-slate-700 text-lg">No staff added yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Add your first team member to get started</p>
          <Link href="/staff/new">
            <Button className="bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add First Staff Member
            </Button>
          </Link>
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff Member</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Specialization</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.map((member: any) => {
                  const config = roleConfig[member.role] ?? {
                    label: member.role,
                    color: 'bg-slate-100 text-slate-600',
                    icon: UserCog,
                  }
                  const RoleIcon = config.icon
                  const initials = member.full_name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              className="w-10 h-10 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {initials}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{member.full_name}</p>
                            {member.full_name_ar && (
                              <p className="text-xs text-slate-400 mt-0.5" dir="rtl">{member.full_name_ar}</p>
                            )}
                            {member.license_number && (
                              <p className="text-xs text-slate-400 mt-0.5">Lic: {member.license_number}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.color}`}>
                          <RoleIcon className="h-3.5 w-3.5" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <p className="text-slate-700">{member.email}</p>
                        {member.phone && (
                          <p className="text-xs text-slate-400 mt-0.5">{member.phone}</p>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <p className="text-slate-500 text-sm">
                          {member.specialization || <span className="text-slate-300">—</span>}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          member.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/staff/${member.id}/edit`}>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs">
                            Edit
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}