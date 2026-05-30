"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  X,
  Search,
  Calendar,
  Loader2,
  Check,
  Building2,
  BookOpen,
  Plus,
  Sparkles,
  Target,
  FileText,
  AlertCircle,
  Flag,
  ChevronDown,
} from "lucide-react";
import {
  TaskService,
  TASK_TYPE,
  CreateTaskPayload,
  TaskItem,
  UpdateTaskPayload,
  TASK_STATUS,
  TaskPriority,
} from "@/services/task.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { AccountService } from "@/services/account.service";
import { useToast } from "@/components/ui/Toast";

const getInitials = (name?: string) => {
  if (!name) return "??";
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
};

const PRIORITY_OPTIONS = [
  {
    value: "URGENT",
    label: "Urgent",
    colorClass: "text-rose-500",
    fillClass: "fill-rose-500",
  },
  {
    value: "HIGH",
    label: "High",
    colorClass: "text-amber-500",
    fillClass: "fill-amber-500",
  },
  {
    value: "NORMAL",
    label: "Normal",
    colorClass: "text-blue-500",
    fillClass: "fill-blue-500",
  },
  {
    value: "LOW",
    label: "Low",
    colorClass: "text-zinc-400",
    fillClass: "fill-zinc-400",
  },
];

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
  curriculumId: string;
  departmentId: string;
  task?: TaskItem | null;
  sprintStatus?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  sprintId,
  curriculumId,
  departmentId,
  task,
  sprintStatus,
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Form State
  const [taskName, setTaskName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string | null>("NORMAL");
  const [type, setType] = useState<string>("SUBJECT");
  const [deadline, setDeadline] = useState("");
  const [action, setAction] = useState<string>("CREATE");
  const [assigneeId, setAssigneeId] = useState(""); // Internal state for assignee
  const [isPriorityOpen, setIsPriorityOpen] = useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Fetch Accounts (HoPDC) for auto-assignment
  const { data: accountsRes } = useQuery({
    queryKey: ["accounts-dept", departmentId],
    queryFn: () => AccountService.getAccountsByDepartment(departmentId),
    enabled: isOpen && !!departmentId,
  });

  // Fetch Subjects for selection
  const { data: subjectsRes } = useQuery({
    queryKey: ["subjects-curriculum-dept", curriculumId, departmentId],
    queryFn: () =>
      SubjectService.getSubjects({ curriculumId, departmentId, size: 100 }),
    enabled: isOpen && !!curriculumId && !!departmentId,
  });

  const hopdcs = (accountsRes || []).filter((acc) => acc.roleName === "HOPDC");
  const subjects = subjectsRes?.data?.content || [];

  // Fetch details of the task being edited to ensure complete payload
  const { data: taskDetailRes } = useQuery({
    queryKey: ["task-detail", task?.taskId],
    queryFn: () =>
      task?.taskId
        ? TaskService.getTaskById(task.taskId)
        : Promise.reject("No task ID"),
    enabled: isOpen && !!task?.taskId,
  });

  const latestTask = taskDetailRes?.data;

  const assignedUser = (() => {
    const activeTask = latestTask || task;
    if (activeTask?.account) return activeTask.account;
    return hopdcs.find((h) => h.accountId === assigneeId) || hopdcs[0];
  })();

  // Populate form fields in Edit Mode
  useEffect(() => {
    if (isOpen) {
      const activeTask = latestTask || task;
      if (activeTask) {
        setTaskName(activeTask.taskName || "");
        setSubjectId(activeTask.subjectId || activeTask.targetId || "");
        setDescription(activeTask.description || "");
        setPriority(activeTask.priority || "NORMAL");
        setType(activeTask.type || "SUBJECT");
        setDeadline(
          activeTask.deadline ? activeTask.deadline.split("T")[0] : "",
        );
        setAssigneeId(activeTask.account?.accountId || "");
        setAction(activeTask.action || "CREATE");
      } else {
        resetForm();
      }
    }
  }, [isOpen, task, latestTask]);

  // Auto-set assignee internally if there's any HoPDC and we are not in edit mode
  useEffect(() => {
    if (!task && hopdcs.length > 0 && !assigneeId) {
      setAssigneeId(hopdcs[0].accountId);
    }
  }, [hopdcs, task, assigneeId]);

  useEffect(() => {
    if (subjectId) {
      const sub = subjects.find((s) => s.subjectId === subjectId);
      if (sub) {
        setTaskName(
          `${action} SUBJECT: ${sub.subjectCode} - ${sub.subjectName}`,
        );
      }
    }
  }, [subjectId, action, subjects]);

  // Auto-expand task name textarea height dynamically
  useEffect(() => {
    const handleResize = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    };

    // Run immediately
    handleResize();

    // Also run on a small timeout to handle DOM layout sync when the modal opens
    const timer = setTimeout(handleResize, 50);
    return () => clearTimeout(timer);
  }, [taskName, isOpen]);

  const singleMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => TaskService.createTask(payload),
    onSuccess: (res) => {
      if (
        res.status === 1000 ||
        res.status === 200 ||
        res.status === 201 ||
        (res as any).taskId ||
        (res as any).data?.taskId
      ) {
        showToast("Task created successfully", "success");
        queryClient.invalidateQueries({ queryKey: ["tasks", sprintId] });
        onClose();
        resetForm();
      } else {
        showToast(res.message || "Failed to create task", "error");
      }
    },
    onError: (err: any) =>
      showToast(err.message || "Error creating task", "error"),
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      taskId: string;
      data: UpdateTaskPayload;
    }) => {
      const res = await TaskService.updateTask(payload.taskId, payload.data);
      const activeTask = latestTask || task;
      if (activeTask && (activeTask.status as string) === "OVERDUE") {
        await TaskService.updateTaskStatus(payload.taskId, "IN_PROGRESS");
      }
      return res;
    },
    onSuccess: (res) => {
      if (res.status === 1000 || (res as any).taskId) {
        showToast("Task updated successfully", "success");
        queryClient.invalidateQueries({ queryKey: ["tasks", sprintId] });
        onClose();
        resetForm();
      } else {
        showToast(res.message || "Failed to update task", "error");
      }
    },
    onError: (err: any) =>
      showToast(err.message || "Error updating task", "error"),
  });

  const bulkMutation = useMutation({
    mutationFn: async () => {
      const batchRes = await TaskService.createBatchTasks(sprintId);
      if (batchRes.status !== 1000) {
        throw new Error(batchRes.message || "Failed to generate tasks");
      }
      await SubjectService.updateSubjectStatusesBulk(
        curriculumId,
        SUBJECT_STATUS.WAITING_SYLLABUS,
        departmentId,
        SUBJECT_STATUS.DRAFT,
      );
      return batchRes;
    },
    onSuccess: () => {
      showToast("Tasks generated and synchronized successfully", "success");
      queryClient.invalidateQueries({ queryKey: ["tasks", sprintId] });
      onClose();
    },
    onError: (err: any) => {
      const isAlreadyAdded = err.status === 400 && err.data?.status === 25006;
      showToast(
        isAlreadyAdded
          ? "All subjects already have tasks in this department task"
          : err.message || "Sync error",
        "error",
      );
    },
  });

  const resetForm = () => {
    setTaskName("");
    setSubjectId("");
    setDescription("");
    setPriority("NORMAL");
    setType("SUBJECT");
    setDeadline("");
    setAssigneeId(hopdcs[0]?.accountId || "");
    setAction("CREATE");
    setIsPriorityOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName || !subjectId) return;

    if (task) {
      const activeTask = latestTask || task;

      let formattedDueDate = "";
      if (deadline) {
        formattedDueDate = deadline.split("T")[0];
      } else if (activeTask.deadline) {
        formattedDueDate = activeTask.deadline.split("T")[0];
      }

      const payload: UpdateTaskPayload = {
        assignTo: assigneeId || activeTask.account?.accountId || "",
        taskName: taskName || activeTask.taskName || "",
        description: description || "",
        action: action,
        isAccepted:
          activeTask.isAccepted !== undefined && activeTask.isAccepted !== null
            ? activeTask.isAccepted
            : null,
        comment: activeTask.comment || "",
        priority: (priority === "null"
          ? "NORMAL"
          : priority || activeTask.priority || "NORMAL") as TaskPriority,
        type: "SUBJECT",
        targetId:
          subjectId || activeTask.subjectId || activeTask.targetId || "",
        rootTaskId: "",
        dueDate: formattedDueDate,
      };

      updateMutation.mutate({ taskId: task.taskId, data: payload });
    } else {
      const payload: CreateTaskPayload = {
        sprintId,
        assignTo: assigneeId || undefined,
        taskName,
        description,
        action: action,
        priority: (priority === "null" ? null : priority) as TaskPriority | null,
        type: "SUBJECT",
        targetId: subjectId,
        rootTaskId: null,
        dueDate: deadline ? new Date(deadline).toISOString() : undefined,
      };
      singleMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white border border-zinc-100 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-8 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex flex-col">
            <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">
              {(() => {
                const deptName =
                  task?.subject?.departmentName ||
                  subjects.find((s) => s.department?.departmentName)?.department
                    ?.departmentName ||
                  "Department";
                return `Department - ${deptName}`;
              })()}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">
              {task ? "Update Task Details" : "Create Task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 bg-white border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all rounded-xl shadow-sm active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-10 space-y-10"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              {/* Task Name */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-zinc-900" /> Task Name
                </label>
                <textarea
                  ref={textareaRef}
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g. IT_K18 Syllabus Sync"
                  rows={1}
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-black text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl text-lg tracking-tight resize-none overflow-hidden"
                />
              </div>

              {/* Target Subject */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Target Subject
                </label>
                <select
                  required
                  disabled={task?.status === "IN_PROGRESS"}
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="">Select Subject...</option>
                  {subjects.map((s) => (
                    <option key={s.subjectId} value={s.subjectId}>
                      {s.subjectCode} - {s.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context for this department task..."
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-medium text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl resize-none"
                />
              </div>
            </div>

            <div className="space-y-8">
              {/* Action Dropdown */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Action
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  disabled={task?.status === "IN_PROGRESS"}
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="CREATE">Create</option>
                  <option value="UPDATE">Update</option>
                  <option value="MODIFY">Modify</option>
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Priority
                </label>
                {(() => {
                  const currentPriority =
                    PRIORITY_OPTIONS.find(
                      (opt) => opt.value === (priority || "null"),
                    ) || PRIORITY_OPTIONS[3];
                  return (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsPriorityOpen(!isPriorityOpen)}
                        className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 hover:bg-zinc-100/50 transition-all outline-none rounded-xl flex items-center justify-between"
                      >
                        <span className="flex items-center gap-3">
                          <Flag
                            size={16}
                            className={`${currentPriority.colorClass} ${currentPriority.fillClass}`}
                          />
                          <span>{currentPriority.label}</span>
                        </span>
                        <ChevronDown
                          size={18}
                          className={`text-zinc-400 transition-transform duration-200 ${isPriorityOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      {isPriorityOpen && (
                        <>
                          {/* Overlay to close on outside click */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsPriorityOpen(false)}
                          />

                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 shadow-2xl rounded-xl z-20 overflow-hidden py-1 divide-y divide-zinc-50/50 animate-in fade-in slide-in-from-top-2 duration-150">
                            {PRIORITY_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => {
                                  setPriority(opt.value);
                                  setIsPriorityOpen(false);
                                }}
                                className={`w-full px-4 py-3.5 text-left font-bold text-sm flex items-center justify-between hover:bg-zinc-50 transition-colors ${
                                  (priority || "null") === opt.value
                                    ? "text-zinc-900 bg-zinc-50/40"
                                    : "text-zinc-600"
                                }`}
                              >
                                <span className="flex items-center gap-3">
                                  <Flag
                                    size={16}
                                    className={`${opt.colorClass} ${opt.fillClass}`}
                                  />
                                  <span>{opt.label}</span>
                                </span>
                                {(priority || "null") === opt.value && (
                                  <Check size={16} className="text-zinc-950" />
                                )}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Due Date */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> Due Date
                </label>
                <input
                  type="date"
                  required
                  disabled={task?.status === "IN_PROGRESS"}
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              {/* Assignee Card */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={14} /> Assignee (HoPDC)
                </label>
                {assignedUser ? (
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-zinc-200 rounded-xl">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary border border-primary/20 font-bold text-xs flex-shrink-0 shadow-xs">
                      {getInitials(assignedUser.fullName)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm text-zinc-900 truncate">
                        {assignedUser.fullName}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium truncate mt-0.5">
                        {assignedUser.email || "-"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl text-zinc-400 text-sm font-semibold italic">
                    Unassigned / No HoPDC found
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-6">
          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              singleMutation.isPending ||
              updateMutation.isPending ||
              !taskName ||
              !subjectId
            }
            className="flex items-center gap-3 bg-zinc-900 text-white px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all active:scale-95 disabled:opacity-30 rounded-xl"
          >
            {singleMutation.isPending || updateMutation.isPending ? (
              <>
                {task ? "Updating" : "Constructing"}{" "}
                <Loader2 size={16} className="animate-spin" />
              </>
            ) : (
              <>
                {task ? "Update Task" : "Create Task"} <Check size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
