import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AddVaccinationForm from '@/components/vaccinations/AddVaccinationForm'

export default async function NewVaccinationPage({
  searchParams,
}: {
  searchParams: Promise<{ patient_id?: string }>
}) {
  const { patient_id } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id, id')
    .eq('user_id', user?.id)
    .single()

  const { data: patients } = await supabase
    .from('patients')
    .select('id, name, species, breed')
    .eq('clinic_id', staffData?.clinic_id)
    .eq('is_deceased', false)
    .order('name')

  const { data: vets } = await supabase
    .from('staff')
    .select('id, full_name, role')
    .eq('clinic_id', staffData?.clinic_id)
    .eq('is_active', true)
    .in('role', ['veterinarian', 'vet_nurse'])
    .order('full_name')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={patient_id ? `/patients/${patient_id}` : '/vaccinations'}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Record Vaccination</h1>
        <p className="text-slate-500 text-sm mt-1">Log a vaccine administered to a patient</p>
      </div>
      <AddVaccinationForm
        patients={patients ?? []}
        vets={vets ?? []}
        defaultPatientId={patient_id ?? null}
        staffId={staffData?.id ?? null}
      />
    </div>
  )
}