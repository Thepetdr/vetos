export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export type AppointmentType =
  | 'consultation'
  | 'vaccination'
  | 'surgery'
  | 'grooming'
  | 'dental'
  | 'emergency'
  | 'follow_up'
  | 'boarding'
  | 'lab_results'
  | 'deworming'

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled:   'Scheduled',
  confirmed:   'Confirmed',
  checked_in:  'Checked In',
  in_progress: 'In Progress',
  completed:   'Completed',
  cancelled:   'Cancelled',
  no_show:     'No Show',
}

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled:   'bg-blue-50 text-blue-700',
  confirmed:   'bg-emerald-50 text-emerald-700',
  checked_in:  'bg-violet-50 text-violet-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed:   'bg-slate-100 text-slate-600',
  cancelled:   'bg-red-50 text-red-600',
  no_show:     'bg-rose-50 text-rose-500',
}

export const TYPE_LABELS: Record<AppointmentType, string> = {
  consultation: 'Consultation',
  vaccination:  'Vaccination',
  surgery:      'Surgery',
  grooming:     'Grooming',
  dental:       'Dental',
  emergency:    'Emergency',
  follow_up:    'Follow-up',
  boarding:     'Boarding',
  lab_results:  'Lab Results',
  deworming:    'Deworming',
}

export const TYPE_COLORS: Record<AppointmentType, string> = {
  consultation: 'bg-sky-50 text-sky-700',
  vaccination:  'bg-emerald-50 text-emerald-700',
  surgery:      'bg-red-50 text-red-700',
  grooming:     'bg-pink-50 text-pink-700',
  dental:       'bg-indigo-50 text-indigo-700',
  emergency:    'bg-red-100 text-red-800',
  follow_up:    'bg-amber-50 text-amber-700',
  boarding:     'bg-teal-50 text-teal-700',
  lab_results:  'bg-purple-50 text-purple-700',
  deworming:    'bg-lime-50 text-lime-700',
}