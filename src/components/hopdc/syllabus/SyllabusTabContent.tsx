"use client";

import { useQuery } from "@tanstack/react-query";
import { ReviewV2Service } from "@/services/review-v2.service";
import { useRouter } from "next/navigation";
import {
  Rocket,
  BookText,
  Archive,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { SYLLABUS_STATUS } from "@/services/syllabus.service";
import { SyllabusWorkspaceView } from "@/components/common/syllabus/SyllabusWorkspaceView";
import { StatusStepper } from "./StatusStepper";

interface SyllabusTabContentProps {
  associatedTask: any;
  publishedSyllabus: any;
  currentSyllabus: any;
  currentSyllabusId?: string;
  isTaskLoading: boolean;
  isPublishedSyllabusLoading: boolean;
  isReadOnly: boolean;
  sprintId: string | null;
  setSelectedSyllabusIdForSources: (id: string) => void;
  setSelectedSyllabusNameForSources: (name: string) => void;
  setIsSourcesModalOpen: (open: boolean) => void;
  viewType?: "REVIEW" | "DETAIL";
  assigneeName?: string;
}

interface ParsedReview {
  materials: Array<{ id: string; name: string; status: "APPROVED" | "REVISION_REQUIRED"; comment: string }>;
  sessions: { status: "APPROVED" | "REVISION_REQUIRED"; comment: string };
  assessments: { status: "APPROVED" | "REVISION_REQUIRED"; comment: string };
}

function checkIfApproved(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return true;
  return normalized.includes("accept");
}

function parseReviewComment(comment: string | null | undefined): ParsedReview {
  const defaultResult: ParsedReview = {
    materials: [],
    sessions: { status: "APPROVED", comment: "No comments" },
    assessments: { status: "APPROVED", comment: "No comments" }
  };

  if (!comment) return defaultResult;

  let materialPart = "";
  let sessionPart = "";
  let assessmentPart = "";

  const matHeader = "Review for material:";
  const sessHeader = "Review for session:";
  const assessHeader = "Review for assessment:";

  const matIdx = comment.indexOf(matHeader);
  const sessIdx = comment.indexOf(sessHeader);
  const assessIdx = comment.indexOf(assessHeader);

  if (matIdx !== -1) {
    const end = sessIdx !== -1 ? sessIdx : (assessIdx !== -1 ? assessIdx : comment.length);
    materialPart = comment.substring(matIdx + matHeader.length, end).trim();
  }

  if (sessIdx !== -1) {
    const end = assessIdx !== -1 ? assessIdx : comment.length;
    sessionPart = comment.substring(sessIdx + sessHeader.length, end).trim();
  }

  if (assessIdx !== -1) {
    assessmentPart = comment.substring(assessIdx + assessHeader.length).trim();
  }

  const materialsList: ParsedReview["materials"] = [];
  if (materialPart) {
    const lines = materialPart.split("\n").map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (line.startsWith("+")) {
        const itemStr = line.substring(1).trim();
        const colonIdx = itemStr.indexOf(":");
        if (colonIdx !== -1) {
          const id = itemStr.substring(0, colonIdx).trim();
          const decision = itemStr.substring(colonIdx + 1).trim();
          materialsList.push({
            id,
            name: `Material ID: ${id}`,
            status: checkIfApproved(decision) ? "APPROVED" : "REVISION_REQUIRED",
            comment: decision
          });
        }
      } else {
        materialsList.push({
          id: "general",
          name: "General Material Review",
          status: checkIfApproved(line) ? "APPROVED" : "REVISION_REQUIRED",
          comment: line
        });
      }
    }
  }

  return {
    materials: materialsList,
    sessions: {
      status: checkIfApproved(sessionPart) ? "APPROVED" : "REVISION_REQUIRED",
      comment: sessionPart || "No comments"
    },
    assessments: {
      status: checkIfApproved(assessmentPart) ? "APPROVED" : "REVISION_REQUIRED",
      comment: assessmentPart || "No comments"
    }
  };
}

