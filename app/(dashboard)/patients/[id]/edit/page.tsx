import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditPatientForm from '@/components/patients/EditPatientForm'

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id')
    .eq('user_id', user?.id)
    .single()

  const [{ data: patient }, { data: clients }] = await Promise.all([
    supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .eq('clinic_id', staffData?.clinic_id)
      .single(),
    supabase
      .from('clients')
      .select('id, full_name, phone')
      .eq('clinic_id', staffData?.clinic_id)
      .eq('is_active', true)
      .order('full_name'),
  ])

  if (!patient) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/patients/${id}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Patient
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Patient</h1>
        <p className="text-slate-500 text-sm mt-1">{patient.name} — update details below</p>
      </div>
      <EditPatientForm patient={patient} clients={clients ?? []} />
    </div>
  )
}