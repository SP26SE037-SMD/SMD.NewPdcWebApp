"use client";

import React, { use, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { setAssessments } from "@/store/slices/syllabusSlice";
import { Loader2 } from "lucide-react";
import {
  AssessmentService,
  AssessmentItem,
} from "@/services/assessment.service";
import { SyllabusService } from "@/services/syllabus.service";
import { CloPloService } from "@/services/cloplo.service";
import {
  MappingService,
  CloAssessmentMapping,
} from "@/services/mapping.service";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/Toast";
import { AssessmentDetailModal } from "@/components/dashboard/AssessmentDetailModal";
import { CloMappingTab } from "./_components/CloMappingTab";

export default function AssessmentsPage({
  params,
}: {
  params: Promise<{ syllabusId: string }>;
}) {
  const { syllabusId } = use(params);
  const isReadOnly = true;
  const dispatch = useDispatch<AppDispatch>();
  const { showToast } = useToast();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const { data: syllabusData, isLoading: isSyllabusLoading } = useQuery({
    queryKey: ["syllabus", syllabusId],
    queryFn: () => SyllabusService.getSyllabusById(syllabusId!),
    enabled: !!syllabusId,
  });

  // Fetch Assessments
  const { data: assessmentDataRes, isLoading: isAssessmentLoading } = useQuery({
    queryKey: ["assessments", syllabusId],
    queryFn: () =>
      syllabusId
        ? AssessmentService.getAssessmentsBySyllabusId(syllabusId)
        : null,
    enabled: !!syllabusId,
  });

  const subjectId = syllabusData?.data?.subjectId;
  const { data: closRes } = useQuery({
    queryKey: ["clos", subjectId],
    queryFn: () =>
      subjectId ? CloPloService.getSubjectClos(subjectId, 0, 100) : null,
    enabled: !!subjectId,
  });
  const subjectClos = closRes?.data?.content || [];

  const [activeTab, setActiveTab] = useState<"list" | "mapping">("list");

  const reduxAssessments = useSelector((state: RootState) =>
    syllabusId ? state.syllabus.assessmentsDB[syllabusId] : undefined,
  );

  // Sync to Redux
  useEffect(() => {
    if (
      assessmentDataRes?.data &&
      Array.isArray(assessmentDataRes.data) &&
      syllabusId
    ) {
      const fetched = assessmentDataRes.data;
      dispatch(setAssessments({ syllabusId, assessments: fetched }));
    } else if (assessmentDataRes?.data?.content && syllabusId) {
      const fetched = assessmentDataRes.data.content;
      dispatch(setAssessments({ syllabusId, assessments: fetched }));
    }
  }, [assessmentDataRes?.data, syllabusId, dispatch]);

  const assessments = reduxAssessments || [];
  const isLoading = isAssessmentLoading;

  const totalWeight = assessments.reduce(
    (sum, a) => sum + (Number(a.weight) || 0),
    0,
  );
  const isWeightValid = totalWeight === 100;
  const isWeightOver = totalWeight > 100;

  // Mapping specific state
  const [mappingStates, setMappingStates] = useState<Record<string, string[]>>(
    {},
  );

  const { data: mappingsRes } = useQuery({
    queryKey: ["assessment-mappings", syllabusId],
    queryFn: () =>
      syllabusId
        ? MappingService.getSyllabusAssessmentMappings(syllabusId)
        : null,
    enabled: !!syllabusId,
  });

  // Initialize mapping states from API or assessments
  useEffect(() => {
    if (activeTab === "mapping" && assessments.length > 0) {
      const newStates = { ...mappingStates };

      if (mappingsRes?.data) {
        const apiMappings = mappingsRes.data;
        const grouped: Record<string, string[]> = {};
        apiMappings.forEach((m: CloAssessmentMapping) => {
          if (!grouped[m.assessmentId]) grouped[m.assessmentId] = [];
          grouped[m.assessmentId].push(m.cloId);
        });

        assessments.forEach((ass) => {
          if (ass.assessmentId) {
            newStates[ass.assessmentId] = grouped[ass.assessmentId] || [];
          }
        });
      } else {
        assessments.forEach((ass) => {
          if (ass.assessmentId && !newStates[ass.assessmentId]) {
            newStates[ass.assessmentId] = ass.cloIds || [];
          }
        });
      }
      setMappingStates(newStates);
    }
  }, [activeTab, assessments, mappingsRes?.data]);

  if (!syllabusId) return null;

  if (isLoading && assessments.length === 0) {
    return (
      <div className="bg-white border flex flex-col items-center justify-center text-zinc-400 border-zinc-200 rounded-3xl p-8 shadow-sm min-h-[500px]">
        <Loader2 size={32} className="animate-spin mb-4" />
        <p>Loading assessments...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 animate-in fade-in duration-500">
      {/* ── Page Header ── */}
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
        <div className="space-y-1">
          <h1
            className="text-3xl font-extrabold text-on-surface tracking-tight mb-1"
            style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
          >
            Assessments
          </h1>
          <p className="text-[12px] font-bold text-zinc-900 flex items-center gap-2">
            <span>{assessments.length} assessments created</span>
            <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
            <span
              className={
                isWeightValid
                  ? "text-emerald-600"
                  : isWeightOver
                    ? "text-red-600"
                    : "text-amber-600"
              }
            >
              Total Weight: {totalWeight}%
            </span>
          </p>
        </div>
      </div>

      {/* ── Tabs Navigation ── */}
      <div className="flex border-b border-outline-variant/30 mb-8 mt-4">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-8 py-3 font-bold text-sm transition-all relative ${activeTab === "list" ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}
        >
          Assessment List
          {activeTab === "list" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"></div>
          )}
        </button>
        <button
          onClick={() => {
            if (assessments.length === 0) {
              showToast(
                "Please create assessments first before mapping CLOs",
                "info",
              );
              return;
            }
            setActiveTab("mapping");
          }}
          className={`px-8 py-3 font-bold text-sm transition-all relative ${assessments.length === 0 ? "opacity-50 cursor-not-allowed" : ""} ${activeTab === "mapping" ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}
        >
          CLO Mapping
          {activeTab === "mapping" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"></div>
          )}
        </button>
      </div>

      <div className={activeTab === "list" ? "block" : "hidden"}>
        <>
          {/* ── Scrollable Bento Grid List of Assessments ── */}
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-3 custom-scrollbar">
            {assessments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-surface-container-lowest rounded-3xl border-2 border-dashed border-outline-variant/30 animate-in fade-in zoom-in duration-500">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">
                  assignment_late
                </span>
                <p
                  className="text-lg font-medium text-on-surface/60"
                  style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                  No assessments found
                </p>
                <p className="text-sm opacity-60 mt-1">
                  This syllabus currently has no assessments.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 pb-4">
                {assessments.map((ass, index) => (
                  <div
                    key={ass.assessmentId || `local-${index}`}
                    className="group relative bg-surface-container-lowest p-0.5 rounded-xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/10"
                  >
                    <div className="flex items-center justify-between p-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${ass.typeName?.toLowerCase().includes("formative") ? "bg-secondary-container text-on-secondary-container" : "bg-primary-container text-on-primary-container"}`}
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
                            {ass.categoryName} - Part {ass.part}
                          </h3>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${ass.typeName?.toLowerCase().includes("formative") ? "bg-secondary-container text-on-secondary-container" : "bg-primary-container text-on-primary-container"}`}
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
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setExpandedIndex(index)}
                            className="p-1 px-2 text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-1 border border-primary/20 shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              visibility
                            </span>
                            <span className="text-[10px] font-bold">View</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Preview Details */}
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
                ))}
              </div>
            )}
          </div>
        </>
      </div>

      <div className={activeTab === "mapping" ? "block" : "hidden"}>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CloMappingTab
            assessments={assessments}
            subjectClos={subjectClos}
            mappingStates={mappingStates}
            onMappingChange={(assessmentId, cloIds) =>
              setMappingStates((prev) => ({ ...prev, [assessmentId]: cloIds }))
            }
            isReadOnly={isReadOnly}
          />
        </div>
      </div>

      {/* ── Edit Assessment Modal ── */}
      {expandedIndex !== null && (
        <AssessmentDetailModal
          isOpen={expandedIndex !== null}
          onClose={() => setExpandedIndex(null)}
          assessment={assessments[expandedIndex]}
          subjectId={syllabusData?.data?.subjectId}
        />
      )}
    </div>
  );
}
