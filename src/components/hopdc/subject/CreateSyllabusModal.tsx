import { useState, useEffect } from "react";
import { X, BookPlus, Loader2, Check } from "lucide-react";
import {
  CreateSyllabusPayload,
  SyllabusService,
} from "@/services/syllabus.service";
import { SourceService } from "@/services/source.service";
import { useQuery } from "@tanstack/react-query";

interface CreateSyllabusModalProps {
  subjectId: string;
  accountEmail: string;
  minBloomLevel: number;
  minAvgGrade: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdSyllabus?: any) => void;
}

export function CreateSyllabusModal({
  subjectId,
  accountEmail,
  minBloomLevel,
  minAvgGrade,
  isOpen,
  onClose,
  onSuccess,
}: CreateSyllabusModalProps) {
  const [syllabusName, setSyllabusName] = useState("");
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { data: subjectSourcesRes, isLoading: isSourcesLoading } = useQuery({
    queryKey: ["subject-sources", subjectId],
    queryFn: () => SourceService.getSubjectSources(subjectId),
    enabled: isOpen && !!subjectId,
  });

  const subjectSources = (subjectSourcesRes?.data as any[]) || [];

  const resetForm = () => {
    setSyllabusName("");
    setSelectedSourceIds([]);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const toggleSource = (sourceId: string) => {
    setSelectedSourceIds((prev) =>
      prev.includes(sourceId)
        ? prev.filter((id) => id !== sourceId)
        : [...prev, sourceId],
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!accountEmail.trim()) {
      setError("Email is required.");
      return;
    }

    if (!syllabusName.trim()) {
      setError("Syllabus name is required.");
      return;
    }

    const payload: CreateSyllabusPayload = {
      subjectId,
      syllabusName: syllabusName.trim(),
      minBloomLevel,
      minAvgGrade,
    };

    setIsSubmitting(true);
    try {
      const createdSyllabusRes = await SyllabusService.createSyllabusByAccount(
        accountEmail.trim(),
        payload,
      );

      onSuccess(createdSyllabusRes);
      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create syllabus.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/45 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <BookPlus size={18} />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-900">
                Create Syllabus
              </h3>
              <p className="text-xs font-bold text-zinc-400">
                Define version and attach reference materials.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="h-9 w-9 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            aria-label="Close"
          >
            <X size={16} className="mx-auto" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-5"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-black uppercase tracking-widest text-zinc-500">
                Syllabus Version Name
              </label>
              <input
                type="text"
                value={syllabusName}
                onChange={(event) => setSyllabusName(event.target.value)}
                placeholder="e.g. Fall 2024 - Rev 1"
                className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-800 outline-none focus:border-emerald-300"
                required
              />
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 flex flex-wrap gap-x-6 gap-y-2">
              <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                Thresholds:
              </div>
              <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                Min Bloom:{" "}
                <span className="text-amber-900 font-bold">
                  {minBloomLevel}
                </span>
              </div>
              <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                Min Avg:{" "}
                <span className="text-amber-900 font-bold">{minAvgGrade}</span>
              </div>
            </div>

            {/* Source Selection Section */}
            {/* <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                  Reference Materials (Sources)
                </label>
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {selectedSourceIds.length} Selected
                </span>
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {isSourcesLoading ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <Loader2 size={14} className="animate-spin text-zinc-400" />
                    <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Loading Sources...</span>
                  </div>
                ) : subjectSources.length > 0 ? (
                  subjectSources.map((source) => (
                    <div
                      key={source.sourceId}
                      onClick={() => toggleSource(source.sourceId)}
                      className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        selectedSourceIds.includes(source.sourceId)
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-zinc-50 border-zinc-100 text-zinc-600 hover:border-zinc-200"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="text-[11px] font-black truncate">
                          {source.sourceName}
                        </div>
                        <div className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">
                          {source.type} {source.author ? `• ${source.author}` : ""}
                        </div>
                      </div>
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                        selectedSourceIds.includes(source.sourceId)
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white border-zinc-200 text-transparent group-hover:border-zinc-300"
                      }`}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 border-2 border-dashed border-zinc-100 rounded-2xl">
                    <p className="text-[11px] font-semibold text-zinc-400">No subject sources found.</p>
                  </div>
                )}
              </div>
            </div> */}
          </div>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
              {error}
            </p>
          )}
        </form>

        <div className="flex items-center justify-end gap-2 p-6 border-t border-zinc-100 bg-white shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-widest text-zinc-700 hover:bg-zinc-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="h-10 rounded-xl bg-emerald-600 px-6 text-[11px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 disabled:opacity-60 shadow-lg shadow-emerald-100 transition-all flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Assign & Create"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
