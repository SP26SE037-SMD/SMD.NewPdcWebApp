"use client";

import { useState } from "react";
import { X, Plus, Sparkles } from "lucide-react";
import { CloPloService } from "@/services/cloplo.service";
import { PLO } from "@/services/curriculum.service";
import { BLOOM_LEVELS } from "@/components/hopdc/interface/Interface";
import { GenerateCloModal } from "@/components/hopdc/subject/GenerateCloModal";
interface CreateCloModalProps {
  subjectId: string;
  subjectName: string;
  plos: PLO[];
  minBloomLevel?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateCloModal({
  subjectId,
  subjectName,
  plos,
  minBloomLevel = 0,
  isOpen,
  onClose,
  onSuccess,
}: CreateCloModalProps) {
  const [cloCode, setCloCode] = useState("");
  const [cloName, setCloName] = useState("");
  const [description, setDescription] = useState("");
  const [bloomLevel, setBloomLevel] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkResult, setCheckResult] = useState<{
    valid: boolean;
    detectedVerb: string;
    detectedLevel: string;
    suggestion: string;
  } | null>(null);

  const handleReset = () => {
    setCloCode("");
    setCloName("");
    setDescription("");
    setBloomLevel("");
    setError("");
    setSuccess("");
    setCheckResult(null);
  };

  const handleCheckClo = async () => {
    setError("");
    setSuccess("");
    setCheckResult(null);

    if (!description.trim()) {
      setError("Description is required to check CLO.");
      return;
    }

    if (bloomLevel === "") {
      setError("Bloom Level is required to check CLO.");
      return;
    }

    setIsChecking(true);

    try {
      const result = await CloPloService.checkClo({
        cloContent: description.trim(),
        targetLevel: bloomLevel,
      });

      setCheckResult(result);
      if (result.valid) {
        setSuccess("Description is valid for selected Bloom level.");
      } else {
        setError("Description is not valid for selected Bloom level.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to check CLO. Please try again.",
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleGenerateSuccess = (generatedClo: {
    cloName: string;
    description: string;
    bloomLevel: number;
  }) => {
    // AI only returns cloName/description, these values are copied into the create form.
    setCloName(generatedClo.cloName || "");
    setDescription(generatedClo.description || "");
    setBloomLevel(generatedClo.bloomLevel);
    setCheckResult(null);
    setError("");
    setSuccess("AI suggestion has been filled into the form.");
    setIsGenerateModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!cloCode.trim()) {
      setError("CLO Code is required.");
      return;
    }

    if (!cloName.trim()) {
      setError("CLO Name is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (bloomLevel === "") {
      setError("Bloom Level is required.");
      return;
    }

    if (Number(bloomLevel) < minBloomLevel) {
      setError(`Bloom level must be at least Level ${minBloomLevel} as required for this subject.`);
      return;
    }

    setIsSubmitting(true);

    try {
      await CloPloService.createClo(subjectId, [
        {
          cloCode: cloCode.trim(),
          cloName: cloName.trim(),
          description: description.trim(),
          bloomLevel: String(bloomLevel),
        },
      ]);

      setSuccess("CLO created successfully!");
      setTimeout(() => {
        handleReset();
        onSuccess();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create CLO. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between border-b border-zinc-200 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <h2 className="text-xl font-black text-zinc-900">Create CLO</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-2">
                CLO Code
              </label>
              <input
                type="text"
                value={cloCode}
                onChange={(e) => setCloCode(e.target.value)}
                placeholder="CLO Code"
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
                disabled={isSubmitting}
              />
            </div>
            <button
              type="button"
              onClick={() => setIsGenerateModalOpen(true)}
              disabled={isSubmitting || isChecking}
              className="h-10 rounded-lg border border-zinc-200 bg-emerald-50 px-4 text-sm font-black uppercase tracking-widest text-zinc-700 hover:bg-emerald-100 shadow-md shadow-emerald-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap inline-flex items-center justify-center gap-2"
            >
              <Sparkles size={15} className="shrink-0" />
              Generate AI
            </button>
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-2">
              CLO Name
            </label>
            <input
              type="text"
              value={cloName}
              onChange={(e) => setCloName(e.target.value)}
              placeholder="CLO Name"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-2">
              CLO Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the learning outcome..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors resize-none"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-2">
              Bloom Level
            </label>
            <select
              value={bloomLevel}
              onChange={(e) =>
                setBloomLevel(e.target.value ? Number(e.target.value) : "")
              }
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
              disabled={isSubmitting || isChecking}
            >
              <option value="" disabled>
                Select Bloom Level of CLO
              </option>
              {BLOOM_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-base font-semibold text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-base font-semibold text-emerald-700">
                {success}
              </p>
            </div>
          )}

          {checkResult && (
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 space-y-1">
              <p className="text-base text-zinc-700 whitespace-pre-wrap">
                Suggestion: {checkResult.suggestion || "N/A"}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting || isChecking}
              className="h-10 rounded-lg border border-zinc-200 bg-white text-sm font-black uppercase tracking-widest text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCheckClo}
              disabled={isSubmitting || isChecking}
              className="h-10 rounded-lg border border-zinc-200 bg-white text-sm font-black uppercase tracking-widest text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isChecking ? "Checking..." : "Check CLO"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isChecking}
              className="h-10 rounded-lg bg-emerald-600 text-white text-sm font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creating..." : "Create CLO"}
            </button>
          </div>
        </form>
      </div>

      <GenerateCloModal
        subjectName={subjectName}
        plos={plos}
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        onSuccess={handleGenerateSuccess}
      />
    </div>
  );
}
