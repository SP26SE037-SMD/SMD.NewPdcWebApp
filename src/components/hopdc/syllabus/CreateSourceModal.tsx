"use client";

import { useState } from "react";
import { X, Plus, BookText } from "lucide-react";
import { SourcePayload, SourceService } from "@/services/source.service";

interface CreateSourceModalProps {
  syllabusId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SOURCE_TYPE_OPTIONS = [
  "TEXTBOOK",
  "REFERENCE_BOOK",
  "ONLINE_COURSE",
  "DOCUMENTATION",
  "JOURNAL_PAPER",
  "ARTICLE",
] as const;

export function CreateSourceModal({
  syllabusId,
  isOpen,
  onClose,
  onSuccess,
}: CreateSourceModalProps) {
  const [form, setForm] = useState<SourcePayload>({
    sourceName: "",
    type: "",
    author: "",
    publisher: "",
    publishedYear: new Date().getFullYear(),
    isbn: "",
    url: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = () => {
    setForm({
      sourceName: "",
      type: "",
      author: "",
      publisher: "",
      publishedYear: new Date().getFullYear(),
      isbn: "",
      url: "",
    });
    setError("");
    setSuccess("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const extractCreatedSourceId = (response: any): string => {
    const payload = response && typeof response === "object" ? response : {};
    const data =
      payload.data && typeof payload.data === "object" ? payload.data : {};
    return typeof data.sourceId === "string" ? data.sourceId : "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.sourceName.trim()) {
      setError("Source Name is required.");
      return;
    }
    if (!form.type) {
      setError("Please choose a valid source type.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await SourceService.createSource({
        ...form,
        sourceName: form.sourceName.trim(),
        type: form.type.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim(),
        isbn: form.isbn.trim(),
        url: form.url.trim(),
      });

      const createdSourceId = extractCreatedSourceId(res);
      if (!createdSourceId) {
        throw new Error("Create source succeeded but sourceId is missing.");
      }

      await SourceService.linkSourcesToSyllabus(syllabusId, [createdSourceId]);

      setSuccess("Source created and linked successfully!");
      setTimeout(() => {
        handleReset();
        onSuccess();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create source. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full animate-in fade-in zoom-in duration-300 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-100 p-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <h2 className="text-lg font-black text-zinc-900">
              Create New Source
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 ml-1">
                Source Name
              </label>
              <input
                type="text"
                value={form.sourceName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sourceName: e.target.value }))
                }
                placeholder="Enter source name..."
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 ml-1">
                Source Type
              </label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                disabled={isSubmitting}
              >
                <option value="">Choose type...</option>
                {SOURCE_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 ml-1">
                Author
              </label>
              <input
                type="text"
                value={form.author}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, author: e.target.value }))
                }
                placeholder="Author name..."
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 ml-1">
                Publisher
              </label>
              <input
                type="text"
                value={form.publisher}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, publisher: e.target.value }))
                }
                placeholder="Publisher..."
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 ml-1">
                Published Year
              </label>
              <input
                type="number"
                value={form.publishedYear}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    publishedYear: Number(e.target.value || 0),
                  }))
                }
                placeholder="YYYY"
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 ml-1">
                ISBN
              </label>
              <input
                type="text"
                value={form.isbn}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isbn: e.target.value }))
                }
                placeholder="ISBN..."
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-1.5 ml-1">
                URL
              </label>
              <input
                type="text"
                value={form.url}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, url: e.target.value }))
                }
                placeholder="URL..."
                className="w-full h-11 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-base font-semibold text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-base font-semibold text-emerald-700">
                {success}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl border border-zinc-200 bg-white text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-11 rounded-xl bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50 shadow-sm shadow-emerald-200 transition-all"
            >
              {isSubmitting ? "Creating..." : "Create Source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
