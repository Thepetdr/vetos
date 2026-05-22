import { createClient } from '@/lib/supabase/server'
import CreateInvoiceForm from '@/components/billing/CreateInvoiceForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function NewInvoicePage() {
  const supabase = await createClient()

  const [{ data: clients }, { data: services }, { data: patients }] = await Promise.all([
    supabase.from('clients').select('id, full_name, phone').order('full_name'),
    supabase.from('services').select('*').eq('is_active', true).order('name'),
    supabase.from('patients').select('id, name, species, client_id').eq('is_deceased', false).order('name'),
  ])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/billing"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Billing
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">New Invoice</h1>
        <p className="text-slate-500 text-sm mt-1">Create a new invoice for a client</p>
      </div>
      <CreateInvoiceForm
        clients={clients ?? []}
        services={services ?? []}
        patients={patients ?? []}
      />
    </div>
  )
}