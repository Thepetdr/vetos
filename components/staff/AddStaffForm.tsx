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
import { Loader2, Users } from 'lucide-react'

export default function AddStaffForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    full_name_ar: '',
    email: '',
    phone: '',
    role: '',
    specialization: '',
    license_number: '',
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
      toast.error('Could not find clinic')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('staff').insert({
      clinic_id: staffData.clinic_id,
      full_name: form.full_name,
      full_name_ar: form.full_name_ar || null,
      email: form.email,
      phone: form.phone || null,
      role: form.role,
      specialization: form.specialization || null,
      license_number: form.license_number || null,
      is_active: true,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success(`${form.full_name} added to staff`)
    router.push('/staff')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card-premium p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
            <Users className="h-5 w-5 text-violet-500" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">Staff Details</h2>
            <p className="text-sm text-slate-400">Personal and professional information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full Name (English) *</Label>
            <Input
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              className="rounded-xl"
              placeholder="e.g. Dr. Sarah Ahmed"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Full Name (Arabic)</Label>
            <Input
              value={form.full_name_ar}
              onChange={(e) => set('full_name_ar', e.target.value)}
              className="rounded-xl text-right"
              placeholder="الاسم بالعربي"
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
              placeholder="email@clinic.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="rounded-xl"
              placeholder="+971 50 000 0000"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select onValueChange={(v) => set('role', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select role" />
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
              placeholder="e.g. Surgery, Dermatology"
            />
          </div>

          <div className="col-span-full space-y-1.5">
            <Label>License Number</Label>
            <Input
              value={form.license_number}
              onChange={(e) => set('license_number', e.target.value)}
              className="rounded-xl"
              placeholder="Veterinary license number"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
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
            <Users className="mr-2 h-4 w-4" />
          )}
          Add Staff Member
        </Button>
      </div>
    </form>
  )
}