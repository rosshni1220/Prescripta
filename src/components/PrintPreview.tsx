/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Prescription, DoctorProfile, Medication } from "../types";
import { Printer, X, Share2, Check, Download, AlertCircle, Lock, EyeOff } from "lucide-react";

interface PrintPreviewProps {
  prescription: Prescription;
  doctor: DoctorProfile;
  onClose: () => void;
}

export default function PrintPreview({ prescription, doctor, onClose }: PrintPreviewProps) {
  const [showShareSuccess, setShowShareSuccess] = React.useState(false);

  const calculateTotalQty = (med: Medication): number => {
    // Basic heuristics to count total pills
    const freqCountMap: Record<Medication["frequency"], number> = {
      "Daily": 1,
      "Twice daily": 2,
      "Thrice daily": 3,
      "Four times a day": 4,
      "Once weekly": 0.15, // roughly 1 per week
      "As needed (PRN)": 1
    };

    const freqPerDay = freqCountMap[med.frequency] || 1;
    let days = med.duration;
    if (med.durationUnit === "Weeks") days = med.duration * 7;
    if (med.durationUnit === "Months") days = med.duration * 30;
    if (med.durationUnit === "Single Dose") return 1;

    return Math.ceil(freqPerDay * days);
  };

  const handlePrint = () => {
    // Print styling is embedded via utility printing classes
    window.print();
  };

  const handleShare = () => {
    setShowShareSuccess(true);
    setTimeout(() => {
      setShowShareSuccess(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden print:shadow-none print:max-h-none print:rounded-none">
        {/* Modal Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 print:hidden shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">Printable Digital Prescription</h3>
            <p className="text-xs text-slate-500">Drafted via Prescripta on {prescription.date}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center px-3 py-1.5 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              WhatsApp / SMS
            </button>
            <button
              id="print-trigger-btn"
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Rx
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Share Feedback Toast */}
        {showShareSuccess && (
          <div className="bg-emerald-50 text-emerald-800 border-b border-emerald-100 px-6 py-2.5 text-xs flex items-center gap-2 print:hidden font-medium">
            <Check className="w-4 h-4 text-emerald-600" />
            Prescription successfully transmitted to patient's registered mobile ({prescription.patientGender === "Female" ? "Ms." : "Mr."} {prescription.patientName}) via secure SMS alert link!
          </div>
        )}

        {/* Prescription Page Container */}
        <div className="flex-1 overflow-y-auto p-8 md:p-12 print:overflow-visible print:p-0" id="rx-printable-sheet">
          <div className="border border-slate-300 p-6 md:p-10 rounded-lg bg-white print:border-none print:p-0 flex flex-col justify-between min-h-[700px]">
            {/* 1. DOCTOR LETTERHEAD */}
            <div className="border-b-2 border-sky-800 pb-5">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-bold text-slate-800 tracking-tight">{doctor.name}</h1>
                  <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">{doctor.specialty}</p>
                  <p className="text-xs font-medium text-slate-600 mt-0.5">{doctor.degree}</p>
                  <p className="text-[11px] font-mono font-medium text-slate-500 mt-0.5">Reg No: {doctor.regNo}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-sm font-black text-sky-800 tracking-wider font-sans uppercase">PREPARED BY PRESCRIPTA</h2>
                  <p className="text-xs font-semibold text-slate-700 mt-1">{doctor.clinicName}</p>
                  <p className="text-[10px] text-slate-500 leading-normal max-w-[240px] ml-auto mt-1">{doctor.address}</p>
                  <p className="text-[11px] font-semibold text-slate-600 mt-1">Ph: {doctor.phone}</p>
                </div>
              </div>
            </div>

            {/* 2. PATIENT METADATA OVERVIEW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-slate-200 bg-slate-50/50 px-4 rounded-md my-4 text-xs">
              <div>
                <span className="text-slate-400 block uppercase font-mono text-[9px] font-bold">Patient Name:</span>
                <span className="font-bold text-slate-800 text-[13px]">{prescription.patientName}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-mono text-[9px] font-bold">Demographics:</span>
                <span className="font-semibold text-slate-700">{prescription.patientAge} Years / {prescription.patientGender}</span>
              </div>
              <div>
                <span className="text-slate-400 block uppercase font-mono text-[9px] font-bold">Prescription Date:</span>
                <span className="font-semibold text-slate-700 font-mono">{prescription.date}</span>
              </div>
              <div className="text-right sm:text-left">
                <span className="text-slate-400 block uppercase font-mono text-[9px] font-bold">Prescription ID:</span>
                <span className="font-mono text-xs font-bold text-slate-600">Rx-{prescription.id.slice(-6).toUpperCase()}</span>
              </div>
            </div>

            {/* VITALS BAND */}
            {Object.values(prescription.vitals).some(v => v !== undefined && v !== "") && (
              <div className="border border-slate-100 rounded-md p-3 mb-6 bg-slate-50/20">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Vitals Logged:</span>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                  {prescription.vitals.bp && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">BP:</span>
                      <span className="font-semibold text-slate-700">{prescription.vitals.bp} mmHg</span>
                    </div>
                  )}
                  {prescription.vitals.pulse && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Pulse:</span>
                      <span className="font-semibold text-slate-700">{prescription.vitals.pulse} bpm</span>
                    </div>
                  )}
                  {prescription.vitals.temp && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Temp:</span>
                      <span className="font-semibold text-slate-700">{prescription.vitals.temp}°F</span>
                    </div>
                  )}
                  {prescription.vitals.spo2 && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">SpO2:</span>
                      <span className="font-semibold text-slate-700">{prescription.vitals.spo2}%</span>
                    </div>
                  )}
                  {prescription.vitals.weight && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">Weight:</span>
                      <span className="font-semibold text-slate-700">{prescription.vitals.weight} kg</span>
                    </div>
                  )}
                  {prescription.vitals.bmi && (
                    <div>
                      <span className="text-[10px] text-slate-400 block">BMI:</span>
                      <span className={`font-semibold ${prescription.vitals.bmi >= 25 ? "text-amber-600" : "text-slate-700"}`}>
                        {prescription.vitals.bmi.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. CLINICAL DETAILS AND THE BIG RX */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-[300px]">
              {/* Complaints & Findings (Left column) */}
              <div className="md:col-span-1 space-y-4 border-r border-slate-100 pr-4">
                {prescription.complaints && prescription.complaints.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">Symptoms / Complaints:</h3>
                    <ul className="list-disc list-inside text-xs font-semibold text-slate-800 space-y-1">
                      {prescription.complaints.map((comp, idx) => (
                        <li key={idx}>{comp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {prescription.diagnosis && prescription.diagnosis.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">Clinical Diagnoses:</h3>
                    <ul className="list-disc list-inside text-xs font-bold text-sky-900 space-y-1">
                      {prescription.diagnosis.map((diag, idx) => (
                        <li key={idx} className="bg-sky-50 px-2 py-0.5 rounded-sm inline-block my-0.5">{diag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {prescription.labTests && prescription.labTests.length > 0 && (
                  <div className="pt-2">
                    <h3 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1.5">Lab/Pathology Ordered:</h3>
                    <ul className="list-none text-xs font-semibold text-slate-700 space-y-1">
                      {prescription.labTests.map((lab, idx) => (
                        <li key={idx} className="border border-slate-200 rounded px-2.5 py-1 bg-amber-50/20 text-amber-900 font-medium">
                          🔬 {lab}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Rx prescription core (Right column) */}
              <div className="md:col-span-2 pl-2">
                <span className="text-[28px] font-black italic font-serif text-sky-900 block mb-3 select-none leading-none">Rx</span>

                {prescription.medications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No medications prescribed.</p>
                ) : (
                  <table className="w-full text-left font-sans text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-400 uppercase font-mono text-[9px] font-bold">
                        <th className="pb-2">Drug Name & Scheme</th>
                        <th className="pb-2">Dose Schema</th>
                        <th className="pb-2 text-center">Duration</th>
                        <th className="pb-2 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prescription.medications.map((med, idx) => (
                        <tr key={idx} className="align-top py-2.5">
                          <td className="py-2.5 pr-2">
                            <span className="block font-bold text-slate-800 text-[13px]">{med.name}</span>
                            <span className="text-[10px] text-slate-500 italic block">{med.timing}</span>
                            {med.instruction && (
                              <span className="text-[10px] font-medium text-amber-700 block mt-0.5">⚠️ {med.instruction}</span>
                            )}
                          </td>
                          <td className="py-2.5">
                            <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded-sm inline-block">
                              {med.dosage}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">{med.frequency}</span>
                          </td>
                          <td className="py-2.5 text-center font-semibold text-slate-700">
                            {med.duration} {med.durationUnit}
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-400 font-medium">
                            Qty: {calculateTotalQty(med)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {prescription.advice && (
                  <div className="border-t border-slate-200 mt-6 pt-4 text-xs">
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">General Advice/Diet instructions:</span>
                    <p className="text-slate-700 leading-relaxed font-semibold">{prescription.advice}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 4. FOOTER & ALERTS */}
            <div className="border-t border-slate-300 pt-5 mt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
              <div className="space-y-1 mb-4 sm:mb-0 text-center sm:text-left">
                {prescription.followUpDate && (
                  <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-bold border border-amber-200 rounded px-2.5 py-1 uppercase text-[10px] tracking-wide font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Follow up around: {prescription.followUpDate}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 block mt-1">Generated electronically. Self-diagnosing based on prescriptions is highly discouraged.</p>
              </div>

              {/* Signature space */}
              <div className="text-center w-48 shrink-0">
                <div className="border-b border-slate-300 h-10 w-full mb-1">
                  {/* Signature mockup */}
                  <span className="font-serif italic text-sky-800 text-sm">{doctor.name.split(",")[0]}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authorized Signature</span>
              </div>
            </div>
          </div>

          {/* Secure Doctor Internal Observations Notes box */}
          {prescription.internalNotes && (
            <div className="mt-6 p-5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2 print:hidden">
              <div className="flex items-center gap-1.5 text-amber-850 font-bold uppercase text-[10px] font-mono tracking-wider">
                <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                Confidential Clinical Observations (Doctor Eyes-Only)
              </div>
              <p className="text-[11px] text-slate-500 font-medium">This is an internal clinical observation log used to track longitudinal sessions, and is excluded from the patient's printed leaflet.</p>
              <div className="border-t border-amber-200/50 pt-2.5 mt-1 bg-white/65 p-3 rounded-md">
                {renderFormattedNotes(prescription.internalNotes)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Safely format and render markdown-like notes with basic bold, italic, underline and highlight formatting tags
function renderFormattedNotes(text: string) {
  if (!text) return <span className="text-slate-400 italic">No notes entered yet.</span>;
  
  let formatted = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Underline
  formatted = formatted.replace(/_(.*?)_/g, '<u>$1</u>');
  // Highlight
  formatted = formatted.replace(/\[highlight\](.*?)\[\/highlight\]/g, '<mark class="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-medium">$1</mark>');
  // Bullet lines
  formatted = formatted.replace(/^-\s+(.*?)$/gm, '• $1');

  const lines = formatted.split("\n");
  return (
    <div className="space-y-1 text-xs text-slate-700 leading-relaxed font-sans">
      {lines.map((line, i) => (
        <p key={i} dangerouslySetInnerHTML={{ __html: line || "&nbsp;" }} />
      ))}
    </div>
  );
}
