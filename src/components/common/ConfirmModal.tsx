"use client";

import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isDanger?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onClose,
  isDanger = false,
  size = "sm",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const maxWidthClass = size === "md" ? "max-w-md" : size === "lg" ? "max-w-lg" : "max-w-sm";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full animate-in fade-in zoom-in duration-300 ${maxWidthClass}`}>
        <div className="flex items-center justify-between border-b border-zinc-100 p-5">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${isDanger ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
              {isDanger ? <AlertTriangle size={18} /> : <AlertTriangle size={18} />}
            </div>
            <h2 className="text-base font-black text-zinc-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-zinc-600 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white text-xs font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl text-white text-xs font-black uppercase tracking-widest transition-colors ${
              isDanger 
                ? "bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200" 
                : "bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
