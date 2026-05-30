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
import {
  SPRINT_STATUS,
  SprintItem,
  SprintStatus,
} from "@/services/sprint.service";
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
  actions?:
    | React.ReactNode
    | ((
        totalTasks: number,
        closedTasks: number,
        isLoading: boolean,
      ) => React.ReactNode);
  type?: string;
}

export const SprintCard = ({
  sprint,
  index,
  departmentId,
  formatDate,
  detailHref,
  actions,
  type,
}: SprintCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch tasks for this sprint to get counts and short list
  const { data: tasksRes, isLoading: isTasksLoading } = useQuery({
    queryKey: ["tasks", sprint.sprintId, departmentId, type],
    queryFn: () =>
      departmentId
        ? TaskService.getTasksBySprintIdAndDepartmentId(
            sprint.sprintId,
            departmentId,
            undefined,
            type,
          )
        : TaskService.getTasksBySprintId(sprint.sprintId, undefined, type),
    enabled: true,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const tasks = (tasksRes?.content || []) as TaskItem[];
  const totalTasks = tasks.length;
  const closedTasks = tasks.filter((t) => t.status === TASK_STATUS.DONE).length;
  const progressPercent = totalTasks > 0 ? (closedTasks / totalTasks) * 100 : 0;

  const config = getStatusConfig(sprint.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative bg-white border border-zinc-200/60 hover:border-[#409b43]/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 rounded-[24px] overflow-hidden"
    >
      <div className="flex flex-col lg:flex-row items-stretch">
        {/* Left Status Bar */}
        <div
          className={`w-1.5 ${config.color} group-hover:scale-y-110 transition-transform duration-500`}
        />

        {/* Main Header Info */}
        <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gradient-to-r from-transparent to-zinc-50/30">
          {/* Section 1: Title & Dates */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-700"
                title={isExpanded ? "Collapse Tasks" : "Expand Tasks"}
              >
                {isExpanded ? (
                  <ChevronDown size={16} strokeWidth={2.5} />
                ) : (
                  <ChevronRight size={16} strokeWidth={2.5} />
                )}
              </button>
              <span
                className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${config.bg} ${config.text} rounded-lg ring-1 ring-current/10`}
              >
                {sprint.status.replace("_", " ")}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100/80 px-2 py-0.5 rounded-md">
                #{sprint.sprintId.substring(0, 6)}
              </span>
            </div>

            <Link
              href={detailHref}
              className="block text-xl font-extrabold text-[#2d342b] tracking-tight hover:text-[#409b43] transition-colors cursor-pointer"
              style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
            >
              {sprint.sprintName}
            </Link>

            <div className="flex items-center gap-3 text-xs font-semibold text-zinc-500">
              <span className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-100">
                <Calendar size={14} className="text-zinc-400" />{" "}
                {formatDate(sprint.startDate)}
              </span>
              <span className="text-zinc-300">→</span>
              <span className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-md border border-zinc-100">
                <Target size={14} className="text-zinc-400" />{" "}
                {formatDate(sprint.endDate)}
              </span>
            </div>
          </div>

          {/* Section 2: Timeline & Task Stats (Refined Middle Column) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-6 lg:border-l border-zinc-100 lg:pl-8">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <Clock size={12} />
                {sprint.status === SPRINT_STATUS.IN_PROGRESS
                  ? "Remaining Days"
                  : "Total Days"}
              </p>
              <div className="flex items-end gap-1.5">
                <span
                  className="text-3xl font-black text-zinc-900 tracking-tighter leading-none"
                  style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                  {sprint.status === SPRINT_STATUS.IN_PROGRESS
                    ? calculateRemainingDays(sprint.endDate)
                    : Math.ceil(
                        (new Date(sprint.endDate).getTime() -
                          new Date(sprint.startDate).getTime()) /
                          (1000 * 3600 * 24),
                      )}
                </span>
                <span className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                  Days
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 size={12} /> Department Tasks
                </p>
                <p className="text-xs font-black text-zinc-800">
                  {closedTasks} <span className="text-zinc-300 mx-0.5">/</span>{" "}
                  {totalTasks}
                </p>
              </div>
              {/* Progress Bar (Rounded) */}
              <div className="h-2.5 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={`h-full ${config.color} transition-all duration-1000 rounded-full relative`}
                >
                  <div className="absolute inset-0 bg-white/20"></div>
                </motion.div>
              </div>
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest text-right">
                {Math.round(progressPercent)}% COMPLETED
              </p>
            </div>
          </div>

          {/* Section 3: Actions */}
          <div className="lg:col-span-3 flex justify-end items-center gap-2">
            {typeof actions === "function"
              ? actions(totalTasks, closedTasks, isTasksLoading)
              : actions}
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
            className="overflow-hidden bg-[#fafafa] border-t border-zinc-100 relative"
          >
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/[0.02] to-transparent pointer-events-none"></div>
            <div className="p-8 space-y-4">
              {isTasksLoading ? (
                <div className="flex items-center justify-center gap-3 text-zinc-400 py-8">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Loading Department Tasks...
                  </span>
                </div>
              ) : tasks.length > 0 ? (
                <div className="grid grid-cols-1 gap-2.5">
                  {tasks.map((task, idx) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={task.taskId}
                      className="flex items-center justify-between p-4 bg-white border border-zinc-100 shadow-sm group/task hover:shadow-md hover:border-zinc-300 transition-all rounded-[16px]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 shrink-0">
                          <span className="text-[9px] font-black text-zinc-400 uppercase">
                            #{task.taskId.substring(0, 4)}
                          </span>
                        </div>
                        <span className="text-[13px] font-bold text-zinc-700 group-hover/task:text-[#409b43] transition-colors">
                          {task.taskName}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg ring-1 ${
                            task.status === TASK_STATUS.DONE
                              ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                              : "bg-zinc-50 text-zinc-400 ring-zinc-200"
                          }`}
                        >
                          {task.status.replace("_", " ")}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center bg-white rounded-2xl border border-dashed border-zinc-200">
                  <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target size={20} className="text-zinc-300" />
                  </div>
                  <p className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">
                    No department tasks mapped to this phase
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
