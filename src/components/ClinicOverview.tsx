/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Appointment, Patient, Prescription, ClinicStats } from "../types";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Activity,
  ArrowUpRight
} from "lucide-react";

interface ClinicOverviewProps {
  stats: ClinicStats;
  appointments: Appointment[];
  patients: Patient[];
  prescriptions: Prescription[];
  onSelectPatient: (patientId: string) => void;
  onSelectRx: (prescription: Prescription) => void;
}

export default function ClinicOverview({
  stats,
  appointments,
  patients,
  prescriptions,
  onSelectPatient,
  onSelectRx
}: ClinicOverviewProps) {
  // Let's compute custom telemetry from state
  const completedApts = appointments.filter(a => a.status === "Completed").length;
  const activeApts = appointments.filter(a => ["Checked-In", "Engaging"].includes(a.status)).length;
  const waitingApts = appointments.filter(a => a.status === "Scheduled").length;

  // Compute stats on fly
  const totalRevenue = prescriptions.reduce((acc, rx) => acc + rx.billAmount, 0) + 
    appointments.filter(a => a.status === "Completed").reduce((acc, a) => acc + 500, 0); // consultations fee fallback

  const unpaidApts = appointments.filter(a => a.status === "Billing").length;

  // 1. Hourly timeline breakdown (Visualizing Load)
  const hourlyData = [
    { hour: "09:00 AM", count: appointments.filter(a => a.timeSlot.startsWith("09")).length },
    { hour: "10:00 AM", count: appointments.filter(a => a.timeSlot.startsWith("10")).length },
    { hour: "11:00 AM", count: appointments.filter(a => a.timeSlot.startsWith("11")).length },
    { hour: "12:00 PM", count: appointments.filter(a => a.timeSlot.startsWith("12")).length },
    { hour: "01:00 PM", count: appointments.filter(a => a.timeSlot.startsWith("01")).length },
    { hour: "05:00 PM", count: appointments.filter(a => a.timeSlot.startsWith("05") || a.timeSlot.startsWith("17")).length },
    { hour: "06:00 PM", count: appointments.filter(a => a.timeSlot.startsWith("06") || a.timeSlot.startsWith("18")).length }
  ];

  const maxHourCount = Math.max(...hourlyData.map(d => d.count), 1);

  // 2. Gender Demographic ratios
  const maleCount = patients.filter(p => p.gender === "Male").length;
  const femaleCount = patients.filter(p => p.gender === "Female").length;
  const otherCount = patients.filter(p => p.gender === "Other").length;
  const totalPatients = patients.length || 1;

  const malePercent = Math.round((maleCount / totalPatients) * 100);
  const femalePercent = Math.round((femaleCount / totalPatients) * 100);
  const otherPercent = Math.round((otherCount / totalPatients) * 100);

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono font-bold text-slate-400">Total Patients</span>
            <p className="text-xl font-bold text-slate-800">{patients.length}</p>
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Life-time registered
            </span>
          </div>
        </div>

        {/* Appointments Queue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono font-bold text-slate-400">Today's Visits</span>
            <p className="text-xl font-bold text-slate-800">{appointments.length}</p>
            <span className="text-[10px] text-slate-500 font-medium">
              {completedApts} Done / {activeApts} Active
            </span>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono font-bold text-slate-400">Day's Income</span>
            <p className="text-xl font-bold text-slate-800">₹{totalRevenue}</p>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              100% Secure Digital Tracker
            </span>
          </div>
        </div>

        {/* Pending Invoices */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs uppercase font-mono font-bold text-slate-400">Due Payments</span>
            <p className="text-xl font-bold text-slate-800">{unpaidApts}</p>
            <span className="text-[10px] text-amber-600 font-medium">
              Awaiting billing checkouts
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Load Distribution (Responsive Hour Charts) */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Queue Load by Time Slots</h3>
              <span className="text-[10px] font-mono bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold">TODAY'S GRAPH</span>
            </div>
            <p className="text-xs text-slate-400 mb-4">Visualize peak consultation hours to adjust staffing or breaks</p>
          </div>

          <div className="flex items-end justify-between gap-1 h-36 pt-4 border-b border-slate-100">
            {hourlyData.map((d, i) => {
              const heightPct = Math.round((d.count / maxHourCount) * 100);
              return (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full flex items-end justify-center h-28">
                    {/* Tooltip on hover */}
                    <span className="absolute -top-6 bg-slate-800 text-white font-mono text-[9px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                      {d.count} booked
                    </span>
                    <div 
                      className="w-4 sm:w-6 bg-indigo-500 rounded-t-xs transition-all duration-300 group-hover:bg-indigo-600"
                      style={{ height: `${Math.max(heightPct, 5)}%` }}
                    />
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1.5 leading-none text-center">
                    {d.hour.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Patient Demographics Analysis */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-1">Gender & age Distribution</h3>
            <p className="text-xs text-slate-400">Insightful patient ratios automatically synced with active database</p>
          </div>

          <div className="flex-1 flex items-center justify-center p-2">
            <div className="flex items-center gap-6 w-full">
              {/* Pie/Donut Mockup with SVG */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#E2E8F0" strokeWidth="3" />
                  {/* Male Arc */}
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="#4F46E5" 
                    strokeWidth="3.2" 
                    strokeDasharray={`${malePercent} ${100 - malePercent}`} 
                    strokeDashoffset="0" 
                  />
                  {/* Female Arc */}
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="#EC4899" 
                    strokeWidth="3.2" 
                    strokeDasharray={`${femalePercent} ${100 - femalePercent}`} 
                    strokeDashoffset={`-${malePercent}`} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center font-mono leading-none">
                  <span className="text-base font-bold text-slate-800">{totalPatients}</span>
                  <span className="text-[8px] text-slate-400 uppercase mt-0.5">Total</span>
                </div>
              </div>

              {/* Legends with percentage */}
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block" /> Male
                  </span>
                  <span className="font-mono text-slate-500">{maleCount} ({malePercent}%)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-pink-500 inline-block" /> Female
                  </span>
                  <span className="font-mono text-slate-500">{femaleCount} ({femalePercent}%)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" /> Other
                  </span>
                  <span className="font-mono text-slate-500">{otherCount} ({otherPercent}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recents Table Panel */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Recent Prescription Logs</h3>
          <span className="text-[10px] font-mono text-slate-400">Chronological list of issued consultations</span>
        </div>

        {prescriptions.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No prescriptions drafted yet. Try consulting a patient.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 font-mono text-[9px] uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-4 font-bold">Prescription ID</th>
                  <th className="py-2.5 px-4 font-bold">Patient</th>
                  <th className="py-2.5 px-4 font-bold">Diagnosis</th>
                  <th className="py-2.5 px-4 font-bold">Drugs count</th>
                  <th className="py-2.5 px-4 font-bold text-right">Settled Amount</th>
                  <th className="py-2.5 px-4 font-bold text-right">Rx Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescriptions.slice(0, 5).map((rx) => (
                  <tr key={rx.id} className="hover:bg-slate-50/30 transition text-slate-700">
                    <td className="py-3 px-4 font-mono font-bold text-slate-600">
                      Rx-{rx.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectPatient(rx.patientId)}
                        className="font-semibold text-slate-800 hover:text-sky-600 hover:underline cursor-pointer"
                      >
                        {rx.patientName}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate">
                      {rx.diagnosis.join(", ") || "Diagnostic Consultation"}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {rx.medications.length} items
                    </td>
                    <td className="py-3 px-4 font-mono text-right font-bold text-emerald-700">
                      ₹{rx.billAmount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectRx(rx)}
                        className="p-1 px-2.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 rounded-md transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3 h-3 text-indigo-600" /> Open Sheet
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
