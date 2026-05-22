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
import {
  Loader2,
  PawPrint,
  Dog,
  Cat,
  Bird,
  Rabbit,
  ShieldCheck,
} from 'lucide-react'

interface Props {
  clients: { id: string; full_name: string; phone: string }[]
}

export default function AddPatientForm({ clients }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    species: '',
    breed: '',
    color: '',
    sex: '',
    date_of_birth: '',
    weight_kg: '',
    microchip_number: '',
    client_id: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.client_id) {
      toast.error('Please select an owner')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: staffData } = await supabase
      .from('staff')
      .select('clinic_id')
      .eq('user_id', user?.id)
      .single()

    if (!staffData) {
      toast.error('Could not find clinic. Please contact support.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('patients').insert({
      clinic_id: staffData.clinic_id,
      client_id: form.client_id,
      name: form.name,
      species: form.species,
      breed: form.breed || null,
      color: form.color || null,
      sex: form.sex || 'unknown',
      date_of_birth: form.date_of_birth || null,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      microchip_number: form.microchip_number || null,
      notes: form.notes || null,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(`${form.name} has been registered`)
    router.push('/patients')
    router.refresh()
  }

  const speciesOptions = [
    { value: 'dog', label: 'Dog', icon: Dog },
    { value: 'cat', label: 'Cat', icon: Cat },
    { value: 'bird', label: 'Bird', icon: Bird },
    { value: 'rabbit', label: 'Rabbit', icon: Rabbit },
    { value: 'reptile', label: 'Reptile', icon: ShieldCheck },
    { value: 'exotic', label: 'Exotic', icon: PawPrint },
    { value: 'other', label: 'Other', icon: PawPrint },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card-premium p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
            <PawPrint className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Patient Information</h2>
            <p className="text-sm text-slate-400">Basic medical identity and profile details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Patient Name *</Label>
            <Input
              id="name"
              placeholder="e.g. Max"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="rounded-xl bg-white/80"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Species *</Label>
            <Select onValueChange={(v) => set('species', v)}>
              <SelectTrigger className="rounded-xl bg-white/80">
                <SelectValue placeholder="Select species" />
              </SelectTrigger>
              <SelectContent>
                {speciesOptions.map((item) => {
                  const Icon = item.icon
                  return (
                    <SelectItem key={item.value} value={item.value}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-500" />
                        <span>{item.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="breed">Breed</Label>
            <Input
              id="breed"
              placeholder="e.g. Golden Retriever"
              value={form.breed}
              onChange={(e) => set('breed', e.target.value)}
              className="rounded-xl bg-white/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="color">Color / Markings</Label>
            <Input
              id="color"
              placeholder="e.g. Golden"
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
              className="rounded-xl bg-white/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Sex</Label>
            <Select onValueChange={(v) => set('sex', v)}>
              <SelectTrigger className="rounded-xl bg-white/80">
                <SelectValue placeholder="Select sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="male_neutered">Male (Neutered)</SelectItem>
                <SelectItem value="female_spayed">Female (Spayed)</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input
              id="dob"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => set('date_of_birth', e.target.value)}
              className="rounded-xl bg-white/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              placeholder="e.g. 12.5"
              value={form.weight_kg}
              onChange={(e) => set('weight_kg', e.target.value)}
              className="rounded-xl bg-white/80"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="microchip">Microchip Number</Label>
            <Input
              id="microchip"
              placeholder="15-digit number"
              value={form.microchip_number}
              onChange={(e) => set('microchip_number', e.target.value)}
              className="rounded-xl bg-white/80"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional notes about this patient..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={4}
            className="rounded-xl bg-white/80"
          />
        </div>
      </div>

      <div className="card-premium p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Owner Assignment</h2>
            <p className="text-sm text-slate-400">Link this patient to an existing client profile</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Select Owner *</Label>
          {clients.length === 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              No clients found. Please add a client first before registering a patient.
            </div>
          ) : (
            <Select onValueChange={(v) => set('client_id', v)}>
              <SelectTrigger className="rounded-xl bg-white/80">
                <SelectValue placeholder="Search and select owner" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name} {c.phone ? `— ${c.phone}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/patients')}
          className="rounded-xl"
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading || clients.length === 0}
          className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl border-0 shadow-md shadow-rose-100"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <PawPrint className="mr-2 h-4 w-4" />
          )}
          Register Patient
        </Button>
      </div>
    </form>
  )
}