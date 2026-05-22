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
import { toast } from 'sonner'
import { Loader2, CalendarPlus } from 'lucide-react'
import { TYPE_LABELS } from '@/lib/types/appointments'
import { format } from 'date-fns'

interface Props {
  patients: { id: string; name: string; species: string; breed: string | null; client_id: string }[]
  clients: { id: string; full_name: string; phone: string }[]
  vets: { id: string; full_name: string; role: string }[]
  defaultPatientId: string | null
  defaultClientId: string | null
  defaultDate: string | null
  staffId: string | null
  clinicId: string | null
}

export default function NewAppointmentForm({
  patients, clients, vets,
  defaultPatientId, defaultClientId, defaultDate,
  staffId, clinicId,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  // Build default datetime: defaultDate or today at next full hour
  const defaultDatetime = (() => {
    const base = defaultDate ? new Date(defaultDate) : new Date()
    base.setMinutes(0, 0, 0)
    base.setHours(base.getHours() + (defaultDate ? 0 : 1))
    return format(base, "yyyy-MM-dd'T'HH:mm")
  })()

  const [form, setForm] = useState({
    patient_id: defaultPatientId ?? '',
    client_id: defaultClientId ?? '',
    vet_id: '',
    appointment_type: 'consultation',
    scheduled_at: defaultDatetime,
    duration_minutes: '30',
    chief_complaint: '',
    notes: '',
  })

  // Auto-fill client when patient is selected
  useEffect(() => {
    if (form.patient_id) {
      const patient = patients.find((p) => p.id === form.patient_id)
      if (patient?.client_id) {
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

    const { error } = await supabase.from('appointments').insert({
      clinic_id: clinicId,
      patient_id: form.patient_id,
      client_id: form.client_id,
      vet_id: form.vet_id || null,
      appointment_type: form.appointment_type,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      duration_minutes: parseInt(form.duration_minutes),
      chief_complaint: form.chief_complaint || null,
      notes: form.notes || null,
      created_by: staffId,
      status: 'scheduled',
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Appointment scheduled')
    router.push('/appointments')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card-premium p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
            <CalendarPlus className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Appointment Details</h2>
            <p className="text-sm text-slate-400">Schedule a patient visit</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Patient */}
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select
              defaultValue={defaultPatientId ?? undefined}
              onValueChange={(v) => set('patient_id', v)}
            >
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
            <Select
              value={form.client_id}
              onValueChange={(v) => set('client_id', v)}
            >
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
            <Select defaultValue="consultation" onValueChange={(v) => set('appointment_type', v)}>
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

          {/* Vet */}
          <div className="space-y-1.5">
            <Label>Assigned Vet</Label>
            <Select onValueChange={(v) => set('vet_id', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {vets.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Time */}
          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => set('scheduled_at', e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          {/* Duration */}
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Select defaultValue="30" onValueChange={(v) => set('duration_minutes', v)}>
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

      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl border-0 shadow-md shadow-rose-100"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarPlus className="mr-2 h-4 w-4" />}
          Schedule Appointment
        </Button>
      </div>
    </form>
  )
}