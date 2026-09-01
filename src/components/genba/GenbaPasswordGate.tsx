"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Lock, ShieldCheck } from "lucide-react";

interface GenbaAuthContextValue {
  password: string;
  /** fetch() wrapper yang otomatis menambahkan header x-genba-password, dan
   * otomatis "logout" (tampilkan form password lagi) kalau server balas 401. */
  genbaFetch: (input: string, init?: RequestInit) => Promise<Response>;
}

const GenbaAuthContext = createContext<GenbaAuthContextValue | null>(null);

export function useGenbaAuth(): GenbaAuthContextValue {
  const ctx = useContext(GenbaAuthContext);
  if (!ctx) {
    throw new Error("useGenbaAuth harus dipakai di dalam <GenbaPasswordGate>");
  }
  return ctx;
}

interface GenbaPasswordGateProps {
  children: ReactNode;
  /** URL endpoint /api/genba/* yang dipakai untuk verifikasi password saat
   * login (dipanggil dengan method GET + header password). */
  verifyUrl: string;
}

// Gerbang password untuk halaman genba — pola sama seperti admin/page.tsx:
// password disimpan di React state (bukan cookie/localStorage), dikirim
// ulang lewat header di setiap request ke API yang butuh otorisasi.
export const GenbaPasswordGate: React.FC<GenbaPasswordGateProps> = ({ children, verifyUrl }) => {
  const [password, setPassword] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState("");

  const genbaFetch = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const headers = new Headers(init.headers || {});
      headers.set("x-genba-password", password);
      const res = await fetch(input, { ...init, headers });
      if (res.status === 401) {
        setIsAuthenticated(false);
        setError("Sesi tidak valid, masukkan password lagi.");
      }
      return res;
    },
    [password]
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError("Password tidak boleh kosong.");
      return;
    }
    setIsChecking(true);
    setError("");
    try {
      const res = await fetch(verifyUrl, { headers: { "x-genba-password": inputValue } });
      const json = await res.json();
      if (json.success) {
        setPassword(inputValue);
        setIsAuthenticated(true);
      } else {
        setError(json.error || "Password salah.");
      }
    } catch (err) {
      console.error("Genba password verify error:", err);
      setError("Gagal menghubungi server.");
    } finally {
      setIsChecking(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-xl font-black text-slate-900">Checklist Genba</h1>
            <p className="text-xs text-slate-500 mt-1">Masukkan password akses genba.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                }}
                placeholder="Password genba"
                autoFocus
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            <button
              type="submit"
              disabled={isChecking}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {isChecking ? "Memeriksa..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <GenbaAuthContext.Provider value={{ password, genbaFetch }}>{children}</GenbaAuthContext.Provider>;
};
