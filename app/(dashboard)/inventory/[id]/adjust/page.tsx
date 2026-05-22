import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StockAdjustForm from '@/components/inventory/StockAdjustForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default async function AdjustStockPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: item } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single()

  if (!item) notFound()

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link href="/inventory" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="h-4 w-4" />
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Adjust Stock</h1>
        <p className="text-slate-500 text-sm mt-1">{item.name}</p>
      </div>
      <StockAdjustForm item={item} />
    </div>
  )
}