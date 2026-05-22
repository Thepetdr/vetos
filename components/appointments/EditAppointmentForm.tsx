'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Save, Trash2, CalendarClock } from 'lucide-react'
import { TYPE_LABELS, STATUS_LABELS } from '@/lib/types/appointments'
import { format } from 'date-fns'

interface Props {
  appointment: any
  patients: { id: string; name: string; species: string; breed: string | null; client_id: string }[]
  clients: { id: string; full_name: string; phone: string }[]
  vets: { id: string; full_name: string; role: string }[]
}

export default function EditAppointmentForm({ appointment, patients, clients, vets }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const defaultDatetime = format(
    new Date(appointment.scheduled_at),
    "yyyy-MM-dd'T'HH:mm"
  )

  const [form, setForm] = useState({
    patient_id: appointment.patient_id ?? '',
    client_id: appointment.client_id ?? '',
    vet_id: appointment.vet_id ?? '',
    appointment_type: appointment.appointment_type ?? 'consultation',
    status: appointment.status ?? 'scheduled',
    scheduled_at: defaultDatetime,
    duration_minutes: String(appointment.duration_minutes ?? 30),
    chief_complaint: appointment.chief_complaint ?? '',
    notes: appointment.notes ?? '',
  })

  // Auto-fill client when patient changes
  useEffect(() => {
    if (form.patient_id) {
      const patient = patients.find((p) => p.id === form.patient_id)
      if (patient?.client_id && patient.client_id !== form.client_id) {
        setForm((prev) => ({ ...prev, client_id: patient.client_id }))
      }
    }
  }, [form.patient_id])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.patient_id || !form.client_id) {
      toast.error('Patient and client are required')
      return
    }
    setLoading(true)

    const { error } = await supabase
      .from('appointments')
      .update({
        patient_id: form.patient_id,
        client_id: form.client_id,
        vet_id: form.vet_id || null,
        appointment_type: form.appointment_type,
        status: form.status,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: parseInt(form.duration_minutes),
        chief_complaint: form.chief_complaint || null,
        notes: form.notes || null,
      })
      .eq('id', appointment.id)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Appointment updated')
    router.push(`/appointments/${appointment.id}`)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment.id)

    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }

    toast.success('Appointment deleted')
    router.push('/appointments')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card-premium p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
            <CalendarClock className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Appointment Details</h2>
            <p className="text-sm text-slate-400">Update the appointment information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Patient */}
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select value={form.patient_id} onValueChange={(v) => set('patient_id', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.breed || p.species}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Client */}
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => set('client_id', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name} · {c.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Appointment Type *</Label>
            <Select value={form.appointment_type} onValueChange={(v) => set('appointment_type', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vet */}
          <div className="space-y-1.5">
  <Label>Assigned Vet</Label>
  <Select
    value={form.vet_id || 'none'}
    onValueChange={(v) => set('vet_id', v === 'none' ? '' : v)}
  >
    <SelectTrigger className="rounded-xl">
      <SelectValue placeholder="Unassigned" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="none">Unassigned</SelectItem>
      {vets.map((v) => (
        <SelectItem key={v.id} value={v.id}>{v.full_name}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
          {/* Duration */}
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Select value={form.duration_minutes} onValueChange={(v) => set('duration_minutes', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[15, 30, 45, 60, 90, 120].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d < 60 ? `${d} minutes` : `${d / 60} hour${d > 60 ? 's' : ''}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="col-span-full space-y-1.5">
            <Label>Date & Time *</Label>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => set('scheduled_at', e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          {/* Chief Complaint */}
          <div className="col-span-full space-y-1.5">
            <Label>Chief Complaint</Label>
            <Input
              value={form.chief_complaint}
              onChange={(e) => set('chief_complaint', e.target.value)}
              className="rounded-xl"
              placeholder="Main reason for the visit..."
            />
          </div>

          {/* Notes */}
          <div className="col-span-full space-y-1.5">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="rounded-xl"
              rows={3}
              placeholder="Any additional notes..."
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between">
        {/* Delete */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Appointment
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this appointment?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the appointment for{' '}
                <strong>{appointment.patients?.name}</strong>. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Save / Cancel */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl border-0 shadow-md shadow-rose-100"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}