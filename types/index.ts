export type Species = 'dog' | 'cat' | 'bird' | 'rabbit' | 'reptile' | 'exotic' | 'other'
export type SexType = 'male' | 'female' | 'male_neutered' | 'female_spayed' | 'unknown'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled'
export type StaffRole = 'admin' | 'veterinarian' | 'vet_nurse' | 'receptionist' | 'groomer' | 'manager'

export interface Clinic {
  id: string
  name: string
  city: string
  subscription_tier: string
}

export interface Client {
  id: string
  clinic_id: string
  full_name: string
  email?: string
  phone: string
  whatsapp?: string
  address?: string
  created_at: string
}

export interface Patient {
  id: string
  clinic_id: string
  client_id: string
  name: string
  species: Species
  breed?: string
  color?: string
  sex: SexType
  date_of_birth?: string
  weight_kg?: number
  microchip_number?: string
  photo_url?: string
  is_deceased: boolean
  notes?: string
  created_at: string
  clients?: Client
}

export interface Appointment {
  id: string
  clinic_id: string
  patient_id: string
  client_id: string
  vet_id?: string
  appointment_type: string
  status: AppointmentStatus
  scheduled_at: string
  duration_minutes: number
  chief_complaint?: string
  notes?: string
  patients?: Patient
  clients?: Client
  staff?: { full_name: string }
}

export interface SoapNote {
  id: string
  clinic_id: string
  patient_id: string
  appointment_id?: string
  vet_id?: string
  visit_date: string
  subjective?: string
  objective?: string
  assessment?: string
  plan?: string
  ai_generated: boolean
  weight_kg?: number
  temperature_c?: number
  heart_rate_bpm?: number
  created_at: string
}

export interface Invoice {
  id: string
  clinic_id: string
  client_id: string
  patient_id?: string
  invoice_number: string
  status: InvoiceStatus
  issue_date: string
  due_date?: string
  subtotal: number
  tax_amount: number
  discount_amount: number
  total: number
  paid_amount: number
  clients?: Client
  patients?: Patient
}