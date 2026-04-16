"use client";

import { useEffect, useState, useCallback } from "react";
import {
  X,
  BookText,
  Link as LinkIcon,
  Unlink,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { SourceService } from "@/services/source.service";
import { CreateSourceModal } from "./CreateSourceModal";
import { useToast } from "@/components/ui/Toast";

interface SourceItem {
  sourceId: string;
  sourceName: string;
  type: string;
  author?: string;
  publisher?: string;
  publishedYear?: number;
  isbn?: string;
  url?: string;
}

interface ManageSyllabusSourcesModalProps {
  syllabusId: string;
  syllabusName?: string;
  isOpen: boolean;
  onClose: () => void;
  hideAddButton?: boolean;
}

export function ManageSyllabusSourcesModal({
  syllabusId,
  syllabusName,
  isOpen,
  onClose,
  hideAddButton = false,
}: ManageSyllabusSourcesModalProps) {
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { showToast } = useToast();

  const fetchSources = useCallback(async () => {
    if (!syllabusId) return;
    setIsLoading(true);
    try {
      const res = await SourceService.getSyllabusSources(syllabusId);
      const data = res?.data;
      if (Array.isArray(data)) {
        setSources(data as SourceItem[]);
      } else if (data && typeof data === "object") {
        const payload = data as Record<string, any>;
        setSources(payload.content || payload.items || []);
      }
    } catch (err) {
      console.error("Failed to fetch sources:", err);
      showToast("Failed to load reference materials", "error");
    } finally {
      setIsLoading(false);
    }
  }, [syllabusId, showToast]);

  useEffect(() => {
    if (isOpen) {
      fetchSources();
    }
  }, [isOpen, fetchSources]);

  const handleDelete = async (sourceId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this reference from the system?",
      )
    )
      return;

    try {
      await SourceService.deleteSource(sourceId);
      showToast("Reference deleted successfully", "success");
      fetchSources();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to delete reference",
        "error",
      );
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-300 overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 p-6 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <BookText size={20} />
              </div>
              <div>
                <h2 className="text-lg font-black text-zinc-900 leading-tight">
                  Reference Materials
                </h2>
                <p className="text-xs font-bold text-zinc-400 truncate max-w-[300px]">
                  {syllabusName || "Syllabus Sources"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!hideAddButton && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-100"
                >
                  <Plus size={14} />
                  Add New
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/30">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                  Loading references...
                </p>
              </div>
            ) : sources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-zinc-200">
                <div className="h-16 w-16 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-200 mb-4">
                  <BookText size={32} />
                </div>
                <p className="text-base font-bold text-zinc-400">
                  No reference materials found
                </p>
                <p className="text-xs font-medium text-zinc-300 mt-1 mb-6">
                  {hideAddButton
                    ? "Contact HoPDC to manage reference materials"
                    : "Add textbooks or other documents to this syllabus"}
                </p>
                {!hideAddButton && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                  >
                    Create First Source
                  </button>
                )}
              </div>
            ) : (
              <div className="grid gap-3">
                {sources.map((source) => (
                  <div
                    key={source.sourceId}
                    className="group bg-white rounded-2xl border border-zinc-100 p-4 flex items-start gap-4 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-50/50 transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl bg-zinc-50 text-zinc-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors">
                      <LinkIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-black text-zinc-800 leading-tight mb-1 group-hover:text-indigo-900 transition-colors">
                          {source.sourceName}
                        </h3>
                        <span className="shrink-0 px-2 py-0.5 rounded-lg bg-zinc-100 text-[10px] font-black text-zinc-500 uppercase tracking-tighter">
                          {source.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {source.author && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                            <span className="text-zinc-300">By</span>
                            {source.author}
                          </div>
                        )}
                        {source.publisher && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                            <span className="text-zinc-300">Pub</span>
                            {source.publisher}
                          </div>
                        )}
                        {source.publishedYear && (
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                            <span className="text-zinc-300">Year</span>
                            {source.publishedYear}
                          </div>
                        )}
                      </div>
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-3 text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-700 transition-colors"
                        >
                          View Document
                          <X size={10} className="rotate-45" />
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(source.sourceId)}
                      className="p-2.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete from system"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-zinc-100 bg-white shrink-0">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl border border-zinc-200 bg-white text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all font-inter"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <CreateSourceModal
        syllabusId={syllabusId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          fetchSources();
        }}
      />
    </>
  );
}
