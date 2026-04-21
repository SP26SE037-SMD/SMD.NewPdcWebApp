"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ReviewTaskService,
  REVIEW_TASK_STATUS,
} from "@/services/review-task.service";
import { TaskService } from "@/services/task.service";
import { SyllabusService } from "@/services/syllabus.service";
import { MaterialService } from "@/services/material.service";
import { SessionService } from "@/services/session.service";
import { AssessmentService } from "@/services/assessment.service";
import { useSyllabusWorkspace } from "@/hooks/useSyllabusWorkspace";
import { SyllabusWorkspaceView } from "@/components/common/syllabus/SyllabusWorkspaceView";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { ReviewProvider } from "./ReviewContext";

export default function HoPDCReviewSynthesisPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Final Decision State
  const [isAccepted, setIsAccepted] = useState<boolean | null>(null);
  const [finalComment, setFinalComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Granular Component Evaluations (Local State for reconciliation)
  const [hopdcEvaluations, setHopdcEvaluations] = useState<{
    materials: Record<string, { status: string; note: string }>;
    sessions: Record<string, { status: string; note: string }>;
    assessments: { status: string; note: string };
  }>({
    materials: {},
    sessions: {},
    assessments: { status: "PENDING", note: "" },
  });

  const { data: routeTaskData, isLoading } = useQuery({
    queryKey: ["review-task", reviewId],
    queryFn: () => ReviewTaskService.getReviewTaskById(reviewId),
    enabled: !!reviewId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const taskDetails = routeTaskData?.data;

  const { data: parentTaskRes, isLoading: isParentTaskLoading } = useQuery({
    queryKey: ["task-detail", taskDetails?.task?.taskId],
    queryFn: () => TaskService.getTaskById(taskDetails?.task?.taskId!),
    enabled: !!taskDetails?.task?.taskId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const task = taskDetails;
  const parentTask = parentTaskRes?.data;
  
  // Extract real task data from the response wrapper
  const actualParentTask = (parentTask as any)?.data || parentTask;

  const actualSyllabusId =
    actualParentTask?.syllabus?.syllabusId ||
    actualParentTask?.syllabusId ||
    (task as any)?.syllabusId ||
    (task?.task as any)?.syllabusId;

  useEffect(() => {
    if (task) {
      if (task.isAccepted !== undefined) setIsAccepted(task.isAccepted);
      if (task.comment) setFinalComment(task.comment);
      else if (task.content) setFinalComment(task.content);

      // Map reviewer comments to initial HoPDC state
      setHopdcEvaluations({
        materials: {},
        sessions: {},
        assessments: {
          status: "PENDING",
          note: task.commentAssessment || "",
        },
      });
    }
  }, [task]);

  const handleUpdateComponentStatus = async (
    type: "material" | "sessions" | "assessments",
    id: string,
    status: "APPROVED" | "REVISION_REQUESTED" | "PENDING_REVIEW",
  ) => {
    console.log(
      `[SYNTHESIS DEBUG] Type: ${type}, ID: ${id || actualSyllabusId}, Status: ${status}`,
    );

    try {
      // Immediate Persistence Logic
      if (type === "material") {
        if (!id || id.startsWith("mat-mock")) {
          console.warn(
            "[SYNTHESIS DEBUG] Skipping API call for mock/empty material ID",
          );
        } else {
          await MaterialService.updateMaterialStatus(id, status);
        }
      } else if (type === "sessions") {
        if (!id || id.startsWith("ebc49")) {
          console.warn(
            "[SYNTHESIS DEBUG] Skipping API call for mock/empty session ID",
          );
        } else {
          await SessionService.updateSessionStatus(id, status);
        }
      } else if (type === "assessments" && actualSyllabusId) {
        if (actualSyllabusId.startsWith("ebc49")) {
          console.warn(
            "[SYNTHESIS DEBUG] Skipping API call for mock syllabus ID (assessments)",
          );
        } else {
          await AssessmentService.updateSyllabusAssessmentsStatus(
            actualSyllabusId,
            status as any,
          );
        }
      }

      // Sync local state
      setHopdcEvaluations((prev) => {
        const stateKey = type === "material" ? "materials" : type;
        
        if (stateKey === "materials" || stateKey === "sessions") {
          const currentCategory = prev[stateKey];
          return {
            ...prev,
            [stateKey]: {
              ...currentCategory,
              [id]: { status, note: (currentCategory as any)[id]?.note || "" },
            },
          };
        }
        
        return {
          ...prev,
          [type as "assessments"]: { 
            status, 
            note: prev.assessments?.note || "" 
          },
        };
      });

      if (actualSyllabusId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["syllabus-workspace-materials", actualSyllabusId] }),
          queryClient.invalidateQueries({ queryKey: ["syllabus-workspace-sessions", actualSyllabusId] }),
          queryClient.invalidateQueries({ queryKey: ["syllabus-workspace-assessments", actualSyllabusId] }),
        ]);

        // IMPORTANT: Clear local override after persistence so server data becomes source of truth again.
        // This allows cascading updates (e.g. material update affecting sessions) to reflect in UI.
        setHopdcEvaluations((prev) => {
          const stateKey = type === "material" ? "materials" : type;
          if (stateKey === "materials" || stateKey === "sessions") {
            const nextCategory = { ...prev[stateKey] };
            delete (nextCategory as any)[id];
            return { ...prev, [stateKey]: nextCategory };
          }
          return prev;
        });
      }
    } catch (error: any) {
      console.error(
        `[SYNTHESIS ERROR] Failed to update ${type} status:`,
        error,
      );
      showToast(`Error: ${error.message || "Immediate sync failed."}`, "error", 10000);
    }
  };

  const { materials, sessions, assessments } = useSyllabusWorkspace(actualSyllabusId);

  const getPredictedStatus = () => {
    if (isAccepted === null || !task) return null;
    const currentStatus = task.status;
    if (currentStatus === REVIEW_TASK_STATUS.APPROVED) {
      return isAccepted
        ? REVIEW_TASK_STATUS.APPROVED
        : REVIEW_TASK_STATUS.REVISION_REQUESTED;
    }
    if (currentStatus === REVIEW_TASK_STATUS.REVISION_REQUESTED) {
      return isAccepted
        ? REVIEW_TASK_STATUS.REVISION_REQUESTED
        : REVIEW_TASK_STATUS.APPROVED;
    }
    return currentStatus;
  };

  const isReadOnly = task?.isAccepted !== null && task?.isAccepted !== undefined;

  const handleSaveSynthesis = async () => {
    if (isAccepted === null) {
      showToast("Please select Approve or Reject before submitting.", "error", 10000);
      return;
    }

    const predicted = getPredictedStatus();

    // 1. Resolve final statuses for all components
    // Sessions (Individual Statuses)
    const finalSessionStatuses = (sessions || []).map((s: any) => {
      const evalStatus = hopdcEvaluations.sessions[s.session]?.status;
      return evalStatus || s.status;
    });

    // Assessments (Group Status)
    const finalAssessmentsStatus =
      hopdcEvaluations.assessments.status !== "PENDING"
        ? hopdcEvaluations.assessments.status
        : (assessments[0]?.status || "PENDING_REVIEW");

    // Materials (Individual Statuses)
    const finalMaterialStatuses = (materials || []).map((m: any) => {
      const evalStatus = hopdcEvaluations.materials[m.materialId]?.status;
      return evalStatus || m.status;
    });

    // 2. GLOBAL VALIDATION: No PENDING_REVIEW allowed
    const hasPendingSession = finalSessionStatuses.some((s: string) => s === "PENDING_REVIEW" || s === "PENDING");
    const hasPendingAssessment = finalAssessmentsStatus === "PENDING_REVIEW" || finalAssessmentsStatus === "PENDING";
    const hasPendingMaterial = finalMaterialStatuses.some((s: string) => s === "PENDING_REVIEW" || s === "PENDING");

    if (hasPendingSession || hasPendingAssessment || hasPendingMaterial) {
      showToast(
        "Every item must be explicitly reviewed. Please set all Sessions, Assessments, and Materials to either APPROVED or REVISION REQUESTED.",
        "error",
        10000,
      );
      return;
    }

    // 3. SPECIFIC VALIDATION: If chosing APPROVED, all items must be APPROVED
    if (predicted === REVIEW_TASK_STATUS.APPROVED) {
      const allSessionsApproved = finalSessionStatuses.every((s: string) => s === "APPROVED" || s === "ACCEPTED" || s === "ACTIVE");
      const allAssessmentsApproved = finalAssessmentsStatus === "APPROVED" || finalAssessmentsStatus === "ACCEPTED" || finalAssessmentsStatus === "ACTIVE";
      const allMaterialsApproved = finalMaterialStatuses.every((s: string) => s === "APPROVED" || s === "ACCEPTED" || s === "ACTIVE");

      if (!allSessionsApproved || !allAssessmentsApproved || !allMaterialsApproved) {
        showToast(
          "Cannot approve review task while some items are still set to REVISION REQUESTED.",
          "error",
          10000,
        );
        return;
      }
    }

    // 4. COMMENT VALIDATION: Mandatory only when OVERRIDING (isAccepted === false)
    if (isAccepted === false && !finalComment.trim()) {
      showToast("Please provide a synthesis comment explaining your decision to override the review.", "error", 10000);
      return;
    }

    setIsSubmitting(true);
    try {
      await ReviewTaskService.updateReviewTaskAcceptance(reviewId, isAccepted, finalComment);

      showToast("Synthesis submitted successfully.", "success");

      // Refresh all relevant data across the dashboard
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["review-task"] }); 
      if (task?.task?.taskId) {
        queryClient.invalidateQueries({ queryKey: ["review-tasks-by-task", task.task.taskId] });
      }
      if (actualParentTask?.sprintId) {
        queryClient.invalidateQueries({ queryKey: ["sprint", actualParentTask.sprintId] });
      }
      queryClient.invalidateQueries({ queryKey: ["sprints"] }); 
      queryClient.invalidateQueries({
        queryKey: ["syllabus", actualSyllabusId],
      });
      
      router.refresh();
 
      // Redirect back to specific assignments page
      // Prioritize localStorage context as it's more robust than async fetch data
      let finalSprintId = actualParentTask?.sprintId;
      let finalCurriculumId = actualParentTask?.curriculumId;

      if (typeof window !== "undefined") {
        const storedSprintId = localStorage.getItem("hopdc_last_sprint_id");
        const storedCurriculumId = localStorage.getItem("hopdc_last_curriculum_id");
        if (storedSprintId) finalSprintId = storedSprintId;
        if (storedCurriculumId) finalCurriculumId = storedCurriculumId;
      }

      if (finalSprintId && finalCurriculumId) {
        router.push(
          `/dashboard/hopdc/assignments?sprintId=${finalSprintId}&curriculumId=${finalCurriculumId}`,
        );
      } else {
        router.push("/dashboard/hopdc/sprint-management");
      }
    } catch (error: any) {
      console.error("[SYNTHESIS ERROR] Submission failed:", error);
      showToast(error.message || "Failed to submit final decision.", "error", 10000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || isParentTaskLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-[#5a6157] font-bold uppercase tracking-widest text-[10px]">
          Processing Reconciliation Workspace...
        </p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-4xl mx-auto p-20 text-center">
        <AlertCircle size={48} className="mx-auto text-rose-300 mb-4" />
        <h2 className="text-xl font-black text-[#2d342b]">
          Review Task Missing
        </h2>
        <button
          onClick={() => router.back()}
          className="mt-6 text-primary-600 font-bold uppercase tracking-widest text-[10px] hover:underline flex items-center gap-2 justify-center"
        >
          <ArrowLeft size={14} /> Return to Dashboard
        </button>
      </div>
    );
  }

  // Derived Reviewer Comments for the Workspace View
  const reviewerComments = {
    materials: {
      status: task.commentMaterial ? "REVISION_REQUESTED" : "ACCEPTED",
      note: task.commentMaterial || "",
    },
    sessions: {
      status: task.commentSession ? "REVISION_REQUESTED" : "ACCEPTED",
      note: task.commentSession || "",
    },
    assessments: {
      status: task.commentAssessment ? "REVISION_REQUESTED" : "ACCEPTED",
      note: task.commentAssessment || "",
    },
  };

  return (
    <ReviewProvider reviewId={reviewId}>
      <div className="max-w-[1600px] mx-auto p-6 space-y-6 animate-in fade-in duration-700 text-left">
        {/* Header (Top Info) */}
        <div className="flex items-center justify-between gap-6 pb-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="h-10 w-10 bg-white rounded-2xl border border-[#dee1d8] flex items-center justify-center text-[#adb4a8] hover:text-[#5a6157] hover:shadow-sm transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-600">
                  Revalidate Review Task
                </span>
                <span className="h-1 w-1 rounded-full bg-[#dee1d8]" />
                <span className="text-[10px] font-bold text-[#adb4a8] uppercase tracking-widest">
                  HoPDC
                </span>
              </div>
              <h1
                className="text-2xl font-black text-[#2d342b] tracking-tight mt-1"
                style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
              >
                {task.titleTask || "Syllabus Audit"}
              </h1>
            </div>
            <div
              className={`px-5 py-2.5 rounded-2xl border-2 flex items-center gap-3 transition-all ${
                task.status === REVIEW_TASK_STATUS.APPROVED
                  ? "bg-[var(--primary)] text-white border-[var(--primary)] shadow-[0_0_15px_rgba(76,175,80,0.6)]"
                  : "bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]"
              }`}
            >
              <ShieldCheck size={20} />
              <span className="text-[12px] font-black uppercase tracking-widest">
                {task.status}
              </span>
            </div>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          {/* Left: Content Review (8 columns) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-[#dee1d8] shadow-sm overflow-hidden flex flex-col min-h-[750px] max-h-[750px]">
              <div className="flex-1 overflow-hidden p-8">
                {actualSyllabusId ? (
                  <SyllabusWorkspaceView
                    syllabusId={actualSyllabusId}
                    mode="SYNTHESIS"
                    evaluations={hopdcEvaluations}
                    overallFeedback={reviewerComments}
                    onUpdateStatus={isReadOnly ? undefined : handleUpdateComponentStatus}
                    onOpenMaterial={(m) => {
                      router.push(
                        `/dashboard/hopdc/reviews/${reviewId}/materials/${m.materialId}?title=${encodeURIComponent(m.title)}`,
                      );
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <AlertCircle size={40} className="text-amber-400 mb-4" />
                    <p className="text-sm font-bold text-[#5a6157] uppercase tracking-widest">
                      Authority Verification Required
                    </p>
                    <p className="text-xs text-[#adb4a8] mt-1">
                      This task is not linked to a valid syllabus object.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Synthesis Decision & Comment Panel (4 columns) */}
          <div className="col-span-12 lg:col-span-4">
            <div className="bg-white rounded-[2.5rem] border border-[#dee1d8] shadow-xl p-8 flex flex-col min-h-[750px] max-h-[750px] sticky top-6">
              <div className="mb-8">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary-600 block mb-2">
                  Synthesis Decision
                </span>
                <h2 className="text-xl font-bold text-[#2d342b] tracking-tight">
                  Final Conclusion
                </h2>
              </div>

              <div className="space-y-8 flex-1 flex flex-col">
                {/* Large Toggle Controls */}
                <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#f1f5eb] rounded-2xl border border-[#dee1d8]/50">
                  <button
                    onClick={() => !isReadOnly && setIsAccepted(true)}
                    disabled={isReadOnly}
                    className={`py-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group ${
                      isAccepted === true
                        ? "bg-white text-[var(--primary)] shadow-md ring-1 ring-black/5"
                        : isReadOnly 
                          ? "opacity-50 cursor-not-allowed text-[#adb4a8]"
                          : "text-[#adb4a8] hover:text-[#5a6157] hover:bg-white/50"
                    }`}
                  >
                    <CheckCircle2
                      size={28}
                      className={
                        isAccepted === true
                          ? "text-[var(--primary)]"
                          : "text-[#adb4a8] group-hover:text-[#5a6157]"
                      }
                    />
                    <div className="text-center px-2">
                      <span className="text-[11px] font-black uppercase tracking-widest block">
                        Accept Review
                      </span>
                      <span className="text-[8px] font-bold opacity-70 uppercase tracking-tighter">
                        Result: {task.status === "APPROVED" ? "APPROVED" : "REVISION REQUESTED"}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => !isReadOnly && setIsAccepted(false)}
                    disabled={isReadOnly}
                    className={`py-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group ${
                      isAccepted === false
                        ? "bg-white text-rose-500 shadow-md ring-1 ring-black/5"
                        : isReadOnly
                          ? "opacity-50 cursor-not-allowed text-[#adb4a8]"
                          : "text-[#adb4a8] hover:text-[#5a6157] hover:bg-white/50"
                    }`}
                  >
                    <XCircle
                      size={28}
                      className={
                        isAccepted === false
                          ? "text-rose-500"
                          : "text-[#adb4a8] group-hover:text-[#5a6157]"
                      }
                    />
                    <div className="text-center px-2">
                      <span className="text-[11px] font-black uppercase tracking-widest block">
                        Override Review
                      </span>
                      <span className="text-[8px] font-bold opacity-70 uppercase tracking-tighter">
                        Result: {task.status === "APPROVED" ? "REVISION REQUESTED" : "APPROVED"}
                      </span>
                    </div>
                  </button>
                </div>


                <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MessageSquare size={12} className="text-[var(--primary)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a6157]">
                        Final Synthesis Comment
                      </span>
                    </div>
                    {!isReadOnly && isAccepted === false && (
                      <span className="text-[9px] font-black text-rose-500/80 uppercase tracking-widest bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100/50 shadow-sm">
                        Required
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <textarea
                      value={finalComment}
                      onChange={(e) => setFinalComment(e.target.value)}
                      readOnly={isReadOnly}
                      placeholder={isReadOnly ? "" : "Summarize the final decision and provide guidance for the curriculum creator..."}
                      className={`w-full h-full min-h-[180px] p-6 rounded-[2rem] bg-[#f8faf7] border border-[#dee1d8] focus:ring-4 focus:ring-[var(--primary)]/10 focus:border-[var(--primary)] transition-all resize-none text-sm text-[#454d43] leading-relaxed placeholder:text-[#adb4a8] custom-scrollbar ${
                        isReadOnly ? "cursor-not-allowed opacity-80 bg-[#f1f5eb]/30" : "shadow-inner"
                      }`}
                    />
                  </div>
                </div>

                {isReadOnly && (
                  <div className="mt-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                    <ShieldCheck size={20} className="text-emerald-500" />
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      This task has been synthesized
                    </span>
                  </div>
                )}

                {/* Submit Action */}
                {!isReadOnly && (
                  <button
                    onClick={handleSaveSynthesis}
                    disabled={isSubmitting || isAccepted === null}
                    className={`mt-6 w-full py-5 rounded-2xl flex items-center justify-center gap-3 transition-all font-black uppercase text-[12px] tracking-[0.15em] shadow-lg ${
                      isAccepted === null
                        ? "bg-[#dee1d8] text-[#adb4a8] cursor-not-allowed shadow-none"
                        : "bg-[var(--primary)] text-white hover:bg-primary-700 hover:-translate-y-0.5 active:translate-y-0"
                    } ${isSubmitting ? "opacity-70" : ""}`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Final Decision
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReviewProvider>
  );
}
