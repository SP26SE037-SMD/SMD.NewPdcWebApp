"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Loader2,
  BookOpen,
  Layers,
  Target,
  GraduationCap,
  ChevronRight,
  Filter,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Calendar,
  Eye,
  PencilLine,
  ArrowRight,
  CheckCircle2,
  X,
  Trash2,
} from "lucide-react";
import {
  CurriculumService,
  CurriculumFramework,
  CurriculumStatus,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";

const STATUS_COLORS: Record<string, string> = {
  [CURRICULUM_STATUS.DRAFT]: "text-zinc-500 bg-zinc-50 border-zinc-100",
  [CURRICULUM_STATUS.STRUCTURE_REVIEW]:
    "text-blue-600 bg-blue-50 border-blue-100",
  [CURRICULUM_STATUS.STRUCTURE_APPROVED]:
    "text-primary-600 bg-primary-50 border-primary-100",
  [CURRICULUM_STATUS.SYLLABUS_DEVELOP]:
    "text-indigo-600 bg-indigo-50 border-indigo-100",
  [CURRICULUM_STATUS.FINAL_REVIEW]:
    "text-amber-600 bg-amber-50 border-amber-100",
  [CURRICULUM_STATUS.SIGNED]:
    "text-primary-700 bg-primary-50 border-primary-200",
  [CURRICULUM_STATUS.PUBLISHED]:
    "text-primary-700 bg-primary-50 border-primary-200",
  [CURRICULUM_STATUS.ARCHIVED]: "text-red-600 bg-red-50 border-red-100",
};

export default function CurriculumsManagement({
  initialData = [],
  initialTotalPages = 0,
  initialTotalElements = 0,
  currentPage = 0,
  currentSearch = "",
  currentStatus = "",
  error = null,
}: {
  initialData?: CurriculumFramework[];
  initialTotalPages?: number;
  initialTotalElements?: number;
  currentPage?: number;
  currentSearch?: string;
  currentStatus?: string;
  error?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [curriculumToDelete, setCurriculumToDelete] = useState<CurriculumFramework | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!curriculumToDelete) return;
    setIsDeleting(true);
    try {
      await CurriculumService.deleteCurriculum(curriculumToDelete.curriculumId);
      setShowSuccessModal(false); // Reuse or hide if needed
      // Force refresh data
      router.refresh();
      setCurriculumToDelete(null);
    } catch (err: any) {
      console.error("Delete failed:", err);
      // Maybe show a toast or error state
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (searchParams.get("submitted") === "true") {
      setShowSuccessModal(true);
      // Remove the query param without refreshing
      const params = new URLSearchParams(searchParams.toString());
      params.delete("submitted");
      router.replace(
        `${pathname}${params.toString() ? `?${params.toString()}` : ""}`,
      );
    }
  }, [searchParams, router, pathname]);

  // For smooth typing without immediate re-renders
  const [localSearch, setLocalSearch] = useState(currentSearch);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateUrlParams = (changes: {
    page?: number;
    search?: string;
    status?: string;
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

    if (changes.page !== undefined) {
      params.set("page", changes.page.toString());
    }

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (status: string) => {
    setIsStatusOpen(false);
    updateUrlParams({ status, page: 0 });
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

  interface StatusTab {
    label: string;
    value: string;
    statuses?: string[];
  }

  const TABS: StatusTab[] = [
    { label: "All Repository", value: "" },
    { label: "Draft", value: CURRICULUM_STATUS.DRAFT },
    { label: "Structure Reviewing", value: CURRICULUM_STATUS.STRUCTURE_REVIEW },
    {
      label: "Structure Approved",
      value: CURRICULUM_STATUS.STRUCTURE_APPROVED,
    },
    { label: "Syllabus Develop", value: CURRICULUM_STATUS.SYLLABUS_DEVELOP },
    { label: "Final Review", value: CURRICULUM_STATUS.FINAL_REVIEW },
    { label: "Published", value: CURRICULUM_STATUS.PUBLISHED },
  ];

  const handleTabChange = (status: string) => {
    updateUrlParams({ status, page: 0 });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header - Academic Atelier Style */}
      <div className="px-8 md:px-12 py-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white sticky top-0 z-30">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-sm border border-primary-100 transition-all">
              <Layers size={22} />
            </div>
            <div className="h-px w-12 bg-zinc-100 hidden md:block" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
              Institutional Repository
            </span>
          </div>
          <h1 className="text-4xl font-extrabold text-zinc-800 tracking-tight drop-shadow-sm">
            Curriculum Frameworks
          </h1>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            className="flex-1 md:flex-none px-8 py-4 bg-primary text-white text-xs font-bold rounded-2xl shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-3 transition-all"
            onClick={() => router.push("/dashboard/hocfdc/curriculums/new")}
          >
            <Plus size={16} strokeWidth={3} />
            New Curriculum
          </button>
        </div>
      </div>

      {/* Premium Navigation & Search */}
      <div className="bg-white border-y border-zinc-100 sticky top-[120px] z-20 backdrop-blur-md bg-white/80">
        <div className="max-w-[1600px] mx-auto px-8 md:px-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
              {TABS.map((tab) => {
                const isActive = currentStatus === tab.value;
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleTabChange(tab.value)}
                    className={`relative px-6 py-5 text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap ${
                      isActive
                        ? "text-primary-600"
                        : "text-zinc-400 hover:text-primary-500"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="tab-indicator-sync"
                        className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-t-full"
                        transition={{
                          type: "spring",
                          bounce: 0.2,
                          duration: 0.6,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      <div className="p-8 md:p-12 space-y-8 max-w-[1600px] mx-auto min-h-screen">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-red-400 w-full"
            >
              <AlertCircle className="mb-4" size={40} />
              <h3 className="text-xl font-bold text-zinc-900 mb-2">
                Connectivity Error
              </h3>
              <p className="font-medium text-sm text-zinc-400 mb-8 text-center max-w-xs">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-8 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors border border-red-100"
              >
                <RefreshCw size={14} />
                Retry Connection
              </button>
            </motion.div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode="popLayout">
                  {initialData.map((curriculum, idx) => (
                    <motion.div
                      key={curriculum.curriculumId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative"
                    >
                      <div
                        className="bg-white/60 backdrop-blur-3xl rounded-[2rem] border border-zinc-100 p-6 md:p-8 flex flex-col lg:flex-row items-start lg:items-center gap-6 shadow-sm hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(var(--color-primary-rgb),0.15)] hover:border-primary-200 transition-all duration-500 relative z-10 overflow-hidden cursor-pointer"
                        onClick={() =>
                          router.push(
                            `/dashboard/hocfdc/curriculums/${curriculum.curriculumId}`,
                          )
                        }
                      >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary-100 to-transparent rounded-full -mr-32 -mt-32 blur-3xl opacity-0 group-hover:opacity-30 transition-all duration-700" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-zinc-100 to-transparent rounded-full -ml-24 -mb-24 blur-2xl opacity-0 group-hover:opacity-50 transition-all duration-700 delay-100" />

                        {/* Major Identity */}
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-[1.25rem] bg-zinc-50/80 backdrop-blur-sm border border-zinc-100 flex flex-col items-center justify-center gap-2 shrink-0 group-hover:bg-white group-hover:border-primary-200 group-hover:shadow-lg transition-all duration-300">
                          <GraduationCap
                            size={32}
                            className="text-zinc-300 group-hover:text-primary transition-colors"
                          />
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center px-2 truncate w-full group-hover:text-primary-700 transition-colors">
                            {curriculum.major?.majorCode || "CORE"}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-1.5 bg-zinc-100 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full group-hover:bg-primary-100 group-hover:text-primary-800 transition-colors">
                              {curriculum.curriculumCode}
                            </span>
                            <div
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${STATUS_COLORS[curriculum.status] || STATUS_COLORS.DRAFT} group-hover:border-primary-200 transition-colors`}
                            >
                              {curriculum.status.replace(/_/g, " ")}
                            </div>
                          </div>

                          <h3 className="text-xl md:text-2xl font-bold text-zinc-800 leading-snug tracking-tight group-hover:text-primary-900 transition-all duration-300">
                            {curriculum.curriculumName}
                          </h3>

                          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                <Calendar size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest group-hover:text-primary-300 transition-colors">
                                  Effective Term
                                </span>
                                <span className="text-xs font-bold text-zinc-500 group-hover:text-primary-700 transition-colors">
                                  {curriculum.startYear} —{" "}
                                  {curriculum.endYear || "TBD"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                <Layers size={14} />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest group-hover:text-primary-300 transition-colors">
                                  Major Alignment
                                </span>
                                <span className="text-xs font-bold text-zinc-500 truncate max-w-[200px] group-hover:text-primary-700 transition-colors">
                                  {curriculum.major?.majorName ||
                                    "Institutional Core"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pt-6 lg:pt-0 w-full lg:w-auto">
                          {curriculum.status === CURRICULUM_STATUS.DRAFT ? (
                            <div className="flex gap-2 w-full lg:w-auto">
                              <button
                                className="flex-1 lg:flex-none btn-charcoal px-6 py-3 group/btn text-[10px] uppercase font-black tracking-wider"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/dashboard/hocfdc/curriculums/new?id=${curriculum.curriculumId}`,
                                  );
                                }}
                              >
                                <PencilLine size={14} />
                                Edit Draft
                                <ArrowRight
                                  size={14}
                                  className="group-hover/btn:translate-x-1 transition-transform"
                                />
                              </button>
                              <button
                                className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 hover:text-red-600 transition-all active:scale-95 flex items-center justify-center shadow-sm border border-red-100/50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurriculumToDelete(curriculum);
                                }}
                                title="Delete Draft"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              className="flex-1 lg:flex-none btn-charcoal px-6 py-3 group/btn text-[10px] uppercase font-black tracking-wider"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/hocfdc/curriculums/${curriculum.curriculumId}`,
                                );
                              }}
                            >
                              <Eye size={14} />
                              View Details
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {initialData.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-32 flex flex-col items-center justify-center text-zinc-300 border-2 border-dashed border-zinc-100 rounded-[3rem]"
                    >
                      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                        <BookOpen size={40} strokeWidth={1} />
                      </div>
                      <h4 className="text-xl font-bold text-zinc-400 mb-2">
                        No Curriculum Found
                      </h4>
                      <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-zinc-300">
                        Try adjusting your filters or search terms
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Refined Pagination */}
              {initialTotalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-12 border-t border-zinc-100">
                  <div className="flex flex-col items-center md:items-start">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300 mb-1">
                      Archival Metrics
                    </span>
                    <p className="text-sm font-bold text-zinc-500">
                      Displaying{" "}
                      <span className="text-zinc-900">
                        {initialData.length}
                      </span>{" "}
                      of{" "}
                      <span className="text-zinc-900 tracking-tight">
                        {initialTotalElements}
                      </span>{" "}
                      institutional frameworks
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      disabled={currentPage === 0}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="w-12 h-12 rounded-2xl border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-primary-50 hover:text-primary hover:border-primary-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>

                    <div className="flex gap-2">
                      {[...Array(initialTotalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`w-12 h-12 rounded-2xl text-xs font-black transition-all ${
                            currentPage === i
                              ? "bg-primary text-white shadow-xl shadow-primary/20"
                              : "border border-zinc-100 text-zinc-400 hover:bg-primary-50 hover:text-primary hover:border-primary-100"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={currentPage === initialTotalPages - 1}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="w-12 h-12 rounded-2xl border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-primary-50 hover:text-primary hover:border-primary-100 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-zinc-100 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:bg-zinc-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 shadow-inner border border-emerald-100">
                  <CheckCircle2 size={40} />
                </div>

                <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-3">
                  Submission Successful!
                </h3>

                <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8 px-4">
                  Đã submit curriculum thành công. Bạn có thể theo dõi tiến độ
                  thẩm định tại tab{" "}
                  <span className="text-primary font-black uppercase">
                    Reviewing
                  </span>
                  .
                </p>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-zinc-900/20 hover:bg-zinc-800 transition-all active:scale-[0.98]"
                >
                  Got it, thanks!
                </button>
              </div>

              {/* Decorative Background Elements */}
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {curriculumToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setCurriculumToDelete(null)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl border border-zinc-100 overflow-hidden"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-6 shadow-inner border border-red-100">
                  <Trash2 size={40} />
                </div>

                <h3 className="text-2xl font-black text-zinc-900 tracking-tight mb-3">
                  Delete Curriculum?
                </h3>

                <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-8 px-4">
                  Bạn có chắc chắn muốn xóa bản thảo curriculum{" "}
                  <span className="text-red-600 font-bold">{curriculumToDelete.curriculumCode}</span>? 
                  Hành động này không thể hoàn tác.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    disabled={isDeleting}
                    onClick={() => setCurriculumToDelete(null)}
                    className="flex-1 py-4 bg-zinc-100 text-zinc-500 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDeleting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
