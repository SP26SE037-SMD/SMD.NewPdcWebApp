"use client";

import { useState, useMemo } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Flag as FlagIcon,
  CheckCircle2,
  Clock,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { TaskItem, TASK_TYPE } from "@/services/task.service";
import { DepartmentAccount } from "@/services/account.service";
import { getPriorityConfig, getTaskStatusConfig } from "./task-utils";

interface TaskRowProps {
  task: TaskItem & { children?: TaskItem[] };
  level?: number;
  pdcmAccounts: DepartmentAccount[];
  onOpenTaskModal: (
    mode: "CREATE" | "UPDATE" | "REVIEW",
    parentTask: TaskItem,
  ) => void;
  onOpenDetailModal: (task: TaskItem & { children?: TaskItem[] }) => void;
}

export function TaskRow({
  task,
  level = 0,
  pdcmAccounts,
  onOpenTaskModal,
  onOpenDetailModal,
}: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const children = task.children || [];
  const statusConfig = getTaskStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);

  // Workflow action restrictions
  const canAddSubtask = useMemo(() => {
    if (task.type === "SUBJECT" || task.type === TASK_TYPE.NEW_SUBJECT || task.type === TASK_TYPE.REUSED_SUBJECT) {
      return true; // Can create syllabus task
    }
    if (task.type === "SYLLABUS" && task.action === "CREATE") {
      return true; // Can create review task
    }
    return false; // Type SYLLABUS, action REVIEW cannot add task
  }, [task.type, task.action]);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canAddSubtask) return;
    const mode = (task.type === "SUBJECT" || task.type === TASK_TYPE.NEW_SUBJECT || task.type === TASK_TYPE.REUSED_SUBJECT) ? "CREATE" : "REVIEW";
    onOpenTaskModal(mode, task);
  };

  const StatusIcon = statusConfig.icon;

  return (
    <>
      <div
        className="group flex items-center grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-100 hover:bg-zinc-50/70 transition-colors text-xs items-center cursor-pointer"
        onClick={() => onOpenDetailModal(task)}
      >
        {/* Name Column */}
        <div
          className="col-span-5 flex items-center min-w-0"
          style={{ paddingLeft: `${level * 1.5}rem` }}
        >
          {/* Collapse/Expand Arrow */}
          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            {children.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />
            )}
          </div>

          {/* Status Bullet */}
          <div className={`mr-2.5 p-1 rounded-md bg-white border border-zinc-100 shadow-sm shrink-0 ${statusConfig.text}`}>
            <StatusIcon size={14} />
          </div>

          {/* Clickable Name */}
          <span
            className="font-semibold text-zinc-800 hover:text-emerald-600 transition-colors truncate max-w-full"
            title={task.taskName}
          >
            {task.taskName}
          </span>
        </div>

        {/* Assignee */}
        <div className="col-span-1 flex items-center">
          <div className="flex items-center gap-1.5">
            <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-[9px] font-bold text-zinc-500 border border-zinc-200 shrink-0">
              {task.account?.fullName
                ?.split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <span
              className="font-medium text-zinc-600 line-clamp-1 max-w-[80px] hidden lg:inline"
              title={task.account?.fullName}
            >
              {task.account?.fullName || "Unassigned"}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div className="col-span-1 font-medium text-zinc-500">
          {task.deadline ? (
            <span
              className={
                task.status !== "DONE" && new Date(task.deadline).getTime() < new Date().getTime()
                  ? "text-rose-500 font-bold"
                  : ""
              }
            >
              {new Date(task.deadline).toLocaleDateString("en-US", {
                month: "numeric",
                day: "numeric",
                year: "2-digit",
              })}
            </span>
          ) : (
            "N/A"
          )}
        </div>

        {/* Priority */}
        <div className="col-span-2 flex items-center gap-1.5">
          <FlagIcon size={13} className={priorityConfig.color} fill={priorityConfig.fill} />
          <span className="font-medium text-zinc-500">{priorityConfig.label}</span>
        </div>

        {/* Action */}
        <div className="col-span-1">
          <span className="inline-flex px-1.5 py-0.5 font-bold uppercase tracking-wider text-[9px] text-zinc-500 bg-zinc-100 rounded">
            {task.action || "OTHER"}
          </span>
        </div>

        {/* Type */}
        <div className="col-span-1">
          <span className="font-bold text-zinc-400 uppercase text-[9px]">
            {task.type}
          </span>
        </div>

        {/* Add Subtask Button */}
        <div className="col-span-1 flex justify-end">
          {canAddSubtask ? (
            <button
              onClick={handleAddClick}
              className="p-1 rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
              title="Add subtask"
            >
              <Plus size={14} />
            </button>
          ) : (
            <div className="w-6 h-6" /> // spacer
          )}
        </div>
      </div>

      {/* Recursive Render of Children */}
      {isExpanded && children.length > 0 && (
        <div className="relative">
          {/* Vertical tree guide line */}
          <div
            className="absolute left-6 top-0 bottom-4 w-px bg-zinc-100"
            style={{ left: `${(level + 1) * 1.5 - 0.75}rem` }}
          />
          {children.map((child) => (
            <TaskRow
              key={child.taskId}
              task={child}
              level={level + 1}
              pdcmAccounts={pdcmAccounts}
              onOpenTaskModal={onOpenTaskModal}
              onOpenDetailModal={onOpenDetailModal}
            />
          ))}
        </div>
      )}
    </>
  );
}
