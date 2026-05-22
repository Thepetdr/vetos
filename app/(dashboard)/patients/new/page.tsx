import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AddPatientForm from '@/components/patients/AddPatientForm'

export default async function NewPatientPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, phone')
    .order('full_name')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link href="/patients" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="h-4 w-4" />
          Back to Patients
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Add Patient</h1>
        <p className="text-slate-500 text-sm mt-1">Create a patient medical profile</p>
      </div>

      <AddPatientForm clients={clients ?? []} />
    </div>
  )
}