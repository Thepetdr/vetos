import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Syringe, Plus, AlertTriangle, CheckCircle2, Clock, PawPrint, Dog, Cat, Bird
} from 'lucide-react'

const speciesIcon: Record<string, any> = { dog: Dog, cat: Cat, bird: Bird }

export default async function VaccinationsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id')
    .eq('user_id', user?.id)
    .single()

  const { data: vaccinations } = await supabase
    .from('vaccinations')
    .select(`
      *,
      patients ( id, name, species, breed ),
      staff ( full_name )
    `)
    .eq('clinic_id', staffData?.clinic_id)
    .order('administered_date', { ascending: false })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdue = vaccinations?.filter(
    (v) => v.next_due_date && new Date(v.next_due_date) < today
  ) ?? []

  const dueSoon = vaccinations?.filter((v) => {
    if (!v.next_due_date) return false
    const due = new Date(v.next_due_date)
    const diff = (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 30
  }) ?? []

  const upToDate = vaccinations?.filter((v) => {
    if (!v.next_due_date) return true
    return new Date(v.next_due_date) >= today
  }) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vaccinations</h1>
          <p className="text-slate-500 text-sm mt-1">{vaccinations?.length ?? 0} records across all patients</p>
        </div>
        <Link href="/vaccinations/new">
          <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl shadow-md shadow-emerald-100 border-0">
            <Plus className="h-4 w-4 mr-2" />
            Record Vaccination
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Records', value: vaccinations?.length ?? 0, icon: Syringe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Overdue', value: overdue.length, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
          { label: 'Due in 30 days', value: dueSoon.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Up to Date', value: upToDate.length, icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-50' },
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

      {/* Overdue Alert Banner */}
      {overdue.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">{overdue.length} patient{overdue.length > 1 ? 's' : ''} with overdue vaccinations</p>
              <p className="text-sm text-red-500 mt-0.5">
                {overdue.slice(0, 4).map((v) => v.patients?.name).join(', ')}
                {overdue.length > 4 ? ` and ${overdue.length - 4} more` : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <div className="card-premium overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-red-50/40">
            <h2 className="font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Overdue Vaccinations
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {overdue.map((vax: any) => {
              const SpeciesIcon = speciesIcon[vax.patients?.species] ?? PawPrint
              return (
                <VaxRow key={vax.id} vax={vax} SpeciesIcon={SpeciesIcon} status="overdue" />
              )
            })}
          </div>
        </div>
      )}

      {/* Due Soon Section */}
      {dueSoon.length > 0 && (
        <div className="card-premium overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-amber-50/40">
            <h2 className="font-semibold text-amber-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Due Within 30 Days
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {dueSoon.map((vax: any) => {
              const SpeciesIcon = speciesIcon[vax.patients?.species] ?? PawPrint
              return (
                <VaxRow key={vax.id} vax={vax} SpeciesIcon={SpeciesIcon} status="due_soon" />
              )
            })}
          </div>
        </div>
      )}

      {/* All Records */}
      <div className="card-premium overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700 flex items-center gap-2">
            <Syringe className="h-4 w-4 text-slate-400" />
            All Vaccination Records
          </h2>
        </div>
        {(!vaccinations || vaccinations.length === 0) ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Syringe className="h-7 w-7 text-emerald-400" />
            </div>
            <p className="font-semibold text-slate-700">No vaccinations recorded yet</p>
            <p className="text-slate-400 text-sm mt-1 mb-5">Record the first vaccination to begin tracking</p>
            <Link href="/vaccinations/new">
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl border-0">
                <Plus className="h-4 w-4 mr-2" />
                Record Vaccination
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Vaccine</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Administered</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Administered By</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Next Due</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Batch No.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vaccinations.map((vax: any) => {
                  const SpeciesIcon = speciesIcon[vax.patients?.species] ?? PawPrint
                  const isOverdue = vax.next_due_date && new Date(vax.next_due_date) < today
                  const isDueSoon = !isOverdue && vax.next_due_date && (() => {
                    const diff = (new Date(vax.next_due_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                    return diff <= 30
                  })()

                  return (
                    <tr key={vax.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-4">
                        <Link href={`/patients/${vax.patients?.id}`}>
                          <div className="flex items-center gap-3 group">
                            <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                              <SpeciesIcon className="h-4 w-4 text-rose-500" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 group-hover:text-rose-600 transition-colors">
                                {vax.patients?.name}
                              </p>
                              <p className="text-xs text-slate-400 capitalize">{vax.patients?.breed || vax.patients?.species}</p>
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">{vax.vaccine_name}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell text-slate-500">{vax.administered_date}</td>
                      <td className="px-5 py-4 hidden md:table-cell text-slate-500">
                        {vax.staff?.full_name || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-4">
                        {vax.next_due_date ? (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            isOverdue
                              ? 'bg-red-50 text-red-600'
                              : isDueSoon
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isOverdue ? '⚠ ' : ''}{vax.next_due_date}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">Not set</span>
                        )}
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell text-slate-400 text-xs">
                        {vax.batch_number || <span className="text-slate-300">—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function VaxRow({ vax, SpeciesIcon, status }: { vax: any; SpeciesIcon: any; status: string }) {
  const daysLabel = () => {
    if (!vax.next_due_date) return null
    const diff = Math.ceil((new Date(vax.next_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return `${Math.abs(diff)} days overdue`
    if (diff === 0) return 'Due today'
    return `Due in ${diff} days`
  }

  return (
    <div className="px-5 py-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
          <SpeciesIcon className="h-4 w-4 text-rose-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Link href={`/patients/${vax.patients?.id}`}>
              <p className="text-sm font-semibold text-slate-800 hover:text-rose-600 transition-colors">
                {vax.patients?.name}
              </p>
            </Link>
            <span className="text-xs text-slate-400 capitalize">{vax.patients?.breed || vax.patients?.species}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{vax.vaccine_name}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
          status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
        }`}>
          {daysLabel()}
        </span>
        <p className="text-xs text-slate-400 mt-1">{vax.next_due_date}</p>
      </div>
    </div>
  )
}