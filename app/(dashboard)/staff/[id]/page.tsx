import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Edit, Mail, Phone, Award, Stethoscope, ClipboardList, ShieldCheck, UserCog, Scissors, Users, CalendarDays, FileText } from 'lucide-react'
import { format } from 'date-fns'

const roleConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  admin:        { label: 'Admin',        color: 'text-purple-700',  bg: 'bg-purple-50',  icon: ShieldCheck },
  manager:      { label: 'Manager',      color: 'text-indigo-700',  bg: 'bg-indigo-50',  icon: UserCog },
  veterinarian: { label: 'Veterinarian', color: 'text-blue-700',    bg: 'bg-blue-50',    icon: Stethoscope },
  vet_nurse:    { label: 'Vet Nurse',    color: 'text-emerald-700', bg: 'bg-emerald-50', icon: ClipboardList },
  receptionist: { label: 'Receptionist', color: 'text-amber-700',   bg: 'bg-amber-50',   icon: UserCog },
  groomer:      { label: 'Groomer',      color: 'text-pink-700',    bg: 'bg-pink-50',    icon: Scissors },
}

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: currentStaff } = await supabase
    .from('staff')
    .select('clinic_id')
    .eq('user_id', user?.id)
    .single()

  const [{ data: member }, { count: apptCount }, { count: soapCount }] = await Promise.all([
    supabase
      .from('staff')
      .select('*')
      .eq('id', id)
      .eq('clinic_id', currentStaff?.clinic_id)
      .single(),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('vet_id', id)
      .eq('status', 'completed'),
    supabase
      .from('soap_notes')
      .select('*', { count: 'exact', head: true })
      .eq('vet_id', id),
  ])

  if (!member) notFound()

  const config = roleConfig[member.role] ?? { label: member.role, color: 'text-slate-600', bg: 'bg-slate-100', icon: UserCog }
  const RoleIcon = config.icon
  const initials = member.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back + Edit */}
      <div className="flex items-center justify-between">
        <Link href="/staff" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Back to Staff
        </Link>
        <Link href={`/staff/${id}/edit`}>
          <Button variant="outline" size="sm" className="rounded-xl gap-2">
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Profile card */}
      <div className="card-premium overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500 to-violet-600 p-6 sm:p-8">
          <div className="flex items-start gap-5">
            {member.avatar_url ? (
              <img src={member.avatar_url} alt={member.full_name} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shrink-0" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-white text-xl font-bold">{member.full_name}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-white/20 text-white`}>
                  <RoleIcon className="h-3 w-3" />
                  {config.label}
                </span>
              </div>
              {member.full_name_ar && (
                <p className="text-violet-200 text-sm" dir="rtl">{member.full_name_ar}</p>
              )}
              {member.specialization && (
                <p className="text-violet-200 text-sm mt-1">{member.specialization}</p>
              )}
              <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                member.is_active ? 'bg-emerald-400/20 text-emerald-200' : 'bg-red-400/20 text-red-200'
              }`}>
                {member.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Completed Appts', value: apptCount ?? 0, icon: CalendarDays, color: 'text-blue-500', bg: 'bg-blue-50' },
              { label: 'SOAP Notes',      value: soapCount ?? 0, icon: FileText,     color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { label: 'Member Since',    value: format(new Date(member.created_at), 'MMM yyyy'), icon: Award, color: 'text-violet-500', bg: 'bg-violet-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-slate-50 rounded-2xl p-4 text-center">
                <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <p className="text-lg font-bold text-slate-800 tabular-nums">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Contact info */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Contact</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-sm text-slate-700">{member.email}</p>
              </div>
              {member.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Phone className="h-4 w-4 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-700">{member.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Professional info */}
          {(member.license_number || member.specialization) && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Professional</p>
              <div className="grid grid-cols-2 gap-4">
                {member.license_number && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">License Number</p>
                    <p className="text-sm font-medium text-slate-700">{member.license_number}</p>
                  </div>
                )}
                {member.specialization && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-1">Specialization</p>
                    <p className="text-sm font-medium text-slate-700">{member.specialization}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}