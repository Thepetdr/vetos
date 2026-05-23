'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, Save, Upload, Building2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClinicProfileForm({ clinic, isAdmin }: { clinic: any; isAdmin: boolean }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    name:           clinic.name ?? '',
    name_ar:        clinic.name_ar ?? '',
    email:          clinic.email ?? '',
    phone:          clinic.phone ?? '',
    whatsapp:       clinic.whatsapp ?? '',
    address:        clinic.address ?? '',
    city:           clinic.city ?? 'Dubai',
    country:        clinic.country ?? 'UAE',
    license_number: clinic.license_number ?? '',
    logo_url:       clinic.logo_url ?? '',
  })

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }))
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `clinic-logos/${clinic.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('clinic-assets')
      .upload(path, file, { upsert: true })

    if (uploadError) { toast.error(uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage
      .from('clinic-assets')
      .getPublicUrl(path)

    set('logo_url', publicUrl)
    toast.success('Logo uploaded')
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAdmin) return
    setLoading(true)

    const { error } = await supabase
      .from('clinics')
      .update({
        name:           form.name,
        name_ar:        form.name_ar || null,
        email:          form.email || null,
        phone:          form.phone || null,
        whatsapp:       form.whatsapp || null,
        address:        form.address || null,
        city:           form.city || null,
        country:        form.country || null,
        license_number: form.license_number || null,
        logo_url:       form.logo_url || null,
      })
      .eq('id', clinic.id)

    if (error) { toast.error(error.message); setLoading(false); return }

    toast.success('Clinic profile updated')
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
          Only admins and managers can edit clinic settings.
        </div>
      )}

      {/* Logo */}
      <div className="card-premium p-5 sm:p-6">
        <h2 className="font-semibold text-slate-700 mb-4">Clinic Logo</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-8 w-8 text-slate-300" />
            )}
          </div>
          <div className="space-y-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
              disabled={!isAdmin}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => fileRef.current?.click()}
              disabled={uploading || !isAdmin}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </Button>
            {form.logo_url && isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-xl text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
                onClick={() => set('logo_url', '')}
              >
                <X className="h-3.5 w-3.5" />
                Remove
              </Button>
            )}
            <p className="text-xs text-slate-400">PNG, JPG up to 2MB. Recommended 256×256px.</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card-premium p-5 sm:p-6 space-y-4">
        <h2 className="font-semibold text-slate-700">Basic Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Clinic Name (English) *</Label>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="rounded-xl"
              required
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Clinic Name (Arabic)</Label>
            <Input
              value={form.name_ar}
              onChange={(e) => set('name_ar', e.target.value)}
              className="rounded-xl text-right"
              dir="rtl"
              placeholder="اسم العيادة"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              className="rounded-xl"
              placeholder="clinic@example.com"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="rounded-xl"
              placeholder="+971 4 000 0000"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp Number</Label>
            <Input
              value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              className="rounded-xl"
              placeholder="+971 50 000 0000"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1.5">
            <Label>License Number</Label>
            <Input
              value={form.license_number}
              onChange={(e) => set('license_number', e.target.value)}
              className="rounded-xl"
              placeholder="DHA-VET-XXXXX"
              disabled={!isAdmin}
            />
          </div>
          <div className="col-span-full space-y-1.5">
            <Label>Address</Label>
            <Textarea
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              className="rounded-xl"
              rows={2}
              placeholder="Street, Building, Area"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              className="rounded-xl"
              disabled={!isAdmin}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Country</Label>
            <Input
              value={form.country}
              onChange={(e) => set('country', e.target.value)}
              className="rounded-xl"
              disabled={!isAdmin}
            />
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white rounded-xl border-0 shadow-md shadow-violet-100"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      )}
    </form>
  )
}