"use client";

import { useMemo, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { Loader2 } from "lucide-react";
import { CurriculumService } from "@/services/curriculum.service";
import { TaskItem } from "@/services/task.service";
import { CurriculumDetail as CurriculumDetailView } from "./curriculum/CurriculumDetail";
import { SprintsReceive } from "@/components/hopdc/syllabus/SprintList";
import { TaskList } from "@/components/hopdc/syllabus/TaskList";

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
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"single-tasks" | "sprint-tasks">(
    "single-tasks",
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const accountId = user?.accountId;
  const selectedCurriculumId = searchParams.get("curriculumId");
  const selectedSprintId = searchParams.get("sprintId");

  const queryClient = useQueryClient();

  // Force revalidation of all management data on mount
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["sprints"] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
    if (selectedCurriculumId) {
      queryClient.invalidateQueries({
        queryKey: [
          "hopdc-receive-task-curriculum-detail",
          selectedCurriculumId,
        ],
      });
    }
  }, [queryClient, selectedCurriculumId]);

  const {
    data: curriculum,
    isLoading: isCurriculumLoading,
    error: curriculumError,
  } = useQuery({
    queryKey: ["hopdc-receive-task-curriculum-detail", selectedCurriculumId],
    enabled: Boolean(selectedCurriculumId),
    staleTime: 0,
    refetchOnMount: "always",
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
        ? `/dashboard/hopdc/department-tasks/reuse-subject?${params.toString()}`
        : `/dashboard/hopdc/department-tasks/new-subject?${params.toString()}`,
    );
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-[11px] font-bold uppercase tracking-widest">
            Loading...
          </span>
        </div>
      </div>
    );
  }

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
          onBack={() => router.push("/dashboard/hopdc/department-tasks")}
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
            Cannot load assigned work packages for this user.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans">
      {/* Tabs header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 pb-4 mb-6">
        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">
          Tasks Management
        </h1>
        <div className="flex border border-zinc-100 p-1 bg-zinc-50 rounded-xl">
          <button
            onClick={() => setActiveTab("single-tasks")}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg whitespace-nowrap outline-none ${
              activeTab === "single-tasks"
                ? "bg-[#2d6a4f] text-white shadow-md shadow-[#2d6a4f]/20"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Single Tasks
          </button>
          <button
            onClick={() => setActiveTab("sprint-tasks")}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg whitespace-nowrap outline-none ${
              activeTab === "sprint-tasks"
                ? "bg-[#2d6a4f] text-white shadow-md shadow-[#2d6a4f]/20"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            Manage by Phase
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === "single-tasks" ? (
          <TaskList sprintId="" isSingleTaskMode={true} />
        ) : (
          <SprintsReceive accountId={accountId} hideTitle={true} />
        )}
      </div>
    </div>
  );
}
