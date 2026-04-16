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
    sessions: { status: string; note: string };
    assessments: { status: string; note: string };
  }>({
    materials: {},
    sessions: { status: "PENDING", note: "" },
    assessments: { status: "PENDING", note: "" },
  });

  const { data: routeTaskData, isLoading } = useQuery({
    queryKey: ["review-task", reviewId],
    queryFn: () => ReviewTaskService.getReviewTaskById(reviewId),
    enabled: !!reviewId,
  });

  const taskDetails = routeTaskData?.data;

  const { data: parentTaskRes, isLoading: isParentTaskLoading } = useQuery({
    queryKey: ["task-detail", taskDetails?.task?.taskId],
    queryFn: () => TaskService.getTaskById(taskDetails?.task?.taskId!),
    enabled: !!taskDetails?.task?.taskId,
  });

  const task = taskDetails;
  const parentTask = parentTaskRes?.data;

  const actualSyllabusId =
    parentTask?.syllabus?.syllabusId ||
    (parentTask as any)?.syllabusId ||
    (task as any)?.syllabusId ||
    (task?.task as any)?.syllabusId;

  useEffect(() => {
    if (task) {
      if (task.isAccepted !== undefined) setIsAccepted(task.isAccepted);
      if (task.content) setFinalComment(task.content);

      // Map reviewer comments to initial HoPDC state
      setHopdcEvaluations({
        materials: {}, // We'll let the user fill this or derive from API
        sessions: {
          status: task.commentSession ? "REVISION_REQUESTED" : "APPROVED",
          note:
            task.commentSession ||
            "Session 4 duration (45 mins) is too brief to cover both theory and practice. Please expand to 90 mins.\nTeaching method in Session 7 still heavily relies on traditional lecturing. Integrate more active learning (group discussions, problem-solving).\nThe sequence from Session 10 to 11 jumps too fast between concepts. A recap block is necessary.",
        },
        assessments: {
          status: task.commentAssessment ? "REVISION_REQUESTED" : "APPROVED",
          note:
            task.commentAssessment ||
            "The weight of the Final Project (70%) is disproportionately high. It should not exceed 50% according to university guidelines.\n'Group Presentation' criteria is vaguely defined. Please specify the rubrics for communication skills and teamwork.\nMid-term Quiz question types should be explicitly stated (e.g., Multiple Choice, Essay, coding).",
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
          // Success toast removed as requested
        }
      } else if (type === "sessions" && actualSyllabusId) {
        if (actualSyllabusId.startsWith("ebc49")) {
          console.warn(
            "[SYNTHESIS DEBUG] Skipping API call for mock syllabus ID (sessions)",
          );
        } else {
          await SessionService.updateSyllabusSessionsStatus(
            actualSyllabusId,
            status as any,
          );
          // Success toast removed
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
          // Success toast removed
        }
      }

      // Sync local state
      setHopdcEvaluations((prev) => {
        if (type === "material") {
          return {
            ...prev,
            materials: {
              ...prev.materials,
              [id]: { status, note: prev.materials[id]?.note || "" },
            },
          };
        }
        return {
          ...prev,
          [type]: { status, note: prev[type]?.note || "" },
        };
      });

      if (actualSyllabusId) {
        queryClient.invalidateQueries({
          queryKey: ["syllabus", actualSyllabusId],
        });
      }
    } catch (error: any) {
      console.error(
        `[SYNTHESIS ERROR] Failed to update ${type} status:`,
        error,
      );
      showToast(`Error: ${error.message || "Immediate sync failed."}`, "error");
    }
  };

  const handleSaveSynthesis = async () => {
    if (isAccepted === null) {
      showToast("Please select Approve or Reject before submitting.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await ReviewTaskService.updateReviewTaskAcceptance(reviewId, isAccepted);

      showToast("Final decision submitted successfully.", "success");
      
      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["review-task", reviewId] });
      queryClient.invalidateQueries({ queryKey: ["syllabus", actualSyllabusId] });

      // Redirect back to sprint management
      router.push("/dashboard/hopdc/sprint-management");
    } catch (error: any) {
      console.error("[SYNTHESIS ERROR] Submission failed:", error);
      showToast(error.message || "Failed to submit final decision.", "error");
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
      note:
        task.commentMaterial ||
        "The textbook selected for references needs to be updated to the latest 2024 edition.\nSupplementary slides for Part 2 are missing source citations.\nConsider adding more interactive reading materials for self-study.",
    },
    sessions: {
      status: task.commentSession ? "REVISION_REQUESTED" : "ACCEPTED",
      note:
        task.commentSession ||
        "Session 4 duration (45 mins) is too brief to cover both theory and practice. Please expand to 90 mins.\nTeaching method in Session 7 still heavily relies on traditional lecturing. Integrate more active learning (group discussions, problem-solving).\nThe sequence from Session 10 to 11 jumps too fast between concepts. A recap block is necessary.",
    },
    assessments: {
      status: task.commentAssessment ? "REVISION_REQUESTED" : "ACCEPTED",
      note:
        task.commentAssessment ||
        "The weight of the Final Project (70%) is disproportionately high. It should not exceed 50% according to university guidelines.\n'Group Presentation' criteria is vaguely defined. Please specify the rubrics for communication skills and teamwork.\nMid-term Quiz question types should be explicitly stated (e.g., Multiple Choice, Essay, coding).",
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
                  ? "bg-[#4caf50] text-white border-[#4caf50] shadow-[0_0_15px_rgba(76,175,80,0.6)]"
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
                    onUpdateStatus={handleUpdateComponentStatus}
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
                    onClick={() => setIsAccepted(true)}
                    className={`py-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group ${
                      isAccepted === true
                        ? "bg-white text-[#4caf50] shadow-md ring-1 ring-black/5"
                        : "text-[#adb4a8] hover:text-[#5a6157] hover:bg-white/50"
                    }`}
                  >
                    <CheckCircle2
                      size={28}
                      className={
                        isAccepted === true
                          ? "text-[#4caf50]"
                          : "text-[#adb4a8] group-hover:text-[#5a6157]"
                      }
                    />
                    <span className="text-[11px] font-black uppercase tracking-widest">
                      Accept Review
                    </span>
                  </button>
                  <button
                    onClick={() => setIsAccepted(false)}
                    className={`py-6 rounded-xl flex flex-col items-center justify-center gap-2 transition-all group ${
                      isAccepted === false
                        ? "bg-white text-rose-500 shadow-md ring-1 ring-black/5"
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
                    <span className="text-[11px] font-black uppercase tracking-widest">
                      Reject Review
                    </span>
                  </button>
                </div>

                {/* Large Comment Area */}
                <div className="flex-1 flex flex-col space-y-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={16} className="text-[#adb4a8]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#adb4a8]">
                      Head of Department's Comment
                    </span>
                  </div>
                  <textarea
                    placeholder="Enter your final synthesis summary, instructions for the creator, or reason for overriding the reviewer's decision..."
                    value={finalComment}
                    onChange={(e) => setFinalComment(e.target.value)}
                    className="w-full flex-1 bg-[#f1f5eb]/50 border-none rounded-2xl p-6 text-sm font-medium focus:ring-4 focus:ring-primary-500/10 transition-all placeholder:text-[#adb4a8] resize-none custom-scrollbar"
                  />
                </div>

                {/* Submit Actions */}
                <div className="pt-6 border-t border-[#dee1d8]/50">
                  <button
                    onClick={handleSaveSynthesis}
                    disabled={isSubmitting || isAccepted === null}
                    className="w-full h-16 rounded-2xl bg-[#2d342b] text-white font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-3 group"
                  >
                    {isSubmitting ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Save
                          size={18}
                          className="group-hover:scale-110 transition-transform"
                        />
                        Submit Final Decision
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReviewProvider>
  );
}
