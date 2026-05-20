"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ReviewV2Service } from "@/services/review-v2.service";
import { MaterialService } from "@/services/material.service";
import {
  X,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Layers,
  FileText,
  MessageSquare,
  Sparkles,
  Loader2,
} from "lucide-react";

interface ViewReviewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskName?: string;
  taskId: string;
  syllabusId?: string;
}

interface ParsedReview {
  materials: Array<{ id: string; name: string; status: "APPROVED" | "REVISION_REQUIRED"; comment: string }>;
  sessions: { status: "APPROVED" | "REVISION_REQUIRED"; comment: string };
  assessments: { status: "APPROVED" | "REVISION_REQUIRED"; comment: string };
}

function checkIfApproved(text: string): boolean {
  const normalized = text.toLowerCase().trim();
  if (!normalized) return true;
  return (
    normalized.includes("accept") ||
    normalized.includes("pass") ||
    normalized.includes("approved") ||
    normalized === "all are accepted." ||
    normalized === "no items evaluated." ||
    normalized === "no session review." ||
    normalized === "no assessment review."
  );
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

export function ViewReviewDetailsModal({
  isOpen,
  onClose,
  taskName,
  taskId,
  syllabusId,
}: ViewReviewDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"materials" | "sessions" | "assessments">("materials");

  // Fetch reviews using React Query
  const { data: reviewsRes, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["review-details-v2", taskId],
    queryFn: () => ReviewV2Service.getReviewByTaskId(taskId),
    enabled: !!taskId && isOpen,
  });

  // Fetch syllabus materials to map IDs to actual names
  const { data: materialsRes, isLoading: isMaterialsLoading } = useQuery({
    queryKey: ["syllabus-materials-v2", syllabusId],
    queryFn: () => MaterialService.getMaterialsBySyllabusId(syllabusId || ""),
    enabled: !!syllabusId && isOpen,
  });

  if (!isOpen) return null;

  const reviews = Array.isArray(reviewsRes) ? reviewsRes : (reviewsRes?.data || []);
  const latestReview = reviews.length > 0 ? reviews[reviews.length - 1] : null;
  const rawComment = latestReview?.comment || "";

  const parsedReview = parseReviewComment(rawComment);
  const dbMaterialsList = materialsRes?.data || [];

  // Map parsed materials to their actual names if available
  const materials = parsedReview.materials.map(mat => {
    const found = dbMaterialsList.find((m: any) => m.materialId === mat.id);
    return {
      ...mat,
      name: found ? found.title : mat.name,
    };
  });

  const hasReviewData = reviews.length > 0 && rawComment.trim().length > 0;
  const isLoading = isReviewsLoading || (!!syllabusId && isMaterialsLoading);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[10px] border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[10px] flex items-center justify-center bg-indigo-50 text-indigo-600">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                Review Details
              </h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">
                {taskName || "Syllabus Peer Review"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-[10px] border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm flex items-center justify-center"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-zinc-100 px-8 bg-zinc-50/50 shrink-0">
          {[
            { id: "materials", label: "Materials", icon: BookOpen },
            { id: "sessions", label: "Sessions", icon: Layers },
            { id: "assessments", label: "Assessments", icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-4 px-4 text-xs font-black uppercase tracking-wider border-b-2 transition-all outline-none ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Loading Review Details...
              </p>
            </div>
          ) : !hasReviewData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <div className="p-4 rounded-full bg-zinc-50 border border-zinc-100 text-zinc-400">
                <MessageSquare size={28} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-zinc-800">No Review Details Found</h4>
                <p className="text-xs font-medium text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
                  There are no submitted peer review comments or evaluation details for this task yet.
                </p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "materials" && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    Material Items Review Status
                  </h4>
                  {materials.length === 0 ? (
                    <div className="p-4 rounded-xl border border-zinc-200 border-dashed bg-zinc-50/50 text-center text-xs font-bold text-zinc-500">
                      No material comments found.
                    </div>
                  ) : (
                    materials.map((mat, idx) => (
                      <div
                        key={`${mat.id}-${idx}`}
                        className={`p-4 rounded-xl border transition-all ${
                          mat.status === "APPROVED"
                            ? "bg-emerald-50/20 border-emerald-100"
                            : "bg-rose-50/20 border-rose-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="space-y-1">
                            {mat.id !== "general" && (
                              <span className="text-[9px] font-mono text-zinc-400 block">
                                ID: {mat.id}
                              </span>
                            )}
                            <p className="text-sm font-bold text-zinc-800">
                              {mat.name}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                              mat.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                                : "bg-rose-50 text-rose-600 border-rose-200"
                            }`}
                          >
                            {mat.status === "APPROVED" ? (
                              <>
                                <CheckCircle2 size={10} />
                                Approved
                              </>
                            ) : (
                              <>
                                <AlertCircle size={10} />
                                Needs Revision
                              </>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 border border-zinc-100">
                          <MessageSquare size={12} className="text-zinc-400 shrink-0" />
                          <span className="text-xs font-medium text-zinc-600">
                            {mat.comment}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "sessions" && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    Session Program Review Status
                  </h4>
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      parsedReview.sessions.status === "APPROVED"
                        ? "bg-emerald-50/20 border-emerald-100"
                        : "bg-rose-50/20 border-rose-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-zinc-800">
                        All Syllabus Sessions Block
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                          parsedReview.sessions.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}
                      >
                        {parsedReview.sessions.status === "APPROVED" ? (
                          <>
                            <CheckCircle2 size={10} />
                            Approved
                          </>
                        ) : (
                          <>
                            <AlertCircle size={10} />
                            Needs Revision
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                      <MessageSquare size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                      <p className={`text-xs font-bold leading-relaxed ${
                        parsedReview.sessions.status === "APPROVED" ? "text-emerald-700" : "text-rose-700"
                      }`}>
                        {parsedReview.sessions.comment}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "assessments" && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                    Assessment Schema Review Status
                  </h4>
                  <div
                    className={`p-4 rounded-xl border transition-all ${
                      parsedReview.assessments.status === "APPROVED"
                        ? "bg-emerald-50/20 border-emerald-100"
                        : "bg-rose-50/20 border-rose-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-bold text-zinc-800">
                        Course Assessments Matrix
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                          parsedReview.assessments.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-rose-50 text-rose-600 border-rose-200"
                        }`}
                      >
                        {parsedReview.assessments.status === "APPROVED" ? (
                          <>
                            <CheckCircle2 size={10} />
                            Approved
                          </>
                        ) : (
                          <>
                            <AlertCircle size={10} />
                            Needs Revision
                          </>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                      <MessageSquare size={12} className="text-zinc-400 shrink-0" />
                      <span className={`text-xs font-medium ${
                        parsedReview.assessments.status === "APPROVED" ? "text-emerald-700" : "text-rose-700"
                      }`}>
                        {parsedReview.assessments.comment}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-8 py-6 border-t border-zinc-100 bg-zinc-50/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-8 rounded-[10px] bg-primary text-[11px] font-black uppercase tracking-widest text-white hover:brightness-95 shadow-xl shadow-primary/20 transition-all"
          >
            Close View
          </button>
        </div>
      </div>
    </div>
  );
}
