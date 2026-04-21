"use client";

import { useState, useEffect } from "react";
import { X, Pencil, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { CloPloService, SubjectClo } from "@/services/cloplo.service";
import { BLOOM_LEVELS } from "@/components/hopdc/interface/Interface";

interface UpdateCloModalProps {
  subjectId: string;
  clo: SubjectClo | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  minBloomLevel?: number;
}

export function UpdateCloModal({
  subjectId,
  clo,
  isOpen,
  onClose,
  onSuccess,
  minBloomLevel = 0,
}: UpdateCloModalProps) {
  const [cloCode, setCloCode] = useState("");
  const [description, setDescription] = useState("");
  const [bloomLevel, setBloomLevel] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isOpen && clo) {
      setCloCode(clo.cloCode || "");
      setDescription(clo.description || "");
      setBloomLevel(clo.bloomLevel !== undefined ? Number(clo.bloomLevel) : "");
      setError("");
      setSuccess("");
    }
  }, [isOpen, clo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clo) return;

    setError("");
    setSuccess("");

    if (
      !cloCode.trim() ||
      !description.trim() ||
      bloomLevel === ""
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (Number(bloomLevel) < minBloomLevel) {
      setError(
        `Bloom level must be at least Level ${minBloomLevel} as required for this subject.`,
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await CloPloService.updateClo(clo.cloId, {
        cloCode: cloCode.trim(),
        cloName: cloCode.trim(), // Use code as name
        description: description.trim(),
        bloomLevel: String(bloomLevel),
        subjectId,
      });

      setSuccess("CLO updated successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update CLO");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full animate-in fade-in zoom-in duration-300 border border-zinc-100">
        <div className="flex items-center justify-between border-b border-zinc-100 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
              <Pencil size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                Update CLO
              </h2>
              <p className="text-xs text-zinc-500 font-medium italic">
                Modify existing learning outcome details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 hover:bg-zinc-50 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">
                CLO Code
              </label>
              <input
                type="text"
                value={cloCode}
                onChange={(e) => setCloCode(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/30 text-sm font-bold text-zinc-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all"
                placeholder="e.g. CLO1"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/30 text-sm font-medium text-zinc-700 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all resize-none leading-relaxed"
                placeholder="Detailed description of what students will achieve..."
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-2 ml-1">
                Bloom Level{" "}
                {minBloomLevel > 0 && (
                  <span className="text-amber-600 ml-1">
                    (Min Level {minBloomLevel} required)
                  </span>
                )}
              </label>
              <select
                value={bloomLevel}
                onChange={(e) => setBloomLevel(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50/30 text-sm font-bold text-zinc-900 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 outline-none transition-all appearance-none cursor-pointer"
                disabled={isSubmitting}
              >
                <option value="" disabled>
                  Select Bloom Level
                </option>
                {BLOOM_LEVELS.filter(
                  (level) => level.value >= minBloomLevel,
                ).map((level) => (
                  <option key={level.value} value={level.value}>
                    Level {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(error || success) && (
            <div
              className={`p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
                error
                  ? "bg-red-50 border-red-100 text-red-700"
                  : "bg-emerald-50 border-emerald-100 text-emerald-700"
              }`}
            >
              {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <p className="text-sm font-bold">{error || success}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-zinc-200 text-sm font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all active:scale-95"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] h-12 rounded-xl bg-amber-500 text-white text-sm font-black uppercase tracking-widest hover:bg-amber-600 shadow-lg shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSubmitting ? "Updating..." : "Update CLO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Save({ size, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
