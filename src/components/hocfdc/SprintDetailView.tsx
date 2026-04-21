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
  CheckCircle2,
  Check,
  Loader2,
  AlertCircle,
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

  const { data: sprintRes, isLoading: sprintLoading } = useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: () => SprintService.getSprintById(sprintId),
  });

  const { data: tasksRes, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", sprintId],
    queryFn: () => TaskService.getTasksBySprintId(sprintId),
  });

  const tasks = ((tasksRes?.data as any)?.content as any[]) || [];
  const totalTasks = tasks.length;
  
  const allTasksDone = totalTasks > 0 && tasks.every((t) => t.status === "DONE");
  const pendingSubjectsCount = tasks.filter((t) => 
    t.status === "DONE" && 
    t.subjectStatus !== "COMPLETED" && 
    t.subjectStatus !== "PUBLISHED"
  ).length;

  const readyTasks = tasks.filter((t) => 
    t.status === "DONE" && 
    (t.subjectStatus === "COMPLETED" || t.subjectStatus === "PUBLISHED")
  ).length;

  const isSprintReadyToComplete = totalTasks > 0 && readyTasks === totalTasks;

  const updateStatusMutation = useMutation({
    mutationFn: ({ sprintId, status }: { sprintId: string; status: string }) =>
      SprintService.updateSprintStatus(sprintId, status),
    onSuccess: (res) => {
      if (res.status === 1000) {
        showToast(`Sprint updated to ${res.data?.status}`, "success");
        queryClient.invalidateQueries({ queryKey: ["sprint", sprintId] });
        
        if (res.data?.status === SPRINT_STATUS.COMPLETED && sprint?.curriculumId) {
          window.location.href = `/dashboard/hocfdc/framework-execution/${sprint.curriculumId}`;
        }
      } else {
        showToast(res.message || "Update failed", "error");
      }
    },
    onError: (err: any) =>
      showToast(err.message || "Connection error", "error"),
  });

  const handleStatusChange = (sprintId: string, newStatus: string) => {
    updateStatusMutation.mutate({ sprintId, status: newStatus });
  };

  const batchMutation = useMutation({
    mutationFn: async () => {
      const sprint = sprintRes?.data;
      if (!sprint || !sprint.curriculumId || !sprint.departmentId) {
        throw new Error(
          "Missing sprint metadata (Curriculum/Department) for status sync.",
        );
      }
      const batchRes = await TaskService.createBatchTasks(sprintId);
      if (batchRes.status !== 1000) {
        throw new Error(batchRes.message || "Failed to generate tasks");
      }
      const statusRes = await SubjectService.updateSubjectStatusesBulk(
        sprint.curriculumId,
        SUBJECT_STATUS.WAITING_SYLLABUS,
        sprint.departmentId,
        SUBJECT_STATUS.DEFINED,
      );
      if (statusRes.status !== 1000) {
        throw new Error("Tasks generated, but failed to sync subject statuses.");
      }
      return batchRes;
    },
    onSuccess: (res) => {
      showToast("Tasks generated successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["tasks", sprintId] });
      router.refresh();
    },
    onError: (err: any) => {
      const isAlreadyAdded = err.status === 400 && err.data?.status === 25006;
      showToast(isAlreadyAdded ? "All subjects already added" : (err.data?.message || err.message), "error");
    },
  });

  const sprint = sprintRes?.data;
  const isLoading = sprintLoading;

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
              {sprint.status === SPRINT_STATUS.IN_PROGRESS && (
                <button
                  onClick={() => {
                    if (!isSprintReadyToComplete) {
                      showToast(
                        `Cannot complete: All tasks must be DONE and all subjects must be COMPLETED or PUBLISHED. (${readyTasks}/${totalTasks} ready)`,
                        "error",
                      );
                      return;
                    }
                    handleStatusChange(
                      sprint.sprintId,
                      SPRINT_STATUS.COMPLETED,
                    );
                  }}
                  disabled={updateStatusMutation.isPending || tasksLoading || (totalTasks > 0 && !isSprintReadyToComplete)}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 rounded-xl disabled:bg-zinc-200 disabled:text-zinc-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  COMPLETE SPRINT
                </button>
              )}
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

      {/* Warning Banner for Pending Subjects */}
      {allTasksDone && pendingSubjectsCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 shadow-sm"
        >
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Pending Subject Approvals</h4>
            <p className="text-xs text-amber-700 font-medium">
              All tasks are <span className="font-bold">DONE</span>, but there are still <span className="font-bold">{pendingSubjectsCount}</span> subjects that need to be reviewed and approved before you can complete this sprint.
            </p>
          </div>
        </motion.div>
      )}

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
