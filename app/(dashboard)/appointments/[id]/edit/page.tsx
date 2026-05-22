import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditAppointmentForm from '@/components/appointments/EditAppointmentForm'

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id, id')
    .eq('user_id', user?.id)
    .single()

  const [{ data: appt }, { data: patients }, { data: clients }, { data: vets }] =
    await Promise.all([
      supabase
        .from('appointments')
        .select(`*, patients ( id, name, species, breed, client_id ), clients ( id, full_name, phone ), vets:staff!appointments_vet_id_fkey ( id, full_name )`)
        .eq('id', id)
        .eq('clinic_id', staffData?.clinic_id)
        .single(),
      supabase
        .from('patients')
        .select('id, name, species, breed, client_id')
        .eq('clinic_id', staffData?.clinic_id)
        .eq('is_deceased', false)
        .order('name'),
      supabase
        .from('clients')
        .select('id, full_name, phone')
        .eq('clinic_id', staffData?.clinic_id)
        .eq('is_active', true)
        .order('full_name'),
      supabase
        .from('staff')
        .select('id, full_name, role')
        .eq('clinic_id', staffData?.clinic_id)
        .eq('is_active', true)
        .in('role', ['veterinarian', 'vet_nurse'])
        .order('full_name'),
    ])

  if (!appt) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/appointments/${id}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Appointment
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Appointment</h1>
        <p className="text-slate-500 text-sm mt-1">
          {appt.patients?.name} — update details below
        </p>
      </div>
      <EditAppointmentForm
        appointment={appt}
        patients={patients ?? []}
        clients={clients ?? []}
        vets={vets ?? []}
      />
    </div>
  )
}