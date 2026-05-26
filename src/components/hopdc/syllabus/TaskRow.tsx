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
  Check,
} from "lucide-react";
import { TaskItem, TASK_TYPE, TaskStatus } from "@/services/task.service";
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
  onUpdateStatus?: (taskId: string, status: TaskStatus) => void;
}

export function TaskRow({
  task,
  level = 0,
  pdcmAccounts,
  onOpenTaskModal,
  onOpenDetailModal,
  onUpdateStatus,
}: TaskRowProps) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const children = task.children || [];
  const statusConfig = getTaskStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);

  // Workflow action restrictions
  const canAddSubtask = useMemo(() => {
    if (task.status === "OVERDUE") {
      return false; // Overdue tasks cannot have subtasks added
    }
    if (task.type === "SUBJECT" || task.type === TASK_TYPE.NEW_SUBJECT || task.type === TASK_TYPE.REUSED_SUBJECT) {
      return true; // Can create syllabus task
    }
    if (task.type === "SYLLABUS" && task.action === "CREATE") {
      return true; // Can create review task
    }
    return false; // Type SYLLABUS, action REVIEW cannot add task
  }, [task.type, task.action, task.status]);

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
        className={`group flex items-center grid grid-cols-12 gap-4 px-6 py-3 border-b border-zinc-100 hover:bg-zinc-50/70 transition-colors text-xs items-center cursor-pointer ${
          isDropdownOpen ? "relative z-30 bg-white" : ""
        }`}
        onClick={() => onOpenDetailModal(task)}
      >
        {/* Name Column */}
        <div
          className="col-span-6 flex items-center min-w-0"
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
          {onUpdateStatus && task.status !== "OVERDUE" && task.type !== "SYLLABUS" ? (
            <div className="relative mr-2.5 shrink-0 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className={`p-1 rounded-md bg-white border border-zinc-100 shadow-sm hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer ${statusConfig.text}`}
                title="Change status"
              >
                <StatusIcon size={14} />
              </button>
              {isDropdownOpen && (
                <>
                  {/* Backdrop overlay to close dropdown */}
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                    }}
                  />
                  {/* Dropdown Card */}
                  <div
                    className="absolute left-0 top-full mt-2 w-64 bg-white border border-zinc-200/80 rounded-2xl shadow-2xl z-50 p-3 text-left animate-in fade-in slide-in-from-top-1 duration-150"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header Tabs */}
                    <div className="flex bg-zinc-100/60 p-0.5 rounded-lg mb-3">
                      <button
                        type="button"
                        className="flex-1 text-center py-1.5 text-[11px] font-bold bg-white text-zinc-800 rounded-md shadow-sm border border-zinc-200/20"
                      >
                        Status
                      </button>
                      <button
                        type="button"
                        disabled
                        className="flex-1 text-center py-1.5 text-[11px] font-bold text-zinc-400 cursor-not-allowed"
                      >
                        Task Type
                      </button>
                    </div>

                    {/* Mock Search Input */}
                    <div className="relative mb-3.5">
                      <input
                        type="text"
                        disabled
                        placeholder="Search..."
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs outline-none text-zinc-400 placeholder:text-zinc-300 cursor-not-allowed"
                      />
                    </div>

                    {/* Groups */}
                    <div className="space-y-3.5">
                      {/* Group 1: Not started */}
                      <div>
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 px-1">
                          Not started
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStatus(task.taskId, "TO_DO");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                            task.status === "TO_DO"
                              ? "bg-zinc-50 text-zinc-800 font-bold"
                              : "hover:bg-zinc-50/60 text-zinc-600"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="p-0.5 rounded bg-zinc-100 border border-zinc-200/50 text-zinc-600">
                              <Calendar size={13} />
                            </span>
                            TO DO
                          </span>
                          {task.status === "TO_DO" && <Check size={14} className="text-zinc-600 font-black" />}
                        </button>
                      </div>

                      {/* Group 2: Active */}
                      <div>
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 px-1">
                          Active
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStatus(task.taskId, "IN_PROGRESS");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                            task.status === "IN_PROGRESS"
                              ? "bg-blue-50 text-blue-800 font-bold"
                              : "hover:bg-zinc-50/60 text-zinc-600"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="p-0.5 rounded bg-blue-50/80 border border-blue-100 text-blue-600">
                              <Clock size={13} />
                            </span>
                            IN PROGRESS
                          </span>
                          {task.status === "IN_PROGRESS" && <Check size={14} className="text-blue-600 font-black" />}
                        </button>
                      </div>

                      {/* Group 3: Done */}
                      <div>
                        <div className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1 px-1">
                          Done
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onUpdateStatus(task.taskId, "DONE");
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold transition-colors ${
                            task.status === "DONE"
                              ? "bg-emerald-50 text-emerald-800 font-bold"
                              : "hover:bg-zinc-50/60 text-zinc-600"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="p-0.5 rounded bg-emerald-50/80 border border-emerald-100/50 text-emerald-600">
                              <CheckCircle2 size={13} />
                            </span>
                            DONE
                          </span>
                          {task.status === "DONE" && <Check size={14} className="text-emerald-600 font-black" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div
              className={`mr-2.5 p-1 rounded-md bg-white border border-zinc-100 shadow-sm shrink-0 ${statusConfig.text}`}
              title={task.type === "SYLLABUS" ? "Cannot change status of SYLLABUS tasks" : undefined}
            >
              <StatusIcon size={14} />
            </div>
          )}

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
          <div
            className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-[9px] font-bold text-zinc-500 border border-zinc-200 shrink-0"
            title={task.account?.fullName || "Unassigned"}
          >
            {task.account?.fullName
              ? task.account.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "—"}
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
        <div className="col-span-1 flex items-center gap-1.5">
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
              onUpdateStatus={onUpdateStatus}
            />
          ))}
        </div>
      )}
    </>
  );
}
