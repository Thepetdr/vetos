'use client'

import { useState, useTransition } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { AppointmentStatus, STATUS_COLORS, STATUS_LABELS } from '@/lib/types/appointments'

const NEXT_STATUSES: Record<AppointmentStatus, AppointmentStatus[]> = {
  scheduled:   ['confirmed', 'checked_in', 'cancelled', 'no_show'],
  confirmed:   ['checked_in', 'cancelled', 'no_show'],
  checked_in:  ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed:   [],
  cancelled:   ['scheduled'],
  no_show:     ['scheduled'],
}

export default function UpdateStatusButton({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string
  currentStatus: AppointmentStatus
}) {
  const [status, setStatus] = useState<AppointmentStatus>(currentStatus)
  const [, startTransition] = useTransition()
  const router = useRouter()
  const supabase = createClient()

  const nextOptions = NEXT_STATUSES[status] ?? []

  async function updateStatus(newStatus: AppointmentStatus) {
    const prev = status
    setStatus(newStatus)
    startTransition(async () => {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId)
      if (error) {
        toast.error(error.message)
        setStatus(prev)
      } else {
        toast.success(`Status updated to ${STATUS_LABELS[newStatus]}`)
        router.refresh()
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80 ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
          {nextOptions.length > 0 && <ChevronDown className="h-3 w-3 opacity-60" />}
        </button>
      </DropdownMenuTrigger>
      {nextOptions.length > 0 && (
        <DropdownMenuContent align="end" className="rounded-xl min-w-40">
          {nextOptions.map((s) => (
            <DropdownMenuItem
              key={s}
              onClick={() => updateStatus(s)}
              className="rounded-lg"
            >
              <span className={`mr-2 inline-block w-2 h-2 rounded-full ${STATUS_COLORS[s].split(' ')[0]}`} />
              {STATUS_LABELS[s]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      )}
    </DropdownMenu>
  )
}