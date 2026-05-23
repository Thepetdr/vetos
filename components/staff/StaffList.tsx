'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Users, Stethoscope, ClipboardList, ShieldCheck,
  UserCog, Scissors, Search, Plus,
} from 'lucide-react'
import { useCallback, useTransition } from 'react'

const roleConfig: Record<string, { label: string; color: string; icon: any }> = {
  admin:        { label: 'Admin',        color: 'bg-purple-50 text-purple-700',  icon: ShieldCheck },
  manager:      { label: 'Manager',      color: 'bg-indigo-50 text-indigo-700',  icon: UserCog },
  veterinarian: { label: 'Veterinarian', color: 'bg-blue-50 text-blue-700',      icon: Stethoscope },
  vet_nurse:    { label: 'Vet Nurse',    color: 'bg-emerald-50 text-emerald-700', icon: ClipboardList },
  receptionist: { label: 'Receptionist', color: 'bg-amber-50 text-amber-700',    icon: UserCog },
  groomer:      { label: 'Groomer',      color: 'bg-pink-50 text-pink-700',      icon: Scissors },
}

const roleFilters = [
  { value: 'all',          label: 'All' },
  { value: 'veterinarian', label: 'Vets' },
  { value: 'vet_nurse',    label: 'Nurses' },
  { value: 'receptionist', label: 'Reception' },
  { value: 'admin',        label: 'Admin' },
  { value: 'manager',      label: 'Manager' },
  { value: 'groomer',      label: 'Groomer' },
]

interface Props {
  staffList: any[]
  activeRole: string
  search: string
}

export default function StaffList({ staffList, activeRole, search }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  if (staffList.length === 0) {
    return (
      <div className="card-premium p-16 flex flex-col items-center justify-center text-center">
        <div className="bg-violet-50 p-4 rounded-2xl mb-4">
          <Users className="h-8 w-8 text-violet-400" />
        </div>
        <h3 className="font-semibold text-slate-700 text-lg">No staff found</h3>
        <p className="text-slate-400 text-sm mt-1 mb-6">
          {search || activeRole !== 'all' ? 'Try adjusting your filters' : 'Add your first team member'}
        </p>
        <Link href="/staff/new">
          <Button className="bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl border-0">
            <Plus className="h-4 w-4 mr-2" />Add Staff Member
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            defaultValue={search}
            placeholder="Search staff..."
            className="pl-9 rounded-xl"
            onChange={(e) => updateParams('q', e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {roleFilters.map((r) => (
            <button
              key={r.value}
              onClick={() => updateParams('role', r.value)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                activeRole === r.value
                  ? 'bg-violet-500 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-200 hover:text-violet-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
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
                const config = roleConfig[member.role] ?? { label: member.role, color: 'bg-slate-100 text-slate-600', icon: UserCog }
                const RoleIcon = config.icon
                const initials = member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

                return (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="px-5 py-4">
                      <Link href={`/staff/${member.id}`} className="flex items-center gap-3">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.full_name} className="w-10 h-10 rounded-2xl object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {initials}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-800 group-hover:text-violet-600 transition-colors">{member.full_name}</p>
                          {member.full_name_ar && <p className="text-xs text-slate-400 mt-0.5" dir="rtl">{member.full_name_ar}</p>}
                          {member.license_number && <p className="text-xs text-slate-400 mt-0.5">Lic: {member.license_number}</p>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${config.color}`}>
                        <RoleIcon className="h-3.5 w-3.5" />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <p className="text-slate-700">{member.email}</p>
                      {member.phone && <p className="text-xs text-slate-400 mt-0.5">{member.phone}</p>}
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      <p className="text-slate-500 text-sm">{member.specialization || <span className="text-slate-300">—</span>}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                        member.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/staff/${member.id}`}>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs">View</Button>
                        </Link>
                        <Link href={`/staff/${member.id}/edit`}>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs">Edit</Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}