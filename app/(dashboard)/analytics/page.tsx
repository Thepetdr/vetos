import { createClient } from '@/lib/supabase/server'
import { startOfWeek, startOfMonth, startOfYear, endOfDay, format, eachDayOfInterval, eachMonthOfInterval } from 'date-fns'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>
}) {
  const { range = 'month' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: staffData } = await supabase
    .from('staff')
    .select('clinic_id')
    .eq('user_id', user?.id)
    .single()

  const clinicId = staffData?.clinic_id
  const now = new Date()

  const rangeStart =
    range === 'week'  ? startOfWeek(now, { weekStartsOn: 1 }) :
    range === 'year'  ? startOfYear(now) :
                        startOfMonth(now)

  const rangeEnd = endOfDay(now)

  const [
    { data: invoices },
    { data: appointments },
    { data: patients },
    { data: invoiceItems },
    { data: allStaff },
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, status, total, paid_amount, issue_date')
      .eq('clinic_id', clinicId)
      .gte('issue_date', format(rangeStart, 'yyyy-MM-dd'))
      .lte('issue_date', format(rangeEnd, 'yyyy-MM-dd')),

    supabase
      .from('appointments')
      .select('id, status, scheduled_at, vet_id, appointment_type')
      .eq('clinic_id', clinicId)
      .gte('scheduled_at', rangeStart.toISOString())
      .lte('scheduled_at', rangeEnd.toISOString()),

    supabase
      .from('patients')
      .select('id, species, created_at')
      .eq('clinic_id', clinicId)
      .eq('is_deceased', false),

    supabase
      .from('invoice_items')
      .select('description, total, invoice_id, invoices!inner(clinic_id, issue_date)')
      .eq('invoices.clinic_id', clinicId)
      .gte('invoices.issue_date', format(rangeStart, 'yyyy-MM-dd'))
      .lte('invoices.issue_date', format(rangeEnd, 'yyyy-MM-dd')),

    supabase
      .from('staff')
      .select('id, full_name, role')
      .eq('clinic_id', clinicId)
      .in('role', ['veterinarian', 'vet_nurse'])
      .eq('is_active', true),
  ])

  // Revenue by day/month
  const isYear = range === 'year'
  const intervals = isYear
    ? eachMonthOfInterval({ start: rangeStart, end: rangeEnd })
    : eachDayOfInterval({ start: rangeStart, end: rangeEnd })

  const revenueChart = intervals.map((d) => {
    const key = isYear ? format(d, 'yyyy-MM') : format(d, 'yyyy-MM-dd')
    const label = isYear ? format(d, 'MMM') : format(d, 'dd MMM')
    const total = (invoices ?? [])
      .filter((inv) => {
        const invKey = isYear
          ? inv.issue_date?.slice(0, 7)
          : inv.issue_date
        return invKey === key && inv.status === 'paid'
      })
      .reduce((sum, inv) => sum + (inv.total ?? 0), 0)
    return { label, total }
  })

  // KPIs
  const totalRevenue = (invoices ?? [])
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + (i.total ?? 0), 0)

  const paidCount = (invoices ?? []).filter((i) => i.status === 'paid').length
  const totalAppointments = appointments?.length ?? 0

  const newPatients = (patients ?? []).filter(
    (p) => new Date(p.created_at) >= rangeStart && new Date(p.created_at) <= rangeEnd
  ).length

  // Appointments by status
  const statusCounts = (appointments ?? []).reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1
    return acc
  }, {})

  const appointmentsByStatus = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }))

  // Top services from invoice items
  const serviceTotals = (invoiceItems ?? []).reduce<Record<string, number>>((acc, item) => {
    const key = item.description
    acc[key] = (acc[key] ?? 0) + (item.total ?? 0)
    return acc
  }, {})

  const topServices = Object.entries(serviceTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)

  // Vet performance
  const vetPerformance = (allStaff ?? []).map((vet) => ({
    name: vet.full_name.split(' ')[0],
    fullName: vet.full_name,
    completed: (appointments ?? []).filter(
      (a) => a.vet_id === vet.id && a.status === 'completed'
    ).length,
    total: (appointments ?? []).filter((a) => a.vet_id === vet.id).length,
  })).filter((v) => v.total > 0)

  // Species breakdown
  const speciesCounts = (patients ?? []).reduce<Record<string, number>>((acc, p) => {
    acc[p.species] = (acc[p.species] ?? 0) + 1
    return acc
  }, {})

  const speciesBreakdown = Object.entries(speciesCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <AnalyticsDashboard
      range={range}
      kpis={{ totalRevenue, paidCount, totalAppointments, newPatients }}
      revenueChart={revenueChart}
      appointmentsByStatus={appointmentsByStatus}
      topServices={topServices}
      vetPerformance={vetPerformance}
      speciesBreakdown={speciesBreakdown}
    />
  )
}