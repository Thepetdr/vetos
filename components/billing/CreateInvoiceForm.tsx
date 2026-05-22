'use client'

import { useState, useCallback } from 'react'
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
import { Loader2, Plus, Trash2, Receipt } from 'lucide-react'

interface LineItem {
  id: string
  service_id: string
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
}

interface Props {
  clients: any[]
  services: any[]
  patients: any[]
}

function generateId() {
  return Math.random().toString(36).slice(2)
}

export default function CreateInvoiceForm({ clients, services, patients }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [notes, setNotes] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [discount, setDiscount] = useState(0)

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: generateId(), service_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 5 }
  ])

  const clientPatients = patients.filter(p => p.client_id === selectedClientId)

  function addLineItem() {
    setLineItems(prev => [
      ...prev,
      { id: generateId(), service_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 5 }
    ])
  }

  function removeLineItem(id: string) {
    if (lineItems.length === 1) return
    setLineItems(prev => prev.filter(item => item.id !== id))
  }

  function updateLineItem(id: string, field: keyof LineItem, value: any) {
    setLineItems(prev => prev.map(item => {
      if (item.id !== id) return item
      if (field === 'service_id' && value) {
        const svc = services.find(s => s.id === value)
        if (svc) {
          return { ...item, service_id: value, description: svc.name, unit_price: svc.price, tax_rate: svc.tax_rate ?? 5 }
        }
      }
      return { ...item, [field]: value }
    }))
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
  const taxAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price * item.tax_rate / 100), 0)
  const total = subtotal + taxAmount - discount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!selectedClientId) { toast.error('Please select a client'); return }
    if (lineItems.some(i => !i.description)) { toast.error('All line items need a description'); return }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: staffData } = await supabase
      .from('staff')
      .select('clinic_id, id')
      .eq('user_id', user?.id)
      .single()

    if (!staffData) { toast.error('Clinic not found'); setLoading(false); return }

    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', staffData.clinic_id)

    const invoiceNumber = `INV-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(4, '0')}`

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        clinic_id: staffData.clinic_id,
        client_id: selectedClientId,
        patient_id: selectedPatientId || null,
        invoice_number: invoiceNumber,
        status: 'draft',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: dueDate || null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discount,
        total,
        paid_amount: 0,
        notes: notes || null,
        created_by: staffData.id,
      })
      .select()
      .single()

    if (invoiceError) { toast.error(invoiceError.message); setLoading(false); return }

    // Create line items
    const { error: itemsError } = await supabase.from('invoice_items').insert(
      lineItems.map(item => ({
        invoice_id: invoice.id,
        service_id: item.service_id || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        total: item.quantity * item.unit_price * (1 + item.tax_rate / 100),
      }))
    )

    if (itemsError) { toast.error(itemsError.message); setLoading(false); return }

    toast.success(`Invoice ${invoiceNumber} created!`)
    router.push(`/billing/${invoice.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Client & Patient */}
      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Client & Patient</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Client *</Label>
            <Select onValueChange={(v) => { setSelectedClientId(v); setSelectedPatientId('') }} required>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Patient</Label>
            <Select
              onValueChange={setSelectedPatientId}
              disabled={!selectedClientId || clientPatients.length === 0}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={!selectedClientId ? 'Select client first' : 'Select patient'} />
              </SelectTrigger>
              <SelectContent>
                {clientPatients.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="card-premium p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-700">Services & Items</h2>
          <Button type="button" variant="outline" size="sm" onClick={addLineItem} className="rounded-xl">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Item
          </Button>
        </div>

        {/* Header row — desktop only */}
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide px-1">
          <span className="col-span-4">Description</span>
          <span className="col-span-2">From Catalog</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-2 text-right">Unit Price</span>
          <span className="col-span-1 text-center">VAT%</span>
          <span className="col-span-1" />
        </div>

        <div className="space-y-3">
          {lineItems.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-start sm:items-center">
              {/* Description */}
              <div className="col-span-2 sm:col-span-4">
                <Input
                  placeholder="Service description"
                  value={item.description}
                  onChange={e => updateLineItem(item.id, 'description', e.target.value)}
                  className="rounded-xl text-sm"
                  required
                />
              </div>
              {/* Service catalog */}
              <div className="col-span-2 sm:col-span-2">
                <Select onValueChange={v => updateLineItem(item.id, 'service_id', v)}>
                  <SelectTrigger className="rounded-xl text-xs">
                    <SelectValue placeholder="Catalog" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — AED {s.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Qty */}
              <div className="col-span-1 sm:col-span-2">
                <Input
                  type="number"
                  min="1"
                  step="0.5"
                  value={item.quantity}
                  onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value))}
                  className="rounded-xl text-sm text-center"
                />
              </div>
              {/* Unit price */}
              <div className="col-span-1 sm:col-span-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={e => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value))}
                  className="rounded-xl text-sm text-right"
                />
              </div>
              {/* VAT */}
              <div className="col-span-1 sm:col-span-1">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={item.tax_rate}
                  onChange={e => updateLineItem(item.id, 'tax_rate', parseFloat(e.target.value))}
                  className="rounded-xl text-sm text-center"
                />
              </div>
              {/* Delete */}
              <div className="col-span-1 sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeLineItem(item.id)}
                  disabled={lineItems.length === 1}
                  className="p-2 text-slate-300 hover:text-red-400 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="card-premium p-5">
        <div className="max-w-xs ml-auto space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>AED {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>VAT (5%)</span>
            <span>AED {taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Discount</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={discount}
              onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-28 rounded-xl text-sm text-right h-8"
            />
          </div>
          <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-200 pt-2 mt-2">
            <span>Total</span>
            <span>AED {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card-premium p-5 space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Payment terms, thank you message..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="rounded-xl"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => router.push('/billing')} className="rounded-xl">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl border-0 shadow-md shadow-rose-100"
        >
          {loading
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <><Receipt className="h-4 w-4 mr-2" />Create Invoice</>
          }
        </Button>
      </div>
    </form>
  )
}