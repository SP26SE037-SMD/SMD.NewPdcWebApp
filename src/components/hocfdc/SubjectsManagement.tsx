"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  Search,
  Loader2,
  GraduationCap,
  Layers,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  Filter,
  Target,
  Building2,
  MoreHorizontal,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Calendar,
  Upload,
} from "lucide-react";
import {
  SubjectService,
  Subject,
  SUBJECT_STATUS,
} from "@/services/subject.service";

const STATUS_COLORS: Record<string, string> = {
  [SUBJECT_STATUS.DRAFT]: "text-zinc-600 bg-zinc-50 border-zinc-200",
  [SUBJECT_STATUS.DEFINED]: "text-blue-600 bg-blue-50 border-blue-100",
  [SUBJECT_STATUS.WAITING_SYLLABUS]:
    "text-indigo-600 bg-indigo-50 border-indigo-100",
  [SUBJECT_STATUS.PENDING_REVIEW]:
    "text-amber-600 bg-amber-50 border-amber-100",
  [SUBJECT_STATUS.COMPLETED]:
    "text-emerald-600 bg-emerald-50 border-emerald-100",
  [SUBJECT_STATUS.ARCHIVED]: "text-red-600 bg-red-50 border-red-100",
};

const DEPT_COLORS: Record<string, string> = {
  "Software Engineering": "bg-blue-50 text-blue-600 border-blue-100",
  "Artificial Intelligence": "bg-violet-50 text-violet-600 border-violet-100",
  "Digital Business": "bg-amber-50 text-amber-600 border-amber-100",
  "Humanities & Social Sciences": "bg-rose-50 text-rose-600 border-rose-100",
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

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [viewMode] = useState<"list">("list");
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev

  // For smooth typing without immediate re-renders
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
      alert("Subjects imported successfully!");
      router.refresh(); // Refresh Server Component data
      if (currentPage !== 0 || currentSearch !== "" || currentStatus !== "") {
        updateUrlParams({ page: 0, search: "", status: "" });
      }
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error ? error.message : "Failed to import subjects",
      );
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
    setDirection(newPage > currentPage ? 1 : -1);
    updateUrlParams({ page: newPage });
  };

  const paginationVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 20 : direction < 0 ? -20 : 0,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 20 : direction > 0 ? -20 : 0,
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-white overflow-hidden">
      {/* Sub Header */}
      <div className="px-8 py-5 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white shrink-0">
        <h1 className="text-2xl font-black text-primary tracking-tighter uppercase">
          Subject Management
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="px-6 py-2.5 bg-zinc-100 text-zinc-600 text-xs font-black uppercase tracking-[0.2em] rounded-lg hover:bg-zinc-200 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Upload size={14} strokeWidth={3} />
            )}
            Import Excel
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
            className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={3} />
            New Subject
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto min-h-0">
        {/* Filters & View Toggle */}
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
                placeholder="Search code, name, department..."
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
                {currentStatus
                  ? currentStatus.replace("_", " ")
                  : "View all statuses"}
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
                    {["", ...Object.values(SUBJECT_STATUS)].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleFilterChange(status)}
                        className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors ${
                          currentStatus === status
                            ? "bg-primary text-white"
                            : "text-zinc-500 hover:bg-zinc-50"
                        }`}
                      >
                        {status === "" ? "Show All" : status.replace(/_/g, " ")}
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
                  {currentSortBy === "subjectCode" ? "Code" : "Credits"} 
                  ({currentDirection === "asc" ? "ASC" : "DESC"})
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
                        onClick={() => handleSortChange(opt.sort, opt.dir)}
                        className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors ${
                          currentSortBy === opt.sort && currentDirection === opt.dir
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
              {initialTotalElements} subjects
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
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
              >
                <RefreshCw size={14} />
                Retry Connection
              </button>
            </motion.div>
          ) : (
            /* LIST VIEW */
            <motion.div
              key={`list-${currentPage}`}
              custom={direction}
              variants={paginationVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="space-y-8"
            >
              <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 px-8 py-4 border-b border-zinc-100 bg-primary/[0.1]">
                  <div className="col-span-1 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Code
                  </div>
                  <div className="col-span-4 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Subject Name
                  </div>
                  <div className="col-span-2 text-xs font-black uppercase tracking-widest text-zinc-500">
                    Department
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

                {initialData.map((subject, idx) => (
                  <motion.div
                    key={subject.subjectId}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() =>
                      router.push(
                        `/dashboard/hocfdc/subjects/${subject.subjectId}`,
                      )
                    }
                    className="grid grid-cols-12 px-8 py-5 border-b border-zinc-50 last:border-b-0 hover:bg-zinc-50/60 transition-colors cursor-pointer group items-center"
                  >
                    <div className="col-span-1">
                      <span className="text-sm font-black text-primary uppercase tracking-widest">
                        {subject.subjectCode}
                      </span>
                    </div>
                    <div className="col-span-4 space-y-0.5">
                      <p className="text-base font-black text-zinc-900 group-hover:text-primary transition-colors">
                        {subject.subjectName}
                      </p>
                      <p className="text-xs text-zinc-400 font-medium line-clamp-1 italic">
                        {subject.description || "No description provided."}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border bg-zinc-50 text-zinc-500 border-zinc-100`}
                      >
                        {subject.department?.departmentName || "General"}
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
                      <span className="text-xs text-zinc-400 ml-1"></span>
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

                {initialData.length === 0 && (
                  <div className="py-20 text-center text-zinc-300">
                    <BookOpen
                      size={32}
                      strokeWidth={1}
                      className="mx-auto mb-3"
                    />
                    <p className="font-black text-[10px] uppercase tracking-widest">
                      No subjects match your search
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fixed Pagination At Bottom */}
      {initialTotalPages > 1 && (
        <div className="px-8 py-4 border-t border-zinc-100 bg-white flex items-center justify-between shrink-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block pb-1">
            Showing <span className="text-zinc-900">{initialData.length}</span>{" "}
            of <span className="text-zinc-900">{initialTotalElements}</span>{" "}
            Subjects
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
              className="w-8 h-8 rounded-lg border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-1">
              {[...Array(initialTotalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => handlePageChange(i)}
                  className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                    currentPage === i
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "border border-zinc-100 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={currentPage === initialTotalPages - 1}
              onClick={() => handlePageChange(currentPage + 1)}
              className="w-8 h-8 rounded-lg border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
