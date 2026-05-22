'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Save, Trash2 } from 'lucide-react'

export default function EditStaffForm({ member }: { member: any }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deactivating, setDeactivating] = useState(false)

  const [form, setForm] = useState({
    full_name: member.full_name ?? '',
    full_name_ar: member.full_name_ar ?? '',
    email: member.email ?? '',
    phone: member.phone ?? '',
    role: member.role ?? '',
    specialization: member.specialization ?? '',
    license_number: member.license_number ?? '',
    is_active: member.is_active ?? true,
  })

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('staff')
      .update({
        full_name: form.full_name,
        full_name_ar: form.full_name_ar || null,
        email: form.email,
        phone: form.phone || null,
        role: form.role,
        specialization: form.specialization || null,
        license_number: form.license_number || null,
        is_active: form.is_active,
      })
      .eq('id', member.id)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Staff member updated')
    router.push('/staff')
    router.refresh()
  }

  async function toggleActive() {
    setDeactivating(true)
    const { error } = await supabase
      .from('staff')
      .update({ is_active: !form.is_active })
      .eq('id', member.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(form.is_active ? 'Staff member deactivated' : 'Staff member reactivated')
      set('is_active', !form.is_active)
      router.refresh()
    }
    setDeactivating(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card-premium p-5 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name (English) *</Label>
            <Input
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Full Name (Arabic)</Label>
            <Input
              value={form.full_name_ar}
              onChange={(e) => set('full_name_ar', e.target.value)}
              className="rounded-xl text-right"
              dir="rtl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select defaultValue={form.role} onValueChange={(v) => set('role', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
  <SelectItem value="admin">Admin</SelectItem>
  <SelectItem value="manager">Manager</SelectItem>
  <SelectItem value="veterinarian">Veterinarian</SelectItem>
  <SelectItem value="vet_nurse">Vet Nurse</SelectItem>
  <SelectItem value="receptionist">Receptionist</SelectItem>
  <SelectItem value="groomer">Groomer</SelectItem>
</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Specialization</Label>
            <Input
              value={form.specialization}
              onChange={(e) => set('specialization', e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="col-span-full space-y-1.5">
            <Label>License Number</Label>
            <Input
              value={form.license_number}
              onChange={(e) => set('license_number', e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={toggleActive}
          disabled={deactivating}
          className={`rounded-xl border ${
            form.is_active
              ? 'border-red-200 text-red-600 hover:bg-red-50'
              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
          }`}
        >
          {deactivating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          {form.is_active ? 'Deactivate' : 'Reactivate'}
        </Button>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/staff')}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-xl border-0 shadow-md shadow-violet-100"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}