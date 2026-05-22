import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Printer, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import InvoiceStatusUpdater from '@/components/billing/InvoiceStatusUpdater'

const statusConfig: Record<string, string> = {
  draft:           'bg-slate-100 text-slate-600',
  sent:            'bg-blue-100 text-blue-600',
  paid:            'bg-emerald-100 text-emerald-700',
  partially_paid:  'bg-amber-100 text-amber-700',
  overdue:         'bg-red-100 text-red-700',
  cancelled:       'bg-slate-100 text-slate-400',
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`*, clients(*), patients(name, species), invoice_items(*)`)
    .eq('id', id)
    .single()

  if (!invoice) notFound()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/billing" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        <ChevronLeft className="h-4 w-4" />
        Back to Billing
      </Link>

      {/* Invoice card */}
      <div className="card-premium overflow-hidden">
        {/* Invoice header */}
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 p-6 sm:p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-rose-100 text-sm font-medium">Invoice</p>
              <p className="text-white text-2xl font-bold mt-1">{invoice.invoice_number}</p>
              <p className="text-rose-100 text-sm mt-1">
                Issued: {format(new Date(invoice.issue_date), 'dd MMMM yyyy')}
              </p>
              {invoice.due_date && (
                <p className="text-rose-100 text-sm">
                  Due: {format(new Date(invoice.due_date), 'dd MMMM yyyy')}
                </p>
              )}
            </div>
            <Badge className={`${statusConfig[invoice.status]} border-0 text-xs capitalize`}>
              {invoice.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Client & Patient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
              <p className="font-semibold text-slate-800">{invoice.clients?.full_name}</p>
              <p className="text-slate-500 text-sm">{invoice.clients?.phone}</p>
              {invoice.clients?.email && (
                <p className="text-slate-500 text-sm">{invoice.clients.email}</p>
              )}
            </div>
            {invoice.patients && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Patient</p>
                <p className="font-semibold text-slate-800">{invoice.patients.name}</p>
                <p className="text-slate-500 text-sm capitalize">{invoice.patients.species}</p>
              </div>
            )}
          </div>

          {/* Line items */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Services</p>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="hidden sm:grid grid-cols-12 gap-4 px-4 py-2.5 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <span className="col-span-5">Description</span>
                <span className="col-span-2 text-center">Qty</span>
                <span className="col-span-2 text-right">Unit Price</span>
                <span className="col-span-1 text-center">VAT</span>
                <span className="col-span-2 text-right">Total</span>
              </div>
              <div className="divide-y divide-slate-100">
                {invoice.invoice_items?.map((item: any) => (
                  <div key={item.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 px-4 py-3 items-center">
                    <span className="col-span-2 sm:col-span-5 text-sm text-slate-700">{item.description}</span>
                    <span className="hidden sm:block sm:col-span-2 text-sm text-slate-500 text-center">{item.quantity}</span>
                    <span className="hidden sm:block sm:col-span-2 text-sm text-slate-500 text-right">AED {item.unit_price.toFixed(2)}</span>
                    <span className="hidden sm:block sm:col-span-1 text-sm text-slate-500 text-center">{item.tax_rate}%</span>
                    <span className="col-span-1 sm:col-span-2 text-sm font-medium text-slate-800 text-right">
                      AED {item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>AED {invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>VAT</span>
              <span>AED {invoice.tax_amount.toFixed(2)}</span>
            </div>
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>- AED {invoice.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-slate-800 text-base border-t border-slate-200 pt-2">
              <span>Total</span>
              <span>AED {invoice.total.toFixed(2)}</span>
            </div>
            {invoice.paid_amount > 0 && (
              <>
                <div className="flex justify-between text-emerald-600">
                  <span>Paid</span>
                  <span>AED {invoice.paid_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-600">
                  <span>Balance Due</span>
                  <span>AED {(invoice.total - invoice.paid_amount).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {invoice.notes && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-slate-600">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Status & Actions */}
      <div className="card-premium p-5 space-y-4">
        <p className="text-sm font-semibold text-slate-600">Update Status</p>
        <InvoiceStatusUpdater invoiceId={invoice.id} currentStatus={invoice.status} total={invoice.total} paidAmount={invoice.paid_amount} />
      </div>
    </div>
  )
}