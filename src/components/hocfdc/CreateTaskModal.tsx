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
  AlertCircle
} from "lucide-react";
import { TaskService, TASK_TYPE, CreateTaskPayload, TaskItem, UpdateTaskPayload } from "@/services/task.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { AccountService } from "@/services/account.service";
import { useToast } from "@/components/ui/Toast";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
  curriculumId: string;
  departmentId: string;
  task?: TaskItem | null;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  sprintId,
  curriculumId,
  departmentId,
  task
}) => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  
  // Form State
  const [taskName, setTaskName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string | null>("MEDIUM");
  const [type, setType] = useState<string>(TASK_TYPE.NEW_SUBJECT);
  const [deadline, setDeadline] = useState("");

  const [assigneeId, setAssigneeId] = useState(""); // Internal state for assignee

  // Fetch Accounts (HoPDC) for auto-assignment
  const { data: accountsRes } = useQuery({
    queryKey: ["accounts-dept", departmentId],
    queryFn: () => AccountService.getAccountsByDepartment(departmentId),
    enabled: isOpen && !!departmentId
  });

  // Fetch Subjects for selection
  const { data: subjectsRes } = useQuery({
    queryKey: ["subjects-curriculum-dept", curriculumId, departmentId],
    queryFn: () => SubjectService.getSubjects({ curriculumId, departmentId, size: 100 }),
    enabled: isOpen && !!curriculumId && !!departmentId
  });

  const hopdcs = (accountsRes || []).filter(acc => acc.roleName === 'HOPDC');
  const subjects = subjectsRes?.data?.content || [];

  // Fetch details of the task being edited to ensure complete payload
  const { data: taskDetailRes } = useQuery({
    queryKey: ["task-detail", task?.taskId],
    queryFn: () => task?.taskId ? TaskService.getTaskById(task.taskId) : Promise.reject("No task ID"),
    enabled: isOpen && !!task?.taskId,
  });

  const latestTask = taskDetailRes?.data;

  // Populate form fields in Edit Mode
  useEffect(() => {
    if (isOpen) {
      const activeTask = latestTask || task;
      if (activeTask) {
        setTaskName(activeTask.taskName || "");
        setSubjectId(activeTask.subjectId || activeTask.targetId || "");
        setDescription(activeTask.description || "");
        setPriority(activeTask.priority || "MEDIUM");
        setType(activeTask.type || TASK_TYPE.NEW_SUBJECT);
        setDeadline(activeTask.deadline ? activeTask.deadline.split("T")[0] : "");
        setAssigneeId(activeTask.account?.accountId || "");
      } else {
        resetForm();
      }
    }
  }, [isOpen, task, latestTask]);

  // Auto-set assignee internally if there's only one HoPDC and we are not in edit mode
  useEffect(() => {
    if (!task && hopdcs.length === 1 && !assigneeId) {
      setAssigneeId(hopdcs[0].accountId);
    }
  }, [hopdcs, task]);

  useEffect(() => {
     if (!task && subjectId && !taskName) {
         const sub = subjects.find(s => s.subjectId === subjectId);
         if (sub) {
             setTaskName(`${sub.subjectCode} Deliverable`);
         }
     }
  }, [subjectId, task]);

  const singleMutation = useMutation({
    mutationFn: (payload: CreateTaskPayload) => TaskService.createTask(payload),
    onSuccess: (res) => {
      if (res.status === 1000) {
        showToast("Task created successfully", "success");
        queryClient.invalidateQueries({ queryKey: ["tasks", sprintId] });
        onClose();
        resetForm();
      } else {
        showToast(res.message || "Failed to create task", "error");
      }
    },
    onError: (err: any) => showToast(err.message || "Error creating task", "error")
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { taskId: string; data: UpdateTaskPayload }) => 
      TaskService.updateTask(payload.taskId, payload.data),
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
    onError: (err: any) => showToast(err.message || "Error updating task", "error")
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
        showToast(isAlreadyAdded ? "All subjects already have tasks in this sprint" : (err.message || "Sync error"), "error");
    }
  });

  const resetForm = () => {
    setTaskName("");
    setSubjectId("");
    setDescription("");
    setPriority("MEDIUM");
    setType(TASK_TYPE.NEW_SUBJECT);
    setDeadline("");
    setAssigneeId("");
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
        description: description || activeTask.description || "",
        action: activeTask.action || "",
        isAccepted: activeTask.isAccepted !== undefined && activeTask.isAccepted !== null ? activeTask.isAccepted : null,
        comment: activeTask.comment || "",
        priority: priority === "null" ? "MEDIUM" : (priority || activeTask.priority || "MEDIUM"),
        type: type || activeTask.type || "SYLLABUS",
        targetId: subjectId || activeTask.subjectId || activeTask.targetId || "",
        rootTaskId: activeTask.rootTaskId || "",
        dueDate: formattedDueDate,
      };
      
      updateMutation.mutate({ taskId: task.taskId, data: payload });
    } else {
      const payload: CreateTaskPayload = {
        sprintId,
        assignTo: assigneeId || undefined,
        taskName,
        description,
        action: "CREATE",
        priority: priority === "null" ? null : priority,
        type: "SYLLABUS",
        targetId: subjectId,
        rootTaskId: null,
        dueDate: deadline ? new Date(deadline).toISOString() : undefined,
      };
      singleMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white border border-zinc-100 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-8 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex flex-col">
            <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">
              {task ? "Campaign Update" : "Campaign Execution"}
            </p>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">
              {task ? "Update Task Details" : "Task Intelligence"}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all rounded-xl shadow-sm active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Target size={14} className="text-zinc-900" /> Task Name
                </label>
                <input 
                  type="text"
                  required
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="e.g. IT_K18 Syllabus Sync"
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-black text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl text-lg tracking-tight"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <BookOpen size={14} /> Target Subject
                </label>
                <select
                  required
                  disabled={!!task}
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

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Description
                </label>
                <textarea 
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context for this deliverable..."
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-medium text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl resize-none"
                />
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                     Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl"
                  >
                    <option value={TASK_TYPE.NEW_SUBJECT}>New Subject</option>
                    <option value={TASK_TYPE.REUSED_SUBJECT}>Reused</option>
                    <option value={TASK_TYPE.UPDATED_SUBJECT}>Updated</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                     Priority
                  </label>
                  <select
                    value={priority || "null"}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="null">None</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} /> Deadline
                </label>
                <input 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={14} /> Assignee (HoPDC)
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl"
                >
                  <option value="">Unassigned</option>
                  {hopdcs.map((hopdc) => (
                    <option key={hopdc.accountId} value={hopdc.accountId}>
                      {hopdc.fullName} ({hopdc.email})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </form>

        <div className="p-8 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end gap-6">
          <button 
            onClick={onClose}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={singleMutation.isPending || updateMutation.isPending || !taskName || !subjectId}
            className="flex items-center gap-3 bg-zinc-900 text-white px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all active:scale-95 disabled:opacity-30 rounded-xl"
          >
            {singleMutation.isPending || updateMutation.isPending ? (
              <>{task ? "Updating" : "Constructing"} <Loader2 size={16} className="animate-spin" /></>
            ) : (
              <>{task ? "Update Task" : "Commit Task"} <Check size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
