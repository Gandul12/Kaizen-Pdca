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
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-[#101f36] border border-[#8fa3bd]/20 rounded-2xl shadow-2xl p-6 max-w-sm w-full space-y-5 z-10 text-white">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#8fa3bd] hover:text-white p-1 rounded-full hover:bg-[#16304f] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-14 h-14 bg-[#16304f] border border-[#d4a94c]/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#f0d68a]">
            {mode === "create" ? (
              <Shield className="w-7 h-7 text-[#1fb6a8]" />
            ) : (
              <Lock className="w-7 h-7 text-[#f0d68a]" />
            )}
          </div>
          <h2 className="font-display text-xl font-extrabold text-white tracking-wide">{title}</h2>
          <p className="text-xs text-[#8fa3bd] mt-1 leading-relaxed font-body">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#8fa3bd] mb-1">
              {mode === "create" ? "Buat Password Proyek" : "Password Proyek"}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8fa3bd] absolute left-3 top-2.5" />
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLocalError(""); }}
                placeholder={mode === "create" ? "Buat password baru (min. 4 karakter)" : "Masukkan password proyek"}
                className="w-full pl-10 pr-10 py-2 bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl text-sm text-white placeholder-[#8fa3bd]/50 focus:ring-2 focus:ring-[#1fb6a8] focus:outline-none"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#8fa3bd] hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === "create" && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#8fa3bd] mb-1">
                Konfirmasi Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8fa3bd] absolute left-3 top-2.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setLocalError(""); }}
                  placeholder="Ulangi password yang sama"
                  className="w-full pl-10 pr-4 py-2 bg-[#16304f] border border-[#8fa3bd]/30 rounded-xl text-sm text-white placeholder-[#8fa3bd]/50 focus:ring-2 focus:ring-[#1fb6a8] focus:outline-none"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {displayError && (
            <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-gold py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            {isLoading
              ? "Memproses..."
              : mode === "create"
              ? "Buat Proyek & Kunci Dokumen"
              : "Buka Dokumen"}
          </button>
        </form>

        {mode === "create" && (
          <p className="text-[10px] text-[#8fa3bd] text-center leading-relaxed">
            ⚠️ Simpan password ini baik-baik, tidak dapat dipulihkan secara otomatis.
          </p>
        )}
      </div>
    </div>
  );
};
