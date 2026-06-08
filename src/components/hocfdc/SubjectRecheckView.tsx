"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SubjectService } from "@/services/subject.service";
import { CloPloService } from "@/services/cloplo.service";
import { CurriculumService } from "@/services/curriculum.service";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  ShieldCheck,
  Info,
  ChevronRight,
  Activity,
  Target,
  GraduationCap,
  Scale,
  Wrench,
  Calendar,
  FileText,
  Building2,
  CheckCircle2,
  Check,
  X,
  Send,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  ReviewTaskService,
  REVIEW_TASK_STATUS,
} from "@/services/review-task.service";
import { useToast } from "@/components/ui/Toast";
import { TaskService } from "@/services/task.service";
import { FinalDecisionCard } from "@/components/hopdc/syllabus/FinalDecisionCard";
const formatCloDescription = (text: string) => {
  if (!text) return "";
  const trimmed = text.trim();
  const firstSpaceIdx = trimmed.indexOf(" ");
  if (firstSpaceIdx === -1) {
    return <span className="font-bold text-zinc-900">{trimmed}</span>;
  }
  const firstWord = trimmed.substring(0, firstSpaceIdx);
  const remainingText = trimmed.substring(firstSpaceIdx);
  return (
    <>
      <span className="font-bold text-zinc-900">{firstWord}</span>
      {remainingText}
    </>
  );
};

