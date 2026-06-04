/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medication } from "./types";

export const PRESET_COMPLAINTS = [
  "Fever",
  "Cold & Running Nose",
  "Dry Cough",
  "Productive Cough",
  "Headache",
  "Sore Throat",
  "Body Ache",
  "Abdominal Pain",
  "Vomiting",
  "Loose Stools",
  "Skin Rash",
  "Loss of Appetite",
  "Joint Pain",
  "Fatigue",
  "Dizziness",
  "Shortness of Breath"
];

export const PRESET_DIAGNOSES = [
  "Viral Upper Respiratory Tract Infection (URTI)",
  "Acute Gastroenteritis",
  "Essential Hypertension",
  "Type 2 Diabetes Mellitus",
  "Acute Tonsillitis / Pharyngitis",
  "Bronchial Asthma",
  "Allergic Rhinitis",
  "Acid Peptic Disease (GERD)",
  "Migraine",
  "Urinary Tract Infection (UTI)",
  "Iron Deficiency Anemia",
  "Dermal Allergy / Urticaria",
  "Acute Otitis Media",
  "Dyspepsia"
];

export const PRESET_LAB_TESTS = [
  "Complete Blood Count (CBC)",
  "Urine Routine & Microscopy",
  "Thyroid Profile (T3, T4, TSH)",
  "Fasting Blood Sugar (FBS)",
  "HbA1c (Glycated Hemoglobin)",
  "Lipid Profile",
  "Serum Electrolytes",
  "Renal Function Test (RFT)",
  "Liver Function Test (LFT)",
  "Chest X-Ray (PA View)",
  "ECG (12 Lead)",
  "Dengue NS1 Antigen / Igm",
  "Widal Test (for Typhoid)",
  "Ultrasound Abdomen & Pelvis"
];

export interface PresetMedType {
  name: string;
  defaultDosage: string;
  defaultFrequency: "Daily" | "Twice daily" | "Thrice daily" | "Four times a day" | "Once weekly" | "As needed (PRN)";
  defaultTiming: "Before Food" | "After Food" | "With Food" | "Empty Stomach" | "At Bedtime";
  defaultDuration: number;
  category: "Antipyretic / Analgesic" | "Antibiotic" | "Antacid" | "Antihistamine" | "Cough & Cold" | "Other";
}

export const PRESET_MEDICATIONS: PresetMedType[] = [
  {
    name: "Tab. Paracetamol 650 mg",
    defaultDosage: "1-0-1",
    defaultFrequency: "Twice daily",
    defaultTiming: "After Food",
    defaultDuration: 3,
    category: "Antipyretic / Analgesic"
  },
  {
    name: "Tab. Amoxicillin 500 mg",
    defaultDosage: "1-1-1",
    defaultFrequency: "Thrice daily",
    defaultTiming: "After Food",
    defaultDuration: 5,
    category: "Antibiotic"
  },
  {
    name: "Tab. Cetirizine 10 mg",
    defaultDosage: "0-0-1",
    defaultFrequency: "Daily",
    defaultTiming: "At Bedtime",
    defaultDuration: 5,
    category: "Antihistamine"
  },
  {
    name: "Tab. Pantoprazole 40 mg",
    defaultDosage: "1-0-0",
    defaultFrequency: "Daily",
    defaultTiming: "Empty Stomach",
    defaultDuration: 7,
    category: "Antacid"
  },
  {
    name: "Tab. Azithromycin 500 mg",
    defaultDosage: "1-0-0",
    defaultFrequency: "Daily",
    defaultTiming: "After Food",
    defaultDuration: 3,
    category: "Antibiotic"
  },
  {
    name: "Tab. Ibuprofen 400 mg",
    defaultDosage: "1-0-1",
    defaultFrequency: "Twice daily",
    defaultTiming: "After Food",
    defaultDuration: 3,
    category: "Antipyretic / Analgesic"
  },
  {
    name: "Syr. Dextromethorphan (10ml)",
    defaultDosage: "1-1-1",
    defaultFrequency: "Thrice daily",
    defaultTiming: "After Food",
    defaultDuration: 5,
    category: "Cough & Cold"
  },
  {
    name: "Syr. Paracetamol 125mg/5mL",
    defaultDosage: "5 ml s-o-s",
    defaultFrequency: "As needed (PRN)",
    defaultTiming: "After Food",
    defaultDuration: 3,
    category: "Antipyretic / Analgesic"
  },
  {
    name: "Tab. Montelukast 10 mg + Levocetirizine 5 mg",
    defaultDosage: "0-0-1",
    defaultFrequency: "Daily",
    defaultTiming: "At Bedtime",
    defaultDuration: 10,
    category: "Antihistamine"
  },
  {
    name: "ORS Sachet",
    defaultDosage: "1 sachet in 1L water",
    defaultFrequency: "As needed (PRN)",
    defaultTiming: "Before Food",
    defaultDuration: 2,
    category: "Other"
  },
  {
    name: "Tab. Amoxicillin + Clavulanic Acid 625 mg",
    defaultDosage: "1-0-1",
    defaultFrequency: "Twice daily",
    defaultTiming: "After Food",
    defaultDuration: 5,
    category: "Antibiotic"
  },
  {
    name: "Tab. Ofloxacin 200 mg + Ornidazole 500 mg",
    defaultDosage: "1-0-1",
    defaultFrequency: "Twice daily",
    defaultTiming: "After Food",
    defaultDuration: 5,
    category: "Antibiotic"
  },
  {
    name: "Cap. Omeprazole 20 mg",
    defaultDosage: "1-0-0",
    defaultFrequency: "Daily",
    defaultTiming: "Empty Stomach",
    defaultDuration: 14,
    category: "Antacid"
  },
  {
    name: "Tab. Limcee 500 mg (Vitamin C)",
    defaultDosage: "1-0-0",
    defaultFrequency: "Daily",
    defaultTiming: "After Food",
    defaultDuration: 30,
    category: "Other"
  }
];
