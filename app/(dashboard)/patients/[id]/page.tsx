import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, PawPrint, Dog, Cat, Bird, Calendar, FileText,
  Syringe, Pill, Receipt, Weight, Thermometer, Heart, Wind,
  Phone, Mail, MapPin, Pencil, AlertTriangle, CheckCircle2,
  Clock, User, Stethoscope, ShieldCheck
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const speciesIcon: Record<string, any> = { dog: Dog, cat: Cat, bird: Bird }

function calcAge(dob: string | null) {
  if (!dob) return null
  const diff = Date.now() - new Date(dob).getTime()
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  const months = Math.floor((diff / (1000 * 60 * 60 * 24 * 30.44)) % 12)
  if (years === 0) return `${months}mo`
  if (months === 0) return `${years}yr`
  return `${years}yr ${months}mo`
}

function sexLabel(sex: string | null) {
  const map: Record<string, string> = {
    male: 'Male', female: 'Female',
    male_neutered: 'Male (Neutered)',
    female_spayed: 'Female (Spayed)',
    unknown: 'Unknown',
  }
  return sex ? (map[sex] ?? sex) : '—'
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-red-50 text-red-600',
    no_show: 'bg-slate-100 text-slate-500',
    in_progress: 'bg-amber-50 text-amber-700',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}

