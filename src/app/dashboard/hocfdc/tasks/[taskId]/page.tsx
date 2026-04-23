"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { TaskService, TaskItem, TASK_STATUS } from "@/services/task.service";
import { MajorService, Major } from "@/services/major.service";
import { PoService, PO } from "@/services/po.service";
import { CurriculumService, CurriculumFramework, CURRICULUM_STATUS } from "@/services/curriculum.service";
import { RequestService, RequestItem } from "@/services/request.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowLeft, BookOpen, Target, GraduationCap,
  CheckCircle2, Send, Building2, Calendar, AlertCircle,
  ChevronRight, Plus, Layers, Grid3X3, X, Eye,
} from "lucide-react";
import { toast } from "sonner";
import CurriculumInfoStep from "@/components/hocfdc/create-curriculum/CurriculumInfoStep";
import PloDefinitionStep from "@/components/hocfdc/create-curriculum/PloDefinitionStep";
import MappingStep from "@/components/hocfdc/create-curriculum/MappingStep";
import CourseBuilderStep from "@/components/hocfdc/create-curriculum/CourseBuilderStep";

type Tab = "major" | "po" | "curriculum" | "plo" | "mapping" | "semester" | "submit";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "major", label: "Major Detail", icon: <Building2 className="h-4 w-4" /> },
  { id: "po", label: "PO", icon: <Target className="h-4 w-4" /> },
  { id: "curriculum", label: "Create Curriculum", icon: <BookOpen className="h-4 w-4" /> },
  { id: "plo", label: "Create PLO", icon: <GraduationCap className="h-4 w-4" /> },
  { id: "mapping", label: "Mapping PLO-PO", icon: <Grid3X3 className="h-4 w-4" /> },
  { id: "semester", label: "Semester Structure", icon: <Layers className="h-4 w-4" /> },
  { id: "submit", label: "Submit", icon: <Send className="h-4 w-4" /> },
];

