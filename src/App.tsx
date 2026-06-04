/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  DoctorProfile, 
  Patient, 
  Appointment, 
  Prescription, 
  Vitals, 
  Medication 
} from "./types";
import { 
  DEFAULT_DOCTOR_PROFILE, 
  INITIAL_PATIENTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_PRESCRIPTIONS 
} from "./data";
import { 
  PRESET_COMPLAINTS, 
  PRESET_DIAGNOSES, 
  PRESET_LAB_TESTS, 
  PRESET_MEDICATIONS, 
  PresetMedType 
} from "./presets";
import { 
  Calendar, 
  Users, 
  FileText, 
  Settings as SettingsIcon, 
  Activity, 
  Plus, 
  Search, 
  UserPlus, 
  Clipboard, 
  Printer, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  Stethoscope, 
  TrendingUp, 
  BookOpen, 
  Trash2, 
  Edit3, 
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Heart,
  ChevronRight,
  Sparkles,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import PatientsQueue from "./components/PatientsQueue";

// Firebase Integration imports
import { auth, db, handleFirestoreError, OperationType } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import AuthScreen from "./components/AuthScreen";

export default function App() {
  // Authentication & Session state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Navigation State
  const [activeTab, setActiveTab] = useState<"dashboard" | "queue" | "patients" | "prescriptions" | "settings">("dashboard");

  // Dynamic States from Firestore
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile>(DEFAULT_DOCTOR_PROFILE);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  // Active appointment context for middle-panel consultation
  const [activeAppointmentId, setActiveAppointmentId] = useState<string>("");

  // Live Consultation State
  const [activeComplaints, setActiveComplaints] = useState<string[]>([]);
  const [complaintInput, setComplaintInput] = useState("");
  
  const [vitals, setVitals] = useState<Vitals>({
    bp: "", pulse: undefined, temp: undefined, weight: undefined, height: undefined, bmi: undefined, spo2: undefined
  });
  
  const [activeDiagnoses, setActiveDiagnoses] = useState<string[]>([]);
  const [diagnosisInput, setDiagnosisInput] = useState("");

  const [activeMedications, setActiveMedications] = useState<Medication[]>([]);
  const [medSearchQuery, setMedSearchQuery] = useState("");
  const [customMedName, setCustomMedName] = useState("");
  const [customMedDosage, setCustomMedDosage] = useState("1-0-1");
  const [customMedFrequency, setCustomMedFrequency] = useState<Medication["frequency"]>("Twice daily");
  const [customMedTiming, setCustomMedTiming] = useState<Medication["timing"]>("After Food");
  const [customMedDuration, setCustomMedDuration] = useState<number>(5);
  const [customMedDurationUnit, setCustomMedDurationUnit] = useState<Medication["durationUnit"]>("Days");
  const [customMedInstruction, setCustomMedInstruction] = useState("");

  const [activeLabTests, setActiveLabTests] = useState<string[]>([]);
  const [labInput, setLabInput] = useState("");

  const [advice, setAdvice] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [internalNotesTab, setInternalNotesTab] = useState<"edit" | "preview">("edit");
  const [followUpDays, setFollowUpDays] = useState<string>("7"); // standard follow-up list choice

  // Prescription print preview modal context
  const [prescriptionToPreview, setPrescriptionToPreview] = useState<Prescription | null>(null);

  // Profile history drilldown state
  const [selectedPatientHistoryId, setSelectedPatientHistoryId] = useState<string | null>(null);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Listen to Firestore updates matching the doctorId query in real-time
  useEffect(() => {
    if (!currentUser) return;

    // Listen to Patients
    const qPatients = query(collection(db, "patients"), where("doctorId", "==", currentUser.uid));
    const unsubscribePatients = onSnapshot(qPatients, (snapshot) => {
      const list: Patient[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data() as Patient, id: docSnap.id });
      });
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setPatients(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "patients");
    });

    // Listen to Appointments
    const qAppointments = query(collection(db, "appointments"), where("doctorId", "==", currentUser.uid));
    const unsubscribeAppointments = onSnapshot(qAppointments, (snapshot) => {
      const list: Appointment[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data() as Appointment, id: docSnap.id });
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setAppointments(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "appointments");
    });

    // Listen to Prescriptions
    const qPrescriptions = query(collection(db, "prescriptions"), where("doctorId", "==", currentUser.uid));
    const unsubscribePrescriptions = onSnapshot(qPrescriptions, (snapshot) => {
      const list: Prescription[] = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data() as Prescription, id: docSnap.id });
      });
      list.sort((a, b) => b.date.localeCompare(a.date));
      setPrescriptions(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "prescriptions");
    });

    // Listen to Doctor Profile
    const docRef = doc(db, "doctors", currentUser.uid);
    const unsubscribeProfile = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setDoctorProfile(docSnap.data() as DoctorProfile);
      } else {
        // Create initial default clinician detail card if missing
        const initialProfile: DoctorProfile = {
          name: currentUser.displayName || "Dr. Medical Practitioner",
          specialty: "Clinical Medicine",
          degree: "M.B.B.S.",
          regNo: "MC-12345",
          clinicName: "My Digital Practice",
          address: "123 Main Street",
          phone: "+91 99999 99999",
          email: currentUser.email || "",
          consultationFee: 500
        };
        setDoc(doc(db, "doctors", currentUser.uid), initialProfile)
          .catch(err => handleFirestoreError(err, OperationType.WRITE, `doctors/${currentUser.uid}`));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `doctors/${currentUser.uid}`);
    });

    return () => {
      unsubscribePatients();
      unsubscribeAppointments();
      unsubscribePrescriptions();
      unsubscribeProfile();
    };
  }, [currentUser]);

  // Seed demo data helper for empty workspaces
  const handleSeedDemoData = async () => {
    if (!currentUser) return;
    try {
      // Patients
      for (const p of INITIAL_PATIENTS) {
        await setDoc(doc(db, "patients", p.id), { ...p, doctorId: currentUser.uid });
      }
      // Appointments
      for (const a of INITIAL_APPOINTMENTS) {
        await setDoc(doc(db, "appointments", a.id), { ...a, doctorId: currentUser.uid });
      }
      // Prescriptions
      for (const rx of INITIAL_PRESCRIPTIONS) {
        await setDoc(doc(db, "prescriptions", rx.id), { ...rx, doctorId: currentUser.uid });
      }
      alert("Demo clinic records bootstrapped successfully in your personal workspace!");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "patients");
    }
  };

  // Sync active appointment changes with live editor fields
  useEffect(() => {
    if (!activeAppointmentId) return;
    const activeApt = appointments.find(a => a.id === activeAppointmentId);
    if (!activeApt) return;

    // Load any existing draft values or defaults
    // For safety, let's load a standard empty consultation draft or any matching prescription written on this day
    const existingRx = prescriptions.find(r => r.patientId === activeApt.patientId && r.date === activeApt.date);
    if (existingRx) {
      setActiveComplaints(existingRx.complaints);
      setVitals(existingRx.vitals);
      setActiveDiagnoses(existingRx.diagnosis);
      setActiveMedications(existingRx.medications);
      setActiveLabTests(existingRx.labTests);
      setAdvice(existingRx.advice);
      setInternalNotes(existingRx.internalNotes || "");
      setFollowUpDays(existingRx.followUpDate ? "7" : "No Follow Up");
    } else {
      // fresh consultation draft
      setActiveComplaints([]);
      setComplaintInput("");
      setVitals({ bp: "", pulse: undefined, temp: undefined, weight: undefined, height: undefined, bmi: undefined, spo2: undefined });
      setActiveDiagnoses([]);
      setDiagnosisInput("");
      setActiveMedications([]);
      setActiveLabTests([]);
      setAdvice("");
      setInternalNotes("");
      setFollowUpDays("7");
    }
  }, [activeAppointmentId, appointments]);

  // Auto calculate BMI when weight or height changes
  useEffect(() => {
    if (vitals.weight && vitals.height) {
      const heightInMeters = vitals.height / 100;
      const bmiVal = Number((vitals.weight / (heightInMeters * heightInMeters)).toFixed(1));
      setVitals(prev => ({ ...prev, bmi: bmiVal }));
    }
  }, [vitals.weight, vitals.height]);

  // Handlers for Appointment workflow
  const handleAddPatient = (newPatData: Omit<Patient, "id" | "createdAt">): Patient => {
    const newId = `pat-${Date.now()}`;
    const today = new Date().toISOString().split("T")[0];
    const createdPatient: Patient = {
      ...newPatData,
      id: newId,
      createdAt: today,
      doctorId: currentUser?.uid || ""
    };
    if (currentUser) {
      setDoc(doc(db, "patients", newId), createdPatient)
        .catch(err => handleFirestoreError(err, OperationType.CREATE, `patients/${newId}`));
    } else {
      setPatients(prev => [createdPatient, ...prev]);
    }
    return createdPatient;
  };

  const handleAddAppointment = (newAptData: { patientId: string; timeSlot: string; date: string }) => {
    const pat = patients.find(p => p.id === newAptData.patientId);
    if (!pat) return;

    const newId = `apt-${Date.now()}`;
    const tokenNum = appointments.filter(a => a.date === newAptData.date).length + 1;

    const newApt: Appointment = {
      id: newId,
      patientId: pat.id,
      patientName: pat.name,
      patientAge: pat.age,
      patientGender: pat.gender,
      patientMobile: pat.mobile,
      timeSlot: newAptData.timeSlot,
      date: newAptData.date,
      status: "Scheduled",
      tokenNumber: tokenNum,
      doctorId: currentUser?.uid || ""
    };

    if (currentUser) {
      setDoc(doc(db, "appointments", newId), newApt)
        .catch(err => handleFirestoreError(err, OperationType.CREATE, `appointments/${newId}`));
    } else {
      setAppointments(prev => [newApt, ...prev]);
    }
  };

  const handleUpdateStatus = (appointmentId: string, status: Appointment["status"]) => {
    if (currentUser) {
      updateDoc(doc(db, "appointments", appointmentId), { status })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`));
    } else {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status } : a));
    }
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (currentUser) {
      deleteDoc(doc(db, "appointments", appointmentId))
        .catch(err => handleFirestoreError(err, OperationType.DELETE, `appointments/${appointmentId}`));
    } else {
      setAppointments(prev => prev.filter(a => a.id !== appointmentId));
    }
    if (activeAppointmentId === appointmentId) {
      setActiveAppointmentId("");
    }
  };

  const handleStartPrescribingInTab = (patient: Patient, appointmentId: string) => {
    if (currentUser) {
      updateDoc(doc(db, "appointments", appointmentId), { status: "Engaging" as const })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`));
    } else {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: "Engaging" as const } : a));
    }
    setActiveAppointmentId(appointmentId);
    setActiveTab("dashboard");
  };

  const handleMarkBillingAndPay = (appointmentId: string) => {
    if (currentUser) {
      updateDoc(doc(db, "appointments", appointmentId), { status: "Completed" as const })
        .catch(err => handleFirestoreError(err, OperationType.UPDATE, `appointments/${appointmentId}`));
    } else {
      setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: "Completed" as const } : a));
    }
  };

  const handleInsertFormat = (prefix: string, suffix: string) => {
    const textarea = document.getElementById("internal-notes-textarea") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    const replacement = prefix + (selectedText || "text") + suffix;
    const newValue = text.substring(0, start) + replacement + text.substring(end);
    
    setInternalNotes(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText || "text").length
      );
    }, 10);
  };

  // Add items custom
  const handleAddComplaint = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !activeComplaints.includes(trimmed)) {
      setActiveComplaints(prev => [...prev, trimmed]);
    }
    setComplaintInput("");
  };

  const handleRemoveComplaint = (index: number) => {
    setActiveComplaints(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddDiagnosis = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !activeDiagnoses.includes(trimmed)) {
      setActiveDiagnoses(prev => [...prev, trimmed]);
    }
    setDiagnosisInput("");
  };

  const handleRemoveDiagnosis = (index: number) => {
    setActiveDiagnoses(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddLabTest = (val: string) => {
    const trimmed = val.trim();
    if (trimmed && !activeLabTests.includes(trimmed)) {
      setActiveLabTests(prev => [...prev, trimmed]);
    }
    setLabInput("");
  };

  const handleRemoveLabTest = (index: number) => {
    setActiveLabTests(prev => prev.filter((_, i) => i !== index));
  };

  // Medication handlers
  const handleAddMedicationPreset = (med: PresetMedType) => {
    const newMed: Medication = {
      name: med.name,
      dosage: med.defaultDosage,
      frequency: med.defaultFrequency,
      duration: med.defaultDuration,
      durationUnit: "Days",
      timing: med.defaultTiming,
      instruction: ""
    };
    setActiveMedications(prev => [...prev, newMed]);
  };

  const handleAddCustomMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMedName.trim()) return;

    const newMed: Medication = {
      name: customMedName.trim(),
      dosage: customMedDosage,
      frequency: customMedFrequency,
      duration: customMedDuration,
      durationUnit: customMedDurationUnit,
      timing: customMedTiming,
      instruction: customMedInstruction.trim() || undefined
    };

    setActiveMedications(prev => [...prev, newMed]);
    setCustomMedName("");
    setCustomMedInstruction("");
  };

  const handleRemoveMedication = (index: number) => {
    setActiveMedications(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAndPrintPrescription = () => {
    const activeApt = appointments.find(a => a.id === activeAppointmentId);
    if (!activeApt) return;

    // Determine follow-up date string
    let followUpDate: string | undefined = undefined;
    if (followUpDays !== "No Follow Up") {
      const days = parseInt(followUpDays);
      if (!isNaN(days)) {
        const today = new Date();
        today.setDate(today.getDate() + days);
        followUpDate = today.toISOString().split("T")[0];
      }
    }

    const newId = `rx-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newRx: Prescription = {
      id: newId,
      patientId: activeApt.patientId,
      patientName: activeApt.patientName,
      patientAge: activeApt.patientAge,
      patientGender: activeApt.patientGender,
      date: new Date().toISOString().split("T")[0],
      complaints: activeComplaints,
      vitals: vitals,
      diagnosis: activeDiagnoses,
      medications: activeMedications,
      labTests: activeLabTests,
      advice: advice,
      internalNotes: internalNotes.trim(),
      followUpDate,
      billAmount: Number(doctorProfile.consultationFee),
      isPaid: false,
      doctorId: currentUser?.uid || ""
    };

    if (currentUser) {
      // Set prescription and cascade-update appointment status
      setDoc(doc(db, "prescriptions", newId), newRx)
        .then(() => {
          updateDoc(doc(db, "appointments", activeAppointmentId), { status: "Billing" as const })
            .catch(err => handleFirestoreError(err, OperationType.UPDATE, `appointments/${activeAppointmentId}`));
        })
        .catch(err => handleFirestoreError(err, OperationType.WRITE, `prescriptions/${newId}`));
    } else {
      // Update prescription database locally
      setPrescriptions(prev => [newRx, ...prev]);
      // Transition appointment to "Billing" stage
      setAppointments(prev => prev.map(a => a.id === activeAppointmentId ? { ...a, status: "Billing" as const } : a));
    }

    // Instantly open preview state
    setPrescriptionToPreview(newRx);
  };

  // Helper stats computed values
  const activeConsultationCount = appointments.filter(a => ["Checked-In", "Engaging"].includes(a.status)).length;
  
  // Calculate total fee collections today
  const totalFinancialSummary = prescriptions.reduce((acc, rx) => {
    return acc + rx.billAmount;
  }, 0);

  const pendingInvoicesCount = appointments.filter(a => a.status === "Billing").length;

  // Render variables
  const currentConsultingApt = appointments.find(a => a.id === activeAppointmentId);
  const filteredPresetMedications = medSearchQuery 
    ? PRESET_MEDICATIONS.filter(m => m.name.toLowerCase().includes(medSearchQuery.toLowerCase()))
    : PRESET_MEDICATIONS.slice(0, 5);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs">
        <Activity className="w-8 h-8 text-indigo-500 animate-pulse mb-3" />
        <span>CONSTRUCTING CLINIC WORKSPACE...</span>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen 
        onAuthSuccess={(uid, profile) => {
          setCurrentUser(auth.currentUser);
          setDoctorProfile(profile);
        }} 
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav id="nav-sidebar" className="w-16 flex flex-col items-center py-6 bg-[#1E293B] text-white space-y-6 shrink-0 z-30">
        <div id="clinic-logo" className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center font-bold text-lg shadow-md tracking-wider">
          Rx
        </div>
        
        <div className="flex flex-col space-y-4 opacity-90 flex-1 pt-6">
          <button
            id="tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`p-2.5 rounded-xl transition cursor-pointer relative ${
              activeTab === "dashboard" ? "bg-sky-500/25 text-sky-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="EHR Consultation Workspace"
          >
            <Stethoscope className="w-5.5 h-5.5" />
            {activeTab === "dashboard" && (
              <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-sky-500 rounded-r" />
            )}
          </button>

          <button
            id="tab-queue"
            onClick={() => setActiveTab("queue")}
            className={`p-2.5 rounded-xl transition cursor-pointer relative ${
              activeTab === "queue" ? "bg-sky-500/25 text-sky-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Patient Queues"
          >
            <Clock className="w-5.5 h-5.5" />
            {appointments.filter(a => ["Checked-In", "Engaging"].includes(a.status)).length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
            )}
            {activeTab === "queue" && (
              <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-sky-500 rounded-r" />
            )}
          </button>

          <button
            id="tab-patients"
            onClick={() => setActiveTab("patients")}
            className={`p-2.5 rounded-xl transition cursor-pointer relative ${
              activeTab === "patients" ? "bg-sky-500/25 text-sky-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Patient Ledger"
          >
            <Users className="w-5.5 h-5.5" />
            {activeTab === "patients" && (
              <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-sky-500 rounded-r" />
            )}
          </button>

          <button
            id="tab-prescriptions"
            onClick={() => setActiveTab("prescriptions")}
            className={`p-2.5 rounded-xl transition cursor-pointer relative ${
              activeTab === "prescriptions" ? "bg-sky-500/25 text-sky-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Rx Records Ledger"
          >
            <FileText className="w-5.5 h-5.5" />
            {activeTab === "prescriptions" && (
              <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-sky-500 rounded-r" />
            )}
          </button>

          <button
            id="tab-settings"
            onClick={() => setActiveTab("settings")}
            className={`p-2.5 rounded-xl transition cursor-pointer relative ${
              activeTab === "settings" ? "bg-sky-500/25 text-sky-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
            }`}
            title="Doctor Settings"
          >
            <SettingsIcon className="w-5.5 h-5.5" />
            {activeTab === "settings" && (
              <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-sky-500 rounded-r" />
            )}
          </button>
        </div>

        {/* Bottom Profile initials & Logout */}
        <div className="mt-auto flex flex-col items-center gap-3">
          <div 
            onClick={() => setActiveTab("settings")}
            className="w-9 h-9 rounded-xl bg-slate-700/60 flex items-center justify-center font-bold text-xs text-sky-300 border border-slate-600 hover:border-sky-400 transition duration-150 cursor-pointer animate-pulse"
            title="Doctor Profile Settings"
          >
            {doctorProfile.name.split(" ").filter(Boolean)[1]?.charAt(0) || "MD"}
          </div>

          <button
            onClick={async () => {
              if (confirm("Are you sure you want to sign out of the clinician console?")) {
                await signOut(auth);
                setCurrentUser(null);
                setActiveTab("dashboard");
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
            title="Sign Out of Console"
          >
            <LogOut className="w-5.5 h-5.5" />
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header id="header" className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center space-x-3">
            <h1 className="text-base font-bold text-slate-800 tracking-tight">Prescripta Clinic Portal</h1>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 rounded-md py-1 px-2.5 uppercase font-mono">
              {doctorProfile.clinicName}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-xs font-bold text-slate-800">{doctorProfile.name}</p>
              <p className="text-[10px] text-slate-500">{doctorProfile.specialty}</p>
            </div>
            
            <button
              id="header-btn-new-apt"
              onClick={() => {
                setActiveTab("queue");
              }}
              className="bg-sky-600 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-xs transition duration-150 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Book Session
            </button>
          </div>
        </header>

        {/* Tab content screens */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "dashboard" && (
            <div className="h-full flex p-4 space-x-4 overflow-hidden">
              {/* Left Panel: High Density Appointment Queue */}
              <section id="panel-queue-list" className="w-[280px] bg-white border border-slate-200 rounded-xl flex flex-col shadow-xs shrink-0">
                <div className="p-3.5 border-b border-slate-200 flex justify-between items-center bg-slate-50/70">
                  <h2 className="font-bold text-[11px] uppercase tracking-wider text-slate-500 font-mono">Queue flow</h2>
                  <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {appointments.filter(a => a.date === new Date().toISOString().split("T")[0]).length} TODAY
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin">
                  {appointments.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 space-y-3">
                      <p>No sessions booked for today.</p>
                      <button
                        onClick={handleSeedDemoData}
                        className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/25 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold tracking-tight uppercase cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Seed demo logs
                      </button>
                    </div>
                  ) : (
                    appointments.map((apt) => {
                      const isActive = activeAppointmentId === apt.id;
                      return (
                        <div
                          key={apt.id}
                          onClick={() => {
                            setActiveAppointmentId(apt.id);
                            if (apt.status === "Scheduled" || apt.status === "Checked-In") {
                              handleUpdateStatus(apt.id, "Engaging");
                            }
                          }}
                          className={`p-3 transition duration-150 cursor-pointer ${
                            isActive 
                              ? "bg-sky-50/70 border-l-4 border-sky-600 shadow-xs" 
                              : "hover:bg-slate-50 border-l-4 border-transparent"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              Token #{apt.tokenNumber}
                            </span>
                            <span className={`text-[9px] font-mono font-bold uppercase py-0.5 px-1.5 rounded-md ${
                              apt.status === "Engaging" 
                                ? "bg-purple-100 text-purple-700" 
                                : apt.status === "Checked-In" 
                                ? "bg-amber-100 text-amber-700"
                                : apt.status === "Billing"
                                ? "bg-blue-100 text-blue-700"
                                : apt.status === "Completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}>
                              {apt.status}
                            </span>
                          </div>
                          
                          <p className="text-sm font-bold text-slate-800 mt-1">{apt.patientName}</p>
                          
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-[10px] text-slate-500 uppercase tracking-tight">
                              {apt.patientAge}Y / {apt.patientGender}
                            </p>
                            <span className="text-[10px] font-mono text-slate-500 font-medium">
                              {apt.timeSlot}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Middle Panel: Active Prescription Consultation Panel */}
              <section id="panel-consultation" className="flex-1 bg-white border border-slate-200 rounded-xl flex flex-col shadow-xs overflow-hidden">
                {currentConsultingApt ? (
                  <div className="h-full flex flex-col overflow-hidden">
                    {/* Active Patient Details Header bar */}
                    <div className="p-4 border-b border-slate-200 bg-slate-50/40 flex justify-between items-center shrink-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm">
                          {currentConsultingApt.patientName.split(" ").map(w => w[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-extrabold text-slate-800">{currentConsultingApt.patientName}</p>
                            <span className="text-xs bg-slate-200 text-slate-700 rounded-md py-0.5 px-1.5 font-bold">
                              {currentConsultingApt.patientAge} yrs
                            </span>
                            <span className="text-xs bg-sky-50 text-sky-700 font-semibold border border-sky-100 rounded-md py-0.5 px-1.5">
                              {currentConsultingApt.patientGender}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                            <span>Mobile: <strong className="text-slate-700">{currentConsultingApt.patientMobile}</strong></span>
                            <span>|</span>
                            <span>Token No: <strong className="text-slate-700">#{currentConsultingApt.tokenNumber}</strong></span>
                            <span>|</span>
                            <span>ID: <strong className="text-slate-700">{currentConsultingApt.patientId}</strong></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedPatientHistoryId(currentConsultingApt.patientId);
                            setActiveTab("patients");
                          }}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 bg-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" /> Clinical Log
                        </button>
                      </div>
                    </div>

                    {/* Prescription clinical editor splits */}
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 xl:grid-cols-12 gap-5">
                      
                      {/* Left Block: Findings state (Chief complaints, vitals, diagnosis) */}
                      <div className="xl:col-span-5 space-y-4">
                        {/* Chief Complaints Block */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                            Chief Complaints
                          </label>
                          
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={complaintInput}
                              onChange={(e) => setComplaintInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddComplaint(complaintInput);
                                }
                              }}
                              placeholder="e.g. Dry cough, High fever (Press Enter)"
                              className="flex-1 bg-white border border-slate-250 text-xs rounded-lg px-2.5 py-1.5 text-slate-850 focus:outline-none focus:border-sky-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComplaint(complaintInput)}
                              className="px-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
                            >
                              Add
                            </button>
                          </div>

                          {/* Quick preset pills list */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {PRESET_COMPLAINTS.filter(c => !activeComplaints.includes(c)).slice(0, 7).map((pComp) => (
                              <button
                                key={pComp}
                                onClick={() => handleAddComplaint(pComp)}
                                className="text-[10px] bg-sky-50/80 hover:bg-sky-100 text-sky-800 py-0.5 px-2 rounded-md transition border border-sky-100/50 cursor-pointer"
                              >
                                + {pComp}
                              </button>
                            ))}
                          </div>

                          {/* Selected complaints */}
                          {activeComplaints.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 m-t-2">
                              {activeComplaints.map((c, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-slate-800 text-white rounded-lg text-[10px] leading-none py-1.5 px-2.5 font-medium">
                                  {c}
                                  <button
                                    onClick={() => handleRemoveComplaint(i)}
                                    className="hover:text-red-300 font-bold ml-1.5 focus:outline-none"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Vitals Board inputs */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-3">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                            Clinical Vitals
                          </label>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">BP (mmHg)</span>
                              <input
                                type="text"
                                placeholder="120/80"
                                value={vitals.bp || ""}
                                onChange={(e) => setVitals(prev => ({ ...prev, bp: e.target.value }))}
                                className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500 font-mono text-slate-800 text-center"
                              />
                            </div>
                            
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">Pulse (bpm)</span>
                              <input
                                type="number"
                                placeholder="72"
                                value={vitals.pulse || ""}
                                onChange={(e) => setVitals(prev => ({ ...prev, pulse: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500 font-mono text-slate-800 text-center"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">Temp (°F)</span>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="98.6"
                                value={vitals.temp || ""}
                                onChange={(e) => setVitals(prev => ({ ...prev, temp: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500 font-mono text-slate-800 text-center"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between">
                                <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">Wt (kg)</span>
                              </div>
                              <input
                                type="number"
                                placeholder="68"
                                value={vitals.weight || ""}
                                onChange={(e) => setVitals(prev => ({ ...prev, weight: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500 font-mono text-slate-800 text-center"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5 font-medium">Ht (cm)</span>
                              <input
                                type="number"
                                placeholder="170"
                                value={vitals.height || ""}
                                onChange={(e) => setVitals(prev => ({ ...prev, height: e.target.value ? Number(e.target.value) : undefined }))}
                                className="w-full bg-white border border-slate-250 rounded-lg p-2 text-xs focus:outline-none focus:border-sky-500 font-mono text-slate-800 text-center"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5 font-medium">BMI (auto)</span>
                              <div className="w-full bg-slate-100 text-slate-700 rounded-lg p-2 text-xs font-mono font-bold text-center border border-slate-200">
                                {vitals.bmi || "--"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Diagnoses with Presets */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                            Diagnosis
                          </label>

                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={diagnosisInput}
                              onChange={(e) => setDiagnosisInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddDiagnosis(diagnosisInput);
                                }
                              }}
                              placeholder="e.g. Essential Hypertension, Acute Tonsillitis"
                              className="flex-1 bg-white border border-slate-250 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sky-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddDiagnosis(diagnosisInput)}
                              className="px-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold"
                            >
                              Add
                            </button>
                          </div>

                          {/* Diagnosis presets */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {PRESET_DIAGNOSES.filter(d => !activeDiagnoses.includes(d)).slice(0, 5).map((pDiag) => (
                              <button
                                key={pDiag}
                                onClick={() => handleAddDiagnosis(pDiag)}
                                className="text-[10px] bg-sky-50/80 hover:bg-sky-100 text-sky-800 py-0.5 px-2 rounded-md transition border border-sky-100/50 cursor-pointer"
                              >
                                + {pDiag.split(" ")[0]}.. {pDiag.slice(-15)}
                              </button>
                            ))}
                          </div>

                          {/* Active diagnoses */}
                          {activeDiagnoses.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200">
                              {activeDiagnoses.map((d, i) => (
                                <span key={i} className="inline-flex items-center gap-1 bg-slate-800 text-white rounded-lg text-[10px] leading-none py-1.5 px-2.5 font-medium">
                                  {d}
                                  <button
                                    onClick={() => handleRemoveDiagnosis(i)}
                                    className="hover:text-red-300 font-bold ml-1.5 focus:outline-none"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Block: ePrescription Medicines (Rx) */}
                      <div className="xl:col-span-7 flex flex-col space-y-4">
                        
                        {/* Selected Medicines List with active removal and timing */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 flex-1 flex flex-col">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono mb-2">
                            e-Prescription (Rx) Table
                          </label>

                          <div className="flex-1 space-y-2 min-h-[140px] max-h-[220px] overflow-y-auto pr-1">
                            {activeMedications.length === 0 ? (
                              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                                <Sparkles className="w-8 h-8 text-sky-400 mb-1 opacity-70 animate-bounce" />
                                <span className="text-xs">No medication added to prescription draft yet.</span>
                                <span className="text-[10px] text-slate-400 mt-0.5">Use quick search or prescription presets below!</span>
                              </div>
                            ) : (
                              activeMedications.map((med, index) => (
                                <div key={index} className="p-2.5 border border-sky-100 bg-sky-50/20 rounded-xl flex justify-between items-center group shadow-xs">
                                  <div>
                                    <p className="text-xs font-bold text-slate-800">{med.name}</p>
                                    <div className="flex items-center gap-2 text-[10px] text-sky-700 font-semibold mt-1">
                                      <span>{med.dosage} ({med.timing})</span>
                                      <span>•</span>
                                      <span>{med.frequency}</span>
                                      <span>•</span>
                                      <span className="text-slate-500">{med.duration} {med.durationUnit}</span>
                                    </div>
                                    {med.instruction && (
                                      <p className="text-[10px] text-slate-500 italic mt-0.5 font-mono">
                                        Inst: {med.instruction}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => handleRemoveMedication(index)}
                                    className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 opacity-60 group-hover:opacity-100 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Quick addition & presets query tool */}
                          <div className="pt-3 border-t border-slate-200 space-y-3 mt-2">
                            
                            {/* Search presets first */}
                            <div className="space-y-1.5">
                              <span className="text-[9px] text-slate-500 block font-bold font-mono uppercase">Quick Presets Search</span>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="Type drug name (e.g. Paracetamol, Amoxicillin)..."
                                    value={medSearchQuery}
                                    onChange={(e) => setMedSearchQuery(e.target.value)}
                                    className="w-full bg-white border border-slate-250 text-xs rounded-lg pl-8 pr-2.5 py-1.5 text-slate-850 focus:outline-none focus:border-sky-500"
                                  />
                                </div>
                                {medSearchQuery && (
                                  <button
                                    onClick={() => setMedSearchQuery("")}
                                    className="text-[10px] text-slate-500 hover:text-slate-800 font-semibold"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {filteredPresetMedications.map((medPreset) => (
                                  <button
                                    key={medPreset.name}
                                    onClick={() => {
                                      handleAddMedicationPreset(medPreset);
                                      setMedSearchQuery("");
                                    }}
                                    className="text-[10px] hover:bg-sky-550 hover:bg-sky-600 font-semibold py-1 px-2 border hover:text-white border-sky-100 bg-sky-50 text-sky-850 rounded-lg transition duration-75 text-left cursor-pointer flex items-center gap-1"
                                  >
                                    <span>+</span> {medPreset.name} <span className="text-[9px] opacity-75 font-normal">({medPreset.defaultDosage})</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Custom interactive inputs */}
                            <form onSubmit={handleAddCustomMedication} className="bg-slate-100 border border-slate-200 p-3 rounded-lg space-y-2">
                              <p className="text-[10px] font-bold text-slate-500 font-mono tracking-tight uppercase">Custom Medication Writer</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Medication Name / strength"
                                  value={customMedName}
                                  onChange={(e) => setCustomMedName(e.target.value)}
                                  className="col-span-1 bg-white border border-slate-250 rounded-lg p-1.5 text-xs focus:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="Dosage e.g. 1-0-1"
                                    value={customMedDosage}
                                    onChange={(e) => setCustomMedDosage(e.target.value)}
                                    className="bg-white border border-slate-250 rounded-lg p-1.5 text-xs text-center focus:outline-none font-mono"
                                  />
                                  <select
                                    value={customMedTiming}
                                    onChange={(e) => setCustomMedTiming(e.target.value as any)}
                                    className="bg-white border border-slate-250 rounded-lg p-1 text-xs focus:outline-none"
                                  >
                                    <option value="After Food">After Food</option>
                                    <option value="Before Food">Before Food</option>
                                    <option value="With Food">With Food</option>
                                    <option value="Empty Stomach">Empty Stomach</option>
                                    <option value="At Bedtime">At Bedtime</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-1.5">
                                <select
                                  value={customMedFrequency}
                                  onChange={(e) => setCustomMedFrequency(e.target.value as any)}
                                  className="bg-white border border-slate-250 rounded-lg p-1 text-xs focus:outline-none col-span-1"
                                >
                                  <option value="Daily">Daily</option>
                                  <option value="Twice daily">Twice daily</option>
                                  <option value="Thrice daily">Thrice daily</option>
                                  <option value="Four times a day">Four times daily</option>
                                  <option value="Once weekly">Once weekly</option>
                                  <option value="As needed (PRN)">SOS / As needed</option>
                                </select>
                                <div className="flex gap-1 items-center col-span-2">
                                  <input
                                    type="number"
                                    value={customMedDuration}
                                    onChange={(e) => setCustomMedDuration(Math.max(1, Number(e.target.value)))}
                                    className="w-12 bg-white border border-slate-250 rounded-lg p-1.5 text-xs text-center focus:outline-none font-mono"
                                  />
                                  <select
                                    value={customMedDurationUnit}
                                    onChange={(e) => setCustomMedDurationUnit(e.target.value as any)}
                                    className="flex-1 bg-white border border-slate-250 rounded-lg p-1 text-xs focus:outline-none"
                                  >
                                    <option value="Days">Days</option>
                                    <option value="Weeks">Weeks</option>
                                    <option value="Months">Months</option>
                                    <option value="Single Dose">Single Dose</option>
                                  </select>
                                </div>
                              </div>
                              
                              <input
                                type="text"
                                placeholder="Additional timing or special instruction (optional)"
                                value={customMedInstruction}
                                onChange={(e) => setCustomMedInstruction(e.target.value)}
                                className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs focus:outline-none"
                              />

                              <div className="text-right pt-0.5">
                                <button
                                  type="submit"
                                  disabled={!customMedName}
                                  className={`px-3 py-1 bg-slate-800 text-white rounded-md text-[11px] font-bold shadow-xs hover:bg-slate-900 transition ${
                                    !customMedName ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                  }`}
                                >
                                  + Commit Drug Row
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>

                        {/* Lab tests, advice & Follow Up combo */}
                        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                              Lab / Diagnostics
                            </label>
                            <div className="flex gap-1">
                              <input
                                type="text"
                                value={labInput}
                                onChange={(e) => setLabInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    handleAddLabTest(labInput);
                                  }
                                }}
                                placeholder="e.g. CBC, Lipid Profile"
                                className="flex-1 bg-white border border-slate-250 text-xs rounded-lg px-2 py-1 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddLabTest(labInput)}
                                className="px-2 bg-slate-800 text-white rounded-lg text-xs font-bold"
                              >
                                Add
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {PRESET_LAB_TESTS.filter(t => !activeLabTests.includes(t)).slice(0, 3).map((test) => (
                                <button
                                  key={test}
                                  onClick={() => handleAddLabTest(test)}
                                  className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-700 py-0.5 px-1.5 rounded"
                                >
                                  + {test.split(" ")[0]}
                                </button>
                              ))}
                            </div>

                            {activeLabTests.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200">
                                {activeLabTests.map((t, i) => (
                                  <span key={i} className="inline-flex items-center gap-1 bg-slate-800 text-white rounded text-[9px] leading-none py-1 px-1.5">
                                    {t}
                                    <button onClick={() => handleRemoveLabTest(i)} className="hover:text-red-300">×</button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="space-y-2 flex flex-col justify-between">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-mono">
                                Advice & instructions
                              </label>
                              <textarea
                                value={advice}
                                onChange={(e) => setAdvice(e.target.value)}
                                placeholder="Drink plenty of warm water, bed rest..."
                                className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs focus:outline-none text-slate-800"
                                rows={2}
                              />
                            </div>

                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-bold text-slate-500 font-mono uppercase">Follow up</span>
                              <select
                                value={followUpDays}
                                onChange={(e) => setFollowUpDays(e.target.value)}
                                className="bg-white border border-slate-250 rounded-lg p-1 text-xs text-slate-850"
                              >
                                <option value="3">In 3 Days</option>
                                <option value="5">In 5 Days</option>
                                <option value="7">In 1 Week</option>
                                <option value="15">In 2 Weeks</option>
                                <option value="30">In 1 Month</option>
                                <option value="No Follow Up">No Follow Up</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Clinical Internal Observations notes (Doctor eyes-only) */}
                        <div className="bg-slate-55 bg-[#FAFAFA] border border-slate-200 rounded-xl p-4 space-y-3 shrink-0 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="p-1 px-1.5 bg-amber-100 text-amber-700 rounded-lg text-[9px] leading-none font-bold block uppercase font-mono">🔒 CONFIDENTIAL</span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 tracking-tight font-sans">
                                  Internal Clinical Observations
                                </h4>
                                <span className="text-[10px] text-slate-400 block -mt-0.5 font-medium leading-none">
                                  Track patient status across longitudinal visits. Excluded from PDF prints.
                                </span>
                              </div>
                            </div>
                            
                            {/* Editor vs Rendered Preview toggle tabs */}
                            <div className="bg-slate-200 p-0.5 rounded-lg flex text-[10px] font-bold">
                              <button
                                type="button"
                                id="btn-notes-edit-tab"
                                onClick={() => setInternalNotesTab("edit")}
                                className={`px-2.5 py-1 rounded-md transition ${internalNotesTab === "edit" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Editor
                              </button>
                              <button
                                type="button"
                                id="btn-notes-preview-tab"
                                onClick={() => setInternalNotesTab("preview")}
                                className={`px-2.5 py-1 rounded-md transition ${internalNotesTab === "preview" ? "bg-white text-slate-800 shadow-3xs" : "text-slate-500 hover:text-slate-800"}`}
                              >
                                Preview
                              </button>
                            </div>
                          </div>

                          {internalNotesTab === "edit" ? (
                            <div className="space-y-2.5">
                              {/* Clinical Note Formatting Toolbar */}
                              <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 pb-2">
                                <div className="flex flex-wrap items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleInsertFormat("**", "**")}
                                    className="p-1 hover:bg-slate-200 text-slate-600 rounded text-xs font-bold transition cursor-pointer"
                                    title="Bold Selection (**)"
                                  >
                                    <strong>B</strong>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInsertFormat("*", "*")}
                                    className="p-1 hover:bg-slate-200 text-slate-600 rounded text-xs italic transition cursor-pointer"
                                    title="Italic Selection (*)"
                                  >
                                    <em>I</em>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInsertFormat("_", "_")}
                                    className="p-1 hover:bg-slate-200 text-slate-600 rounded text-xs underline transition cursor-pointer"
                                    title="Underline Selection (_)"
                                  >
                                    <u>U</u>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInsertFormat("[highlight]", "[highlight]")}
                                    className="p-1 px-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded font-mono text-[9px] uppercase font-bold transition cursor-pointer"
                                    title="Yellow Highlight Tag"
                                  >
                                    Highlight
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleInsertFormat("- ", "")}
                                    className="p-1 px-1.5 hover:bg-slate-200 border border-slate-200 text-slate-650 rounded text-[9px] font-medium transition cursor-pointer"
                                    title="Format Bullet List"
                                  >
                                    • Bullet
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm("Clear all observation draft notes?")) {
                                      setInternalNotes("");
                                    }
                                  }}
                                  className="text-[9px] font-bold font-mono text-slate-400 hover:text-red-500 py-1 transition cursor-pointer"
                                >
                                  CLEAR ALL
                                </button>
                              </div>

                              {/* Multi-line editor field */}
                              <textarea
                                id="internal-notes-textarea"
                                value={internalNotes}
                                onChange={(e) => setInternalNotes(e.target.value)}
                                placeholder="E.g. Chest: Clear on auscultation. No allergies reported. Longitudinal neurological checks stable."
                                className="w-full bg-white border border-slate-250 rounded-lg p-2.5 text-xs text-slate-800 font-sans focus:outline-none min-h-[90px] focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                              />

                              {/* Click-to-insert clinical template findings helper */}
                              <div className="space-y-1 bg-white/70 p-2 border border-slate-150 rounded-lg">
                                <span className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">
                                  Rapid templates (click-to-insert findings)
                                </span>
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {observationsTemplates.map((tpl, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setInternalNotes(prev => {
                                          const base = prev.trim();
                                          return base ? `${base}\n${tpl.text}` : tpl.text;
                                        });
                                      }}
                                      className="text-[9px] font-bold text-slate-600 bg-slate-100 p-1 px-1.5 rounded-md hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                                    >
                                      {tpl.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white/95 border border-slate-200 rounded-lg p-4 min-h-[140px] max-h-[220px] overflow-y-auto">
                              {renderFormattedNotes(internalNotes)}
                            </div>
                          )}
                        </div>

                        {/* Save & Print Trigger */}
                        <div className="pt-2 z-10 shrink-0">
                          <button
                            id="btn-prescribe-submit"
                            onClick={handleSaveAndPrintPrescription}
                            disabled={activeMedications.length === 0 && activeComplaints.length === 0}
                            className={`w-full py-2.5 text-white text-xs font-bold font-mono tracking-wider shadow-sm hover:translate-y-[-1px] transition rounded-lg text-center flex items-center justify-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 ${
                              activeMedications.length === 0 && activeComplaints.length === 0 ? "opacity-50 cursor-not-allowed hover:bg-emerald-600" : ""
                            }`}
                          >
                            <Printer className="w-4 h-4" /> COMMIT & RENDER PRINTABLE Rx SHEET
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Stethoscope className="w-8 h-8" />
                    </div>
                    <div className="max-w-md">
                      <h3 className="text-base font-bold text-slate-800">No Patient Session Is Active</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Select a checked-in patient from the left schedule queue, or visit the Queue Ledger to check in waiting patients.
                      </p>
                      <button
                        onClick={() => setActiveTab("queue")}
                        className="mt-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm transition duration-150 cursor-pointer"
                      >
                        Launch Booking Queue Manager
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Right Panel: High Density Diagnostics Updates & Stats */}
              <section id="panel-vitals-analytics" className="w-[240px] flex flex-col space-y-4 shrink-0 overflow-y-auto pr-1">
                {/* Laboratory testing updates */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col shadow-xs bg-slate-50/15">
                  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Lab Dispatch Updates</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start space-x-2 border-b border-slate-100 pb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></div>
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800">Lipid Profile - Priyesh</p>
                        <p className="text-[9px] text-slate-500 font-medium">Sample drawn • 09:15 AM</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 border-b border-slate-100 pb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0"></div>
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800">Complete Blood - Rohan G.</p>
                        <p className="text-[9px] text-emerald-600 font-semibold uppercase font-mono tracking-tight">Report Verified</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1 shrink-0"></div>
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-800">Thyroid Panel - S. Ray</p>
                        <p className="text-[9px] text-slate-500">Scheduled for dispatch</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Practical Revenue collection widget cards */}
                <div className="bg-[#1E293B] text-white rounded-xl p-4 flex flex-col justify-between shadow-xs flex-1 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase font-mono">FINANCES TODAY</span>
                    <p className="text-2xl font-extrabold tracking-tight font-mono text-sky-450">₹{totalFinancialSummary}</p>
                    <p className="text-[10px] text-slate-400">Calculated on consults completed</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-700/60 text-xs">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Consultation Fee</span>
                      <span className="font-mono text-slate-200">₹{doctorProfile.consultationFee} / pat</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Total Rx Written</span>
                      <span className="font-bold text-sky-400 font-mono">{prescriptions.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Pending Billing</span>
                      <span className="font-bold text-amber-400 font-mono">{pendingInvoicesCount}</span>
                    </div>
                    
                    <div className="h-[1px] bg-slate-700/60 my-1" />

                    <div className="flex justify-between items-center text-[10px] font-bold text-sky-300">
                      <span>Daily Goal Reached</span>
                      <span>{Math.min(100, Math.round((totalFinancialSummary / 3000) * 100))}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-sky-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (totalFinancialSummary / 3000) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-750/50 flex items-center justify-between text-[10px]">
                    <span className="text-emerald-400 font-bold block">100% Secure EHR</span>
                    <span className="font-mono text-[9px] text-slate-400">Prescripta Protected</span>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Queue Ledger view */}
          {activeTab === "queue" && (
            <div className="h-full overflow-y-auto p-6">
              <PatientsQueue
                appointments={appointments}
                patients={patients}
                onAddPatient={handleAddPatient}
                onAddAppointment={handleAddAppointment}
                onUpdateStatus={handleUpdateStatus}
                onDeleteAppointment={handleDeleteAppointment}
                onStartPrescribing={handleStartPrescribingInTab}
                onMarkBilling={handleMarkBillingAndPay}
                onSelectPatientForHistory={(pId) => {
                  setSelectedPatientHistoryId(pId);
                  setActiveTab("patients");
                }}
              />
            </div>
          )}

          {/* Patients ledger view */}
          {activeTab === "patients" && (
            <div className="h-full overflow-y-auto p-6 max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Patient Registry Database</h2>
                  <p className="text-xs text-slate-500">Track registration histories, allergies, demographics, and clinical timelines</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Patient List */}
                <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[520px] shadow-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block font-mono">Patient directory ({patients.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 overflow-y-auto flex-1 scrollbar-thin">
                    {patients.map((pat) => (
                      <div
                        key={pat.id}
                        onClick={() => setSelectedPatientHistoryId(pat.id)}
                        className={`p-3 cursor-pointer transition ${
                          selectedPatientHistoryId === pat.id ? "bg-sky-50/60 font-bold border-r-4 border-sky-600" : "hover:bg-slate-550 hover:bg-slate-50"
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-800">{pat.name}</p>
                        <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                          <span>{pat.age}Y • {pat.gender}</span>
                          <span className="font-mono text-[10px]">{pat.mobile}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected patient clinical timeline details */}
                <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs h-[520px] overflow-y-auto scrollbar-thin">
                  {selectedPatientHistoryId ? (() => {
                    const selectedPat = patients.find(p => p.id === selectedPatientHistoryId);
                    const historicalRxs = prescriptions.filter(p => p.patientId === selectedPatientHistoryId);
                    
                    if (!selectedPat) return <p className="text-xs text-slate-400 text-center">Patient record not found.</p>;

                    return (
                      <div className="space-y-5">
                        {/* Summary panel */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-base font-extrabold text-slate-800">{selectedPat.name}</h3>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">Demographics: {selectedPat.age} years • {selectedPat.gender}</p>
                              <div className="flex gap-4 mt-2 text-xs">
                                <span>Mobile: <strong className="text-slate-700">{selectedPat.mobile}</strong></span>
                                {selectedPat.email && <span>Email: <strong className="text-slate-700">{selectedPat.email}</strong></span>}
                              </div>
                            </div>
                            <span className="bg-sky-550 bg-sky-100 text-sky-800 border border-sky-100 text-xs font-bold px-2.5 py-1 rounded-md">
                              Group: {selectedPat.bloodGroup || "O+"}
                            </span>
                          </div>
                          
                          <div className="mt-3.5 pt-3 border-t border-slate-200 flex gap-4 text-[10px] text-slate-500 font-mono">
                            <span>REGISTRATION DATE: <strong>{selectedPat.createdAt}</strong></span>
                            <span>|</span>
                            <span>PERSISTENT ALLERGIES: <strong className="text-amber-600">None declared</strong></span>
                          </div>
                        </div>

                        {/* Prescriptions timeline list */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Consolidated Clinical Records Timeline</h4>
                          
                          {historicalRxs.length === 0 ? (
                            <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-lg text-center font-mono">This patient has no finalized e-Prescription records on system.</p>
                          ) : (
                            historicalRxs.map((rx) => (
                              <div key={rx.id} className="border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-sky-700 font-mono">Rx Record ID: {rx.id}</span>
                                  <span className="font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono">{rx.date}</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
                                  <div>
                                    <strong className="text-slate-500 text-[10px] uppercase font-mono block">Symptoms / Complaints</strong>
                                    <span>{rx.complaints.join(", ") || "None"}</span>
                                  </div>
                                  <div>
                                    <strong className="text-slate-500 text-[10px] uppercase font-mono block">Clinical Diagnoses</strong>
                                    <span>{rx.diagnosis.join(", ") || "None"}</span>
                                  </div>
                                </div>

                                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                  <strong className="text-slate-500 text-[10px] uppercase font-mono block mb-1">Prescribed Medicines</strong>
                                  <table className="w-full text-xs font-mono">
                                    <thead>
                                      <tr className="border-b border-slate-200 text-slate-400 font-normal">
                                        <th className="text-left pb-1">Drug Details</th>
                                        <th className="text-center pb-1">Dosage Timing</th>
                                        <th className="text-right pb-1">Duration</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {rx.medications.map((med, index) => (
                                        <tr key={index} className="text-slate-700">
                                          <td className="py-1">{med.name}</td>
                                          <td className="text-center py-1">{med.dosage} ({med.timing})</td>
                                          <td className="text-right py-1">{med.duration} {med.durationUnit}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {rx.internalNotes && (
                                  <div className="bg-amber-50/50 border border-amber-200/50 p-3 rounded-lg text-xs space-y-1">
                                    <span className="text-[10px] uppercase font-mono font-bold text-amber-800 flex items-center gap-1">
                                      🔒 Confidential Clinical Observations (Eyes-Only)
                                    </span>
                                    {renderFormattedNotes(rx.internalNotes)}
                                  </div>
                                )}

                                <div className="flex justify-between items-center pt-1 text-xs">
                                  <div>
                                    {rx.labTests.length > 0 && (
                                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">
                                        Tests requested: {rx.labTests.join(", ")}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => setPrescriptionToPreview(rx)}
                                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" /> View Prescription
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })() : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 py-12">
                      <Users className="w-12 h-12 text-slate-300 mb-2" />
                      <span className="text-sm font-bold text-slate-600">No Patient Record Selected</span>
                      <span className="text-xs text-slate-400 max-w-xs mt-1">Please select an active clinical patient record from the sidebar directory to review documentation history.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Prescription Archive Ledger view */}
          {activeTab === "prescriptions" && (
            <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">EHR Finalized Prescription Archives</h2>
                <p className="text-xs text-slate-500">View and print past medical e-Prescriptions written today</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                {prescriptions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No finalized prescriptions found inside system memory.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase font-bold tracking-wider">
                          <th className="py-3 px-4">Rx Database ID</th>
                          <th className="py-3 px-4">Patient Name</th>
                          <th className="py-3 px-4 text-center">Finalized Date</th>
                          <th className="py-3 px-4">Clinical Diagnoses</th>
                          <th className="py-3 px-4 text-center">Prescribed Items</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prescriptions.map((rx) => (
                          <tr key={rx.id} className="hover:bg-slate-50 text-slate-700 text-sm">
                            <td className="py-3 px-4 font-mono font-bold text-sky-800">
                              {rx.id}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-slate-800">{rx.patientName}</p>
                              <p className="text-[10px] text-slate-500 uppercase tracking-tight">{rx.patientAge}Y / {rx.patientGender}</p>
                            </td>
                            <td className="py-3 px-4 font-mono text-center text-xs">
                              {rx.date}
                            </td>
                            <td className="py-3 px-4 text-xs font-medium text-slate-600 truncate max-w-[180px]">
                              {rx.diagnosis.join(", ") || "-"}
                            </td>
                            <td className="py-3 px-4 text-center font-mono text-xs">
                              <span className="bg-sky-50 text-sky-800 font-bold border border-sky-100 rounded px-2.5 py-0.5">
                                {rx.medications.length} Medications
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => setPrescriptionToPreview(rx)}
                                className="px-2.5 py-1 text-xs bg-slate-850 bg-slate-800 text-white rounded hover:bg-slate-900 shadow-sm transition inline-flex items-center gap-1 select-none cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" /> Render print
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
          )}

          {/* Doctor Profile Settings view */}
          {activeTab === "settings" && (
            <div className="h-full overflow-y-auto p-6 max-w-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Doctor Credentials & Letterhead Setup</h2>
                <p className="text-xs text-slate-500">Configure prescription headers, professional license numbers, and clinic addresses</p>
              </div>

              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (currentUser) {
                    try {
                      await setDoc(doc(db, "doctors", currentUser.uid), doctorProfile);
                      alert("Clinic credentials and letterhead updated successfully in Cloud Firestore!");
                    } catch (err) {
                      handleFirestoreError(err, OperationType.WRITE, `doctors/${currentUser.uid}`);
                    }
                  } else {
                    alert("Clinic credentials updated locally!");
                  }
                }}
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-tight mb-1">Doctor Name / Degrees *</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                      value={doctorProfile.name}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-tight mb-1">Medical Registration / License No *</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                      value={doctorProfile.regNo}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, regNo: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-tight mb-1">Specialty field *</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                      value={doctorProfile.specialty}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, specialty: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-tight mb-1">Consultation Fee (INR) *</label>
                    <input
                      type="number"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                      value={doctorProfile.consultationFee}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, consultationFee: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-tight mb-1">Clinic Center Name *</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                      value={doctorProfile.clinicName}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, clinicName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-tight mb-1">Address / Prescription Letterhead footer</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                      value={doctorProfile.address}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, address: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-tight mb-1">Clinic Contact Phone</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                      value={doctorProfile.phone}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-tight mb-1">Secure Email ID</label>
                    <input
                      type="email"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs focus:bg-white focus:outline-none"
                      value={doctorProfile.email}
                      onChange={(e) => setDoctorProfile({ ...doctorProfile, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs transition duration-150 cursor-pointer"
                  >
                    Save & Update Letterhead
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* RENDER MODAL: High Fidelity Prescription printable format sheet */}
      <AnimatePresence>
        {prescriptionToPreview && (
          <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-250 select-text"
            >
              {/* Controls bar */}
              <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold font-mono tracking-wider text-slate-600 uppercase">
                  Digital printable prescription
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-3.5 h-3.5" /> Trigger System Print
                  </button>
                  <button
                    onClick={() => setPrescriptionToPreview(null)}
                    className="px-3 py-1.5 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Close Sheet
                  </button>
                </div>
              </div>

              {/* Physical Document format sheet */}
              <div className="flex-1 overflow-y-auto p-8 font-sans text-slate-900 bg-white" style={{ minHeight: "500px" }}>
                {/* Physical prescription container */}
                <div id="physical-rx-sheet" className="max-w-2xl mx-auto space-y-6">
                  
                  {/* Doctor Info & Letterhead header block */}
                  <div className="border-b-4 border-sky-600 pb-4 flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-base font-extrabold text-[#1E293B] tracking-tight">{doctorProfile.name}</h2>
                      <p className="text-xs font-semibold text-sky-700">{doctorProfile.specialty}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Reg No: {doctorProfile.regNo}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <h3 className="text-xs font-extrabold text-[#1E293B] uppercase">{doctorProfile.clinicName}</h3>
                      <p className="text-[10px] text-slate-500 max-w-[200px] leading-relaxed">{doctorProfile.address}</p>
                      <p className="text-[10px] text-slate-500 font-mono">Ph: {doctorProfile.phone}</p>
                    </div>
                  </div>

                  {/* Patient Demographic Details band */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px] font-mono leading-relaxed">
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Patient Name</span>
                      <span className="font-bold text-slate-800">{prescriptionToPreview.patientName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Age / Gender</span>
                      <span className="font-bold text-slate-800">{prescriptionToPreview.patientAge} Yrs / {prescriptionToPreview.patientGender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Date Written</span>
                      <span className="font-bold text-slate-800">{prescriptionToPreview.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block uppercase font-bold text-[9px]">Rx Record ID</span>
                      <span className="font-bold text-slate-500 text-[10px]">{prescriptionToPreview.id}</span>
                    </div>
                  </div>

                  {/* Medical Findings body splits */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
                    
                    {/* Complaints & Vitals in left column */}
                    <div className="md:col-span-4 space-y-4 pr-4 border-r border-slate-200">
                      
                      {prescriptionToPreview.complaints.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Chief Complaints</h4>
                          <ul className="text-xs space-y-1 text-slate-700 list-disc list-inside">
                            {prescriptionToPreview.complaints.map((c, idx) => (
                              <li key={idx}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Display vitals as clean list */}
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Vitals Rec</h4>
                        <div className="space-y-1 text-[11px] font-mono text-slate-700">
                          {prescriptionToPreview.vitals.bp && <div>BP: <strong>{prescriptionToPreview.vitals.bp} mmHg</strong></div>}
                          {prescriptionToPreview.vitals.pulse && <div>Pulse: <strong>{prescriptionToPreview.vitals.pulse} bpm</strong></div>}
                          {prescriptionToPreview.vitals.temp && <div>Temp: <strong>{prescriptionToPreview.vitals.temp} °F</strong></div>}
                          {prescriptionToPreview.vitals.weight && <div>Weight: <strong>{prescriptionToPreview.vitals.weight} kg</strong></div>}
                          {prescriptionToPreview.vitals.bmi && <div>BMI: <strong>{prescriptionToPreview.vitals.bmi}</strong></div>}
                        </div>
                      </div>

                      {prescriptionToPreview.diagnosis.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1.5">Diagnoses</h4>
                          <p className="text-xs font-semibold text-[#1E293B]">
                            {prescriptionToPreview.diagnosis.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Prescription Rx table right column */}
                    <div className="md:col-span-8 space-y-4">
                      <div>
                        {/* Rx Icon logo styling */}
                        <div className="text-2xl font-extrabold text-[#1E293B] tracking-tight mb-2 font-serif opacity-90">
                          ℞
                        </div>
                        
                        {prescriptionToPreview.medications.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No medicinal drugs prescribed.</p>
                        ) : (
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-400 font-mono text-[9px] uppercase">
                                <th className="py-2 font-bold w-1/2">Drug Name & timing</th>
                                <th className="py-2 text-center font-bold">Dosage mapping</th>
                                <th className="py-2 text-right font-bold">Duration</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-105">
                              {prescriptionToPreview.medications.map((med, idx) => (
                                <tr key={idx} className="text-slate-800 text-xs text-slate-850">
                                  <td className="py-2.5 pr-2">
                                    <strong className="block text-slate-900 font-bold">{med.name}</strong>
                                    <span className="text-[10px] text-slate-500 leading-none block mt-0.5 font-mono">{med.timing}</span>
                                    {med.instruction && (
                                      <span className="text-[10px] italic text-sky-800 block mt-0.5">({med.instruction})</span>
                                    )}
                                  </td>
                                  <td className="py-2.5 text-center">
                                    <span className="font-bold text-slate-800 block font-mono">{med.dosage}</span>
                                    <span className="text-[10px] text-slate-500 block leading-none mt-0.5">{med.frequency}</span>
                                  </td>
                                  <td className="py-2.5 text-right font-mono font-bold text-slate-700">
                                    {med.duration} {med.durationUnit}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {prescriptionToPreview.labTests.length > 0 && (
                        <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                          <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-1">Diagnostic Labs Requested</h4>
                          <p className="text-xs font-semibold text-slate-700">{prescriptionToPreview.labTests.join(", ")}</p>
                        </div>
                      )}

                      {prescriptionToPreview.advice && (
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono mb-1">Advice & instructions</h4>
                          <p className="text-xs text-slate-600 italic leading-relaxed">
                            "{prescriptionToPreview.advice}"
                          </p>
                        </div>
                      )}

                      {prescriptionToPreview.followUpDate && (
                        <div className="flex items-center gap-1.5 text-xs text-sky-800 pt-2 border-t border-slate-100 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Please return for clinical checkup on or before: <strong>{prescriptionToPreview.followUpDate}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Letterhead sign footer spacer */}
                  <div className="pt-12 flex justify-between items-end border-t border-slate-200 text-[10px] text-slate-500 font-mono">
                    <div>
                      <span>Letterhead generated securely via Prescripta EHR system.</span>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="h-[1px] w-28 bg-slate-400 mx-auto" />
                      <span className="block font-bold pt-1 text-slate-700">{doctorProfile.name}</span>
                      <span className="block italic text-[9px]">Clinician physical signature / seal</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Quick click-to-insert formatting templates for clinical findings
const observationsTemplates = [
  { label: "🫁 Auscultation Clear", text: "- Chest: Clear on auscultation. S1, S2 heard normal." },
  { label: "🧠 CNS Alert", text: "- CNS: Fully conscious, alert, oriented to time, place, and person." },
  { label: "🩺 ENT: Normal Pharynx", text: "- ENT: Pharynx clear, normal tonsils, nil congestion." },
  { label: "⚠️ Allergies Negative", text: "- Known Allergies: None reported." },
  { label: "✊ Vitals Stable", text: "- Patient hemodynamically stable." },
];

// Helper to render basic markdown and highlight formatting safely in UI logs
function renderFormattedNotes(text: string) {
  if (!text) return <span className="text-slate-400 italic text-[11px]">No internal observations logged.</span>;
  
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
