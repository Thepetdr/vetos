import { createClient } from '@/lib/supabase/server'
import { Clock, CalendarDays, PawPrint, Receipt, Package, TrendingUp, AlertCircle, Plus, Syringe, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { format, subDays, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import RevenueChart from '@/components/dashboard/RevenueChart'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id, full_name, role')
    .eq('user_id', user?.id)
    .single()

  const clinicId = staffData?.clinic_id

  const now = new Date()
  const todayStart = startOfDay(now).toISOString()
  const todayEnd = endOfDay(now).toISOString()

  const thisMonthStart = startOfMonth(now).toISOString()
  const thisMonthEnd = endOfMonth(now).toISOString()
  const lastMonthStart = startOfMonth(subMonths(now, 1)).toISOString()
  const lastMonthEnd = endOfMonth(subMonths(now, 1)).toISOString()

  // Build last 7 days date range
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(now, 6 - i)
    return { date: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE') }
  })

  const [
    // KPIs
    { count: patientCount },
    { count: todayAppointmentCount },
    { count: pendingInvoiceCount },
    { count: lowStockCount },
    // Month comparisons
    { count: thisMonthPatients },
    { count: lastMonthPatients },
    { count: thisMonthAppointments },
    { count: lastMonthAppointments },
    // Today's appointments (detailed)
    { data: todayAppointments },
    // Alerts
    { data: overdueVaccinations },
    { data: lowStockItems },
    { data: unpaidInvoices },
    // Revenue data
    { data: recentInvoices },
    // Recent patients
    { data: recentPatients },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).eq('is_deceased', false),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).in('status', ['sent', 'overdue']),
    supabase.from('inventory_items').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).filter('current_stock', 'lte', 'min_stock_level').eq('is_active', true),

    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', thisMonthStart).lte('created_at', thisMonthEnd),
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('scheduled_at', thisMonthStart).lte('scheduled_at', thisMonthEnd),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('clinic_id', clinicId).gte('scheduled_at', lastMonthStart).lte('scheduled_at', lastMonthEnd),

    supabase.from('appointments').select(`
      id, scheduled_at, duration_minutes, status, appointment_type,
      patients ( id, name, species, breed ),
      clients ( id, full_name ),
      vets:staff!appointments_vet_id_fkey ( id, full_name )
    `).eq('clinic_id', clinicId).gte('scheduled_at', todayStart).lte('scheduled_at', todayEnd).order('scheduled_at'),

    supabase.from('vaccinations').select(`
      id, vaccine_name, next_due_date,
      patients ( id, name, species )
    `).eq('clinic_id', clinicId).lt('next_due_date', now.toISOString()).not('next_due_date', 'is', null).limit(5),

    supabase.from('inventory_items').select('id, name, current_stock, min_stock_level, unit').eq('clinic_id', clinicId).filter('current_stock', 'lte', 'min_stock_level').eq('is_active', true).order('current_stock').limit(5),

    supabase.from('invoices').select(`
      id, invoice_number, total, due_date,
      clients ( id, full_name )
    `).eq('clinic_id', clinicId).in('status', ['sent', 'overdue']).order('due_date').limit(5),

    supabase.from('invoices').select('issue_date, total').eq('clinic_id', clinicId).eq('status', 'paid').gte('issue_date', last7Days[0].date).lte('issue_date', last7Days[6].date),

    supabase.from('patients').select(`
      id, name, species, breed, created_at,
      clients ( id, full_name )
    `).eq('clinic_id', clinicId).eq('is_deceased', false).order('created_at', { ascending: false }).limit(5),
  ])

  // Build revenue chart data
  const revenueByDay = last7Days.map(({ date, label }) => ({
    label,
    revenue: recentInvoices
      ?.filter((inv) => inv.issue_date === date)
      .reduce((sum, inv) => sum + (inv.total ?? 0), 0) ?? 0,
  }))

  // % change helpers
  function pctChange(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  const patientChange = pctChange(thisMonthPatients ?? 0, lastMonthPatients ?? 0)
  const apptChange = pctChange(thisMonthAppointments ?? 0, lastMonthAppointments ?? 0)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statusColors: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700',
    confirmed: 'bg-emerald-50 text-emerald-700',
    checked_in: 'bg-violet-50 text-violet-700',
    in_progress: 'bg-amber-50 text-amber-700',
    completed: 'bg-slate-100 text-slate-500',
    cancelled: 'bg-red-50 text-red-500',
    no_show: 'bg-rose-50 text-rose-500',
  }

  const speciesBg: Record<string, string> = {
    dog: 'bg-amber-50', cat: 'bg-rose-50', bird: 'bg-sky-50',
  }

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="card-premium p-5 sm:p-6 bg-gradient-to-r from-rose-500 to-rose-600 border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-rose-100 text-sm font-medium">{greeting}</p>
            <h2 className="text-white text-xl sm:text-2xl font-bold mt-0.5">
              {staffData?.full_name ?? 'Welcome back'}
            </h2>
            <p className="text-rose-100/80 text-sm mt-1">
              {format(now, 'EEEE, d MMMM yyyy')}
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 items-center justify-center">
            <Clock className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            title: "Today's Appointments",
            value: todayAppointmentCount ?? 0,
            icon: CalendarDays,
            iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
            sub: `${apptChange >= 0 ? '+' : ''}${apptChange}% vs last month`,
            positive: apptChange >= 0,
            href: '/appointments',
          },
          {
            title: 'Active Patients',
            value: patientCount ?? 0,
            icon: PawPrint,
            iconBg: 'bg-rose-50', iconColor: 'text-rose-500',
            sub: `${patientChange >= 0 ? '+' : ''}${patientChange}% vs last month`,
            positive: patientChange >= 0,
            href: '/patients',
          },
          {
            title: 'Pending Invoices',
            value: pendingInvoiceCount ?? 0,
            icon: Receipt,
            iconBg: 'bg-amber-50', iconColor: 'text-amber-500',
            sub: 'Awaiting payment',
            positive: (pendingInvoiceCount ?? 0) === 0,
            href: '/billing',
          },
          {
            title: 'Low Stock Alerts',
            value: lowStockCount ?? 0,
            icon: Package,
            iconBg: 'bg-red-50', iconColor: 'text-red-500',
            sub: 'Items need restocking',
            positive: (lowStockCount ?? 0) === 0,
            href: '/inventory',
          },
        ].map(({ title, value, icon: Icon, iconBg, iconColor, sub, positive, href }) => (
          <Link key={title} href={href}>
            <div className="card-premium p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group">
              <div className="flex items-start justify-between mb-3">
                <div className={`${iconBg} p-2.5 rounded-xl`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <TrendingUp className={`h-3.5 w-3.5 ${positive ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-slate-800 tabular-nums">{value}</p>
              <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">{title}</p>
              <p className={`text-xs mt-0.5 ${positive ? 'text-emerald-500' : 'text-red-400'}`}>{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue Chart + Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card-premium p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-800">Revenue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Last 7 days (paid invoices)</p>
            </div>
            <Link href="/billing">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          <RevenueChart data={revenueByDay} />
        </div>

        {/* Quick Actions */}
        <div className="card-premium p-5 space-y-3">
          <h3 className="font-semibold text-slate-800">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { label: 'New Appointment', href: '/appointments/new', color: 'bg-rose-500 hover:bg-rose-600' },
              { label: 'New Patient', href: '/patients/new', color: 'bg-blue-500 hover:bg-blue-600' },
              { label: 'New Invoice', href: '/billing/new', color: 'bg-amber-500 hover:bg-amber-600' },
              { label: 'Record Vaccination', href: '/vaccinations/new', color: 'bg-emerald-500 hover:bg-emerald-600' },
              { label: 'Add Inventory Item', href: '/inventory/new', color: 'bg-violet-500 hover:bg-violet-600' },
            ].map(({ label, href, color }) => (
              <Link key={label} href={href}>
                <button className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${color}`}>
                  <Plus className="inline h-3.5 w-3.5 mr-2 opacity-80" />
                  {label}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Schedule + Alerts */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Today's Schedule */}
        <div className="card-premium overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-rose-500" />
              Today's Schedule
            </h3>
            <span className="text-xs text-slate-400">{todayAppointmentCount ?? 0} appointments</span>
          </div>
          {!todayAppointments || todayAppointments.length === 0 ? (
            <div className="p-10 flex flex-col items-center text-center">
              <CalendarDays className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-slate-400 text-sm">No appointments today</p>
              <Link href="/appointments/new" className="mt-3">
                <Button size="sm" variant="outline" className="rounded-xl text-xs">Schedule one</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {todayAppointments.map((appt: any) => (
                <Link key={appt.id} href={`/appointments/${appt.id}`}>
                  <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors group">
                    <div className="shrink-0 w-12 text-center">
                      <p className="text-sm font-bold text-slate-700 tabular-nums">
                        {format(new Date(appt.scheduled_at), 'HH:mm')}
                      </p>
                      <p className="text-xs text-slate-400">{appt.duration_minutes}m</p>
                    </div>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${speciesBg[appt.patients?.species] ?? 'bg-slate-50'}`}>
                      <PawPrint className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-rose-600 transition-colors">
                        {appt.patients?.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{appt.clients?.full_name}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-medium shrink-0 ${statusColors[appt.status] ?? 'bg-slate-100 text-slate-500'}`}>
                      {appt.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="card-premium overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Alerts & Reminders
            </h3>
            <span className="text-xs text-slate-400">
              {(overdueVaccinations?.length ?? 0) + (lowStockItems?.length ?? 0) + (unpaidInvoices?.length ?? 0)} alerts
            </span>
          </div>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
            {overdueVaccinations && overdueVaccinations.length > 0 && overdueVaccinations.map((vax: any) => (
              <Link key={vax.id} href={`/patients/${vax.patients?.id}`}>
                <div className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                    <Syringe className="h-3.5 w-3.5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      <span className="font-medium">{vax.patients?.name}</span> — {vax.vaccine_name} overdue
                    </p>
                    <p className="text-xs text-red-400">Due: {vax.next_due_date}</p>
                  </div>
                </div>
              </Link>
            ))}
            {lowStockItems && lowStockItems.length > 0 && lowStockItems.map((item: any) => (
              <Link key={item.id} href="/inventory">
                <div className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Package className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      <span className="font-medium">{item.name}</span> — low stock
                    </p>
                    <p className="text-xs text-amber-500">{item.current_stock} {item.unit} remaining</p>
                  </div>
                </div>
              </Link>
            ))}
            {unpaidInvoices && unpaidInvoices.length > 0 && unpaidInvoices.map((inv: any) => (
              <Link key={inv.id} href={`/billing/${inv.id}`}>
                <div className="px-5 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Receipt className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">
                      <span className="font-medium">{inv.clients?.full_name}</span> — AED {inv.total}
                    </p>
                    <p className="text-xs text-amber-500">Invoice #{inv.invoice_number} · Due {inv.due_date ?? 'N/A'}</p>
                  </div>
                </div>
              </Link>
            ))}
            {(overdueVaccinations?.length ?? 0) + (lowStockItems?.length ?? 0) + (unpaidInvoices?.length ?? 0) === 0 && (
              <div className="p-10 flex flex-col items-center text-center">
                <AlertCircle className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-slate-400 text-sm">No alerts right now</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Patients */}
      <div className="card-premium overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <PawPrint className="h-4 w-4 text-rose-500" />
            Recently Added Patients
          </h3>
          <Link href="/patients">
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1">
              All Patients <ChevronRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentPatients && recentPatients.length > 0 ? recentPatients.map((patient: any) => (
            <Link key={patient.id} href={`/patients/${patient.id}`}>
              <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${speciesBg[patient.species] ?? 'bg-slate-50'}`}>
                  <PawPrint className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-rose-600 transition-colors truncate">
                    {patient.name}
                  </p>
                  <p className="text-xs text-slate-400 truncate capitalize">
                    {patient.breed || patient.species} · {patient.clients?.full_name}
                  </p>
                </div>
                <p className="text-xs text-slate-400 shrink-0">
                  {format(new Date(patient.created_at), 'dd MMM')}
                </p>
              </div>
            </Link>
          )) : (
            <div className="p-8 text-center">
              <p className="text-slate-400 text-sm">No patients yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}