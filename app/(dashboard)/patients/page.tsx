import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PawPrint, Plus, Dog, Cat, Search, HeartPulse } from 'lucide-react'

const speciesIcon: Record<string, any> = {
  dog: Dog,
  cat: Cat,
}

export default async function PatientsPage() {
  const supabase = await createClient()

  const { data: patients } = await supabase
    .from('patients')
    .select(`
      *,
      clients ( id, full_name, phone )
    `)
    .eq('is_deceased', false)
    .order('created_at', { ascending: false })

  const totalPatients = patients?.length ?? 0
  const dogs = patients?.filter((p) => p.species === 'dog').length ?? 0
  const cats = patients?.filter((p) => p.species === 'cat').length ?? 0
  const other = totalPatients - dogs - cats

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
          <p className="text-slate-500 text-sm mt-1">{totalPatients} active patients</p>
        </div>
        <Link href="/patients/new">
          <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md shadow-rose-100 border-0">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card-premium p-4">
          <p className="text-xs text-slate-500 mb-2">Total Patients</p>
          <p className="text-2xl font-bold text-slate-800">{totalPatients}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-xs text-slate-500 mb-2">Dogs</p>
          <p className="text-2xl font-bold text-slate-800">{dogs}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-xs text-slate-500 mb-2">Cats</p>
          <p className="text-2xl font-bold text-slate-800">{cats}</p>
        </div>
        <div className="card-premium p-4">
          <p className="text-xs text-slate-500 mb-2">Other Species</p>
          <p className="text-2xl font-bold text-slate-800">{other}</p>
        </div>
      </div>

      {(!patients || patients.length === 0) ? (
        <div className="card-premium p-16 flex flex-col items-center justify-center text-center">
          <div className="bg-rose-50 p-4 rounded-2xl mb-4">
            <PawPrint className="h-8 w-8 text-rose-400" />
          </div>
          <h3 className="font-semibold text-slate-700 text-lg">No patients yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Create your first patient profile to begin</p>
          <Link href="/patients/new">
            <Button className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add First Patient
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {patients.map((patient: any) => {
            const SpeciesIcon = speciesIcon[patient.species] ?? PawPrint

            return (
              <Link key={patient.id} href={`/patients/${patient.id}`}>
                <div className="card-premium p-5 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                      <SpeciesIcon className="h-5 w-5 text-rose-500" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">
                          {patient.name}
                        </p>
                        <Badge variant="secondary" className="text-xs capitalize bg-slate-100 text-slate-600">
                          {patient.species}
                        </Badge>
                        {patient.gender && (
                          <Badge variant="secondary" className="text-xs capitalize bg-rose-50 text-rose-600">
                            {patient.gender}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-slate-500 mt-1">
                        {patient.breed || 'Breed not set'}
                        {patient.color ? ` · ${patient.color}` : ''}
                      </p>

                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-400">
                        {patient.date_of_birth && <span>DOB: {patient.date_of_birth}</span>}
                        {patient.weight_kg && <span>Weight: {patient.weight_kg} kg</span>}
                        {patient.microchip_number && <span>Microchip: {patient.microchip_number}</span>}
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs text-slate-400">Owner</p>
                          <p className="text-sm font-medium text-slate-700 truncate">
                            {patient.clients?.full_name || 'No client linked'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Phone</p>
                          <p className="text-sm text-slate-600">
                            {patient.clients?.phone || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}