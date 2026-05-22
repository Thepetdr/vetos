import AddClientForm from '@/components/clients/AddClientForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function NewClientPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href="/clients"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Add New Client</h1>
        <p className="text-slate-500 text-sm mt-1">Register a new pet owner</p>
      </div>
      <AddClientForm />
    </div>
  )
}