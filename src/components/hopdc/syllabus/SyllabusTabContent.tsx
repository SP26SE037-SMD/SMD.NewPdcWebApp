"use client";

import { useRouter } from "next/navigation";
import {
  Rocket,
  BookText,
  Archive,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { SYLLABUS_STATUS } from "@/services/syllabus.service";
import { SyllabusWorkspaceView } from "@/components/common/syllabus/SyllabusWorkspaceView";
import { StatusStepper } from "./StatusStepper";

interface SyllabusTabContentProps {
  associatedTask: any;
  publishedSyllabus: any;
  currentSyllabus: any;
  isTaskLoading: boolean;
  isPublishedSyllabusLoading: boolean;
  isReadOnly: boolean;
  sprintId: string | null;
  setSelectedSyllabusIdForSources: (id: string) => void;
  setSelectedSyllabusNameForSources: (name: string) => void;
  setIsSourcesModalOpen: (open: boolean) => void;
}

export function SyllabusTabContent({
  associatedTask,
  publishedSyllabus,
  currentSyllabus,
  isTaskLoading,
  isPublishedSyllabusLoading,
  isReadOnly,
  sprintId,
  setSelectedSyllabusIdForSources,
  setSelectedSyllabusNameForSources,
  setIsSourcesModalOpen,
}: SyllabusTabContentProps) {
  const router = useRouter();

  if (isTaskLoading || isPublishedSyllabusLoading || !sprintId) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      {associatedTask?.type === "REUSED_SUBJECT" ? (
        publishedSyllabus ? (
          <>
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
                <StatusStepper currentStatus={SYLLABUS_STATUS.PUBLISHED} />
              </div>

              {!isReadOnly && (
                <button
                  onClick={() => {
                    setSelectedSyllabusIdForSources(publishedSyllabus.syllabusId);
                    setSelectedSyllabusNameForSources(publishedSyllabus.syllabusName);
                    setIsSourcesModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl bg-cyan-100 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-cyan-700 hover:bg-cyan-200 transition-all border border-cyan-200 shadow-sm shadow-cyan-50"
                >
                  <BookText size={14} />
                  Manage Sources
                </button>
              )}
            </div>

            <div className="pt-8 border-t border-zinc-100 mt-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
                  Published Syllabus Monitor
                </h3>
              </div>
              <div className="bg-cyan-50/10 rounded-3xl p-6 border border-cyan-100/30 shadow-inner">
                <SyllabusWorkspaceView
                  syllabusId={publishedSyllabus.syllabusId}
                  mode="MONITOR"
                  onOpenMaterial={(m) => {
                    router.push(
                      `/dashboard/hopdc/materials/${m.materialId}?title=${encodeURIComponent(m.title)}&syllabusId=${publishedSyllabus.syllabusId}`,
                    );
                  }}
                />
              </div>
            </div>
          </>
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
                  currentSyllabus?.status || "DRAFT"
                }
              />
            </div>

            {!isReadOnly && (
              <button
                onClick={() => {
                  if (currentSyllabus) {
                    setSelectedSyllabusIdForSources(currentSyllabus.syllabusId);
                    setSelectedSyllabusNameForSources(currentSyllabus.syllabusName);
                    setIsSourcesModalOpen(true);
                  }
                }}
                className="flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-200 transition-all border border-emerald-200 shadow-sm shadow-emerald-50"
              >
                <BookText size={14} />
              </button>
            )}
          </div>

          <div className="pt-8 border-t border-zinc-100">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-2 w-2 rounded-full bg-[#0b7a47] animate-pulse" />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#0b7a47]">
                Syllabus Real-time Monitor
              </h3>
            </div>
            <div className="bg-[#f8faf2]/50 rounded-3xl p-6 border border-[#dee1d8]/30">
              <SyllabusWorkspaceView
                syllabusId={currentSyllabus?.syllabusId}
                mode="MONITOR"
                onOpenMaterial={(m) => {
                  router.push(
                    `/dashboard/hopdc/materials/${m.materialId}?title=${encodeURIComponent(m.title)}&syllabusId=${currentSyllabus?.syllabusId}`,
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
              This subject has not been assigned a syllabus for the current curriculum deliverables yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
