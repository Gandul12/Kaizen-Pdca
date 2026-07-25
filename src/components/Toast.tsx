"use client";

import React, { useEffect } from "react";
import { AlertCircle, X, CheckCircle2, Info } from "lucide-react";

interface ToastProps {
  message: string;
  type?: "error" | "success" | "warning";
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "error",
  onClose,
  duration = 6000,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const bgStyles = {
    error: "bg-rose-50 border-rose-300 text-rose-800",
    success: "bg-emerald-50 border-emerald-300 text-emerald-800",
    warning: "bg-amber-50 border-amber-300 text-amber-800",
  }[type];

  const Icon = {
    error: AlertCircle,
    success: CheckCircle2,
    warning: Info,
  }[type];

  const iconColors = {
    error: "text-rose-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
  }[type];

  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border shadow-md text-xs transition-all animate-in fade-in duration-200 ${bgStyles}`}>
      <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColors}`} />
      <div className="flex-1 font-medium leading-relaxed">{message}</div>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-black/5 text-slate-500 transition-colors shrink-0"
        title="Tutup"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
