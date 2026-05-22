import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, List } from 'lucide-react'
import AppointmentListView from '@/components/appointments/AppointmentListView'
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView'

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string; status?: string }>
}) {
  const { view = 'list', date, status } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id')
    .eq('user_id', user?.id)
    .single()

  // Fetch all appointments for the clinic
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      patients ( id, name, species, breed, photo_url ),
      clients  ( id, full_name, phone ),
      vets:staff!appointments_vet_id_fkey ( id, full_name )
    `)
    .eq('clinic_id', staffData?.clinic_id)
    .order('scheduled_at', { ascending: true })

  const { data: vets } = await supabase
    .from('staff')
    .select('id, full_name, role')
    .eq('clinic_id', staffData?.clinic_id)
    .eq('is_active', true)
    .in('role', ['veterinarian', 'vet_nurse'])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {appointments?.length ?? 0} total appointments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
            <Link
              href={`/appointments?view=list`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'list'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List
            </Link>
            <Link
              href={`/appointments?view=calendar`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'calendar'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              Calendar
            </Link>
          </div>
          <Link href="/appointments/new">
            <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md shadow-rose-100 border-0">
              <Plus className="h-4 w-4 mr-2" />
              New Appointment
            </Button>
          </Link>
        </div>
      </div>

      {/* View */}
      {view === 'calendar' ? (
        <AppointmentCalendarView
          appointments={appointments ?? []}
          initialDate={date}
        />
      ) : (
        <AppointmentListView
          appointments={appointments ?? []}
          vets={vets ?? []}
          initialStatus={status}
        />
      )}
    </div>
  )
}