export default function TaskDetailPage() {
  const { taskId } = useParams() as { taskId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const initialMajorId = searchParams.get("majorId");

  const [activeTab, setActiveTab] = useState<Tab>("major");
  const [task, setTask] = useState<TaskItem | null>(null);
  const [major, setMajor] = useState<Major | null>(null);
  const [pos, setPos] = useState<PO[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumFramework | null>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [loadingMajor, setLoadingMajor] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionRequest, setRejectionRequest] = useState<RequestItem | null>(null);

  // Load task
  useEffect(() => {
    const load = async () => {
      try {
        const res = await TaskService.getTaskById(taskId);
        let rawTask = (res as any)?.data;

        console.log("[TaskDetail] Raw Response Data:", rawTask);

        // Handle case where detail API returns a paginated-like structure
        if (rawTask && rawTask.content && Array.isArray(rawTask.content) && rawTask.content.length > 0) {
          rawTask = rawTask.content[0];
          console.log("[TaskDetail] Extracted from content[0]:", rawTask);
        }

        if (rawTask) {
          let mappedTask = TaskService.mapTaskApiToItem(rawTask);

          // Use majorId from URL if present and detail API returns null
          if (!mappedTask.majorId && initialMajorId) {
            console.log("[TaskDetail] Using majorId from URL:", initialMajorId);
            mappedTask.majorId = initialMajorId;
          }

          // FALLBACK: If majorId is still missing, try to find it in the list
          if (!mappedTask.majorId && user?.accountId) {
            console.log("[TaskDetail] majorId missing in detail, attempting fallback from task list...");
            try {
              const listRes = await TaskService.getTasks({ accountId: user.accountId, size: 100 });
              const listTasks = listRes?.data?.content || [];
              const taskFromList = listTasks.find(t => t.taskId === taskId);

              if (taskFromList && taskFromList.majorId) {
                console.log("[TaskDetail] Found majorId in list fallback:", taskFromList.majorId);
                mappedTask = { ...mappedTask, majorId: taskFromList.majorId, major: taskFromList.major };
              }
            } catch (fallbackErr) {
              console.error("[TaskDetail] Fallback failed:", fallbackErr);
            }
          }

          console.log("[TaskDetail] Final Mapped Task:", mappedTask);
          setTask(mappedTask);
        }
      } catch (err) {
        console.error("[TaskDetail] Failed to load task:", err);
        toast.error("Failed to load task");
      } finally {
        setLoadingTask(false);
      }
    };
    load();
  }, [taskId]);

  // Load major when task is ready
  useEffect(() => {
    const effectiveMajorId = task?.majorId || task?.major?.majorId || initialMajorId;
    if (!effectiveMajorId) return;

    const load = async () => {
      setLoadingMajor(true);
      try {
        const res = await MajorService.getMajorById(effectiveMajorId);
        setMajor((res as any)?.data as Major);
        const posRes = await PoService.getPOsByMajorId(effectiveMajorId, { size: 100 });
        setPos((posRes as any)?.data?.content || []);

        // Load existing curriculum for this major if any
        try {
          const currRes = await CurriculumService.getCurriculumsByMajorId(effectiveMajorId);
          const currList = (currRes as any)?.data || [];
          if (currList.length > 0) setCurriculum(currList[0]);
        } catch { }
      } catch {
        toast.error("Failed to load major info");
      } finally {
        setLoadingMajor(false);
      }
    };
    load();
  }, [task?.majorId, task?.major?.majorId, taskId, initialMajorId]);

  // Load rejection feedback if any
  useEffect(() => {
    const effectiveMajorId = task?.majorId || task?.major?.majorId || initialMajorId;
    if (!effectiveMajorId) return;

    const checkRejection = async () => {
      try {
        const res = await RequestService.getRequests({
          majorId: effectiveMajorId,
          status: "REJECTED",
          size: 1,
          sortBy: "createdAt",
          direction: "desc",
        });
        const latestRejected = res?.data?.content?.[0];
        if (latestRejected) {
          setRejectionRequest(latestRejected);
        }
      } catch (err) {
        console.error("Failed to check rejection status:", err);
      }
    };
    checkRejection();
  }, [task?.majorId, task?.major?.majorId, initialMajorId]);

  // Save curriculum info
  const handleSaveCurriculum = async (data: any, proceed?: boolean) => {
    setSavingCurriculum(true);
    try {
      let saved: CurriculumFramework;
      if (curriculum?.curriculumId) {
        const res = await CurriculumService.updateCurriculum(curriculum.curriculumId, data);
        saved = (res as any)?.data as CurriculumFramework;
      } else {
        const res = await CurriculumService.createCurriculum({ ...data, majorId: task?.majorId });
        saved = (res as any)?.data as CurriculumFramework;
      }
      setCurriculum(saved);
      toast.success("Curriculum info saved successfully!");
      if (proceed) setActiveTab("plo");
    } catch (e: any) {
      toast.error(e?.message || "Failed to save curriculum");
    } finally {
      setSavingCurriculum(false);
    }
  };

  // Submit request
  const handleSubmit = async (title: string, content: string) => {
    if (!curriculum?.curriculumId) {
      toast.error("Please create a curriculum first");
      return;
    }
    if (!task?.majorId) {
      toast.error("No major associated with this task");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Update curriculum status to STRUCTURE_REVIEW
      await CurriculumService.updateCurriculumStatus(
        curriculum.curriculumId,
        CURRICULUM_STATUS.STRUCTURE_REVIEW
      );

      // 2. Create the request
      await RequestService.createRequest({
        title,
        content,
        status: "PENDING",
        createdById: user?.accountId || "",
        curriculumId: curriculum.curriculumId,
        majorId: task.majorId,
      });

      // 3. Update task status to DONE (Only for first-time submission)
      if (!rejectionRequest) {
        await TaskService.updateTaskStatus(taskId as string, TASK_STATUS.DONE);
      }

      toast.success("Request submitted successfully!");
      router.push("/dashboard/hocfdc/requests");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTask) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-sm font-medium text-on-surface-variant">Loading task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-error" />
        <p className="text-on-surface font-bold">Task not found</p>
        <button onClick={() => router.back()} className="text-primary text-sm font-medium hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline/15 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          {/* Rejection banner removed as per user request, moved to button near title */}

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-wider hover:text-primary transition mb-3 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
            Back to Tasks
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-on-surface tracking-tight">{task.taskName}</h1>
                {rejectionRequest && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRejectionModal(true)}
                    className="px-3 py-1.5 bg-error/10 text-error border border-error/20 rounded-xl flex items-center gap-2 hover:bg-error/20 transition-all group"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">View Feedback</span>
                  </motion.button>
                )}
              </div>
              <p className="text-sm text-on-surface-variant mt-0.5 max-w-2xl line-clamp-1">{task.description}</p>
            </div>
            <div className="flex items-center gap-3">
              {task.major && (
                <button
                  onClick={() => router.push(`/dashboard/hocfdc/${task.majorId || task.major?.majorId}`)}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all flex items-center gap-2 group/major shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5 group-hover/major:scale-110 transition-transform" />
                  <span>View Major: {task.major.majorCode}</span>
                </button>
              )}            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-none pb-1">
            {TABS.map((tab, idx) => {
              const isCompleted =
                (tab.id === "curriculum" && !!curriculum) ||
                (tab.id === "major" && !!major);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                      ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                      : "text-on-surface-variant hover:bg-surface-container"
                    }`}
                >
                  {tab.icon}
                  {tab.label}
                  {isCompleted && tab.id !== "major" && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* MAJOR DETAIL TAB */}
            {activeTab === "major" && (
              <MajorDetailTab
                major={major}
                loading={loadingMajor}
                majorId={task?.majorId || task?.major?.majorId || initialMajorId}
              />
            )}

            {/* PO TAB */}
            {activeTab === "po" && (
              <POTab pos={pos} loading={loadingMajor} majorId={task.majorId} />
            )}

            {/* CREATE CURRICULUM TAB */}
            {activeTab === "curriculum" && (
              <div className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
                <CurriculumInfoStep
                  initialData={curriculum ? {
                    curriculumId: curriculum.curriculumId,
                    curriculumCode: curriculum.curriculumCode,
                    curriculumName: curriculum.curriculumName,
                    startYear: curriculum.startYear,
                    majorId: curriculum.majorId || task.majorId,
                    description: curriculum.description,
                  } : { majorId: task.majorId }}
                  onSave={handleSaveCurriculum}
                  isSaving={savingCurriculum}
                  onNext={() => setActiveTab("plo")}
                />
              </div>
            )}

            {/* PLO TAB */}
            {activeTab === "plo" && curriculum?.curriculumId ? (
              <div className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
                <PloDefinitionStep
                  curriculumIdProp={curriculum.curriculumId}
                  onNext={() => setActiveTab("mapping")}
                  onBack={() => setActiveTab("curriculum")}
                />
              </div>
            ) : activeTab === "plo" ? (
              <NoCurriculumPlaceholder onGoCreate={() => setActiveTab("curriculum")} label="PLOs" />
            ) : null}

            {/* MAPPING TAB */}
            {activeTab === "mapping" && curriculum?.curriculumId ? (
              <div className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
                <MappingStep
                  curriculumIdProp={curriculum.curriculumId}
                  onNext={() => setActiveTab("semester")}
                  onBack={() => setActiveTab("plo")}
                />
              </div>
            ) : activeTab === "mapping" ? (
              <NoCurriculumPlaceholder onGoCreate={() => setActiveTab("curriculum")} label="Mapping" />
            ) : null}

            {/* SEMESTER STRUCTURE TAB */}
            {activeTab === "semester" && curriculum?.curriculumId ? (
              <div className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
                <CourseBuilderStep
                  curriculumIdProp={curriculum.curriculumId}
                  onNext={() => setActiveTab("submit")}
                  onBack={() => setActiveTab("mapping")}
                />
              </div>
            ) : activeTab === "semester" ? (
              <NoCurriculumPlaceholder onGoCreate={() => setActiveTab("curriculum")} label="Semester Structure" />
            ) : null}

            {/* SUBMIT TAB */}

            {activeTab === "submit" && (
              <SubmitTab
                curriculum={curriculum}
                major={major}
                task={task}
                submitting={submitting}
                rejectionRequest={rejectionRequest}
                onSubmit={handleSubmit}
                onGoCreate={() => setActiveTab("curriculum")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Rejection Feedback Modal - Reverted to Previous Version */}
      <AnimatePresence>
        {showRejectionModal && rejectionRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRejectionModal(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-error blur-3xl opacity-10 rounded-full -mr-16 -mt-16" />

              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-error/10 flex items-center justify-center">
                      <AlertCircle className="h-7 w-7 text-error" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-[#2d3335] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Review Feedback</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRejectionModal(false)}
                    className="w-10 h-10 rounded-full hover:bg-surface-container transition-colors flex items-center justify-center"
                  >
                    <X className="h-5 w-5 text-on-surface-variant" />
                  </button>
                </div>

                <div className="bg-[#f1f4f5] rounded-3xl p-8 mb-8 border border-outline/5 shadow-inner">
                  <div className="flex items-center gap-2 mb-4 text-[#5a6062]">
                    <span className="material-symbols-outlined text-[20px]">history_edu</span>
                    <span className="text-xs font-bold uppercase tracking-widest">VP Feedback Comment</span>
                  </div>
                  <p className="text-[#2d3335] text-lg font-medium leading-relaxed italic">
                    "{rejectionRequest.comment || "No specific feedback provided. Please review the curriculum structure carefully according to academic standards."}"
                  </p>
                </div>

                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setShowRejectionModal(false)}
                    className="w-full bg-[#2d3335] text-white py-4 rounded-2xl font-bold text-sm hover:bg-[#1d1f20] transition-all active:scale-95 shadow-xl shadow-zinc-950/20"
                  >
                    I Understand
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

// ─── Sub-components ───────────────────────────────────────────────

function MajorDetailTab({ major, loading, majorId }: { major: Major | null; loading: boolean; majorId?: string | null }) {
  if (loading) return <LoadingCard />;
  if (!major) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant">
      <Building2 className="h-12 w-12 opacity-30" />
      <p className="font-bold">No major information available</p>
      {majorId && <p className="text-xs opacity-60">Major ID: {majorId}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-surface rounded-2xl border border-outline/20 p-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black uppercase tracking-wider">
                {major.majorCode}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${major.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-surface-container text-on-surface-variant"
                }`}>
                {major.status}
              </span>
            </div>
            <h2 className="text-2xl font-black text-on-surface">{major.majorName}</h2>
            <p className="text-on-surface-variant mt-2 leading-relaxed">{major.description || "No description available."}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard label="Created At" value={major.createdAt ? new Date(major.createdAt).toLocaleDateString("vi-VN") : "—"} />
        <InfoCard label="Status" value={major.status || "—"} />
      </div>
    </div>
  );
}

