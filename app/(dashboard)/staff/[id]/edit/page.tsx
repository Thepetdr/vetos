import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditStaffForm from '@/components/staff/EditStaffForm'

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

const { data: { user } } = await supabase.auth.getUser()
const { data: currentStaff } = await supabase
  .from('staff')
  .select('clinic_id')
  .eq('user_id', user?.id)
  .single()

const { data: member } = await supabase
  .from('staff')
  .select('*')
  .eq('id', id)
  .eq('clinic_id', currentStaff?.clinic_id) // ← guard
  .single()

  if (!member) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/staff" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="h-4 w-4" />
          Back to Staff
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Edit Staff Member</h1>
        <p className="text-slate-500 text-sm mt-1">{member.full_name}</p>
      </div>
      <EditStaffForm member={member} />
    </div>
  )
}