"use client";

import React from "react";
import { X, Clock, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { SyllabusService } from "@/services/syllabus.service";

interface SyllabusCompareHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  newSyllabusId: string;
}

const renderJsonDiff = (jsonString: string) => {
  if (!jsonString) return <p className="text-xs text-zinc-400 italic">No data</p>;
  try {
    const cleanStr = jsonString.replace(/^```json\n/, '').replace(/\n```$/, '');
    const data = JSON.parse(cleanStr);
    
    if (typeof data !== 'object' || data === null) {
      return <p className="text-xs text-zinc-600">{jsonString}</p>;
    }

    const entries = Object.entries(data).filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== "";
    });

    if (entries.length === 0) {
      return <p className="text-xs text-zinc-400 italic">No changes detected</p>;
    }

    return (
      <div className="space-y-3">
        {entries.map(([key, value]) => {
          let badgeColor = "bg-zinc-100 text-zinc-500";
          if (key.includes("added")) badgeColor = "bg-emerald-100 text-emerald-700";
          else if (key.includes("removed")) badgeColor = "bg-rose-100 text-rose-700";
          else if (key.includes("modified")) badgeColor = "bg-amber-100 text-amber-700";
          else if (key.includes("risk") && value === "HIGH") badgeColor = "bg-red-100 text-red-700";
          else if (key.includes("risk") && value === "MEDIUM") badgeColor = "bg-amber-100 text-amber-700";

          const formattedKey = key.replace(/_/g, " ");

          return (
            <div key={key} className="bg-white rounded p-3 border border-zinc-100 shadow-sm">
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest inline-block mb-2 ${badgeColor}`}>
                {formattedKey}
              </span>
              {Array.isArray(value) ? (
                <ul className="list-disc pl-4 text-xs text-zinc-700 space-y-1">
                  {value.map((v: any, i: number) => (
                    <li key={i}>{typeof v === 'string' ? v : JSON.stringify(v)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-zinc-700 font-medium leading-relaxed">{String(value)}</p>
              )}
            </div>
          );
        })}
      </div>
    );
  } catch (e) {
    return <p className="text-xs text-zinc-600 font-medium whitespace-pre-wrap">{jsonString}</p>;
  }
};

export default function SyllabusCompareHistoryModal({
  isOpen,
  onClose,
  newSyllabusId,
}: SyllabusCompareHistoryModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: historyRes, isLoading } = useQuery({
    queryKey: ["compare-history", newSyllabusId],
    queryFn: () => SyllabusService.getSyllabusCompareHistory(newSyllabusId),
    enabled: isOpen && !!newSyllabusId,
  });

  const { mutate: selectCompare, isPending } = useMutation({
    mutationFn: (historyId: string) => SyllabusService.selectCompareSyllabus(historyId),
    onSuccess: () => {
      showToast("Select compare syllabus successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["compare-history", newSyllabusId] });
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to select compare syllabus", "error");
    },
  });

  const histories = historyRes?.data || [];

  if (!isOpen || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-5xl flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                Compare Prompts History
              </h2>
              <p className="text-sm font-medium text-zinc-500 mt-1">
                Select a compare history to use for this syllabus.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 bg-slate-50 min-h-[400px] max-h-[80vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mt-4">
                  Loading History...
                </p>
              </div>
            ) : histories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-400">
                <Clock size={48} className="mb-4 opacity-50" />
                <p className="font-bold text-sm uppercase tracking-widest">No history found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {histories.map((item, idx) => (
                  <div
                    key={item.historyId}
                    className={`bg-white rounded-2xl p-6 border shadow-sm transition-all ${
                      item.selectedCompare
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                        : "border-zinc-200 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {item.selectedCompare ? (
                            <CheckCircle2 size={20} className="text-primary" />
                          ) : (
                            <Circle size={20} className="text-zinc-300" />
                          )}
                          <span className="font-black text-lg text-zinc-900">Compare History #{histories.length - idx}</span>
                          {item.selectedCompare && (
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest ml-2">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-zinc-500 font-medium flex items-center gap-2">
                          <Clock size={14} />
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => selectCompare(item.historyId)}
                        disabled={isPending || item.selectedCompare}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 ${
                          item.selectedCompare
                            ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                            : "bg-primary text-white hover:bg-primary/90 shadow-primary/25"
                        }`}
                      >
                        {item.selectedCompare ? "Selected" : "Select This Prompts"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mt-4">
                      <div className="bg-zinc-50/50 rounded-xl p-4 border border-zinc-100 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          <p className="text-xs font-black text-zinc-700 uppercase tracking-widest">Concept Prompts</p>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {renderJsonDiff(item.conceptDiffJson)}
                        </div>
                      </div>
                      <div className="bg-zinc-50/50 rounded-xl p-4 border border-zinc-100 shadow-inner">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          <p className="text-xs font-black text-zinc-700 uppercase tracking-widest">Assessment Prompts</p>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                          {renderJsonDiff(item.assessmentDiffJson)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
