"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import {
  CurriculumService,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Target,
  Network,
  Layout,
  KanbanSquare,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Search,
  ShieldCheck,
  PenTool,
  Rocket,
  Archive,
  FileText,
  Settings,
  Layers,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import CurriculumInformation from "./CurriculumInformation";
import CurriculumBriefInfo from "./CurriculumBriefInfo";
import CurriculumPLOs from "./CurriculumPLOs";
import MappingMatrix from "@/components/vp/mapping-matrix";
import { SprintsManagement } from "./SprintsManagement";

const TABS = [
  { id: "info", label: "Curriculum Info", icon: BookOpen },
  { id: "plo", label: "PLOs", icon: Target },
  { id: "mapping", label: "PO-PLO Mapping", icon: Network },
  { id: "semester", label: "Semester Structure", icon: Layout },
  { id: "sprints", label: "Sprints", icon: KanbanSquare },
] as const;

type TabType = (typeof TABS)[number]["id"];

const ALL_STATUS_ORDER = [
  {
    id: CURRICULUM_STATUS.DRAFT,
    label: "Draft",
    icon: FileText,
    color: "#94a3b8",
  },
  {
    id: CURRICULUM_STATUS.STRUCTURE_REVIEW,
    label: "Structure Review",
    icon: Search,
    color: "#f59e0b",
  },
  {
    id: CURRICULUM_STATUS.STRUCTURE_APPROVED,
    label: "Structure Approved",
    icon: CheckCircle2,
    color: "#10b981",
  },
  {
    id: CURRICULUM_STATUS.SYLLABUS_DEVELOP,
    label: "Syllabus Develop",
    icon: Settings,
    color: "#3b82f6",
  },
  {
    id: CURRICULUM_STATUS.FINAL_REVIEW,
    label: "Final Review",
    icon: ShieldCheck,
    color: "#8b5cf6",
  },
  {
    id: CURRICULUM_STATUS.SIGNED,
    label: "Signed",
    icon: PenTool,
    color: "#f43f5e",
  },
  {
    id: CURRICULUM_STATUS.PUBLISHED,
    label: "Published",
    icon: Rocket,
    color: "#06b6d4",
  },
  {
    id: CURRICULUM_STATUS.ARCHIVED,
    label: "Archived",
    icon: Archive,
    color: "#71717a",
  },
];

const currentIdx = ALL_STATUS_ORDER.findIndex(
  (s) => s.id === (curriculum?.curriculumStatus || curriculum?.status),
);
const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;

