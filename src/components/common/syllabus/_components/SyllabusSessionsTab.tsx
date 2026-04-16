import React from "react";
import {
  CalendarDays,
  Eye,
  Check,
  X,
  RotateCcw,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { ReviewerFeedbackCard } from "./SyllabusMaterialsTab";

interface SessionItem {
  session: string;
  sessionNumber: number;
  sessionTitle: string;
  teachingMethods: string;
  duration: number;
  material?: any[];
  block?: any[];
  content?: string;
  status?: string;
}

interface SyllabusSessionsTabProps {
  sessions: SessionItem[];
  evaluations?: Record<string, any>;
  overallFeedback?: { status: string; note: string };
  onViewDetail?: (session: SessionItem) => void;
  onUpdateStatus?: (
    status: "APPROVED" | "REVISION_REQUESTED" | "PENDING_REVIEW",
  ) => void;
}

export function SyllabusSessionsTab({
  sessions,
  evaluations,
  overallFeedback,
  onViewDetail,
  onUpdateStatus,
}: SyllabusSessionsTabProps) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="space-y-6">
        {overallFeedback && <ReviewerFeedbackCard feedback={overallFeedback} />}
        <div
          className="text-center py-24 rounded-2xl animate-in fade-in duration-500"
          style={{ background: "#ffffff", border: "2px dashed #adb4a8" }}
        >
          <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-4 border border-slate-100 text-slate-300">
            <CalendarDays size={48} />
          </div>
          <h3
            className="font-bold mt-4 mb-2"
            style={{
              color: "#5a6157",
              fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            No Sessions Found
          </h3>
          <p className="text-sm" style={{ color: "#adb4a8" }}>
            No curriculum sessions have been created for this syllabus yet.
          </p>
        </div>
      </div>
    );
  }

  const sortedSessions = [...sessions].sort(
    (a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0),
  );

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
      label: status || "Pending",
      color: "text-slate-500",
      bg: "bg-slate-100",
      border: "border-slate-200",
    };
  };

  // Use the dynamic evaluations state (updated on action click) before falling back to initial static reviewer feedback
  const groupStatus = evaluations?.status || overallFeedback?.status;
  const badge =
    groupStatus && groupStatus !== "PENDING"
      ? getStatusStyle(groupStatus)
      : null;

  const getIndividualStatusStyle = (status?: string) => {
    const s = status?.toUpperCase();
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
              Group Decision (Sessions)
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

      <div className="space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[#5a6157]/60 border-b border-[#dee1d8]/30">
          <div className="col-span-1">ID</div>
          <div className="col-span-4">Session Title</div>
          <div className="col-span-2">Content Summary</div>
          <div className="col-span-2">Methods</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">View</div>
        </div>

        <div className="space-y-2">
          {sortedSessions.map((session) => {
            // Parse summary
            let summary = "";
            if (
              Array.isArray(session.material) &&
              session.material.length > 0
            ) {
              summary = session.material.map((m) => m.materialName).join(", ");
            } else if (session.content) {
              try {
                const parsed = JSON.parse(session.content);
                if (Array.isArray(parsed))
                  summary = parsed.map((p) => p.materialTitle).join(", ");
              } catch {
                summary = session.content.substring(0, 60) + "...";
              }
            }

            return (
              <div
                key={session.session}
                className={`grid grid-cols-12 items-center px-6 py-3 rounded-xl transition-all group border ${
                  badge
                    ? `${badge.bg} ${badge.border}`
                    : "bg-white border-transparent hover:shadow-md hover:border-primary/10"
                }`}
              >
                <div className="col-span-1 font-mono text-[10px] text-[#5a6157]">
                  #{String(session.sessionNumber).padStart(3, "0")}
                </div>
                <div className="col-span-4">
                  <h4
                    className="text-sm font-bold leading-tight text-[#2d342b]"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                  >
                    {session.sessionTitle || `Session ${session.sessionNumber}`}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    • {session.duration || 50} MIN
                  </span>
                </div>
                <div className="col-span-2 pr-4">
                  <p className="text-[11px] text-[#5a6157] line-clamp-1 italic">
                    {summary || "No specific content linked."}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary-700 rounded text-[9px] font-black uppercase tracking-widest">
                    {session.teachingMethods || "Lecture"}
                  </span>
                </div>
                <div className="col-span-2">
                  {(() => {
                    const effectiveStatus =
                      groupStatus && groupStatus !== "PENDING"
                        ? groupStatus
                        : session.status;
                    const style = getIndividualStatusStyle(effectiveStatus);
                    return (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${style.color} ${style.bg} border ${style.border}`}
                      >
                        {style.label}
                      </span>
                    );
                  })()}
                </div>
                <div className="col-span-1 flex items-center justify-end">
                  {onViewDetail && (
                    <button
                      onClick={() => onViewDetail(session)}
                      className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200 active:scale-90"
                    >
                      <Eye size={13} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
