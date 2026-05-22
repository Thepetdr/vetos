import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Receipt, Plus, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

const statusConfig: Record<string, { color: string; icon: any }> = {
  draft:           { color: 'bg-slate-100 text-slate-600',   icon: Clock },
  sent:            { color: 'bg-blue-100 text-blue-600',     icon: Clock },
  paid:            { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  partially_paid:  { color: 'bg-amber-100 text-amber-700',   icon: AlertCircle },
  overdue:         { color: 'bg-red-100 text-red-700',       icon: AlertCircle },
  cancelled:       { color: 'bg-slate-100 text-slate-400',   icon: AlertCircle },
}

export default async function BillingPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`*, clients(full_name, phone), patients(name, species)`)
    .order('created_at', { ascending: false })

  const totalRevenue = invoices
    ?.filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + (i.paid_amount ?? 0), 0) ?? 0

  const totalPending = invoices
    ?.filter(i => ['sent', 'partially_paid', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + (i.total - i.paid_amount), 0) ?? 0

  const totalDraft = invoices?.filter(i => i.status === 'draft').length ?? 0
  const totalOverdue = invoices?.filter(i => i.status === 'overdue').length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Billing</h1>
          <p className="text-slate-500 text-sm mt-1">{invoices?.length ?? 0} total invoices</p>
        </div>
        <Link href="/billing/new">
          <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md shadow-rose-100 border-0">
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-premium p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-emerald-50 p-2 rounded-xl">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-xs text-slate-500">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            AED {totalRevenue.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-50 p-2 rounded-xl">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <span className="text-xs text-slate-500">Outstanding</span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            AED {totalPending.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-slate-50 p-2 rounded-xl">
              <Receipt className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <span className="text-xs text-slate-500">Drafts</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{totalDraft}</p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-red-50 p-2 rounded-xl">
              <AlertCircle className="h-3.5 w-3.5 text-red-500" />
            </div>
            <span className="text-xs text-slate-500">Overdue</span>
          </div>
          <p className="text-xl font-bold text-slate-800">{totalOverdue}</p>
        </div>
      </div>

      {/* Invoice list */}
      {(!invoices || invoices.length === 0) ? (
        <div className="card-premium p-16 flex flex-col items-center justify-center text-center">
          <div className="bg-rose-50 p-4 rounded-2xl mb-4">
            <Receipt className="h-8 w-8 text-rose-400" />
          </div>
          <h3 className="font-semibold text-slate-700 text-lg">No invoices yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Create your first invoice to start tracking revenue</p>
          <Link href="/billing/new">
            <Button className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl border-0">
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </Link>
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
            <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Invoice</span>
            <span className="col-span-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Client</span>
            <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Patient</span>
            <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</span>
            <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Amount</span>
            <span className="col-span-1 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Status</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {invoices.map((inv: any) => {
              const config = statusConfig[inv.status] ?? statusConfig.draft
              const StatusIcon = config.icon
              return (
                <Link key={inv.id} href={`/billing/${inv.id}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 hover:bg-rose-50/30 transition-colors cursor-pointer items-center">
                    <div className="col-span-1 sm:col-span-2">
                      <p className="text-sm font-semibold text-rose-600">{inv.invoice_number}</p>
                    </div>
                    <div className="col-span-1 sm:col-span-3">
                      <p className="text-sm font-medium text-slate-700 truncate">{inv.clients?.full_name}</p>
                      <p className="text-xs text-slate-400 sm:hidden">{inv.patients?.name}</p>
                    </div>
                    <div className="hidden sm:block sm:col-span-2">
                      <p className="text-sm text-slate-600">{inv.patients?.name ?? '—'}</p>
                    </div>
                    <div className="hidden sm:block sm:col-span-2">
                      <p className="text-sm text-slate-500">
                        {format(new Date(inv.issue_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div className="col-span-1 sm:col-span-2 text-right">
                      <p className="text-sm font-bold text-slate-800">
                        AED {inv.total.toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                      </p>
                      {inv.paid_amount > 0 && inv.paid_amount < inv.total && (
                        <p className="text-xs text-slate-400">
                          Paid: AED {inv.paid_amount.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <div className="col-span-1 sm:col-span-1 flex justify-end">
                      <Badge variant="secondary" className={`text-xs capitalize ${config.color} flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        <span className="hidden sm:inline">{inv.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}