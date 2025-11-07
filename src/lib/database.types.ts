// export type Json =
//   | string
//   | number
//   | boolean
//   | null
//   | { [key: string]: Json | undefined }
//   | Json[]

// export type UserRole = 'patient' | 'doctor' | 'lab_technician' | 'pharmacist' | 'admin'
// export type AppointmentStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
// export type PaymentStatus = 'pending' | 'completed' | 'failed'
// export type PaymentType = 'consultation' | 'lab_test' | 'medication'
// export type PrescriptionStatus = 'pending' | 'approved' | 'rejected' | 'completed'
// export type LabTestStatus = 'pending' | 'in_progress' | 'completed'
// export type LabResultStatus = 'positive' | 'negative' | 'inconclusive'

// export interface Database {
//   public: {
//     Tables: {
//       profiles: {
//         Row: {
//           id: string
//           email: string
//           full_name: string
//           role: UserRole
//           phone: string | null
//           national_id: string | null
//           insurance_id: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id: string
//           email: string
//           full_name: string
//           role: UserRole
//           phone?: string | null
//           national_id?: string | null
//           insurance_id?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           id?: string
//           email?: string
//           full_name?: string
//           role?: UserRole
//           phone?: string | null
//           national_id?: string | null
//           insurance_id?: string | null
//           updated_at?: string
//         }
//       }
//       insurances: {
//         Row: {
//           id: string
//           name: string
//           coverage_percentage: number
//           description: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           name: string
//           coverage_percentage?: number
//           description?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           name?: string
//           coverage_percentage?: number
//           description?: string | null
//           updated_at?: string
//         }
//       }
//       hospitals: {
//         Row: {
//           id: string
//           name: string
//           location: string
//           phone: string | null
//           email: string | null
//           description: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           name: string
//           location: string
//           phone?: string | null
//           email?: string | null
//           description?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           name?: string
//           location?: string
//           phone?: string | null
//           email?: string | null
//           description?: string | null
//           updated_at?: string
//         }
//       }
//       departments: {
//         Row: {
//           id: string
//           name: string
//           description: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           name: string
//           description?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           name?: string
//           description?: string | null
//           updated_at?: string
//         }
//       }
//       hospital_departments: {
//         Row: {
//           id: string
//           hospital_id: string
//           department_id: string
//           created_at: string
//         }
//         Insert: {
//           id?: string
//           hospital_id: string
//           department_id: string
//           created_at?: string
//         }
//         Update: {
//           hospital_id?: string
//           department_id?: string
//         }
//       }
//       doctors: {
//         Row: {
//           id: string
//           user_id: string
//           hospital_id: string
//           department_id: string
//           specialization: string | null
//           license_number: string
//           consultation_fee: number
//           signature_data: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           user_id: string
//           hospital_id: string
//           department_id: string
//           specialization?: string | null
//           license_number: string
//           consultation_fee?: number
//           signature_data?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           hospital_id?: string
//           department_id?: string
//           specialization?: string | null
//           license_number?: string
//           consultation_fee?: number
//           signature_data?: string | null
//           updated_at?: string
//         }
//       }
//       pharmacies: {
//         Row: {
//           id: string
//           name: string
//           location: string
//           phone: string | null
//           email: string | null
//           latitude: number | null
//           longitude: number | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           name: string
//           location: string
//           phone?: string | null
//           email?: string | null
//           latitude?: number | null
//           longitude?: number | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           name?: string
//           location?: string
//           phone?: string | null
//           email?: string | null
//           latitude?: number | null
//           longitude?: number | null
//           updated_at?: string
//         }
//       }
//       medications: {
//         Row: {
//           id: string
//           name: string
//           description: string | null
//           category: string | null
//           unit_price: number
//           stock_quantity: number
//           requires_prescription: boolean
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           name: string
//           description?: string | null
//           category?: string | null
//           unit_price?: number
//           stock_quantity?: number
//           requires_prescription?: boolean
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           name?: string
//           description?: string | null
//           category?: string | null
//           unit_price?: number
//           stock_quantity?: number
//           requires_prescription?: boolean
//           updated_at?: string
//         }
//       }
//       appointments: {
//         Row: {
//           id: string
//           patient_id: string
//           doctor_id: string
//           hospital_id: string
//           department_id: string
//           appointment_date: string
//           appointment_time: string
//           status: AppointmentStatus
//           reason: string | null
//           rejection_reason: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           patient_id: string
//           doctor_id: string
//           hospital_id: string
//           department_id: string
//           appointment_date: string
//           appointment_time: string
//           status?: AppointmentStatus
//           reason?: string | null
//           rejection_reason?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           status?: AppointmentStatus
//           rejection_reason?: string | null
//           updated_at?: string
//         }
//       }
//       consultations: {
//         Row: {
//           id: string
//           appointment_id: string
//           patient_id: string
//           doctor_id: string
//           diagnosis: string | null
//           notes: string | null
//           requires_lab_test: boolean
//           requires_prescription: boolean
//           consultation_date: string
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           appointment_id: string
//           patient_id: string
//           doctor_id: string
//           diagnosis?: string | null
//           notes?: string | null
//           requires_lab_test?: boolean
//           requires_prescription?: boolean
//           consultation_date?: string
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           diagnosis?: string | null
//           notes?: string | null
//           requires_lab_test?: boolean
//           requires_prescription?: boolean
//           updated_at?: string
//         }
//       }
//       lab_test_templates: {
//         Row: {
//           id: string
//           name: string
//           description: string | null
//           price: number
//           category: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           name: string
//           description?: string | null
//           price?: number
//           category?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           name?: string
//           description?: string | null
//           price?: number
//           category?: string | null
//           updated_at?: string
//         }
//       }
//       lab_test_requests: {
//         Row: {
//           id: string
//           consultation_id: string
//           patient_id: string
//           doctor_id: string
//           lab_test_template_id: string
//           status: LabTestStatus
//           total_price: number
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           consultation_id: string
//           patient_id: string
//           doctor_id: string
//           lab_test_template_id: string
//           status?: LabTestStatus
//           total_price?: number
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           status?: LabTestStatus
//           updated_at?: string
//         }
//       }
//       lab_test_results: {
//         Row: {
//           id: string
//           lab_test_request_id: string
//           technician_id: string
//           result_status: LabResultStatus
//           result_data: string
//           notes: string | null
//           completed_at: string
//           created_at: string
//         }
//         Insert: {
//           id?: string
//           lab_test_request_id: string
//           technician_id: string
//           result_status: LabResultStatus
//           result_data: string
//           notes?: string | null
//           completed_at?: string
//           created_at?: string
//         }
//         Update: {
//           result_status?: LabResultStatus
//           result_data?: string
//           notes?: string | null
//         }
//       }
//       prescriptions: {
//         Row: {
//           id: string
//           consultation_id: string
//           patient_id: string
//           doctor_id: string
//           status: PrescriptionStatus
//           total_price: number
//           notes: string | null
//           signature_data: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           consultation_id: string
//           patient_id: string
//           doctor_id: string
//           status?: PrescriptionStatus
//           total_price?: number
//           notes?: string | null
//           signature_data?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           status?: PrescriptionStatus
//           total_price?: number
//           notes?: string | null
//           signature_data?: string | null
//           updated_at?: string
//         }
//       }
//       prescription_items: {
//         Row: {
//           id: string
//           prescription_id: string
//           medication_id: string
//           quantity: number
//           dosage: string
//           instructions: string | null
//           unit_price: number
//           total_price: number
//           created_at: string
//         }
//         Insert: {
//           id?: string
//           prescription_id: string
//           medication_id: string
//           quantity?: number
//           dosage: string
//           instructions?: string | null
//           unit_price?: number
//           total_price?: number
//           created_at?: string
//         }
//         Update: {
//           quantity?: number
//           dosage?: string
//           instructions?: string | null
//           unit_price?: number
//           total_price?: number
//         }
//       }
//       pharmacy_requests: {
//         Row: {
//           id: string
//           prescription_id: string
//           patient_id: string
//           pharmacy_id: string
//           status: PrescriptionStatus
//           rejection_reason: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           prescription_id: string
//           patient_id: string
//           pharmacy_id: string
//           status?: PrescriptionStatus
//           rejection_reason?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           status?: PrescriptionStatus
//           rejection_reason?: string | null
//           updated_at?: string
//         }
//       }
//       payments: {
//         Row: {
//           id: string
//           patient_id: string
//           payment_type: PaymentType
//           reference_id: string
//           amount: number
//           insurance_coverage: number
//           patient_pays: number
//           status: PaymentStatus
//           payment_method: string | null
//           transaction_id: string | null
//           created_at: string
//           updated_at: string
//         }
//         Insert: {
//           id?: string
//           patient_id: string
//           payment_type: PaymentType
//           reference_id: string
//           amount: number
//           insurance_coverage?: number
//           patient_pays: number
//           status?: PaymentStatus
//           payment_method?: string | null
//           transaction_id?: string | null
//           created_at?: string
//           updated_at?: string
//         }
//         Update: {
//           status?: PaymentStatus
//           payment_method?: string | null
//           transaction_id?: string | null
//           updated_at?: string
//         }
//       }
//       notifications: {
//         Row: {
//           id: string
//           user_id: string
//           title: string
//           message: string
//           type: string
//           reference_id: string | null
//           is_read: boolean
//           created_at: string
//         }
//         Insert: {
//           id?: string
//           user_id: string
//           title: string
//           message: string
//           type: string
//           reference_id?: string | null
//           is_read?: boolean
//           created_at?: string
//         }
//         Update: {
//           is_read?: boolean
//         }
//       }
//     }
//   }
// }
