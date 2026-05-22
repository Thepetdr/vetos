import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Package, Plus, AlertTriangle, TrendingDown, Archive, Activity } from 'lucide-react'

export default async function InventoryPage() {
  const supabase = await createClient()

  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('is_active', true)
    .order('name')

  const totalItems = items?.length ?? 0
  const lowStock = items?.filter(i => i.current_stock <= i.min_stock_level) ?? []
  const outOfStock = items?.filter(i => i.current_stock === 0) ?? []
  const totalValue = items?.reduce((sum, i) => sum + (i.current_stock * (i.unit_cost ?? 0)), 0) ?? 0

  const categoryMap: Record<string, any[]> = {}
  items?.forEach(item => {
    const cat = item.category ?? 'Uncategorized'
    if (!categoryMap[cat]) categoryMap[cat] = []
    categoryMap[cat].push(item)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory</h1>
          <p className="text-slate-500 text-sm mt-1">{totalItems} items tracked</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory/new">
            <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md shadow-rose-100 border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-premium p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-50 p-2 rounded-xl">
              <Archive className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <span className="text-xs text-slate-500">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{totalItems}</p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-amber-50 p-2 rounded-xl">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <span className="text-xs text-slate-500">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{lowStock.length}</p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-red-50 p-2 rounded-xl">
              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
            </div>
            <span className="text-xs text-slate-500">Out of Stock</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{outOfStock.length}</p>
        </div>
        <div className="card-premium p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-emerald-50 p-2 rounded-xl">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <span className="text-xs text-slate-500">Stock Value</span>
          </div>
          <p className="text-xl font-bold text-slate-800">
            AED {totalValue.toLocaleString('en-AE', { minimumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Low stock alert banner */}
      {lowStock.length > 0 && (
        <div className="card-premium p-4 border border-amber-100 bg-amber-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {lowStock.length} item{lowStock.length > 1 ? 's' : ''} running low
              </p>
              <p className="text-xs text-amber-600 truncate">
                {lowStock.map(i => i.name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {totalItems === 0 && (
        <div className="card-premium p-16 flex flex-col items-center justify-center text-center">
          <div className="bg-rose-50 p-4 rounded-2xl mb-4">
            <Package className="h-8 w-8 text-rose-400" />
          </div>
          <h3 className="font-semibold text-slate-700 text-lg">No inventory items</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Start tracking medications, vaccines and supplies</p>
          <Link href="/inventory/new">
            <Button className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          </Link>
        </div>
      )}

      {/* Items grouped by category */}
      {Object.entries(categoryMap).map(([category, categoryItems]) => (
        <div key={category} className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
              {category}
            </h2>
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">{categoryItems.length} items</span>
          </div>

          <div className="card-premium overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <span className="col-span-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Item</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Stock</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Min Level</span>
              <span className="col-span-2 text-xs font-semibold text-slate-400 uppercase tracking-wide text-right">Unit Cost</span>
              <span className="col-span-1 text-xs font-semibold text-slate-400 uppercase tracking-wide text-center">Status</span>
              <span className="col-span-1" />
            </div>

            <div className="divide-y divide-slate-100">
  {categoryItems.map((item: any) => {
    const isLow = item.current_stock <= item.min_stock_level && item.current_stock > 0
    const isOut = item.current_stock === 0
    const stockPct = item.min_stock_level > 0
      ? Math.min((item.current_stock / (item.min_stock_level * 3)) * 100, 100)
      : 100

    return (
      <div key={item.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 sm:gap-4 px-5 py-4 items-center">
        {/* Name — clickable */}
        <div className="col-span-2 sm:col-span-4">
          <Link href={`/inventory/${item.id}`} className="group">
            <p className="text-sm font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">{item.name}</p>
            {item.sku && <p className="text-xs text-slate-400">SKU: {item.sku}</p>}
            {item.expiry_date && (
              <p className="text-xs text-slate-400">
                Exp: {new Date(item.expiry_date).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </Link>
        </div>

        {/* Stock with progress bar */}
        <div className="hidden sm:block sm:col-span-2 text-center">
          <p className={`text-sm font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-slate-700'}`}>
            {item.current_stock} {item.unit}
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${isOut ? 'bg-red-400' : isLow ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${stockPct}%` }}
            />
          </div>
        </div>

        <div className="hidden sm:block sm:col-span-2 text-center">
          <p className="text-sm text-slate-500">{item.min_stock_level} {item.unit}</p>
        </div>

        <div className="hidden sm:block sm:col-span-2 text-right">
          <p className="text-sm text-slate-600">
            {item.unit_cost ? `AED ${item.unit_cost.toFixed(2)}` : '—'}
          </p>
        </div>

        <div className="col-span-1 sm:col-span-1 flex justify-center">
          {isOut ? (
            <Badge variant="secondary" className="text-xs bg-red-100 text-red-700">Out</Badge>
          ) : isLow ? (
            <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">Low</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">OK</Badge>
          )}
        </div>

        <div className="col-span-1 sm:col-span-1 flex justify-end">
          <Link
            href={`/inventory/${item.id}/adjust`}
            className="text-xs px-2 py-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors font-medium"
          >
            Adjust
          </Link>
        </div>
      </div>
    )
  })}
</div>
          </div>
        </div>
      ))}
    </div>
  )
}