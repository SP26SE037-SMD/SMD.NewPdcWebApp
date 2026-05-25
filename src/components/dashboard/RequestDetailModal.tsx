import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ClipboardList, Clock, CheckCircle2, XCircle, User, Calendar } from "lucide-react";
import { RequestItem } from "@/services/request.service";

const C = {
  primary: "#41683f",
  surface: "#f8faf2",
  surfaceContainerHigh: "#e4eade",
  onSurface: "#2d342b",
  onSurfaceVariant: "#5a6157",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  PENDING: { label: "Pending", color: "#b45309", bg: "#fef3c7", icon: Clock },
  APPROVED: { label: "Approved", color: "#15803d", bg: "#dcfce7", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "#b91c1c", bg: "#ffe4e6", icon: XCircle },
};

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RequestItem | null;
}

export default function RequestDetailModal({ isOpen, onClose, request }: RequestDetailModalProps) {
  if (!isOpen || !request) return null;

  const statusCfg = STATUS_CONFIG[request.status?.toUpperCase()] || {
    label: request.status,
    color: C.onSurfaceVariant,
    bg: C.surfaceContainerHigh,
    icon: null,
  };
  const StatusIcon = statusCfg.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: `${C.primary}12`, color: C.primary }}
              >
                <ClipboardList size={20} />
              </div>
              <h2 className="text-xl font-black" style={{ color: C.onSurface, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                Request Details
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Title</p>
              <p className="text-base font-bold text-zinc-800">{request.title || "Untitled"}</p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Content</p>
              <p className="text-sm font-medium text-zinc-600 bg-zinc-50 p-4 rounded-2xl whitespace-pre-wrap border border-zinc-100 leading-relaxed">
                {request.content}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Status</p>
                <div className="flex items-center">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide"
                    style={{ color: statusCfg.color, background: statusCfg.bg }}
                  >
                    {StatusIcon && <StatusIcon size={14} />}
                    {statusCfg.label}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Type</p>
                <span
                  className="inline-flex px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wide border"
                  style={{ background: `${C.primary}08`, color: C.primary, borderColor: `${C.primary}20` }}
                >
                  {request.type || "—"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                  <User size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Receiver</p>
                  <p className="text-xs font-semibold text-zinc-700">
                    {request.receivedBy?.fullName || request.receivedBy?.email || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Created At</p>
                  <p className="text-xs font-semibold text-zinc-700">
                    {request.createdAt
                      ? new Date(request.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {request.comment && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Feedback / Comment</p>
                <p className="text-sm font-medium text-amber-700 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  {request.comment}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
