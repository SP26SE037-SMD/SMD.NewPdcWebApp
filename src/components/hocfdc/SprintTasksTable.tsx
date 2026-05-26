"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreVertical,
  User,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Zap,
  Tag,
  Check,
  Trash2,
  Loader2,
  Pencil,
} from "lucide-react";
import { TaskService, TaskItem, TASK_STATUS } from "@/services/task.service";
import { SPRINT_STATUS } from "@/services/sprint.service";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

interface SprintTasksTableProps {
  tasks: (TaskItem & { children?: TaskItem[] })[];
  isLoading: boolean;
  sprintId: string;
  sprintEndDate?: string;
  sprintStatus?: string;
  curriculumId: string;
  onEdit: (task: TaskItem) => void;
  onViewDetails: (task: TaskItem & { children?: TaskItem[] }) => void;
}

export const SprintTasksTable: React.FC<SprintTasksTableProps> = ({
  tasks,
  isLoading,
  sprintId,
  sprintEndDate,
  sprintStatus,
  curriculumId,
  onEdit,
  onViewDetails,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => TaskService.deleteTask(taskId),
    onSuccess: (res) => {
      if (res.status === 1000) {
        showToast("Task removed from deliverable package", "success");
        queryClient.invalidateQueries({ queryKey: ["tasks", sprintId] });
      } else {
        showToast(res.message || "Delete failed", "error");
      }
    },
    onError: (err: any) => showToast(err.message || "Error", "error"),
  });

  const isValidDeadline = (deadline: string) => {
    if (!deadline) return false;
    const date = new Date(deadline);
    // Common default placeholders: 0001-01-01, 1970-01-01, or year < 2023
    return date.getFullYear() > 2023;
  };

  const getTaskStatusStyle = (status: string) => {
    const s = status.toUpperCase();
    switch (s) {
      case "DONE":
        return {
          color: "text-emerald-600 bg-emerald-50 border-emerald-100",
          dot: "bg-emerald-500",
        };
      case "IN_PROGRESS":
        return {
          color: "text-amber-600 bg-amber-50 border-amber-100",
          dot: "bg-amber-500",
        };
      case "TO_DO":
        return {
          color: "text-blue-600 bg-blue-50 border-blue-100",
          dot: "bg-blue-500",
        };
      case "OVERDUE":
        return {
          color: "text-rose-600 bg-rose-50 border-rose-100",
          dot: "bg-rose-500",
        };
      case "DRAFT":
      default:
        return {
          color: "text-zinc-600 bg-zinc-50 border-zinc-100",
          dot: "bg-zinc-400",
        };
    }
  };

  const TaskStatusStepper = ({ status, isRevision }: { status: string; isRevision?: boolean }) => {
    const s = status.toUpperCase();
    const steps = [
      TASK_STATUS.TO_DO,
      TASK_STATUS.IN_PROGRESS,
      TASK_STATUS.DONE,
    ];
    const currentIdx = steps.indexOf(s as any);
    const isOverdue = s === TASK_STATUS.OVERDUE;
    const isApproved = s === TASK_STATUS.DONE;

    // Determine active index for the 3 points
    let activeIdx = currentIdx;
    if (isOverdue) activeIdx = 1; // Map overdue to In Progress point

    return (
      <div className="flex flex-col gap-1.5 min-w-[140px]">
        <div className="flex items-center relative gap-0">
          {steps.map((step, idx) => {
            const isCompleted = idx < activeIdx;
            const isActive = idx === activeIdx;
            const isLast = idx === steps.length - 1;

            let pointColor = "bg-zinc-200";
            if (isActive || isCompleted) {
              pointColor = isRevision || isOverdue ? "bg-rose-500" : "bg-primary";
            }

            return (
              <React.Fragment key={step}>
                {/* Point */}
                <div className="relative z-10 flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      backgroundColor:
                        isActive || isCompleted
                          ? idx === 2
                            ? "var(--primary)" // Primary green for DONE
                            : idx === 1 && (isRevision || isOverdue)
                              ? "#f43f5e" // Red only for Revision or Overdue
                              : "var(--primary)"
                          : "#e4e4e7",
                    }}
                    className={`w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-colors duration-300`}
                  >
                    {isCompleted || (isActive && s === "DONE") ? (
                      <Check size={8} className="text-white stroke-[4]" />
                    ) : isActive && (isRevision || isOverdue) && idx === 1 ? (
                      <AlertCircle size={10} className="text-white" />
                    ) : (
                      isActive && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      )
                    )}
                  </motion.div>
                </div>

                {/* Line */}
                {!isLast && (
                  <div className="flex-1 h-[2px] bg-zinc-100 mx-0.5 relative overflow-hidden -translate-y-0.25">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: isCompleted ? "100%" : "0%" }}
                      className={`absolute inset-0 ${idx === 0 ? (isOverdue ? "bg-rose-300" : "bg-primary/40") : (idx === 1 && isRevision) ? "bg-rose-300" : (idx === 1 && isApproved) ? "bg-emerald-300" : "bg-primary/40"}`}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="flex justify-between items-center px-0.5">
          <span
            className={`text-[8px] font-black uppercase tracking-tighter ${activeIdx >= 0 ? "text-primary" : "text-zinc-400"}`}
          >
            TO DO
          </span>
          <span
            className={`text-[8px] font-black uppercase tracking-tighter ${activeIdx >= 1 ? (isRevision || isOverdue ? "text-rose-500" : "text-primary") : "text-zinc-400"}`}
          >
            {isOverdue ? "OVERDUE" : isRevision ? "REVISION REQUESTED" : "IN PROGRESS"}
          </span>
          <span
            className={`text-[8px] font-black uppercase tracking-tighter ${activeIdx >= 2 ? "text-primary" : "text-zinc-400"}`}
          >
            DONE
          </span>
        </div>
      </div>
    );
  };

  const getInitials = (name: string) => {
    if (!name || name === "Unassigned") return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return "??";
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-emerald-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-indigo-500",
      "bg-purple-500",
      "bg-sky-500",
      "bg-orange-500",
    ];

    if (!name || name === "Unassigned") return "bg-zinc-300";

    // Simple hash to get consistent color for same name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return (
      <div className="border border-zinc-100 bg-white p-20 text-center rounded-2xl shadow-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-zinc-900 border-t-transparent animate-spin rounded-full" />
          <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">
            Syncing Deliverables...
          </p>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-20 text-center rounded-2xl">
        <div className="max-w-xs mx-auto space-y-4">
          <div className="p-4 bg-white border border-zinc-100 inline-block rounded-xl shadow-sm text-zinc-300">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-1">
            <p className="font-black text-sm text-zinc-900 uppercase">
              No tasks assigned yet
            </p>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Start by adding a department package to this deliverable package to track
              academic progress.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-zinc-100 bg-white shadow-sm rounded-2xl">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-primary/20 border-b border-primary/10 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-900">
            <th className="px-6 py-5 font-black">Task Name</th>
            <th className="px-6 py-5 font-black">Deadline</th>
            <th className="px-6 py-5 font-black">Assignee</th>
            <th className="px-6 py-5 font-black">Status</th>
            <th className="px-6 py-5 font-black text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-50">
          {tasks.map((task) => (
            <tr
              key={task.taskId}
              className="hover:bg-zinc-50/30 transition-all group"
            >
              {/* Task Name */}
              <td className="px-6 py-5">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => onViewDetails(task)}
                      className="font-black text-sm text-zinc-900 text-left tracking-tight hover:text-primary transition-colors outline-none cursor-pointer"
                    >
                      {task.taskName}
                    </button>
                    {task.isAccepted === true && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-md uppercase tracking-wider">
                        <Check size={8} className="stroke-[3]" />
                        Accepted
                      </span>
                    )}
                    {task.isAccepted === false && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 rounded-md uppercase tracking-wider">
                        <AlertCircle size={8} />
                        Rejected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag size={10} className="text-zinc-300" />
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      {task.taskId.split("-")[1]}
                    </span>
                  </div>
                </div>
              </td>

              {/* Deadline */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-zinc-400" />
                  <span className="text-xs font-semibold text-zinc-700">
                    {isValidDeadline(task.deadline)
                      ? new Date(task.deadline).toLocaleDateString("vi-VN")
                      : <span className="text-zinc-400 italic font-medium tracking-tight">No deadline</span>}
                  </span>
                </div>
              </td>

              {/* Assignee */}
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 shrink-0 ${getAvatarColor(task.account.fullName || "")} flex items-center justify-center text-white rounded-full transition-all`}
                  >
                    <span className="text-[10px] font-black tracking-tighter">
                      {getInitials(task.account.fullName || "")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {task.account.fullName === "Unassigned" ? (
                      <span className="text-xs text-zinc-400 italic font-medium tracking-tight">
                        Unassigned
                      </span>
                    ) : (
                      <>
                        <span className="text-xs font-black text-zinc-900 tracking-tight">
                          {task.account.fullName}
                        </span>
                        {task.account.email && (
                          <span className="text-[10px] text-zinc-500 font-semibold leading-none mt-0.5">
                            {task.account.email}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-5">
                <TaskStatusStepper status={task.status} isRevision={task.action === 'UPDATE'} />
              </td>

              {/* Actions */}
              <td className="px-6 py-5 text-right">
                <div className="flex items-center justify-end gap-2">
                  {sprintStatus === SPRINT_STATUS.PLANNING && (
                    <>
                      <button
                        onClick={() => onEdit(task)}
                        className="p-2 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 border border-transparent hover:border-zinc-200 rounded-lg transition-all"
                        title="Edit Task"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm("Confirm task removal?")) {
                            deleteMutation.mutate(task.taskId);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-100 rounded-lg transition-all disabled:opacity-50"
                        title="Delete Task"
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </>
                  )}
                  {task.status === TASK_STATUS.DONE && (
                    <>
                      {task.isAccepted === null || task.isAccepted === undefined ? (
                        <button
                          onClick={() =>
                            router.push(
                              `/dashboard/hocfdc/framework-execution/${curriculumId}/recheck/${task.subjectId}?taskId=${task.taskId}`,
                            )
                          }
                          className="px-2.5 py-1.5 bg-[#409b43] text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-600 transition-all shadow-md shadow-[#409b43]/20 flex items-center gap-1.5 ml-auto group/btn"
                        >
                          <CheckCircle2
                            size={14}
                            className="text-emerald-100 group-hover/btn:scale-110 transition-transform"
                          />
                          recheck subject
                        </button>
                      ) : task.isAccepted === true ? (
                        <span className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-200 flex items-center gap-1.5 ml-auto shadow-sm">
                          <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3]" />
                          Accepted
                        </span>
                      ) : (
                        <span className="px-2.5 py-1.5 bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-rose-200 flex items-center gap-1.5 ml-auto shadow-sm">
                          <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                          Rejected
                        </span>
                      )}
                    </>
                  )}
                  {task.status === TASK_STATUS.OVERDUE && (
                    <button
                      onClick={() => onEdit(task)}
                      className="px-2.5 py-1.5 bg-rose-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-700 transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 ml-auto group/btn"
                    >
                      <Clock
                        size={14}
                        className="text-rose-100 group-hover/btn:scale-110 transition-transform"
                      />
                      extend task
                    </button>
                  )}
                  {sprintStatus !== SPRINT_STATUS.PLANNING && task.status !== TASK_STATUS.DONE && task.status !== TASK_STATUS.OVERDUE && (
                    <button className="p-2 hover:bg-zinc-100 rounded-lg transition-all text-zinc-400 hover:text-zinc-900 border border-transparent hover:border-zinc-200">
                      <MoreVertical size={16} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
