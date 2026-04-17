"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ChevronDown,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  SubjectService,
  Subject,
  SUBJECT_STATUS,
} from "@/services/subject.service";
import { useToast } from "@/components/ui/Toast";

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  [SUBJECT_STATUS.DRAFT]: { 
    label: "DRAFT", 
    class: "bg-slate-100 text-slate-500" 
  },
  [SUBJECT_STATUS.DEFINED]: { 
    label: "DEFINED", 
    class: "bg-blue-50 text-blue-700" 
  },
  [SUBJECT_STATUS.WAITING_SYLLABUS]: { 
    label: "WAITING SYLLABUS", 
    class: "bg-amber-50 text-amber-700" 
  },
  [SUBJECT_STATUS.PENDING_REVIEW]: { 
    label: "PENDING REVIEW", 
    class: "bg-blue-50 text-blue-700" 
  },
  [SUBJECT_STATUS.COMPLETED]: { 
    label: "PUBLISHED", 
    class: "bg-emerald-50 text-emerald-700" 
  },
  [SUBJECT_STATUS.ARCHIVED]: { 
    label: "ARCHIVED", 
    class: "bg-rose-50 text-rose-700" 
  },
};

export default function SubjectsManagement({
  initialData = [],
  initialTotalPages = 0,
  initialTotalElements = 0,
  currentPage = 0,
  currentSearch = "",
  currentStatus = "",
  currentSortBy = "subjectCode",
  currentDirection = "asc",
  error = null,
}: {
  initialData?: Subject[];
  initialTotalPages?: number;
  initialTotalElements?: number;
  currentPage?: number;
  currentSearch?: string;
  currentStatus?: string;
  currentSortBy?: string;
  currentDirection?: string;
  error?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(currentSearch);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      await SubjectService.importSubjects(file);
      showToast("Subjects imported successfully!", "success");
      router.refresh();
      if (currentPage !== 0 || currentSearch !== "" || currentStatus !== "") {
        updateUrlParams({ page: 0, search: "", status: "" });
      }
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Failed to import subjects", "error");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const updateUrlParams = (changes: {
    page?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    direction?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (changes.search !== undefined) {
      if (changes.search) params.set("search", changes.search);
      else params.delete("search");
    }

    if (changes.status !== undefined) {
      if (changes.status) params.set("status", changes.status);
      else params.delete("status");
    }

    if (changes.sortBy !== undefined) {
      if (changes.sortBy) params.set("sortBy", changes.sortBy);
      else params.delete("sortBy");
    }

    if (changes.direction !== undefined) {
      if (changes.direction) params.set("direction", changes.direction);
      else params.delete("direction");
    }

    if (changes.page !== undefined) {
      params.set("page", changes.page.toString());
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (status: string) => {
    setIsStatusOpen(false);
    updateUrlParams({ status, page: 0 });
  };

  const handleSortChange = (sortBy: string, direction: string) => {
    setIsSortOpen(false);
    updateUrlParams({ sortBy, direction, page: 0 });
  };

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      updateUrlParams({ search: val, page: 0 });
    }, 500);
  };

  const handlePageChange = (newPage: number) => {
    updateUrlParams({ page: newPage });
  };

  return (
    <div className="pt-8 px-10 pb-12 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[#2d3335] mb-2 font-headline uppercase">
            SUBJECT MANAGEMENT
          </h1>
          <p className="text-[#5a6062] font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "18px" }}>info</span>
            Managing {initialTotalElements} active subjects across primary departments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleImportClick}
            disabled={isImporting}
            className="px-5 py-3 bg-[#ebeef0] text-[#5a6062] font-bold rounded-xl hover:bg-[#e5e9eb] transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <span className="material-symbols-outlined text-lg">download</span>
            )}
            IMPORT EXCEL
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button 
            onClick={() => router.push("/dashboard/hocfdc/subjects/new")}
            className="px-6 py-3 bg-gradient-to-br from-[#2d6a4f] to-[#1f5e44] text-[#e6ffee] font-bold rounded-xl shadow-lg shadow-[#2d6a4f]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            NEW SUBJECT
          </button>
        </div>
      </div>

      {/* Filters & Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Search & Filters Container */}
        <div className="md:col-span-3 bg-[#f1f4f5] p-6 rounded-2xl flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[280px] relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#5a6062]">search</span>
            <input 
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-[#b1f0ce] text-sm placeholder:text-zinc-400 outline-none" 
              placeholder="Search by name, code or faculty..." 
              type="text"
            />
          </div>
          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="bg-white border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#b1f0ce] text-[#5a6062] flex items-center gap-2 min-w-[160px] justify-between"
              >
                {currentStatus ? currentStatus.replace(/_/g, " ") : "All Statuses"}
                <ChevronDown size={16} className={`transition-transform duration-300 ${isStatusOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#ebeef0] rounded-2xl shadow-xl z-50 overflow-hidden p-1 min-w-[200px]"
                  >
                    {["", ...Object.values(SUBJECT_STATUS)].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleFilterChange(status)}
                        className={`w-full text-left px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors ${
                          currentStatus === status
                            ? "bg-[#2d6a4f] text-white"
                            : "text-[#5a6062] hover:bg-[#f1f4f5]"
                        }`}
                      >
                        {status === "" ? "All Statuses" : status.replace(/_/g, " ")}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="bg-white border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-[#b1f0ce] text-[#5a6062] flex items-center gap-2 min-w-[180px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">sort</span>
                  {currentSortBy === "subjectCode" ? "Code" : "Credits"} 
                  ({currentDirection.toUpperCase()})
                </div>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isSortOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full right-0 mt-2 bg-white border border-[#ebeef0] rounded-2xl shadow-xl z-50 overflow-hidden p-1 min-w-[220px]"
                  >
                    {[
                      { label: "Code (A-Z)", sort: "subjectCode", dir: "asc" },
                      { label: "Code (Z-A)", sort: "subjectCode", dir: "desc" },
                      { label: "Credits (Low-High)", sort: "credits", dir: "asc" },
                      { label: "Credits (High-Low)", sort: "credits", dir: "desc" },
                    ].map((opt) => (
                      <button
                        key={`${opt.sort}-${opt.dir}`}
                        onClick={() => handleSortChange(opt.sort, opt.dir)}
                        className={`w-full text-left px-5 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-colors ${
                          currentSortBy === opt.sort && currentDirection === opt.dir
                            ? "bg-[#2d6a4f] text-white"
                            : "text-[#5a6062] hover:bg-[#f1f4f5]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="bg-[#b1f0ce] p-6 rounded-2xl flex flex-col justify-between shadow-sm border border-[#2d6a4f]/10">
          <p className="text-[#014931] font-bold text-xs uppercase tracking-widest">Active Credits</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#014931]">1,402</span>
            <span className="text-xs text-[#29664c] font-medium">+12 this term</span>
          </div>
        </div>
      </div>

      {/* Main Data Table Container */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(45,51,53,0.04)] border border-[#ebeef0]">
        <AnimatePresence mode="wait">
          {error ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-[#2d3335]">Failed to load subjects</h3>
              <p className="text-sm text-[#5a6062] max-w-sm mx-auto">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-rose-100 transition-colors flex items-center gap-2 mx-auto"
              >
                <RefreshCw size={14} />
                Retry Connection
              </button>
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f1f4f5] border-b-0">
                    <th className="px-8 py-5 text-[11px] font-extrabold text-[#5a6062] uppercase tracking-widest">Code</th>
                    <th className="px-8 py-5 text-[11px] font-extrabold text-[#5a6062] uppercase tracking-widest">Subject Name</th>
                    <th className="px-8 py-5 text-[11px] font-extrabold text-[#5a6062] uppercase tracking-widest">Department</th>
                    <th className="px-8 py-5 text-[11px] font-extrabold text-[#5a6062] uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-[11px] font-extrabold text-[#5a6062] uppercase tracking-widest">Credits</th>
                    <th className="px-8 py-5 text-[11px] font-extrabold text-[#5a6062] uppercase tracking-widest">Time</th>
                    <th className="px-8 py-5 text-[11px] font-extrabold text-[#5a6062] uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebeef0]">
                  {initialData.length > 0 ? (
                    initialData.map((subject, idx) => (
                      <motion.tr 
                        key={subject.subjectId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        className="group hover:bg-[#f1f4f5] transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/hocfdc/subjects/${subject.subjectId}`)}
                      >
                        <td className="px-8 py-6">
                          <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-bold font-mono">
                            {subject.subjectCode}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2d3335] text-sm group-hover:text-[#2d6a4f] transition-colors">
                              {subject.subjectName}
                            </span>
                            <span className="text-[11px] text-[#5a6062] line-clamp-1 italic max-w-xs">
                              {subject.description || "Projected description pending."}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-medium text-[#2d3335]">
                            {subject.department?.departmentName || "General Academic"}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 text-[10px] font-extrabold rounded-full tracking-wide shadow-sm border border-black/5 ${STATUS_CONFIG[subject.status]?.class || "bg-slate-100 text-slate-500"}`}>
                            {STATUS_CONFIG[subject.status]?.label || subject.status?.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-sm font-bold text-[#2d3335]">
                            {subject.credits.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[11px] font-bold text-[#5a6062] uppercase bg-[#f1f4f5] px-2 py-0.5 rounded">
                            {subject.timeAllocation || "0h"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/hocfdc/subjects/${subject.subjectId}`);
                              }}
                              className="p-2 text-[#adb3b5] hover:text-[#2d6a4f] transition-colors hover:bg-white rounded-lg"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button 
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-[#adb3b5] hover:text-[#a73b21] transition-colors hover:bg-white rounded-lg"
                            >
                              <span className="material-symbols-outlined text-lg">more_vert</span>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center opacity-30">
                          <span className="material-symbols-outlined text-6xl mb-4">book_5</span>
                          <p className="text-sm font-bold uppercase tracking-widest text-[#2d3335]">No subjects match your criteria</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination Footer */}
              {initialTotalPages > 1 && (
                <div className="px-8 py-5 bg-[#f1f4f5] flex items-center justify-between border-t border-[#ebeef0]">
                  <span className="text-[11px] font-bold text-[#5a6062] uppercase tracking-widest">
                    Showing {initialData.length} of {initialTotalElements} entries
                  </span>
                  <div className="flex gap-2">
                    <button 
                      disabled={currentPage === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePageChange(currentPage - 1);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-[#5a6062] hover:bg-white/80 transition-colors border border-black/5 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    
                    {[...Array(initialTotalPages)].map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => handlePageChange(i)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-xs transition-all ${
                          currentPage === i 
                            ? "bg-[#2d6a4f] text-white shadow-lg shadow-[#2d6a4f]/20" 
                            : "bg-white text-[#5a6062] hover:bg-[#f1f4f5] border border-black/5"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button 
                      disabled={currentPage === initialTotalPages - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePageChange(currentPage + 1);
                      }}
                      className="w-10 h-10 flex items-center justify-center rounded-xl bg-white text-[#5a6062] hover:bg-white/80 transition-colors border border-black/5 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
