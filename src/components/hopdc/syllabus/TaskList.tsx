"use client";

import { useMemo, useState, useEffect } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { AccountService } from "@/services/account.service";
import { SprintService } from "@/services/sprint.service";
import { SyllabusService } from "@/services/syllabus.service";
import { CloPloService } from "@/services/cloplo.service";
import {
  TASK_STATUS,
  TaskItem,
  TaskStatus,
  TaskService,
} from "@/services/task.service";
import { RootState } from "@/store";
import { User } from "@/lib/auth";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  Flag as FlagIcon,
  X,
  Loader2,
  Plus,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CreateSyllabusTaskModal } from "./CreateSyllabusTaskModal";
import { CreateSyllabusAdvancedModal } from "./CreateSyllabusAdvancedModal";
import { ManageSyllabusSourcesModal } from "./ManageSyllabusSourcesModal";
import { CreateSingleTaskModal } from "./CreateSingleTaskModal";
import { TaskDetailModal } from "./TaskDetailModal";
import { TaskRow } from "./TaskRow";
import { useToast } from "@/components/ui/Toast";
import { useRouter, useSearchParams } from "next/navigation";
import { getPriorityConfig, getTaskStatusConfig } from "./task-utils";

interface TaskListProps {
  sprintId: string;
  isSingleTaskMode?: boolean;
}

