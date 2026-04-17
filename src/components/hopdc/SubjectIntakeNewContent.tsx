"use client";

import { useState } from "react";
import { SubjectDetail } from "@/components/hopdc/subject/SubjectDetail";
import { CreateCloModal } from "@/components/hopdc/subject/CreateCloModal";
import { CreateSyllabusModal } from "@/components/hopdc/subject/CreateSyllabusModal";
import { CloPloMapping } from "@/components/hopdc/subject/CloPloMapping";
import { useNewSubjectLogic } from "@/components/hopdc/hook/NewSubjectLogic";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SYLLABUS_STATUS } from "@/services/syllabus.service";
import { ManageSyllabusSourcesModal } from "./syllabus/ManageSyllabusSourcesModal";
import { SyllabusWorkspaceView } from "@/components/common/syllabus/SyllabusWorkspaceView";

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
    isCreateSyllabusModalOpen,
    setIsCreateSyllabusModalOpen,
    plos,
    clos,
    isPloLoading,
    isCloLoading,
    localMapping,
    setLocalMapping,
    localContributionLevel,
    setLocalContributionLevel,
    submittingKey,
    createdMappings,
    mappingNotice,
    deletingCloId,
    syllabusNotice,
    deletingSyllabusId,
    isSyllabusLoading,
    draftSyllabi,
    createSingleMapping,
    createAllMappings,
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
  } = useNewSubjectLogic();

  const router = useRouter();
  const [isSyllabusConfirmOpen, setIsSyllabusConfirmOpen] = useState(false);
  const [syllabusToArchive, setSyllabusToArchive] = useState<string | null>(
    null,
  );
  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [selectedSyllabusIdForSources, setSelectedSyllabusIdForSources] =
    useState("");
  const [selectedSyllabusNameForSources, setSelectedSyllabusNameForSources] =
    useState("");

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
      id: SYLLABUS_STATUS.REVISION_REQUESTED,
      label: "Revision Requested",
      icon: AlertCircleIcon,
      color: "#f43f5e",
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

  const StatusStepper = ({ currentStatus }: { currentStatus: string }) => {
    // Normalize DB status strings to handle "in progress" -> "IN_PROGRESS" mismatches
    const normalizedStatus = (currentStatus || "DRAFT")
      .toUpperCase()
      .replace(/\s+/g, "_");

    // Determine dynamic branch state
    const isRevision = normalizedStatus === SYLLABUS_STATUS.REVISION_REQUESTED;
    const isApproved =
      normalizedStatus === SYLLABUS_STATUS.APPROVED ||
      normalizedStatus === SYLLABUS_STATUS.PUBLISHED;
    const isPastDecision = isRevision || isApproved;

    // Dynamically build the 4 steps representing the logical lifecycle
    // Flow: Draft -> In Progress -> Pending Review -> [Decision] -> Published
    const steps = [
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
        id: "DECISION_NODE",
        label: isRevision
          ? "Revision Req"
          : isApproved
            ? "Approved"
            : "Reviewing...",
        icon: isRevision ? AlertCircleIcon : isApproved ? CheckCircle2 : Clock,
        color: isRevision ? "#f43f5e" : isApproved ? "#10b981" : "#a1a1aa",
      },
      {
        id: SYLLABUS_STATUS.PUBLISHED,
        label: "Published",
        icon: Rocket,
        color: "#06b6d4",
      },
    ];

    // Determine the active index based on current status
    let activeIdx = 0; // Default is Draft
    if (normalizedStatus === SYLLABUS_STATUS.IN_PROGRESS) {
      activeIdx = 1;
    } else if (
      normalizedStatus === SYLLABUS_STATUS.PENDING_REVIEW ||
      normalizedStatus === "REVIEWING"
    ) {
      activeIdx = 2;
    } else if (isRevision || normalizedStatus === SYLLABUS_STATUS.APPROVED) {
      activeIdx = 3; // Decision Node
    } else if (normalizedStatus === SYLLABUS_STATUS.PUBLISHED) {
      activeIdx = 4;
    }

    return (
      <div className="flex items-center gap-1 overflow-hidden py-2 px-1">
        {steps.map((statusItem, idx) => {
          const isCompleted = idx < activeIdx;
          const isActive = idx === activeIdx;
          const Icon = statusItem.icon;

          return (
            <div key={statusItem.id} className="flex items-center">
              <div className="flex flex-col items-center relative min-w-[70px]">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 0.9,
                    backgroundColor:
                      isActive || isCompleted
                        ? statusItem.color
                        : "rgb(255, 255, 255)",
                    borderColor:
                      isActive || isCompleted
                        ? statusItem.color
                        : "rgb(244, 244, 245)",
                    color:
                      isActive || isCompleted ? "white" : "rgb(161, 161, 170)",
                  }}
                  className="w-8 h-8 rounded-xl border-2 flex items-center justify-center shadow-sm transition-all duration-500 z-10 relative"
                >
                  <Icon size={14} strokeWidth={2.5} />
                </motion.div>
                <span
                  className={`text-[10px] font-bold mt-1.5 whitespace-nowrap ${isActive ? "text-zinc-900" : "text-zinc-400"}`}
                >
                  {statusItem.label}
                </span>
              </div>

              {idx < steps.length - 1 && (
                <div className="w-8 h-[2px] bg-zinc-100 mx-0.5 rounded-full relative overflow-hidden shrink-0">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: isCompleted ? "100%" : "0%",
                      backgroundColor: statusItem.color,
                    }}
                    className="h-full"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

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
          <button
            onClick={() => setActiveTab("syllabus")}
            className={`px-6 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
              activeTab === "syllabus"
                ? "bg-white text-[#0b7a47] shadow-sm"
                : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            Syllabus
          </button>
        </div>
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
              createdMappings={createdMappings}
              localMapping={localMapping}
              localContributionLevel={localContributionLevel}
              submittingKey={submittingKey}
              mappingNotice={mappingNotice}
              onLocalMappingChange={(cloId, ploId) =>
                setLocalMapping((prev) => ({
                  ...prev,
                  [cloId]: ploId,
                }))
              }
              onLocalContributionLevelChange={(cloId, level) =>
                setLocalContributionLevel((prev) => ({
                  ...prev,
                  [cloId]: level,
                }))
              }
              onCreateSingleMapping={createSingleMapping}
              onCreateAllMappings={createAllMappings}
              onCreateClo={() => setIsCreateCloModalOpen(true)}
              onDeleteClo={deleteClo}
              deletingCloId={deletingCloId}
              iconBgColor="bg-emerald-50"
              iconTextColor="text-emerald-700"
            />
          </div>
        )}

        {/* Tab 2: Syllabus */}
        {activeTab === "syllabus" && (
          <div className="animate-in fade-in duration-300">
            <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm p-6 md:p-7 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <BookPlus size={18} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-zinc-900">
                      Syllabus
                    </h2>
                    <p className="text-sm text-zinc-500">
                      Manage and track syllabus lifecycles for the current
                      sprint.
                    </p>
                  </div>
                </div>
              </div>

              {(isTaskLoading || isPublishedSyllabusLoading) && (
                <div className="flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              )}

              {!isTaskLoading && !isPublishedSyllabusLoading && sprintId && (
                <div className="animate-in fade-in duration-500">
                  {associatedTask?.type === "REUSED_SUBJECT" ? (
                    publishedSyllabus ? (
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

                        <div className="flex-1 max-w-md bg-white/60 rounded-2xl p-2 border border-cyan-100/50">
                          <StatusStepper
                            currentStatus={SYLLABUS_STATUS.PUBLISHED}
                          />
                        </div>

                        <button
                          onClick={() => {
                            setSelectedSyllabusIdForSources(
                              publishedSyllabus.syllabusId,
                            );
                            setSelectedSyllabusNameForSources(
                              publishedSyllabus.syllabusName,
                            );
                            setIsSourcesModalOpen(true);
                          }}
                          className="flex items-center gap-2 rounded-xl bg-cyan-100 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-cyan-700 hover:bg-cyan-200 transition-all border border-cyan-200 shadow-sm shadow-cyan-50"
                        >
                          <BookText size={14} />
                          Manage Sources
                        </button>
                      </div>
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
                  ) : associatedTask?.syllabus?.syllabusId ? (
                    <>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest leading-none mb-1">
                              Current Assignment
                            </p>
                            <p className="text-base font-black text-emerald-900">
                              {associatedTask.syllabus.syllabusName}
                            </p>
                          </div>
                        </div>

                        <div className="flex-1 max-w-md bg-white/60 rounded-2xl p-2 border border-emerald-100/50">
                          <StatusStepper
                            currentStatus={
                              currentSyllabus?.status || associatedTask.syllabus.status || "DRAFT"
                            }
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (associatedTask.syllabus) {
                              setSelectedSyllabusIdForSources(
                                associatedTask.syllabus.syllabusId,
                              );
                              setSelectedSyllabusNameForSources(
                                associatedTask.syllabus.syllabusName,
                              );
                              setIsSourcesModalOpen(true);
                            }
                          }}
                          className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-200 transition-all border border-emerald-200 shadow-sm shadow-emerald-50"
                        >
                          <BookText size={14} />
                        </button>
                      </div>

                      {/* Syllabus Monitor Section */}
                      <div className="pt-8 border-t border-zinc-100">
                        <div className="flex items-center gap-2 mb-6">
                          <div className="h-2 w-2 rounded-full bg-[#0b7a47] animate-pulse" />
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#0b7a47]">
                            Syllabus Real-time Monitor
                          </h3>
                        </div>
                        <div className="bg-[#f8faf2]/50 rounded-3xl p-6 border border-[#dee1d8]/30">
                          <SyllabusWorkspaceView
                            syllabusId={associatedTask.syllabus.syllabusId}
                            mode="MONITOR"
                            onOpenMaterial={(m) => {
                              router.push(
                                `/dashboard/hopdc/materials/${m.materialId}?title=${encodeURIComponent(m.title)}&syllabusId=${associatedTask?.syllabus?.syllabusId}`,
                              );
                            }}
                          />
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
                          This subject has not been assigned a syllabus for the
                          current sprint task yet.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
        minBloomLevel={subject.minBloomLevel || 0}
        isOpen={isCreateCloModalOpen}
        onClose={() => setIsCreateCloModalOpen(false)}
        onSuccess={handleCloModalSuccess}
      />

      <CreateSyllabusModal
        subjectId={subject.subjectId}
        accountEmail={user?.email || ""}
        minBloomLevel={subject.minBloomLevel || 0}
        minAvgGrade={subject.minToPass || 0}
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
    </div>
  );
}
