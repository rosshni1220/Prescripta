/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Appointment, Patient } from "../types";
import { 
  Search, 
  Plus, 
  Clock, 
  Check, 
  Play, 
  Trash, 
  Database, 
  User, 
  Calendar,
  Layers,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { motion } from "motion/react";

interface PatientsQueueProps {
  appointments: Appointment[];
  patients: Patient[];
  onAddPatient: (patient: Omit<Patient, "id" | "createdAt">) => Patient;
  onAddAppointment: (appointment: { patientId: string; timeSlot: string; date: string }) => void;
  onUpdateStatus: (appointmentId: string, status: Appointment["status"]) => void;
  onDeleteAppointment: (appointmentId: string) => void;
  onStartPrescribing: (patient: Patient, appointmentId: string) => void;
  onMarkBilling: (appointmentId: string) => void;
  onSelectPatientForHistory: (patientId: string) => void;
}

export default function PatientsQueue({
  appointments,
  patients,
  onAddPatient,
  onAddAppointment,
  onUpdateStatus,
  onDeleteAppointment,
  onStartPrescribing,
  onMarkBilling,
  onSelectPatientForHistory
}: PatientsQueueProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | Appointment["status"]>("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState(true);

  // New Patient Form
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState<number | "">("");
  const [newGender, setNewGender] = useState<"Male" | "Female" | "Other">("Male");
  const [newMobile, setNewMobile] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newBloodGroup, setNewBloodGroup] = useState("");

  // New Appointment Form
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [newTimeSlot, setNewTimeSlot] = useState("10:00 AM");
  const [newDate, setNewDate] = useState(() => {
    // default to today's date
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [formError, setFormError] = useState("");

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch = apt.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      apt.patientMobile.includes(searchQuery);
    
    if (statusFilter === "All") {
      return matchesSearch;
    }
    return matchesSearch && apt.status === statusFilter;
  });

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (isExistingPatient) {
      if (!selectedPatientId) {
        setFormError("Please select a patient.");
        return;
      }
      onAddAppointment({
        patientId: selectedPatientId,
        timeSlot: newTimeSlot,
        date: newDate
      });
    } else {
      if (!newName || !newAge || !newMobile) {
        setFormError("Please fill out Name, Age, and Mobile number.");
        return;
      }
      const numAge = Number(newAge);
      if (isNaN(numAge) || numAge <= 0 || numAge > 150) {
        setFormError("Please enter a valid age.");
        return;
      }

      // Add patient
      const addedPatient = onAddPatient({
        name: newName,
        age: numAge,
        gender: newGender,
        mobile: newMobile,
        email: newEmail || undefined,
        bloodGroup: newBloodGroup || undefined
      });

      // Add appointment for this new patient
      onAddAppointment({
        patientId: addedPatient.id,
        timeSlot: newTimeSlot,
        date: newDate
      });
    }

    // Reset Form
    setNewName("");
    setNewAge("");
    setNewMobile("");
    setNewEmail("");
    setNewBloodGroup("");
    setSelectedPatientId("");
    setShowAddForm(false);
  };

  const statusColors: Record<Appointment["status"], string> = {
    Scheduled: "bg-blue-50 text-blue-700 border border-blue-200",
    "Checked-In": "bg-amber-50 text-amber-700 border border-amber-200",
    Engaging: "bg-purple-50 text-purple-700 border border-purple-200 ring-2 ring-purple-100",
    Billing: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Cancelled: "bg-gray-50 text-gray-500 border border-gray-200"
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Today's Appointment Queue</h2>
          <p className="text-sm text-slate-500">Track current patient movements, check-ins, and consultation stages</p>
        </div>

        <button
          id="btn-add-apt"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center justify-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg shadow-sm transition-all duration-150 gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? "Close Form" : "Book Appointment"}
        </button>
      </div>

      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-white rounded-xl shadow-sm border border-slate-200 space-y-4"
        >
          <div className="flex border-b border-slate-100 pb-2">
            <button
              onClick={() => { setIsExistingPatient(true); setFormError(""); }}
              className={`pb-2 px-4 text-sm font-medium border-b-2 mr-4 transition-all ${
                isExistingPatient ? "border-sky-600 text-sky-600" : "border-transparent text-slate-500"
              }`}
            >
              Registered Patient
            </button>
            <button
              onClick={() => { setIsExistingPatient(false); setFormError(""); }}
              className={`pb-2 px-4 text-sm font-medium border-b-2 transition-all ${
                !isExistingPatient ? "border-sky-600 text-sky-600" : "border-transparent text-slate-500"
              }`}
            >
              New Patient Enrollment
            </button>
          </div>

          <form onSubmit={handleCreateAppointment} className="space-y-4">
            {formError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {isExistingPatient ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Select Patient *</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-600"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.name} ({pat.age}Y/{pat.gender.charAt(0)}) - {pat.mobile}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Appointment Time *</label>
                  <input
                    type="text"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    placeholder="e.g. 10:30 AM"
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date *</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Age (Years) *</label>
                    <input
                      type="number"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value !== "" ? Number(e.target.value) : "")}
                      placeholder="e.g. 32"
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Gender *</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value as any)}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      placeholder="e.g. +91 99887 76655"
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="doctor.patient@gmail.com"
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Blood Group</label>
                    <select
                      value={newBloodGroup}
                      onChange={(e) => setNewBloodGroup(e.target.value)}
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    >
                      <option value="">Unknown</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Appointment Time *</label>
                    <input
                      type="text"
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      placeholder="e.g. 10:30 AM"
                      className="w-full text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex md:justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 shadow-sm transition"
              >
                Create Appointment
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Queue Filter Panel with search */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-4 space-y-4">
        {/* Dynamic status filters */}
        <div className="flex items-center overflow-x-auto pb-1 gap-1.5 scrollbar-thin scrollbar-thumb-slate-200">
          <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider mr-2">Filter state:</span>
          {(["All", "Scheduled", "Checked-In", "Engaging", "Billing", "Completed", "Cancelled"] as const).map((filter) => {
            const isSelected = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`py-1.5 px-3 rounded-full text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Search bar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-sm rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            placeholder="Search queue by patient's name or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table & list of queue */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-150 overflow-hidden">
        {filteredAppointments.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <Database className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-600">No appointments found</h3>
            <p className="text-xs text-slate-400">Try adjusting your filters or booking a new patient session.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-150 text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-12">No.</th>
                  <th className="py-3 px-4">Patient Name</th>
                  <th className="py-3 px-4">Demographics</th>
                  <th className="py-3 px-4">Slot/Time</th>
                  <th className="py-3 px-4">Status Map</th>
                  <th className="py-3 px-4 text-right">Actions Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.map((apt, index) => {
                  const correlatedPatient = patients.find((p) => p.id === apt.patientId) || {
                    id: apt.patientId,
                    name: apt.patientName,
                    age: apt.patientAge,
                    gender: apt.patientGender,
                    mobile: apt.patientMobile,
                    createdAt: ""
                  } as Patient;

                  return (
                    <motion.tr
                      key={apt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-50/50 transition duration-150"
                    >
                      <td className="py-4 px-4 font-mono text-xs text-center text-slate-400">
                        {apt.tokenNumber}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs uppercase flex-shrink-0">
                            {apt.patientName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <button
                              onClick={() => onSelectPatientForHistory(apt.patientId)}
                              className="font-medium text-slate-800 hover:text-sky-600 hover:underline text-sm transition text-left cursor-pointer"
                            >
                              {apt.patientName}
                            </button>
                            <div className="text-xs font-mono text-slate-500">{apt.patientMobile}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-sm">
                        <span>{apt.patientAge} Years</span>
                        <span className="mx-1.5 text-slate-300">|</span>
                        <span className="font-medium text-slate-700">{apt.patientGender}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 text-slate-600 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {apt.timeSlot}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-block text-[11px] font-mono leading-none py-1 px-2.5 rounded-full uppercase font-medium ${statusColors[apt.status]}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Transitions */}
                          {apt.status === "Scheduled" && (
                            <button
                              onClick={() => onUpdateStatus(apt.id, "Checked-In")}
                              className="p-1 px-2.5 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-md transition inline-flex items-center gap-1 cursor-pointer"
                              title="Mark Checked In"
                            >
                              <Check className="w-3 h-3" /> Check In
                            </button>
                          )}

                          {(apt.status === "Scheduled" || apt.status === "Checked-In" || apt.status === "Engaging") && (
                            <button
                              onClick={() => onStartPrescribing(correlatedPatient, apt.id)}
                              className="p-1 px-2.5 text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 hover:border-purple-300 rounded-md transition inline-flex items-center gap-1 cursor-pointer"
                              title="Engage Patient"
                            >
                              <Play className="w-3 h-3 text-purple-600" /> Write Rx
                            </button>
                          )}

                          {apt.status === "Billing" && (
                            <button
                              onClick={() => onMarkBilling(apt.id)}
                              className="p-1 px-2.5 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-md transition inline-flex items-center gap-1 cursor-pointer"
                              title="Receive Payment"
                            >
                              <Check className="w-3 h-3" /> Complete (Collect Fee)
                            </button>
                          )}

                          {apt.status !== "Completed" && apt.status !== "Cancelled" && (
                            <button
                              onClick={() => onUpdateStatus(apt.id, "Cancelled")}
                              className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-slate-50 transition cursor-pointer"
                              title="Cancel Appointment"
                            >
                              <ArchiveIcon className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => onDeleteAppointment(apt.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-50 transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-150 rounded-xl">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-500">Current Queue Health:</span>
          <span className="text-xs font-semibold text-slate-700">
            {appointments.filter(a => ["Checked-In", "Engaging"].includes(a.status)).length} Active Consultations
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">Scheduled:</span>
          <span className="text-xs font-semibold text-slate-700">
            {appointments.filter(a => a.status === "Scheduled").length} pending
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-xs text-slate-500">Completed:</span>
          <span className="text-xs font-semibold text-emerald-700">
            {appointments.filter(a => a.status === "Completed").length} done
          </span>
        </div>
      </div>
    </div>
  );
}

// Inline fallback icon for Cancel/Archive
function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
