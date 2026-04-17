"use client";

import React, { use, useState } from "react";
import {
  BookOpen,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Eye,
  Loader2,
  Info,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AssessmentService } from "@/services/assessment.service";
import { TaskService } from "@/services/task.service";
import { SyllabusService } from "@/services/syllabus.service";
import { CloPloService } from "@/services/cloplo.service";
import { MappingService } from "@/services/mapping.service";
import { useReview } from "../ReviewContext";
import { AssessmentEvaluateModal } from "../_components/AssessmentEvaluateModal";
import { SyllabusInfoModal } from "@/components/dashboard/SyllabusInfoModal";
import { ReviewTaskService } from "@/services/review-task.service";

export default function PDCMReviewAssessmentsPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = use(params);
  const { assessmentEvaluations } = useReview();
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const { data: reviewTaskRes, isLoading: isReviewTaskLoading } = useQuery({
    queryKey: ["pdcm-review-detail", reviewId],
    queryFn: () => ReviewTaskService.getReviewTaskById(reviewId),
    enabled: !!reviewId,
    staleTime: 5 * 60 * 1000,
  });

  const taskId = reviewTaskRes?.data?.task?.taskId || (reviewTaskRes?.data as any)?.taskId;

  const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
    queryKey: ["pdcm-task-detail", taskId],
    queryFn: () => TaskService.getTaskById(taskId!),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  });

  const syllabusId = routeTaskData?.data?.syllabus?.syllabusId || routeTaskData?.data?.syllabusId;

  const { data: syllabusData } = useQuery({
    queryKey: ["syllabus", syllabusId],
    queryFn: () => SyllabusService.getSyllabusById(syllabusId!),
    enabled: !!syllabusId,
  });

  const {
    data: assessmentDataRes,
    isLoading: isAssessmentLoading,
    refetch: refetchAssessments,
  } = useQuery({
    queryKey: ["assessments", syllabusId],
    queryFn: () =>
      syllabusId
        ? AssessmentService.getAssessmentsBySyllabusId(syllabusId)
        : null,
    enabled: !!syllabusId,
    staleTime: 5 * 60 * 1000,
  });

  const assessments: any[] = Array.isArray((assessmentDataRes as any)?.data)
    ? (assessmentDataRes as any).data
    : [];
  const totalWeight = assessments.reduce(
    (sum: number, a: any) => sum + (+a.weight || 0),
    0,
  );
  const isWeightValid = totalWeight === 100;

  const evaluatedCount = assessments.filter((a) => {
    const ev = assessmentEvaluations[a.assessmentId];
    return ev && ev.status !== "PENDING";
  }).length;

  const getEvalBadge = (assessmentId: string) => {
    const ev = assessmentEvaluations[assessmentId];
    if (!ev || ev.status === "PENDING") return null;
    if (ev.status === "ACCEPTED")
      return {
        label: "Accepted",
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      };
    return {
      label: "Rejected",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-100",
    };
  };

  if (
    isReviewTaskLoading ||
    isTaskLoading ||
    (!!syllabusId && isAssessmentLoading)
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2
          size={32}
          className="animate-spin mb-4"
          style={{ color: "#41683f" }}
        />
        <p className="font-medium" style={{ color: "#5a6157" }}>
          Loading assessments...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-2">
        <h1
          className="text-2xl font-bold text-[#2d342b] tracking-tight"
          style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
        >
          Assessments
        </h1>

        <div className="flex flex-wrap gap-4 self-start md:self-center">
          {/* Weight Badge */}
          <div
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
              isWeightValid
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-600 border-amber-100"
            }`}
          >
            {isWeightValid ? (
              <CheckCircle2 size={14} />
            ) : (
              <AlertCircle size={14} />
            )}
            Total: {totalWeight}%
          </div>

          {/* Evaluate Now */}
          <button
            onClick={() => setIsEvalModalOpen(true)}
            className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md text-sm text-white"
            style={{ backgroundColor: "#4caf50" }}
          >
            <ShieldCheck size={18} />
            Evaluate Now
            {evaluatedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px]">
                {evaluatedCount}/{assessments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Scrollable Bento Grid — matches develop page ── */}
      <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-3 custom-scrollbar">
        <div className="grid grid-cols-1 gap-3 pb-4">
          {assessments.length === 0 ? (
            <div
              className="text-center py-24 rounded-2xl"
              style={{ background: "#ffffff", border: "2px dashed #adb4a8" }}
            >
              <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-4 border border-slate-100 text-slate-300">
                <BookOpen size={48} />
              </div>
              <h3
                className="font-bold mt-4 mb-2"
                style={{
                  color: "#5a6157",
                  fontFamily: "Plus Jakarta Sans, sans-serif",
                }}
              >
                No Assessments Found
              </h3>
              <p className="text-sm" style={{ color: "#adb4a8" }}>
                No assessment components have been submitted for this syllabus
                version.
              </p>
            </div>
          ) : (
            assessments.map((ass: any, index: number) => {
              const badge = getEvalBadge(ass.assessmentId);
              return (
                <div
                  key={ass.assessmentId || `local-${index}`}
                  className={`group relative bg-surface-container-lowest p-0.5 rounded-xl transition-all duration-300 hover:shadow-lg border ${
                    badge
                      ? `${badge.border}`
                      : "border-transparent hover:border-primary/10"
                  }`}
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
                          ass.typeName?.toLowerCase().includes("formative")
                            ? "bg-secondary-container text-on-secondary-container"
                            : "bg-primary-container text-on-primary-container"
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl">
                          {ass.typeName?.toLowerCase().includes("formative")
                            ? "edit_note"
                            : "history_edu"}
                        </span>
                      </div>
                      <div>
                        <h3
                          className="text-sm font-bold text-on-surface"
                          style={{
                            fontFamily: "Plus Jakarta Sans, sans-serif",
                          }}
                        >
                          {ass.categoryName || "Assessment"} - Part{" "}
                          {ass.part || 1}
                          {badge && (
                            <span
                              className={`ml-2 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full inline-block ${badge.color} ${badge.bg}`}
                            >
                              {badge.label}
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              ass.typeName?.toLowerCase().includes("formative")
                                ? "bg-secondary-container text-on-secondary-container"
                                : "bg-primary-container text-on-primary-container"
                            }`}
                          >
                            {ass.typeName}
                          </span>
                          <span className="text-[11px] text-on-surface-variant/60">
                            •
                          </span>
                          <span className="text-[11px] text-on-surface-variant font-medium">
                            {ass.note
                              ? ass.note.length > 50
                                ? ass.note.substring(0, 50) + "..."
                                : ass.note
                              : "No instructions provided."}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-[8px] uppercase tracking-widest text-on-surface-variant font-bold mb-0">
                          Weighting
                        </p>
                        <p className="text-lg font-bold text-on-surface leading-none">
                          {ass.weight}%
                        </p>
                      </div>
                      {/* View Detail Button */}
                      <button
                        onClick={() => setExpandedIndex(index)}
                        className="p-1 px-2 text-on-surface-variant hover:bg-surface-container rounded-md transition-colors flex items-center gap-1 border border-outline-variant/20 shadow-xs"
                      >
                        <Eye size={16} />
                        <span className="text-[10px] font-bold">View</span>
                      </button>
                    </div>
                  </div>

                  {/* Preview Details Grid */}
                  <div className="mx-4 mb-4 h-px bg-surface-container"></div>
                  <div className="px-4 pb-4 text-[11px] text-on-surface-variant grid grid-cols-3 gap-6">
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-widest mb-0.5 text-on-surface-variant/60">
                        Duration
                      </span>
                      <span className="font-medium">{ass.duration} Min</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-widest mb-0.5 text-on-surface-variant/60">
                        Eval Range
                      </span>
                      <span className="font-medium">
                        {ass.completionCriteria || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-widest mb-0.5 text-on-surface-variant/60">
                        Methodology
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-tertiary-container text-on-tertiary-container text-[9px] font-bold">
                        {ass.questionType || "Standard"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Bottom Info ── */}
      <div className="mt-16 border-t border-outline-variant/20 pt-10">
        <p className="text-[10px] text-on-surface-variant/40 italic text-center">
          Assessment data is read-only during peer review. Use the Evaluate
          button to submit your review.
        </p>
      </div>

      {/* ── Read-Only Assessment Detail Modal ── */}
      {expandedIndex !== null && assessments[expandedIndex] && (
        <AssessmentViewModal
          assessment={assessments[expandedIndex]}
          onClose={() => setExpandedIndex(null)}
          subjectId={syllabusData?.data?.subjectId}
        />
      )}

      {/* Assessment Evaluate Modal */}
      <AssessmentEvaluateModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        assessments={assessments.map((a: any) => ({
          assessmentId: a.assessmentId,
          categoryName: a.categoryName,
          typeName: a.typeName,
          weight: a.weight,
          questionType: a.questionType,
          knowledgeSkill: a.knowledgeSkill,
        }))}
        taskId={reviewId}
      />
    </div>
  );
}

