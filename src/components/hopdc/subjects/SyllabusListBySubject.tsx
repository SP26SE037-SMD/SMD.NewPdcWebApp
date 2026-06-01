"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Filter,
  GitCompare, CheckSquare, Square, Eye
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { SyllabusService } from "@/services/syllabus.service";
import { SubjectService } from "@/services/subject.service";
const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-600 border-zinc-200",
  IN_PROGRESS: "bg-blue-50 text-blue-600 border-blue-200",
  PENDING_REVIEW: "bg-amber-50 text-amber-600 border-amber-200",
  REVISION_REQUESTED: "bg-rose-50 text-rose-600 border-rose-200",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  PUBLISHED: "bg-primary/10 text-primary border-primary/20",
  ARCHIVED: "bg-zinc-100 text-zinc-500 border-zinc-200",
};
import SyllabusCompareModal from "./SyllabusCompareModal";
import SyllabusCompareHistoryModal from "./SyllabusCompareHistoryModal";

export default function SyllabusListBySubject({ subjectId, hideHeader = false }: { subjectId: string; hideHeader?: boolean }) {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedSyllabusIds, setSelectedSyllabusIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Fetch Subject details
  const { data: subjectResp, isLoading: subjectLoading } = useQuery({
    queryKey: ["subject-detail", subjectId],
    queryFn: () => SubjectService.getSubjectById(subjectId),
    enabled: !!subjectId,
  });
  const subject = subjectResp?.data;

  // Fetch Syllabuses
  const { data: syllabiResp, isLoading: syllabiLoading } = useQuery({
    queryKey: ["subject-syllabi", subjectId],
    queryFn: () => SyllabusService.getSyllabiBySubject(subjectId),
    enabled: !!subjectId,
  });

  const syllabuses = useMemo(() => syllabiResp?.data || [], [syllabiResp?.data]);

  useEffect(() => {
    if (syllabuses.length > 0 && selectedSyllabusIds.length === 0 && !isCompareMode) {
      const pubSyllabus = syllabuses.find((s) => s.status === "PUBLISHED");
      if (pubSyllabus) {
        const archivedSyllabuses = syllabuses.filter((s) => s.status === "ARCHIVED");
        if (archivedSyllabuses.length > 0) {
          const pubDate = new Date(pubSyllabus.approvedDate || pubSyllabus.createdAt || 0).getTime();
          const closestArchived = archivedSyllabuses.reduce((prev, curr) => {
            const prevDate = new Date(prev.approvedDate || prev.createdAt || 0).getTime();
            const currDate = new Date(curr.approvedDate || curr.createdAt || 0).getTime();
            return Math.abs(currDate - pubDate) < Math.abs(prevDate - pubDate) ? curr : prev;
          });
          setSelectedSyllabusIds([pubSyllabus.syllabusId, closestArchived.syllabusId]);
          setIsCompareMode(true);
        }
      }
    }
  }, [syllabuses, isCompareMode, selectedSyllabusIds.length]);

  const filteredSyllabuses = useMemo(() => {
    let result = syllabuses;
    if (statusFilter !== "ALL") {
      result = result.filter((s) => s.status === statusFilter);
    }
    return result.sort((a, b) => {
      const dateA = new Date(a.approvedDate || a.createdAt || 0).getTime();
      const dateB = new Date(b.approvedDate || b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [syllabuses, statusFilter]);

  const { canGetPrompts, targetHistorySyllabusId } = useMemo(() => {
    if (selectedSyllabusIds.length !== 2) return { canGetPrompts: false, targetHistorySyllabusId: null };
    const s1 = syllabuses.find(s => s.syllabusId === selectedSyllabusIds[0]);
    const s2 = syllabuses.find(s => s.syllabusId === selectedSyllabusIds[1]);
    if (!s1 || !s2) return { canGetPrompts: false, targetHistorySyllabusId: null };

    const time1 = new Date(s1.createdAt || 0).getTime();
    const time2 = new Date(s2.createdAt || 0).getTime();
    
    const newerId = time1 > time2 ? s1.syllabusId : s2.syllabusId;
    return { canGetPrompts: true, targetHistorySyllabusId: newerId };
  }, [selectedSyllabusIds, syllabuses]);

  const handleToggleSelect = (id: string) => {
    setSelectedSyllabusIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((i) => i !== id);
      }
      if (prev.length < 2) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const handleCompareClick = () => {
    if (selectedSyllabusIds.length === 2) {
      const s1 = syllabuses.find(s => s.syllabusId === selectedSyllabusIds[0]);
      const s2 = syllabuses.find(s => s.syllabusId === selectedSyllabusIds[1]);
      
      if (s1 && s2) {
        const time1 = new Date(s1.createdAt || 0).getTime();
        const time2 = new Date(s2.createdAt || 0).getTime();
        
        if (time1 <= time2) {
           setSelectedSyllabusIds([s1.syllabusId, s2.syllabusId]);
        } else {
           setSelectedSyllabusIds([s2.syllabusId, s1.syllabusId]);
        }
        
        // Use timeout to ensure state updates before opening modal
        setTimeout(() => {
          setIsCompareModalOpen(true);
        }, 0);
      }
    }
  };

  const getSyllabusName = (id: string) => {
    return syllabuses.find((s) => s.syllabusId === id)?.syllabusName || "Unknown";
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className={`px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${hideHeader ? 'py-0' : 'pt-6 pb-4'}`}>
        {!hideHeader ? (
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Subject</p>
            <h2 className="mt-2 text-2xl font-black text-zinc-900">
              {subjectLoading ? "Loading subject..." : subject ? `${subject.subjectCode} - ${subject.subjectName}` : subjectId}
            </h2>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl p-1 border border-zinc-100 shadow-sm">
            <Filter size={14} className="ml-2 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-xs font-bold text-zinc-700 py-2 pr-8 pl-2 focus:ring-0 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PENDING_REVIEW">Pending Review</option>
              <option value="REVISION_REQUESTED">Revision Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          {!isCompareMode && (
            <button
              onClick={() => setIsCompareMode(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border bg-primary text-white border-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
            >
              <GitCompare size={16} />
              Compare
            </button>
          )}
        </div>
      </div>

      {/* Compare Action Bar (shows when compare mode is active) */}
      <AnimatePresence>
        {isCompareMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-emerald-50/50 border-b border-emerald-100/60 overflow-hidden"
          >
            <div className="px-8 py-4 flex items-center justify-between">
              <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
                <GitCompare size={16} />
                Select exactly 2 syllabuses to compare ({selectedSyllabusIds.length}/2 selected)
              </p>
              <div className="flex items-center gap-3">
                {canGetPrompts && (
                  <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-white text-zinc-600 border border-zinc-200 text-xs font-black uppercase tracking-widest hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm active:scale-95"
                  >
                    Get Compare Prompts
                  </button>
                )}
                <button
                  onClick={handleCompareClick}
                  disabled={selectedSyllabusIds.length !== 2}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                >
                  Compare Selected
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syllabus List */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-8 py-4 border-b border-zinc-100 bg-zinc-50/50">
            {isCompareMode && (
              <div className="col-span-1 flex items-center justify-center text-xs font-black uppercase tracking-widest text-zinc-500">
                Select
              </div>
            )}
            <div className={`${isCompareMode ? "col-span-4" : "col-span-5"} text-xs font-black uppercase tracking-widest text-zinc-500`}>
              Syllabus Name
            </div>
            <div className="col-span-2 text-xs font-black uppercase tracking-widest text-zinc-500">
              Created At
            </div>
            <div className="col-span-2 text-xs font-black uppercase tracking-widest text-zinc-500">
              Min Avg Grade
            </div>
            <div className="col-span-2 text-xs font-black uppercase tracking-widest text-zinc-500">
              Status
            </div>
            <div className="col-span-1 flex justify-end text-xs font-black uppercase tracking-widest text-zinc-500 pr-4">
              Action
            </div>
          </div>

          {syllabiLoading ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-zinc-200 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Loading Syllabuses...</p>
            </div>
          ) : filteredSyllabuses.length > 0 ? (
            filteredSyllabuses.map((syllabus, idx) => (
              <motion.div
                key={syllabus.syllabusId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`grid grid-cols-12 px-8 py-5 border-b border-zinc-50 last:border-b-0 items-center transition-colors cursor-pointer ${isCompareMode && selectedSyllabusIds.includes(syllabus.syllabusId)
                    ? "bg-emerald-50/50"
                    : "hover:bg-zinc-50/80"
                  }`}
                onClick={() => {
                  if (isCompareMode) {
                    handleToggleSelect(syllabus.syllabusId);
                  } else {
                    router.push(`/dashboard/hopdc/syllabuses/${syllabus.syllabusId}/information`);
                  }
                }}
              >
                {isCompareMode && (
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(syllabus.syllabusId);
                      }}
                      disabled={selectedSyllabusIds.length === 2 && !selectedSyllabusIds.includes(syllabus.syllabusId)}
                      className={`transition-colors ${selectedSyllabusIds.includes(syllabus.syllabusId)
                          ? "text-emerald-600"
                          : "text-zinc-300 hover:text-zinc-500 disabled:opacity-30"
                        }`}
                    >
                      {selectedSyllabusIds.includes(syllabus.syllabusId) ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                  </div>
                )}

                <div className={`${isCompareMode ? "col-span-4" : "col-span-5"} space-y-0.5`}>
                  <p className="text-base font-black text-zinc-900 group-hover:text-primary transition-colors">
                    {syllabus.syllabusName}
                  </p>
                </div>

                <div className="col-span-2">
                  <span className="text-sm font-bold text-zinc-700">
                    {syllabus.createdAt ? new Date(syllabus.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>

                <div className="col-span-2">
                  <span className="text-sm font-bold text-zinc-700">
                    {syllabus.minAvgGrade ?? syllabus.minAvgMarkToPass ?? "N/A"}
                  </span>
                </div>

                <div className="col-span-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border whitespace-nowrap shadow-sm ${STATUS_COLORS[syllabus.status || "DRAFT"] || STATUS_COLORS.DRAFT}`}
                  >
                    {(syllabus.status || "DRAFT").replace(/_/g, " ")}
                  </span>
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/dashboard/hopdc/syllabuses/${syllabus.syllabusId}/information`);
                    }}
                    className="p-2 bg-white text-zinc-400 border border-zinc-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 rounded-xl shadow-sm transition-all active:scale-95"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="py-20 text-center text-zinc-400 flex flex-col items-center">
              <BookOpen size={32} strokeWidth={1} className="mb-4 opacity-50" />
              <p className="font-black text-sm uppercase tracking-widest">No syllabuses found</p>
            </div>
          )}
        </div>
      </div>

      {isCompareModalOpen && selectedSyllabusIds.length === 2 && (
        <SyllabusCompareModal
          isOpen={isCompareModalOpen}
          onClose={() => setIsCompareModalOpen(false)}
          oldSyllabusId={selectedSyllabusIds[0]}
          newSyllabusId={selectedSyllabusIds[1]}
          oldSyllabusName={getSyllabusName(selectedSyllabusIds[0])}
          newSyllabusName={getSyllabusName(selectedSyllabusIds[1])}
        />
      )}

      {isHistoryModalOpen && targetHistorySyllabusId && (
        <SyllabusCompareHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          newSyllabusId={targetHistorySyllabusId}
        />
      )}
    </div>
  );
}
