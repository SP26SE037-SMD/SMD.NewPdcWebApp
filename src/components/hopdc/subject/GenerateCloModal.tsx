"use client";

import { useState } from "react";
import { X, Wand2 } from "lucide-react";
import { CloPloService } from "@/services/cloplo.service";
import { PLO } from "@/services/curriculum.service";
import { BLOOM_LEVELS } from "@/components/hopdc/interface/Interface";

interface GenerateCloModalProps {
  subjectName: string;
  plos: PLO[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (generatedClo: {
    cloName: string;
    description: string;
    bloomLevel: number;
  }) => void;
}

export function GenerateCloModal({
  subjectName,
  plos,
  isOpen,
  onClose,
  onSuccess,
}: GenerateCloModalProps) {
  const [topicName, setTopicName] = useState("");
  const [bloomLevel, setBloomLevel] = useState<number | "">("");
  const [selectedPloId, setSelectedPloId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedPlo = plos.find((plo) => plo.ploId === selectedPloId);

  const handleReset = () => {
    setTopicName("");
    setBloomLevel("");
    setSelectedPloId("");
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!topicName.trim()) {
      setError("Topic Name is required.");
      return;
    }

    if (bloomLevel === "" || bloomLevel === null) {
      setError("Bloom Level is required.");
      return;
    }

    if (!selectedPloId) {
      setError("PLO selection is required.");
      return;
    }

    if (!selectedPlo) {
      setError("Selected PLO not found.");
      return;
    }

    setIsGenerating(true);

    try {
      const result = await CloPloService.generateClo({
        subjectName: subjectName.trim(),
        topicName: topicName.trim(),
        bloomLevel: Number(bloomLevel),
        descriptionPlo: selectedPlo.description || "",
      });

      setSuccess("CLO generated successfully!");
      setTimeout(() => {
        handleReset();
        onSuccess({
          cloName: result.cloName,
          description: result.description,
          bloomLevel: Number(bloomLevel),
        });
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate CLO. Please try again.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between border-b border-zinc-200 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wand2 size={20} />
            </div>
            <h2 className="text-xl font-black text-zinc-900">Generate CLO</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-2">
              Subject Name
            </label>
            <div className="px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-base font-medium text-zinc-900">
              {subjectName || "N/A"}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-2">
              Main Content
            </label>
            <textarea
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="Main content description of CLO..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors resize-none"
              disabled={isGenerating}
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
              disabled={isGenerating}
            >
              <option value="" disabled>
                Select Bloom Level
              </option>
              {BLOOM_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-2">
              PLO Description
            </label>
            <select
              value={selectedPloId}
              onChange={(e) => setSelectedPloId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors"
              disabled={isGenerating || plos.length === 0}
            >
              <option value="" disabled>
                {plos.length === 0 ? "No PLOs available" : "Select a PLO"}
              </option>
              {plos.map((plo) => (
                <option key={plo.ploId} value={plo.ploId}>
                  {plo.ploCode || "PLO"} - {plo.description || "Unnamed"}
                </option>
              ))}
            </select>
          </div>

          {selectedPlo && (
            <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-3 space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600">
                PLO Description
              </p>
              <p className="text-base text-zinc-700 leading-relaxed whitespace-pre-wrap">
                {selectedPlo.description || "No description"}
              </p>
            </div>
          )}

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

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isGenerating}
              className="flex-1 h-10 rounded-lg border border-zinc-200 bg-white text-sm font-black uppercase tracking-widest text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating || plos.length === 0}
              className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 size={14} />
                  Generate
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
