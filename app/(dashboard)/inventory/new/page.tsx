import AddInventoryForm from '@/components/inventory/AddInventoryForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewInventoryPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/inventory" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ChevronLeft className="h-4 w-4" />
          Back to Inventory
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Add Inventory Item</h1>
        <p className="text-slate-500 text-sm mt-1">Track a new medication, vaccine, or supply</p>
      </div>
      <AddInventoryForm />
    </div>
  )
}