const renderStatusStepper = () => (
  <div className="relative group/stepper w-full mt-1">
    <div className="flex items-center overflow-x-auto no-scrollbar scroll-smooth snap-x w-full py-2 justify-between">
      {ALL_STATUS_ORDER.map((statusItem, idx) => {
        const isCompleted = idx < safeCurrentIdx;
        const isActive = idx === safeCurrentIdx;
        const Icon = statusItem.icon;

        return (
          <div
            key={statusItem.id}
            className={`flex items-center snap-center ${idx < ALL_STATUS_ORDER.length - 1 ? "flex-1" : ""}`}
          >
            <div className="flex flex-col items-center relative group w-24">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.15 : 1,
                  backgroundColor: isCompleted
                    ? "var(--primary)"
                    : isActive
                      ? statusItem.color
                      : "rgb(255, 255, 255)",
                  borderColor: isCompleted
                    ? "var(--primary)"
                    : isActive
                      ? statusItem.color
                      : "rgb(244, 244, 245)",
                  color:
                    isActive || isCompleted ? "white" : "rgb(161, 161, 170)",
                }}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-500 z-10 relative`}
              >
                <Icon size={14} strokeWidth={2.5} />
              </motion.div>
              <motion.span
                animate={{
                  color:
                    isActive || isCompleted
                      ? "rgb(24, 24, 27)"
                      : "rgb(161, 161, 170)",
                  opacity: isActive || isCompleted ? 1 : 0.6,
                }}
                className={`text-[9px] font-black uppercase tracking-widest mt-1 whitespace-nowrap text-center max-w-[100px] leading-tight`}
              >
                {statusItem.label}
              </motion.span>
            </div>
            {idx < ALL_STATUS_ORDER.length - 1 && (
              <div className="flex-1 h-[2px] bg-zinc-200 mx-2 rounded-full relative overflow-hidden min-w-[20px]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: isCompleted ? "100%" : "0%",
                    backgroundColor: isCompleted
                      ? "var(--primary)"
                      : statusItem.color,
                  }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="h-full"
                />
                {isActive && (
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      repeat: Infinity,
                      duration: 2,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-indigo-200/40"
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none rounded-l-3xl z-20 opacity-0 group-hover/stepper:opacity-100 transition-opacity" />
    <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none rounded-r-3xl z-20 opacity-0 group-hover/stepper:opacity-100 transition-opacity" />
  </div>
);

export default function CurriculumDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      CurriculumService.updateCurriculumStatus(id, newStatus as any),
    onSuccess: (res: any) => {
      if (!res || res.status === 1000 || !res.status) {
        showToast("Status updated successfully", "success");
        queryClient.invalidateQueries({ queryKey: ["curriculum-details", id] });
        router.refresh();
      } else {
        showToast(res.message || "Failed to update status", "error");
      }
    },
    onError: (err: any) =>
      showToast(err.message || "Connection error", "error"),
  });

  const handleStatusTransition = (newStatus: string) => {
    if (
      confirm(
        `Are you sure you want to transition this framework to ${newStatus.replace("_", " ")}?`,
      )
    ) {
      statusMutation.mutate(newStatus);
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ["curriculum-details", id],
    queryFn: () => CurriculumService.getCurriculumById(id),
  });
  const curriculum = data?.data;
  const [activeTab, setActiveTab] = useState<TabType>("info");

  if (isLoading || !curriculum) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  const currentIdx = ALL_STATUS_ORDER.findIndex(
    (s) => s.id === (curriculum?.curriculumStatus || curriculum?.status),
  );
  const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className="min-h-screen bg-zinc-50/50 flex flex-col font-sans">
      {/* Universal Header */}
      <div className="bg-white border-b border-zinc-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-5 pt-3 pb-0 flex flex-col gap-2">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-2">
            <div className="flex items-start gap-3">
              <button
                onClick={() => router.back()}
                className="w-7 h-7 shrink-0 flex items-center justify-center bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all shadow-sm group"
              >
                <ChevronLeft
                  className="group-hover:-translate-x-0.5 transition-transform"
                  size={16}
                />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-widest">
                    {curriculum.curriculumCode}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-zinc-300" />
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                    {curriculum.majorName ||
                      curriculum.decisionNo ||
                      "DRAFT STAGE"}
                  </span>
                </div>
                <h1 className="text-lg md:text-xl font-black text-zinc-900 tracking-tight leading-tight max-w-2xl">
                  {curriculum.curriculumName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {(curriculum.curriculumStatus || curriculum.status) ===
                CURRICULUM_STATUS.STRUCTURE_APPROVED && (
                <button
                  onClick={() =>
                    handleStatusTransition(CURRICULUM_STATUS.SYLLABUS_DEVELOP)
                  }
                  className="px-5 py-2.5 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Start Syllabus Dev <Layers size={14} />
                </button>
              )}

              {(curriculum.curriculumStatus || curriculum.status) ===
                CURRICULUM_STATUS.SIGNED && (
                <button
                  onClick={() =>
                    handleStatusTransition(CURRICULUM_STATUS.PUBLISHED)
                  }
                  className="px-5 py-2.5 bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  Publish <Share2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div>{renderStatusStepper()}</div>

          {/* Premium Tab Bar */}
          <div className="flex flex-wrap gap-x-8 gap-y-1 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    isActive
                      ? "text-primary"
                      : "text-zinc-500 hover:text-zinc-900"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeHorizontalTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon
                    size={14}
                    className={isActive ? "text-primary" : "text-zinc-400"}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 w-full flex flex-col p-4 relative h-full">
        {/* Tab Content Area */}
        <div className="flex-1 bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden min-h-[500px] relative flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 overflow-y-auto"
            >
              {activeTab === "info" && (
                <CurriculumBriefInfo id={id} isEmbedded={true} />
              )}
              {activeTab === "plo" && (
                <CurriculumPLOs curriculumIdProp={id} isEmbedded={true} />
              )}
              {activeTab === "mapping" && <MappingMatrix curriculumId={id} />}
              {activeTab === "semester" && (
                <CurriculumInformation id={id} isEmbedded={true} />
              )}
              {activeTab === "sprints" && (
                <SprintsManagement curriculumId={id} isEmbedded={true} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
