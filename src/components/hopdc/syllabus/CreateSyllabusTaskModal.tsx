"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  BookPlus,
  Loader2,
  UserPlus,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { SyllabusService } from "@/services/syllabus.service";
import { TaskService, TASK_STATUS, TASK_TYPE } from "@/services/task.service";
import { DepartmentAccount } from "@/services/account.service";
import { useToast } from "@/components/ui/Toast";
import { CloPloService } from "@/services/cloplo.service";

interface CreateSyllabusTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "CREATE" | "UPDATE" | "REVIEW";
  sprintId: string;
  rootTaskId: string | null;
  subjectId?: string;
  subjectName?: string;
  targetId?: string | null;
  accounts: DepartmentAccount[];
  currentUserEmail: string;
  initialData?: {
    taskName?: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    assignTo?: string;
    excludeAccountId?: string;
  };
  sprintDeadline?: string;
}

export function CreateSyllabusTaskModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  sprintId,
  rootTaskId,
  subjectId,
  subjectName,
  targetId,
  accounts,
  currentUserEmail,
  initialData,
  sprintDeadline,
}: CreateSyllabusTaskModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Form State
  const [taskName, setTaskName] = useState(initialData?.taskName || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [priority, setPriority] = useState(initialData?.priority || "NORMAL");
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
  const [assignTo, setAssignTo] = useState(initialData?.assignTo || "");
  const cleanSubjectName = useMemo(() => {
    if (!subjectName) return "";
    // If it's in "CODE - NAME" format, take only the name
    const parts = subjectName.split(" - ");
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return parts.slice(1).join(" - ");
    }
    return subjectName;
  }, [subjectName]);

  const defaultSyllabusName = cleanSubjectName ? `${cleanSubjectName} Syllabus.v1` : "";

  const [syllabusName, setSyllabusName] = useState(defaultSyllabusName);

  // Sync form state when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setTaskName(initialData?.taskName || "");
      setDescription(initialData?.description || "");
      setPriority(initialData?.priority || "NORMAL");
      setDueDate(initialData?.dueDate || "");
      setAssignTo(initialData?.assignTo || "");
      setSyllabusName(defaultSyllabusName);
      setError("");
      setFieldErrors({});
      setShowConfirm(false);
      
      // Auto-populate task name and description if creating
      if (mode === "CREATE" && defaultSyllabusName) {
        setTaskName(`CREATE SYLLABUS: ${defaultSyllabusName}`);
        setDescription(`Draft syllabus content for ${defaultSyllabusName}`);
      }
    }
  }, [isOpen, initialData, defaultSyllabusName, mode]);

  // Filter accounts by role (PDCM, Collaborator) and exclude specific ID (e.g., Creator for review)
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const role = acc.roleName?.toUpperCase();
      // Exclude Collaborators if mode is REVIEW
      const isAllowedRole =
        mode === "REVIEW" ? role === "PDCM" : (role === "PDCM" || role === "COLLABORATOR");
      const isNotExcluded = acc.accountId !== initialData?.excludeAccountId;
      return isAllowedRole && isNotExcluded;
    });
  }, [accounts, initialData?.excludeAccountId, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!taskName.trim()) errors.taskName = "Task Title is required";
    if (!description.trim()) errors.description = "Description is required";
    if (mode === "CREATE" && !syllabusName.trim())
      errors.syllabusName = "Syllabus Entity Name is required";
    if (!dueDate) errors.dueDate = "Due Date is required";
    if (!assignTo) errors.assignTo = "Assignee is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    if (mode === "CREATE" && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      let finalTargetId = targetId;

      // Step 1: Create Syllabus Entity if in CREATE mode
      if (mode === "CREATE" && subjectId) {
        const syllabusRes = await SyllabusService.createSyllabusByAccount(
          currentUserEmail,
          {
            subjectId,
            syllabusName: syllabusName.trim(),
            minBloomLevel: 0, // Placeholder
          },
        );
        finalTargetId =
          (syllabusRes as any)?.data?.syllabusId ||
          (syllabusRes as any)?.syllabusId;
        if (!finalTargetId)
          throw new Error("Failed to get created Syllabus ID");
      }

      // Step 2: Create Task
      await TaskService.createTask({
        sprintId,
        assignTo,
        taskName: taskName.trim(),
        description: description.trim(),
        action: mode,
        priority: priority as any,
        type: "SYLLABUS",
        targetId: finalTargetId || undefined,
        rootTaskId,
        dueDate,
      });

      // Automatically transition subject's CLOs to INTERNAL_REVIEW when type is SYLLABUS
      if (subjectId) {
        try {
          await CloPloService.updateSubjectClosStatus(subjectId, "INTERNAL_REVIEW");
        } catch (cloStatusErr) {
          console.warn("Soft fail: Failed to update CLOs status to INTERNAL_REVIEW", cloStatusErr);
        }
      }

      showToast(`${mode} SYLLABUS task created successfully`, "success");

      if (rootTaskId && typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${rootTaskId}`);
      }

      // Invalidate relevant queries to refresh CLO status and mappings
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: ["clos", subjectId] });
        queryClient.invalidateQueries({ queryKey: ["mapping-matrix", subjectId] });
        queryClient.invalidateQueries({ queryKey: ["subject-syllabi", subjectId] });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md">
      <div className="w-full max-w-xl rounded-[10px] border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-[10px] flex items-center justify-center ${
                mode === "CREATE"
                  ? "bg-primary/10 text-primary"
                  : mode === "UPDATE"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-indigo-100 text-indigo-700"
              }`}
            >
              <BookPlus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                {mode} SYLLABUS
              </h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Assignment Workflow • {subjectName || "General"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 rounded-[10px] border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm"
          >
            <X size={20} className="mx-auto" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-8 py-6 space-y-6"
        >
          {mode === "CREATE" && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <BookPlus size={12} />
                Syllabus Entity Name
              </label>
              <input
                type="text"
                value={syllabusName}
                onChange={(e) => {
                  const val = e.target.value;
                  setSyllabusName(val);
                  if (fieldErrors.syllabusName) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.syllabusName;
                      return next;
                    });
                  }
                  if (mode === "CREATE") {
                    setTaskName(`CREATE SYLLABUS: ${val}`);
                    setDescription(`Draft syllabus content for ${val}`);
                  }
                }}
                placeholder="e.g. Software Architecture Syllabus.v1"
                className={`w-full h-12 rounded-[10px] border ${
                  fieldErrors.syllabusName
                    ? "border-red-500 bg-red-50/30"
                    : "border-zinc-200 bg-zinc-50/50"
                } px-4 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all`}
                required
              />
              {fieldErrors.syllabusName && (
                <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.syllabusName}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <UserPlus size={12} />
                Assign To
              </label>
              <select
                value={assignTo}
                onChange={(e) => {
                  setAssignTo(e.target.value);
                  if (fieldErrors.assignTo) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.assignTo;
                      return next;
                    });
                  }
                }}
                className={`w-full h-12 rounded-[10px] border ${
                  fieldErrors.assignTo
                    ? "border-red-500 bg-red-50/30"
                    : "border-zinc-200 bg-zinc-50/50"
                } px-4 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all appearance-none`}
                required
              >
                <option value="">Select Assignee</option>
                {filteredAccounts.map((acc) => (
                  <option key={acc.accountId} value={acc.accountId}>
                    {acc.fullName} ({acc.roleName})
                  </option>
                ))}
              </select>
              {fieldErrors.assignTo && (
                <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.assignTo}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar size={12} />
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (fieldErrors.dueDate) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.dueDate;
                      return next;
                    });
                  }
                }}
                className={`w-full h-12 rounded-[10px] border ${
                  fieldErrors.dueDate
                    ? "border-red-500 bg-red-50/30"
                    : "border-zinc-200 bg-zinc-50/50"
                } px-4 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all`}
                required
              />
              {fieldErrors.dueDate && (
                <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                  {fieldErrors.dueDate}
                </p>
              )}
              {sprintDeadline && (
                <div className="flex items-center gap-1.5 px-1 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                    Sprint Deadline: {new Date(sprintDeadline).toLocaleDateString("en-GB")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Task Title
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => {
                setTaskName(e.target.value);
                if (fieldErrors.taskName) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.taskName;
                    return next;
                  });
                }
              }}
              placeholder="e.g. Draft Syllabus Content"
              className={`w-full h-12 rounded-[10px] border ${
                fieldErrors.taskName
                  ? "border-red-500 bg-red-50/30"
                  : "border-zinc-200 bg-zinc-50/50"
              } px-4 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all`}
              required
            />
            {fieldErrors.taskName && (
              <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                {fieldErrors.taskName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Description / Comments
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.description;
                    return next;
                  });
                }
              }}
              rows={3}
              placeholder="Provide instructions or context for the assignee..."
              className={`w-full rounded-[10px] border ${
                fieldErrors.description
                  ? "border-red-500 bg-red-50/30"
                  : "border-zinc-200 bg-zinc-50/50"
              } px-4 py-3 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all resize-none`}
              required
            />
            {fieldErrors.description && (
              <p className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-top-1">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Priority
            </label>
            <div className="flex gap-2">
              {[
                { id: "LOW", color: "emerald" },
                { id: "NORMAL", color: "blue" },
                { id: "HIGH", color: "amber" },
                { id: "URGENT", color: "rose" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`flex-1 py-2 rounded-[10px] text-[10px] font-black uppercase tracking-widest transition-all border ${
                    priority === p.id
                      ? `bg-${p.color}-50 text-${p.color}-700 border-${p.color}-200 shadow-sm`
                      : "bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {p.id}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-[10px] bg-rose-50 border border-rose-100 animate-in slide-in-from-top-2">
              <AlertCircle
                size={16}
                className="text-rose-600 mt-0.5 shrink-0"
              />
              <p className="text-xs font-bold text-rose-700 leading-relaxed">
                {error}
              </p>
            </div>
          )}
        </form>

        <div className="flex items-center justify-end gap-3 px-8 py-6 border-t border-zinc-100 bg-zinc-50/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 px-6 rounded-[10px] border border-zinc-200 bg-white text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="h-12 px-8 rounded-[10px] bg-primary text-[11px] font-black uppercase tracking-widest text-white hover:brightness-95 disabled:opacity-60 shadow-xl shadow-primary/20 transition-all flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Assignment"
            )}
          </button>
        </div>

        {/* Confirmation Overlay */}
        {showConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="max-w-sm text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertCircle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-zinc-900">
                  Confirm Assignment
                </h3>
                <p className="text-sm font-medium text-zinc-500 leading-relaxed">
                  Once the task is assigned, CLOs and CLO-PLO mappings can no
                  longer be edited. Are you sure you want to proceed?
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-[10px] bg-primary text-[11px] font-black uppercase tracking-widest text-white hover:brightness-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    "Yes, Confirm Assignment"
                  )}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-[10px] bg-white border border-zinc-200 text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
