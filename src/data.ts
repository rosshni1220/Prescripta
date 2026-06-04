/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DoctorProfile, Patient, Appointment, Prescription } from "./types";

export const DEFAULT_DOCTOR_PROFILE: DoctorProfile = {
  name: "Dr. Sameer Roy, MD (Pediatrics & General)",
  specialty: "Pediatrics & General Medicine",
  degree: "MBBS, MD - Pediatrics",
  regNo: "MCI-48291-A",
  clinicName: "Apex Healing Clinic & Pediatric Center",
  address: "Plot 14, Phase 3, Hitec City, Hyderabad - 500081",
  phone: "+91 98765 43210",
  email: "contact@apexhealing.com",
  consultationFee: 500
};

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "pat-1",
    name: "Aarav Mehta",
    age: 28,
    gender: "Male",
    mobile: "+91 98989 12345",
    email: "aarav.mehta@gmail.com",
    bloodGroup: "O+",
    createdAt: "2026-06-03"
  },
  {
    id: "pat-2",
    name: "Kiara Sharma",
    age: 6,
    gender: "Female",
    mobile: "+91 88776 65544",
    email: "sharma.family@outlook.com",
    bloodGroup: "B+",
    createdAt: "2026-06-02"
  },
  {
    id: "pat-3",
    name: "Devendra Gupta",
    age: 52,
    gender: "Male",
    mobile: "+91 91234 56789",
    email: "d.gupta@yahoo.com",
    bloodGroup: "A+",
    createdAt: "2026-06-01"
  },
  {
    id: "pat-4",
    name: "Priya Patel",
    age: 34,
    gender: "Female",
    mobile: "+91 77665 44332",
    email: "priya.patel@gmail.com",
    bloodGroup: "O-",
    createdAt: "2026-05-28"
  },
  {
    id: "pat-5",
    name: "Rohan Deshmukh",
    age: 19,
    gender: "Male",
    mobile: "+91 94455 66778",
    email: "rohan.d@gmail.com",
    bloodGroup: "AB+",
    createdAt: "2026-06-04"
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: "apt-1",
    patientId: "pat-1",
    patientName: "Aarav Mehta",
    patientAge: 28,
    patientGender: "Male",
    patientMobile: "+91 98989 12345",
    timeSlot: "10:00 AM",
    date: "2026-06-04",
    status: "Checked-In",
    tokenNumber: 1
  },
  {
    id: "apt-2",
    patientId: "pat-2",
    patientName: "Kiara Sharma",
    patientAge: 6,
    patientGender: "Female",
    patientMobile: "+91 88776 65544",
    timeSlot: "10:30 AM",
    date: "2026-06-04",
    status: "Engaging",
    tokenNumber: 2
  },
  {
    id: "apt-3",
    patientId: "pat-3",
    patientName: "Devendra Gupta",
    patientAge: 52,
    patientGender: "Male",
    patientMobile: "+91 91234 56789",
    timeSlot: "11:00 AM",
    date: "2026-06-04",
    status: "Billing",
    tokenNumber: 3
  },
  {
    id: "apt-4",
    patientId: "pat-4",
    patientName: "Priya Patel",
    patientAge: 34,
    patientGender: "Female",
    patientMobile: "+91 77665 44332",
    timeSlot: "09:30 AM",
    date: "2026-06-04",
    status: "Completed",
    tokenNumber: 4
  },
  {
    id: "apt-5",
    patientId: "pat-5",
    patientName: "Rohan Deshmukh",
    patientAge: 19,
    patientGender: "Male",
    patientMobile: "+91 94455 66778",
    timeSlot: "11:30 AM",
    date: "2026-06-04",
    status: "Scheduled",
    tokenNumber: 5
  }
];

export const INITIAL_PRESCRIPTIONS: Prescription[] = [
  {
    id: "rx-1",
    patientId: "pat-4",
    patientName: "Priya Patel",
    patientAge: 34,
    patientGender: "Female",
    date: "2026-06-04",
    complaints: ["Dry Cough", "Sore Throat", "Loss of Appetite"],
    vitals: {
      bp: "118/76",
      pulse: 74,
      temp: 99.1,
      weight: 58,
      height: 162,
      bmi: 22.1,
      spo2: 99
    },
    diagnosis: ["Allergic Rhinitis", "Mild Pharyngitis"],
    medications: [
      {
        name: "Tab. Cetirizine 10 mg",
        dosage: "0-0-1",
        frequency: "Daily",
        duration: 5,
        durationUnit: "Days",
        timing: "At Bedtime",
        instruction: "To be taken at night only."
      },
      {
        name: "Syr. Dextromethorphan (10ml)",
        dosage: "1-1-1",
        frequency: "Thrice daily",
        duration: 5,
        durationUnit: "Days",
        timing: "After Food",
        instruction: "Do not drink water for 15 mins after taking this syrup."
      }
    ],
    labTests: ["Complete Blood Count (CBC)"],
    advice: "Avoid cold or carbonated beverages, gargle with warm salt water thrice daily, take complete voice rest.",
    followUpDate: "2026-06-09",
    billAmount: 500,
    isPaid: true
  }
];
