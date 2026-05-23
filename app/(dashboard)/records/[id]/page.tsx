import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Stethoscope, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

export default async function RecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: record } = await supabase
    .from('soap_notes')
    .select(`
      *,
      patients ( name, species, breed ),
      clients ( full_name, phone ),
      staff!soap_notes_vet_id_fkey ( full_name )
    `)
    .eq('id', id)
    .single()

  if (!record) notFound()

  const soapSections = [
    { key: 'S', label: 'Subjective',  color: 'bg-blue-100 text-blue-700',    value: record.subjective },
    { key: 'O', label: 'Objective',   color: 'bg-emerald-100 text-emerald-700', value: record.objective },
    { key: 'A', label: 'Assessment',  color: 'bg-amber-100 text-amber-700',  value: record.assessment },
    { key: 'P', label: 'Plan',        color: 'bg-rose-100 text-rose-700',    value: record.plan },
  ]

  const vitalsData = [
    { label: 'Weight',       value: record.weight_kg ? `${record.weight_kg} kg` : null },
    { label: 'Temperature',  value: record.temperature_c ? `${record.temperature_c}°C` : null },
    { label: 'Heart Rate',   value: record.heart_rate ? `${record.heart_rate} bpm` : null },
    { label: 'Resp. Rate',   value: record.respiratory_rate ? `${record.respiratory_rate}/min` : null },
  ].filter(v => v.value)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
      <Link href="/records" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
    <ChevronLeft className="h-4 w-4" />
    Back to Records
  </Link>
  <Link href={`/records/${record.id}/edit`}>
    <Button variant="outline" size="sm" className="rounded-xl gap-2">
      <Edit className="h-3.5 w-3.5" />
      Edit
    </Button>
  </Link>
  </div>

      {/* Record header */}
      <div className="card-premium overflow-hidden">
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Medical Record</p>
              <p className="text-white text-2xl font-bold mt-1">{record.patients?.name}</p>
              <p className="text-rose-100 text-sm mt-1 capitalize">
                {record.patients?.species} {record.patients?.breed ? `· ${record.patients.breed}` : ''}
              </p>
              <p className="text-rose-100/80 text-sm mt-1">
                Owner: {record.clients?.full_name}
              </p>
            </div>
            <div className="text-right">
              <Badge className="bg-white/20 text-white border-0 capitalize mb-2 block">
                {record.visit_type?.replace('_', ' ')}
              </Badge>
              <p className="text-rose-100 text-sm">
                {format(new Date(record.visit_date), 'dd MMM yyyy')}
              </p>
              {record.staff?.full_name && (
                <p className="text-rose-100/80 text-sm">Dr. {record.staff.full_name}</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Chief Complaint */}
          {record.chief_complaint && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Chief Complaint</p>
              <p className="text-slate-700 text-sm bg-slate-50 rounded-xl p-3">{record.chief_complaint}</p>
            </div>
          )}

          {/* Vitals */}
          {vitalsData.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Vitals</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {vitalsData.map(v => (
                  <div key={v.label} className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-slate-400 mb-1">{v.label}</p>
                    <p className="text-sm font-bold text-slate-700">{v.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SOAP */}
          <div className="space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">SOAP Notes</p>
            {soapSections.map(({ key, label, color, value }) =>
              value ? (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${color}`}>
                      {key}
                    </span>
                    <span className="text-sm font-semibold text-slate-600">{label}</span>
                  </div>
                  <p className="text-sm text-slate-700 bg-slate-50 rounded-xl p-4 whitespace-pre-line leading-relaxed">
                    {value}
                  </p>
                </div>
              ) : null
            )}
          </div>

          {/* Follow-up */}
          {record.follow_up_date && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Follow-up</p>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-amber-800">
                  {format(new Date(record.follow_up_date), 'EEEE, dd MMMM yyyy')}
                </p>
                {record.follow_up_notes && (
                  <p className="text-sm text-amber-700 mt-1">{record.follow_up_notes}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}