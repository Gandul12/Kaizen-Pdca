"use client";

import React, { createContext, useContext, useState } from "react";
import { Lock, Shield, LogIn, RefreshCw, AlertTriangle } from "lucide-react";

interface GenbaAuthContextValue {
  password: string;
}

const GenbaAuthContext = createContext<GenbaAuthContextValue | null>(null);

// Dipakai oleh halaman/komponen di dalam <GenbaPasswordGate> untuk mengambil
// password yang sudah terverifikasi, supaya bisa disertakan sebagai header
// x-genba-password di tiap fetch ke /api/genba/*.
export function useGenbaPassword(): string {
  const ctx = useContext(GenbaAuthContext);
  if (!ctx) {
    throw new Error("useGenbaPassword harus dipakai di dalam <GenbaPasswordGate>");
  }
  return ctx.password;
}

function todayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface GenbaPasswordGateProps {
  children: React.ReactNode;
}

// Gate password genba — reusable, dipakai di /genba, /genba/laporan, dan
// /genba/pengaturan (FR-11). State password disimpan di React state (BUKAN
// localStorage), dan hanya di-unlock setelah request verifikasi NYATA ke
// server berhasil (bukan optimis).
export function GenbaPasswordGate({ children }: GenbaPasswordGateProps) {
  const [password, setPassword] = useState("");
  const [inputPassword, setInputPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputPassword.trim();
    if (!trimmed) {
      setAuthError("Password tidak boleh kosong.");
      return;
    }

    setAuthError("");
    setIsVerifying(true);

    try {
      // Verifikasi nyata ke server — bukan optimis. Endpoint GET /api/genba
      // tidak pernah 404 untuk tanggal manapun (FR-2), jadi aman dipakai
      // murni sebagai pengecekan password.
      const res = await fetch(`/api/genba?date=${todayDateStr()}`, {
        headers: { "x-genba-password": trimmed },
      });
      const json = await res.json().catch(() => ({}));

      if (res.ok && json.success) {
        setPassword(trimmed);
        setIsUnlocked(true);
      } else {
        setAuthError(json.error || "Password salah. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Verifikasi password genba gagal:", err);
      setAuthError("Gagal terhubung ke server, periksa koneksi internet Anda.");
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Genba Checklist</h1>
            <p className="text-xs text-slate-500 mt-1">Masukkan password genba (env: GENBA_PASSWORD).</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={inputPassword}
                onChange={(e) => {
                  setInputPassword(e.target.value);
                  setAuthError("");
                }}
                placeholder="Password genba"
                autoFocus
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {isVerifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {isVerifying ? "Memverifikasi..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <GenbaAuthContext.Provider value={{ password }}>{children}</GenbaAuthContext.Provider>;
}
