/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  auth, 
  db, 
  handleFirestoreError, 
  OperationType 
} from "../firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { DoctorProfile } from "../types";
import { 
  Lock, 
  Mail, 
  User, 
  Building, 
  Stethoscope, 
  Activity, 
  Phone, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  MapPin,
  DollarSign,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  onAuthSuccess: (uid: string, profile: DoctorProfile) => void;
}

const DEFAULT_NEW_DOCTOR_PROFILE = {
  specialty: "General Medicine",
  degree: "M.B.B.S.",
  regNo: "MC-12345",
  clinicName: "Health Clinic Portal",
  address: "123 Healthcare Boulevard",
  phone: "+91 98765 43210",
  consultationFee: 500
};

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Auth Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Doctor Info Fields for Signup
  const [specialty, setSpecialty] = useState(DEFAULT_NEW_DOCTOR_PROFILE.specialty);
  const [degree, setDegree] = useState(DEFAULT_NEW_DOCTOR_PROFILE.degree);
  const [regNo, setRegNo] = useState(DEFAULT_NEW_DOCTOR_PROFILE.regNo);
  const [clinicName, setClinicName] = useState(DEFAULT_NEW_DOCTOR_PROFILE.clinicName);
  const [address, setAddress] = useState(DEFAULT_NEW_DOCTOR_PROFILE.address);
  const [phone, setPhone] = useState(DEFAULT_NEW_DOCTOR_PROFILE.phone);
  const [consultationFee, setConsultationFee] = useState<number>(500);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Try fetching matching doctor document
      const docRef = doc(db, "doctors", uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `doctors/${uid}`);
      }

      let profile: DoctorProfile;
      if (docSnap && docSnap.exists()) {
        profile = docSnap.data() as DoctorProfile;
      } else {
        // Fallback profile if they don't have one written in Firestore
        profile = {
          name: userCredential.user.displayName || "Dr. Authorized Clinician",
          specialty,
          degree,
          regNo,
          clinicName,
          address,
          phone,
          email,
          consultationFee
        };
        try {
          await setDoc(docRef, profile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `doctors/${uid}`);
        }
      }

      onAuthSuccess(uid, profile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to log in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a name.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid;

      await updateProfile(user, { displayName: name });

      const profile: DoctorProfile = {
        name,
        specialty,
        degree,
        regNo,
        clinicName,
        address,
        phone,
        email,
        consultationFee
      };

      // Store in firestore database
      try {
        await setDoc(doc(db, "doctors", uid), profile);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `doctors/${uid}`);
      }

      onAuthSuccess(uid, profile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to register. Standard requirements: Email pattern & at least 6 text chars password.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const uid = user.uid;

      const docRef = doc(db, "doctors", uid);
      let docSnap;
      try {
        docSnap = await getDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `doctors/${uid}`);
      }

      let profile: DoctorProfile;
      if (docSnap && docSnap.exists()) {
        profile = docSnap.data() as DoctorProfile;
      } else {
        // Create initial default clinician detail card if missing
        profile = {
          name: user.displayName || "Dr. Medical Practitioner",
          specialty: "Clinical Medicine",
          degree: "M.B.B.S.",
          regNo: "REG-STAMP-PENDING",
          clinicName: "My Digital Practice",
          address: "123 Main Street",
          phone: "+91 99999 99999",
          email: user.email || "",
          consultationFee: 500
        };
        try {
          await setDoc(docRef, profile);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `doctors/${uid}`);
        }
      }

      onAuthSuccess(uid, profile);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to complete security popup authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      
      {/* Visual Identity Section */}
      <div className="flex-1 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-850 flex flex-col justify-between p-8 md:p-12 text-slate-200">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-500 flex items-center justify-center text-white font-extrabold select-none shadow-md">
            ℞
          </div>
          <span className="text-xl font-black tracking-tight text-white">Prescripta</span>
        </div>

        <div className="max-w-md my-12 md:my-auto space-y-4">
          <div className="inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider">
            Clinical Workflow Portal
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Comprehensive Digital ePrescriptions & Queue.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Prescripta synchronizes consultations, schedulers, vital telemetries, and rapid digital drug drafting within a unified cloud environment. Safe EHR operations.
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 pt-4">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Secure 256-bit Cloud Environment Active
        </div>
      </div>

      {/* Auth Control Handler */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-indigo-400 w-5 h-5" />
            <span className="text-[10px] uppercase font-mono font-black text-slate-400 tracking-wider">Authorization Node</span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight mb-1">
            {isSignUp ? "Create Practice" : "Access Console"}
          </h3>
          <p className="text-xs text-slate-400 mb-6 font-medium">
            {isSignUp ? "Register your registration keys and create clean workspace" : "Input valid credentials associated with doctor ID"}
          </p>

          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/40 text-red-400 rounded-xl text-xs font-semibold flex items-start gap-2.5 mb-4 leading-normal">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex bg-slate-950 p-1 rounded-xl mb-6 border border-slate-800 shrink-0">
            <button
              onClick={() => { setIsSignUp(false); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isSignUp ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsSignUp(true); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isSignUp ? "bg-slate-800 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="space-y-4">
            
            {/* Common Auth Fields */}
            {isSignUp && (
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Doctor Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 pl-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@clinic.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 pl-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 pl-10 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Expanded Setup fields during Sign Up */}
            {isSignUp && (
              <div className="border-t border-slate-800 pt-4 mt-2 space-y-4">
                <p className="text-[10px] uppercase font-mono font-extrabold text-indigo-400 tracking-wider">Clinic & Regulatory Details</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Specialty</label>
                    <div className="relative">
                      <Stethoscope className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Pediatrics"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 pl-8 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Degree</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="M.D., D.C.H"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 px-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Reg No / Stamp</label>
                    <div className="relative">
                      <Hash className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="REG-24512"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 pl-8 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Consultation Fee (₹)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="number"
                        required
                        value={consultationFee}
                        onChange={(e) => setConsultationFee(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 pl-8 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Clinic Name</label>
                  <div className="relative">
                    <Building className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="Specialty Clinic Care"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 pl-8 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">Emergency Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="+91..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 pl-8 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase mb-1">City / Region Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Greater Area"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2 pl-8 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 transition"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition duration-150 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
            >
              {loading ? "Authenticating..." : isSignUp ? "Build Secure Portal" : "Enter Dashboard"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Social login line separator */}
          <div className="relative flex items-center justify-center my-6 shrink-0">
            <div className="border-t border-slate-800 w-full" />
            <span className="absolute bg-slate-900 px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-extrabold">OR CONTINUE WITH</span>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-2 bg-slate-950 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.579-7.859-7.993 0-4.414 3.529-7.993 7.859-7.993 2.463 0 4.113 1.016 5.056 1.918l3.204-3.085C18.291 1.93 15.539 12h-3.3c-7.07 0-12.8 5.73-12.8 12.8s5.73 12.8 12.8 12.8c7.38 0 12.28-5.19 12.28-12.51 0-.84-.09-1.48-.2-2.1H12.24z"/>
            </svg>
            Sign In with Google Account
          </button>

          {/* Notice to enable providers in console if they fail */}
          {isSignUp && (
            <div className="mt-6 p-2 bg-slate-950/40 border border-slate-850 text-[10px] text-slate-500 leading-normal rounded-xl">
              ⚠️ Email/Password accounts require "Email/Password" to be enabled under your Firebase Project's "Authentication" → "Sign-in method" tab.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
