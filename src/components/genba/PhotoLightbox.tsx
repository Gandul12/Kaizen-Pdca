"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface PhotoLightboxProps {
  imageUrl: string;
  caption?: string;
  onClose: () => void;
}

// Overlay sederhana untuk melihat foto ukuran penuh. Strukturnya mengikuti
// pola PasswordModal.tsx (backdrop fixed inset-0 z-50 + card relative z-10),
// ditambah penutupan lewat tombol Esc.
export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({ imageUrl, caption, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Foto */}
      <div className="relative max-w-3xl max-h-[85vh] w-full z-10 flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white text-slate-700 hover:text-slate-900 p-2 rounded-full shadow-lg z-20"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          src={imageUrl}
          alt={caption || "Foto genba"}
          className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />

        {caption && (
          <p className="text-white text-xs mt-2 text-center bg-black/40 px-3 py-1 rounded-full">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};
