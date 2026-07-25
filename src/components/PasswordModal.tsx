"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lock, Eye, EyeOff, AlertTriangle, X, Shield } from "lucide-react";

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  title: string;
  description: string;
  error?: string;
  isLoading?: boolean;
  mode?: "enter" | "create";
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  error,
  isLoading,
  mode = "enter",
}) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword("");
      setConfirmPassword("");
      setLocalError("");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setLocalError("Password tidak boleh kosong.");
      return;
    }
    if (mode === "create") {
      if (password.length < 4) {
        setLocalError("Password minimal 4 karakter.");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Konfirmasi password tidak cocok.");
        return;
      }
    }
    setLocalError("");
    onSubmit(password);
  };

  const displayError = error || localError;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-5 z-10">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            {mode === "create" ? (
              <Shield className="w-7 h-7 text-indigo-600" />
            ) : (
              <Lock className="w-7 h-7 text-indigo-600" />
            )}
          </div>
          <h2 className="text-lg font-black text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {mode === "create" ? "Buat Password Proyek" : "Password Proyek"}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLocalError(""); }}
                placeholder={mode === "create" ? "Buat password baru (min. 4 karakter)" : "Masukkan password proyek"}
                className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "create" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(""); }}
                  placeholder="Ulangi password yang sama"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {displayError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
          >
            {isLoading
              ? "Memproses..."
              : mode === "create"
              ? "Buat Proyek & Kunci Dokumen"
              : "Buka Dokumen"}
          </button>
        </form>

        {mode === "create" && (
          <p className="text-[10px] text-slate-400 text-center leading-relaxed">
            ⚠️ Simpan password ini dengan baik. Password diperlukan setiap kali membuka, mengedit, atau menghapus proyek ini.
          </p>
        )}
      </div>
    </div>
  );
};
