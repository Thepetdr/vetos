import { createClient } from '@/lib/supabase/server'
import SOAPNoteForm from '@/components/records/SOAPNoteForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ patient_id?: string; appointment_id?: string }>
}) {
  const { patient_id, appointment_id } = await searchParams
  const supabase = await createClient()

 const { data: { user } } = await supabase.auth.getUser()
const { data: staffData } = await supabase
  .from('staff')
  .select('clinic_id')
  .eq('user_id', user?.id)
  .single()

const [{ data: patients }, { data: staff }] = await Promise.all([
  supabase
    .from('patients')
    .select('id, name, species, breed, client_id, clients(id, full_name)')
    .eq('clinic_id', staffData?.clinic_id)
    .eq('is_deceased', false)
    .order('name'),
  supabase
    .from('staff')
    .select('id, full_name, role')
    .eq('clinic_id', staffData?.clinic_id)
    .in('role', ['veterinarian', 'vet_nurse']),
])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link href="/records" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="h-4 w-4" />
          Back to Records
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">New Medical Record</h1>
        <p className="text-slate-500 text-sm mt-1">Document a patient visit with SOAP notes</p>
      </div>
      <SOAPNoteForm
        patients={patients ?? []}
        staff={staff ?? []}
        defaultPatientId={patient_id}
        defaultAppointmentId={appointment_id}
      />
    </div>
  )
}