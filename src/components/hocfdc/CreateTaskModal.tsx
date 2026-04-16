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
import { TaskService, TASK_TYPE, CreateTaskPayload } from "@/services/task.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { AccountService } from "@/services/account.service";
import { useToast } from "@/components/ui/Toast";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string;
  curriculumId: string;
  departmentId: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  isOpen, 
  onClose, 
  sprintId,
  curriculumId,
  departmentId
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

  const [assigneeId, setAssigneeId] = useState(""); // Internal state for auto-assign but hidden from UI

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

  // Auto-set assignee internally if there's only one HoPDC
  useEffect(() => {
    if (hopdcs.length === 1 && !assigneeId) {
      setAssigneeId(hopdcs[0].accountId);
    }
  }, [hopdcs]);

  useEffect(() => {
     if (subjectId && !taskName) {
         const sub = subjects.find(s => s.subjectId === subjectId);
         if (sub) {
             setTaskName(`${sub.subjectCode} Deliverable`);
         }
     }
  }, [subjectId]);

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
        SUBJECT_STATUS.DEFINED,
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

    const payload: CreateTaskPayload = {
      sprintId,
      subjectId,
      taskName,
      description,
      priority: priority === "null" ? null : priority,
      type,
      accountId: assigneeId || undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      createdAt: new Date().toISOString()
    };

    singleMutation.mutate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-4xl bg-white border border-zinc-100 shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between p-8 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex flex-col">
            <p className="font-black text-[10px] uppercase tracking-widest text-zinc-400">Campaign Execution</p>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">Task Intelligence</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-white border border-zinc-200 hover:bg-zinc-900 hover:text-white transition-all rounded-xl shadow-sm active:scale-95"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10">
          {/* Quick Generate Section (Optional) */}
          <div className="p-6 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between gap-6 group hover:bg-primary/[0.08] transition-all">
             <div className="flex items-center gap-4">
               <div className="p-3 bg-primary text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                  <Sparkles size={20} />
               </div>
               <div className="space-y-1">
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Bulk Generate Missing Deliverables?</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest opacity-60">Initialize all department subjects in one click</p>
               </div>
             </div>
             <button 
                type="button"
                onClick={() => {
                  if (confirm("Generate all missing deliverables for this department?")) {
                    bulkMutation.mutate();
                  }
                }}
                disabled={bulkMutation.isPending}
                className="px-6 py-3 bg-white border border-zinc-200 text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
             >
                {bulkMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                Quick Launch
             </button>
          </div>

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
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 p-4 font-bold text-zinc-900 focus:border-zinc-900 transition-all outline-none rounded-xl"
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
            disabled={singleMutation.isPending || !taskName || !subjectId}
            className="flex items-center gap-3 bg-zinc-900 text-white px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-primary transition-all active:scale-95 disabled:opacity-30 rounded-xl"
          >
            {singleMutation.isPending ? (
              <>Constructing <Loader2 size={16} className="animate-spin" /></>
            ) : (
              <>Commit Task <Check size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
