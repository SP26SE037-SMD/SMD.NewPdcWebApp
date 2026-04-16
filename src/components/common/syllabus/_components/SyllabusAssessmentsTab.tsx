import React from "react";
import {
  ClipboardList,
  Check,
  X,
  RotateCcw,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { ReviewerFeedbackCard } from "./SyllabusMaterialsTab";
import { AssessmentItem } from "@/services/assessment.service";

interface SyllabusAssessmentsTabProps {
  assessments: AssessmentItem[];
  evaluations?: Record<string, any>;
  overallFeedback?: { status: string; note: string };
  onUpdateStatus?: (
    status: "APPROVED" | "REVISION_REQUESTED" | "PENDING_REVIEW",
  ) => void;
}

export function SyllabusAssessmentsTab({
  assessments,
  evaluations,
  overallFeedback,
  onUpdateStatus,
}: SyllabusAssessmentsTabProps) {
  if (!assessments || assessments.length === 0) {
    return (
      <div className="space-y-6">
        {overallFeedback && <ReviewerFeedbackCard feedback={overallFeedback} />}
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[#dee1d8] rounded-2xl bg-[#f8faf2]/50 animate-in fade-in duration-500">
          <ClipboardList size={28} className="text-[#adb4a8] mb-3" />
          <h3 className="text-base font-bold text-[#2d342b] mb-1">
            No assessments found
          </h3>
          <p className="text-xs text-[#5a6157] max-w-sm">
            No assessments have been created for this syllabus yet.
          </p>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "APPROVED" || s === "ACCEPTED" || s === "ACTIVE") {
      return {
        label: "Approved",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    }
    if (s === "REVISION_REQUESTED" || s === "REJECTED") {
      return {
        label: "Revision Requested",
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-100",
      };
    }
    if (s === "PENDING_REVIEW") {
      return {
        label: "Pending Review",
        color: "text-slate-500",
        bg: "bg-slate-100",
        border: "border-slate-200",
      };
    }
    return {
      label: status || "Pending Review",
      color: "text-slate-500",
      bg: "bg-slate-100",
      border: "border-slate-200",
    };
  };

  // Use the dynamic evaluations state (updated on action click) before falling back to initial static reviewer feedback
  const groupStatus = evaluations?.status || overallFeedback?.status;
  const status =
    groupStatus && groupStatus !== "PENDING"
      ? getStatusStyle(groupStatus)
      : null;

  const getIndividualStatusStyle = (indStatus?: string) => {
    const s = indStatus?.toUpperCase();
    if (s === "APPROVED" || s === "ACCEPTED" || s === "ACTIVE") {
      return {
        label: s,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    }
    if (s === "REVISION_REQUESTED" || s === "REJECTED") {
      return {
        label: s,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-100",
      };
    }
    return {
      label: s || "PENDING",
      color: "text-slate-500",
      bg: "bg-slate-100",
      border: "border-slate-200",
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          {overallFeedback && (
            <ReviewerFeedbackCard feedback={overallFeedback} />
          )}
        </div>

        {onUpdateStatus && (
          <div className="w-full md:w-72 shrink-0 p-4 rounded-2xl border border-[#dee1d8] bg-white shadow-sm flex flex-col gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#adb4a8]">
              Group Decision (Assessments)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onUpdateStatus("APPROVED")}
                className={`flex-1 h-8 rounded-lg transition-all flex items-center justify-center ${
                  groupStatus === "APPROVED" || groupStatus === "ACCEPTED"
                    ? "bg-[#4caf50] text-white shadow-lg shadow-emerald-500/20"
                    : "bg-[#f1f5eb] text-[#4caf50] hover:bg-[#c8e6c9]"
                }`}
                title="Approve Set"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => onUpdateStatus("REVISION_REQUESTED")}
                className={`flex-1 h-8 rounded-lg transition-all flex items-center justify-center ${
                  groupStatus === "REVISION_REQUESTED" ||
                  groupStatus === "REJECTED"
                    ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                    : "bg-rose-50 text-rose-500 hover:bg-rose-100"
                }`}
                title="Reject Set"
              >
                <X size={16} />
              </button>
              <button
                onClick={() => onUpdateStatus("PENDING_REVIEW")}
                className={`px-3 h-8 rounded-lg transition-all flex items-center justify-center ${
                  groupStatus === "PENDING_REVIEW"
                    ? "bg-[#5a6157] text-white"
                    : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                }`}
                title="Clear Selection"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((assessment, idx) => {
          return (
            <div
              key={assessment.assessmentId || idx}
              className={`p-4 rounded-xl border-2 transition-all ${
                status
                  ? `${status.bg} ${status.border}`
                  : "bg-white border-[#dee1d8]/50 shadow-sm hover:shadow-md"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary/70">
                    Part {assessment.part} • {assessment.weight}% Weight
                  </span>
                  <h3
                    className="text-sm font-bold text-[#2d342b] mt-0.5"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                  >
                    {assessment.categoryName} - {assessment.typeName}
                  </h3>
                </div>
                {(() => {
                  const effectiveStatus =
                    groupStatus && groupStatus !== "PENDING"
                      ? groupStatus
                      : assessment.status;
                  const style = getIndividualStatusStyle(effectiveStatus);
                  return (
                    <span
                      className={`mr-10 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${style.color} ${style.border} ${style.bg}`}
                    >
                      {style.label}
                    </span>
                  );
                })()}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">
                    Question Type
                  </p>
                  <p className="text-[10px] font-bold text-slate-600">
                    {assessment.questionType || "N/A"}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <p className="text-[8px] font-bold uppercase text-slate-400 mb-0.5">
                    Criteria
                  </p>
                  <p className="text-[10px] font-medium text-slate-600 truncate">
                    {assessment.completionCriteria || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
