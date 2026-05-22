import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Calendar, Clock, User, Stethoscope, FileText, Dog, Cat, Bird, PawPrint, Edit } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, TYPE_LABELS,
  AppointmentStatus, AppointmentType
} from '@/lib/types/appointments'
import UpdateStatusButton from '@/components/appointments/UpdateStatusButton'

const speciesIcon: Record<string, any> = { dog: Dog, cat: Cat, bird: Bird }

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: appt } = await supabase
    .from('appointments')
    .select(`
      *,
      patients ( id, name, species, breed, photo_url ),
      clients  ( id, full_name, phone, email ),
      vets:staff!appointments_vet_id_fkey ( id, full_name, role ),
      creator:staff!appointments_created_by_fkey ( id, full_name )
    `)
    .eq('id', id)
    .single()

  if (!appt) notFound()

  const SpeciesIcon = speciesIcon[appt.patients?.species] ?? PawPrint

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <div className="flex items-center justify-between">
        <Link href="/appointments" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <ChevronLeft className="h-4 w-4" />
          Appointments
        </Link>
        <Link href={`/appointments/${id}/edit`}>
          <Button variant="outline" size="sm" className="rounded-xl gap-2">
            <Edit className="h-3.5 w-3.5" />
            Edit
          </Button>
        </Link>
      </div>

      {/* Header card */}
      <div className="card-premium p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
              <SpeciesIcon className="h-7 w-7 text-rose-500" />
            </div>
            <div>
              <Link href={`/patients/${appt.patients?.id}`}>
                <h1 className="text-xl font-bold text-slate-800 hover:text-rose-600 transition-colors">
                  {appt.patients?.name}
                </h1>
              </Link>
              <p className="text-slate-400 text-sm capitalize">{appt.patients?.breed || appt.patients?.species}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${STATUS_COLORS[appt.status as AppointmentStatus]}`}>
                  {STATUS_LABELS[appt.status as AppointmentStatus]}
                </span>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${TYPE_COLORS[appt.appointment_type as AppointmentType] ?? 'bg-slate-100 text-slate-600'}`}>
                  {TYPE_LABELS[appt.appointment_type as AppointmentType] ?? appt.appointment_type}
                </span>
              </div>
            </div>
          </div>
          <UpdateStatusButton
            appointmentId={appt.id}
            currentStatus={appt.status as AppointmentStatus}
          />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Date & Time */}
        <div className="card-premium p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Scheduled</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{format(new Date(appt.scheduled_at), 'EEEE, d MMMM yyyy')}</p>
              <p className="text-sm text-slate-400">{format(new Date(appt.scheduled_at), 'hh:mm a')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-slate-600">{appt.duration_minutes} minutes</p>
          </div>
        </div>

        {/* Client & Vet */}
        <div className="card-premium p-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">People</h3>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <User className="h-4 w-4 text-emerald-500" />
            </div>
            <div>
              <Link href={`/clients/${appt.clients?.id}`}>
                <p className="font-semibold text-slate-800 hover:text-emerald-600 transition-colors">
                  {appt.clients?.full_name}
                </p>
              </Link>
              <p className="text-sm text-slate-400">{appt.clients?.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-700">
                {appt.vets?.full_name ?? <span className="text-slate-400 font-normal">Unassigned</span>}
              </p>
              {appt.vets?.role && (
                <p className="text-sm text-slate-400 capitalize">{appt.vets.role.replace('_', ' ')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chief complaint & Notes */}
      {(appt.chief_complaint || appt.notes) && (
        <div className="card-premium p-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-3.5 w-3.5" />
            Clinical Notes
          </h3>
          {appt.chief_complaint && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Chief Complaint</p>
              <p className="text-slate-700">{appt.chief_complaint}</p>
            </div>
          )}
          {appt.notes && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Notes</p>
              <p className="text-slate-600 text-sm whitespace-pre-wrap">{appt.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Meta */}
      <div className="card-premium p-4 flex items-center justify-between text-xs text-slate-400">
        <span>Created by {appt.creator?.full_name ?? '—'}</span>
        <span>Booked {format(new Date(appt.created_at), 'dd MMM yyyy, HH:mm')}</span>
      </div>
    </div>
  )
}