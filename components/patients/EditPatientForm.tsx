'use client'

import { useState } from 'react'
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
import { Loader2, Save, Trash2, PawPrint } from 'lucide-react'

const SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'reptile', 'fish', 'other']
const SEX_TYPES = ['male', 'female', 'unknown']

interface Props {
  patient: any
  clients: { id: string; full_name: string; phone: string }[]
}

export default function EditPatientForm({ patient, clients }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    name: patient.name ?? '',
    client_id: patient.client_id ?? '',
    species: patient.species ?? 'dog',
    breed: patient.breed ?? '',
    color: patient.color ?? '',
    sex: patient.sex ?? 'unknown',
    date_of_birth: patient.date_of_birth ?? '',
    weight_kg: patient.weight_kg ? String(patient.weight_kg) : '',
    microchip_number: patient.microchip_number ?? '',
    passport_number: patient.passport_number ?? '',
    insurance_provider: patient.insurance_provider ?? '',
    insurance_policy: patient.insurance_policy ?? '',
    is_deceased: patient.is_deceased ? 'true' : 'false',
    notes: patient.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.client_id || !form.species) {
      toast.error('Name, client and species are required')
      return
    }
    setLoading(true)

    const { error } = await supabase
      .from('patients')
      .update({
        name: form.name,
        client_id: form.client_id,
        species: form.species,
        breed: form.breed || null,
        color: form.color || null,
        sex: form.sex,
        date_of_birth: form.date_of_birth || null,
        weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
        microchip_number: form.microchip_number || null,
        passport_number: form.passport_number || null,
        insurance_provider: form.insurance_provider || null,
        insurance_policy: form.insurance_policy || null,
        is_deceased: form.is_deceased === 'true',
        notes: form.notes || null,
      })
      .eq('id', patient.id)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Patient updated')
    router.push(`/patients/${patient.id}`)
    router.refresh()
  }

  async function handleDelete() {
    setDeleting(true)
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', patient.id)

    if (error) {
      toast.error(error.message)
      setDeleting(false)
      return
    }

    toast.success('Patient deleted')
    router.push('/patients')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Basic Info */}
      <div className="card-premium p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
            <PawPrint className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Basic Information</h2>
            <p className="text-sm text-slate-400">Core patient details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label>Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="rounded-xl"
              placeholder="Patient name"
              required
            />
          </div>

          {/* Owner */}
          <div className="space-y-1.5">
            <Label>Owner *</Label>
            <Select value={form.client_id} onValueChange={(v) => set('client_id', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select owner" />
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

          {/* Species */}
          <div className="space-y-1.5">
            <Label>Species *</Label>
            <Select value={form.species} onValueChange={(v) => set('species', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SPECIES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Breed */}
          <div className="space-y-1.5">
            <Label>Breed</Label>
            <Input
              value={form.breed}
              onChange={(e) => set('breed', e.target.value)}
              className="rounded-xl"
              placeholder="e.g. Golden Retriever"
            />
          </div>

          {/* Sex */}
          <div className="space-y-1.5">
            <Label>Sex</Label>
            <Select value={form.sex} onValueChange={(v) => set('sex', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEX_TYPES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <Label>Color / Markings</Label>
            <Input
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
              className="rounded-xl"
              placeholder="e.g. Golden, white paws"
            />
          </div>

          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
              className="rounded-xl"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1.5">
            <Label>Weight (kg)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.weight_kg}
              onChange={(e) => set('weight_kg', e.target.value)}
              className="rounded-xl"
              placeholder="e.g. 4.50"
            />
          </div>

          {/* Deceased status */}
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.is_deceased} onValueChange={(v) => set('is_deceased', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Active</SelectItem>
                <SelectItem value="true">Deceased</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="card-premium p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Identity & Insurance</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Microchip Number</Label>
            <Input
              value={form.microchip_number}
              onChange={(e) => set('microchip_number', e.target.value)}
              className="rounded-xl"
              placeholder="15-digit microchip ID"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Passport Number</Label>
            <Input
              value={form.passport_number}
              onChange={(e) => set('passport_number', e.target.value)}
              className="rounded-xl"
              placeholder="Pet passport number"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Insurance Provider</Label>
            <Input
              value={form.insurance_provider}
              onChange={(e) => set('insurance_provider', e.target.value)}
              className="rounded-xl"
              placeholder="e.g. PetSecure UAE"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Insurance Policy No.</Label>
            <Input
              value={form.insurance_policy}
              onChange={(e) => set('insurance_policy', e.target.value)}
              className="rounded-xl"
              placeholder="Policy number"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card-premium p-5 sm:p-6 space-y-3">
        <h2 className="font-semibold text-slate-800">Notes</h2>
        <Textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          className="rounded-xl"
          rows={4}
          placeholder="Any additional notes about this patient..."
        />
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
              Delete Patient
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {patient.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete <strong>{patient.name}</strong> and all their
                records including appointments, vaccinations, and medical history.
                This action cannot be undone.
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