export default function SubjectRecheckView() {
  const router = useRouter();
  const params = useParams();
  const curriculumId = params.curriculumId as string;
  const subjectId = params.subjectId as string;
  const sprintId = params.sprintId as string;

  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") || "";
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "matrix" | "clos">(
    "overview",
  );
  const [titleTask, setTitleTask] = useState("");
  const [comment, setComment] = useState("");
  const [isAffectedSyllabus, setIsAffectedSyllabus] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);

  // Approve Mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      if (subject?.status === "PENDING_REVIEW") {
        return SubjectService.updateSubjectStatus(subjectId, "COMPLETED");
      }
      return Promise.resolve();
    },
    onSuccess: () => {
      showToast("Subject approved successfully", "success");
      setIsApproveModalOpen(false);

      const effectiveSprintId = taskDetailResp?.data?.sprintId || sprintId;

      // Redirect to department task page
      const sprintUrl = `/dashboard/hocfdc/framework-execution/${curriculumId}/department-tasks/${effectiveSprintId}`;
      router.push(sprintUrl);
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },
    onError: (error: any) => {
      showToast(error?.message || "Failed to approve subject", "error");
    },
  });

  // Fetch Task Detail to check type (REUSED_SUBJECT tasks are locked to isAffectedSyllabus = false)
  const { data: taskDetailResp } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => TaskService.getTaskById(taskId),
    enabled: !!taskId,
  });

  const taskType = taskDetailResp?.data?.type;
  const isReusedSubject =
    taskType === "SUBJECT" &&
    (taskDetailResp?.data?.subjectStatus === "COMPLETED" ||
      taskDetailResp?.data?.subject?.status === "COMPLETED");

  const syllabusId =
    taskDetailResp?.data?.syllabusId ||
    taskDetailResp?.data?.syllabus?.syllabusId ||
    null;
  const showFloatingDecision =
    !!taskId && taskDetailResp?.data?.isAccepted !== true;

  // Force false if it's a reused subject
  useEffect(() => {
    if (isReusedSubject) {
      setIsAffectedSyllabus(false);
    }
  }, [isReusedSubject]);

  const revisionMutation = useMutation({
    mutationFn: (payload: any) =>
      ReviewTaskService.createHoCFDCReviewTask(payload),
    onSuccess: () => {
      showToast("Revision request created successfully", "success");
      setIsModalOpen(false);
      setTitleTask("");
      setComment("");
      setIsAffectedSyllabus(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.back();
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to create revision request", "error");
    },
  });

  const handleSubmitRevision = () => {
    if (!titleTask || !comment) {
      showToast("Please fill in all fields", "warning");
      return;
    }

    revisionMutation.mutate({
      titleTask,
      comment,
      status: REVIEW_TASK_STATUS.REVISION_REQUESTED,
      taskId,
      reviewerId: user?.accountId || "",
      isAccepted: false, // For HoCFDC, this is a revision, not acceptance
      isAffectedSyllabus,
    });
  };

  // 1. Fetch Subject Info
  const { data: subjectResp, isLoading: isSubjectLoading } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => SubjectService.getSubjectById(subjectId),
  });

  // 2. Fetch Subject CLOs
  const { data: cloResp, isLoading: isCloLoading } = useQuery({
    queryKey: ["subject-clos", subjectId],
    queryFn: () => CloPloService.getSubjectClos(subjectId),
  });

  // 3. Fetch Curriculum PLOs
  const { data: ploResp, isLoading: isPloLoading } = useQuery({
    queryKey: ["curriculum-plos", curriculumId],
    queryFn: () => CurriculumService.getPloByCurriculumId(curriculumId),
  });

  const subject = subjectResp?.data;
  const clos = cloResp?.data?.content || [];
  const plos = ploResp?.data?.content || [];

  // 4. Fetch Mappings for each CLO
  const { data: mappingsData, isLoading: isMappingLoading } = useQuery({
    queryKey: ["clo-plo-mappings-combined", subjectId, curriculumId],
    queryFn: async () => {
      if (!subjectId || !curriculumId) return [];
      const res = await CloPloService.getMappingsBySubjectAndCurriculum(
        subjectId,
        curriculumId,
      );
      return res.data || [];
    },
    enabled: !!subjectId && !!curriculumId,
  });

  const mappings = mappingsData || [];

  const isLoading =
    isSubjectLoading ||
    isCloLoading ||
    isPloLoading ||
    (isMappingLoading && clos.length > 0);

  if (isLoading) {
    return (
      <div className="p-8 space-y-8 animate-in fade-in duration-500 bg-[#F8F9FA] min-h-screen">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-4 space-y-6">
            <Skeleton className="h-64 rounded-[2rem]" />
            <Skeleton className="h-48 rounded-[2rem]" />
            <Skeleton className="h-48 rounded-[2rem]" />
          </div>
          <div className="col-span-8 space-y-8">
            <Skeleton className="h-96 rounded-[3rem]" />
            <Skeleton className="h-64 rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (!subject)
    return (
      <div className="p-20 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
          <BookOpen size={32} className="text-rose-400" />
        </div>
        <p className="text-zinc-600 text-lg font-black tracking-tight">
          Subject detail not found
        </p>
        <button
          onClick={() => router.back()}
          className="text-primary font-bold hover:underline"
        >
          Go back
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8F9FA] px-16 py-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-200 text-zinc-600 rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <span>Framework Execution</span>
              <ChevronRight size={10} />
              <span>Department Tasks</span>
              <ChevronRight size={10} />
              <span className="text-primary">Subject Check</span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tighter">
                Check Subject:{" "}
                <span className="text-primary">{subject.subjectCode}</span>
                {" - "}
                <span className="text-zinc-500">{subject.subjectName}</span>
              </h1>
              <button
                onClick={() => router.push(`/dashboard/hocfdc/subjects/${subjectId}`)}
                className="h-8 px-3 rounded-lg border border-zinc-200 bg-white text-zinc-700 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 hover:text-primary transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <BookOpen size={12} className="text-primary" />
                View Subject Detail
              </button>
            </div>
          </div>
        </div>

        {/* Actions removed (Decision card handles actions) */}
      </div>

      <div
        className="flex border-b border-zinc-200 gap-8 uppercase tracking-[0.2em] text-[13px] font-black"
        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
      >
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-4 transition-all relative ${activeTab === "overview" ? "text-primary" : "text-zinc-400 hover:text-zinc-600"}`}
        >
          Overview
          {activeTab === "overview" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-lg" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("clos")}
          className={`pb-4 transition-all relative ${activeTab === "clos" ? "text-primary" : "text-zinc-400 hover:text-zinc-600"}`}
        >
          CLOs
          {activeTab === "clos" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-lg" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("matrix")}
          className={`pb-4 transition-all relative ${activeTab === "matrix" ? "text-primary" : "text-zinc-400 hover:text-zinc-600"}`}
        >
          Mappings Matrix
          {activeTab === "matrix" && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-lg" />
          )}
        </button>
      </div>

      <div className="font-jakarta px-40">
        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-8">
                {/* 1. Core Profile */}
                <section className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-xl shadow-zinc-200/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                    <BookOpen size={120} />
                  </div>

                  <div className="relative space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center rounded-2xl">
                        <BookOpen size={20} />
                      </div>
                      <h3 className="font-black text-lg tracking-tight text-zinc-900">
                        Module Profile
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100/50">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                          Subject Name
                        </p>
                        <p className="font-black text-zinc-900 leading-tight">
                          {subject.subjectName}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100/50">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Layers size={10} className="text-emerald-400" />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              Credits
                            </p>
                          </div>
                          <p className="font-black text-zinc-900">
                            {subject.credits || 0}
                          </p>
                        </div>
                        <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100/50">
                          <div className="flex items-center gap-1.5 mb-1">
                            <GraduationCap
                              size={10}
                              className="text-emerald-400"
                            />
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                              Level
                            </p>
                          </div>
                          <p className="font-black text-zinc-900">
                            {subject.degreeLevel || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Building2 size={10} className="text-primary" />
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Affiliated Department
                          </p>
                        </div>
                        <p className="font-black text-zinc-900">
                          {subject.department?.departmentName || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 2. Academic Standards */}
                <section className="bg-zinc-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -bottom-10 -right-10 opacity-[0.05] group-hover:scale-110 transition-transform duration-1000">
                    <Target size={200} />
                  </div>

                  <div className="relative space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
                        <Scale size={20} className="text-primary" />
                      </div>
                      <h3 className="text-lg font-black tracking-tight">
                        Academic Integrity
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                            Min Bloom Level
                          </span>
                          <span className="text-xl font-black text-white">
                            Level {subject.minBloomLevel || 0}
                          </span>
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center bg-emerald-& text-emerald-400 rounded-xl">
                          <Layers size={24} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Min to Pass
                          </span>
                          <span className="text-lg font-black text-white">
                            {subject.minToPass || 0}/10
                          </span>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                            Scale
                          </span>
                          <span className="text-lg font-black text-white">
                            {subject.scoringScale || 0} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
              <div className="space-y-8">
                {/* 3. Governance Card */}
                <section className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-lg relative overflow-hidden">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-400">
                        <ShieldCheck size={20} />
                      </div>
                      <h3 className="text-lg font-black tracking-tight text-zinc-900">
                        Governance
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-all cursor-default">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Decision No.
                          </p>
                          <p className="text-sm font-black text-zinc-900">
                            {subject.decisionNo || "NOT_ASSIGNED"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-all cursor-default">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Approved Cycle
                          </p>
                          <p className="text-sm font-black text-zinc-900">
                            {subject.approvedDate
                              ? new Date(
                                  subject.approvedDate,
                                ).toLocaleDateString()
                              : "PENDING"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-all cursor-default">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                          <Wrench size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Integrated Tool
                          </p>
                          <p className="text-sm font-black text-zinc-900">
                            {subject.tool || "GENERIC_PDC"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 4. Student Tasks Card */}
                <section className="bg-emerald-& p-6 rounded-3xl border border-emerald-100 relative overflow-hidden group">
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-4">
                      <Activity size={16} className="text-emerald-400" />
                      <h3 className="text-[10px] font-black text-emerald-900 uppercase tracking-[0.2em]">
                        Mandatory Student Tasks
                      </h3>
                    </div>
                    <p className="text-xs text-emerald-900 font-medium leading-relaxed italic">
                      "
                      {subject.studentTasks ||
                        "No specific tasks registered for this module."}
                      "
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* Prerequisites Section (Moved from separate tab) */}
            <section className="bg-white rounded-[10px] border border-zinc-200 p-8 shadow-xl shadow-zinc-200/50 space-y-8 text-left">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 flex items-center justify-center rounded-[10px] border border-emerald-100">
                    <ChevronRight size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight text-zinc-900">
                      Registry Source
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      Prerequisites & External Dependencies
                    </p>
                  </div>
                </div>
              </div>

              {subject.preRequisite && subject.preRequisite.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subject.preRequisite.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 bg-zinc-50/80 p-4 rounded-[10px] border border-zinc-100 hover:border-primary/20 transition-all group/item hover:bg-white hover:shadow-xl hover:shadow-zinc-200/50"
                    >
                      <div className="w-12 h-12 rounded-[10px] bg-white border border-zinc-100 flex items-center justify-center text-[11px] font-black text-zinc-400 group-hover/item:bg-primary group-hover/item:text-white transition-all shadow-sm shrink-0">
                        {(item.prerequisiteSubjectCode || "UNK").substring(
                          0,
                          3,
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">
                            {item.prerequisiteSubjectCode}
                          </p>
                          {item.isMandatory && (
                            <span className="text-[8px] font-black bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-[10px] uppercase tracking-widest border border-rose-100">
                              Compulsory
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-zinc-900 truncate leading-tight">
                          {item.prerequisiteSubjectName}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 bg-zinc-50 rounded-[10px] border border-dashed border-zinc-200 text-center">
                  <p className="text-sm font-black text-zinc-400 uppercase tracking-widest italic">
                    No Prerequisite Dependencies
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Matrix Tab */}
        {activeTab === "matrix" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Competency Alignment Matrix (CLO-PLO) */}
            <section className="bg-white p-8 rounded-[1.5rem] border border-zinc-200/60 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">
                    CLOs-PLOs Mapping Matrix
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium italic mt-1">
                    Visualizing the mapping relationship between Course Learning Outcomes (CLOs) and Program Learning Outcomes (PLOs).
                  </p>
                </div>
                <div className="flex gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-primary text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      circle
                    </span>
                    <span className="text-xs font-bold text-zinc-600">Mapped</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-zinc-200 text-sm">circle</span>
                    <span className="text-xs font-bold text-zinc-600">Unmapped</span>
                  </div>
                </div>
              </div>

              {clos.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-zinc-200 rounded-3xl text-center space-y-3">
                  <ShieldCheck size={32} className="text-zinc-300 mx-auto" />
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No CLOs Defined</p>
                  <p className="text-xs text-zinc-400">This subject does not have any Course Learning Outcomes mapped.</p>
                </div>
              ) : plos.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-zinc-200 rounded-3xl text-center space-y-3">
                  <ShieldCheck size={32} className="text-zinc-300 mx-auto" />
                  <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No PLOs Defined</p>
                  <p className="text-xs text-zinc-400">The selected curriculum does not have any Program Learning Outcomes defined.</p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-4 custom-scrollbar rounded-2xl border border-zinc-200">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-black tracking-widest text-zinc-500">
                        <th className="p-4 rounded-tl-xl w-[320px] min-w-[320px] max-w-[320px] sticky left-0 z-20 bg-zinc-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)] text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Course Learning Outcomes (CLOs)
                        </th>
                        {plos.map((plo: any, idx: number) => (
                          <th
                            key={plo.ploId}
                            className="p-4 text-center min-w-[120px] group/header relative"
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                              {plo.ploCode || `PLO-${idx + 1}`}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute opacity-0 invisible group-hover/header:opacity-100 group-hover/header:visible transition-all duration-300 top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] bg-zinc-900 text-white text-[11px] rounded-2xl shadow-2xl p-4 z-[100] text-left pointer-events-none border border-zinc-800 backdrop-blur-sm bg-opacity-95 normal-case">
                              <p className="font-black text-emerald-400 mb-2 tracking-widest uppercase border-b border-zinc-800 pb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} />
                                {plo.ploCode}
                              </p>
                              <p className="font-medium leading-relaxed text-zinc-300 text-sm whitespace-pre-wrap">
                                {plo.description}
                              </p>
                            </div>
                          </th>
                        ))}
                        <th className="p-4 bg-emerald-50/30 text-center rounded-tr-xl w-[100px]">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">
                            Coverage
                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {clos.map((clo: any) => {
                        const supportCount = plos.filter(
                          (plo: any) =>
                            mappings.some(
                              (m: any) =>
                                m.cloId === clo.cloId && m.ploId === plo.ploId
                            )
                        ).length;
                        const isUnmapped = supportCount === 0;

                        return (
                          <tr
                            key={clo.cloId}
                            className={`group hover:bg-zinc-50/80 transition-colors ${
                              isUnmapped ? "bg-red-50/5" : ""
                            }`}
                          >
                            <td className="p-4 border-b border-zinc-100 sticky left-0 bg-white group-hover:bg-zinc-50/80 transition-colors z-10 w-[320px] min-w-[320px] max-w-[320px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              <div className="flex flex-col gap-1 pr-2">
                                <span
                                  className={`text-[13px] font-black tracking-tight ${
                                    isUnmapped ? "text-red-600" : "text-zinc-900"
                                  }`}
                                >
                                  {clo.cloCode}
                                </span>
                                <span
                                  className={`text-xs leading-relaxed ${
                                    isUnmapped
                                      ? "text-red-400 font-medium italic"
                                      : "text-zinc-500"
                                  }`}
                                >
                                  {clo.description}
                                </span>
                              </div>
                            </td>
                            {plos.map((plo: any) => {
                              const mapped = mappings.some(
                                (m: any) =>
                                  m.cloId === clo.cloId && m.ploId === plo.ploId
                              );
                              return (
                                <td
                                  key={plo.ploId}
                                  className={`p-4 border-b border-zinc-100 text-center transition-all ${
                                    mapped ? "bg-emerald-50/10" : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    <span
                                      className={`material-symbols-outlined transition-all ${
                                        mapped
                                          ? "text-primary scale-125"
                                          : "text-zinc-200"
                                      }`}
                                      style={{
                                        fontVariationSettings: mapped
                                          ? "'FILL' 1"
                                          : "'FILL' 0",
                                      }}
                                    >
                                      circle
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-4 border-b border-emerald-150 bg-emerald-50/30 text-center group-hover:bg-emerald-50/50 transition-colors font-bold text-xs text-[#0b7a47]">
                              {supportCount}/{plos.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot className="bg-zinc-50/80">
                      <tr>
                        <td className="p-4 border-t border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 rounded-bl-xl sticky left-0 z-10 bg-zinc-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          PLO Support Count
                        </td>
                        {plos.map((plo: any) => {
                          const count = clos.filter(
                            (clo: any) =>
                              mappings.some(
                                (m: any) =>
                                  m.cloId === clo.cloId && m.ploId === plo.ploId
                              )
                          ).length;
                          return (
                            <td
                              key={plo.ploId}
                              className="p-4 border-t border-zinc-200 text-center"
                            >
                              <span
                                className={`text-[11px] font-black ${
                                  count === 0 ? "text-red-400" : "text-[#0b7a47]"
                                }`}
                              >
                                {count}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-4 border-t border-emerald-150 bg-emerald-50/30 text-center rounded-br-xl text-[10px] font-black text-zinc-400">
                          Total
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* CLOs Tab */}
        {activeTab === "clos" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Outcome Specifications */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 px-4">
                <Activity size={18} className="text-primary" />
                <h3 className="font-black text-zinc-900 tracking-tight">
                  Outcome Specifications
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {clos.map((clo: any) => (
                  <div
                    key={clo.cloId}
                    className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-lg shadow-zinc-200/30 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-zinc-900 text-white text-[10px] font-black tracking-widest rounded-lg">
                        {clo.cloCode}
                      </span>
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest space-y-0.5 text-right">
                        <p>Bloom Level {clo.bloomLevel || "N/A"}</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                      {formatCloDescription(clo.cloName || clo.description)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Revision Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[500px] bg-white border border-zinc-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Simple Header */}
            <div className="px-8 py-6 border-b border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-rose-50 text-rose-500 flex items-center justify-center rounded-xl">
                  <Activity size={20} />
                </div>
                <h2 className="text-xl font-black tracking-tight text-zinc-900">
                  Request Revision
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 flex items-center justify-center hover:bg-zinc-100 rounded-xl transition-all text-zinc-400 hover:text-zinc-900"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-8 bg-white space-y-6">
              <div className="space-y-6">
                {/* Task Title */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                    Revision Title
                  </label>
                  <input
                    type="text"
                    value={titleTask}
                    onChange={(e) => setTitleTask(e.target.value)}
                    placeholder="Enter short description of the revision..."
                    className="w-full px-5 py-4 rounded-xl bg-zinc-50 border border-zinc-200 focus:border-rose-500 focus:ring-0 transition-all text-sm font-bold text-zinc-900 placeholder:text-zinc-400"
                  />
                </div>

                {/* Case Selection Toggle - Simplified */}
                <div
                  className={`p-5 rounded-2xl border transition-all ${isAffectedSyllabus ? "bg-rose-50/30 border-rose-200" : "bg-zinc-50/30 border-zinc-100"} ${isReusedSubject ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-xs font-black uppercase tracking-widest ${isAffectedSyllabus ? "text-rose-600" : "text-zinc-600"}`}
                        >
                          Affects Syllabus Structure
                        </p>
                        {isReusedSubject && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-zinc-200 text-zinc-500 rounded-full">
                            Locked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 font-medium leading-normal mt-1">
                        {isReusedSubject
                          ? "Reused subjects do not require syllabus structural changes."
                          : "This will move Task to TO DO and Subject to WAITING SYLLABUS."}
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        !isReusedSubject &&
                        setIsAffectedSyllabus(!isAffectedSyllabus)
                      }
                      disabled={isReusedSubject}
                      className={`relative w-14 h-7 rounded-full transition-all duration-200 flex items-center px-1 shrink-0 ${isAffectedSyllabus ? "bg-rose-500" : "bg-zinc-200"} ${isReusedSubject ? "cursor-not-allowed" : ""}`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 transform ${isAffectedSyllabus ? "translate-x-7" : "translate-x-0"}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Feedback Comment */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-zinc-400 ml-1">
                    Detailed Instructions
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describe exactly what needs to be changed..."
                    rows={4}
                    className="w-full px-5 py-4 rounded-2xl bg-zinc-50 border border-zinc-200 focus:border-rose-500 focus:ring-0 transition-all text-sm font-bold text-zinc-900 placeholder:text-zinc-400 resize-none min-h-[140px]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn-charcoal flex-1 h-14 px-8"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRevision}
                  disabled={revisionMutation.isPending}
                  className={`flex-[2] h-14 px-10 bg-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-rose-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 ${revisionMutation.isPending ? "opacity-50 cursor-not-allowed grayscale" : "hover:translate-y-[-2px] hover:bg-rose-600"}`}
                >
                  {revisionMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <span className="text-sm font-bold uppercase tracking-widest">
                        Submit Request
                      </span>
                      <Send size={20} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Approve Confirmation Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-white border border-zinc-200 shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 p-10">
            <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 mx-auto">
              <CheckCircle2 className="text-emerald-500" size={32} />
            </div>
            <h3 className="text-3xl font-extrabold text-zinc-900 mb-3 tracking-tight text-center">
              Confirm Approval?
            </h3>
            <p className="text-zinc-500 leading-relaxed mb-10 font-medium text-center">
              Are you sure you want to approve this subject? This will set the
              status to{" "}
              <span className="text-emerald-600 font-bold">COMPLETED</span> and
              move the workflow forward.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="btn-charcoal flex-1 h-14 px-8"
              >
                Review
              </button>
              <button
                onClick={() => approveMutation.mutate()}
                disabled={approveMutation.isPending}
                className={`flex-1 h-14 px-10 bg-emerald-500 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 transition-all active:scale-95 ${approveMutation.isPending ? "opacity-50 cursor-not-allowed grayscale" : "hover:translate-y-[-2px] hover:bg-emerald-600"}`}
              >
                {approveMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Check size={18} strokeWidth={3} />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Decision Card */}
      {showFloatingDecision && (
        <div className="fixed top-32 right-12 z-[150] flex items-start gap-3 pointer-events-none">
          {isDecisionOpen && (
            <div className="w-96 relative pointer-events-auto">
              <FinalDecisionCard syllabusId={syllabusId} taskId={taskId} />
            </div>
          )}
          <button
            onClick={() => setIsDecisionOpen(!isDecisionOpen)}
            className={`pointer-events-auto relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg border transition-all duration-300 shrink-0 ${
              isDecisionOpen
                ? "bg-amber-600 border-amber-600 text-white hover:bg-amber-700"
                : "bg-white border-amber-200 text-amber-600 hover:bg-amber-50 hover:scale-105 active:scale-95"
            }`}
            title="Final Decision"
          >
            {isDecisionOpen ? <X size={20} /> : <ClipboardList size={20} />}
            {!isDecisionOpen && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