function invoiceStatusBadge(status: string) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-50 text-emerald-700',
    draft: 'bg-slate-100 text-slate-500',
    sent: 'bg-blue-50 text-blue-700',
    overdue: 'bg-red-50 text-red-600',
    cancelled: 'bg-slate-100 text-slate-400',
  }
  return map[status] ?? 'bg-slate-100 text-slate-600'
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: patient } = await supabase
    .from('patients')
    .select('*, clients(id, full_name, email, phone, address)')
    .eq('id', id)
    .single()

  if (!patient) notFound()

  const [
    { data: soapNotes },
    { data: appointments },
    { data: vaccinations },
    { data: prescriptions },
    { data: invoices },
  ] = await Promise.all([
    supabase
      .from('soap_notes')
      .select('*, staff(full_name, role)')
      .eq('patient_id', id)
      .order('visit_date', { ascending: false }),
    supabase
      .from('appointments')
      .select('*, staff(full_name)')
      .eq('patient_id', id)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('vaccinations')
      .select('*, staff(full_name)')
      .eq('patient_id', id)
      .order('administered_date', { ascending: false }),
    supabase
      .from('prescriptions')
      .select('*, staff(full_name)')
      .eq('patient_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('*')
      .eq('patient_id', id)
      .order('created_at', { ascending: false }),
  ])

  const SpeciesIcon = speciesIcon[patient.species] ?? PawPrint
  const age = calcAge(patient.date_of_birth)
  const lastSoap = soapNotes?.[0]
  const activePrescriptions = prescriptions?.filter((p) => p.is_active) ?? []
  const upcomingVaccines = vaccinations?.filter(
    (v) => v.next_due_date && new Date(v.next_due_date) >= new Date()
  ) ?? []
  const overdueVaccines = vaccinations?.filter(
    (v) => v.next_due_date && new Date(v.next_due_date) < new Date()
  ) ?? []
  const totalBilled = invoices?.reduce((sum, inv) => sum + Number(inv.total ?? 0), 0) ?? 0
  const totalPaid = invoices?.reduce((sum, inv) => sum + Number(inv.paid_amount ?? 0), 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/patients"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Patients
        </Link>

        <div className="card-premium p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-5">
            {/* Avatar */}
            <div className="shrink-0">
              {patient.photo_url ? (
                <img
                  src={patient.photo_url}
                  alt={patient.name}
                  className="w-24 h-24 rounded-3xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-100 to-rose-200 flex items-center justify-center">
                  <SpeciesIcon className="h-10 w-10 text-rose-500" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-800">{patient.name}</h1>
                    {patient.is_deceased && (
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">Deceased</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium capitalize">
                      {patient.species}
                    </span>
                    {patient.breed && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                        {patient.breed}
                      </span>
                    )}
                    {patient.sex && (
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                        {sexLabel(patient.sex)}
                      </span>
                    )}
                    {age && (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                        {age} old
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/patients/${id}/edit`}>
                  <Button variant="outline" size="sm" className="rounded-xl">
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
                {[
                  { label: 'Weight', value: patient.weight_kg ? `${patient.weight_kg} kg` : '—', icon: Weight },
                  { label: 'Color', value: patient.color || '—', icon: PawPrint },
                  { label: 'Microchip', value: patient.microchip_number || '—', icon: ShieldCheck },
                  { label: 'DOB', value: patient.date_of_birth || '—', icon: Calendar },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label}>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                        <Icon className="h-3.5 w-3.5" />
                        {item.label}
                      </div>
                      <p className="text-sm font-medium text-slate-700 truncate">{item.value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts row */}
      {(overdueVaccines.length > 0 || activePrescriptions.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {overdueVaccines.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-50 border border-red-100">
              <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700">{overdueVaccines.length} Overdue Vaccine{overdueVaccines.length > 1 ? 's' : ''}</p>
                <p className="text-xs text-red-500">{overdueVaccines.map(v => v.vaccine_name).join(', ')}</p>
              </div>
            </div>
          )}
          {activePrescriptions.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
              <Pill className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-700">{activePrescriptions.length} Active Prescription{activePrescriptions.length > 1 ? 's' : ''}</p>
                <p className="text-xs text-amber-600">{activePrescriptions.map(p => p.medication_name).join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Visits', value: soapNotes?.length ?? 0, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
          { label: 'Vaccinations', value: vaccinations?.length ?? 0, icon: Syringe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Prescriptions', value: prescriptions?.length ?? 0, icon: Pill, color: 'text-violet-500', bg: 'bg-violet-50' },
          { label: 'Total Billed', value: `AED ${totalBilled.toFixed(0)}`, icon: Receipt, color: 'text-rose-500', bg: 'bg-rose-50' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card-premium p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT: Owner + Last Vitals */}
        <div className="space-y-4">
          {/* Owner */}
          <div className="card-premium p-5 space-y-4">
            <h2 className="font-semibold text-slate-700 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" /> Owner
            </h2>
            {patient.clients ? (
              <div className="space-y-3">
                <Link href={`/clients/${patient.clients.id}`}>
                  <p className="font-semibold text-slate-800 hover:text-rose-600 transition-colors">
                    {patient.clients.full_name}
                  </p>
                </Link>
                {patient.clients.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Phone className="h-3.5 w-3.5" />
                    {patient.clients.phone}
                  </div>
                )}
                {patient.clients.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail className="h-3.5 w-3.5" />
                    {patient.clients.email}
                  </div>
                )}
                {patient.clients.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {patient.clients.address}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No owner linked</p>
            )}
          </div>

          {/* Last Vitals */}
          {lastSoap && (
            <div className="card-premium p-5 space-y-4">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-slate-400" /> Last Vitals
                <span className="ml-auto text-xs text-slate-400 font-normal">{lastSoap.visit_date}</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Weight', value: lastSoap.weight_kg ? `${lastSoap.weight_kg} kg` : null, icon: Weight, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { label: 'Temp', value: lastSoap.temperature_c ? `${lastSoap.temperature_c}°C` : null, icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-50' },
                  { label: 'Heart Rate', value: lastSoap.heart_rate_bpm ? `${lastSoap.heart_rate_bpm} bpm` : null, icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
                  { label: 'Resp. Rate', value: lastSoap.respiratory_rate ? `${lastSoap.respiratory_rate} /min` : null, icon: Wind, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                ].map((v) => v.value ? (
                  <div key={v.label} className={`${v.bg} rounded-xl p-3`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <v.icon className={`h-3.5 w-3.5 ${v.color}`} />
                      <span className="text-xs text-slate-500">{v.label}</span>
                    </div>
                    <p className="font-semibold text-slate-800 text-sm">{v.value}</p>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Insurance */}
          {(patient.insurance_provider || patient.insurance_policy) && (
            <div className="card-premium p-5 space-y-3">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" /> Insurance
              </h2>
              {patient.insurance_provider && (
                <div>
                  <p className="text-xs text-slate-400">Provider</p>
                  <p className="text-sm font-medium text-slate-700">{patient.insurance_provider}</p>
                </div>
              )}
              {patient.insurance_policy && (
                <div>
                  <p className="text-xs text-slate-400">Policy Number</p>
                  <p className="text-sm font-medium text-slate-700">{patient.insurance_policy}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {patient.notes && (
            <div className="card-premium p-5 space-y-2">
              <h2 className="font-semibold text-slate-700">Notes</h2>
              <p className="text-sm text-slate-500 leading-relaxed">{patient.notes}</p>
            </div>
          )}
        </div>

        {/* RIGHT: Records, Vaccinations, Prescriptions, Billing */}
        <div className="lg:col-span-2 space-y-5">

          {/* SOAP Records */}
          <div className="card-premium overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Medical Records
                <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-lg font-medium">
                  {soapNotes?.length ?? 0}
                </span>
              </h2>
              <Link href={`/records/new?patient_id=${id}`}>
                <Button size="sm" className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white border-0">
                  + New Record
                </Button>
              </Link>
            </div>
            {(!soapNotes || soapNotes.length === 0) ? (
              <div className="p-10 text-center text-slate-400 text-sm">No medical records yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {soapNotes.map((note: any) => (
                  <Link key={note.id} href={`/records/${note.id}`}>
                    <div className="px-5 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-slate-800">{note.visit_date}</span>
                            {note.visit_type && (
                              <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-xs capitalize">
                                {note.visit_type.replace(/_/g, ' ')}
                              </span>
                            )}
                            {note.ai_generated && (
                              <span className="px-2 py-0.5 rounded-lg bg-violet-50 text-violet-600 text-xs">AI</span>
                            )}
                          </div>
                          {note.chief_complaint && (
                            <p className="text-sm text-slate-600 mt-1 truncate">{note.chief_complaint}</p>
                          )}
                          {note.assessment && (
                            <p className="text-xs text-slate-400 mt-1 truncate">{note.assessment}</p>
                          )}
                          {note.follow_up_date && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                              <Clock className="h-3 w-3" />
                              Follow-up: {note.follow_up_date}
                            </div>
                          )}
                        </div>
                        {note.staff && (
                          <p className="text-xs text-slate-400 shrink-0">Dr. {note.staff.full_name}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Vaccinations */}
          <div className="card-premium overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Syringe className="h-4 w-4 text-slate-400" />
                Vaccinations
                <span className="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs rounded-lg font-medium">
                  {vaccinations?.length ?? 0}
                </span>
              </h2>
              <Link href={`/vaccinations/new?patient_id=${id}`}>
                <Button size="sm" className="rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                  + Add
                </Button>
              </Link>
            </div>
            {(!vaccinations || vaccinations.length === 0) ? (
              <div className="p-10 text-center text-slate-400 text-sm">No vaccinations recorded</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {vaccinations.map((vax: any) => {
                  const isOverdue = vax.next_due_date && new Date(vax.next_due_date) < new Date()
                  return (
                    <div key={vax.id} className="px-5 py-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isOverdue ? 'bg-red-50' : 'bg-emerald-50'
                        }`}>
                          <Syringe className={`h-4 w-4 ${isOverdue ? 'text-red-500' : 'text-emerald-500'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{vax.vaccine_name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Given: {vax.administered_date}
                            {vax.staff && ` · ${vax.staff.full_name}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {vax.next_due_date && (
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                            isOverdue ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isOverdue ? 'Overdue' : 'Due'}: {vax.next_due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Prescriptions */}
          <div className="card-premium overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Pill className="h-4 w-4 text-slate-400" />
                Prescriptions
                <span className="ml-1 px-2 py-0.5 bg-violet-50 text-violet-600 text-xs rounded-lg font-medium">
                  {prescriptions?.length ?? 0}
                </span>
              </h2>
              <Link href={`/prescriptions/new?patient_id=${id}`}>
                <Button size="sm" className="rounded-xl text-xs bg-violet-600 hover:bg-violet-700 text-white border-0">
                  + Add
                </Button>
              </Link>
            </div>
            {(!prescriptions || prescriptions.length === 0) ? (
              <div className="p-10 text-center text-slate-400 text-sm">No prescriptions recorded</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {prescriptions.map((rx: any) => (
                  <div key={rx.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          rx.is_active ? 'bg-violet-50' : 'bg-slate-100'
                        }`}>
                          <Pill className={`h-4 w-4 ${rx.is_active ? 'text-violet-500' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800">{rx.medication_name}</p>
                            <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                              rx.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {rx.is_active ? 'Active' : 'Completed'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {rx.dosage} · {rx.frequency}
                            {rx.duration_days ? ` · ${rx.duration_days} days` : ''}
                          </p>
                          {rx.instructions && (
                            <p className="text-xs text-slate-400 mt-1">{rx.instructions}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-xs text-slate-400">
                        {rx.start_date}
                        {rx.end_date && <><br />→ {rx.end_date}</>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Appointments */}
          <div className="card-premium overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Appointments
                <span className="ml-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs rounded-lg font-medium">
                  {appointments?.length ?? 0}
                </span>
              </h2>
              <Link href={`/appointments/new?patient_id=${id}`}>
                <Button size="sm" className="rounded-xl text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">
                  + Book
                </Button>
              </Link>
            </div>
            {(!appointments || appointments.length === 0) ? (
              <div className="p-10 text-center text-slate-400 text-sm">No appointments recorded</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map((appt: any) => (
                  <div key={appt.id} className="px-5 py-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {new Date(appt.scheduled_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          <span className="text-slate-400 font-normal ml-2 text-xs">
                            {new Date(appt.scheduled_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {appt.appointment_type?.replace(/_/g, ' ')}
                          {appt.staff ? ` · Dr. ${appt.staff.full_name}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize shrink-0 ${statusBadge(appt.status)}`}>
                      {appt.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing */}
          <div className="card-premium overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-slate-400" />
                  Billing
                </h2>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Billed: <span className="font-semibold text-slate-700">AED {totalBilled.toFixed(0)}</span></span>
                  <span className="text-slate-400">Paid: <span className="font-semibold text-emerald-700">AED {totalPaid.toFixed(0)}</span></span>
                  {totalBilled - totalPaid > 0 && (
                    <span className="text-slate-400">Due: <span className="font-semibold text-red-600">AED {(totalBilled - totalPaid).toFixed(0)}</span></span>
                  )}
                </div>
              </div>
            </div>
            {(!invoices || invoices.length === 0) ? (
              <div className="p-10 text-center text-slate-400 text-sm">No invoices yet</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {invoices.map((inv: any) => (
                  <Link key={inv.id} href={`/billing/${inv.id}`}>
                    <div className="px-5 py-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{inv.invoice_number}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{inv.issue_date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize ${invoiceStatusBadge(inv.status)}`}>
                          {inv.status}
                        </span>
                        <p className="text-sm font-semibold text-slate-800">AED {Number(inv.total).toFixed(0)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}