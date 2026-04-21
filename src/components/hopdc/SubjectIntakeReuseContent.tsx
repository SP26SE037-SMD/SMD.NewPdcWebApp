"use client";

import { useState } from "react";
import { SubjectDetail } from "@/components/hopdc/subject/SubjectDetail";
import { CloPloMapping } from "@/components/hopdc/subject/CloPloMapping";
import { useSubjectMappingLogic } from "@/components/hopdc/hook/CloPloMappingLogic";
import { ArrowLeft } from "lucide-react";

export default function ReuseSubjectContent() {
  const {
    subject,
    isLoading,
    error,
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
    createSingleMapping,
    createAllMappings,
    goToReceiveTasks,
  } = useSubjectMappingLogic();

  const [activeTab, setActiveTab] = useState<"subject" | "mapping">("subject");

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
          Back to Curriculum
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
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === "subject" && <SubjectDetail subject={subject} />}
        {activeTab === "mapping" && (
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
            deletingCloId={null}
            iconBgColor="bg-violet-50"
            iconTextColor="text-violet-700"
          />
        )}
      </div>
    </div>
  );
}
