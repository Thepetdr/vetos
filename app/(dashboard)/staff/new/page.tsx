import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AddStaffForm from '@/components/staff/AddStaffForm'

export default async function NewStaffPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/staff" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="h-4 w-4" />
          Back to Staff
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Add Staff Member</h1>
        <p className="text-slate-500 text-sm mt-1">Add a new team member to your clinic</p>
      </div>
      <AddStaffForm />
    </div>
  )
}