export function SyllabusTabContent({
  associatedTask,
  publishedSyllabus,
  currentSyllabus,
  currentSyllabusId,
  isTaskLoading,
  isPublishedSyllabusLoading,
  isReadOnly,
  sprintId,
  setSelectedSyllabusIdForSources,
  setSelectedSyllabusNameForSources,
  setIsSourcesModalOpen,
  viewType,
  assigneeName,
}: SyllabusTabContentProps) {
  const router = useRouter();

  const taskId = associatedTask?.taskId;
  const isReviewTask =
    associatedTask?.taskName?.toUpperCase().includes("REVIEW SYLLABUS") ||
    associatedTask?.action === "REVIEW";
  const createSyllabusTaskId = isReviewTask ? associatedTask?.rootTaskId : associatedTask?.taskId;

  // Fetch reviews using React Query
  const { data: reviewsRes } = useQuery({
    queryKey: ["review-details-v2-page", taskId],
    queryFn: () => ReviewV2Service.getReviewByTaskId(taskId || ""),
    enabled: !!taskId && isReviewTask,
  });

  if (isTaskLoading || isPublishedSyllabusLoading || !sprintId) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary" />
      </div>
    );
  }

  const reviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || []);
  const latestReview = reviews.length > 0 ? reviews[reviews.length - 1] : null;
  const rawComment = latestReview?.comment || "";

  const parsedReview = parseReviewComment(rawComment);
  const hasReviewData = reviews.length > 0 && rawComment.trim().length > 0;

  // Build evaluations object for SyllabusWorkspaceView
  const materialEvals = parsedReview.materials.reduce((acc, item) => {
    acc[item.id] = {
      status: item.status,
      comment: item.comment,
    };
    return acc;
  }, {} as Record<string, { status: string; comment: string }>);

  const evaluationsObject = (isReviewTask && hasReviewData) ? {
    materials: materialEvals,
    sessions: parsedReview.sessions,
    assessments: parsedReview.assessments,
  } : undefined;

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {associatedTask?.type === "REUSED_SUBJECT" ? (
        publishedSyllabus ? (
          <>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0">
                  <Rocket size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-cyan-700 uppercase tracking-widest leading-none mb-1">
                    Reused Subject (Published)
                  </p>
                  <p className="text-base font-black text-cyan-900">
                    {publishedSyllabus.syllabusName}
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-md bg-transparent">
                <StatusStepper currentStatus={SYLLABUS_STATUS.PUBLISHED} />
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => {
                    setSelectedSyllabusIdForSources(publishedSyllabus.syllabusId);
                    setSelectedSyllabusNameForSources(publishedSyllabus.syllabusName);
                    setIsSourcesModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-cyan-100 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-cyan-700 hover:bg-cyan-200 transition-all border border-cyan-200 shadow-sm shadow-cyan-50"
                >
                  <BookText size={14} />
                  Manage Sources
                </button>
              )}
            </div>

            <div className="pt-8 border-t border-zinc-100 mt-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
                  Published Syllabus Monitor
                </h3>
              </div>
              <div className="bg-cyan-50/10 rounded-3xl p-6 border border-cyan-100/30 shadow-inner">
                <SyllabusWorkspaceView
                  syllabusId={publishedSyllabus.syllabusId}
                  mode="MONITOR"
                  onOpenMaterial={(m: any) => {
                    const commentParam = m.evalComment ? `&comment=${encodeURIComponent(m.evalComment)}` : "";
                    const statusParam = m.evalStatus ? `&status=${encodeURIComponent(m.evalStatus)}` : "";
                    router.push(
                      `/dashboard/hopdc/materials/${m.materialId}?title=${encodeURIComponent(m.title)}&syllabusId=${publishedSyllabus.syllabusId}&taskId=${createSyllabusTaskId || ""}${commentParam}${statusParam}`,
                    );
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50/40 p-5 flex items-center gap-4 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
              <Archive size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">
                Status
              </p>
              <p className="text-sm font-bold text-zinc-600">
                No published syllabus found for this reused subject.
              </p>
            </div>
          </div>
        )
      ) : associatedTask?.syllabus?.syllabusId || associatedTask?.targetId ? (
        <>
          {viewType !== "REVIEW" && (
            <div className="rounded-2xl border border-[#dee1d8]/60 bg-[#f8faf2]/50 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-white border border-[#dee1d8]/50 text-[#0b7a47] flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#0b7a47] uppercase tracking-widest leading-none mb-1">
                    Current Assignment
                  </p>
                  <p className="text-base font-black text-zinc-800">
                    {associatedTask.syllabus?.syllabusName || currentSyllabus?.syllabusName || "Syllabus Project"}
                  </p>
                  {assigneeName && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Responsible: <span className="font-semibold text-zinc-700">{assigneeName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex-1 max-w-md bg-transparent">
                <StatusStepper
                  currentStatus={
                    currentSyllabus?.status || "DRAFT"
                  }
                />
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => {
                    if (currentSyllabus) {
                      setSelectedSyllabusIdForSources(currentSyllabus.syllabusId);
                      setSelectedSyllabusNameForSources(currentSyllabus.syllabusName);
                      setIsSourcesModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-[#0b7a47] hover:bg-[#f1f5eb] transition-all border border-[#dee1d8]/50 shadow-sm shadow-[#f8faf2]"
                >
                  <BookText size={14} />
                </button>
              )}
            </div>
          )}

          <div className={viewType === "REVIEW" ? "" : "pt-8 border-t border-zinc-100"}>
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#0b7a47] animate-pulse" />
                <h3 className="text-xs font-black tracking-[0.2em] text-[#0b7a47]">
                  {viewType === "REVIEW"
                    ? `SYLLABUS REVIEW from ${assigneeName || "Unassigned"}`
                    : "SYLLABUS TRACKING"}
                </h3>
              </div>
              <div className="bg-[#f8faf2]/50 rounded-3xl p-6 border border-[#dee1d8]/30">
                <SyllabusWorkspaceView
                  syllabusId={currentSyllabusId}
                  mode="MONITOR"
                  evaluations={evaluationsObject}
                  onOpenMaterial={(m: any) => {
                    const commentParam = m.evalComment ? `&comment=${encodeURIComponent(m.evalComment)}` : "";
                    const statusParam = m.evalStatus ? `&status=${encodeURIComponent(m.evalStatus)}` : "";
                    router.push(
                      `/dashboard/hopdc/materials/${m.materialId}?title=${encodeURIComponent(m.title)}&syllabusId=${currentSyllabusId}&taskId=${createSyllabusTaskId || ""}${commentParam}${statusParam}`,
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-5 flex items-center gap-4 shadow-sm">
          <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest leading-none mb-1">
              Assignment Status
            </p>
            <p className="text-sm font-bold text-amber-900">
              This subject has not been assigned a syllabus for the current curriculum deliverables yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
