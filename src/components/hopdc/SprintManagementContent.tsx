"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Loader2 } from "lucide-react";
import { CurriculumService } from "@/services/curriculum.service";
import { TaskItem } from "@/services/task.service";
import { CurriculumDetail as CurriculumDetailView } from "./curriculum/CurriculumDetail";
import { SprintsReceive } from "@/components/hopdc/syllabus/SprintList";

export interface SubjectInfo {
  id: string;
  code: string;
  name: string;
  major: string;
  clos: string[];
  prerequisites: string[];
  status: string;
  credits: number;
  degreeLevel: string;
  timeAllocation: string;
  description: string;
  studentTasks: string;
  scoringScale: number;
  decisionNo: string;
  tool: string | null;
  isApproved: boolean;
  approvedDate: string;
  minToPass: number;
}

interface MajorInfo {
  majorId: string;
  majorCode: string;
  majorName: string;
}

interface PloInfo {
  ploId: string;
  ploCode?: string;
  ploName?: string;
  description: string;
  status?: string;
}

export interface CurriculumDetail {
  curriculumId: string;
  curriculumCode: string;
  curriculumName: string;
  status: string;
  startYear: number;
  major: MajorInfo;
  plos: PloInfo[];
  subjects: SubjectInfo[];
}

export default function SprintManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: isAuthLoading } = useSelector(
    (state: RootState) => state.auth,
  );

  const accountId = user?.accountId;
  const selectedCurriculumId = searchParams.get("curriculumId");
  const selectedSprintId = searchParams.get("sprintId");

  const {
    data: curriculum,
    isLoading: isCurriculumLoading,
    error: curriculumError,
  } = useQuery({
    queryKey: ["hopdc-receive-task-curriculum-detail", selectedCurriculumId],
    enabled: Boolean(selectedCurriculumId),
    queryFn: async () => {
      if (!selectedCurriculumId) {
        return null;
      }

      const res =
        await CurriculumService.getCurriculumById(selectedCurriculumId);
      const envelope = (res as { data?: unknown } | null)?.data;
      const payload =
        (envelope as { data?: unknown } | null)?.data ??
        envelope ??
        (res as unknown);

      const c = (payload as Record<string, unknown>) || {};
      const majorRaw = (c.major as Record<string, unknown>) || {};

      return {
        curriculumId: String(c.curriculumId || selectedCurriculumId),
        curriculumCode: String(c.curriculumCode || "N/A"),
        curriculumName: String(c.curriculumName || "Curriculum"),
        status: String(c.status || "N/A"),
        startYear: Number(c.startYear || 0),
        major: {
          majorId: String(majorRaw.majorId || ""),
          majorCode: String(majorRaw.majorCode || ""),
          majorName: String(majorRaw.majorName || "Unknown"),
        },
        plos: Array.isArray(c.plos) ? (c.plos as PloInfo[]) : [],
        subjects: [],
      } as CurriculumDetail;
    },
  });

  const curriculumDetailError = useMemo(() => {
    if (!curriculumError) {
      return "Failed to load curriculum details.";
    }

    return curriculumError instanceof Error
      ? curriculumError.message
      : "Failed to load curriculum details.";
  }, [curriculumError]);

  const handleOpenTask = (task: TaskItem) => {
    if (!selectedCurriculumId) {
      return;
    }

    if (!task.subjectId) {
      return;
    }

    const params = new URLSearchParams({
      subjectId: task.subjectId,
      curriculumId: selectedCurriculumId,
    });
    const isReuseSubject = task.subjectStatus?.toUpperCase() === "COMPLETED";

    router.push(
      isReuseSubject
        ? `/dashboard/hopdc/sprint-management/reuse-subject?${params.toString()}`
        : `/dashboard/hopdc/sprint-management/new-subject?${params.toString()}`,
    );
  };

  if (selectedCurriculumId) {
    if (isCurriculumLoading || isAuthLoading) {
      return (
        <div className="flex items-center justify-center min-h-100">
          <div className="flex items-center gap-3 text-zinc-500">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-[11px] font-bold uppercase tracking-widest">
              Loading curriculum...
            </span>
          </div>
        </div>
      );
    }

    if (!curriculum) {
      return (
        <div className="max-w-3xl mx-auto p-6">
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
            <p className="text-rose-700 font-bold">Curriculum not found</p>
            <p className="text-rose-500 text-base mt-2">
              {curriculumDetailError}
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="px-3 py-4 sm:px-5 lg:px-6">
        <CurriculumDetailView
          curriculum={curriculum}
          sprintId={selectedSprintId ?? undefined}
          onBack={() => router.push("/dashboard/hopdc/sprint-management")}
          onOpenTask={handleOpenTask}
        />
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[11px] font-bold uppercase tracking-widest">
            Loading account...
          </span>
        </div>
      </div>
    );
  }

  if (!accountId) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-center">
          <p className="text-rose-700 font-bold">Missing account id</p>
          <p className="text-rose-500 text-base mt-2">
            Cannot load assigned sprints for this user.
          </p>
        </div>
      </div>
    );
  }

  return <SprintsReceive accountId={accountId} />;
}
