'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, CheckCircle } from 'lucide-react'

const statuses = [
  { value: 'draft',          label: 'Draft',          color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'sent',           label: 'Sent',           color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: 'paid',           label: 'Paid',           color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'partially_paid', label: 'Partial',        color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'overdue',        label: 'Overdue',        color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'cancelled',      label: 'Cancelled',      color: 'bg-slate-100 text-slate-400 border-slate-200' },
]

interface Props {
  invoiceId: string
  currentStatus: string
  total: number
  paidAmount: number
}

export default function InvoiceStatusUpdater({ invoiceId, currentStatus, total, paidAmount }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(currentStatus)
  const [partialAmount, setPartialAmount] = useState(paidAmount.toString())
  const [showPartial, setShowPartial] = useState(currentStatus === 'partially_paid')

  async function updateStatus(newStatus: string) {
    if (newStatus === active) return
    setShowPartial(newStatus === 'partially_paid')
    if (newStatus === 'partially_paid') return // wait for amount input
    setLoading(true)

    const updateData: any = { status: newStatus }
    if (newStatus === 'paid') updateData.paid_amount = total

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId)

    if (error) {
      toast.error(error.message)
    } else {
      setActive(newStatus)
      toast.success(`Invoice marked as ${newStatus.replace('_', ' ')}`)
      router.refresh()
    }
    setLoading(false)
  }

  async function handlePartialSave() {
    const amount = parseFloat(partialAmount)
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return }
    setLoading(true)

    const { error } = await supabase
      .from('invoices')
      .update({ status: 'partially_paid', paid_amount: amount })
      .eq('id', invoiceId)

    if (error) {
      toast.error(error.message)
    } else {
      setActive('partially_paid')
      setShowPartial(false)
      toast.success('Partial payment recorded')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        {statuses.map(s => (
          <button
            key={s.value}
            onClick={() => updateStatus(s.value)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${s.color} ${
              active === s.value
                ? 'ring-2 ring-offset-1 ring-current opacity-100'
                : 'opacity-50 hover:opacity-80'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {showPartial && (
        <div className="flex items-end gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs text-amber-700">Amount Paid (AED)</Label>
            <Input
              type="number"
              min="0"
              max={total}
              step="0.01"
              value={partialAmount}
              onChange={e => setPartialAmount(e.target.value)}
              className="rounded-xl"
              placeholder="0.00"
            />
          </div>
          <Button
            onClick={handlePartialSave}
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl border-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1" /> Save</>}
          </Button>
        </div>
      )}
    </div>
  )
}