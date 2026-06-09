"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Calendar,
  Clock,
  Flag as FlagIcon,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Plus,
  BookText,
  User as UserIcon,
  Lock,
  RefreshCw,
  Eye,
  CircleDot,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  TaskItem,
  TaskStatus,
  TASK_STATUS,
  TaskService,
} from "@/services/task.service";
import { SubjectService } from "@/services/subject.service";
import { SyllabusService } from "@/services/syllabus.service";
import { DepartmentAccount } from "@/services/account.service";
import { RequestService } from "@/services/request.service";
import { User } from "@/lib/auth";
import { RejectDecisionModal } from "./RejectDecisionModal";
import { useToast } from "@/components/ui/Toast";
import {
  toInputDate,
  getTaskStatusConfig,
  getSubjectStatusConfig,
  getSyllabusStatusConfig,
  getPriorityConfig,
} from "./task-utils";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskItem & { children?: TaskItem[] };
  pdcmAccounts: DepartmentAccount[];
  currentUser: User | null;
  curriculumId: string;
  sprintId: string;
  sprintDeadline?: string;
  onUpdateStatus: (taskId: string, status: TaskStatus, deadline?: string) => void;
  isUpdatingStatus: boolean;
  onOpenTaskModal: (
    mode: "CREATE" | "UPDATE" | "REVIEW",
    parentTask: TaskItem,
  ) => void;
  onAcceptSyllabus: (task: TaskItem, comment: string) => Promise<void>;
  onRejectSyllabus: (
    task: TaskItem,
    assignTo: string,
    dueDate: string,
    comment: string,
    action?: string,
  ) => Promise<void>;
  onResetDecision: (task: TaskItem) => Promise<void>;
  onSelectTask: (task: TaskItem) => void;
  taskHistory?: TaskItem[];
  onNavigateToHistory?: (index: number) => void;
}

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

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const getStatusSelectClass = (status: string) => {
  switch (status?.toUpperCase() || "") {
    case "DONE":
      return "bg-emerald-600 text-white hover:bg-emerald-700";
    case "IN_PROGRESS":
      return "bg-blue-600 text-white hover:bg-blue-700";
    case "TO_DO":
      return "bg-zinc-500 text-white hover:bg-zinc-600";
    case "OVERDUE":
      return "bg-rose-600 text-white hover:bg-rose-700";
    default:
      return "bg-zinc-500 text-white hover:bg-zinc-600";
  }
};