function AssessmentViewModal({
  assessment,
  onClose,
  subjectId,
}: {
  assessment: any;
  onClose: () => void;
  subjectId?: string;
}) {
  const { data: closRes, isLoading: isClosLoading } = useQuery({
    queryKey: ["clos", subjectId],
    queryFn: () =>
      subjectId ? CloPloService.getSubjectClos(subjectId, 0, 100) : null,
    enabled: !!subjectId,
  });

  const { data: mappingRes, isLoading: isMappingLoading } = useQuery({
    queryKey: ["assessment-mappings", assessment?.assessmentId],
    queryFn: () =>
      MappingService.getAssessmentMappings(assessment?.assessmentId || ""),
    enabled: !!assessment?.assessmentId,
  });

  const clos = closRes?.data?.content || [];
  const mappings = mappingRes?.data || [];
  const mappedCloIds = mappings.map((m: any) => m.cloId);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-slate-200 text-slate-900 text-xs font-black tracking-widest uppercase border border-slate-300">
                Read Only
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                {assessment.categoryName || "Assessment"} - Part{" "}
                {assessment.part || 1}
              </h2>
            </div>
            <p className="text-base text-slate-500 mt-1 font-bold">
              Syllabus Component Details
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-slate-200 rounded-full transition-colors group"
          >
            <span className="material-symbols-outlined text-slate-500 group-hover:text-slate-900 text-2xl font-bold">
              close
            </span>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Category
              </label>
              <div className="text-lg font-bold text-slate-900">
                {assessment.categoryName || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Type
              </label>
              <div className="text-lg font-bold text-slate-900">
                {assessment.typeName || "N/A"}
              </div>
            </div>
            <div className="space-y-2 text-center">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Part #
              </label>
              <div className="text-lg font-bold text-slate-900">
                {assessment.part || 1}
              </div>
            </div>
            <div className="space-y-2 text-center">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Weight %
              </label>
              <div className="text-xl font-black text-slate-900">
                {assessment.weight}%
              </div>
            </div>
          </div>

          {/* Criteria & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-slate-100">
            <div className="md:col-span-2 space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Completion Criteria
              </label>
              <div className="text-base text-slate-800 bg-slate-50 p-6 rounded-2xl border border-slate-200 min-h-[80px] font-medium leading-relaxed">
                {assessment.completionCriteria || "No criteria provided"}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block text-center">
                Duration (Mins)
              </label>
              <div className="flex items-center justify-center w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xl font-black text-slate-900">
                {assessment.duration || 0}
              </div>
            </div>
          </div>

          {/* Methodology */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Question Type
              </label>
              <div className="text-base text-slate-900 font-bold px-5 py-3 bg-slate-50 rounded-xl border border-slate-200">
                {assessment.questionType || "Standard"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Knowledge / Skill
              </label>
              <div className="text-base text-slate-900 font-bold px-5 py-3 bg-slate-50 rounded-xl border border-slate-200">
                {assessment.knowledgeSkill || "N/A"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                Grading Guide
              </label>
              <div className="text-base text-slate-900 font-bold px-5 py-3 bg-slate-50 rounded-xl border border-slate-200">
                {assessment.gradingGuide || "N/A"}
              </div>
            </div>
          </div>

          {/* Note */}
          <section className="space-y-3">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
              Note / Description
            </label>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-base text-slate-800 leading-relaxed font-medium min-h-[100px]">
              {assessment.note || "No description provided."}
            </div>
          </section>

          {/* CLO Mapping */}
          <section className="space-y-5 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider">
                <div className="w-2 h-5 bg-slate-900 rounded-full"></div>
                Learning Outcomes (CLO)
              </h3>
              <span className="text-xs font-black text-slate-500 py-1.5 px-3 bg-slate-100 rounded-lg border border-slate-200">
                {mappings.length} Linked
              </span>
            </div>

            <div className="space-y-4">
              {isClosLoading || isMappingLoading ? (
                <div className="flex items-center gap-3 text-base text-slate-500 p-6">
                  <Loader2 size={20} className="animate-spin" />
                  Syncing data...
                </div>
              ) : mappedCloIds.length > 0 ? (
                clos
                  .filter((clo: any) => mappedCloIds.includes(clo.cloId))
                  .map((clo: any) => (
                    <div
                      key={clo.cloId}
                      className="p-6 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/80 transition-colors shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-900 bg-slate-200 px-3 py-1 rounded-md uppercase tracking-widest">
                          {clo.cloCode}
                        </span>
                        {clo.bloomLevel && (
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                            Bloom {clo.bloomLevel}
                          </span>
                        )}
                      </div>
                      <p className="text-base font-bold text-slate-900 leading-relaxed">
                        {clo.description}
                      </p>
                    </div>
                  ))
              ) : (
                <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                  <p className="text-base text-slate-500 font-bold">
                    No outcomes mapped to this assessment.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="px-8 py-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-8 py-3 text-white text-base font-black rounded-xl hover:opacity-90 transition-opacity shadow-md"
            style={{ backgroundColor: "#4caf50" }}
          >
            Close Window
          </button>
        </footer>
      </div>
    </div>
  );
}
