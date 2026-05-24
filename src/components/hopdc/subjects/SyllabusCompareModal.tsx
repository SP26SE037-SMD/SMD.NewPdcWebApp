"use client";

import React, { useState } from "react";
import { X, Check, ArrowRight, ShieldAlert, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { SyllabusService } from "@/services/syllabus.service";
import { CompareResult } from "@/services/syllabus.service";

interface SyllabusCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  oldSyllabusId: string;
  newSyllabusId: string;
  oldSyllabusName: string;
  newSyllabusName: string;
}

export default function SyllabusCompareModal({
  isOpen,
  onClose,
  oldSyllabusId,
  newSyllabusId,
  oldSyllabusName,
  newSyllabusName,
}: SyllabusCompareModalProps) {
  const { data: response, isLoading, isError } = useQuery({
    queryKey: ["compare-syllabus", oldSyllabusId, newSyllabusId],
    queryFn: () => SyllabusService.compareSyllabus(oldSyllabusId, newSyllabusId),
    enabled: isOpen && !!oldSyllabusId && !!newSyllabusId,
  });

  const compareResult: CompareResult | undefined = response?.data;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="text-xl font-black text-zinc-900 tracking-tight">
                Syllabus Comparison Diff
              </h2>
              <div className="flex items-center gap-3 mt-2 text-sm">
                <span className="font-semibold text-zinc-500 line-clamp-1 max-wxs">{oldSyllabusName}</span>
                <ArrowRight size={14} className="text-zinc-300 flex-shrink-0" />
                <span className="font-semibold text-primary line-clamp-1 max-wxs">{newSyllabusName}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 bg-white no-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
                  Analyzing Differences...
                </p>
              </div>
            ) : isError ? (
              <div className="py-20 text-center">
                <AlertTriangle size={48} className="mx-auto text-rose-500 mb-4 opacity-50" />
                <p className="text-lg font-bold text-zinc-900">Comparison Failed</p>
                <p className="text-sm text-zinc-500 mt-2">Could not analyze differences between these two syllabuses.</p>
              </div>
            ) : compareResult ? (
              <div className="space-y-8">
                {/* Concepts Changes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Added */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Added Concepts
                    </h3>
                    <ul className="space-y-3">
                      {compareResult.added_concepts?.length > 0 ? (
                        compareResult.added_concepts.map((concept, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm font-medium text-emerald-900">
                            <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                            {concept}
                          </li>
                        ))
                      ) : (
                        <p className="text-xs text-emerald-600/50 italic">No concepts added</p>
                      )}
                    </ul>
                  </div>

                  {/* Removed */}
                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Removed Concepts
                    </h3>
                    <ul className="space-y-3">
                      {compareResult.removed_concepts?.length > 0 ? (
                        compareResult.removed_concepts.map((concept, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm font-medium text-rose-900 line-through decoration-rose-300">
                            <X size={16} className="text-rose-400 mt-0.5 shrink-0" />
                            {concept}
                          </li>
                        ))
                      ) : (
                        <p className="text-xs text-rose-600/50 italic">No concepts removed</p>
                      )}
                    </ul>
                  </div>

                  {/* Modified */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5">
                    <h3 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Modified Concepts
                    </h3>
                    <ul className="space-y-3">
                      {compareResult.modified_concepts?.length > 0 ? (
                        compareResult.modified_concepts.map((concept, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm font-medium text-blue-900">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                            {concept}
                          </li>
                        ))
                      ) : (
                        <p className="text-xs text-blue-600/50 italic">No concepts modified</p>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 relative overflow-hidden">
                  <ShieldAlert className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-500/10" strokeWidth={1} />
                  
                  <h3 className="text-sm font-black uppercase tracking-widest text-amber-700 mb-2 flex items-center gap-2">
                    <ShieldAlert size={16} className="text-amber-500" />
                    Risk Assessment: {compareResult.risk_assessment}
                  </h3>
                  
                  <div className="bg-white/60 rounded-xl p-4 border border-amber-100 relative z-10 mt-4">
                    <p className="text-sm text-amber-900 font-medium leading-relaxed">
                      {compareResult.risk_reason}
                    </p>
                  </div>
                </div>

              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-white border border-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