export function TaskDetailModal({
  isOpen,
  onClose,
  task,
  pdcmAccounts,
  currentUser,
  curriculumId,
  sprintId,
  sprintDeadline,
  onUpdateStatus,
  isUpdatingStatus,
  onOpenTaskModal,
  onAcceptSyllabus,
  onRejectSyllabus,
  onResetDecision,
  onSelectTask,
  taskHistory,
  onNavigateToHistory,
}: TaskDetailModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [commentText, setCommentText] = useState("");
  const [isRowRejectModalOpen, setIsRowRejectModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestContent, setRequestContent] = useState("");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [extendedDeadline, setExtendedDeadline] = useState("");

  // Edit & Delete Task states for HoPDC role
  const [isEditing, setIsEditing] = useState(false);
  const [editTaskName, setEditTaskName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [editAssignTo, setEditAssignTo] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  // Filter accounts for assignee selector
  const filteredAccounts = useMemo(() => {
    return pdcmAccounts.filter((acc) => {
      const role = acc.roleName?.toUpperCase();
      const isReviewSyllabus = task?.type === "SYLLABUS" && task?.action === "REVIEW";
      
      let isAllowedRole = isReviewSyllabus ? role === "PDCM" : (role === "PDCM" || role === "COLLABORATOR");
      
      if (isReviewSyllabus) {
        // Exclude assignee of the parent task
        const parentTask = taskHistory && taskHistory.length > 0
          ? taskHistory[taskHistory.length - 1]
          : null;
        if (parentTask && parentTask.account?.accountId) {
          isAllowedRole = isAllowedRole && acc.accountId !== parentTask.account.accountId;
        }
      }
      
      return isAllowedRole;
    });
  }, [pdcmAccounts, task?.type, task?.action, taskHistory]);

  // Reset editing mode when modal is toggled or task changes
  useEffect(() => {
    setIsEditing(false);
  }, [isOpen, task?.taskId]);

  // Populate edit fields
  useEffect(() => {
    if (task) {
      setEditTaskName(task.taskName || "");
      setEditDescription(task.description || "");
      setEditPriority(task.priority || "NORMAL");
      setEditAssignTo(task.account?.accountId || "");
      setEditDueDate(task.deadline ? toInputDate(task.deadline) : "");
    }
  }, [task, isEditing]);

  const handleDeleteTask = async () => {
    if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }
    setIsDeletingTask(true);
    try {
      if (task.type === "SYLLABUS" && task.action === "CREATE") {
        const syllabusId = task.targetId || task.syllabus?.syllabusId;
        if (!syllabusId) {
          throw new Error("Cannot find syllabus ID associated with this task.");
        }
        if (!currentUser?.accountId) {
          throw new Error("User session not found.");
        }
        await SyllabusService.archiveSyllabusByAccount(syllabusId, currentUser.accountId);
      }
      await TaskService.deleteTask(task.taskId);
      showToast("Task deleted successfully", "success");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["single-tasks"] });
      
      onClose();
    } catch (err: any) {
      showToast(err.message || "Failed to delete task", "error");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleSaveEdit = async () => {
    const isTodo = task.status === "TO_DO";
    if (isTodo) {
      if (!editTaskName.trim()) {
        showToast("Task title is required", "error");
        return;
      }
      if (!editAssignTo) {
        showToast("Assignee is required", "error");
        return;
      }
      if (!editDueDate) {
        showToast("Due date is required", "error");
        return;
      }
    }
    if (!editDescription.trim()) {
      showToast("Description is required", "error");
      return;
    }

    setIsSavingTask(true);
    try {
      const payload: any = {
        assignTo: isTodo ? editAssignTo : (task.account?.accountId || ""),
        taskName: isTodo ? editTaskName.trim() : task.taskName,
        description: editDescription.trim(),
        action: task.action,
        isAccepted: task.isAccepted !== undefined && task.isAccepted !== null ? task.isAccepted : null,
        comment: task.comment || "",
        priority: editPriority,
        type: task.type,
        targetId: task.targetId || task.syllabus?.syllabusId || task.syllabusId || "",
        rootTaskId: task.rootTaskId || "",
        dueDate: isTodo ? editDueDate : (task.deadline ? toInputDate(task.deadline) : ""),
      };

      await TaskService.updateTask(task.taskId, payload);
      showToast("Task updated successfully", "success");
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["single-tasks"] });
      
      setIsEditing(false);
      onClose();
    } catch (err: any) {
      showToast(err.message || "Failed to update task", "error");
    } finally {
      setIsSavingTask(false);
    }
  };

  useEffect(() => {
    if (task?.deadline) {
      setExtendedDeadline(toInputDate(task.deadline));
    } else {
      setExtendedDeadline("");
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && task) {
      setRequestTitle(`Request Recheck: Subject ${task.taskName || ""}`);
      setRequestContent(
        `Subject ${task.taskName || ""} is completed and ready for approval.`,
      );
    }
  }, [isOpen, task]);

  const handleSubmitRequest = async () => {
    if (!requestTitle.trim() || !requestContent.trim()) {
      showToast("Please fill in both title and content.", "error");
      return;
    }
    setIsSubmittingRequest(true);
    try {
      await RequestService.createRequestV2({
        title: requestTitle.trim(),
        content: requestContent.trim(),
        type: "TASK",
        targetId: task.taskId,
        receivedById: task.createdBy?.accountId || null,
      });
      showToast("Review request submitted successfully!", "success");
      setIsRequestModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to submit review request.", "error");
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Helper to find subject information from the task itself or from any of its children recursively
  const getResolvedSubjectInfo = (): {
    subjectId?: string;
    subjectStatus?: string;
  } => {
    if (task.subjectId || task.subject?.subjectId) {
      return {
        subjectId: task.subjectId || task.subject?.subjectId,
        subjectStatus: task.subjectStatus || task.subject?.status,
      };
    }
    const findInChildren = (
      list: TaskItem[],
    ): { subjectId?: string; subjectStatus?: string } | null => {
      for (const child of list) {
        if (child.subjectId || child.subject?.subjectId) {
          return {
            subjectId: child.subjectId || child.subject?.subjectId,
            subjectStatus: child.subjectStatus || child.subject?.status,
          };
        }
        if (
          child.rootTaskId &&
          (child as any).children &&
          (child as any).children.length > 0
        ) {
          const res = findInChildren((child as any).children);
          if (res) return res;
        }
      }
      return null;
    };
    return findInChildren(task.children || []) || {};
  };

  const resolvedSubject = getResolvedSubjectInfo();
  const subjectId = resolvedSubject.subjectId || "";
  const subjectStatus = resolvedSubject.subjectStatus || "DRAFT";

  // Sync comment from local storage
  useEffect(() => {
    const keyId = task.taskId;
    if (!keyId || !isOpen) return;

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`final_decision_comment_${keyId}`);
      setCommentText(saved || "");
    }

    const handleStorageUpdate = (e: any) => {
      if (e.detail && e.detail.taskId === keyId) {
        setCommentText(e.detail.comment || "");
      }
    };
    window.addEventListener(
      "final-decision-comment-updated",
      handleStorageUpdate,
    );

    return () => {
      window.removeEventListener(
        "final-decision-comment-updated",
        handleStorageUpdate,
      );
    };
  }, [task.taskId, isOpen]);

  const goToSubjectDetail = async () => {
    if (
      task.status === TASK_STATUS.TO_DO &&
      task.type === "SUBJECT" &&
      currentUser?.role === "HOPDC"
    ) {
      try {
        await TaskService.updateTaskStatus(
          task.taskId,
          TASK_STATUS.IN_PROGRESS,
        );
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
      } catch (err) {
        console.error("Failed to update task status:", err);
      }
    }

    const isReadOnly = task.status === TASK_STATUS.DONE || task.status === TASK_STATUS.OVERDUE;
    router.push(
      `/dashboard/hopdc/department-tasks/new-subject?subjectId=${subjectId}&curriculumId=${curriculumId}&sprintId=${sprintId}&taskId=${task.taskId}&tab=subject${isReadOnly ? "&readOnly=true" : ""}`,
    );
    onClose();
  };

  const goToSyllabusDetail = async () => {
    if (
      task.status === TASK_STATUS.TO_DO &&
      task.type === "SUBJECT" &&
      currentUser?.role === "HOPDC"
    ) {
      try {
        await TaskService.updateTaskStatus(
          task.taskId,
          TASK_STATUS.IN_PROGRESS,
        );
        queryClient.invalidateQueries({ queryKey: ["assignments"] });
      } catch (err) {
        console.error("Failed to update task status:", err);
      }
    }

    const isReadOnly = task.status === TASK_STATUS.DONE || task.status === TASK_STATUS.OVERDUE;
    const targetSyllabusId =
      task.syllabus?.syllabusId || task.targetId || task.syllabusId || "null";
    router.push(
      `/dashboard/hopdc/department-tasks/new-subject?subjectId=${subjectId}&curriculumId=${curriculumId}&sprintId=${sprintId}&taskId=${task.taskId}&syllabusId=${targetSyllabusId}&tab=syllabus${isReadOnly ? "&readOnly=true" : ""}`,
    );
    onClose();
  };

  const goToReviewDetail = () => {
    const targetSyllabusId =
      task.syllabus?.syllabusId || task.targetId || task.syllabusId || "null";
    router.push(
      `/dashboard/hopdc/department-tasks/new-subject?subjectId=${subjectId}&curriculumId=${curriculumId}&sprintId=${sprintId}&taskId=${task.taskId}&syllabusId=${targetSyllabusId}&tab=syllabus&readOnly=true`,
    );
    onClose();
  };

  const isSyllabusTask =
    task.type === "SYLLABUS" ||
    task.action === "CREATE" ||
    task.action === "UPDATE";
  const isCreateSyllabusTask =
    task.type === "SYLLABUS" && (task.action === "CREATE" || task.action === "UPDATE");

  const children = task.children || [];
  const doneChildrenCount = children.filter(
    (c) => c.status === TASK_STATUS.DONE,
  ).length;
  const progressPercent =
    children.length > 0
      ? Math.round((doneChildrenCount / children.length) * 100)
      : 0;

  // Decide if Accept/Reject controls should be shown
  const hasDecisionBlock =
    isCreateSyllabusTask &&
    (task.isAccepted === null || task.isAccepted === undefined) &&
    children.length > 0 &&
    children.some((c) => c.status === TASK_STATUS.DONE);

  const statusConfig = getTaskStatusConfig(task.status);
  const priorityConfig = getPriorityConfig(task.priority);

  // Workflow action restrictions
  const canAddSubtask = useMemo(() => {
    if (task.status === TASK_STATUS.OVERDUE) {
      return false; // Cannot add subtask if task is Overdue
    }
    if (task.isAccepted === true || task.isAccepted === false) {
      return false; // Cannot add subtask if task is accepted or rejected (isAccepted is true/false)
    }
    if (currentUser?.role === "HOCFDC") {
      return false; // HoCFDC cannot add task
    }
    if (
      task.type === "SUBJECT"
    ) {
      return true; // Can create syllabus task
    }
    if (task.type === "SYLLABUS" && (task.action === "CREATE" || task.action === "UPDATE")) {
      return true; // Can create review task
    }
    return false; // Type SYLLABUS, action REVIEW cannot add task
  }, [task.type, task.action, task.status, currentUser?.role, task.isAccepted]);

  const handleAddSubtask = () => {
    if (!canAddSubtask) return;
    const mode =
      task.type === "SUBJECT"
        ? "CREATE"
        : "REVIEW";
    onOpenTaskModal(mode, task);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider ${statusConfig.bg} ${statusConfig.text} border border-current/20 rounded-md`}
            >
              <statusConfig.icon size={13} />
              {(task.status || "UNKNOWN").replace(/_/g, " ")}
            </span>
            {task.isAccepted === true && (
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                ACCEPTED
              </span>
            )}
            {task.isAccepted === false && (
              <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider border border-rose-200">
                REJECTED
              </span>
            )}
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {task.type}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser?.role === "HOPDC" && task.type === "SYLLABUS" && (
              <>
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isSavingTask}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      {isSavingTask && <Loader2 size={12} className="animate-spin" />}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      disabled={isSavingTask}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[10px] font-black uppercase rounded-lg transition-colors border border-zinc-200"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {(task.status === "TO_DO" || task.status === "IN_PROGRESS") && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        Edit
                      </button>
                    )}
                    {task.status === "TO_DO" && (
                      <button
                        type="button"
                        onClick={handleDeleteTask}
                        disabled={isDeletingTask}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isDeletingTask && <Loader2 size={12} className="animate-spin" />}
                        Delete
                      </button>
                    )}
                  </>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Breadcrumb Trail */}
          {taskHistory && taskHistory.length > 0 && onNavigateToHistory && (
            <div className="flex items-center flex-wrap gap-1 text-xs text-zinc-500 font-semibold mb-2">
              {taskHistory.map((histTask, idx) => (
                <React.Fragment key={histTask.taskId}>
                  <button
                    onClick={() => onNavigateToHistory(idx)}
                    className="hover:text-primary transition-colors hover:underline text-left text-zinc-500"
                  >
                    {histTask.taskName}
                  </button>
                  <ChevronRight
                    size={12}
                    className="text-zinc-300 mx-0.5 shrink-0"
                  />
                </React.Fragment>
              ))}
              <span className="text-zinc-900 font-black max-w-[200px] truncate">
                {task.taskName}
              </span>
            </div>
          )}

          {/* Title Area */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                {task.type}
              </span>
              {task.isAccepted === true && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                  ACCEPTED
                </span>
              )}
              {task.isAccepted === false && (
                <span className="px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-black uppercase tracking-wider border border-rose-200">
                  REJECTED
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2 w-full">
              <BookText size={24} className="text-zinc-600 shrink-0" />
              {isEditing && task.status === "TO_DO" ? (
                <input
                  type="text"
                  value={editTaskName}
                  onChange={(e) => setEditTaskName(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-lg text-lg font-semibold outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 bg-white"
                />
              ) : (
                <span>{task.taskName || "N/A"}</span>
              )}
            </h2>
          </div>

          {/* Attributes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-50/30 p-6 rounded-2xl border border-zinc-150/80">
            {/* Left Column: Status & Deadline */}
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-black w-24 shrink-0 font-medium">
                  <CircleDot size={16} className="text-zinc-400" />
                  <span>Status</span>
                </div>
                {currentUser?.role === "HOCFDC" || (currentUser?.role === "HOPDC" && task.type === "SYLLABUS" && task.status !== TASK_STATUS.OVERDUE) ? (
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusSelectClass(task.status)}`}
                    title={currentUser?.role === "HOPDC" && task.type === "SYLLABUS" ? "Cannot change status of SYLLABUS tasks" : undefined}
                  >
                    {currentUser?.role === "HOPDC" && task.type === "SYLLABUS" && <Lock size={12} className="shrink-0" />}
                    {(task.status || "UNKNOWN").replace(/_/g, " ")}
                  </span>
                ) : (
                  <select
                    value={task.status}
                    onChange={(e) => {
                      const nextStatus = e.target.value as TaskStatus;
                      if (task.status === TASK_STATUS.OVERDUE && nextStatus === TASK_STATUS.IN_PROGRESS && task.type === "SYLLABUS") {
                        if (!extendedDeadline) {
                          showToast("Please specify a new deadline date.", "error");
                          return;
                        }
                        const selectedTime = new Date(extendedDeadline).setHours(0, 0, 0, 0);
                        const todayTime = new Date().setHours(0, 0, 0, 0);
                        if (selectedTime <= todayTime) {
                          showToast("New deadline must be a future date.", "error");
                          return;
                        }
                        if (sprintDeadline) {
                          const sprintTime = new Date(sprintDeadline).setHours(23, 59, 59, 999);
                          if (selectedTime > sprintTime) {
                            showToast(`New deadline cannot exceed the sprint deadline (${new Date(sprintDeadline).toLocaleDateString("vi-VN")}).`, "error");
                            return;
                          }
                        }
                        onUpdateStatus(task.taskId, nextStatus, extendedDeadline);
                      } else {
                        onUpdateStatus(task.taskId, nextStatus);
                      }
                    }}
                    disabled={isUpdatingStatus || (task.status === TASK_STATUS.OVERDUE && task.type !== "SYLLABUS")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase outline-none transition-colors cursor-pointer disabled:opacity-50 ${getStatusSelectClass(task.status)}`}
                  >
                    {task.status === TASK_STATUS.OVERDUE && task.type === "SYLLABUS" ? (
                      <>
                        <option
                          value={TASK_STATUS.OVERDUE}
                          className="bg-white text-zinc-800 font-semibold"
                        >
                          OVERDUE
                        </option>
                        <option
                          value={TASK_STATUS.IN_PROGRESS}
                          className="bg-white text-zinc-800 font-semibold"
                        >
                          IN PROGRESS
                        </option>
                      </>
                    ) : (
                      <>
                        <option
                          value={TASK_STATUS.TO_DO}
                          className="bg-white text-zinc-800 font-semibold"
                        >
                          TO DO
                        </option>
                        <option
                          value={TASK_STATUS.IN_PROGRESS}
                          className="bg-white text-zinc-800 font-semibold"
                        >
                          IN PROGRESS
                        </option>
                        <option
                          value={TASK_STATUS.DONE}
                          className="bg-white text-zinc-800 font-semibold"
                        >
                          DONE
                        </option>
                        <option
                          value={TASK_STATUS.OVERDUE}
                          className="bg-white text-zinc-800 font-semibold"
                        >
                          OVERDUE
                        </option>
                      </>
                    )}
                  </select>
                )}
              </div>

              {/* Deadline */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-black w-24 shrink-0 font-medium">
                  <Calendar size={16} className="text-zinc-400" />
                  <span>Deadline</span>
                </div>
                {isEditing && task.status === "TO_DO" ? (
                  <input
                    type="date"
                    value={editDueDate}
                    min={new Date().toISOString().slice(0, 10)}
                    max={sprintDeadline ? new Date(sprintDeadline).toISOString().slice(0, 10) : undefined}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="px-3 py-1 text-xs border border-zinc-200 rounded-lg font-semibold text-zinc-800 outline-none focus:border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                ) : currentUser?.role === "HOPDC" && task.type === "SYLLABUS" && task.status === TASK_STATUS.OVERDUE ? (
                  <input
                    type="date"
                    value={extendedDeadline}
                    min={new Date().toISOString().slice(0, 10)}
                    max={sprintDeadline ? new Date(sprintDeadline).toISOString().slice(0, 10) : undefined}
                    onChange={(e) => setExtendedDeadline(e.target.value)}
                    className="px-3 py-1 text-xs border border-zinc-200 rounded-lg font-semibold text-zinc-800 outline-none focus:border-emerald-500 bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                    <Calendar size={14} />
                    <span>
                      {task.deadline
                        ? new Date(task.deadline).toLocaleDateString("vi-VN")
                        : "N/A"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Assignees & Priority */}
            <div className="space-y-4">
              {/* Assignees */}
              <div className="flex items-start gap-4 text-sm">
                <div className="flex items-center gap-2 text-black w-24 shrink-0 font-medium pt-1">
                  <UserIcon size={16} className="text-zinc-400" />
                  <span>Assignees</span>
                </div>
                {isEditing && task.status === "TO_DO" ? (
                  <select
                    value={editAssignTo}
                    onChange={(e) => setEditAssignTo(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer bg-white"
                  >
                    <option value="">Select Assignee</option>
                    {filteredAccounts.map((acc) => (
                      <option key={acc.accountId} value={acc.accountId}>
                        {acc.fullName} ({acc.roleName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-full ${getAvatarColor(task.account?.fullName || "")} flex items-center justify-center text-[10px] font-bold text-white border border-white shadow-sm shrink-0`}
                    >
                      {task.account?.fullName
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase() || "??"}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-bold text-zinc-700 text-xs">
                        {task.account?.fullName || "Unassigned"}
                      </span>
                      {task.account?.email && (
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {task.account.email}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-black w-24 shrink-0 font-medium">
                  <FlagIcon size={16} className="text-zinc-400" />
                  <span>Priority</span>
                </div>
                {isEditing ? (
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 cursor-pointer bg-white"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <FlagIcon
                      size={14}
                      className={priorityConfig.color}
                      fill={priorityConfig.fill}
                    />
                    <span className="text-zinc-700">{priorityConfig.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {isEditing ? (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Description
              </h3>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all resize-none text-zinc-800 animate-in fade-in"
              />
            </div>
          ) : task.description ? (
            <div className="space-y-2">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                Description
              </h3>
              <div className="text-sm text-black font-medium whitespace-pre-wrap bg-zinc-50/30 p-5 rounded-2xl leading-relaxed">
                {task.description}
              </div>
            </div>
          ) : null}

          {/* Fields table */}
          <div className="space-y-3">
            <h3 className="text-base font-black text-zinc-900 uppercase tracking-wide">
              Fields
            </h3>
            <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm bg-white divide-y divide-zinc-50">
              <div className="grid grid-cols-12 px-5 py-3.5 text-xs font-semibold">
                <div className="col-span-4 text-zinc-400 flex items-center gap-2">
                  <span className="text-zinc-300 font-normal">T</span> Action
                </div>
                <div className="col-span-8 text-zinc-700 uppercase tracking-wider font-black">
                  {task.action || "OTHER"}
                </div>
              </div>
              <div className="grid grid-cols-12 px-5 py-3.5 text-xs font-semibold">
                <div className="col-span-4 text-zinc-400 flex items-center gap-2">
                  <span className="text-zinc-300 font-normal">T</span> Type
                </div>
                <div className="col-span-8 text-zinc-700 uppercase tracking-wider font-black">
                  {task.type}
                </div>
              </div>
            </div>
          </div>

          {/* Subtasks Section */}
          {!(task.type === "SYLLABUS" && task.action === "REVIEW") && (
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-zinc-900 uppercase tracking-wide">
                    Subtasks
                  </h3>
                  {children.length > 0 && (
                    <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {doneChildrenCount}/{children.length} Done
                    </span>
                  )}
                </div>

                {canAddSubtask && (
                  <button
                    onClick={handleAddSubtask}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors shadow-sm"
                  >
                    <Plus size={12} />
                    Add Task
                  </button>
                )}
              </div>

              {children.length > 0 ? (
                <div className="space-y-3">
                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-500">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Subtask Table/List */}
                  <div className="border border-zinc-100 rounded-xl overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                          <th className="px-4 py-3">Name</th>
                          <th className="px-4 py-3">Assignee</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Priority</th>
                          <th className="px-4 py-3">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {children.map((subtask) => {
                          const subPriority = getPriorityConfig(subtask.priority);
                          const resolvedSubEmail = subtask.account?.email || "";
                          const conf = getTaskStatusConfig(subtask.status);
                          return (
                            <tr
                              key={subtask.taskId}
                              onClick={() => onSelectTask(subtask)}
                              className="hover:bg-zinc-50/80 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3 font-semibold text-zinc-700 hover:text-primary max-w-[200px] truncate">
                                {subtask.taskName}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center text-[9px] font-bold text-zinc-500 border border-zinc-200">
                                    {subtask.account?.fullName
                                      ?.split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <span
                                    className="font-medium text-zinc-600 line-clamp-1 max-w-[120px]"
                                    title={resolvedSubEmail}
                                  >
                                    {subtask.account?.fullName || "Unassigned"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${conf.bg} ${conf.text} border border-current/10`}
                                >
                                  <conf.icon size={10} />
                                  {(subtask.status || "UNKNOWN").replace(
                                    /_/g,
                                    " ",
                                  )}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1.5">
                                  <FlagIcon
                                    size={12}
                                    className={subPriority.color}
                                    fill={subPriority.fill}
                                  />
                                  <span className="font-medium text-zinc-500">
                                    {subPriority.label}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-zinc-500 font-medium">
                                {subtask.deadline
                                  ? new Date(subtask.deadline).toLocaleDateString(
                                      "vi-VN",
                                    )
                                  : "N/A"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-400 font-bold border-2 border-dashed border-zinc-100 rounded-xl bg-zinc-50/50">
                  No subtasks added yet.
                </div>
              )}
            </div>
          )}

          {/* Attachments Section */}
          {currentUser?.role !== "HOCFDC" && (
            <div className="space-y-4 pt-4 border-t border-zinc-100">
              <h3 className="text-base font-black text-zinc-900 uppercase tracking-wide flex items-center gap-2">
                <Paperclip size={18} className="text-zinc-600 shrink-0" />
                Attachments
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Subject Detail Attachment */}
                {subjectId &&
                  !(task.action === "REVIEW" && task.type === "SYLLABUS") && (
                    <button
                      onClick={goToSubjectDetail}
                      className="w-full flex items-center justify-between p-4 bg-white border border-zinc-150 rounded-2xl hover:bg-zinc-50 text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                          <BookText size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-zinc-700 line-clamp-1">
                            Subject Detail
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                            Status: {subjectStatus}
                          </span>
                        </div>
                      </div>
                      <ExternalLink
                        size={14}
                        className="text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0"
                      />
                    </button>
                  )}

                {/* Syllabus Detail Attachment */}
                {isSyllabusTask &&
                  (task.syllabus?.syllabusId ||
                    task.targetId ||
                    task.syllabusId) &&
                  !(task.action === "REVIEW" && task.type === "SYLLABUS") && (
                    <button
                      onClick={goToSyllabusDetail}
                      className="w-full flex items-center justify-between p-4 bg-white border border-zinc-150 rounded-2xl hover:bg-zinc-50 text-left transition-all group shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                          <BookText size={18} />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-black text-zinc-700 line-clamp-1">
                            Syllabus Detail
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                            Status:{" "}
                            {task.syllabusStatus ||
                              task.syllabus?.status ||
                              "DRAFT"}
                          </span>
                        </div>
                      </div>
                      <ExternalLink
                        size={14}
                        className="text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0"
                      />
                    </button>
                  )}

                {/* Review Detail Attachment */}
                {(task.taskName?.toUpperCase().includes("REVIEW SYLLABUS") ||
                  task.action === "REVIEW") && (
                  <button
                    onClick={goToReviewDetail}
                    disabled={task.status !== TASK_STATUS.DONE}
                    className="w-full flex items-center justify-between p-4 bg-white border border-zinc-150 rounded-2xl hover:bg-zinc-50 disabled:hover:bg-white text-left transition-all group shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                        <Eye size={18} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-black text-zinc-700 line-clamp-1">
                          Review Comments
                        </span>
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                          {task.status !== TASK_STATUS.DONE
                            ? "Waiting Reviewer"
                            : "Review Available"}
                        </span>
                      </div>
                    </div>
                    {task.status === TASK_STATUS.DONE && (
                      <ExternalLink
                        size={14}
                        className="text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0"
                      />
                    )}
                  </button>
                )}
              </div>

              {/* HoPDC Decision Block */}
              {isCreateSyllabusTask && (
                <div className="pt-4">
                  {hasDecisionBlock ? (
                    <div className="w-full p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-200/50 text-amber-700">
                          <AlertCircle size={14} />
                        </div>
                        <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                          Final Decision Required
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={async () => {
                            try {
                              await onAcceptSyllabus(
                                task,
                                commentText.trim() || "Accepted",
                              );
                            } catch (err) {}
                          }}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase rounded-xl transition-colors shadow-sm"
                        >
                          Accept Syllabus
                        </button>
                        <button
                          onClick={() => {
                            if (!commentText.trim()) {
                              showToast(
                                "Please add a comment for rejection",
                                "error",
                              );
                              return;
                            }
                            setIsRowRejectModalOpen(true);
                          }}
                          className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase rounded-xl transition-colors shadow-sm"
                        >
                          Reject & Update
                        </button>
                      </div>

                      <textarea
                        value={commentText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCommentText(val);
                          localStorage.setItem(
                            `final_decision_comment_${task.taskId}`,
                            val,
                          );
                          window.dispatchEvent(
                            new CustomEvent("final-decision-comment-updated", {
                              detail: { taskId: task.taskId, comment: val },
                            }),
                          );
                        }}
                        placeholder="Add comments for the creator..."
                        className="w-full p-4 text-xs border border-amber-200 rounded-xl outline-none focus:border-amber-400 bg-white/50 focus:bg-white transition-all min-h-[80px] font-medium text-zinc-700"
                      />
                    </div>
                  ) : task.isAccepted !== null &&
                    task.isAccepted !== undefined ? (
                    <div
                      className={`w-full p-5 rounded-2xl border ${
                        task.isAccepted
                          ? "border-emerald-200 bg-emerald-50/20"
                          : "border-rose-200 bg-rose-50/20"
                      } flex items-start gap-4 shadow-sm`}
                    >
                      <div
                        className={`mt-0.5 p-1.5 rounded-xl bg-white border ${
                          task.isAccepted
                            ? "border-emerald-200 text-emerald-500"
                            : "border-rose-200 text-rose-500"
                        } shadow-sm`}
                      >
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="space-y-3 w-full text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-black ${
                              task.isAccepted
                                ? "text-emerald-700"
                                : "text-rose-700"
                            } uppercase tracking-wider`}
                          >
                            Final Decision
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tight ${
                              task.isAccepted
                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                : "bg-rose-50 text-rose-600 border border-rose-100"
                            }`}
                          >
                            {task.isAccepted
                              ? "Accepted"
                              : "Revision Requested"}
                          </span>
                        </div>
                        <div className="font-semibold text-zinc-500 leading-relaxed">
                          <span className="font-bold text-zinc-700 block mb-1">
                            Decision Comment:
                          </span>
                          <p className="italic text-zinc-600 bg-white/50 p-3.5 rounded-xl border border-zinc-100 whitespace-pre-wrap">
                            {task.comment || "No comment provided."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (
                              window.confirm(
                                "WARNING: Resetting decision will clear approval status and unlock actions. Continue?",
                              )
                            ) {
                              try {
                                await onResetDecision(task);
                              } catch (err) {
                                console.error("Error resetting decision:", err);
                              }
                            }
                          }}
                          className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-800 font-black uppercase tracking-wider rounded-xl transition-colors border border-zinc-200 text-[10px]"
                        >
                          Reset Decision
                        </button>
                      </div>
                    </div>
                  ) : task.status === TASK_STATUS.TO_DO ||
                    task.status === TASK_STATUS.IN_PROGRESS ? (
                    <div className="w-full p-5 rounded-2xl border border-amber-200/60 border-dashed bg-amber-50/10 flex items-start gap-4 shadow-sm">
                      <div className="mt-0.5 p-1.5 rounded-xl bg-white border border-amber-200 text-amber-500 shadow-sm">
                        <BookText
                          size={16}
                          className="text-amber-500 animate-pulse"
                        />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-amber-700 uppercase tracking-widest">
                            Review Task Status
                          </span>
                        </div>
                        <p className="font-medium text-amber-600/70 leading-relaxed">
                          This task does not have a peer review task yet.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full p-5 rounded-2xl border border-zinc-200 border-dashed bg-zinc-50/50 flex items-start gap-4 shadow-sm">
                      <div className="mt-0.5 p-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-400 shadow-sm">
                        <Clock size={16} className="animate-pulse" />
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-zinc-600 uppercase tracking-widest">
                            Peer Review Workflow
                          </span>
                        </div>
                        <p className="font-medium text-zinc-400 leading-relaxed">
                          Currently being reviewed by peers. Final review action
                          will appear here once peer review completes.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* HOPDC Request Review Block */}
              {currentUser?.role === "HOPDC" &&
                task.type === "SUBJECT" &&
                task.status === "DONE" && (
                  <div className="pt-4">
                    <div className="w-full p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-emerald-200/50 text-emerald-700 animate-pulse">
                          <CheckCircle2 size={14} />
                        </div>
                        <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                          Subject Setup Completed
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 text-xs">
                        <p className="font-semibold text-zinc-500 leading-relaxed">
                          This subject task is marked as{" "}
                          <span className="font-bold text-emerald-700">
                            DONE
                          </span>
                          . You can submit a review request to the Head of
                          Curriculum (HoCFDC) to approve your work.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsRequestModalOpen(true)}
                          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors shadow-sm mt-2 animate-in fade-in duration-300"
                        >
                          Submit Review Request
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {/* HOPDC Request Extension Block (Overdue Tasks) */}
              {currentUser?.role === "HOPDC" &&
                task.status === TASK_STATUS.OVERDUE &&
                task.type !== "SYLLABUS" && (
                  <div className="pt-4">
                    <div className="w-full p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-rose-200/50 text-rose-700 animate-pulse">
                          <AlertCircle size={14} />
                        </div>
                        <span className="text-[11px] font-black text-rose-700 uppercase tracking-wider">
                          Task Overdue
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 text-xs">
                        <p className="font-semibold text-zinc-500 leading-relaxed">
                          This task is <span className="font-bold text-rose-700">OVERDUE</span>. You cannot change its status or add subtasks. Please request the Head of Curriculum (HoCFDC) for a deadline extension to continue.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setRequestTitle(`Request Deadline Extension: Task ${task.taskName || ""}`);
                            setRequestContent(`Hi HoCFDC, please extend the deadline for task: ${task.taskName || ""}.`);
                            setIsRequestModalOpen(true);
                          }}
                          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors shadow-sm mt-2 animate-in fade-in duration-300"
                        >
                          Request Extension
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              {/* HOPDC Direct Extension Info for SYLLABUS tasks */}
              {currentUser?.role === "HOPDC" &&
                task.status === TASK_STATUS.OVERDUE &&
                task.type === "SYLLABUS" && (
                  <div className="pt-4">
                    <div className="w-full p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 shadow-sm animate-in fade-in duration-300">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-200/50 text-amber-700 animate-pulse">
                          <AlertCircle size={14} />
                        </div>
                        <span className="text-[11px] font-black text-amber-700 uppercase tracking-wider">
                          Syllabus Task Overdue
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 text-xs">
                        <p className="font-semibold text-zinc-500 leading-relaxed">
                          This syllabus task is <span className="font-bold text-amber-700">OVERDUE</span>. You can extend the deadline and resume work by selecting a new deadline date in the attribute fields above, then changing the status to <span className="font-bold text-emerald-600">IN PROGRESS</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Reject Decision Modal */}
      <RejectDecisionModal
        isOpen={isRowRejectModalOpen}
        onClose={() => setIsRowRejectModalOpen(false)}
        onConfirm={async (assignTo, dueDate, comment, action) => {
          await onRejectSyllabus(task, assignTo, dueDate, comment, action);
          setIsRowRejectModalOpen(false);
          onClose(); // Close task details modal on successful reject
        }}
        originalTask={task}
        departmentAccounts={pdcmAccounts}
        sprintDeadline={sprintDeadline}
        initialComment={commentText}
      />

      {/* Create Request Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <div>
                <h3 className="text-lg font-black text-zinc-900">
                  Create Review Request
                </h3>
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">
                  Send review request to
                </p>
                <ul className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">
                  <li>
                    <span className="font-bold text-zinc-700">
                      {task.createdBy?.fullName || "HoCFDC"}
                    </span>
                  </li>
                  <li>
                    <span className="font-bold text-zinc-700">
                      {task.createdBy?.email || "HoCFDC"}
                    </span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() =>
                  !isSubmittingRequest && setIsRequestModalOpen(false)
                }
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500">
                  Title
                </label>
                <input
                  type="text"
                  value={requestTitle}
                  onChange={(e) => setRequestTitle(e.target.value)}
                  placeholder="Enter title..."
                  disabled={isSubmittingRequest}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all text-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black tracking-widest uppercase text-zinc-500">
                  Content
                </label>
                <textarea
                  value={requestContent}
                  onChange={(e) => setRequestContent(e.target.value)}
                  placeholder="Describe your request..."
                  disabled={isSubmittingRequest}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all resize-none text-zinc-800"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                disabled={isSubmittingRequest}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitRequest}
                disabled={
                  isSubmittingRequest ||
                  !requestTitle.trim() ||
                  !requestContent.trim()
                }
                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 shadow-sm"
              >
                {isSubmittingRequest ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit Request"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
