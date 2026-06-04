/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DoctorProfile {
  name: string;
  specialty: string;
  degree: string;
  regNo: string;
  clinicName: string;
  address: string;
  phone: string;
  email: string;
  consultationFee: number;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  mobile: string;
  email?: string;
  bloodGroup?: string;
  createdAt: string;
  doctorId?: string;
}

export interface Vitals {
  bp?: string; // e.g. "120/80"
  pulse?: number; // e.g. 72 bpm
  temp?: number; // e.g. 98.6 F
  weight?: number; // e.g. 70 kg
  height?: number; // e.g. 175 cm
  bmi?: number; // auto-calculated
  spo2?: number; // e.g. 98%
}

export interface Medication {
  name: string;
  dosage: string; // e.g. "1-0-1"
  frequency: "Daily" | "Twice daily" | "Thrice daily" | "Four times a day" | "Once weekly" | "As needed (PRN)";
  duration: number;
  durationUnit: "Days" | "Weeks" | "Months" | "Single Dose";
  timing: "Before Food" | "After Food" | "With Food" | "Empty Stomach" | "At Bedtime";
  instruction?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string; // denormalized for easy rendering
  patientAge: number;
  patientGender: "Male" | "Female" | "Other";
  date: string;
  complaints: string[];
  vitals: Vitals;
  diagnosis: string[];
  medications: Medication[];
  labTests: string[];
  advice: string;
  followUpDate?: string;
  billAmount: number;
  isPaid: boolean;
  doctorId?: string;
  internalNotes?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: "Male" | "Female" | "Other";
  patientMobile: string;
  timeSlot: string; // e.g. "10:30 AM"
  date: string; // YYYY-MM-DD
  status: "Scheduled" | "Checked-In" | "Engaging" | "Billing" | "Completed" | "Cancelled";
  tokenNumber: number;
  doctorId?: string;
}

export interface ClinicStats {
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  pendingInvoices: number;
}
