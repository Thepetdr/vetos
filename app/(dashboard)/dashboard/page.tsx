import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarDays, PawPrint, Receipt, Package, TrendingUp, Clock, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const [
    { count: patientCount },
    { count: todayAppointments },
    { count: pendingInvoices },
    { count: lowStockItems },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }).eq('is_deceased', false),
    supabase.from('appointments').select('*', { count: 'exact', head: true })
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString()),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('inventory_items').select('*', { count: 'exact', head: true })
      .filter('current_stock', 'lte', 'min_stock_level'),
  ])

  const stats = [
    {
      title: "Today's Appointments",
      value: todayAppointments ?? 0,
      icon: CalendarDays,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      trend: 'Scheduled for today',
    },
    {
      title: 'Total Patients',
      value: patientCount ?? 0,
      icon: PawPrint,
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
      trend: 'Active patients',
    },
    {
      title: 'Pending Invoices',
      value: pendingInvoices ?? 0,
      icon: Receipt,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      trend: 'Awaiting payment',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockItems ?? 0,
      icon: Package,
      iconBg: 'bg-red-50',
      iconColor: 'text-red-500',
      trend: 'Items need restocking',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="card-premium p-5 sm:p-6 bg-gradient-to-r from-rose-500 to-rose-600 border-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-rose-100 text-sm font-medium">Good morning</p>
            <h2 className="text-white text-xl sm:text-2xl font-bold mt-0.5">The Pet Doctor</h2>
            <p className="text-rose-100/80 text-sm mt-1">
              {new Date().toLocaleDateString('en-AE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-white/10 items-center justify-center">
            <Clock className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ title, value, icon: Icon, iconBg, iconColor, trend }) => (
          <div key={title} className="card-premium p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`${iconBg} p-2.5 rounded-xl`}>
                <Icon className={`h-4 w-4 ${iconColor}`} />
              </div>
              <TrendingUp className="h-3.5 w-3.5 text-slate-300" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-800">{value}</p>
            <p className="text-xs sm:text-sm font-medium text-slate-600 mt-0.5">{title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{trend}</p>
          </div>
        ))}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-rose-500" />
              Today's Schedule
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-8 w-8 text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">No appointments yet today</p>
          </div>
        </div>

        <div className="card-premium p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-500" />
              Alerts & Reminders
            </h3>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">No alerts at the moment</p>
          </div>
        </div>
      </div>
    </div>
  )
}