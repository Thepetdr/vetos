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
import { toast } from 'sonner'
import { Loader2, FileText, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'

const visitTypes = [
  'consultation', 'surgery', 'vaccination',
  'follow_up', 'emergency', 'dental', 'lab', 'other'
]

interface Props {
  patients: any[]
  staff: any[]
  defaultPatientId?: string
  defaultAppointmentId?: string
}

export default function SOAPNoteForm({ patients, staff, defaultPatientId, defaultAppointmentId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showVitals, setShowVitals] = useState(false)

  const [selectedPatientId, setSelectedPatientId] = useState(defaultPatientId ?? '')
  const [visitType, setVisitType] = useState('consultation')
  const [vetId, setVetId] = useState('')

  // SOAP fields
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [followUpNotes, setFollowUpNotes] = useState('')

  // Vitals
  const [vitals, setVitals] = useState({
    weight_kg: '', temperature_c: '', heart_rate: '',
    respiratory_rate: '', blood_pressure: '', spo2: ''
  })

  const selectedPatient = patients.find(p => p.id === selectedPatientId)

    async function generateAISOAP() {
    if (!chiefComplaint && !subjective) {
      toast.error('Enter a chief complaint or subjective findings first')
      return
    }

    setAiLoading(true)

    try {
      const response = await fetch('/api/ai/soap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint,
          subjective,
          objective,
          species: selectedPatient?.species ?? 'unknown',
          breed: selectedPatient?.breed ?? '',
          visitType,
          vitals,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        console.error('AI SOAP ERROR:', data)
        toast.error(data?.error || 'AI generation failed')
        return
      }

      if (data.assessment) setAssessment(data.assessment)
      if (data.plan) setPlan(data.plan)
      if (data.objective && !objective) setObjective(data.objective)

      toast.success('AI suggestions applied — review before saving')
    } catch (error) {
      console.error('AI SOAP FETCH ERROR:', error)
      toast.error('AI request failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPatientId) { toast.error('Select a patient'); return }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: staffData } = await supabase
      .from('staff')
      .select('clinic_id, id')
      .eq('user_id', user?.id)
      .single()

    if (!staffData) { toast.error('Clinic not found'); setLoading(false); return }

    const patient = patients.find(p => p.id === selectedPatientId)

    const { error } = await supabase.from('soap_notes').insert({
      clinic_id: staffData.clinic_id,
      patient_id: selectedPatientId,
      client_id: patient?.client_id ?? null,
      vet_id: vetId || staffData.id,
      appointment_id: defaultAppointmentId ?? null,
      visit_date: new Date().toISOString(),
      visit_type: visitType,
      chief_complaint: chiefComplaint || null,
      subjective: subjective || null,
      objective: objective || null,
      assessment: assessment || null,
      plan: plan || null,
      follow_up_date: followUpDate || null,
      follow_up_notes: followUpNotes || null,
      weight_kg: vitals.weight_kg ? parseFloat(vitals.weight_kg) : null,
      temperature_c: vitals.temperature_c ? parseFloat(vitals.temperature_c) : null,
      heart_rate: vitals.heart_rate ? parseInt(vitals.heart_rate) : null,
      respiratory_rate: vitals.respiratory_rate ? parseInt(vitals.respiratory_rate) : null,
    })

    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success('Medical record saved!')
    router.push('/records')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Patient & Visit Info */}
      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Visit Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Patient *</Label>
            <Select
              defaultValue={defaultPatientId}
              onValueChange={setSelectedPatientId}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.species})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Visit Type</Label>
            <Select defaultValue="consultation" onValueChange={setVisitType}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visitTypes.map(t => (
                  <SelectItem key={t} value={t} className="capitalize">
                    {t.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Attending Vet</Label>
            <Select onValueChange={setVetId}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select vet" />
              </SelectTrigger>
              <SelectContent>
                {staff.map(s => (
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
                {selectedPatient.species} {selectedPatient.breed ? `· ${selectedPatient.breed}` : ''} · {selectedPatient.clients?.full_name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chief Complaint */}
      <div className="card-premium p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Chief Complaint</h2>
        </div>
        <Textarea
          placeholder="Primary reason for visit..."
          value={chiefComplaint}
          onChange={e => setChiefComplaint(e.target.value)}
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
            : <ChevronDown className="h-4 w-4 text-slate-400" />
          }
        </button>
        {showVitals && (
          <div className="px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-4">
            {[
              { key: 'weight_kg',        label: 'Weight (kg)',     placeholder: '4.5' },
              { key: 'temperature_c',    label: 'Temperature (°C)', placeholder: '38.5' },
              { key: 'heart_rate',       label: 'Heart Rate (bpm)', placeholder: '80' },
              { key: 'respiratory_rate', label: 'Resp. Rate (/min)', placeholder: '20' },
              { key: 'blood_pressure',   label: 'Blood Pressure',  placeholder: '120/80' },
              { key: 'spo2',            label: 'SpO2 (%)',         placeholder: '98' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-xs">{label}</Label>
                <Input
                  type={key === 'blood_pressure' ? 'text' : 'number'}
                  step="0.1"
                  placeholder={placeholder}
                  value={vitals[key as keyof typeof vitals]}
                  onChange={e => setVitals(v => ({ ...v, [key]: e.target.value }))}
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
            {aiLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />
            }
            {aiLoading ? 'Generating...' : 'AI Assist'}
          </Button>
        </div>

        {/* S */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center justify-center">S</span>
            <Label className="font-medium">Subjective</Label>
            <span className="text-xs text-slate-400">— Client-reported history & observations</span>
          </div>
          <Textarea
            placeholder="History, owner observations, duration of symptoms, prior treatments..."
            value={subjective}
            onChange={e => setSubjective(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
        </div>

        {/* O */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center">O</span>
            <Label className="font-medium">Objective</Label>
            <span className="text-xs text-slate-400">— Physical exam findings</span>
          </div>
          <Textarea
            placeholder="Physical examination findings, lab results, imaging..."
            value={objective}
            onChange={e => setObjective(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
        </div>

        {/* A */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center justify-center">A</span>
            <Label className="font-medium">Assessment</Label>
            <span className="text-xs text-slate-400">— Diagnosis & differential diagnoses</span>
          </div>
          <Textarea
            placeholder="Primary diagnosis, differentials, prognosis..."
            value={assessment}
            onChange={e => setAssessment(e.target.value)}
            rows={3}
            className="rounded-xl"
          />
        </div>

        {/* P */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-rose-100 text-rose-700 rounded-lg text-xs font-bold flex items-center justify-center">P</span>
            <Label className="font-medium">Plan</Label>
            <span className="text-xs text-slate-400">— Treatment, medications, instructions</span>
          </div>
          <Textarea
            placeholder="Treatment plan, medications prescribed, client instructions, referrals..."
            value={plan}
            onChange={e => setPlan(e.target.value)}
            rows={4}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Follow-up */}
      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Follow-up</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Follow-up Date</Label>
            <Input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Follow-up Notes</Label>
            <Input
              placeholder="Instructions for next visit..."
              value={followUpNotes}
              onChange={e => setFollowUpNotes(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push('/records')} className="rounded-xl">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl border-0 shadow-md shadow-rose-100"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><FileText className="h-4 w-4 mr-2" />Save Record</>
          }
        </Button>
      </div>
    </form>
  )
}