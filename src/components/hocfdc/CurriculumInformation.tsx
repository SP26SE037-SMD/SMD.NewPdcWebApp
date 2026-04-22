"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  MoreHorizontal,
  LayoutGrid,
  Clock,
  Target,
  Link as LinkIcon,
  Download,
  Sparkles,
  Filter,
  Building2,
  BookX,
  Layers,
  BookOpen,
  AlertCircle,
  Plus,
  ChevronDown,
  Loader2,
  Share2,
  CheckCircle2,
  Archive,
  Calendar,
  Box,
  FileText,
  History,
  Info,
  Award,
  X,
  ArrowRight,
  Settings,
  ClipboardCheck,
  Rocket,
  ShieldCheck,
  PenTool,
  Search,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CurriculumService,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { GroupService } from "@/services/group.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { useToast } from "@/components/ui/Toast";

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

const StatusStepper = ({ safeCurrentIdx }: { safeCurrentIdx: number }) => (
  <div className="relative group/stepper max-w-[550px]">
    <div className="flex items-center px-6 py-4 bg-white border border-zinc-100 rounded-3xl shadow-sm overflow-x-auto no-scrollbar scroll-smooth snap-x">
      {ALL_STATUS_ORDER.map((statusItem, idx) => {
        const isCompleted = idx < safeCurrentIdx;
        const isActive = idx === safeCurrentIdx;
        const Icon = statusItem.icon;

        return (
          <div key={statusItem.id} className="flex items-center snap-center">
            <div className="flex flex-col items-center relative group min-w-[120px]">
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
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shadow-lg transition-all duration-500 z-10 relative`}
              >
                <Icon size={18} strokeWidth={2.5} />
              </motion.div>

              <motion.span
                animate={{
                  color:
                    isActive || isCompleted
                      ? "rgb(24, 24, 27)"
                      : "rgb(161, 161, 170)",
                  opacity: isActive || isCompleted ? 1 : 0.6,
                }}
                className={`text-[9px] font-black uppercase tracking-widest mt-2 whitespace-nowrap text-center max-w-[100px] leading-tight`}
              >
                {statusItem.label}
              </motion.span>
            </div>

            {idx < ALL_STATUS_ORDER.length - 1 && (
              <div className="w-12 h-[3px] bg-zinc-100 mx-1 rounded-full relative overflow-hidden shrink-0">
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

export default function CurriculumDetail({ id, isEmbedded = false }: { id: string; isEmbedded?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
  const [activeElectiveGroup, setActiveElectiveGroup] = useState<any>(null);

  const { data: curriculumData, isLoading: isLoadingCore } = useQuery({
    queryKey: ["curriculum-details", id],
    queryFn: () => CurriculumService.getCurriculumById(id),
  });

  const { data: mappedData, isLoading: isLoadingMapped } = useQuery({
    queryKey: ["curriculum-mapped-subjects", id],
    queryFn: () => CurriculumGroupSubjectService.getSubjectsByCurriculum(id),
  });

  const { data: ploData, isLoading: isLoadingPLOs } = useQuery({
    queryKey: ["curriculum-plos", id],
    queryFn: () => CurriculumService.getPLOsByCurriculumId(id),
  });

  const { data: groupData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["warehouse-groups"],
    queryFn: () => GroupService.getGroups(),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      CurriculumService.updateCurriculumStatus(id, newStatus as any),
    onSuccess: (res) => {
      if (res.status === 1000) {
        showToast("Status updated successfully", "success");
        queryClient.invalidateQueries({ queryKey: ["curriculum-details", id] });
        router.refresh();
      } else {
        showToast(res.message || "Failed to update status", "error");
      }
    },
    onError: (err: any) => showToast(err.message || "Connection error", "error"),
  });

  const curriculum = curriculumData?.data;
  const mappedSubjects = mappedData?.data?.semesterMappings || [];
  const plos = ploData?.data?.content || [];
  const allGroups = groupData?.data?.content || groupData?.data || [];

  const usedGroupIds = useMemo(() => {
    const ids = new Set<string>();
    mappedSubjects.forEach((m: any) =>
      m.subjects?.forEach((s: any) => {
        if (s.groupId) ids.add(s.groupId);
      }),
    );
    return ids;
  }, [mappedSubjects]);

  const curriculumGroups = useMemo(() => {
    return (allGroups as any[]).filter((g: any) => usedGroupIds.has(g.groupId));
  }, [allGroups, usedGroupIds]);

  const combos = useMemo(
    () => curriculumGroups.filter((g: any) => g.type === "COMBO"),
    [curriculumGroups],
  );

  if (isLoadingCore || isLoadingMapped || isLoadingPLOs || isLoadingGroups) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-zinc-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-semibold text-[10px] tracking-widest uppercase">
          Initializing Visual Framework...
        </p>
      </div>
    );
  }

  if (!curriculum) return null;

  const SUBJECT_STATUS_COLORS: Record<string, string> = {
    DRAFT: "text-zinc-500 bg-zinc-50 border-zinc-100",
    DEFINED: "text-blue-500 bg-blue-50 border-blue-100",
    WAITING_SYLLABUS: "text-indigo-500 bg-indigo-50 border-indigo-100",
    PENDING_REVIEW: "text-amber-500 bg-amber-50 border-amber-100",
    COMPLETED: "text-emerald-500 bg-emerald-50 border-emerald-100",
    ARCHIVED: "text-red-500 bg-red-50 border-red-100",
  };

  const handleStatusTransition = (newStatus: string) => {
    if (
      confirm(
        `Are you sure you want to transition this framework to ${newStatus.replace("_", " ")}?`,
      )
    ) {
      statusMutation.mutate(newStatus);
    }
  };

  const totalCredits = mappedSubjects.reduce(
    (acc: number, sem: any) =>
      acc +
      (sem.subjects?.reduce(
        (sAcc: number, sub: any) => sAcc + (sub.credit ?? sub.credits ?? 3),
        0,
      ) || 0),
    0,
  );
  const totalSubjects = mappedSubjects.reduce(
    (acc: number, sem: any) => acc + (sem.subjects?.length || 0),
    0,
  );
  const semesterCount = Math.max(
    0,
    ...mappedSubjects.map((s: any) => Number(s.semesterNo)),
  );

  const currentIdx = ALL_STATUS_ORDER.findIndex(
    (s) => s.id === curriculum.status,
  );
  const safeCurrentIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className={`bg-zinc-50/50 flex flex-col ${isEmbedded ? "h-full" : "min-h-screen"}`}>
      {/* Sticky Header */}
      {!isEmbedded && (
      <div className="bg-white border-b border-zinc-100 px-8 py-4 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
            >
              <ChevronLeft
                className="group-hover:-translate-x-0.5 transition-transform"
                size={20}
              />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  {curriculum.curriculumCode}
                </span>
                <div className="w-1 h-1 rounded-full bg-zinc-200" />
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                  {curriculum.majorName}
                </span>
              </div>
              <h1 className="text-lg font-black text-zinc-900 tracking-tight leading-none">
                {curriculum.curriculumName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <StatusStepper safeCurrentIdx={safeCurrentIdx} />

            <button
              onClick={() =>
                router.push(
                  `/dashboard/hocfdc/curriculums/${id}/mapping/po-plo`,
                )
              }
              className="px-6 py-3 bg-zinc-100 text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2.5"
            >
              <Target size={16} /> Matrix
            </button>
            {safeCurrentIdx >=
              ALL_STATUS_ORDER.findIndex(
                (s) => s.id === CURRICULUM_STATUS.SYLLABUS_DEVELOP,
              ) && (
              <button
                onClick={() =>
                  router.push(`/dashboard/hocfdc/framework-execution/${id}`)
                }
                className="px-6 py-3 bg-zinc-100 text-zinc-900 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2.5"
              >
                <Rocket size={16} /> Sprints
              </button>
            )}

            {/* Combo Simulator Widget */}
            {combos.length > 0 && (
              <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-xl ml-2 text-indigo-900">
                <Sparkles size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900/50">
                  Combo Flow:
                </span>
                <select
                  value={selectedComboId || ""}
                  onChange={(e) => setSelectedComboId(e.target.value || null)}
                  className="bg-transparent text-[11px] font-black uppercase tracking-widest text-indigo-600 outline-none cursor-pointer max-w-[220px]"
                >
                  <option value="" className="text-zinc-500">
                    None (Slot View)
                  </option>
                  {combos.map((c: any) => (
                    <option key={c.groupId} value={c.groupId}>
                      {c.groupCode}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="h-8 w-px bg-zinc-100 mx-2" />

            {/* Transition Actions */}
            {curriculum.status === CURRICULUM_STATUS.STRUCTURE_APPROVED && (
              <button
                onClick={() =>
                  handleStatusTransition(CURRICULUM_STATUS.SYLLABUS_DEVELOP)
                }
                className="px-5 py-2.5 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-sm flex items-center gap-2"
              >
                Start Syllabus Development <Layers size={14} />
              </button>
            )}

            {curriculum.status === CURRICULUM_STATUS.SYLLABUS_DEVELOP && (
              <button
                onClick={() =>
                  handleStatusTransition(CURRICULUM_STATUS.FINAL_REVIEW)
                }
                className="px-5 py-2.5 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-sm flex items-center gap-2"
              >
                Submit Final Review <CheckCircle2 size={14} />
              </button>
            )}

            {curriculum.status === CURRICULUM_STATUS.SIGNED && (
              <button
                onClick={() =>
                  handleStatusTransition(CURRICULUM_STATUS.PUBLISHED)
                }
                className="px-5 py-2.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-sm flex items-center gap-2"
              >
                Publish Framework <Share2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
      )}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Vertical Grid Canvas */}
        <div className="flex-1 flex flex-col overflow-y-auto w-full no-scrollbar bg-zinc-50">
          {/* Embedded Toolbar for Combo Selector */}
          {isEmbedded && combos.length > 0 && (
            <div className="flex items-center justify-end px-8 pt-4 pb-2 sticky top-0 bg-zinc-50/90 backdrop-blur z-20">
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl text-indigo-900 shadow-sm">
                <Sparkles size={14} className="text-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900/50">
                  Combo Flow:
                </span>
                <select
                  value={selectedComboId || ""}
                  onChange={(e) => setSelectedComboId(e.target.value || null)}
                  className="bg-transparent text-[11px] font-black uppercase tracking-widest text-indigo-600 outline-none cursor-pointer max-w-[220px]"
                >
                  <option value="" className="text-zinc-500">
                    None (Slot View)
                  </option>
                  {combos.map((c: any) => (
                    <option key={c.groupId} value={c.groupId}>
                      {c.groupCode}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          <div className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 pb-24">
            {mappedSubjects
              .sort(
                (a: any, b: any) => Number(a.semesterNo) - Number(b.semesterNo),
              )
              .map((semester: any) => {
                const semesterCredits = (semester.subjects || []).reduce(
                  (acc: number, sub: any) => acc + (sub.credit ?? sub.credits ?? 0),
                  0,
                );

                return (
                <div key={semester.semesterNo} className="flex flex-col gap-4">
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-zinc-200 text-zinc-700 flex items-center justify-center font-black text-sm shadow-sm">
                        {semester.semesterNo}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest leading-none mb-1">
                          Semester {semester.semesterNo}
                        </h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                          Academic Block
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-zinc-900">
                        {semester.subjects?.length || 0} Subjects
                      </p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">
                        {semesterCredits} Credits
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-zinc-200 rounded-4xl p-4 flex flex-col gap-3 min-h-[420px] shadow-sm">
                    {(() => {
                      const subjects = semester.subjects || [];
                      const standalones = subjects.filter(
                        (s: any) => !s.groupId,
                      );
                      const comboSubjects = subjects.filter(
                        (s: any) =>
                          curriculumGroups.find(
                            (g: any) => g.groupId === s.groupId,
                          )?.type === "COMBO",
                      );
                      const electiveSubjects = subjects.filter(
                        (s: any) =>
                          curriculumGroups.find(
                            (g: any) => g.groupId === s.groupId,
                          )?.type === "ELECTIVE",
                      );

                      const activeComboSubjects = selectedComboId
                        ? comboSubjects.filter(
                            (s: any) => s.groupId === selectedComboId,
                          )
                        : [];

                      const electiveGroupIds = Array.from(
                        new Set(
                          electiveSubjects.map((s: any) => s.groupId as string),
                        ),
                      ).filter(Boolean) as string[];

                      return (
                        <>
                          {/* Standalones */}
                          {standalones.map((sub: any) => (
                            <div
                              key={sub.subjectId}
                              className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm transition-all duration-200 group hover:border-zinc-300 hover:shadow-md"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                  {sub.subjectCode}
                                </span>
                                {sub.status && (
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${SUBJECT_STATUS_COLORS[sub.status] || "text-zinc-400 bg-zinc-50 border-zinc-100"}`}
                                  >
                                    {sub.status.replace(/_/g, " ")}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-black text-zinc-900 leading-snug mb-3">
                                {sub.subjectName}
                              </h4>
                              <p className="mb-3 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold leading-relaxed text-zinc-900 line-clamp-2">
                                {sub.description?.trim() || "No description provided."}
                              </p>
                              <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-100">
                                <div className="flex items-center gap-1.5 text-zinc-400">
                                  <Layers size={12} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {sub.credit ?? sub.credits ?? 0} CR
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Combo Subjects */}
                          {activeComboSubjects.map((sub: any) => (
                            <div
                              key={`combo-${sub.subjectId}`}
                              className="p-5 rounded-3xl bg-white border border-zinc-200 shadow-sm transition-all relative overflow-hidden group hover:border-indigo-200 hover:shadow-md"
                            >
                              <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-200" />
                              <div className="flex justify-between items-start mb-3 pl-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                  {sub.subjectCode}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  {sub.status && (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${SUBJECT_STATUS_COLORS[sub.status] || "text-zinc-400 bg-zinc-50 border-zinc-100"}`}
                                    >
                                      {sub.status.replace(/_/g, " ")}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    Combo
                                  </span>
                                </div>
                              </div>
                              <h4 className="text-sm font-black text-indigo-950 leading-snug mb-3 pl-1">
                                {sub.subjectName}
                              </h4>
                              <p className="mb-3 ml-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold leading-relaxed text-zinc-900 line-clamp-2">
                                {sub.description?.trim() || "No description provided."}
                              </p>
                              <div className="flex items-center justify-between mt-auto pt-3 border-t border-indigo-100/50 pl-1">
                                <div className="flex items-center gap-1.5 text-indigo-400">
                                  <Layers size={12} />
                                  <span className="text-[10px] font-black uppercase tracking-widest">
                                    {sub.credit ?? sub.credits ?? 0} CR
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Elective Groups */}
                          {electiveGroupIds.map((gid) => {
                            const group = curriculumGroups.find(
                              (g: any) => g.groupId === gid,
                            );
                            if (!group) return null;
                            const groupSubs = electiveSubjects.filter(
                              (s: any) => s.groupId === gid,
                            );
                            return (
                              <div
                                key={`elective-group-${gid}`}
                                onClick={() =>
                                  setActiveElectiveGroup({
                                    group,
                                    subjects: groupSubs,
                                  })
                                }
                                className="p-5 rounded-3xl bg-white border border-emerald-200 shadow-sm transition-all cursor-pointer relative overflow-hidden group hover:bg-emerald-50/40 hover:shadow-md"
                              >
                                <div className="absolute top-0 right-4 w-12 h-2 bg-emerald-200 rounded-b-lg opacity-50" />
                                <div className="flex justify-between items-start mb-3">
                                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                    {group.groupCode}
                                  </span>
                                  <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                    <Layers size={10} /> {groupSubs.length}{" "}
                                    Modules
                                  </span>
                                </div>
                                <h4 className="text-sm font-black text-emerald-900 leading-snug mb-3">
                                  {group.groupName}
                                </h4>
                                <div className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest flex items-center gap-2">
                                  Click to Browse <ArrowRight size={12} />
                                </div>
                              </div>
                            );
                          })}

                          {(!subjects || subjects.length === 0) && (
                            <div className="flex-1 flex flex-col items-center justify-center text-zinc-300 border-2 border-dashed border-zinc-200 rounded-4xl py-12 bg-white">
                              <Box size={24} strokeWidth={1} />
                              <p className="text-[10px] font-black uppercase tracking-widest mt-2">
                                Zero Registry
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              )})}
          </div>
        </div>
        </div>

        {/* Right Sidebar: Analytics & Metadata */}
        <div className="w-[400px] border-l border-zinc-200 bg-white flex flex-col shrink-0 h-fit">
          <div className="p-8 space-y-10">
            {/* Summary Stats */}
            <section className="space-y-6 rounded-4xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
                  Framework Summary
                </h2>
                <Target size={16} className="text-emerald-300" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-white border border-emerald-100 rounded-3xl shadow-sm">
                  <p className="text-2xl font-black text-zinc-900 leading-none mb-1">
                    {totalCredits}
                  </p>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Total Credits
                  </p>
                </div>
                <div className="p-5 bg-white border border-indigo-100 rounded-3xl shadow-sm">
                  <p className="text-2xl font-black text-zinc-900 leading-none mb-1">
                    {totalSubjects}
                  </p>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Subjects
                  </p>
                </div>
                <div className="p-5 bg-white border border-zinc-200 rounded-3xl shadow-sm">
                  <p className="text-2xl font-black text-zinc-900 leading-none mb-1">
                    {semesterCount}
                  </p>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Semesters
                  </p>
                </div>
                <div className="p-5 bg-white border border-amber-100 rounded-3xl shadow-sm">
                  <p className="text-2xl font-black text-zinc-900 leading-none mb-1">
                    {curriculum.startYear}
                  </p>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Intake Year
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Elective Content Modal */}
      <AnimatePresence>
        {activeElectiveGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveElectiveGroup(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-4xl max-h-[85vh] flex flex-col border border-zinc-100"
            >
              <div className="px-8 py-6 flex items-center justify-between border-b border-zinc-100 bg-emerald-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <Layers size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                        {activeElectiveGroup.group.groupCode}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest">
                        Elective Group
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-zinc-900">
                      {activeElectiveGroup.group.groupName}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setActiveElectiveGroup(null)}
                  className="w-10 h-10 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 flex items-center justify-center transition-all shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-zinc-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeElectiveGroup.subjects.map((sub: any) => (
                    <div
                      key={sub.subjectId}
                      className="p-5 rounded-[1.5rem] bg-white border border-zinc-200 shadow-sm transition-all relative overflow-hidden group hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          {sub.subjectCode}
                        </span>
                        {sub.status && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${SUBJECT_STATUS_COLORS[sub.status] || "text-zinc-400 bg-zinc-50 border-zinc-100"}`}
                          >
                            {sub.status.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-zinc-900 leading-snug mb-3 group-hover:text-emerald-700 transition-colors">
                        {sub.subjectName}
                      </h4>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-50">
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <BookOpen size={12} />
                          <span className="text-[10px] font-black uppercase tracking-widest">
                            {sub.credit ?? sub.credits ?? 0} CR
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
