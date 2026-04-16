"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Plus,
  Search,
  MoreHorizontal,
  User,
  ChevronDown,
  SearchIcon,
  Loader2,
  X,
  History,
  LayoutGrid,
  Users,
  Settings,
  Eye,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MajorService,
  Major,
  CreateMajorPayload,
} from "@/services/major.service";
import { CurriculumService } from "@/services/curriculum.service";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ToastProvider } from "@/components/ui/Toast";
import { useMemo } from "react";

export default function ManageMajorsContent() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Instituional");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  // Create Modal State
  const [newMajor, setNewMajor] = useState<CreateMajorPayload>({
    majorCode: "",
    majorName: "",
    description: "",
  });
  const [createError, setCreateError] = useState("");

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch Majors
  const { data: majorResponse, isLoading: isMajorsLoading } = useQuery({
    queryKey: ["majors", search, selectedStatus],
    queryFn: () => MajorService.getMajors({ search, status: selectedStatus }),
  });

  // Fetch all Curriculums to count them per major
  const { data: curriculumResponse, isLoading: isCurriculumsLoading } =
    useQuery({
      queryKey: ["all-curriculums-counts"],
      queryFn: () => CurriculumService.getCurriculums({ size: 1000 }), // Large size to get all for counting
    });

  const majors = majorResponse?.data?.content || [];
  const curriculumsList = curriculumResponse?.data?.content || [];

  // Calculate counts per major code
  const curriculumCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    curriculumsList.forEach((curr) => {
      const code = curr.major?.majorCode || curr.majorCode;
      if (code) {
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    return counts;
  }, [curriculumsList]);

  const isLoading = isMajorsLoading;

  // Create Major Mutation
  const createMutation = useMutation({
    mutationFn: MajorService.createMajor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      setIsCreateModalOpen(false);
      setNewMajor({ majorCode: "", majorName: "", description: "" });
      setCreateError("");
      showToast("Major established successfully.", "success");
    },
    onError: (error: any) => {
      setCreateError(error.message || "Failed to create major");
      showToast(error.message || "Failed to establish major.", "error");
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      MajorService.updateMajorStatus(id, status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      showToast(
        `Major status updated to ${response.data.status.replace("_", " ")}.`,
        "success",
      );
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to update major status.", "error");
    },
  });

  // Delete Major Mutation
  const deleteMutation = useMutation({
    mutationFn: MajorService.deleteMajor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      showToast("Major deleted permanently.", "success");
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to delete major.", "error");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete the major "${name}"? This action cannot be undone.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(newMajor);
  };

  const handleOpenDetail = (code: string) => {
    router.push(
      `/dashboard/vice-principal/manage-majors/${encodeURIComponent(code)}`,
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Sub Header (Style from Image) */}
      <div className="px-8 py-6 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white sticky top-0 z-20">
        <h1 className="text-2xl font-black text-primary tracking-tighter uppercase">
          Manage Majors
        </h1>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-6 py-2.5 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={3} />
            Create Major
          </button>
        </div>
      </div>

      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        {/* Filters Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300"
                size={18}
              />
              <input
                type="text"
                placeholder="Search major code (BIT, BCS, BBA)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-100 rounded-full py-2.5 pl-12 pr-4 text-base font-medium focus:ring-4 focus:ring-primary/5 transition-all outline-none"
              />
            </div>

            {/* Status Dropdown */}
            <div className="relative w-full sm:w-56">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="w-full flex items-center justify-between px-6 py-2.5 bg-white border border-zinc-100 rounded-full text-xs font-black uppercase tracking-widest text-zinc-500 hover:border-zinc-300 transition-all shadow-sm"
              >
                {selectedStatus
                  ? selectedStatus.replace("_", " ")
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
                    {[
                      "",
                      "DRAFT",
                      "INTERNAL_REVIEW",
                      "PUBLISHED",
                      "ARCHIVED",
                    ].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setIsStatusOpen(false);
                        }}
                        className={`w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-colors ${
                          selectedStatus === status
                            ? "bg-primary text-white"
                            : "text-zinc-500 hover:bg-zinc-50"
                        }`}
                      >
                        {status === "" ? "Show All" : status.replace("_", " ")}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Major Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-300">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p className="font-black text-xs uppercase tracking-widest">
              Accessing Institutional Repository...
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {majors.map((major) => (
                <motion.div
                  key={major.majorId}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 shadow-sm hover:shadow-2xl hover:border-zinc-200 transition-all duration-500 group relative flex flex-col h-full overflow-hidden"
                >
                  {/* Glassy Background Ornament */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-zinc-50 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                          {major.majorCode}
                        </span>
                        <div
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm ${
                            major.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                              : major.status === "INTERNAL_REVIEW"
                                ? "bg-amber-50 text-amber-600 border border-amber-100/50"
                                : major.status === "DRAFT"
                                  ? "bg-blue-50 text-blue-600 border border-blue-100/50"
                                  : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          {major.status?.replace("_", " ")}
                        </div>
                      </div>
                      <h3 className="text-2xl font-black text-zinc-900 leading-tight tracking-tight group-hover:text-primary transition-colors pr-4">
                        {major.majorName}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {major.status === "DRAFT" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(major.majorId, major.majorName);
                          }}
                          disabled={deleteMutation.isPending}
                          className="text-rose-400 hover:text-rose-600 transition-colors p-1.5 bg-rose-50 rounded-lg disabled:opacity-50"
                          title="Delete Draft Major"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                      <button className="text-zinc-300 hover:text-zinc-900 transition-colors p-1 bg-zinc-50 rounded-lg">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Quick Insights Row */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-zinc-50/50 rounded-2xl border border-zinc-100/50 space-y-1 group/item hover:bg-white hover:border-zinc-200 transition-all">
                      <span className="text-xs font-black text-zinc-300 uppercase tracking-widest block">
                        Curriculums
                      </span>
                      <div className="flex items-end gap-1">
                        <span className="text-lg font-black text-zinc-900 leading-none">
                          {curriculumCountsMap[major.majorCode] || 0}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 mb-0.5 lowercase">
                          {(curriculumCountsMap[major.majorCode] || 0) === 1
                            ? "Blueprint"
                            : "Blueprints"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transition Actions */}
                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => handleOpenDetail(major.majorCode)}
                      className="w-full py-3.5 bg-zinc-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-zinc-800 transition-all active:scale-[0.98] shadow-xl shadow-zinc-900/10 flex items-center justify-center gap-2 group/btn"
                    >
                      Manage Blueprint
                      <Eye
                        size={14}
                        className="group-hover/btn:translate-x-1 transition-transform"
                      />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Major Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-zinc-100"
            >
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-xs font-black text-primary uppercase tracking-[0.2em]">
                      Institutional Hub
                    </p>
                    <h3 className="text-3xl font-black text-zinc-900 tracking-tight">
                      New Major.
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="p-2 hover:bg-zinc-50 rounded-full transition-colors text-zinc-400"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreateSubmit} className="space-y-6">
                  {createError && (
                    <div className="p-4 bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest rounded-2xl border border-rose-100">
                      Error: {createError}
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                          Major Identity (Code)
                        </label>
                        <input
                          required
                          value={newMajor.majorCode}
                          onChange={(e) =>
                            setNewMajor({
                              ...newMajor,
                              majorCode: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl py-4 px-6 text-base font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                          placeholder="e.g. SE"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                          Full Major Name
                        </label>
                        <input
                          required
                          value={newMajor.majorName}
                          onChange={(e) =>
                            setNewMajor({
                              ...newMajor,
                              majorName: e.target.value,
                            })
                          }
                          className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl py-4 px-6 text-base font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                          placeholder="e.g. Software Engineering"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                        Strategic Description
                      </label>
                      <textarea
                        required
                        rows={4}
                        value={newMajor.description}
                        onChange={(e) =>
                          setNewMajor({
                            ...newMajor,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-50/50 border border-zinc-100 rounded-2xl py-4 px-6 text-base font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none placeholder:text-zinc-300"
                        placeholder="Scope and objectives of this program..."
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                      Abort
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      className="flex-[2] py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-primary/20 active:scale-[0.98] flex justify-center items-center gap-3 disabled:opacity-50"
                    >
                      {createMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} strokeWidth={3} />
                      )}
                      {createMutation.isPending
                        ? "Establishing..."
                        : "Confirm Registration"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
