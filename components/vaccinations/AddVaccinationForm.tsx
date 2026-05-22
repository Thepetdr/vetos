'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Syringe } from 'lucide-react'

const COMMON_VACCINES = [
  'Rabies',
  'DHPP (Distemper, Hepatitis, Parvovirus, Parainfluenza)',
  'Bordetella',
  'Leptospirosis',
  'Lyme Disease',
  'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)',
  'FeLV (Feline Leukemia)',
  'FIV',
  'Canine Influenza',
  'Other',
]

interface Props {
  patients: { id: string; name: string; species: string; breed: string | null }[]
  vets: { id: string; full_name: string; role: string }[]
  defaultPatientId: string | null
  staffId: string | null
}

export default function AddVaccinationForm({ patients, vets, defaultPatientId, staffId }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [customVaccine, setCustomVaccine] = useState(false)

  const [form, setForm] = useState({
    patient_id: defaultPatientId ?? '',
    vaccine_name: '',
    custom_vaccine_name: '',
    batch_number: '',
    administered_date: new Date().toISOString().split('T')[0],
    next_due_date: '',
    administered_by: staffId ?? '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleVaccineSelect(value: string) {
    if (value === 'Other') {
      setCustomVaccine(true)
      set('vaccine_name', '')
    } else {
      setCustomVaccine(false)
      set('vaccine_name', value)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: staffData } = await supabase
      .from('staff')
      .select('clinic_id')
      .eq('user_id', user?.id)
      .single()

    if (!staffData) {
      toast.error('Could not find clinic')
      setLoading(false)
      return
    }

    const vaccineName = customVaccine ? form.custom_vaccine_name : form.vaccine_name

    if (!vaccineName) {
      toast.error('Please enter a vaccine name')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('vaccinations').insert({
      clinic_id: staffData.clinic_id,
      patient_id: form.patient_id,
      vaccine_name: vaccineName,
      batch_number: form.batch_number || null,
      administered_date: form.administered_date,
      next_due_date: form.next_due_date || null,
      administered_by: form.administered_by || null,
      notes: form.notes || null,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Vaccination recorded successfully')

    if (defaultPatientId) {
      router.push(`/patients/${defaultPatientId}`)
    } else {
      router.push('/vaccinations')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card-premium p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
            <Syringe className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Vaccination Details</h2>
            <p className="text-sm text-slate-400">Record a vaccine administered to a patient</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Patient */}
          <div className="col-span-full space-y-1.5">
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

          {/* Vaccine Name */}
          <div className="col-span-full space-y-1.5">
            <Label>Vaccine *</Label>
            <Select onValueChange={handleVaccineSelect}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select vaccine" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_VACCINES.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customVaccine && (
              <Input
                value={form.custom_vaccine_name}
                onChange={(e) => set('custom_vaccine_name', e.target.value)}
                className="rounded-xl mt-2"
                placeholder="Enter vaccine name"
                required
              />
            )}
          </div>

          {/* Batch Number */}
          <div className="space-y-1.5">
            <Label>Batch / Lot Number</Label>
            <Input
              value={form.batch_number}
              onChange={(e) => set('batch_number', e.target.value)}
              className="rounded-xl"
              placeholder="e.g. B2024-001"
            />
          </div>

          {/* Administered By */}
          <div className="space-y-1.5">
            <Label>Administered By</Label>
            <Select
              defaultValue={staffId ?? undefined}
              onValueChange={(v) => set('administered_by', v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select staff" />
              </SelectTrigger>
              <SelectContent>
                {vets.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Administered Date */}
          <div className="space-y-1.5">
            <Label>Administered Date *</Label>
            <Input
              type="date"
              value={form.administered_date}
              onChange={(e) => set('administered_date', e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          {/* Next Due Date */}
          <div className="space-y-1.5">
            <Label>Next Due Date</Label>
            <Input
              type="date"
              value={form.next_due_date}
              onChange={(e) => set('next_due_date', e.target.value)}
              className="rounded-xl"
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
              placeholder="Any reactions, observations or instructions..."
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
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
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl border-0 shadow-md shadow-emerald-100"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Syringe className="mr-2 h-4 w-4" />
          )}
          Record Vaccination
        </Button>
      </div>
    </form>
  )
}