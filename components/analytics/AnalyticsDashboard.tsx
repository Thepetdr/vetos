'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, CalendarDays, PawPrint, Receipt } from 'lucide-react'

interface Props {
  range: string
  kpis: { totalRevenue: number; paidCount: number; totalAppointments: number; newPatients: number }
  revenueChart: { label: string; total: number }[]
  appointmentsByStatus: { name: string; value: number }[]
  topServices: { name: string; total: number }[]
  vetPerformance: { name: string; fullName: string; completed: number; total: number }[]
  speciesBreakdown: { name: string; value: number }[]
}

const SPECIES_COLORS = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4']
const STATUS_COLORS: Record<string, string> = {
  completed:   '#10b981',
  confirmed:   '#3b82f6',
  scheduled:   '#6366f1',
  'in progress': '#f59e0b',
  cancelled:   '#f43f5e',
  'no show':   '#94a3b8',
  'checked in': '#8b5cf6',
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800">
          AED {Number(payload[0].value).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

function CustomServiceTooltip({ active, payload, label }: any) {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-bold text-slate-800">
          AED {Number(payload[0].value).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
        </p>
      </div>
    )
  }
  return null
}

export default function AnalyticsDashboard({
  range, kpis, revenueChart, appointmentsByStatus,
  topServices, vetPerformance, speciesBreakdown,
}: Props) {
  const router = useRouter()

  const ranges = [
    { value: 'week',  label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year',  label: 'This Year' },
  ]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500 text-sm mt-0.5">Clinic performance overview</p>
        </div>
        <div className="flex gap-2">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => router.push(`/analytics?range=${r.value}`)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                range === r.value
                  ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-200 hover:text-rose-600'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: 'Total Revenue',
            value: `AED ${kpis.totalRevenue.toLocaleString('en-AE', { minimumFractionDigits: 2 })}`,
            icon: TrendingUp,
            iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500',
          },
          {
            label: 'Paid Invoices',
            value: kpis.paidCount,
            icon: Receipt,
            iconBg: 'bg-blue-50', iconColor: 'text-blue-500',
          },
          {
            label: 'Appointments',
            value: kpis.totalAppointments,
            icon: CalendarDays,
            iconBg: 'bg-violet-50', iconColor: 'text-violet-500',
          },
          {
            label: 'New Patients',
            value: kpis.newPatients,
            icon: PawPrint,
            iconBg: 'bg-rose-50', iconColor: 'text-rose-500',
          },
        ].map(({ label, value, icon: Icon, iconBg, iconColor }) => (
          <div key={label} className="card-premium p-4 sm:p-5">
            <div className={`${iconBg} p-2.5 rounded-xl w-fit mb-3`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-slate-800 tabular-nums">{value}</p>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card-premium p-5">
        <h2 className="font-semibold text-slate-700 mb-1">Revenue</h2>
        <p className="text-xs text-slate-400 mb-5">Paid invoices over selected period</p>
        {revenueChart.some((d) => d.total > 0) ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChart} barSize={range === 'year' ? 32 : 16} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={range === 'week' ? 0 : 'preserveStartEnd'} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc', radius: 6 }} />
              <Bar dataKey="total" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center">
            <p className="text-slate-300 text-sm">No revenue data for this period</p>
          </div>
        )}
      </div>

      {/* Middle row — Appointments by Status + Species */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Appointments by Status */}
        <div className="card-premium p-5">
          <h2 className="font-semibold text-slate-700 mb-1">Appointments by Status</h2>
          <p className="text-xs text-slate-400 mb-4">Distribution for selected period</p>
          {appointmentsByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={appointmentsByStatus}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {appointmentsByStatus.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.name] ?? SPECIES_COLORS[i % SPECIES_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [val, 'Appointments']} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span className="text-xs text-slate-600 capitalize">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-300 text-sm">No appointments for this period</p>
            </div>
          )}
        </div>

        {/* Species Breakdown */}
        <div className="card-premium p-5">
          <h2 className="font-semibold text-slate-700 mb-1">Patient Species</h2>
          <p className="text-xs text-slate-400 mb-4">All active patients</p>
          {speciesBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={speciesBreakdown}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {speciesBreakdown.map((_, i) => (
                    <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [val, 'Patients']} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span className="text-xs text-slate-600 capitalize">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-300 text-sm">No patient data</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row — Top Services + Vet Performance */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Services */}
        <div className="card-premium p-5">
          <h2 className="font-semibold text-slate-700 mb-1">Top Services</h2>
          <p className="text-xs text-slate-400 mb-4">By revenue from invoice items</p>
          {topServices.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topServices}
                layout="vertical"
                barSize={14}
                margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={110}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v.length > 14 ? v.slice(0, 14) + '…' : v}
                />
                <Tooltip content={<CustomServiceTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="total" fill="#3b82f6" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-300 text-sm">No invoice data for this period</p>
            </div>
          )}
        </div>

        {/* Vet Performance */}
        <div className="card-premium p-5">
          <h2 className="font-semibold text-slate-700 mb-1">Vet Performance</h2>
          <p className="text-xs text-slate-400 mb-4">Completed vs total appointments</p>
          {vetPerformance.length > 0 ? (
            <div className="space-y-4 mt-2">
              {vetPerformance.map((vet) => {
                const pct = vet.total > 0 ? Math.round((vet.completed / vet.total) * 100) : 0
                return (
                  <div key={vet.name}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Dr. {vet.fullName}</p>
                        <p className="text-xs text-slate-400">{vet.completed} completed · {vet.total} total</p>
                      </div>
                      <span className="text-sm font-bold text-slate-700 tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-slate-300 text-sm">No vet data for this period</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}