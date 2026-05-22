'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns'
import {
  Clock, User, Stethoscope, Dog, Cat, Bird, PawPrint,
  ChevronRight, AlertCircle, Search, SlidersHorizontal
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AppointmentStatus, AppointmentType,
  STATUS_COLORS, STATUS_LABELS, TYPE_COLORS, TYPE_LABELS
} from '@/lib/types/appointments'
import UpdateStatusButton from './UpdateStatusButton'

const speciesIcon: Record<string, any> = { dog: Dog, cat: Cat, bird: Bird }

function dateLabel(dateStr: string) {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return format(d, 'EEEE, d MMM yyyy')
}

function groupByDate(appointments: any[]) {
  const groups: Record<string, any[]> = {}
  for (const appt of appointments) {
    const key = format(new Date(appt.scheduled_at), 'yyyy-MM-dd')
    if (!groups[key]) groups[key] = []
    groups[key].push(appt)
  }
  return groups
}

export default function AppointmentListView({
  appointments,
  vets,
  initialStatus,
}: {
  appointments: any[]
  vets: any[]
  initialStatus?: string
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus ?? 'all')
  const [vetFilter, setVetFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('upcoming')

  const filtered = useMemo(() => {
    let list = [...appointments]

    if (timeFilter === 'upcoming') list = list.filter((a) => !isPast(new Date(a.scheduled_at)) || isToday(new Date(a.scheduled_at)))
    else if (timeFilter === 'past') list = list.filter((a) => isPast(new Date(a.scheduled_at)) && !isToday(new Date(a.scheduled_at)))
    else if (timeFilter === 'today') list = list.filter((a) => isToday(new Date(a.scheduled_at)))
    else if (timeFilter === 'week') list = list.filter((a) => isThisWeek(new Date(a.scheduled_at)))

    if (statusFilter !== 'all') list = list.filter((a) => a.status === statusFilter)
    if (vetFilter !== 'all') list = list.filter((a) => a.vet_id === vetFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((a) =>
        a.patients?.name?.toLowerCase().includes(q) ||
        a.clients?.full_name?.toLowerCase().includes(q) ||
        a.vets?.full_name?.toLowerCase().includes(q)
      )
    }

    return list
  }, [appointments, search, statusFilter, vetFilter, timeFilter])

  const grouped = groupByDate(filtered)
  const dateKeys = Object.keys(grouped).sort()

  const todayCount = appointments.filter((a) => isToday(new Date(a.scheduled_at))).length
  const pendingCount = appointments.filter((a) =>
    ['scheduled', 'confirmed', 'checked_in'].includes(a.status) &&
    !isPast(new Date(a.scheduled_at))
  ).length
  const overdueCount = appointments.filter((a) =>
    isPast(new Date(a.scheduled_at)) &&
    !isToday(new Date(a.scheduled_at)) &&
    ['scheduled', 'confirmed', 'checked_in'].includes(a.status)
  ).length

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Today's Appointments", value: todayCount, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Upcoming', value: pendingCount, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Overdue', value: overdueCount, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Total This Month', value: appointments.filter((a) => {
            const d = new Date(a.scheduled_at)
            const now = new Date()
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          }).length, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className="card-premium p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {overdueCount} appointment{overdueCount > 1 ? 's' : ''} passed without being completed or cancelled
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="card-premium p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, client, vet..."
              className="pl-9 rounded-xl"
            />
          </div>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="past">Past</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vetFilter} onValueChange={setVetFilter}>
            <SelectTrigger className="w-40 rounded-xl">
              <SelectValue placeholder="Vet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vets</SelectItem>
              {vets.map((v) => (
                <SelectItem key={v.id} value={v.id}>{v.full_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grouped list */}
      {dateKeys.length === 0 ? (
        <div className="card-premium p-16 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
            <PawPrint className="h-7 w-7 text-rose-400" />
          </div>
          <p className="font-semibold text-slate-700">No appointments found</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        dateKeys.map((dateKey) => (
          <div key={dateKey} className="space-y-2">
            {/* Date label */}
            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isToday(new Date(dateKey))
                  ? 'bg-rose-500 text-white'
                  : isTomorrow(new Date(dateKey))
                  ? 'bg-blue-100 text-blue-700'
                  : isPast(new Date(dateKey))
                  ? 'bg-slate-100 text-slate-500'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {dateLabel(dateKey)}
              </div>
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-xs text-slate-400">{grouped[dateKey].length} appointments</span>
            </div>

            {/* Appointment cards */}
            <div className="space-y-2">
              {grouped[dateKey].map((appt) => {
                const SpeciesIcon = speciesIcon[appt.patients?.species] ?? PawPrint
                const isOver = isPast(new Date(appt.scheduled_at)) && !isToday(new Date(appt.scheduled_at))

                return (
                  <div
                    key={appt.id}
                    className={`card-premium p-4 flex items-center gap-4 group transition-all hover:shadow-md ${
                      isOver && ['scheduled','confirmed','checked_in'].includes(appt.status)
                        ? 'border-l-2 border-amber-400'
                        : ''
                    }`}
                  >
                    {/* Time block */}
                    <div className="shrink-0 w-16 text-center">
                      <p className="text-base font-bold text-slate-800 tabular-nums">
                        {format(new Date(appt.scheduled_at), 'HH:mm')}
                      </p>
                      <p className="text-xs text-slate-400">{appt.duration_minutes}min</p>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-10 bg-slate-100 shrink-0" />

                    {/* Patient */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                        <SpeciesIcon className="h-4 w-4 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{appt.patients?.name}</p>
                        <p className="text-xs text-slate-400 truncate capitalize">
                          {appt.patients?.breed || appt.patients?.species}
                        </p>
                      </div>
                    </div>

                    {/* Client */}
                    <div className="hidden md:flex items-center gap-2 min-w-0 w-40 shrink-0">
                      <User className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      <p className="text-sm text-slate-600 truncate">{appt.clients?.full_name}</p>
                    </div>

                    {/* Vet */}
                    <div className="hidden lg:flex items-center gap-2 min-w-0 w-40 shrink-0">
                      <Stethoscope className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                      <p className="text-sm text-slate-500 truncate">
                        {appt.vets?.full_name ?? <span className="text-slate-300">Unassigned</span>}
                      </p>
                    </div>

                    {/* Type badge */}
                    <div className="hidden sm:block shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${TYPE_COLORS[appt.appointment_type as AppointmentType] ?? 'bg-slate-100 text-slate-600'}`}>
                        {TYPE_LABELS[appt.appointment_type as AppointmentType] ?? appt.appointment_type}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="shrink-0">
                      <UpdateStatusButton
                        appointmentId={appt.id}
                        currentStatus={appt.status}
                      />
                    </div>

                    {/* Arrow */}
                    <Link href={`/appointments/${appt.id}`} className="shrink-0">
                      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </Link>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}