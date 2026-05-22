'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function AddClientForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    city: '',
    nationality: '',
    id_number: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
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
      toast.error('Could not find clinic.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('clients').insert({
      clinic_id: staffData.clinic_id,
      full_name: form.full_name,
      email: form.email || null,
      phone: form.phone,
      whatsapp: form.whatsapp || form.phone,
      address: form.address || null,
      city: form.city || null,
      nationality: form.nationality || null,
      id_number: form.id_number || null,
      notes: form.notes || null,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(`${form.full_name} added successfully!`)
    router.push('/clients')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Personal Information</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="e.g. Ahmed Al Mansouri"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                placeholder="+971 50 123 4567"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp Number</Label>
              <Input
                id="whatsapp"
                placeholder="Same as phone if same"
                value={form.whatsapp}
                onChange={(e) => set('whatsapp', e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="owner@email.com"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="font-semibold text-slate-700">Additional Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                placeholder="e.g. Emirati"
                value={form.nationality}
                onChange={(e) => set('nationality', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="id_number">Emirates ID / Passport</Label>
              <Input
                id="id_number"
                placeholder="ID number"
                value={form.id_number}
                onChange={(e) => set('id_number', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="e.g. Dubai"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Area / Street"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any notes about this client..."
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/clients')}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Client
        </Button>
      </div>
    </form>
  )
}