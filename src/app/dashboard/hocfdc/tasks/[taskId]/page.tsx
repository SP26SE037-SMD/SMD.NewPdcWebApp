"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { TaskService, TaskItem, TASK_STATUS } from "@/services/task.service";
import { MajorService, Major } from "@/services/major.service";
import { PoService, PO } from "@/services/po.service";
import {
  CurriculumService,
  CurriculumFramework,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";
import { RequestService, RequestItem } from "@/services/request.service";
import { DocumentService } from "@/services/document.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  ArrowLeft,
  BookOpen,
  Target,
  GraduationCap,
  CheckCircle2,
  Send,
  Building2,
  Calendar,
  AlertCircle,
  ChevronRight,
  Plus,
  Layers,
  Grid3X3,
  X,
  Eye,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import CurriculumInfoStep from "@/components/hocfdc/create-curriculum/CurriculumInfoStep";
import CurriculumImportStep from "@/components/hocfdc/create-curriculum/CurriculumImportStep";
import PloDefinitionStep from "@/components/hocfdc/create-curriculum/PloDefinitionStep";
import MappingStep from "@/components/hocfdc/create-curriculum/MappingStep";
import CourseBuilderStep from "@/components/hocfdc/create-curriculum/CourseBuilderStep";
import PdfExtractionStep from "@/components/hocfdc/create-curriculum/PdfExtractionStep";

type Tab =
  | "process"
  | "major"
  | "po"
  | "curriculum"
  | "plo"
  | "mapping"
  | "semester"
  | "submit";

const ALL_TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "process",
    label: "Process Document",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    id: "major",
    label: "Major Detail",
    icon: <Building2 className="h-4 w-4" />,
  },
  { id: "po", label: "PO", icon: <Target className="h-4 w-4" /> },
  {
    id: "curriculum",
    label: "Create Curriculum",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    id: "plo",
    label: "Create PLO",
    icon: <GraduationCap className="h-4 w-4" />,
  },
  {
    id: "mapping",
    label: "Mapping PLO-PO",
    icon: <Grid3X3 className="h-4 w-4" />,
  },
  {
    id: "semester",
    label: "Semester Structure",
    icon: <Layers className="h-4 w-4" />,
  },
  {
    id: "submit",
    label: "Review & Finalize",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
];

