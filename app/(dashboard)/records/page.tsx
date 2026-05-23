import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Plus, Stethoscope, FlaskConical, Pill } from 'lucide-react'
import { format } from 'date-fns'

const typeConfig: Record<string, { color: string; icon: any }> = {
  consultation:  { color: 'bg-blue-100 text-blue-700',    icon: Stethoscope },
  surgery:       { color: 'bg-purple-100 text-purple-700', icon: FileText },
  vaccination:   { color: 'bg-emerald-100 text-emerald-700', icon: Pill },
  follow_up:     { color: 'bg-amber-100 text-amber-700',  icon: FileText },
  emergency:     { color: 'bg-red-100 text-red-700',      icon: Stethoscope },
  dental:        { color: 'bg-cyan-100 text-cyan-700',    icon: FileText },
  lab:           { color: 'bg-rose-100 text-rose-700',    icon: FlaskConical },
  other:         { color: 'bg-slate-100 text-slate-600',  icon: FileText },
}

export default async function RecordsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
const { data: staffData } = await supabase
  .from('staff')
  .select('clinic_id')
  .eq('user_id', user?.id)
  .single()

const { data: records } = await supabase
  .from('soap_notes')
  .select(`
    *,
    patients ( id, name, species, breed ),
    clients ( id, full_name ),
    staff!soap_notes_vet_id_fkey ( full_name )
  `)
  .eq('clinic_id', staffData?.clinic_id)
  .order('visit_date', { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Medical Records</h1>
          <p className="text-slate-500 text-sm mt-1">{records?.length ?? 0} total records</p>
        </div>
        <Link href="/records/new">
          <Button className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md shadow-rose-100 border-0">
            <Plus className="h-4 w-4 mr-2" />
            New Record
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {(!records || records.length === 0) && (
        <div className="card-premium p-16 flex flex-col items-center justify-center text-center">
          <div className="bg-rose-50 p-4 rounded-2xl mb-4">
            <FileText className="h-8 w-8 text-rose-400" />
          </div>
          <h3 className="font-semibold text-slate-700 text-lg">No medical records yet</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Start documenting patient visits and SOAP notes</p>
          <Link href="/records/new">
            <Button className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl border-0">
              <Plus className="h-4 w-4 mr-2" />
              Create First Record
            </Button>
          </Link>
        </div>
      )}

      {/* Records list */}
      {records && records.length > 0 && (
        <div className="space-y-3">
          {records.map((record: any) => {
            const config = typeConfig[record.visit_type] ?? typeConfig.other
            const Icon = config.icon
            return (
              <Link key={record.id} href={`/records/${record.id}`}>
                <div className="card-premium p-4 sm:p-5 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl shrink-0 ${config.color.replace('text-', 'bg-').replace('700', '100').replace('600', '50')}`}>
                      <Icon className={`h-4 w-4 ${config.color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">
                          {record.patients?.name}
                        </p>
                        <span className="text-slate-300 text-xs">·</span>
                        <p className="text-sm text-slate-500 capitalize">{record.patients?.species}</p>
                        <Badge variant="secondary" className={`text-xs capitalize ${config.color}`}>
                          {record.visit_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        Owner: {record.clients?.full_name}
                        {record.staff?.full_name && ` · Dr. ${record.staff.full_name}`}
                      </p>
                      {record.chief_complaint && (
                        <p className="text-sm text-slate-600 mt-1.5 line-clamp-1">
                          <span className="text-slate-400 text-xs">CC: </span>
                          {record.chief_complaint}
                        </p>
                      )}
                      {record.assessment && (
                        <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                          <span className="text-slate-400 text-xs">Dx: </span>
                          {record.assessment}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-medium text-slate-600">
                        {format(new Date(record.visit_date), 'dd MMM yyyy')}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {format(new Date(record.visit_date), 'h:mm a')}
                      </p>
                      {record.follow_up_date && (
                        <p className="text-xs text-amber-600 mt-1">
                          Follow-up: {format(new Date(record.follow_up_date), 'dd MMM')}
                        </p>
                      )}
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