const STATUS_GROUPS: Array<{
  status: string;
  label: string;
  icon: React.ElementType;
  headerClass: string;
  badgeClass: string;
}> = [
  {
    status: TASK_STATUS.TO_DO,
    label: "To Do",
    icon: Calendar,
    headerClass: "text-zinc-600 bg-zinc-50 border-zinc-200",
    badgeClass: "bg-zinc-200 text-zinc-700",
  },
  {
    status: TASK_STATUS.IN_PROGRESS,
    label: "In Progress",
    icon: Clock,
    headerClass: "text-blue-600 bg-blue-50 border-blue-200",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  {
    status: TASK_STATUS.OVERDUE,
    label: "Overdue",
    icon: AlertCircle,
    headerClass: "text-rose-600 bg-rose-50 border-rose-200",
    badgeClass: "bg-rose-100 text-rose-700",
  },
  {
    status: TASK_STATUS.DONE,
    label: "Done",
    icon: CheckCircle2,
    headerClass: "text-emerald-600 bg-emerald-50 border-emerald-200",
    badgeClass: "bg-emerald-100 text-emerald-700",
  },
];

const PRIORITY_OPTIONS = [
  { value: "URGENT", label: "Urgent", color: "text-rose-500" },
  { value: "HIGH", label: "High", color: "text-amber-500" },
  { value: "NORMAL", label: "Normal", color: "text-blue-500" },
  { value: "LOW", label: "Low", color: "text-zinc-400" },
];

export function TaskList({ sprintId, isSingleTaskMode = false }: TaskListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);
  const departmentId = user?.departmentId || "";
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const curriculumId = searchParams.get("curriculumId") || "";

  // ─── Modal States ──────────────────────────────────────────────────────────
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSingleTaskModalOpen, setIsSingleTaskModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"CREATE" | "UPDATE" | "REVIEW">("CREATE");
  const [taskModalParentTask, setTaskModalParentTask] = useState<TaskItem | null>(null);
  const [validatingTaskId, setValidatingTaskId] = useState<string | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<(TaskItem & { children?: TaskItem[] }) | null>(null);
  const [taskHistory, setTaskHistory] = useState<TaskItem[]>([]);

  const [isSourcesModalOpen, setIsSourcesModalOpen] = useState(false);
  const [selectedSyllabusIdForSources, setSelectedSyllabusIdForSources] = useState("");
  const [selectedSyllabusNameForSources, setSelectedSyllabusNameForSources] = useState("");

  // ─── Filter States ─────────────────────────────────────────────────────────
  const [showDone, setShowDone] = useState(false);
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);

  // ─── Collapsed group state ─────────────────────────────────────────────────
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (status: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const goToReceiveTasks = async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("hopdc_last_sprint_id");
      localStorage.removeItem("hopdc_last_curriculum_id");
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sprints"] }),
      queryClient.invalidateQueries({ queryKey: ["tasks"] }),
      queryClient.invalidateQueries({ queryKey: ["hopdc-receive-task-curriculum-detail"] }),
      queryClient.invalidateQueries({ queryKey: ["syllabus"] }),
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
    ]);
    router.refresh();
    router.push("/dashboard/hopdc/tasks");
  };

  // ─── Open Subtask Creation Modal with CLO/PLO validation ──────────────────
  const onOpenTaskModal = async (
    mode: "CREATE" | "UPDATE" | "REVIEW",
    parentTask: TaskItem,
  ) => {
    if (mode === "CREATE") {
      setValidatingTaskId(parentTask.taskId);
      try {
        if (!curriculumId || !parentTask.subjectId) {
          showToast("Missing curriculum or subject info", "error");
          return;
        }
        const res = await CloPloService.getMappingsBySubjectAndCurriculum(
          parentTask.subjectId,
          curriculumId,
        );
        const mappings = res.data || [];
        if (mappings.length === 0) {
          showToast(
            "This subject does not have CLOs or CLO-PLO mapping. Please configure them before creating the Syllabus!",
            "warning",
          );
          return;
        }
      } catch (err) {
        showToast("Unable to verify CLO-PLO data. Please try again.", "error");
        return;
      } finally {
        setValidatingTaskId(null);
      }
    }
    setTaskModalMode(mode);
    setTaskModalParentTask(parentTask);
    setIsTaskModalOpen(true);
  };

  // ─── Data Queries ──────────────────────────────────────────────────────────
  const { data: departmentAccounts = [], isLoading: isAccountsLoading } = useQuery({
    queryKey: ["assignments-department-accounts", departmentId],
    queryFn: () => AccountService.getAccountsByDepartment(departmentId),
    enabled: !!departmentId,
  });

  const {
    data: tasksRes,
    isLoading: isTasksLoading,
    isError: isTasksError,
    error: tasksError,
  } = useQuery({
    queryKey: isSingleTaskMode ? ["single-tasks", user?.accountId] : ["assignments", sprintId],
    queryFn: async () => {
      if (isSingleTaskMode) {
        if (!user?.accountId) return { content: [] };
        const [createdRes, assignedRes] = await Promise.all([
          TaskService.getTasksV2({ createdBy: user.accountId, size: 200 }),
          TaskService.getTasksV2({ assignTo: user.accountId, size: 200 }),
        ]);

        const merged = [...(createdRes?.content || []), ...(assignedRes?.content || [])];
        
        // Remove duplicates by taskId
        const uniqueTasksMap = new Map<string, TaskItem>();
        merged.forEach((t) => {
          if (t && t.taskId) {
            uniqueTasksMap.set(t.taskId, t);
          }
        });

        // Filter for tasks that do not have sprintId
        const filteredTasks = Array.from(uniqueTasksMap.values()).filter(
          (t) => !t.sprintId
        );

        return { content: filteredTasks };
      } else {
        return TaskService.getTasksV2({ sprintId, size: 100 });
      }
    },
    enabled: isSingleTaskMode ? !!user?.accountId : !!sprintId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const { data: sprintRes } = useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: () => SprintService.getSprintById(sprintId),
    enabled: !isSingleTaskMode && !!sprintId,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const sprint = sprintRes?.data;
  const tasks = useMemo<TaskItem[]>(() => tasksRes?.content || [], [tasksRes]);

  const getParentTrail = (t: TaskItem): TaskItem[] => {
    const trail: TaskItem[] = [];
    let current = t;
    while (current.rootTaskId) {
      const parent = tasks.find((x) => x.taskId === current.rootTaskId);
      if (!parent) break;
      trail.unshift(parent);
      current = parent;
    }
    return trail;
  };

  // ─── Build Tree (group tasks by rootTaskId) ────────────────────────────────
  const rootTasks = useMemo(() => {
    const taskMap: Record<string, TaskItem & { children?: TaskItem[] }> = {};
    const roots: (TaskItem & { children?: TaskItem[] })[] = [];

    tasks.forEach((task) => {
      taskMap[task.taskId] = { ...task, children: [] };
    });

    tasks.forEach((task) => {
      const node = taskMap[task.taskId];
      if (task.rootTaskId && taskMap[task.rootTaskId]) {
        taskMap[task.rootTaskId].children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [tasks]);

  // ─── Sync selected task with refreshed data ────────────────────────────────
  useEffect(() => {
    if (selectedTask) {
      const findInTree = (
        list: (TaskItem & { children?: TaskItem[] })[],
        id: string,
      ): (TaskItem & { children?: TaskItem[] }) | null => {
        for (const node of list) {
          if (node.taskId === id) return node;
          if (node.children) {
            const found = findInTree(node.children as (TaskItem & { children?: TaskItem[] })[], id);
            if (found) return found;
          }
        }
        return null;
      };
      const updated = findInTree(rootTasks, selectedTask.taskId);
      if (updated) setSelectedTask(updated);
    }
  }, [rootTasks]);

  // ─── Apply Filters ─────────────────────────────────────────────────────────
  const filteredRootTasks = useMemo(() => {
    let result = rootTasks;
    if (filterPriorities.length > 0) {
      result = result.filter((t) =>
        filterPriorities.includes((t.priority || "NORMAL").toUpperCase()),
      );
    }
    return result;
  }, [rootTasks, filterPriorities]);

  // ─── Group by status ───────────────────────────────────────────────────────
  const tasksByStatus = useMemo(() => {
    const map: Record<string, (TaskItem & { children?: TaskItem[] })[]> = {};
    STATUS_GROUPS.forEach(({ status }) => {
      map[status] = filteredRootTasks.filter((t) => t.status === status);
    });
    return map;
  }, [filteredRootTasks]);

  // ─── Mutations ─────────────────────────────────────────────────────────────
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
      deadline,
    }: {
      taskId: string;
      status: TaskStatus;
      deadline?: string;
    }) => {
      if (deadline) {
        const originalTask = tasks.find((t) => t.taskId === taskId);
        if (originalTask) {
          const payload = {
            assignTo: originalTask.account?.accountId || "",
            taskName: originalTask.taskName,
            description: originalTask.description || "",
            action: originalTask.action || "",
            isAccepted: originalTask.isAccepted ?? null,
            comment: originalTask.comment || "",
            priority: originalTask.priority || "NORMAL",
            type: originalTask.type,
            targetId: originalTask.targetId || originalTask.syllabusId || originalTask.syllabus?.syllabusId || "",
            rootTaskId: originalTask.rootTaskId || "",
            dueDate: deadline,
          };
          await TaskService.updateTask(taskId, payload);
        }
      }
      return TaskService.updateTaskStatus(taskId, status);
    },
    onSuccess: async (_, variables) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${variables.taskId}`);
        window.dispatchEvent(
          new CustomEvent("final-decision-comment-updated", {
            detail: { taskId: variables.taskId, comment: "" },
          }),
        );
      }
      showToast("Task updated successfully", "success");
      await invalidateAssignments();
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to update task", "error");
    },
  });

  const invalidateAssignments = async () => {
    if (isSingleTaskMode) {
      await queryClient.invalidateQueries({ queryKey: ["single-tasks", user?.accountId] });
    } else {
      await queryClient.invalidateQueries({ queryKey: ["assignments", sprintId] });
    }
  };

  const acceptSyllabusMutation = useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      await TaskService.acceptTask(taskId, true, comment);
      return TaskService.updateTaskStatus(taskId, TASK_STATUS.DONE);
    },
    onSuccess: async (_, variables) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${variables.taskId}`);
        window.dispatchEvent(
          new CustomEvent("final-decision-comment-updated", {
            detail: { taskId: variables.taskId, comment: "" },
          }),
        );
      }
      showToast("Syllabus accepted successfully", "success");
      await invalidateAssignments();
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to accept syllabus", "error");
    },
  });

  const rejectSyllabusMutation = useMutation({
    mutationFn: async ({
      task,
      assignTo,
      dueDate,
      comment,
    }: {
      task: TaskItem;
      assignTo: string;
      dueDate: string;
      comment: string;
    }) => {
      const cleanTaskName = task.taskName?.replace(/^(CREATE|UPDATE) SYLLABUS: /, "") || "";
      await TaskService.createTask({
        sprintId: sprintId || "",
        assignTo,
        taskName: `UPDATE SYLLABUS: ${cleanTaskName}`,
        description: comment,
        action: "UPDATE",
        priority: task.priority || "NORMAL",
        type: "SYLLABUS",
        targetId: task.targetId || task.syllabusId || undefined,
        rootTaskId: task.rootTaskId || undefined,
        dueDate,
      });

      const syllabusId = task.targetId || task.syllabusId || task.syllabus?.syllabusId;
      if (syllabusId && user?.accountId) {
        try {
          await SyllabusService.updateSyllabusStatus(syllabusId, user.accountId, "DRAFT");
        } catch (error) {
          console.warn("Soft fail: Unable to update syllabus status to DRAFT", error);
        }
      }

      const targetSubjectId = task.subjectId || task.subject?.subjectId || task.syllabus?.subjectId;
      if (targetSubjectId) {
        try {
          await CloPloService.updateSubjectClosStatus(targetSubjectId, "INTERNAL_REVIEW");
        } catch (cloStatusErr) {
          console.warn("Soft fail: Failed to update CLOs status to INTERNAL_REVIEW", cloStatusErr);
        }
      }

      return TaskService.acceptTask(task.taskId, false, comment);
    },
    onSuccess: async (_, variables) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${variables.task.taskId}`);
        window.dispatchEvent(
          new CustomEvent("final-decision-comment-updated", {
            detail: { taskId: variables.task.taskId, comment: "" },
          }),
        );
      }
      showToast("Syllabus rejected and update task assigned", "success");
      await invalidateAssignments();
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to reject syllabus", "error");
    },
  });

  const resetDecisionMutation = useMutation({
    mutationFn: async (task: TaskItem) => {
      await TaskService.acceptTask(task.taskId, null, "");
      return TaskService.updateTaskStatus(task.taskId, TASK_STATUS.IN_PROGRESS);
    },
    onSuccess: async (_, variables) => {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${variables.taskId}`);
        window.dispatchEvent(
          new CustomEvent("final-decision-comment-updated", {
            detail: { taskId: variables.taskId, comment: "" },
          }),
        );
      }
      showToast("Decision reset successfully", "success");
      await invalidateAssignments();
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to reset decision", "error");
    },
  });

  // ─── Loading / Error States ────────────────────────────────────────────────
  if (isTasksLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
        <div className="flex items-center gap-3 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-base font-semibold">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (isTasksError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-base text-red-700">
        {(tasksError as Error)?.message || "Failed to load tasks."}
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      {/* Back Button */}
      {!isSingleTaskMode && (
        <button
          onClick={goToReceiveTasks}
          className="group inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:text-[#0b7a47] hover:border-emerald-200 transition-colors w-fit"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Tasks
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">
            {isSingleTaskMode ? "Single Tasks Management" : "Deliverable Execution"}
          </h1>
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            {isSingleTaskMode ? "Independent Tasks" : (sprint?.sprintName || "Tasks")}
          </p>
        </div>

        {!isSingleTaskMode && sprint?.endDate && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl shadow-sm">
            <Clock size={16} className="text-amber-600" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">
                  Deliverable Deadline
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-amber-200/50 text-[9px] font-black text-amber-700 uppercase tracking-tight">
                  {(() => {
                    const diff = new Date(sprint.endDate).getTime() - new Date().getTime();
                    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                    return days > 0
                      ? `${days} days remaining`
                      : days === 0
                      ? "Ends today"
                      : "Expired";
                  })()}
                </span>
              </div>
              <span className="text-sm font-black text-zinc-900 leading-none">
                {new Date(sprint.endDate).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 flex-wrap">
        {isSingleTaskMode && (
          <button
            onClick={() => setIsSingleTaskModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2d6a4f] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#1d5c42] transition-colors shadow-sm mr-auto"
          >
            <Plus size={13} />
            Assign Task
          </button>
        )}
        {/* Active filter chips */}
        {filterPriorities.map((p) => {
          const cfg = getPriorityConfig(p);
          return (
            <div
              key={p}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200 rounded-full text-[10px] font-bold text-zinc-600 shadow-sm"
            >
              <FlagIcon size={11} className={cfg.color} fill={cfg.fill} />
              {cfg.label}
              <button
                onClick={() => setFilterPriorities((prev) => prev.filter((x) => x !== p))}
                className="text-zinc-400 hover:text-zinc-600"
              >
                <X size={11} />
              </button>
            </div>
          );
        })}


        {/* Done Toggle */}
        <button
          onClick={() => setShowDone(!showDone)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm ${
            showDone
              ? "bg-emerald-600 text-white border-emerald-600"
              : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
          }`}
        >
          <CheckCircle2 size={13} />
          Done
        </button>

        {/* Filter Popover Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowFilterPopover(!showFilterPopover);
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-colors shadow-sm ${
              filterPriorities.length > 0
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <Filter size={13} />
            Filter
            {filterPriorities.length > 0 && (
              <span className="px-1 py-0.5 rounded text-[8px] bg-white/20">
                {filterPriorities.length}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showFilterPopover && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-zinc-200 rounded-xl shadow-xl z-30 overflow-hidden"
              >
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-zinc-700 uppercase tracking-widest">
                      Filters
                    </p>
                    {filterPriorities.length > 0 && (
                      <button
                        onClick={() => setFilterPriorities([])}
                        className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">
                      Priority
                    </p>
                    <div className="space-y-0.5">
                      {PRIORITY_OPTIONS.map((opt) => {
                        const cfg = getPriorityConfig(opt.value);
                        const isSelected = filterPriorities.includes(opt.value);
                        return (
                          <button
                            key={opt.value}
                            onClick={() =>
                              setFilterPriorities((prev) =>
                                isSelected
                                  ? prev.filter((x) => x !== opt.value)
                                  : [...prev, opt.value],
                              )
                            }
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-medium transition-colors ${
                              isSelected
                                ? "bg-zinc-100 text-zinc-800"
                                : "hover:bg-zinc-50 text-zinc-700"
                            }`}
                          >
                            <FlagIcon size={13} className={cfg.color} fill={isSelected ? "currentColor" : "none"} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Task Table ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        {/* Table Column Headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-2 border-b border-zinc-100 bg-zinc-50 rounded-t-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400">
          <div className="col-span-6">Name</div>
          <div className="col-span-1">Assignee</div>
          <div className="col-span-1">Due Date</div>
          <div className="col-span-1">Priority</div>
          <div className="col-span-1">Action</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1" />
        </div>

        {/* Status Groups */}
        {STATUS_GROUPS.filter(({ status }) => {
          if (!showDone && status === TASK_STATUS.DONE) return false;
          return true;
        }).map(({ status, label, icon: Icon, headerClass, badgeClass }) => {
          const groupTasks = tasksByStatus[status] || [];
          const isCollapsed = collapsedGroups.has(status);
          const count = groupTasks.length;

          if (count === 0 && status !== TASK_STATUS.TO_DO) return null;

          return (
            <div key={status}>
              {/* Status Group Header */}
              <button
                onClick={() => toggleGroup(status)}
                className={`w-full flex items-center gap-3 px-6 py-2.5 border-b border-t text-left transition-colors ${headerClass}`}
              >
                <span className="flex items-center gap-1.5">
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <Icon size={14} />
                  <span className="text-xs font-black uppercase tracking-wider">{label}</span>
                </span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${badgeClass}`}>
                  {count}
                </span>
              </button>

              {/* Task Rows */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-visible"
                  >
                    {groupTasks.length === 0 ? (
                      <div className="px-6 py-4 text-xs font-medium text-zinc-400 text-center border-b border-zinc-50">
                        No tasks
                      </div>
                    ) : (
                      groupTasks.map((task) => (
                        <TaskRow
                          key={task.taskId}
                          task={task}
                          level={0}
                          pdcmAccounts={departmentAccounts}
                          onOpenTaskModal={onOpenTaskModal}
                          onOpenDetailModal={(t) => {
                            setSelectedTask(t);
                            setTaskHistory(getParentTrail(t));
                            setIsDetailModalOpen(true);
                          }}
                          onUpdateStatus={(taskId, status) =>
                            updateStatusMutation.mutate({ taskId, status })
                          }
                        />
                      ))
                    )}


                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ─── Task Detail Modal ────────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTask(null);
            setTaskHistory([]);
          }}
          task={selectedTask}
          pdcmAccounts={departmentAccounts}
          currentUser={user as User | null}
          curriculumId={curriculumId}
          sprintId={sprintId}
          sprintDeadline={sprint?.endDate}
          onUpdateStatus={(taskId, status, deadline) =>
            updateStatusMutation.mutate({ taskId, status, deadline })
          }
          isUpdatingStatus={updateStatusMutation.isPending}
          onOpenTaskModal={onOpenTaskModal}
          onAcceptSyllabus={async (t, comment) => {
            await acceptSyllabusMutation.mutateAsync({ taskId: t.taskId, comment });
          }}
          onRejectSyllabus={async (t, assignTo, dueDate, comment) => {
            await rejectSyllabusMutation.mutateAsync({ task: t, assignTo, dueDate, comment });
          }}
          onResetDecision={async (t) => {
            await resetDecisionMutation.mutateAsync(t);
          }}
          taskHistory={taskHistory}
          onNavigateToHistory={(index) => {
            const targetTask = taskHistory[index];
            setTaskHistory((prev) => prev.slice(0, index));
            const findInTree = (
              list: (TaskItem & { children?: TaskItem[] })[],
              id: string,
            ): (TaskItem & { children?: TaskItem[] }) | null => {
              for (const node of list) {
                if (node.taskId === id) return node;
                if (node.children) {
                  const found = findInTree(node.children as (TaskItem & { children?: TaskItem[] })[], id);
                  if (found) return found;
                }
              }
              return null;
            };
            const found = findInTree(rootTasks, targetTask.taskId);
            if (found) setSelectedTask(found);
          }}
          onSelectTask={(t) => {
            if (selectedTask) {
              setTaskHistory((prev) => [...prev, selectedTask]);
            }
            // Open detail modal for a subtask by finding it in the tree
            const findInTree = (
              list: (TaskItem & { children?: TaskItem[] })[],
              id: string,
            ): (TaskItem & { children?: TaskItem[] }) | null => {
              for (const node of list) {
                if (node.taskId === id) return node;
                if (node.children) {
                  const found = findInTree(node.children as (TaskItem & { children?: TaskItem[] })[], id);
                  if (found) return found;
                }
              }
              return null;
            };
            const found = findInTree(rootTasks, t.taskId);
            if (found) setSelectedTask(found);
          }}
        />
      )}

      {/* ─── Manage Sources Modal ─────────────────────────────────────────────── */}
      <ManageSyllabusSourcesModal
        syllabusId={selectedSyllabusIdForSources}
        syllabusName={selectedSyllabusNameForSources}
        isOpen={isSourcesModalOpen}
        onClose={() => {
          setIsSourcesModalOpen(false);
          setSelectedSyllabusIdForSources("");
        }}
      />

      {/* ─── Create Subtask Modal ─────────────────────────────────────────────── */}
      {taskModalParentTask?.type === "SUBJECT" ? (
        <CreateSyllabusAdvancedModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskModalParentTask(null);
          }}
          onSuccess={() => {
            invalidateAssignments();
          }}
          sprintId={sprintId}
          rootTaskId={taskModalParentTask?.taskId || null}
          subjectId={taskModalParentTask?.subjectId}
          subjectName={taskModalParentTask?.taskName?.replace("CREATE SUBJECT: ", "")}
          accounts={departmentAccounts}
          currentUserEmail={user?.email || ""}
          sprintDeadline={sprint?.endDate}
        />
      ) : (
        <CreateSyllabusTaskModal
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setTaskModalParentTask(null);
          }}
          onSuccess={() => {
            invalidateAssignments();
          }}
          mode={taskModalMode}
          sprintId={sprintId}
          rootTaskId={taskModalParentTask?.taskId || null}
          subjectId={taskModalParentTask?.subjectId}
          subjectName={taskModalParentTask?.taskName?.replace(/^(CREATE|UPDATE) SYLLABUS: /, "")}
          targetId={
            taskModalParentTask?.targetId ||
            taskModalParentTask?.syllabus?.syllabusId ||
            taskModalParentTask?.syllabusId
          }
          accounts={departmentAccounts}
          currentUserEmail={user?.email || ""}
          sprintDeadline={sprint?.endDate}
          initialData={
            taskModalMode === "UPDATE"
              ? {
                  taskName: `UPDATE SYLLABUS: ${taskModalParentTask?.taskName?.replace(/^(CREATE|UPDATE) SYLLABUS: /, "") || ""}`,
                  description:
                    (
                      document.getElementById(
                        `comment-${taskModalParentTask?.taskId}`,
                      ) as HTMLTextAreaElement
                    )?.value || "",
                  priority: taskModalParentTask?.priority,
                  dueDate: taskModalParentTask?.deadline,
                  assignTo: taskModalParentTask?.account?.accountId,
                }
              : taskModalMode === "REVIEW"
              ? {
                  taskName: `REVIEW SYLLABUS: ${taskModalParentTask?.taskName?.replace(/^(CREATE|UPDATE) SYLLABUS: /, "") || ""}`,
                  description: `Review syllabus content for ${taskModalParentTask?.taskName?.replace(/^(CREATE|UPDATE) SYLLABUS: /, "") || ""}`,
                  priority: "NORMAL",
                  dueDate: taskModalParentTask?.deadline,
                  excludeAccountId: taskModalParentTask?.account?.accountId,
                }
              : {
                  taskName: `CREATE SYLLABUS: ${taskModalParentTask?.taskName?.replace("CREATE SUBJECT: ", "") || ""} Syllabus.v1`,
                  description: `Draft syllabus content for ${taskModalParentTask?.taskName?.replace("CREATE SUBJECT: ", "") || ""} Syllabus.v1`,
                  priority: "NORMAL",
                }
          }
        />
      )}

      {isSingleTaskMode && (
        <CreateSingleTaskModal
          isOpen={isSingleTaskModalOpen}
          onClose={() => setIsSingleTaskModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["single-tasks", user?.accountId] });
          }}
          accounts={departmentAccounts}
          currentUserEmail={user?.email || ""}
          departmentId={departmentId}
        />
      )}
    </div>
  );
}
