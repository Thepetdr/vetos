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
import { Loader2, Package } from 'lucide-react'

const categories = [
  'Medication', 'Vaccine', 'Surgical Supply',
  'Diagnostic', 'Food & Nutrition', 'Grooming Supply',
  'Consumable', 'Equipment', 'Other'
]

const units = ['tablet', 'capsule', 'ml', 'vial', 'bottle', 'box', 'bag', 'unit', 'pair', 'roll']

export default function AddInventoryForm() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '',
    category: '',
    sku: '',
    barcode: '',
    unit: 'unit',
    current_stock: '',
    min_stock_level: '',
    unit_cost: '',
    unit_price: '',
    supplier: '',
    expiry_date: '',
    storage_location: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: staffData } = await supabase
      .from('staff')
      .select('clinic_id, id')
      .eq('user_id', user?.id)
      .single()

    if (!staffData) { toast.error('Clinic not found'); setLoading(false); return }

    const stock = parseFloat(form.current_stock) || 0

    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert({
        clinic_id: staffData.clinic_id,
        name: form.name,
        category: form.category || null,
        sku: form.sku || null,
        barcode: form.barcode || null,
        unit: form.unit,
        current_stock: stock,
        min_stock_level: parseFloat(form.min_stock_level) || 5,
        unit_cost: parseFloat(form.unit_cost) || null,
        unit_price: parseFloat(form.unit_price) || null,
        supplier: form.supplier || null,
        expiry_date: form.expiry_date || null,
        storage_location: form.storage_location || null,
      })
      .select()
      .single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Log initial stock transaction
    if (stock > 0) {
      await supabase.from('inventory_transactions').insert({
        clinic_id: staffData.clinic_id,
        item_id: item.id,
        transaction_type: 'purchase',
        quantity: stock,
        stock_before: 0,
        stock_after: stock,
        notes: 'Initial stock entry',
        performed_by: staffData.id,
      })
    }

    toast.success(`${form.name} added to inventory!`)
    router.push('/inventory')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Item Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="col-span-full space-y-1.5">
            <Label>Item Name *</Label>
            <Input
              placeholder="e.g. Amoxicillin 250mg"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select onValueChange={v => set('category', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select defaultValue="unit" onValueChange={v => set('unit', v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {units.map(u => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>SKU</Label>
            <Input
              placeholder="Internal code"
              value={form.sku}
              onChange={e => set('sku', e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Barcode</Label>
            <Input
              placeholder="Barcode number"
              value={form.barcode}
              onChange={e => set('barcode', e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Stock Levels</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Current Stock *</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              value={form.current_stock}
              onChange={e => set('current_stock', e.target.value)}
              className="rounded-xl"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Minimum Level</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="5"
              value={form.min_stock_level}
              onChange={e => set('min_stock_level', e.target.value)}
              className="rounded-xl"
            />
            <p className="text-xs text-slate-400">Alert when stock drops below this</p>
          </div>
        </div>
      </div>

      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Pricing & Supplier</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Unit Cost (AED)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.unit_cost}
              onChange={e => set('unit_cost', e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Selling Price (AED)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.unit_price}
              onChange={e => set('unit_price', e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Supplier</Label>
            <Input
              placeholder="Supplier name"
              value={form.supplier}
              onChange={e => set('supplier', e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Expiry Date</Label>
            <Input
              type="date"
              value={form.expiry_date}
              onChange={e => set('expiry_date', e.target.value)}
              className="rounded-xl"
            />
          </div>

          <div className="col-span-full space-y-1.5">
            <Label>Storage Location</Label>
            <Input
              placeholder="e.g. Fridge Shelf 2, Cabinet A"
              value={form.storage_location}
              onChange={e => set('storage_location', e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push('/inventory')} className="rounded-xl">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl border-0 shadow-md shadow-rose-100"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><Package className="h-4 w-4 mr-2" />Add Item</>
          }
        </Button>
      </div>
    </form>
  )
}