export default function TaskDetailPage() {
  const { taskId } = useParams() as { taskId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);

  const initialTargetId = searchParams.get("targetId");
  const taskType = searchParams.get("type");

  const [activeTab, setActiveTab] = useState<Tab>("process");
  const [majorId, setMajorId] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(initialTargetId);
  const [task, setTask] = useState<TaskItem | null>(null);
  const [major, setMajor] = useState<Major | null>(null);
  const [pos, setPos] = useState<PO[]>([]);
  const [curriculum, setCurriculum] = useState<CurriculumFramework | null>(
    null,
  );
  const [loadingTask, setLoadingTask] = useState(true);
  const [loadingMajor, setLoadingMajor] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(
    null,
  );
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [savingCurriculum, setSavingCurriculum] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionRequest, setRejectionRequest] = useState<RequestItem | null>(
    null,
  );

  // Load task
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const load = async () => {
      try {
        const res = await TaskService.getTaskById(taskId, { signal: controller.signal });
        if (!isMounted) return;
        
        let rawTask = (res as any)?.data;

        console.log("[TaskDetail] Raw Response Data:", rawTask);

        // Handle case where detail API returns a paginated-like structure
        if (
          rawTask &&
          rawTask.content &&
          Array.isArray(rawTask.content) &&
          rawTask.content.length > 0
        ) {
          rawTask = rawTask.content[0];
          console.log("[TaskDetail] Extracted from content[0]:", rawTask);
        }

        if (rawTask) {
          let mappedTask = TaskService.mapTaskApiToItem(rawTask);

          // Identify documentId: targetId is the documentId for MAJOR tasks
          const effectiveDocId =
            mappedTask.targetId ||
            initialTargetId ||
            mappedTask.document?.documentId;

          if (effectiveDocId) {
            setDocumentId(effectiveDocId);

            // Check Document details to see if majorId is already assigned
            try {
              const docDetail =
                await DocumentService.getDocument(effectiveDocId, { signal: controller.signal });
              if (!isMounted) return;
              
              console.log(
                "[TaskDetail] Document Detail fetched for redirect check:",
                docDetail,
              );

              // Handle cases where docDetail might be the wrapper or the data itself
              const actualMajorId =
                docDetail?.majorId || (docDetail as any)?.data?.majorId;

              if (actualMajorId) {
                console.log(
                  "[TaskDetail] Found majorId:",
                  actualMajorId,
                );
                setMajorId(actualMajorId);
                
                // Check if curriculum already reached SYLLABUS_DEVELOP status
                try {
                  const currRes = await CurriculumService.getCurriculumsByMajorId(actualMajorId, { signal: controller.signal });
                  if (!isMounted) return;
                  
                  const currList = (currRes as any)?.data || [];
                  const finalizedCurr = currList.find((c: any) => c.status === CURRICULUM_STATUS.SYLLABUS_DEVELOP);
                  
                  if (finalizedCurr) {
                    console.log("[TaskDetail] Curriculum finalized, redirecting to detail page");
                    router.replace(`/dashboard/hocfdc/curriculums/${finalizedCurr.curriculumId}`);
                    return; // Stop further processing
                  }
                } catch (currErr) {
                  console.error("[TaskDetail] Failed to check curriculum status:", currErr);
                }

                setActiveTab("major");
              } else {
                console.log(
                  "[TaskDetail] No majorId found in document, staying on PROCESS tab.",
                );
                setActiveTab("process");
              }
            } catch (docErr) {
              console.error(
                "[TaskDetail] Failed to fetch document details:",
                docErr,
              );
              setActiveTab("process");
            }
          }

          setTask(mappedTask);
          if (isMounted) {
            setLoadingTask(false);
          }
        } else {
          // Task loaded but rawTask is empty
          if (isMounted) {
            setLoadingTask(false);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err.name === 'AbortError') return;
        
        console.error("[TaskDetail] Failed to load task:", err);
        toast.error("Failed to load task. Please check your connection.");
        if (isMounted) {
          setLoadingTask(false);
        }
      } finally {
        // Only stop loading if we haven't initiated a redirect
        // We can detect this by checking if task was set or if the logic reached the end
      }
    };
    load();
    
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [taskId]);

  const refreshMajorData = async (mId: string) => {
    setLoadingMajor(true);
    try {
      const res = await MajorService.getMajorById(mId);
      setMajor((res as any)?.data as Major);
      const posRes = await PoService.getPOsByMajorId(mId, { size: 100 });
      setPos((posRes as any)?.data?.content || []);

      // Load existing curriculum for this major if any
      try {
        const currRes = await CurriculumService.getCurriculumsByMajorId(mId);
        const currList = (currRes as any)?.data || [];
        if (currList.length > 0) {
          const fullRes = await CurriculumService.getCurriculumById(
            currList[0].curriculumId,
          );
          setCurriculum(fullRes?.data || fullRes);
        }
      } catch {}
    } catch {
      toast.error("Failed to load major info");
    } finally {
      setLoadingMajor(false);
    }
  };

  // Load major when task is ready
  useEffect(() => {
    if (majorId) {
      refreshMajorData(majorId);
    }
  }, [majorId]);

  // Load rejection feedback if any
  useEffect(() => {
    if (!majorId) return;

    const checkRejection = async () => {
      try {
        const res = await RequestService.getRequests({
          majorId: majorId,
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
  }, [majorId]);

  // Save curriculum info
  const handleSaveCurriculum = async (data: any, proceed?: boolean) => {
    setSavingCurriculum(true);
    try {
      let saved: CurriculumFramework;
      if (curriculum?.curriculumId) {
        const res = await CurriculumService.updateCurriculum(
          curriculum.curriculumId,
          data,
        );
        saved = (res as any)?.data as CurriculumFramework;
      } else {
        const res = await CurriculumService.createCurriculum({
          ...data,
          majorId: majorId || "",
        });
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

  // Finalize curriculum
  const handleFinalize = async () => {
    if (!curriculum?.curriculumId) {
      toast.error("Please create a curriculum first");
      return;
    }
    if (!majorId) {
      toast.error("No major associated with this task");
      return;
    }
    setSubmitting(true);
    try {
      // 1. Sync curriculum status and dependencies (PLO, Subjects, etc.)
      await CurriculumService.syncStatus(curriculum.curriculumId);

      toast.success("Curriculum finalized and synchronized successfully!");
      router.replace(`/dashboard/hocfdc/curriculums/${curriculum.curriculumId}`);
    } catch (e: any) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to finalize curriculum",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTask) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-sm font-medium text-on-surface-variant">
          Loading task...
        </p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="h-12 w-12 text-error" />
        <p className="text-on-surface font-bold">Task not found</p>
        <button
          onClick={() => router.back()}
          className="text-primary text-sm font-medium hover:underline"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md border-b border-outline/15 px-6 py-4">
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
                <h1 className="text-2xl font-black text-on-surface tracking-tight">
                  {task.taskName}
                </h1>
                {rejectionRequest && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowRejectionModal(true)}
                    className="px-3 py-1.5 bg-error/10 text-error border border-error/20 rounded-xl flex items-center gap-2 hover:bg-error/20 transition-all group"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      View Feedback
                    </span>
                  </motion.button>
                )}
              </div>
              <p className="text-sm text-on-surface-variant mt-0.5 max-w-2xl line-clamp-1">
                {task.description}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {majorId && (
                <button
                  onClick={() => router.push(`/dashboard/hocfdc/${majorId}`)}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-black uppercase tracking-wider hover:bg-primary hover:text-white transition-all flex items-center gap-2 group/major shadow-sm"
                >
                  <Eye className="h-3.5 w-3.5 group-hover/major:scale-110 transition-transform" />
                  <span>View Major: {major?.majorCode || "Detail"}</span>
                </button>
              )}{" "}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 overflow-x-auto scrollbar-none pb-1">
            {ALL_TABS.filter((tab) => {
              // Hide Process Document if there is a majorId
              if (tab.id === "process") return !!documentId && !majorId;
              // If there's no majorId but there is a documentId, hide everything else except Process
              if (!majorId && !!documentId) return false;
              return true;
            }).map((tab, idx) => {
              const isCompleted =
                (tab.id === "curriculum" && !!curriculum) ||
                (tab.id === "major" && !!major);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? "bg-primary text-on-primary shadow-md shadow-primary/20"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                  {isCompleted &&
                    tab.id !== "major" &&
                    tab.id !== "process" && (
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
            {/* PROCESS DOCUMENT TAB */}
            {activeTab === "process" && documentId && (
              <PdfExtractionStep
                documentId={documentId}
                onComplete={async (newMajorId) => {
                  try {
                    // 1. Update Document with new majorId
                    await fetch(`/api/document/${documentId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ majorId: newMajorId }),
                    });

                    // 2. Navigate back to tasks list and refresh
                    toast.success(
                      "Extraction completed and linked to Document!",
                    );
                    router.push("/dashboard/hocfdc/tasks");
                    router.refresh();
                  } catch (error) {
                    console.error(
                      "Failed to link Major to Task and Document:",
                      error,
                    );
                    toast.error("Failed to update Task and Document linking.");
                  }
                }}
              />
            )}

            {/* MAJOR DETAIL TAB */}
            {activeTab === "major" && (
              <MajorDetailTab
                major={major}
                loading={loadingMajor}
                majorId={majorId}
              />
            )}

            {/* PO TAB */}
            {activeTab === "po" && (
              <POTab pos={pos} loading={loadingMajor} majorId={majorId} />
            )}

            {/* CREATE CURRICULUM TAB */}
            {activeTab === "curriculum" && (
              <div className="bg-surface rounded-2xl border border-outline/20 overflow-hidden">
                {!curriculum ? (
                  <CurriculumImportStep
                    majorId={majorId || ""}
                    majorCode={major?.majorCode}
                    onImportSuccess={() => {
                      // Fetch the newly imported curriculum and refreshed POs via majorId
                      if (majorId) {
                        refreshMajorData(majorId).then(() => {
                          setActiveTab("plo"); // Auto move to next tab after import
                        });
                      } else {
                        setActiveTab("plo");
                      }
                    }}
                  />
                ) : (
                  <CurriculumInfoStep
                    initialData={{
                      curriculumId: curriculum.curriculumId,
                      curriculumCode: curriculum.curriculumCode,
                      curriculumName: curriculum.curriculumName,
                      startYear: curriculum.startYear,
                      majorId: curriculum.majorId || majorId,
                      description: curriculum.description,
                    }}
                    onSave={handleSaveCurriculum}
                    isSaving={savingCurriculum}
                    onNext={() => setActiveTab("plo")}
                  />
                )}
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
              <NoCurriculumPlaceholder
                onGoCreate={() => setActiveTab("curriculum")}
                label="PLOs"
              />
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
              <NoCurriculumPlaceholder
                onGoCreate={() => setActiveTab("curriculum")}
                label="Mapping"
              />
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
              <NoCurriculumPlaceholder
                onGoCreate={() => setActiveTab("curriculum")}
                label="Semester Structure"
              />
            ) : null}

            {/* SUBMIT TAB */}

            {activeTab === "submit" && (
              <FinalizeTab
                curriculum={curriculum}
                major={major}
                majorId={majorId}
                onGoCreate={() => setActiveTab("curriculum")}
                onFinalize={handleFinalize}
                submitting={submitting}
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
                      <h3
                        className="text-2xl font-black text-[#2d3335] tracking-tight"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                      >
                        Review Feedback
                      </h3>
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
                    <span className="material-symbols-outlined text-[20px]">
                      history_edu
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest">
                      VP Feedback Comment
                    </span>
                  </div>
                  <p className="text-[#2d3335] text-lg font-medium leading-relaxed italic">
                    "
                    {rejectionRequest.comment ||
                      "No specific feedback provided. Please review the curriculum structure carefully according to academic standards."}
                    "
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

function MajorDetailTab({
  major,
  loading,
  majorId,
}: {
  major: Major | null;
  loading: boolean;
  majorId?: string | null;
}) {
  if (loading) return <LoadingCard />;
  if (!major)
    return (
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
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                  major.status === "ACTIVE"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {major.status}
              </span>
            </div>
            <h2 className="text-2xl font-black text-on-surface">
              {major.majorName}
            </h2>
            <p className="text-on-surface-variant mt-2 leading-relaxed">
              {major.description || "No description available."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard
          label="Created At"
          value={
            major.createdAt
              ? new Date(major.createdAt).toLocaleDateString("vi-VN")
              : "—"
          }
        />
        <InfoCard label="Status" value={major.status || "—"} />
      </div>
    </div>
  );
}

function POTab({
  pos,
  loading,
  majorId,
}: {
  pos: PO[];
  loading: boolean;
  majorId?: string | null;
}) {
  if (loading) return <LoadingCard />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-on-surface">
          Program Objectives
        </h2>
        <span className="px-3 py-1.5 bg-surface-container rounded-xl text-xs font-bold text-on-surface-variant">
          {pos.length} POs
        </span>
      </div>
      {pos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant border-2 border-dashed border-outline/30 rounded-2xl">
          <Target className="h-12 w-12 opacity-30" />
          <p className="font-bold">No Program Objectives found</p>
          <p className="text-xs opacity-60">
            POs are defined at the major level
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {pos.map((po, idx) => (
            <div
              key={po.poId}
              className="flex items-start gap-4 p-5 bg-surface rounded-2xl border border-outline/20 hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-primary">
                  {po.poCode || `P${idx + 1}`}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-on-surface text-sm leading-relaxed">
                  {po.description}
                </p>
                <span
                  className={`mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    po.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {po.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NoCurriculumPlaceholder({
  onGoCreate,
  label,
}: {
  onGoCreate: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant border-2 border-dashed border-outline/30 rounded-2xl">
      <BookOpen className="h-12 w-12 opacity-30" />
      <p className="font-bold">Please create a curriculum first</p>
      <p className="text-xs opacity-60">
        You need a curriculum before managing {label}
      </p>
      <button
        onClick={onGoCreate}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold mt-2 hover:bg-primary/90 transition active:scale-95"
      >
        <Plus className="h-4 w-4" /> Create Curriculum
      </button>
    </div>
  );
}

function FinalizeTab({
  curriculum,
  major,
  majorId,
  onGoCreate,
  onFinalize,
  submitting,
}: {
  curriculum: CurriculumFramework | null;
  major: Major | null;
  majorId: string | null;
  onGoCreate: () => void;
  onFinalize: () => void;
  submitting: boolean;
}) {
  if (!curriculum) {
    return (
      <NoCurriculumPlaceholder onGoCreate={onGoCreate} label="finalization" />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-black text-on-surface tracking-tight">
          Review & Finalize
        </h2>
        <p className="text-on-surface-variant max-w-md mx-auto">
          Please review the curriculum structure one last time. Once finalized,
          it will be moved to the syllabus development phase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-2xl border border-outline/20 p-6 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Curriculum Info
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">
                Code
              </p>
              <p className="font-bold text-on-surface">
                {curriculum.curriculumCode}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">
                Name
              </p>
              <p className="font-bold text-on-surface">
                {curriculum.curriculumName}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">
                Major
              </p>
              <p className="font-bold text-on-surface">
                {major?.majorName || majorId}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase mb-1">
                Start Year
              </p>
              <p className="font-bold text-on-surface">
                {curriculum.startYear}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-outline/20 p-6 space-y-6">
          <h3 className="text-sm font-black uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
            <Layers className="h-4 w-4" /> Readiness Checklist
          </h3>
          <ul className="space-y-3">
            {[
              "Major details verified",
              "POs defined and updated",
              "PLOs defined and mapped to POs",
              "Subjects organized by semesters",
              "Credit allocation balanced",
            ].map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm font-medium text-on-surface"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-primary/5 rounded-2xl border border-primary/20 p-8 flex flex-col items-center text-center space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-black text-primary">Ready to proceed?</h3>
          <p className="text-sm text-on-surface-variant max-w-sm">
            Finalizing will mark this task as complete and prepare the
            curriculum for the next stage of development.
          </p>
        </div>

        <button
          onClick={onFinalize}
          disabled={submitting}
          className="w-full max-w-sm flex items-center justify-center gap-3 py-4 bg-primary text-on-primary rounded-2xl font-black text-base shadow-xl shadow-primary/25 hover:bg-primary/90 transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <CheckCircle2 className="h-6 w-6" />
          )}
          {submitting ? "Finalizing..." : "Finalize Curriculum"}
        </button>
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
      <p className="text-xs font-black uppercase tracking-wider text-on-surface-variant mb-1">
        {label}
      </p>
      <p className="font-bold text-on-surface">{value}</p>
    </div>
  );
}
