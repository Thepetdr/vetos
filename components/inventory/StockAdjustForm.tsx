'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Plus, Minus, RefreshCw } from 'lucide-react'

interface Props { item: any }

const txTypes = [
  { value: 'purchase',   label: 'Purchase / Restock', icon: Plus,      color: 'text-emerald-600' },
  { value: 'usage',      label: 'Usage / Dispensed',  icon: Minus,     color: 'text-blue-600' },
  { value: 'adjustment', label: 'Manual Adjustment',  icon: RefreshCw, color: 'text-amber-600' },
  { value: 'expired',    label: 'Expired / Wasted',   icon: Minus,     color: 'text-red-600' },
  { value: 'returned',   label: 'Returned to Supplier', icon: Plus,    color: 'text-slate-600' },
]

export default function StockAdjustForm({ item }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [txType, setTxType] = useState('purchase')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')

  const isDeduction = ['usage', 'expired'].includes(txType)
  const previewStock = quantity
    ? isDeduction
      ? item.current_stock - parseFloat(quantity)
      : item.current_stock + parseFloat(quantity)
    : item.current_stock

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const qty = parseFloat(quantity)
    if (!qty || qty <= 0) { toast.error('Enter a valid quantity'); return }
    if (isDeduction && qty > item.current_stock) {
      toast.error(`Cannot deduct more than current stock (${item.current_stock})`)
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: staffData } = await supabase
      .from('staff')
      .select('clinic_id, id')
      .eq('user_id', user?.id)
      .single()

    if (!staffData) { toast.error('Clinic not found'); setLoading(false); return }

    const finalQty = isDeduction ? -qty : qty
    const newStock = item.current_stock + finalQty

    // Update stock
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({ current_stock: newStock })
      .eq('id', item.id)

    if (updateError) { toast.error(updateError.message); setLoading(false); return }

    // Log transaction
    await supabase.from('inventory_transactions').insert({
      clinic_id: staffData.clinic_id,
      item_id: item.id,
      transaction_type: txType,
      quantity: finalQty,
      stock_before: item.current_stock,
      stock_after: newStock,
      notes: notes || null,
      performed_by: staffData.id,
    })

    toast.success('Stock updated successfully')
    router.push('/inventory')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Current stock display */}
      <div className="card-premium p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Current Stock</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">
              {item.current_stock} <span className="text-lg text-slate-400 font-normal">{item.unit}</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Min level: {item.min_stock_level} {item.unit}</p>
          </div>
          {previewStock !== item.current_stock && (
            <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">After Adjustment</p>
              <p className={`text-3xl font-bold mt-1 ${previewStock < item.min_stock_level ? 'text-red-600' : 'text-emerald-600'}`}>
                {previewStock.toFixed(1)} <span className="text-lg font-normal">{item.unit}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="card-premium p-5 space-y-4">
        <h2 className="font-semibold text-slate-700">Adjustment Details</h2>

        <div className="space-y-1.5">
          <Label>Transaction Type *</Label>
          <div className="grid grid-cols-1 gap-2">
            {txTypes.map(tx => {
              const Icon = tx.icon
              return (
                <button
                  key={tx.value}
                  type="button"
                  onClick={() => setTxType(tx.value)}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    txType === tx.value
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${txType === tx.value ? 'bg-rose-100' : 'bg-slate-100'}`}>
                    <Icon className={`h-3.5 w-3.5 ${txType === tx.value ? 'text-rose-600' : tx.color}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{tx.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Quantity *</Label>
          <Input
            type="number"
            min="0.5"
            step="0.5"
            placeholder="Enter quantity"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="rounded-xl"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Input
            placeholder="Reason for adjustment, batch number, etc."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="rounded-xl"
          />
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Adjustment'}
        </Button>
      </div>
    </form>
  )
}