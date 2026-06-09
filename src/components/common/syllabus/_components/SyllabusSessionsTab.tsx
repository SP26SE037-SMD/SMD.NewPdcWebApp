"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  Eye,
  Check,
  X,
  RotateCcw,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
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
  const [isCommentOpen, setIsCommentOpen] = useState(false);

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
        label: "Accepted",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    }
    if (s === "REVISION_REQUESTED" || s === "REJECTED" || s === "REVISION_REQUIRED") {
      return {
        label: "Rejected",
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-100",
      };
    }
    if (s === "PENDING_REVIEW") {
      return {
        label: "Pending",
        color: "text-slate-500",
        bg: "bg-slate-100",
        border: "border-slate-200",
      };
    }
    return {
      label: (status || "Pending").replace(/_/g, " "),
      color: "text-slate-500",
      bg: "bg-slate-100",
      border: "border-slate-200",
    };
  };

  const isStatusPending = (status?: string) => {
    if (!status) return true;
    const s = status.toUpperCase();
    return s.includes("PENDING");
  };

  // Use the dynamic evaluations state (updated on action click) before falling back to initial static reviewer feedback
  const groupStatus = evaluations?.status || overallFeedback?.status;
  const badge =
    groupStatus && !isStatusPending(groupStatus)
      ? getStatusStyle(groupStatus)
      : null;

  const getIndividualStatusStyle = (status?: string) => {
    const s = status?.toUpperCase();
    if (s === "APPROVED" || s === "ACCEPTED" || s === "ACTIVE") {
      return {
        label: s === "APPROVED" ? "ACCEPTED" : s,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    }
    if (s === "REVISION_REQUESTED" || s === "REJECTED" || s === "REVISION_REQUIRED") {
      return {
        label: "REJECTED",
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-100",
      };
    }
    return {
      label: "PENDING",
      color: "text-slate-500",
      bg: "bg-slate-100",
      border: "border-slate-200",
    };
  };

  const evalStatus = evaluations?.status;
  const evalComment = evaluations?.comment;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {/* Dynamic Peer Review Box inside Sessions Monitor */}
      {evalStatus && (
        <div className="mb-4">
          {(evalStatus === "APPROVED" || evalStatus === "ACCEPTED") ? (
            <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/15 flex items-center justify-between shadow-sm max-w-xl">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-emerald-800">
                  Syllabus Sessions Status
                </span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase border border-emerald-200">
                All Accepted
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/15 max-w-xl space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  <span className="text-sm font-bold text-rose-800">
                    Syllabus Sessions Status
                  </span>
                </div>
                <button
                  onClick={() => setIsCommentOpen(!isCommentOpen)}
                  className={`px-2 py-1 rounded text-[9px] font-black uppercase border transition-all ${
                    isCommentOpen
                      ? "bg-rose-100 text-rose-700 border-rose-200"
                      : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                  }`}
                >
                  {isCommentOpen ? "Hide Feedback" : "Click to view review"}
                </button>
              </div>

              {isCommentOpen && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-white border border-rose-100 animate-in slide-in-from-top-1 duration-200">
                  <MessageSquare size={14} className="text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-rose-800 leading-relaxed">
                    {evalComment || "No comment provided"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          {overallFeedback && !evalStatus && (
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
                title="Accept Set"
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
        <div className="grid grid-cols-12 px-6 py-2 text-xs font-bold uppercase tracking-widest text-[#5a6157]/60 border-b border-[#dee1d8]/30">
          <div className="col-span-1">ID</div>
          <div className="col-span-6">Session Title</div>
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
                <div className="col-span-1 font-mono text-xs text-[#5a6157]">
                  #{String(session.sessionNumber).padStart(3, "0")}
                </div>
                <div className="col-span-6">
                  <h4
                    className="text-base font-bold leading-tight text-[#2d342b]"
                    style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                  >
                    {session.sessionTitle || `Session ${session.sessionNumber}`}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    • {session.duration || 50} MIN
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary-700 rounded text-[11px] font-black uppercase tracking-widest">
                    {session.teachingMethods || "Lecture"}
                  </span>
                </div>
                <div className="col-span-2">
                  {(() => {
                    const effectiveStatus =
                      groupStatus && !isStatusPending(groupStatus)
                        ? groupStatus
                        : session.status;
                    if (!isStatusPending(effectiveStatus)) {
                      const style = getIndividualStatusStyle(effectiveStatus);
                      return (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase ${style.color} ${style.bg} border ${style.border}`}
                          style={{ wordSpacing: "0.2em" }}
                        >
                          {style.label}
                        </span>
                      );
                    }
                    return null;
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
