"use client";

import { useState, useEffect, useMemo } from "react";
import { SubjectDetail } from "@/components/hopdc/subject/SubjectDetail";
import { CreateCloModal } from "@/components/hopdc/subject/CreateCloModal";
import { UpdateCloModal } from "@/components/hopdc/subject/UpdateCloModal";
import { CreateSyllabusModal } from "@/components/hopdc/subject/CreateSyllabusModal";
import { CloPloMapping } from "@/components/hopdc/subject/CloPloMapping";
import { CloImportModal } from "@/components/hopdc/subject/CloImportModal";
import { useNewSubjectLogic } from "@/components/hopdc/hook/NewSubjectLogic";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskService } from "@/services/task.service";
import { AccountService } from "@/services/account.service";
import { SprintService } from "@/services/sprint.service";
import { useToast } from "@/components/ui/Toast";
import {
  ArrowLeft,
  BarChart3,
  Plus,
  BookPlus,
  AlertTriangle,
  CheckCircle,
  FileText,
  Settings,
  Search,
  AlertCircle as AlertCircleIcon,
  CheckCircle2,
  Rocket,
  Info,
  Calendar,
  Clock,
  Archive,
  BookText,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SYLLABUS_STATUS } from "@/services/syllabus.service";
import { ManageSyllabusSourcesModal } from "./syllabus/ManageSyllabusSourcesModal";
import { SyllabusWorkspaceView } from "@/components/common/syllabus/SyllabusWorkspaceView";

import { StatusStepper } from "./syllabus/StatusStepper";
import { SyllabusTabContent } from "./syllabus/SyllabusTabContent";

