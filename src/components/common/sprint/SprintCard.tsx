"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SPRINT_STATUS, SprintItem, SprintStatus } from "@/services/sprint.service";
import { TaskService, TaskItem, TASK_STATUS } from "@/services/task.service";

// Helper for conditional timeline
export const calculateRemainingDays = (endDateStr: string) => {
  const diff = new Date(endDateStr).getTime() - new Date().getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days > 0 ? days : 0;
};

// Helper to get status configuration
export const getStatusConfig = (status: SprintStatus | string) => {
  const s = status.toUpperCase();
  switch (s) {
    case SPRINT_STATUS.IN_PROGRESS:
      return {
        color: "bg-emerald-500",
        text: "text-emerald-600",
        bg: "bg-emerald-50",
        icon: Clock,
      };
    case SPRINT_STATUS.PLANNING:
      return {
        color: "bg-amber-500",
        text: "text-amber-600",
        bg: "bg-amber-50",
        icon: Calendar,
      };
    case SPRINT_STATUS.COMPLETED:
      return {
        color: "bg-blue-500",
        text: "text-blue-600",
        bg: "bg-blue-50",
        icon: CheckCircle2,
      };
    case SPRINT_STATUS.CANCELLED:
      return {
        color: "bg-rose-500",
        text: "text-rose-600",
        bg: "bg-rose-50",
        icon: AlertCircle,
      };
    default:
      return {
        color: "bg-zinc-400",
        text: "text-zinc-600",
        bg: "bg-zinc-50",
        icon: AlertCircle,
      };
  }
};

interface SprintCardProps {
  sprint: SprintItem;
  index: number;
  departmentId?: string;
  formatDate: (d: string) => string;
  detailHref: string;
  actions?: React.ReactNode | ((totalTasks: number, closedTasks: number, isLoading: boolean) => React.ReactNode);
}

export const SprintCard = ({
  sprint,
  index,
  departmentId,
  formatDate,
  detailHref,
  actions,
}: SprintCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch tasks for this sprint to get counts and short list
  const { data: tasksRes, isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks", sprint.sprintId, departmentId],
    queryFn: () =>
      departmentId
        ? TaskService.getTasksBySprintIdAndDepartmentId(
            sprint.sprintId,
            departmentId,
          )
        : TaskService.getTasksBySprintId(sprint.sprintId),
    enabled: true,
  });

  const tasks = ((tasksRes?.data as { content?: TaskItem[] } | undefined)
    ?.content || []) as TaskItem[];
  const totalTasks = tasks.length;
  const closedTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE).length;
  const progressPercent = totalTasks > 0 ? (closedTasks / totalTasks) * 100 : 0;

  const config = getStatusConfig(sprint.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white border border-zinc-100 hover:border-zinc-300 transition-all rounded-2xl overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row items-stretch">
        {/* Left Status Bar */}
        <div className={`w-2 ${config.color}`} />

        {/* Main Header Info */}
        <div className="flex-1 p-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Section 1: Title & Dates */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-zinc-100 rounded-lg transition-colors"
                title={isExpanded ? "Collapse Tasks" : "Expand Tasks"}
              >
                {isExpanded ? (
                  <ChevronDown size={14} />
                ) : (
                  <ChevronRight size={14} />
                )}
              </button>
              <span
                className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${config.bg} ${config.text} border border-current/20 rounded-md`}
              >
                {sprint.status}
              </span>
              <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                #{sprint.sprintId.substring(0, 6)}
              </span>
            </div>

            <Link
              href={detailHref}
              className="block text-xl font-black text-zinc-900 tracking-tight hover:text-primary transition-colors cursor-pointer"
            >
              {sprint.sprintName}
            </Link>

            <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Calendar size={14} /> {formatDate(sprint.startDate)}
              </span>
              <span className="text-zinc-200">/</span>
              <span className="flex items-center gap-1.5">
                <Target size={14} /> {formatDate(sprint.endDate)}
              </span>
            </div>
          </div>

          {/* Section 2: Timeline & Task Stats (Refined Middle Column) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8 border-l border-zinc-100 pl-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {sprint.status === SPRINT_STATUS.IN_PROGRESS
                  ? "Remaining Days"
                  : "Total Days"}
              </p>
              <div className="flex items-end gap-2 text-sans">
                <span className="text-2xl font-black text-zinc-900 tracking-tighter">
                  {sprint.status === SPRINT_STATUS.IN_PROGRESS
                    ? `${calculateRemainingDays(sprint.endDate)} Days`
                    : `${Math.ceil((new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 3600 * 24))} Days`}
                </span>
                <span className="text-[9px] font-bold text-zinc-300 uppercase mb-1">
                  {sprint.status === SPRINT_STATUS.IN_PROGRESS
                    ? "REMAINING"
                    : "DURATION"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Deliverables
                </p>
                <p className="text-[10px] font-black text-zinc-900 uppercase">
                  {closedTasks} <span className="text-zinc-300">/</span>{" "}
                  {totalTasks}
                </p>
              </div>
              {/* Progress Bar (Rounded) */}
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={`h-full ${config.color} transition-all duration-1000 rounded-full`}
                />
              </div>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">
                {closedTasks} CLOSED
              </p>
            </div>
          </div>

          {/* Section 3: Actions */}
          <div className="lg:col-span-3 flex justify-end items-center gap-2">
            {typeof actions === "function" 
              ? actions(totalTasks, closedTasks, isTasksLoading) 
              : actions
            }
          </div>
        </div>
      </div>

      {/* Accordion Expansion: Task List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-50/50 border-t border-zinc-100"
          >
            <div className="p-6 pt-2 space-y-3">
              {isTasksLoading ? (
                <div className="flex items-center gap-2 text-zinc-400 py-4">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Fetching Tasks...
                  </span>
                </div>
              ) : tasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-1">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.taskId}
                      className="flex items-center justify-between p-3 bg-white border border-zinc-100 group/task hover:border-zinc-300 transition-all hover:translate-x-1 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-300 uppercase">
                          #{task.taskId.substring(0, 4)}
                        </span>
                        <span className="text-sm font-bold text-zinc-600 group-hover/task:text-zinc-900 transition-colors">
                          {task.taskName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border rounded-md ${
                            task.status === TASK_STATUS.DONE
                              ? "border-emerald-100 text-emerald-600 bg-emerald-50"
                              : "border-zinc-200 text-zinc-400 bg-zinc-50"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center border-2 border-dashed border-zinc-200">
                  <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em]">
                    No tasks initialized for this cycle
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
