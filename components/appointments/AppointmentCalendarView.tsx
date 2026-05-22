'use client'

import { useState, useMemo } from 'react'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  addMonths, subMonths, addWeeks, subWeeks, startOfWeek as startOfWeekFn,
  eachHourOfInterval, startOfDay, endOfDay, addHours
} from 'date-fns'
import { ChevronLeft, ChevronRight, Dog, Cat, Bird, PawPrint } from 'lucide-react'
import Link from 'next/link'
import { TYPE_COLORS, TYPE_LABELS, STATUS_COLORS, STATUS_LABELS } from '@/lib/types/appointments'

const speciesIcon: Record<string, any> = { dog: Dog, cat: Cat, bird: Bird }

export default function AppointmentCalendarView({
  appointments,
  initialDate,
}: {
  appointments: any[]
  initialDate?: string
}) {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week')
  const [currentDate, setCurrentDate] = useState(
    initialDate ? new Date(initialDate) : new Date()
  )
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date())

  // Month view days
  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Week view days
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentDate, { weekStartsOn: 0 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  function apptForDay(day: Date) {
    return appointments.filter((a) => isSameDay(new Date(a.scheduled_at), day))
  }

  function navigate(dir: 1 | -1) {
    if (viewMode === 'month') {
      setCurrentDate(dir === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
    } else {
      setCurrentDate(dir === 1 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1))
    }
  }

  const selectedDayAppts = selectedDay ? apptForDay(selectedDay) : []

  return (
    <div className="space-y-4">
      {/* Calendar Controls */}
      <div className="card-premium p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-slate-600" />
          </button>
          <h2 className="text-base font-semibold text-slate-800 min-w-44 text-center">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`}
          </h2>
          <button
            onClick={() => navigate(1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-slate-600" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Today
          </button>
        </div>
        <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
          {(['week', 'month'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                viewMode === m
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-2 card-premium overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Month view */}
          {viewMode === 'month' && (
            <div className="grid grid-cols-7">
              {monthDays.map((day, i) => {
                const dayAppts = apptForDay(day)
                const isSelected = selectedDay && isSameDay(day, selectedDay)
                const isCurrentMonth = isSameMonth(day, currentDate)

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[80px] p-2 border-b border-r border-slate-100 text-left transition-colors ${
                      !isCurrentMonth ? 'bg-slate-50/40' : 'hover:bg-slate-50'
                    } ${isSelected ? 'bg-rose-50/60' : ''}`}
                  >
                    <span className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-semibold mb-1 ${
                      isToday(day)
                        ? 'bg-rose-500 text-white'
                        : isSelected
                        ? 'bg-rose-100 text-rose-700'
                        : isCurrentMonth
                        ? 'text-slate-700'
                        : 'text-slate-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-0.5">
                      {dayAppts.slice(0, 2).map((a) => (
                        <div
                          key={a.id}
                          className="text-xs px-1 py-0.5 rounded bg-rose-100 text-rose-700 truncate"
                        >
                          {format(new Date(a.scheduled_at), 'HH:mm')} {a.patients?.name}
                        </div>
                      ))}
                      {dayAppts.length > 2 && (
                        <div className="text-xs text-slate-400 px-1">+{dayAppts.length - 2} more</div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* Week view */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-7">
              {weekDays.map((day, i) => {
                const dayAppts = apptForDay(day)
                const isSelected = selectedDay && isSameDay(day, selectedDay)

                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDay(day)}
                    className={`min-h-[120px] p-2 border-b border-r border-slate-100 text-left transition-colors hover:bg-slate-50 ${
                      isSelected ? 'bg-rose-50/60' : ''
                    }`}
                  >
                    <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-xs font-semibold mb-2 ${
                      isToday(day)
                        ? 'bg-rose-500 text-white'
                        : isSelected
                        ? 'bg-rose-100 text-rose-700'
                        : 'text-slate-600'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    <div className="space-y-1">
                      {dayAppts.map((a) => {
                        const SpeciesIcon = speciesIcon[a.patients?.species] ?? PawPrint
                        return (
                          <div
                            key={a.id}
                            className="text-xs px-1.5 py-1 rounded-lg bg-rose-50 text-rose-700 flex items-center gap-1"
                          >
                            <SpeciesIcon className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{format(new Date(a.scheduled_at), 'HH:mm')} {a.patients?.name}</span>
                          </div>
                        )
                      })}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        <div className="card-premium overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">
              {selectedDay
                ? isToday(selectedDay)
                  ? 'Today'
                  : format(selectedDay, 'EEEE, MMMM d')
                : 'Select a day'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDayAppts.length} appointment{selectedDayAppts.length !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[500px]">
            {selectedDayAppts.length === 0 ? (
              <div className="p-8 text-center">
                <PawPrint className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No appointments</p>
              </div>
            ) : (
              selectedDayAppts
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                .map((appt) => {
                  const SpeciesIcon = speciesIcon[appt.patients?.species] ?? PawPrint
                  return (
                    <Link
                      key={appt.id}
                      href={`/appointments/${appt.id}`}
                      className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="shrink-0 text-center w-10">
                        <p className="text-sm font-bold text-slate-700 tabular-nums">
                          {format(new Date(appt.scheduled_at), 'HH:mm')}
                        </p>
                        <p className="text-xs text-slate-400">{appt.duration_minutes}m</p>
                      </div>
                      <div className="w-px h-full min-h-8 bg-slate-100 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-5 h-5 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                            <SpeciesIcon className="h-3 w-3 text-rose-500" />
                          </div>
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-rose-600 transition-colors">
                            {appt.patients?.name}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 mb-1">{appt.clients?.full_name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_COLORS[appt.status as keyof typeof STATUS_COLORS]}`}>
                            {STATUS_LABELS[appt.status as keyof typeof STATUS_LABELS]}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${TYPE_COLORS[appt.appointment_type as keyof typeof TYPE_COLORS] ?? 'bg-slate-100 text-slate-500'}`}>
                            {TYPE_LABELS[appt.appointment_type as keyof typeof TYPE_LABELS] ?? appt.appointment_type}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}