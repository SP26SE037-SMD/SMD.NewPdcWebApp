"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  Plus,
  Layout,
  Target,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { SprintService, SPRINT_STATUS } from "@/services/sprint.service";
import { TaskService } from "@/services/task.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { SprintTasksTable } from "./SprintTasksTable";
import { useToast } from "@/components/ui/Toast";
import { CreateTaskModal } from "./CreateTaskModal";

interface SprintDetailViewProps {
  sprintId: string;
}

export const SprintDetailView: React.FC<SprintDetailViewProps> = ({
  sprintId,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { data: sprintRes, isLoading } = useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: () => SprintService.getSprintById(sprintId),
  });

  const batchMutation = useMutation({
    mutationFn: async () => {
      const sprint = sprintRes?.data;
      if (!sprint || !sprint.curriculumId || !sprint.departmentId) {
        throw new Error(
          "Missing sprint metadata (Curriculum/Department) for status sync.",
        );
      }

      // Step 1: Create Batch Tasks
      const batchRes = await TaskService.createBatchTasks(sprintId);
      if (batchRes.status !== 1000) {
        throw new Error(batchRes.message || "Failed to generate tasks");
      }

      // Step 2: Update Subject Status Bulk
      const statusRes = await SubjectService.updateSubjectStatusesBulk(
        sprint.curriculumId,
        SUBJECT_STATUS.WAITING_SYLLABUS,
        sprint.departmentId,
        SUBJECT_STATUS.DEFINED,
      );

      if (statusRes.status !== 1000) {
        throw new Error(
          "Tasks generated, but failed to sync subject statuses.",
        );
      }

      return batchRes;
    },
    onSuccess: (res) => {
      showToast(
        "Tasks generated and Subject statuses synchronized successfully",
        "success",
      );
      queryClient.invalidateQueries({ queryKey: ["tasks", sprintId] });
      router.refresh();
    },
    onError: (err: any) => {
      console.error("[BATCH MUTATION ERROR]", err);

      // Specifically handle the "already added all subjects" case (HTTP 400, Status 25006)
      const isAlreadyAdded = err.status === 400 && err.data?.status === 25006;

      const errorMessage = isAlreadyAdded
        ? "You have already added all subjects for this Sprint"
        : err.data?.message ||
          err.message ||
          "An error occurred during synchronization";

      showToast(errorMessage, "error");
    },
  });

  const sprint = sprintRes?.data;

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent animate-spin rounded-full" />
          <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">
            Loading Sprint Intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="p-8 text-center border border-zinc-100 bg-white rounded-2xl shadow-sm">
        <p className="font-bold text-zinc-500">Sprint not found.</p>
      </div>
    );
  }

  return (
    <div className="px-8 pt-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Back Button & Breadcrumb */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 border border-zinc-200 bg-white hover:bg-zinc-900 hover:text-white transition-all rounded-xl group shadow-sm"
        >
          <ChevronLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
        </button>
        <div className="flex flex-col">
          <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">
            Campaign / Sprint Detail
          </p>
          <h1 className="font-black text-2xl tracking-tight text-zinc-900">
            Sprint Management
          </h1>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-white border border-zinc-100 shadow-sm rounded-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Layout size={120} />
        </div>

        <div className="p-8 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${
                    sprint.status === SPRINT_STATUS.IN_PROGRESS
                      ? "bg-emerald-50 text-emerald-600 border-emerald-500/20"
                      : sprint.status === SPRINT_STATUS.PLANNING
                        ? "bg-amber-50 text-amber-600 border-amber-500/20"
                        : sprint.status === SPRINT_STATUS.COMPLETED
                          ? "bg-blue-50 text-blue-600 border-blue-500/20"
                          : sprint.status === SPRINT_STATUS.CANCELLED
                            ? "bg-rose-50 text-rose-600 border-rose-500/20"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200"
                  }`}
                >
                  {sprint.status}
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight text-zinc-900">
                {sprint.sprintName}
              </h2>
              <div className="flex items-center gap-6 text-sm font-bold text-zinc-500">
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-zinc-400" />
                  <span>{new Date(sprint.startDate).toLocaleDateString()}</span>
                  <ArrowRight size={14} className="text-zinc-300 mx-1" />
                  <span>{new Date(sprint.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="flex items-center gap-3 bg-zinc-100 text-zinc-900 px-8 py-4 font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Add Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-lg tracking-tight text-zinc-900">
            Department Deliverables
          </h3>
          {/* <div className="flex items-center gap-2 px-3 py-1 bg-white border border-zinc-100 rounded-lg shadow-sm">
            <div className="w-2 h-2 bg-zinc-900 rounded-full" />
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none">
              Real-time status
            </p>
          </div> */}
        </div>

        <SprintTasksTable 
          sprintId={sprintId} 
          sprintEndDate={sprint.endDate} 
          sprintStatus={sprint.status}
        />
      </div>

      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        sprintId={sprintId}
        curriculumId={sprint?.curriculumId || ""}
        departmentId={sprint?.departmentId || ""}
      />
    </div>
  );
};
