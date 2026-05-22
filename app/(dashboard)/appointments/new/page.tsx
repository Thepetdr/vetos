import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import NewAppointmentForm from '@/components/appointments/NewAppointmentForm'

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ patient_id?: string; client_id?: string; date?: string }>
}) {
  const { patient_id, client_id, date } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id, id')
    .eq('user_id', user?.id)
    .single()

  const [{ data: patients }, { data: clients }, { data: vets }] = await Promise.all([
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/appointments" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">New Appointment</h1>
        <p className="text-slate-500 text-sm mt-1">Schedule a visit for a patient</p>
      </div>
      <NewAppointmentForm
        patients={patients ?? []}
        clients={clients ?? []}
        vets={vets ?? []}
        defaultPatientId={patient_id ?? null}
        defaultClientId={client_id ?? null}
        defaultDate={date ?? null}
        staffId={staffData?.id ?? null}
        clinicId={staffData?.clinic_id ?? null}
      />
    </div>
  )
}