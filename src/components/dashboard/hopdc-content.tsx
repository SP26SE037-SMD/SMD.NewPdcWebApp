"use client";

import { useState, useRef, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Search,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Filter,
  RefreshCw,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  SubjectService,
  SUBJECT_STATUS,
} from "@/services/subject.service";

const STATUS_COLORS: Record<string, string> = {
  [SUBJECT_STATUS.DRAFT]: "text-zinc-600 bg-zinc-50 border-zinc-200",
  [SUBJECT_STATUS.WAITING_SYLLABUS]: "text-indigo-600 bg-indigo-50 border-indigo-100",
  [SUBJECT_STATUS.PENDING_REVIEW]: "text-amber-600 bg-amber-50 border-amber-100",
  [SUBJECT_STATUS.COMPLETED]: "text-emerald-600 bg-emerald-50 border-emerald-100",
  [SUBJECT_STATUS.ARCHIVED]: "text-red-600 bg-red-50 border-red-100",
};

export default function HoPDCDashboardContent() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  // State for filtering and pagination
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("subjectCode");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch subjects for the department
  const { data: subjectsData, isLoading, error } = useQuery({
    queryKey: ["hopdc-subjects", user?.departmentId, page, search, status, sortBy, direction],
    queryFn: () =>
      SubjectService.getSubjects({
        departmentId: user?.departmentId,
        page,
        size: 5,
        search,
        status,
        sortBy,
        direction,
      }),
    enabled: !!user?.departmentId,
  });

  const subjects = subjectsData?.data?.content || [];
  const totalPages = subjectsData?.data?.totalPages || 0;
  const totalElements = subjectsData?.data?.totalElements || 0;

  // Get department name from the first subject if available
  const departmentName = subjects[0]?.department?.departmentName || "...";

  const handleSearchChange = (val: string) => {
    setLocalSearch(val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setSearch(val);
      setPage(0);
    }, 500);
  };

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(0);
    setIsStatusOpen(false);
  };

  const handleSortChange = (newSortBy: string, newDirection: "asc" | "desc") => {
    setSortBy(newSortBy);
    setDirection(newDirection);
    setPage(0);
    setIsSortOpen(false);
  };

  const paginationVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 20 : dir < 0 ? -20 : 0,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 20 : dir > 0 ? -20 : 0,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white overflow-hidden">
      {/* Sub Header - Exact HoCFDC style */}
      <div className="px-8 py-5 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white shrink-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-primary tracking-tight uppercase">
              Subject Management
            </h1>
            <div className="h-6 w-px bg-zinc-200 hidden md:block" />
            <span className="px-4 py-1.5 bg-primary/5 text-primary text-[11px] font-black uppercase tracking-[0.2em] rounded-full border border-primary/10 hidden md:flex items-center shadow-sm shadow-primary/5">
              {departmentName}
            </span>
          </div>
          <p className="text-[11px] font-black text-primary uppercase tracking-widest md:hidden">
            {departmentName}
          </p>
        </div>
        {/* Forbidden buttons removed */}
      </div>

      <div className="px-8 py-6 space-y-8 flex-1 overflow-y-auto min-h-0 bg-zinc-50/50">
        <div className="max-w-[1600px] mx-auto w-full space-y-6">
        {/* Filters & View Toggle - Exact HoCFDC style */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 max-w-[1600px] mx-auto w-full">
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Search code, name..."
                value={localSearch}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-full py-3 pl-12 pr-4 text-base font-medium focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative w-full sm:w-56">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between px-6 py-3 bg-white border border-zinc-100 rounded-full text-xs font-black uppercase tracking-widest text-zinc-500 hover:border-zinc-300 transition-all shadow-sm"
              >
                {status ? status.replace("_", " ") : "View all statuses"}
                <ChevronDown
                  size={14}
                  className={`opacity-40 transition-transform ${isStatusOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isStatusOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1"
                  >
                    {["", ...Object.values(SUBJECT_STATUS)].map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors ${
                          status === s
                            ? "bg-primary text-white"
                            : "text-zinc-500 hover:bg-zinc-50"
                        }`}
                      >
                        {s === "" ? "Show All" : s.replace(/_/g, " ")}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full sm:w-64">
              <button
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="w-full flex items-center justify-between px-6 py-3 bg-white border border-zinc-100 rounded-full text-xs font-black uppercase tracking-widest text-zinc-500 hover:border-zinc-300 transition-all shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw size={12} className="opacity-40" />
                  {sortBy === "subjectCode" ? "Code" : "Credits"} 
                  ({direction === "asc" ? "ASC" : "DESC"})
                </div>
                <ChevronDown
                  size={14}
                  className={`opacity-40 transition-transform ${isSortOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1"
                  >
                    {[
                      { label: "Code (A-Z)", sort: "subjectCode", dir: "asc" },
                      { label: "Code (Z-A)", sort: "subjectCode", dir: "desc" },
                      { label: "Credits (Low-High)", sort: "credits", dir: "asc" },
                      { label: "Credits (High-Low)", sort: "credits", dir: "desc" },
                    ].map((opt) => (
                      <button
                        key={`${opt.sort}-${opt.dir}`}
                        onClick={() => handleSortChange(opt.sort, opt.dir as "asc" | "desc")}
                        className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors ${
                          sortBy === opt.sort && direction === opt.dir
                            ? "bg-primary text-white"
                            : "text-zinc-500 hover:bg-zinc-50"
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

          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">
              {totalElements} subjects
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-red-400 w-full"
            >
              <AlertCircle className="mb-4" size={32} />
              <p className="font-black text-xs uppercase tracking-widest mb-4 text-center max-w-xs">
                Failed to load departmental subjects
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </motion.div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-32">
              <Loader2 size={32} className="animate-spin text-primary" />
            </div>
          ) : (
            <motion.div
              key={`list-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 px-8 py-4 border-b border-zinc-100 bg-primary/[0.05]">
                  <div className="col-span-1 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Code
                  </div>
                  <div className="col-span-4 text-xs font-black uppercase tracking-widest text-zinc-500 pr-8">
                    Subject Name
                  </div>
                  <div className="col-span-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Created At
                  </div>
                  <div className="col-span-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Status
                  </div>
                  <div className="col-span-1 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Credits
                  </div>
                  <div className="col-span-1 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Time
                  </div>
                  <div className="col-span-1" />
                </div>

                {subjects.map((subject, idx) => (
                  <motion.div
                    key={subject.subjectId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() =>
                      router.push(
                        `/dashboard/hopdc/subjects/${subject.subjectId}`,
                      )
                    }
                    className="grid grid-cols-12 px-8 py-5 border-b border-zinc-50 last:border-b-0 hover:bg-zinc-50/60 transition-colors cursor-pointer group items-center"
                  >
                    <div className="col-span-1">
                      <span className="text-sm font-black text-primary uppercase tracking-widest">
                        {subject.subjectCode}
                      </span>
                    </div>
                    <div className="col-span-4 space-y-0.5 pr-8">
                      <p className="text-base font-black text-zinc-900 group-hover:text-primary transition-colors">
                        {subject.subjectName}
                      </p>
                      <p className="text-xs text-zinc-400 font-medium line-clamp-1 italic">
                        {subject.description || "No description provided."}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-zinc-50 text-zinc-500 border-zinc-100">
                        {new Date(subject.createdAt).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`text-xs font-black uppercase tracking-widest px-3 py-2 rounded-xl border whitespace-nowrap shadow-sm ${STATUS_COLORS[subject.status] || STATUS_COLORS.DRAFT}`}
                      >
                        {subject.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-base font-black text-zinc-900">
                        {subject.credits}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-xs font-black text-zinc-400">
                        {subject.timeAllocation}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <ChevronRight
                        size={14}
                        className="text-zinc-200 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </motion.div>
                ))}

                {subjects.length === 0 && (
                  <div className="py-20 text-center text-zinc-300">
                    <BookOpen
                      size={32}
                      strokeWidth={1}
                      className="mx-auto mb-3"
                    />
                    <p className="font-black text-[10px] uppercase tracking-widest">
                      No subjects found for this department
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>

      {/* Fixed Pagination At Bottom - Exact HoCFDC style */}
      {totalPages > 0 && (
        <div className="px-8 py-5 border-t border-zinc-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Showing <span className="text-zinc-900">{subjects.length}</span> of <span className="text-zinc-900">{totalElements}</span> Subjects
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="w-10 h-10 rounded-xl border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i).map((p) => {
                // Simple logic to show all pages if total is small, or a range if large
                // For now, let's just show all as per the screenshot (11 pages)
                if (totalPages > 12) {
                   // Show first, last, and pages around current
                   if (p === 0 || p === totalPages - 1 || (p >= page - 2 && p <= page + 2)) {
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                            page === p
                              ? "bg-primary text-white shadow-lg shadow-primary/25"
                              : "border border-zinc-100 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                          }`}
                        >
                          {p + 1}
                        </button>
                      );
                   }
                   if (p === 1 || p === totalPages - 2) {
                      return <span key={p} className="px-1 text-zinc-300">...</span>;
                   }
                   return null;
                }

                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                      page === p
                        ? "bg-primary text-white shadow-lg shadow-primary/25"
                        : "border border-zinc-100 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    {p + 1}
                  </button>
                );
              })}
            </div>

            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage(page + 1)}
              className="w-10 h-10 rounded-xl border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
