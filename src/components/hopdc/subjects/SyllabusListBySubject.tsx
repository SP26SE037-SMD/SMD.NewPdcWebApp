"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, BookOpen, Filter, Search, Plus, 
  GitCompare, CheckSquare, Square
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

export default function SyllabusListBySubject({ subjectId }: { subjectId: string }) {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedSyllabusIds, setSelectedSyllabusIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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
  
  const syllabuses = syllabiResp?.data || [];

  const filteredSyllabuses = useMemo(() => {
    if (statusFilter === "ALL") return syllabuses;
    return syllabuses.filter((s) => s.status === statusFilter);
  }, [syllabuses, statusFilter]);

  const handleToggleSelect = (id: string) => {
    if (selectedSyllabusIds.includes(id)) {
      setSelectedSyllabusIds((prev) => prev.filter((i) => i !== id));
    } else {
      if (selectedSyllabusIds.length < 2) {
        setSelectedSyllabusIds((prev) => [...prev, id]);
      }
    }
  };

  const handleCompareClick = () => {
    if (selectedSyllabusIds.length === 2) {
      setIsCompareModalOpen(true);
    }
  };

  const getSyllabusName = (id: string) => {
    return syllabuses.find((s) => s.syllabusId === id)?.syllabusName || "Unknown";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-background">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/hopdc/subjects")}
            className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              {subjectLoading ? (
                <span className="w-32 h-6 bg-zinc-100 rounded animate-pulse" />
              ) : (
                subject?.subjectName || "Subject Details"
              )}
            </h1>
            <p className="text-sm font-bold text-muted uppercase tracking-widest mt-1">
              {subjectLoading ? (
                <span className="w-20 h-4 bg-zinc-100 rounded inline-block animate-pulse" />
              ) : (
                subject?.subjectCode || ""
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-zinc-50 rounded-xl p-1 border border-zinc-100">
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

          <button
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              if (isCompareMode) setSelectedSyllabusIds([]);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all border ${
              isCompareMode
                ? "bg-zinc-100 border-zinc-200 text-zinc-700"
                : "bg-primary text-white border-primary shadow-lg shadow-primary/25 hover:bg-primary/90"
            }`}
          >
            <GitCompare size={16} />
            {isCompareMode ? "Cancel Compare" : "Compare"}
          </button>
        </div>
      </div>

      {/* Compare Action Bar (shows when compare mode is active) */}
      <AnimatePresence>
        {isCompareMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-blue-50/50 border-b border-blue-100 overflow-hidden"
          >
            <div className="px-8 py-3 flex items-center justify-between">
              <p className="text-sm font-bold text-blue-800">
                Select exactly 2 syllabuses to compare ({selectedSyllabusIds.length}/2 selected)
              </p>
              <button
                onClick={handleCompareClick}
                disabled={selectedSyllabusIds.length !== 2}
                className="px-6 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors shadow-sm"
              >
                Compare Selected
              </button>
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
            <div className={`col-span-${isCompareMode ? '4' : '5'} text-xs font-black uppercase tracking-widest text-zinc-500`}>
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
            <div className="col-span-1" />
          </div>

          {/* Table Body */}
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
                className={`grid grid-cols-12 px-8 py-5 border-b border-zinc-50 last:border-b-0 items-center transition-colors ${
                  isCompareMode && selectedSyllabusIds.includes(syllabus.syllabusId)
                    ? "bg-blue-50/30"
                    : "hover:bg-zinc-50/60"
                }`}
              >
                {isCompareMode && (
                  <div className="col-span-1 flex items-center justify-center">
                    <button
                      onClick={() => handleToggleSelect(syllabus.syllabusId)}
                      disabled={selectedSyllabusIds.length === 2 && !selectedSyllabusIds.includes(syllabus.syllabusId)}
                      className={`transition-colors ${
                        selectedSyllabusIds.includes(syllabus.syllabusId)
                          ? "text-blue-600"
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
                
                <div className={`col-span-${isCompareMode ? '4' : '5'} space-y-0.5`}>
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
                    {syllabus.minAvgGrade ?? "N/A"}
                  </span>
                </div>
                
                <div className="col-span-2">
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border whitespace-nowrap shadow-sm ${STATUS_COLORS[syllabus.status || "DRAFT"] || STATUS_COLORS.DRAFT}`}
                  >
                    {(syllabus.status || "DRAFT").replace(/_/g, " ")}
                  </span>
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
    </div>
  );
}
