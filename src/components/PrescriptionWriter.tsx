/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Patient, Vitals, Medication, Prescription, Appointment } from "../types";
import { 
  PRESET_COMPLAINTS, 
  PRESET_DIAGNOSES, 
  PRESET_LAB_TESTS, 
  PRESET_MEDICATIONS, 
  PresetMedType 
} from "../presets";
import { 
  Plus, 
  Trash, 
  Clock, 
  Search, 
  CheckCircle2, 
  FileText, 
  Stethoscope, 
  Activity, 
  AlertCircle,
  Undo2,
  ListPlus
} from "lucide-react";

interface PrescriptionWriterProps {
  patient: Patient;
  appointmentId: string;
  onSavePrescription: (prescriptionData: Omit<Prescription, "id" | "date">) => void;
  onCancel: () => void;
  pastPrescriptions: Prescription[];
}

export default function PrescriptionWriter({
  patient,
  appointmentId,
  onSavePrescription,
  onCancel,
  pastPrescriptions
}: PrescriptionWriterProps) {
  // 1. Complaints
  const [complaintSearch, setComplaintSearch] = useState("");
  const [complaintsList, setComplaintsList] = useState<string[]>([]);

  // 2. Vitals State
  const [bp, setBp] = useState("");
  const [pulse, setPulse] = useState<number | "">("");
  const [temp, setTemp] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [spo2, setSpo2] = useState<number | "">("");
  const [bmi, setBmi] = useState<number | undefined>(undefined);

  // Auto calculate BMI
  useEffect(() => {
    if (weight && height) {
      const hMeter = Number(height) / 100;
      const calculatedBmi = Number(weight) / (hMeter * hMeter);
      setBmi(calculatedBmi);
    } else {
      setBmi(undefined);
    }
  }, [weight, height]);

  // 3. Clinical Diagnosis
  const [diagnosisSearch, setDiagnosisSearch] = useState("");
  const [diagnosisList, setDiagnosisList] = useState<string[]>([]);

  // 4. Added Drugs List
  const [prescribedMeds, setPrescribedMeds] = useState<Medication[]>([]);

  // Current Drug Entry State
  const [selectedPresetMed, setSelectedPresetMed] = useState<string>("");
  const [customMedName, setCustomMedName] = useState("");
  const [medDosage, setMedDosage] = useState("1-0-1");
  const [medFrequency, setMedFrequency] = useState<Medication["frequency"]>("Twice daily");
  const [medTiming, setMedTiming] = useState<Medication["timing"]>("After Food");
  const [medDuration, setMedDuration] = useState<number>(3);
  const [medDurationUnit, setMedDurationUnit] = useState<Medication["durationUnit"]>("Days");
  const [medInstruction, setMedInstruction] = useState("");

  const [medError, setMedError] = useState("");

  // 5. Selected Pathology/Labs State
  const [selectedLabs, setSelectedLabs] = useState<string[]>([]);

  // 6. Advice
  const [generalAdvice, setGeneralAdvice] = useState("");

  // 7. Follow up
  const [followUpDate, setFollowUpDate] = useState("");

  // 8. Custom Charges (e.g. Procedure fee)
  const [extraFee, setExtraFee] = useState<number>(0);

  // Set default values when preset drug drops down
  const handlePresetMedSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const term = e.target.value;
    setSelectedPresetMed(term);
    setMedError("");

    if (term) {
      const match = PRESET_MEDICATIONS.find(m => m.name === term);
      if (match) {
        setCustomMedName(match.name);
        setMedDosage(match.defaultDosage);
        setMedFrequency(match.defaultFrequency);
        setMedTiming(match.defaultTiming);
        setMedDuration(match.defaultDuration);
        setMedDurationUnit("Days");
        setMedInstruction("");
      }
    } else {
      setCustomMedName("");
    }
  };

  const handleAddMedToRx = () => {
    if (!customMedName.trim()) {
      setMedError("Please provide a medicine name.");
      return;
    }

    const newMed: Medication = {
      name: customMedName.trim(),
      dosage: medDosage,
      frequency: medFrequency,
      duration: Number(medDuration) || 1,
      durationUnit: medDurationUnit,
      timing: medTiming,
      instruction: medInstruction || undefined
    };

    setPrescribedMeds([...prescribedMeds, newMed]);

    // Reset drug fields
    setSelectedPresetMed("");
    setCustomMedName("");
    setMedDosage("1-0-1");
    setMedFrequency("Twice daily");
    setMedTiming("After Food");
    setMedDuration(3);
    setMedDurationUnit("Days");
    setMedInstruction("");
    setMedError("");
  };

  const handleDeleteMed = (index: number) => {
    setPrescribedMeds(prescribedMeds.filter((_, i) => i !== index));
  };

  const toggleComplaint = (complaint: string) => {
    if (complaintsList.includes(complaint)) {
      setComplaintsList(complaintsList.filter(c => c !== complaint));
    } else {
      setComplaintsList([...complaintsList, complaint]);
    }
  };

  const toggleDiagnosis = (diag: string) => {
    if (diagnosisList.includes(diag)) {
      setDiagnosisList(diagnosisList.filter(d => d !== diag));
    } else {
      setDiagnosisList([...diagnosisList, diag]);
    }
  };

  const toggleLabTest = (lab: string) => {
    if (selectedLabs.includes(lab)) {
      setSelectedLabs(selectedLabs.filter(l => l !== lab));
    } else {
      setSelectedLabs([...selectedLabs, lab]);
    }
  };

  // Add custom typed compliant
  const handleAddCustomComplaint = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && complaintSearch.trim()) {
      e.preventDefault();
      if (!complaintsList.includes(complaintSearch.trim())) {
        setComplaintsList([...complaintsList, complaintSearch.trim()]);
      }
      setComplaintSearch("");
    }
  };

  // Add custom typed Diagnosis
  const handleAddCustomDiagnosis = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && diagnosisSearch.trim()) {
      e.preventDefault();
      if (!diagnosisList.includes(diagnosisSearch.trim())) {
        setDiagnosisList([...diagnosisList, diagnosisSearch.trim()]);
      }
      setDiagnosisSearch("");
    }
  };

  const advanceFollowUpDate = (days: number) => {
    const base = new Date();
    base.setDate(base.getDate() + days);
    setFollowUpDate(base.toISOString().split("T")[0]);
  };

  // Repeat previous Rx with single-click mapping
  const handleRepeatPreviousRx = () => {
    const patientHistoricals = pastPrescriptions.filter(p => p.patientId === patient.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (patientHistoricals.length > 0) {
      const lastRx = patientHistoricals[0];
      setComplaintsList(lastRx.complaints || []);
      setDiagnosisList(lastRx.diagnosis || []);
      setPrescribedMeds(lastRx.medications || []);
      setSelectedLabs(lastRx.labTests || []);
      setGeneralAdvice(lastRx.advice || "");
      if (lastRx.vitals) {
        setBp(lastRx.vitals.bp || "");
        setPulse(lastRx.vitals.pulse || "");
        setTemp(lastRx.vitals.temp || "");
        setWeight(lastRx.vitals.weight || "");
        setHeight(lastRx.vitals.height || "");
        setSpo2(lastRx.vitals.spo2 || "");
      }
    }
  };

  const handleSubmitRx = (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger parent save callback
    onSavePrescription({
      patientId: patient.id,
      patientName: patient.name,
      patientAge: patient.age,
      patientGender: patient.gender,
      complaints: complaintsList,
      vitals: {
        bp: bp || undefined,
        pulse: pulse !== "" ? Number(pulse) : undefined,
        temp: temp !== "" ? Number(temp) : undefined,
        weight: weight !== "" ? Number(weight) : undefined,
        height: height !== "" ? Number(height) : undefined,
        spo2: spo2 !== "" ? Number(spo2) : undefined,
        bmi: bmi
      },
      diagnosis: diagnosisList,
      medications: prescribedMeds,
      labTests: selectedLabs,
      advice: generalAdvice,
      followUpDate: followUpDate || undefined,
      billAmount: 500 + Number(extraFee),
      isPaid: false // initially unpaid, queued into completed billing status
    });
  };

  // Compute BMI style/category indicators
  const getBmiStatus = (bmiValue: number) => {
    if (bmiValue < 18.5) return { text: "Underweight", color: "text-amber-500 bg-amber-50 border-amber-100" };
    if (bmiValue < 25) return { text: "Normal", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
    if (bmiValue < 30) return { text: "Overweight", color: "text-orange-500 bg-orange-50 border-orange-100" };
    return { text: "Obese", color: "text-red-500 bg-red-50 border-red-100" };
  };

  return (
    <form onSubmit={handleSubmitRx} className="space-y-6">
      {/* Active Patient banner */}
      <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-sm select-none">
            {patient.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              {patient.name}
              <span className="text-xs bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full font-bold">
                {patient.gender} • {patient.age}Y
              </span>
            </h3>
            <p className="text-xs text-slate-500">Mobile: {patient.mobile} {patient.bloodGroup ? `| Blood Group: ${patient.bloodGroup}` : ""}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {pastPrescriptions.some(rx => rx.patientId === patient.id) && (
            <button
              type="button"
              onClick={handleRepeatPreviousRx}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              🔄 Repeat Previous Rx
            </button>
          )}

          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" /> Close Consultation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (GRID 7): Complaints, Vitals, Diagnoses, Labs */}
        <div className="lg:col-span-7 space-y-6">
          {/* A. VITALS LOGGING */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-500" /> Vitals & Parameters
            </h4>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  placeholder="e.g. 120/80"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pulse (bpm)</label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">SpO2 (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 98"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Temperature (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 98.6"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Height (cm)</label>
                <input
                  type="number"
                  placeholder="e.g. 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Weight (kg)</label>
                <input
                  type="number"
                  placeholder="e.g. 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value !== "" ? Number(e.target.value) : "")}
                  className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:bg-white"
                />
              </div>

              {bmi !== undefined && (
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Auto-calculated BMI</label>
                  <div className={`p-2.5 rounded-lg border flex items-center justify-between font-medium ${getBmiStatus(bmi).color}`}>
                    <span className="font-mono font-bold text-sm">{bmi.toFixed(1)}</span>
                    <span className="text-[10px] uppercase font-bold">{getBmiStatus(bmi).text}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* B. CHIEF COMPLAINTS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
                ⚙️ Symptoms & Chief Complaints
              </h4>
              <span className="text-[10px] text-slate-400">Press ENTER or Tap preset to append</span>
            </div>

            {/* Custom Input */}
            <input
              type="text"
              placeholder="Search or enter custom symptom..."
              value={complaintSearch}
              onChange={(e) => setComplaintSearch(e.target.value)}
              onKeyDown={handleAddCustomComplaint}
              className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-sky-500"
            />

            {/* Selected Symptoms Pills */}
            {complaintsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-lg border border-slate-100">
                {complaintsList.map((complaint) => (
                  <span
                    key={complaint}
                    onClick={() => toggleComplaint(complaint)}
                    className="inline-flex items-center gap-1 py-1 px-2.5 bg-sky-100 text-sky-800 hover:bg-sky-200 hover:text-sky-950 rounded-full font-semibold text-xs leading-none transition cursor-pointer select-none"
                  >
                    {complaint}
                    <span className="font-black text-[10px]">×</span>
                  </span>
                ))}
              </div>
            )}

            {/* Presets Grid */}
            <div>
              <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide mb-1.5">Common Presets:</p>
              <div className="flex flex-wrap gap-1">
                {PRESET_COMPLAINTS.map((comp) => {
                  const isChecked = complaintsList.includes(comp);
                  return (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => toggleComplaint(comp)}
                      className={`text-[10px] font-semibold py-1 px-2.5 rounded-full transition cursor-pointer border ${
                        isChecked
                          ? "bg-sky-600 text-white border-sky-600 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
                      }`}
                    >
                      {comp}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* C. DIAGNOSIS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
                🩺 Clinical Diagnoses
              </h4>
              <span className="text-[10px] text-slate-400">Add custom or click preset</span>
            </div>

            <input
              type="text"
              placeholder="Type custom diagnosis and press ENTER..."
              value={diagnosisSearch}
              onChange={(e) => setDiagnosisSearch(e.target.value)}
              onKeyDown={handleAddCustomDiagnosis}
              className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500"
            />

            {diagnosisList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                {diagnosisList.map((diag) => (
                  <span
                    key={diag}
                    onClick={() => toggleDiagnosis(diag)}
                    className="inline-flex items-center gap-1 py-1 px-2.5 bg-indigo-100 text-indigo-800 hover:bg-indigo-200 rounded-full font-bold text-xs leading-none transition cursor-pointer select-none"
                  >
                    {diag}
                    <span className="font-black text-[10px]">×</span>
                  </span>
                ))}
              </div>
            )}

            <div>
              <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide mb-1.5 font-bold">Diagnoses Presets:</p>
              <div className="flex flex-wrap gap-1">
                {PRESET_DIAGNOSES.map((diag) => {
                  const isChecked = diagnosisList.includes(diag);
                  return (
                    <button
                      key={diag}
                      type="button"
                      onClick={() => toggleDiagnosis(diag)}
                      className={`text-[10px] font-bold py-1 px-2.5 rounded-full transition border text-left cursor-pointer ${
                        isChecked
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-slate-50 text-slate-600 border-slate-150 hover:bg-slate-100"
                      }`}
                    >
                      {diag}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (GRID 5): Rx medications and Bill triggers */}
        <div className="lg:col-span-5 space-y-6">
          {/* D. THE PRESCRIPTION WRITING PAD */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col space-y-4">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <ListPlus className="w-4 h-4 text-emerald-500" /> Prescribe Drugs (Rx)
            </h4>

            {/* Added drugs card lists */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {prescribedMeds.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-150 bg-slate-50/50 rounded-lg text-xs text-slate-400 italic">
                  No drugs cataloged yet. Complete fields below to build Rx.
                </div>
              ) : (
                prescribedMeds.map((med, index) => (
                  <div key={index} className="p-2.5 border border-slate-150 bg-slate-50/50 rounded-lg flex items-center justify-between text-xs transition duration-150">
                    <div>
                      <h5 className="font-bold text-slate-800">{med.name}</h5>
                      <p className="text-[10px] font-semibold text-sky-800">
                        {med.dosage} • {med.frequency} • <span className="font-bold underline">{med.timing}</span>
                      </p>
                      <p className="text-[9px] text-slate-400">Duration: {med.duration} {med.durationUnit} {med.instruction ? `| ${med.instruction}` : ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteMed(index)}
                      className="p-1 px-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer transition shrink-0"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Smart drug entry panel */}
            <div className="p-4 border border-emerald-100 bg-emerald-50/15 rounded-xl space-y-3">
              <p className="text-[10px] font-extrabold uppercase font-mono text-emerald-800">Drug Composition Form</p>
              
              {medError && (
                <div className="p-2 border border-red-100 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold">
                  {medError}
                </div>
              )}

              {/* Autocomplete Dropper */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Select Drug Preset</label>
                <select
                  value={selectedPresetMed}
                  onChange={handlePresetMedSelect}
                  className="w-full text-slate-800 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                >
                  <option value="">-- Choose Indian Medicine Preset --</option>
                  {PRESET_MEDICATIONS.map((med) => (
                    <option key={med.name} value={med.name}>{med.name} ({med.category})</option>
                  ))}
                </select>
              </div>

              {/* Custom Name */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Drug Name</label>
                <input
                  type="text"
                  placeholder="e.g. Tab. Paracetamol 650mg"
                  value={customMedName}
                  onChange={(e) => { setCustomMedName(e.target.value); setMedError(""); }}
                  className="w-full text-slate-800 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              {/* Dosages and frequency mapping */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 1-0-1"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="w-full text-slate-800 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Timing/Sync</label>
                  <select
                    value={medTiming}
                    onChange={(e) => setMedTiming(e.target.value as any)}
                    className="w-full text-slate-850 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value="After Food">After Food</option>
                    <option value="Before Food">Before Food</option>
                    <option value="With Food">With Food</option>
                    <option value="Empty Stomach">Empty Stomach</option>
                    <option value="At Bedtime">At Bedtime</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Frequency</label>
                  <select
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value as any)}
                    className="w-full text-slate-850 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Twice daily">Twice daily</option>
                    <option value="Thrice daily">Thrice daily</option>
                    <option value="Four times a day">Four times a day</option>
                    <option value="Once weekly">Once weekly</option>
                    <option value="As needed (PRN)">As needed (PRN)</option>
                  </select>
                </div>
                <div className="flex gap-1.5 items-end">
                  <div className="w-16 shrink-0">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Duration</label>
                    <input
                      type="number"
                      value={medDuration}
                      onChange={(e) => setMedDuration(Number(e.target.value))}
                      className="w-full text-slate-800 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <select
                      value={medDurationUnit}
                      onChange={(e) => setMedDurationUnit(e.target.value as any)}
                      className="w-full text-slate-800 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                    >
                      <option value="Days">Days</option>
                      <option value="Weeks">Weeks</option>
                      <option value="Months">Months</option>
                      <option value="Single Dose">Single Dose</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Special Instructions (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Swallow complete, do not crush"
                  value={medInstruction}
                  onChange={(e) => setMedInstruction(e.target.value)}
                  className="w-full text-slate-800 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAddMedToRx}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
              >
                + Append to Medication List
              </button>
            </div>
          </div>

          {/* E. PATHOLOGY / LAB TESTS INSTRUCTION */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
              🔬 Lab Pathology & Diagnostics Order
            </h4>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-semibold text-slate-700">
              {PRESET_LAB_TESTS.map((lab) => {
                const isSelected = selectedLabs.includes(lab);
                return (
                  <label key={lab} className="flex items-center gap-2 cursor-pointer select-none py-1 hover:bg-slate-50 rounded px-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleLabTest(lab)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                    />
                    <span className={isSelected ? "text-slate-900 font-bold" : "text-slate-600"}>{lab}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* F. GENERAL ADVICE & FOLLOW-UP SHORTCUTS */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h4 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest">
              📝 Clinical Notes & General Advice
            </h4>
            <textarea
              placeholder="Advice on diet, exercises, lifestyle modifications..."
              value={generalAdvice}
              onChange={(e) => setGeneralAdvice(e.target.value)}
              className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg p-2.5 text-xs focus:outline-none"
              rows={3}
            />

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Follow up Planner</label>
              <div className="grid grid-cols-5 gap-1.5 mb-2 shrink-0">
                <button
                  type="button"
                  onClick={() => advanceFollowUpDate(3)}
                  className="p-1 text-[9px] font-bold bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => advanceFollowUpDate(7)}
                  className="p-1 text-[9px] font-bold bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  +1 Week
                </button>
                <button
                  type="button"
                  onClick={() => advanceFollowUpDate(10)}
                  className="p-1 text-[9px] font-bold bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  +10 Days
                </button>
                <button
                  type="button"
                  onClick={() => advanceFollowUpDate(14)}
                  className="p-1 text-[9px] font-bold bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  +2 Weeks
                </button>
                <button
                  type="button"
                  onClick={() => advanceFollowUpDate(30)}
                  className="p-1 text-[9px] font-bold bg-slate-50 border border-slate-200 rounded text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  +1 Month
                </button>
              </div>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* G. BILLING & SAVE PRESCRIPTION */}
          <div className="bg-slate-800 text-white rounded-xl p-5 shadow-md space-y-4">
            <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest">
              💳 Service Settlement Details
            </h4>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Standard Consultation Fee</span>
                <span>₹500</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Extra Charges / Procedure (₹)</span>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={extraFee}
                  onChange={(e) => setExtraFee(Math.max(Number(e.target.value) || 0, 0))}
                  className="w-24 bg-slate-750 border border-slate-700 text-white p-1 rounded font-mono text-right text-xs"
                />
              </div>

              <div className="h-[1px] bg-slate-700 w-full" />

              <div className="flex justify-between items-center font-bold text-sm">
                <span className="text-slate-200">Total Invoice Amount:</span>
                <span className="text-emerald-400 font-mono text-base">₹{500 + Number(extraFee)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold uppercase rounded-lg shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" /> Save & Preview digital Prescription
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
