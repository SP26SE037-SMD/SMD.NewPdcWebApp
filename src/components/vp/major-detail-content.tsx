"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MajorService } from "@/services/major.service";
import { PoService } from "@/services/po.service";
import { CurriculumService } from "@/services/curriculum.service";
import { useToast } from "@/components/ui/Toast";
import {
  X,
  Plus,
  Loader2,
  Target,
  ChevronLeft,
  Trash2,
  Save,
  Edit2,
  LayoutGrid,
  AlertCircle,
  ChevronRight,
  Rocket,
  Calendar,
  History,
  FileText,
  Menu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function MajorDetailContent() {
  const params = useParams();
  const router = useRouter();
  const majorCode = params.majorCode as string;
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Staging State
  const [stagedPOs, setStagedPOs] = useState<
    { poCode: string; description: string }[]
  >([]);
  const [currentPO, setCurrentPO] = useState({ poCode: "", description: "" });
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "DRAFTING">(
    "OVERVIEW",
  );
  const [activeDetailTab, setActiveDetailTab] = useState<
    "OVERVIEW" | "CURRICULUM"
  >("OVERVIEW");

  // Major Details Query
  const {
    data: majorDetail,
    isLoading: isDetailLoading,
    error,
  } = useQuery({
    queryKey: ["major", majorCode],
    queryFn: () => MajorService.getMajorByCode(majorCode),
    enabled: !!majorCode,
  });

  // Curriculums Query - same logic as hocfdc (search by majorCode)
  const { data: curriculumsResponse, isLoading: isCurriculumsLoading } =
    useQuery({
      queryKey: ["major-curriculums", majorCode],
      queryFn: () =>
        CurriculumService.getCurriculums({ search: majorCode, size: 100 }),
      enabled: !!majorCode,
    });

  const curriculums = curriculumsResponse?.data?.content || [];

  // POs Query
  const { data: posResponse, isLoading: isPOsLoading } = useQuery({
    queryKey: ["major-pos", majorDetail?.data?.majorId],
    queryFn: () =>
      PoService.getPOsByMajorId(majorDetail?.data?.majorId || "", {
        size: 100,
      }),
    enabled: !!majorDetail?.data?.majorId,
  });

  // Bulk PO Mutation
  const bulkPOMutation = useMutation({
    mutationFn: (pos: { poCode: string; description: string }[]) =>
      PoService.createMultiplePOs(majorDetail?.data?.majorId || "", pos),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["major-pos", majorDetail?.data?.majorId],
      });
      setStagedPOs([]);
      showToast("Program Objectives established successfully.", "success");
      setActiveTab("OVERVIEW");
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to establish objectives.", "error");
    },
  });

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      MajorService.updateMajorStatus(majorDetail?.data?.majorId || "", status),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["major", majorCode] });
      showToast(
        `Major status updated to ${response.data.status.replace("_", " ")}.`,
        "success",
      );
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to update major status.", "error");
    },
  });

  const addPOToStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentPO.poCode && currentPO.description) {
      setStagedPOs((prev) => [...prev, { ...currentPO }]);
      setCurrentPO({ poCode: "", description: "" });
      showToast(`Objective ${currentPO.poCode} staged for review.`, "info");
    }
  };

  const removeFromStage = (index: number) => {
    setStagedPOs((prev) => prev.filter((_, i) => i !== index));
  };

  const editFromStage = (index: number) => {
    const poToEdit = stagedPOs[index];
    setCurrentPO({ ...poToEdit });
    removeFromStage(index);
  };

  const handleSaveBulk = () => {
    if (stagedPOs.length > 0) {
      bulkPOMutation.mutate(stagedPOs);
    }
  };

  if (isDetailLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-zinc-300">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-black text-xs uppercase tracking-[0.3em]">
          Decoding Program Blueprint...
        </p>
      </div>
    );
  }

  if (error || !majorDetail?.data) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-zinc-400 space-y-4">
        <AlertCircle size={48} />
        <p className="font-bold">Error retrieving major information.</p>
        <Link
          href="/dashboard/vice-principal/manage-majors"
          className="text-primary font-bold hover:underline"
        >
          Return to Portal
        </Link>
      </div>
    );
  }

  const major = majorDetail.data;
  const isDraft = major.status === "DRAFT";

  if (isDraft) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-[#2d3335] pb-20">
        {/* Header - đồng bộ với Established view */}
        <div className="bg-white border-b border-[#ebeef0]">
          <div className="max-w-7xl mx-auto px-8 py-8">
            <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5a6062] uppercase tracking-[0.2em] mb-4">
              <Link
                href="/dashboard/vice-principal/manage-majors"
                className="hover:text-[#2d6a4f] transition-colors"
              >
                Curriculum Catalog
              </Link>
              <ChevronRight size={10} />
              <span className="text-[#2d6a4f]">{major.majorCode}</span>
            </nav>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                <h1 className="text-5xl font-extrabold tracking-tighter text-[#2d3335] mb-4 font-['Plus_Jakarta_Sans']">
                  {major.majorName}
                </h1>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-blue-100 text-blue-700">
                    DRAFT PROPOSAL
                  </span>
                  <span className="text-xs text-[#5a6062] flex items-center gap-1.5 font-medium">
                    <Calendar size={14} className="text-[#adb3b5]" />
                    Registered {new Date(major.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/vice-principal/manage-majors/${encodeURIComponent(major.majorCode)}/review`,
                    )
                  }
                  className="px-8 py-3 bg-amber-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/10 active:scale-95 transition-all flex items-center gap-2"
                >
                  <ChevronRight size={14} strokeWidth={2.5} />
                  Internal Review
                </button>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-8 mt-12 border-b-2 border-transparent">
              {[
                { id: "OVERVIEW" as const, label: "Major Overview" },
                { id: "DRAFTING" as const, label: "Drafting Arena" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm font-bold transition-all relative ${activeTab === tab.id
                      ? "text-[#2d6a4f]"
                      : "text-[#5a6062] hover:text-[#2d6a4f]"
                    }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="draftActiveTabUnderline"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-[#2d6a4f] rounded-t-full"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-8 pt-10">
          <AnimatePresence mode="wait">
            {activeTab === "OVERVIEW" ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {/* Horizontal Stepper - đồng bộ với Established */}
                <div className="max-w-3xl mx-auto py-8">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-[#ebeef0] -translate-y-1/2 rounded-full" />
                    <div
                      className="absolute top-1/2 left-0 h-1 bg-[#2d6a4f] -translate-y-1/2 rounded-full transition-all duration-1000"
                      style={{ width: "0%" }}
                    />
                    {[
                      "Drafting",
                      "Internal Review",
                      "Published",
                      "Archived",
                    ].map((step, idx) => {
                      const isActive = idx === 0;
                      return (
                        <div key={step} className="relative z-10">
                          <div
                            className={`w-4 h-4 rounded-full border-4 transition-all duration-500 scale-125 ${isActive
                                ? "bg-[#2d6a4f] border-[#b1f0ce]"
                                : "bg-white border-[#ebeef0]"
                              }`}
                          />
                          <div
                            className={`absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-[#2d6a4f]" : "text-[#adb3b5]"
                              }`}
                          >
                            {step}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Strategic Description Card */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-[#ebeef0] relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest flex items-center gap-2">
                      <FileText size={16} className="text-[#2d6a4f]" />
                      Strategic Description
                    </h3>
                  </div>
                  <p className="text-[#5a6062] text-lg leading-relaxed font-medium italic">
                    "{major.description || "No description provided for this academic program."}"
                  </p>
                  <div className="mt-10 pt-8 border-t border-[#f1f4f5] flex items-center gap-12">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-[0.2em] block">
                        System Registration
                      </span>
                      <span className="text-sm font-bold text-[#2d3335]">
                        {new Date(major.createdAt).toLocaleDateString(
                          undefined,
                          { dateStyle: "long" },
                        )}
                      </span>
                    </div>
                  </div>
                </section>

                {/* Program Objectives Card */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-[#ebeef0]">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest flex items-center gap-2">
                      <Target size={18} className="text-[#2d6a4f]" />
                      Program Objectives
                    </h3>
                    <div className="px-3 py-1 bg-[#f1f4f5] rounded-full text-[10px] font-bold text-[#5a6062] uppercase tracking-widest">
                      {isPOsLoading
                        ? "..."
                        : posResponse?.data?.totalElements || 0}{" "}
                      Deployed
                    </div>
                  </div>

                  <div className="space-y-2">
                    {isPOsLoading ? (
                      <div className="py-12 flex justify-center">
                        <Loader2 className="animate-spin text-[#adb3b5]" />
                      </div>
                    ) : (
                      posResponse?.data?.content && posResponse.data.content.length > 0 ? (
                        posResponse.data.content.map((po) => (
                          <div
                            key={po.poId}
                            className="group flex gap-6 p-4 rounded-xl hover:bg-[#f8f9fa] transition-colors"
                          >
                            <div className="w-12 text-sm font-black text-[#2d6a4f] opacity-40 group-hover:opacity-100 transition-opacity pt-1">
                              {po.poCode}
                            </div>
                            <div className="flex-1 text-[#5a6062] text-sm font-medium leading-relaxed">
                              {po.description}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-16 border-2 border-dashed border-[#ebeef0] rounded-2xl flex flex-col items-center text-center space-y-3">
                          <Target size={24} className="text-[#adb3b5]" />
                          <p className="text-xs font-black text-[#adb3b5] uppercase tracking-widest">
                            No Objectives Established
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </section>
              </motion.div>
            ) : (
              <motion.div
                key="drafting"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
              >
                <div className="lg:col-span-5 bg-white rounded-2xl p-8 shadow-sm border border-[#ebeef0] space-y-8">
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest flex items-center gap-2">
                      <Plus size={16} className="text-[#2d6a4f]" />
                      Draft New Objective
                    </h3>
                    <p className="text-xs text-[#5a6062] font-medium">
                      Define a strategic learning goal for this program.
                    </p>
                  </div>
                  <form onSubmit={addPOToStage} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest ml-1">
                        PO Code
                      </label>
                      <input
                        required
                        value={currentPO.poCode}
                        onChange={(e) =>
                          setCurrentPO({ ...currentPO, poCode: e.target.value })
                        }
                        className="w-full bg-[#f8f9fa] border-2 border-transparent focus:border-[#2d6a4f]/30 rounded-xl py-4 px-5 text-sm font-bold outline-none transition-all"
                        placeholder="e.g. PO1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest ml-1">
                        Strategic Description
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={currentPO.description}
                        onChange={(e) =>
                          setCurrentPO({
                            ...currentPO,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-[#f8f9fa] border-2 border-transparent focus:border-[#2d6a4f]/30 rounded-xl p-5 text-sm font-medium outline-none transition-all resize-none"
                        placeholder="Expected outcome and alignment..."
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4 bg-[#2d6a4f] text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#1d5c42] transition-all shadow-lg shadow-[#2d6a4f]/10 flex items-center justify-center gap-2"
                    >
                      <Plus size={16} strokeWidth={3} />
                      Add to Stage
                    </button>
                  </form>
                </div>
                <div className="lg:col-span-7 space-y-6">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest">
                      Staging Queue ({stagedPOs.length})
                    </h4>
                    {stagedPOs.length > 0 && (
                      <button
                        onClick={handleSaveBulk}
                        disabled={bulkPOMutation.isPending}
                        className="flex items-center gap-2 px-6 py-3 bg-[#2d3335] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#0c0f10] transition-all shadow-lg shadow-[#2d3335]/10 disabled:opacity-50"
                      >
                        {bulkPOMutation.isPending ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : (
                          <Save size={14} />
                        )}
                        Save All to Blueprint
                      </button>
                    )}
                  </div>
                  <div className="space-y-3 min-h-[400px]">
                    {stagedPOs.length > 0 ? (
                      stagedPOs.map((po, i) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          key={i}
                          className="p-5 bg-white border border-[#ebeef0] rounded-2xl flex items-start gap-4 shadow-sm hover:border-[#2d6a4f]/20 transition-all"
                        >
                          <div className="w-10 h-10 rounded-lg bg-[#f8f9fa] flex items-center justify-center shrink-0 text-xs font-black text-[#2d6a4f] border border-[#ebeef0]">
                            {po.poCode}
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className="text-sm text-[#5a6062] font-medium leading-relaxed">
                              {po.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => editFromStage(i)}
                              className="p-2.5 text-[#adb3b5] hover:text-[#2d6a4f] transition-colors"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => removeFromStage(i)}
                              className="p-2.5 text-[#adb3b5] hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-[400px] border-2 border-dashed border-[#ebeef0] rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-[#f8f9fa] flex items-center justify-center">
                          <Target size={28} className="text-[#adb3b5]" />
                        </div>
                        <p className="text-xs font-black text-[#adb3b5] uppercase tracking-widest">
                          Queue Empty
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // Established View (For INTERNAL_REVIEW, PUBLISHED, etc.)
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#2d3335] pb-20">
      {/* Header based on Veridian Design - Removed sticky to allow natural scrolling */}
      <div className="bg-white border-b border-[#ebeef0]">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5a6062] uppercase tracking-[0.2em] mb-4">
            <Link
              href="/dashboard/vice-principal/manage-majors"
              className="hover:text-[#2d6a4f] transition-colors"
            >
              Curriculum Catalog
            </Link>
            <ChevronRight size={10} />
            <span className="text-[#2d6a4f]">{major.majorCode}</span>
          </nav>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-5xl font-extrabold tracking-tighter text-[#2d3335] mb-4 font-['Plus_Jakarta_Sans']">
                {major.majorName}
              </h1>
              <div className="flex items-center gap-4">
                <span
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${major.status === "PUBLISHED"
                      ? "bg-[#b1f0ce] text-[#1d5c42]"
                      : "bg-[#fcfeb9] text-[#60622d]"
                    }`}
                >
                  {major.status?.replace("_", " ")} PROPOSAL
                </span>
                <span className="text-xs text-[#5a6062] flex items-center gap-1.5 font-medium">
                  <Calendar size={14} className="text-[#adb3b5]" />
                  Registered {new Date(major.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              {major.status === "INTERNAL_REVIEW" && (
                <button
                  onClick={() => updateStatusMutation.mutate("PUBLISHED")}
                  disabled={updateStatusMutation.isPending}
                  className="px-8 py-3 bg-[#2d6a4f] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-[#2d6a4f]/10 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Rocket size={14} strokeWidth={2.5} />
                  )}
                  Publish Portfolio
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-8 mt-12 border-b-2 border-transparent">
            {[
              { id: "OVERVIEW" as const, label: "Major Overview" },
              { id: "CURRICULUM" as const, label: "Curriculum Version" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id)}
                className={`pb-4 text-sm font-bold transition-all relative ${activeDetailTab === tab.id
                    ? "text-[#2d6a4f]"
                    : "text-[#5a6062] hover:text-[#2d6a4f]"
                  }`}
              >
                {tab.label}
                {activeDetailTab === tab.id && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#2d6a4f] rounded-t-full"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 pt-10">
        <AnimatePresence mode="wait">
          {activeDetailTab === "OVERVIEW" ? (
            <motion.div
              key="overview-established"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-10"
            >
              {/* Horizontal Stepper - adapted from Old UI */}
              <div className="max-w-3xl mx-auto py-8">
                <div className="relative flex items-center justify-between">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-[#ebeef0] -translate-y-1/2 rounded-full" />
                  <div
                    className="absolute top-1/2 left-0 h-1 bg-[#2d6a4f] -translate-y-1/2 rounded-full transition-all duration-1000"
                    style={{
                      width:
                        major.status === "INTERNAL_REVIEW"
                          ? "33.33%"
                          : major.status === "PUBLISHED"
                            ? "66.66%"
                            : "100%",
                    }}
                  />

                  {[
                    "Drafting",
                    "Internal Review",
                    "Published",
                    "Archived",
                  ].map((step, idx) => {
                    const statusOrder = [
                      "DRAFT",
                      "INTERNAL_REVIEW",
                      "PUBLISHED",
                      "ARCHIVED",
                    ];
                    const currentIdx = statusOrder.indexOf(major.status);
                    const stepStatus = statusOrder[idx];
                    const isActive = idx === currentIdx;
                    const isCompleted = idx < currentIdx;

                    return (
                      <div key={step} className="relative z-10">
                        <div
                          className={`w-4 h-4 rounded-full border-4 transition-all duration-500 scale-125 ${isActive
                              ? "bg-[#2d6a4f] border-[#b1f0ce]"
                              : isCompleted
                                ? "bg-[#2d6a4f] border-[#2d6a4f]"
                                : "bg-white border-[#ebeef0]"
                            }`}
                        />
                        <div
                          className={`absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-wider ${isActive ? "text-[#2d6a4f]" : "text-[#adb3b5]"
                            }`}
                        >
                          {step}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 space-y-8">
                  {/* Strategic Information Card */}
                  <section className="bg-white rounded-2xl p-8 shadow-sm border border-[#ebeef0] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest flex items-center gap-2">
                        <FileText size={16} className="text-[#2d6a4f]" />
                        Strategic Description
                      </h3>
                      <button className="text-[10px] font-bold text-[#2d6a4f] hover:underline uppercase tracking-widest">
                        Edit Analysis
                      </button>
                    </div>
                    <p className="text-[#5a6062] text-lg leading-relaxed font-medium italic">
                      "{major.description}"
                    </p>
                    <div className="mt-10 pt-8 border-t border-[#f1f4f5] flex items-center gap-12">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-[0.2em] block">
                          System Registration
                        </span>
                        <span className="text-sm font-bold text-[#2d3335]">
                          {new Date(major.createdAt).toLocaleDateString(
                            undefined,
                            { dateStyle: "long" },
                          )}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-[0.2em] block">
                          Version Protocol
                        </span>
                        <span className="text-sm font-bold text-[#1d5c42] bg-[#b1f0ce]/30 px-2 py-0.5 rounded">
                          v2.0 Stable
                        </span>
                      </div>
                    </div>
                  </section>

                  {/* Program Objectives Section */}
                  <section className="bg-white rounded-2xl p-8 shadow-sm border border-[#ebeef0]">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest flex items-center gap-2">
                        <Target size={18} className="text-[#2d6a4f]" />
                        Program Objectives
                      </h3>
                      <div className="px-3 py-1 bg-[#f1f4f5] rounded-full text-[10px] font-bold text-[#5a6062] uppercase tracking-widest">
                        {posResponse?.data?.totalElements || 0} Deployed
                      </div>
                    </div>

                    <div className="space-y-2">
                      {isPOsLoading ? (
                        <div className="py-12 flex justify-center">
                          <Loader2 className="animate-spin text-[#adb3b5]" />
                        </div>
                      ) : (
                        posResponse?.data?.content.map((po, idx) => (
                          <div
                            key={po.poId}
                            className="group flex gap-6 p-4 rounded-xl hover:bg-[#f8f9fa] transition-colors"
                          >
                            <div className="w-12 text-sm font-black text-[#2d6a4f] opacity-40 group-hover:opacity-100 transition-opacity pt-1">
                              {po.poCode}
                            </div>
                            <div className="flex-1 text-[#5a6062] text-sm font-medium leading-relaxed">
                              {po.description}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="curriculum-view"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-sm border border-[#ebeef0] overflow-hidden">
                <div className="px-8 py-6 border-b border-[#f1f4f5] flex justify-between items-center bg-[#f8f9fa]">
                  <h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest">
                    Available Curriculum Versions
                  </h3>
                  <button className="text-[#2d6a4f] text-[10px] font-bold uppercase tracking-widest hover:underline">
                    Deploy New Framework
                  </button>
                </div>
                {isCurriculumsLoading ? (
                  <div className="p-20 flex justify-center">
                    <Loader2 className="animate-spin text-[#adb3b5]" />
                  </div>
                ) : (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-[#f1f4f5]">
                        <th className="px-8 py-4 text-[10px] font-black text-[#adb3b5] uppercase tracking-widest">
                          Version Code
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-[#adb3b5] uppercase tracking-widest">
                          Name
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-[#adb3b5] uppercase tracking-widest">
                          Academic Span
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-[#adb3b5] uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-8 py-4 text-[10px] font-black text-[#adb3b5] uppercase tracking-widest text-right">
                          Operational
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f4f5]">
                      {curriculums.length > 0 ? (
                        curriculums.map((curr) => (
                          <tr key={curr.curriculumId} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-8 py-5 text-sm font-bold text-[#1d5c42]">
                              {curr.curriculumCode}
                            </td>
                            <td className="px-8 py-5 text-sm font-semibold text-[#2d3335]">
                              {curr.curriculumName}
                            </td>
                            <td className="px-8 py-5 text-sm font-medium text-[#5a6062]">
                              {curr.startYear} - {curr.endYear}
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${curr.status === 'PUBLISHED' ? 'bg-[#b1f0ce] text-[#1d5c42]' : 'bg-[#f1f4f5] text-[#5a6062]'
                                }`}>
                                {curr.status}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <button className="text-[#2d6a4f] hover:bg-[#b1f0ce]/20 p-2 rounded-lg transition-colors">
                                <ChevronRight size={18} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center">
                            <div className="flex flex-col items-center opacity-30">
                              <History size={48} className="mb-4" />
                              <p className="text-sm font-bold uppercase tracking-widest">No Frameworks Established Yet</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
