'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { Loader2, Save, Trash2, Sparkles, ChevronDown, ChevronUp, FileText } from 'lucide-react'

const visitTypes = [
  'consultation', 'surgery', 'vaccination',
  'follow_up', 'emergency', 'dental', 'lab', 'other',
]

interface Props {
  record: any
  patients: any[]
  staff: any[]
}

export default function EditSOAPNoteForm({ record, patients, staff }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showVitals, setShowVitals] = useState(
    !!(record.weight_kg || record.temperature_c || record.heart_rate || record.respiratory_rate)
  )

  const [form, setForm] = useState({
    patient_id:       record.patient_id ?? '',
    vet_id:           record.vet_id ?? '',
    visit_type:       record.visit_type ?? 'consultation',
    chief_complaint:  record.chief_complaint ?? '',
    subjective:       record.subjective ?? '',
    objective:        record.objective ?? '',
    assessment:       record.assessment ?? '',
    plan:             record.plan ?? '',
    follow_up_date:   record.follow_up_date ?? '',
    follow_up_notes:  record.follow_up_notes ?? '',
  })

  const [vitals, setVitals] = useState({
    weight_kg:        record.weight_kg ? String(record.weight_kg) : '',
    temperature_c:    record.temperature_c ? String(record.temperature_c) : '',
    heart_rate:       record.heart_rate ? String(record.heart_rate) : '',
    respiratory_rate: record.respiratory_rate ? String(record.respiratory_rate) : '',
    blood_pressure:   '',
    spo2:             '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const selectedPatient = patients.find((p) => p.id === form.patient_id)

  async function generateAISOAP() {
    if (!form.chief_complaint && !form.subjective) {
      toast.error('Enter a chief complaint or subjective findings first')
      return
    }
    setAiLoading(true)
    try {
      const response = await fetch('/api/ai/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint: form.chief_complaint,
          subjective: form.subjective,
          objective: form.objective,
          species: selectedPatient?.species ?? 'unknown',
          breed: selectedPatient?.breed ?? '',
          visitType: form.visit_type,
          vitals,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) { toast.error(data?.error || 'AI generation failed'); return }
      if (data.assessment) set('assessment', data.assessment)
      if (data.plan) set('plan', data.plan)
      if (data.objective && !form.objective) set('objective', data.objective)
      toast.success('AI suggestions applied — review before saving')
    } catch {
      toast.error('AI request failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('soap_notes')
      .update({
        patient_id:       form.patient_id,
        vet_id:           form.vet_id || null,
        visit_type:       form.visit_type,
        chief_complaint:  form.chief_complaint || null,
        subjective:       form.subjective || null,
        objective:        form.objective || null,
        assessment:       form.assessment || null,
        plan:             form.plan || null,
        follow_up_date:   form.follow_up_date || null,
        follow_up_notes:  form.follow_up_notes || null,
        weight_kg:        vitals.weight_kg ? parseFloat(vitals.weight_kg) : null,
        temperature_c:    vitals.temperature_c ? parseFloat(vitals.temperature_c) : null,
        heart_rate:       vitals.heart_rate ? parseInt(vitals.heart_rate) : null,
        respiratory_rate: vitals.respiratory_rate ? parseInt(vitals.respiratory_rate) : null,
      })
      .eq('id', record.id)

    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success('Record updated')
    router.push(`/records/${record.id}`)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase.from('soap_notes').delete().eq('id', record.id)
    if (error) { toast.error(error.message); setDeleting(false); return }
    toast.success('Record deleted')
    router.push('/records')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Visit Info */}
      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Visit Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select value={form.patient_id} onValueChange={(v) => set('patient_id', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Visit Type</Label>
            <Select value={form.visit_type} onValueChange={(v) => set('visit_type', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {visitTypes.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Attending Vet</Label>
            <Select value={form.vet_id || 'none'} onValueChange={(v) => set('vet_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select vet" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>Dr. {s.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {selectedPatient && (
          <div className="bg-rose-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 text-sm font-bold">
              {selectedPatient.name[0]}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">{selectedPatient.name}</p>
              <p className="text-xs text-slate-500 capitalize">
                {selectedPatient.species}{selectedPatient.breed ? ` · ${selectedPatient.breed}` : ''} · {selectedPatient.clients?.full_name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chief Complaint */}
      <div className="card-premium p-5 space-y-3">
        <h2 className="font-semibold text-slate-700">Chief Complaint</h2>
        <Textarea
          placeholder="Primary reason for visit..."
          value={form.chief_complaint}
          onChange={(e) => set('chief_complaint', e.target.value)}
          rows={2}
          className="rounded-xl"
        />
      </div>

      {/* Vitals — collapsible */}
      <div className="card-premium overflow-hidden">
        <button
          type="button"
          onClick={() => setShowVitals(!showVitals)}
          className="w-full flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors"
        >
          <h2 className="font-semibold text-slate-700">Vitals & Measurements</h2>
          {showVitals
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </button>
        {showVitals && (
          <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            {[
              { key: 'weight_kg',        label: 'Weight (kg)',      placeholder: '4.5' },
              { key: 'temperature_c',    label: 'Temperature (°C)', placeholder: '38.5' },
              { key: 'heart_rate',       label: 'Heart Rate (bpm)', placeholder: '80' },
              { key: 'respiratory_rate', label: 'Resp. Rate (/min)', placeholder: '20' },
              { key: 'blood_pressure',   label: 'Blood Pressure',   placeholder: '120/80' },
              { key: 'spo2',             label: 'SpO2 (%)',         placeholder: '98' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  type={key === 'blood_pressure' ? 'text' : 'number'}
                  step="0.1"
                  placeholder={placeholder}
                  value={vitals[key as keyof typeof vitals]}
                  onChange={(e) => setVitals((v) => ({ ...v, [key]: e.target.value }))}
                  className="rounded-xl text-sm"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SOAP Notes */}
      <div className="card-premium p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">SOAP Notes</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateAISOAP}
            disabled={aiLoading}
            className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 gap-1.5"
          >
            {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {aiLoading ? 'Generating...' : 'AI Assist'}
          </Button>
        </div>

        {[
          { key: 'subjective',  label: 'Subjective',  letter: 'S', color: 'bg-blue-100 text-blue-700',     hint: 'Client-reported history & observations',     rows: 3 },
          { key: 'objective',   label: 'Objective',   letter: 'O', color: 'bg-emerald-100 text-emerald-700', hint: 'Physical exam findings',                    rows: 3 },
          { key: 'assessment',  label: 'Assessment',  letter: 'A', color: 'bg-amber-100 text-amber-700',    hint: 'Diagnosis & differential diagnoses',         rows: 3 },
          { key: 'plan',        label: 'Plan',        letter: 'P', color: 'bg-rose-100 text-rose-700',      hint: 'Treatment, medications, instructions',       rows: 4 },
        ].map(({ key, label, letter, color, hint, rows }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${color}`}>{letter}</span>
              <Label className="font-medium">{label}</Label>
              <span className="text-xs text-slate-400">— {hint}</span>
            </div>
            <Textarea
              value={form[key as keyof typeof form]}
              onChange={(e) => set(key, e.target.value)}
              rows={rows}
              className="rounded-xl"
            />
          </div>
        ))}
      </div>

      {/* Follow-up */}
      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Follow-up</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={form.follow_up_date}
              onChange={(e) => set('follow_up_date', e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Follow-up Notes</Label>
            <Input
              placeholder="Instructions for next visit..."
              value={form.follow_up_notes}
              onChange={(e) => set('follow_up_notes', e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Record
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this record?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the medical record for this visit. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
              >
                {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Yes, Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl">
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