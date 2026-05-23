import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditSOAPNoteForm from '@/components/records/EditSOAPNoteForm'

export default async function EditRecordPage({
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

  const [{ data: record }, { data: patients }, { data: staff }] = await Promise.all([
    supabase
      .from('soap_notes')
      .select('*')
      .eq('id', id)
      .eq('clinic_id', staffData?.clinic_id)
      .single(),
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

  if (!record) notFound()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href={`/records/${id}`}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Record
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Medical Record</h1>
        <p className="text-slate-500 text-sm mt-1">Update SOAP notes for this visit</p>
      </div>
      <EditSOAPNoteForm
        record={record}
        patients={patients ?? []}
        staff={staff ?? []}
      />
    </div>
  )
}