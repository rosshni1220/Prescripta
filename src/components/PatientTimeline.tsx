/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Patient, Prescription } from "../types";
import { 
  FileText, 
  Calendar, 
  X, 
  ChevronRight, 
  AlertCircle, 
  Activity, 
  HeartHandshake 
} from "lucide-react";

interface PatientTimelineProps {
  patient: Patient;
  prescriptions: Prescription[];
  onClose?: () => void;
  onSelectRx?: (rx: Prescription) => void;
}

export default function PatientTimeline({ 
  patient, 
  prescriptions, 
  onClose,
  onSelectRx 
}: PatientTimelineProps) {
  const patientRxs = prescriptions.filter(r => r.patientId === patient.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white border md:border-slate-200 rounded-xl flex flex-col h-full max-h-[750px] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
        <div>
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Clinical History Archive</span>
          <h3 className="text-sm font-black text-slate-800">
            {patient.name} <span className="text-slate-400 font-normal ml-2">({patient.gender.charAt(0)} / {patient.age}Y)</span>
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 px-2 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" /> Close History
          </button>
        )}
      </div>

      {/* Body Timeline Scrollable */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Contact/Gen details */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/50 p-3 rounded-lg border border-slate-150">
          <div>
            <span className="text-slate-400 block font-mono text-[9px] font-bold">MOBILE:</span>
            <span className="font-bold text-slate-700">{patient.mobile}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-mono text-[9px] font-bold">BLOOD TYPE:</span>
            <span className={`font-mono font-bold ${patient.bloodGroup ? "text-rose-600" : "text-slate-500"}`}>
              {patient.bloodGroup || "Not logged"}
            </span>
          </div>
          {patient.email && (
            <div className="col-span-2">
              <span className="text-slate-400 block font-mono text-[9px] font-bold">EMAIL:</span>
              <span className="font-mono text-slate-600 font-medium">{patient.email}</span>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-4">Visit Chronology ({patientRxs.length})</h4>

          {patientRxs.length === 0 ? (
            <div className="p-8 text-center bg-slate-25 border border-dashed border-slate-200 rounded-xl space-y-2 mt-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-500">No previous records found</p>
              <p className="text-[10px] text-slate-400 leading-normal">Any future completed prescriptions for this patient will build this timeline archive auto-incrementally.</p>
            </div>
          ) : (
            <div className="relative pl-4 space-y-6 border-l border-slate-150">
              {patientRxs.map((rx) => (
                <div key={rx.id} className="relative group">
                  {/* Bullet */}
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 ring-4 ring-white group-hover:bg-sky-600 transition" />

                  <div className="space-y-2 bg-white hover:bg-slate-50/40 p-3 border border-slate-150 rounded-lg transition duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400">{rx.date}</span>
                      <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0">
                        Rx-{rx.id.slice(-6).toUpperCase()}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {rx.diagnosis && rx.diagnosis.length > 0 && (
                        <div className="text-[11px] font-bold text-sky-950 flex flex-wrap gap-1.5 leading-tight">
                          Diagnosed:{" "}
                          {rx.diagnosis.map((d, index) => (
                            <span key={index} className="bg-sky-50 px-1.5 py-0.1 rounded text-[10px]">
                              {d}
                            </span>
                          ))}
                        </div>
                      )}

                      {rx.complaints && rx.complaints.length > 0 && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Symptoms: {rx.complaints.join(", ")}
                        </p>
                      )}
                    </div>

                    {/* Vitals summary if any */}
                    {Object.values(rx.vitals).some(v => v !== undefined && v !== "") && (
                      <div className="flex flex-wrap gap-2 text-[10px] bg-slate-50/50 p-1.5 rounded border border-slate-100 font-mono text-slate-500">
                        {rx.vitals.bp && <span>BP: {rx.vitals.bp}</span>}
                        {rx.vitals.temp && <span>Temp: {rx.vitals.temp}°F</span>}
                        {rx.vitals.weight && <span>Weight: {rx.vitals.weight}kg</span>}
                      </div>
                    )}

                    {/* Prescribed meds shorthand list */}
                    <div className="pt-1.5 border-t border-slate-100 space-y-1">
                      {rx.medications.map((m, mIdx) => (
                        <div key={mIdx} className="text-[11px] flex justify-between font-medium text-slate-700">
                          <span>💊 {m.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{m.dosage} ({m.duration} {m.durationUnit})</span>
                        </div>
                      ))}
                    </div>

                    {onSelectRx && (
                      <button
                        onClick={() => onSelectRx(rx)}
                        className="w-full text-center text-[11px] font-semibold text-sky-600 hover:text-sky-700 border-t border-slate-100 pt-2 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-sky-600" /> Full Prescription Details
                        <ChevronRight className="w-3 h-3 text-sky-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