function POTab({ pos, loading, majorId }: { pos: PO[]; loading: boolean; majorId?: string | null }) {
  if (loading) return <LoadingCard />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-on-surface">Program Objectives</h2>
        <span className="px-3 py-1.5 bg-surface-container rounded-xl text-xs font-bold text-on-surface-variant">
          {pos.length} POs
        </span>
      </div>
      {pos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant border-2 border-dashed border-outline/30 rounded-2xl">
          <Target className="h-12 w-12 opacity-30" />
          <p className="font-bold">No Program Objectives found</p>
          <p className="text-xs opacity-60">POs are defined at the major level</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pos.map((po, idx) => (
            <div key={po.poId} className="flex items-start gap-4 p-5 bg-surface rounded-2xl border border-outline/20 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-primary">{po.poCode || `P${idx + 1}`}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-on-surface text-sm leading-relaxed">{po.description}</p>
                <span className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${po.status === "ACTIVE" ? "bg-emerald-50 text-emerald-600" : "bg-surface-container text-on-surface-variant"
                  }`}>{po.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoCurriculumPlaceholder({ onGoCreate, label }: { onGoCreate: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant border-2 border-dashed border-outline/30 rounded-2xl">
      <BookOpen className="h-12 w-12 opacity-30" />
      <p className="font-bold">Please create a curriculum first</p>
      <p className="text-xs opacity-60">You need a curriculum before managing {label}</p>
      <button
        onClick={onGoCreate}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold mt-2 hover:bg-primary/90 transition active:scale-95"
      >
        <Plus className="h-4 w-4" /> Create Curriculum
      </button>
    </div>
  );
}

function SubmitTab({
  curriculum, major, task, submitting, rejectionRequest, onSubmit, onGoCreate,
}: {
  curriculum: CurriculumFramework | null;
  major: Major | null;
  task: TaskItem;
  submitting: boolean;
  rejectionRequest: RequestItem | null;
  onSubmit: (title: string, content: string) => void;
  onGoCreate: () => void;
}) {
  const [title, setTitle] = useState(
    rejectionRequest
      ? `Resubmit Review: ${curriculum?.curriculumCode || major?.majorName || "Curriculum"}`.substring(0, 50)
      : `Review: ${curriculum?.curriculumCode || major?.majorName || "Curriculum"}`.substring(0, 50)
  );
  const [content, setContent] = useState(
    rejectionRequest
      ? `Updated curriculum ${curriculum?.curriculumCode || ""} based on feedback and resubmitting for review.`
      : `Submitting curriculum ${curriculum?.curriculumCode || ""} for review.`
  );

  useEffect(() => {
    setTitle(
      rejectionRequest
        ? `Resubmit Review: ${curriculum?.curriculumCode || major?.majorName || "Curriculum"}`.substring(0, 50)
        : `Review: ${curriculum?.curriculumCode || major?.majorName || "Curriculum"}`.substring(0, 50)
    );
    setContent(
      rejectionRequest
        ? `Updated curriculum ${curriculum?.curriculumCode || ""} based on feedback and resubmitting for review.`
        : `Submitting curriculum ${curriculum?.curriculumCode || ""} for review.`
    );
  }, [major, curriculum, rejectionRequest]);

  if (!curriculum) {
    return <NoCurriculumPlaceholder onGoCreate={onGoCreate} label="submission" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-surface rounded-2xl border border-outline/20 p-8">
        <h2 className="text-xl font-black text-on-surface mb-2">Submit Request</h2>
        <p className="text-on-surface-variant text-sm mb-8">
          Review the information below and submit your curriculum for approval.
        </p>

        {/* Summary */}
        <div className="bg-surface-container/50 rounded-xl p-5 mb-6 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-on-surface-variant mb-3">Request Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant font-medium">Curriculum</span>
            <span className="font-bold text-on-surface">{curriculum.curriculumCode} — {curriculum.curriculumName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-on-surface-variant font-medium">Major</span>
            <span className="font-bold text-on-surface">{major?.majorName || task.majorId}</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-on-surface-variant mb-2">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-surface-container/40 border border-outline/20 rounded-xl px-4 py-3 text-sm font-medium text-on-surface outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition"
              placeholder="Request title"
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-on-surface-variant mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-surface-container/40 border border-outline/20 rounded-xl px-4 py-3 text-sm font-medium text-on-surface outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition resize-none"
              placeholder="Describe the request..."
            />
          </div>

          <button
            onClick={() => onSubmit(title, content)}
            disabled={submitting || !title.trim() || !content.trim()}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="flex items-center justify-center py-24 gap-3 text-on-surface-variant">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-medium text-sm">Loading...</p>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface rounded-2xl border border-outline/20 p-5">
      <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant mb-1">{label}</p>
      <p className="font-bold text-on-surface">{value}</p>
    </div>
  );
}