export default function NewSubjectContent() {
  const {
    user,
    curriculumId,
    subject,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    isCreateCloModalOpen,
    setIsCreateCloModalOpen,
    isUpdateCloModalOpen,
    isImportClosModalOpen,
    setIsImportClosModalOpen,
    handleUpdateCloModalClose,
    cloToEdit,
    handleCloEdit,
    handleCloModalClose,
    hasUnsavedChanges,
    addedCount,
    deletedCount,
    isCreateSyllabusModalOpen,
    setIsCreateSyllabusModalOpen,
    plos,
    clos,
    isPloLoading,
    isCloLoading,
    isMappingLoading,
    matrixMappings,
    toggleMapping,
    isMapped,
    syncMatrix,
    submittingKey,
    mappingNotice,
    deletingCloId,
    syllabusNotice,
    deletingSyllabusId,
    isSyllabusLoading,
    draftSyllabi,
    deleteClo,
    openStandardInput,
    deleteSyllabus,
    handleCloModalSuccess,
    handleSyllabusModalSuccess,
    goToReceiveTasks,
    associatedTask,
    isTaskLoading,
    sprintId,
    publishedSyllabus,
    isPublishedSyllabusLoading,
    currentSyllabus,
    currentSyllabusId,
    handleImportClos,
    isCloStructureReadOnly,
    isMappingReadOnly,
    isSyllabusMode,
    parentTask,
    isParentTaskLoading,
  } = useNewSubjectLogic();

  const router = useRouter();
  const searchParams = useSearchParams();
  const isReadOnly = searchParams.get("readOnly") === "true";
  const [isSyllabusConfirmOpen, setIsSyllabusConfirmOpen] = useState(false);
  const [syllabusToArchive, setSyllabusToArchive] = useState<string | null>(
    null,
  );
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [selectedSyllabusIdForSources, setSelectedSyllabusIdForSources] =
    useState("");
  const [selectedSyllabusNameForSources, setSelectedSyllabusNameForSources] =
    useState("");

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const departmentId = user?.departmentId || "";
  const { data: departmentAccounts = [] } = useQuery({
    queryKey: ["assignments-department-accounts", departmentId],
    queryFn: () => AccountService.getAccountsByDepartment(departmentId),
    enabled: !!departmentId,
  });

  const filteredAccounts = useMemo(() => {
    return departmentAccounts.filter((acc) => {
      const role = acc.roleName?.toUpperCase();
      return role === "PDCM" || role === "COLLABORATOR";
    });
  }, [departmentAccounts]);

  const { data: sprintRes } = useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: () => SprintService.getSprintById(sprintId || ""),
    enabled: !!sprintId,
  });
  const sprint = sprintRes?.data;

  // Final Decision states
  const [commentText, setCommentText] = useState("");
  const [isRejectMode, setIsRejectMode] = useState(false);
  const [assignTo, setAssignTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const parentTaskId = (parentTask as any)?.taskId;

  // Fallback: if rootTaskId not set, find the CREATE SYLLABUS task by syllabusId
  const syllabusId = (associatedTask as any)?.syllabus?.syllabusId ||
    (associatedTask as any)?.syllabusId ||
    (associatedTask as any)?.targetId;
  const { data: tasksByTargetRes } = useQuery({
    queryKey: ["tasks-by-syllabus", syllabusId, "CREATE"],
    queryFn: async () => {
      if (!syllabusId) return null;
      const res = await TaskService.getTasksV2({
        targetId: syllabusId,
        action: "CREATE",
        size: 5,
      });
      return res?.content?.[0] || null;
    },
    enabled: !!syllabusId && !parentTaskId,
  });
  const createSyllabusTask = parentTask || tasksByTargetRes;
  const createSyllabusTaskId = (createSyllabusTask as any)?.taskId || null;

  useEffect(() => {
    const keyId = createSyllabusTaskId;
    if (keyId && typeof window !== "undefined") {
      const saved = localStorage.getItem(`final_decision_comment_${keyId}`);
      setCommentText(saved || "");
    }
  }, [createSyllabusTaskId]);

  const handleAcceptSyllabus = async () => {
    if (!createSyllabusTaskId) {
      showToast("Cannot find the CREATE SYLLABUS task to update", "error");
      return;
    }
    setIsSubmittingDecision(true);
    try {
      await TaskService.updateTaskStatus(createSyllabusTaskId, "DONE");
      if (typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${createSyllabusTaskId}`);
      }
      setCommentText("");
      showToast("Syllabus accepted successfully", "success");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["assignments", sprintId] }),
        queryClient.invalidateQueries({ queryKey: ["associated-task"] }),
        queryClient.invalidateQueries({ queryKey: ["parent-task"] }),
      ]);
    } catch (err: any) {
      showToast(err.message || "Failed to accept syllabus", "error");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleRejectSyllabus = async () => {
    if (!createSyllabusTaskId) {
      showToast("Cannot find the CREATE SYLLABUS task", "error");
      return;
    }
    if (!commentText.trim()) {
      showToast("Please add a comment for rejection", "error");
      return;
    }
    setIsRejectMode(true);
  };

  const handleConfirmRejection = async () => {
    if (!createSyllabusTaskId) return;
    if (!assignTo) {
      showToast("Please select an assignee", "error");
      return;
    }
    if (!dueDate) {
      showToast("Please select a due date", "error");
      return;
    }
    setIsSubmittingDecision(true);
    try {
      const pTask = (createSyllabusTask || parentTask) as any;
      const cleanTaskName = pTask?.taskName?.replace("CREATE SYLLABUS: ", "") || "";
      const updateTaskName = `UPDATE SYLLABUS: ${cleanTaskName}`;
      
      await TaskService.createTask({
        sprintId: sprintId || "",
        assignTo,
        taskName: updateTaskName,
        description: commentText.trim(),
        action: "UPDATE",
        priority: pTask?.priority || "MEDIUM",
        type: "SYLLABUS",
        targetId: pTask?.targetId || pTask?.syllabus?.syllabusId || syllabusId || null,
        rootTaskId: createSyllabusTaskId,
        dueDate,
      });

      await TaskService.updateTaskStatus(createSyllabusTaskId, "REVISION_REQUESTED");

      if (typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${createSyllabusTaskId}`);
      }
      setCommentText("");
      setIsRejectMode(false);
      setAssignTo("");
      setDueDate("");
      showToast("Syllabus rejected and update task assigned", "success");
      
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["assignments", sprintId] }),
        queryClient.invalidateQueries({ queryKey: ["associated-task"] }),
        queryClient.invalidateQueries({ queryKey: ["parent-task"] }),
      ]);
    } catch (err: any) {
      showToast(err.message || "Failed to reject syllabus", "error");
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const isReviewTask =
    associatedTask?.taskName?.toUpperCase().includes("REVIEW SYLLABUS") ||
    associatedTask?.action === "REVIEW";

  const showFloatingDecision = isReviewTask;

  const SYLLABUS_STATUS_STEPS = [
    {
      id: SYLLABUS_STATUS.DRAFT,
      label: "Draft",
      icon: FileText,
      color: "#94a3b8",
    },
    {
      id: SYLLABUS_STATUS.IN_PROGRESS,
      label: "In Progress",
      icon: Settings,
      color: "#3b82f6",
    },
    {
      id: SYLLABUS_STATUS.PENDING_REVIEW,
      label: "Pending Review",
      icon: Search,
      color: "#f59e0b",
    },
    {
      id: SYLLABUS_STATUS.APPROVED,
      label: "Approved",
      icon: CheckCircle2,
      color: "#10b981",
    },
    {
      id: SYLLABUS_STATUS.PUBLISHED,
      label: "Published",
      icon: Rocket,
      color: "#06b6d4",
    },
  ];

  const handleDeleteSyllabusClick = (id: string) => {
    setSyllabusToArchive(id);
    setIsSyllabusConfirmOpen(true);
  };

  const handleConfirmDeleteSyllabus = async () => {
    if (syllabusToArchive) {
      await deleteSyllabus(syllabusToArchive);
    }
    setIsSyllabusConfirmOpen(false);
    setSyllabusToArchive(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center">
          <h2 className="text-red-600 font-bold mb-2">Error Loading Subject</h2>
          <p className="text-red-500 mb-6">
            {error instanceof Error ? error.message : "Subject not found"}
          </p>
          <button
            onClick={goToReceiveTasks}
            className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-50 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 right-0 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute top-40 -left-8 h-48 w-48 rounded-full bg-cyan-200/20 blur-3xl" />
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button
          onClick={goToReceiveTasks}
          className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-[#0b7a47] hover:border-emerald-200 transition-colors w-fit"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          Back to Assign Tasks
        </button>

        {!isSyllabusMode && (
          <div className="flex items-center p-1 bg-zinc-100 rounded-2xl w-fit self-center md:self-auto">
            <button
              onClick={() => setActiveTab("subject")}
              className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === "subject"
                  ? "bg-white text-[#0b7a47] shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Subject Detail
            </button>
            <button
              onClick={() => setActiveTab("mapping")}
              className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                activeTab === "mapping"
                  ? "bg-white text-[#0b7a47] shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              Subject Mapping
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Tab 0: Subject Information */}
        {activeTab === "subject" && (
          <div className="animate-in fade-in duration-300">
            <SubjectDetail subject={subject} />
          </div>
        )}

        {/* Tab 1: Curriculum & CLO-PLO Mapping */}
        {activeTab === "mapping" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Curriculum PLO Catalog Section */}
            <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm p-6 md:p-7 space-y-5">
              <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-zinc-900">
                    PLOs of Curriculum
                  </h2>
                  <p className="text-base text-zinc-500">
                    Program learning outcomes belonging to this curriculum
                  </p>
                </div>
              </div>

              {!curriculumId && (
                <p className="text-base text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  Missing curriculumId in URL. Cannot load PLO list.
                </p>
              )}

              {curriculumId && isPloLoading && (
                <div className="flex items-center gap-2 text-base text-zinc-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0b7a47]" />
                  Loading curriculum PLOs (Status: INTERNAL_REVIEW)...
                </div>
              )}

              {curriculumId && !isPloLoading && plos.length === 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 flex items-start gap-4">
                  <AlertTriangle
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={20}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-amber-900 leading-none">
                      No Actionable PLOs Found
                    </p>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      To perform mapping, PLOs must be in{" "}
                      <strong>INTERNAL_REVIEW</strong> status. Currently, no
                      PLOs satisfy this condition (likely still in{" "}
                      <strong>DRAFT</strong>).
                    </p>
                  </div>
                </div>
              )}

              {curriculumId && plos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-auto pr-1">
                  {plos.map((plo) => (
                    <div
                      key={plo.ploId}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-base font-black text-zinc-900">
                          {plo.ploCode || "PLO"}
                        </p>
                        <span className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-black uppercase tracking-widest text-zinc-600">
                          {plo.status || "N/A"}
                        </span>
                      </div>
                      <p className="mt-2 text-base text-zinc-600 leading-relaxed whitespace-pre-wrap">
                        {plo.description || "No description"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <CloPloMapping
              plos={plos}
              clos={clos}
              isPloLoading={isPloLoading}
              isCloLoading={isCloLoading}
              isMappingLoading={isMappingLoading}
              matrixMappings={matrixMappings}
              toggleMapping={toggleMapping}
              isMapped={isMapped}
              syncMatrix={syncMatrix}
              submittingKey={submittingKey}
              mappingNotice={mappingNotice}
              disableMapping={isMappingReadOnly}
              hideImport={isCloStructureReadOnly}
              hideCreate={isCloStructureReadOnly}
              hideSync={isMappingReadOnly}
              onCreateClo={isCloStructureReadOnly ? undefined : () => setIsCreateCloModalOpen(true)}
              onEditClo={isCloStructureReadOnly ? undefined : handleCloEdit}
              onDeleteClo={isCloStructureReadOnly ? undefined : deleteClo}
              deletingCloId={deletingCloId}
              hasUnsavedChanges={hasUnsavedChanges}
              addedCount={addedCount}
              deletedCount={deletedCount}
              onImportClos={isCloStructureReadOnly ? undefined : async () => setIsImportClosModalOpen(true)}
              isImportingClos={submittingKey === "import"}
              iconBgColor="bg-emerald-50"
              iconTextColor="text-emerald-700"
            />
          </div>
        )}

        {/* Tab 2: Syllabus */}
        {activeTab === "syllabus" && (
          <div className="animate-in fade-in duration-300">
            <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm p-6 md:p-7 space-y-6">

              {(isTaskLoading || isPublishedSyllabusLoading) && (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              )}

              {(() => {
                const isReviewTask =
                  associatedTask?.taskName?.toUpperCase().includes("REVIEW SYLLABUS") ||
                  (associatedTask as any)?.action === "REVIEW";
                return (
                  <div className="mb-6 flex items-start gap-4">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm">
                      <BookText size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-zinc-900">
                        {isReviewTask ? "Review Detail" : "Syllabus Detail"}
                      </h2>
                      <p className="text-sm font-medium text-zinc-500">
                        {isReviewTask
                          ? "Manage and track syllabus review feedbacks and details for this curriculum deliverable."
                          : "Manage and track syllabus lifecycles for the current curriculum deliverables."}
                      </p>
                    </div>
                  </div>
                );
              })()}

              <SyllabusTabContent 
                associatedTask={associatedTask}
                publishedSyllabus={publishedSyllabus}
                currentSyllabus={currentSyllabus}
                currentSyllabusId={currentSyllabusId || undefined}
                isTaskLoading={isTaskLoading}
                isPublishedSyllabusLoading={isPublishedSyllabusLoading}
                isReadOnly={isReadOnly}
                sprintId={sprintId}
                setSelectedSyllabusIdForSources={setSelectedSyllabusIdForSources}
                setSelectedSyllabusNameForSources={setSelectedSyllabusNameForSources}
                setIsSourcesModalOpen={setIsSourcesModalOpen}
              />

              {syllabusNotice && (
                <div className="rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 flex items-center gap-3">
                  <Info size={16} className="text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-600">
                    {syllabusNotice}
                  </p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* Floating Decision Card - Fixed overlay, rendered outside tab conditions */}
        {showFloatingDecision && (
          <div
            id="floating-decision-panel"
            className="fixed top-32 right-12 z-[100] w-96 p-6 rounded-3xl border border-zinc-200 bg-white/95 backdrop-blur-md text-left shadow-2xl flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300"
          >
            {/* Header */}
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700 animate-pulse">
                <AlertCircleIcon size={16} />
              </div>
              <div>
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block leading-none">
                  Final Decision Required
                </span>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mt-0.5 block">
                  Syllabus Approval
                </span>
              </div>
            </div>

            {!isRejectMode ? (
              <>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-zinc-900 leading-tight">
                    {(createSyllabusTask as any)?.taskName?.replace("CREATE SYLLABUS: ", "") ||
                      (associatedTask as any)?.syllabus?.syllabusName ||
                      "Syllabus Review"}
                  </h4>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Review is complete. You can accept this syllabus, or reject it with comments to assign an update task.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    Decision Comment
                  </label>
                  <textarea
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      if (createSyllabusTaskId) {
                        localStorage.setItem(`final_decision_comment_${createSyllabusTaskId}`, e.target.value);
                      }
                    }}
                    placeholder="Provide comments or notes for rejection..."
                    className="w-full p-3 text-xs border border-zinc-200 bg-zinc-50/30 rounded-xl outline-none focus:border-[#0b7a47] focus:bg-white transition-all min-h-[90px] font-medium resize-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={handleAcceptSyllabus}
                    disabled={isSubmittingDecision}
                    className="flex-1 py-3 bg-[#0b7a47] text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-[#096339] disabled:opacity-60 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingDecision ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      <Check size={14} />
                    )}
                    Accept
                  </button>
                  <button
                    onClick={handleRejectSyllabus}
                    disabled={isSubmittingDecision}
                    className="flex-1 py-3 bg-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-rose-700 disabled:opacity-60 transition-all shadow-lg shadow-rose-100"
                  >
                    Reject
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-zinc-950">Assign Update Task</h4>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Provide assignment details to request updates from collaborators.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                      Assign To
                    </label>
                    <select
                      value={assignTo}
                      onChange={(e) => setAssignTo(e.target.value)}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 text-xs font-bold text-zinc-900 outline-none focus:border-[#0b7a47] focus:bg-white transition-all appearance-none"
                    >
                      <option value="">Select Assignee</option>
                      {filteredAccounts.map((acc) => (
                        <option key={acc.accountId} value={acc.accountId}>
                          {acc.fullName} ({acc.roleName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 10)}
                      max={sprint?.endDate ? new Date(sprint.endDate).toISOString().slice(0, 10) : undefined}
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50/30 px-3 text-xs font-bold text-zinc-900 outline-none focus:border-[#0b7a47] focus:bg-white transition-all"
                    />
                    {sprint?.endDate && (
                      <span className="text-[9px] font-bold text-amber-600 block mt-0.5">
                        Sprint deadline: {new Date(sprint.endDate).toLocaleDateString("en-GB")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleConfirmRejection}
                    disabled={isSubmittingDecision}
                    className="flex-1 py-2.5 bg-rose-600 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-rose-700 disabled:opacity-60 transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-1.5"
                  >
                    {isSubmittingDecision ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : null}
                    Confirm
                  </button>
                  <button
                    onClick={() => setIsRejectMode(false)}
                    disabled={isSubmittingDecision}
                    className="flex-1 py-2.5 bg-zinc-100 text-zinc-600 text-xs font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 disabled:opacity-60 transition-all"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <ConfirmModal
          isOpen={isSyllabusConfirmOpen}
          title="Archive Syllabus"
          message="Are you sure you want to archive this syllabus? This action will hide the syllabus and its data."
          confirmLabel="Archive"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDeleteSyllabus}
          onClose={() => setIsSyllabusConfirmOpen(false)}
          isDanger={true}
        />
      </div>

      <CreateCloModal
        subjectId={subject.subjectId}
        subjectName={subject.subjectName}
        plos={plos}
        minBloomLevel={subject?.minBloomLevel || 0}
        isOpen={isCreateCloModalOpen}
        onClose={handleCloModalClose}
        onSuccess={handleCloModalSuccess}
      />

      <UpdateCloModal
        subjectId={subject.subjectId}
        clo={cloToEdit}
        isOpen={isUpdateCloModalOpen}
        onClose={handleUpdateCloModalClose}
        onSuccess={handleCloModalSuccess}
        minBloomLevel={subject?.minBloomLevel || 0}
      />

      <CreateSyllabusModal
        subjectId={subject.subjectId}
        accountEmail={user?.email || ""}
        minBloomLevel={subject?.minBloomLevel || 0}
        isOpen={isCreateSyllabusModalOpen}
        onClose={() => setIsCreateSyllabusModalOpen(false)}
        onSuccess={handleSyllabusModalSuccess}
      />
      <ManageSyllabusSourcesModal
        syllabusId={selectedSyllabusIdForSources}
        syllabusName={selectedSyllabusNameForSources}
        isOpen={isSourcesModalOpen}
        onClose={() => {
          setIsSourcesModalOpen(false);
          setSelectedSyllabusIdForSources("");
        }}
        hideAddButton={true}
      />

      <CloImportModal
        isOpen={isImportClosModalOpen}
        onClose={() => setIsImportClosModalOpen(false)}
        onImport={async (file) => {
          return await handleImportClos(file);
        }}
        plos={plos}
        isImporting={submittingKey === "import"}
        subjectCode={subject.subjectCode}
      />
    </div>
  );
}
