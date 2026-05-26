"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  BookPlus,
  Loader2,
  UserPlus,
  Calendar,
  AlertCircle,
  Copy,
  PlusCircle,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SyllabusService,
  SubjectSyllabusOption,
} from "@/services/syllabus.service";
import { TaskService, TASK_STATUS, TASK_TYPE } from "@/services/task.service";
import { DepartmentAccount } from "@/services/account.service";
import { useToast } from "@/components/ui/Toast";

interface CreateSyllabusAdvancedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sprintId: string;
  rootTaskId: string | null;
  subjectId?: string;
  subjectName?: string;
  accounts: DepartmentAccount[];
  currentUserEmail: string;
  sprintDeadline?: string;
}

export function CreateSyllabusAdvancedModal({
  isOpen,
  onClose,
  onSuccess,
  sprintId,
  rootTaskId,
  subjectId,
  subjectName,
  accounts,
  currentUserEmail,
  sprintDeadline,
}: CreateSyllabusAdvancedModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Advanced Mode State
  const [action, setAction] = useState<"CREATE" | "UPDATE">("CREATE");
  const [createMode, setCreateMode] = useState<"NEW" | "COPY">("NEW");
  const [selectedSyllabusId, setSelectedSyllabusId] = useState("");

  // Base Form State
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [assignTo, setAssignTo] = useState("");

  // Clean Name logic
  const cleanSubjectName = useMemo(() => {
    if (!subjectName) return "";
    const parts = subjectName.split(" - ");
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return parts.slice(1).join(" - ");
    }
    return subjectName;
  }, [subjectName]);

  const defaultSyllabusName = useMemo(() => {
    return cleanSubjectName ? `${cleanSubjectName} Syllabus.v1` : "";
  }, [cleanSubjectName]);

  const [syllabusName, setSyllabusName] = useState(defaultSyllabusName);

  // Fetch syllabi for the current subject to populate the dropdowns
  const { data: syllabiRes, isLoading: isLoadingSyllabi } = useQuery({
    queryKey: ["subject-syllabi-dropdown", subjectId],
    queryFn: () => SyllabusService.getSyllabiBySubject(subjectId || ""),
    enabled: !!subjectId && isOpen,
    staleTime: 0,
  });

  const syllabiList = useMemo(() => syllabiRes?.data || [], [syllabiRes]);

  // Version increment logic helper
  const suggestVersionIncrement = (name: string): string => {
    const match = name.match(/v(\d+)(?:\.(\d+))?$/i);
    if (match) {
      const major = parseInt(match[1], 10);
      const nextMajor = major + 1;
      return name.slice(0, match.index) + `v${nextMajor}`;
    }
    const dotMatch = name.match(/\.v(\d+)$/i);
    if (dotMatch) {
      const major = parseInt(dotMatch[1], 10);
      const nextMajor = major + 1;
      return name.slice(0, dotMatch.index) + `.v${nextMajor}`;
    }
    return name + ".v2";
  };

  // Sync state when modal opens or toggles
  useEffect(() => {
    if (isOpen) {
      setAction("CREATE");
      setCreateMode("NEW");
      setSelectedSyllabusId("");
      setSyllabusName(defaultSyllabusName);
      setTaskName(`CREATE SYLLABUS: ${defaultSyllabusName}`);
      setDescription(`Draft syllabus content for ${defaultSyllabusName}`);
      setPriority("MEDIUM");
      setDueDate("");
      setAssignTo("");
      setError("");
      setFieldErrors({});
      setShowConfirm(false);
    }
  }, [isOpen, defaultSyllabusName]);

  // Handle Action changes
  useEffect(() => {
    if (!isOpen) return;

    if (action === "UPDATE") {
      setTaskName(`UPDATE SYLLABUS: ${cleanSubjectName}`);
      setDescription(`Update syllabus content for ${cleanSubjectName}`);
      // Default select the first available syllabus if exists
      if (syllabiList.length > 0) {
        setSelectedSyllabusId(syllabiList[0].syllabusId);
      } else {
        setSelectedSyllabusId("");
      }
    } else {
      // action === "CREATE"
      if (createMode === "NEW") {
        setSyllabusName(defaultSyllabusName);
        setTaskName(`CREATE SYLLABUS: ${defaultSyllabusName}`);
        setDescription(`Draft syllabus content for ${defaultSyllabusName}`);
      } else {
        // COPY mode
        if (syllabiList.length > 0) {
          const first = syllabiList[0];
          setSelectedSyllabusId(first.syllabusId);
          const suggested = suggestVersionIncrement(first.syllabusName);
          setSyllabusName(suggested);
          setTaskName(`CREATE SYLLABUS: ${suggested}`);
          setDescription(
            `Draft syllabus content for ${suggested} (Copied from ${first.syllabusName})`,
          );
        } else {
          setSelectedSyllabusId("");
          setSyllabusName(defaultSyllabusName);
          setTaskName(`CREATE SYLLABUS: ${defaultSyllabusName}`);
          setDescription(`Draft syllabus content for ${defaultSyllabusName}`);
        }
      }
    }
    setFieldErrors({});
  }, [
    action,
    createMode,
    syllabiList,
    defaultSyllabusName,
    cleanSubjectName,
    isOpen,
  ]);

  // Handle Copy Source selection changes
  const handleSyllabusSelectChange = (id: string) => {
    setSelectedSyllabusId(id);
    const chosen = syllabiList.find((s) => s.syllabusId === id);
    if (!chosen) return;

    if (action === "UPDATE") {
      setTaskName(`UPDATE SYLLABUS: ${chosen.syllabusName}`);
      setDescription(`Update syllabus content for ${chosen.syllabusName}`);
    } else if (action === "CREATE" && createMode === "COPY") {
      const suggested = suggestVersionIncrement(chosen.syllabusName);
      setSyllabusName(suggested);
      setTaskName(`CREATE SYLLABUS: ${suggested}`);
      setDescription(
        `Draft syllabus content for ${suggested} (Copied from ${chosen.syllabusName})`,
      );
    }
  };

  // Filter accounts by allowed roles (PDCM, Collaborator)
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const role = acc.roleName?.toUpperCase();
      return role === "PDCM" || role === "COLLABORATOR";
    });
  }, [accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!taskName.trim()) errors.taskName = "Task Title is required";
    if (!description.trim()) errors.description = "Description is required";
    if (!dueDate) errors.dueDate = "Due Date is required";
    if (!assignTo) errors.assignTo = "Assignee is required";

    if (action === "UPDATE" && !selectedSyllabusId) {
      errors.selectedSyllabusId = "Please select a syllabus to update";
    }

    if (action === "CREATE") {
      if (!syllabusName.trim()) {
        errors.syllabusName = "Syllabus Name is required";
      }
      if (createMode === "COPY" && !selectedSyllabusId) {
        errors.selectedSyllabusId = "Please select a source syllabus to copy";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    // Show warning prompt for CREATE action before final submit
    if (action === "CREATE" && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      let finalTargetId = selectedSyllabusId;

      if (action === "CREATE") {
        if (createMode === "NEW" && subjectId) {
          // Normal creation
          const syllabusRes = await SyllabusService.createSyllabusByAccount(
            currentUserEmail,
            {
              subjectId,
              syllabusName: syllabusName.trim(),
              minBloomLevel: 0,
            },
          );
          finalTargetId =
            (syllabusRes as any)?.data?.syllabusId ||
            (syllabusRes as any)?.syllabusId;
          if (!finalTargetId)
            throw new Error("Failed to create brand new Syllabus");
        } else if (createMode === "COPY" && subjectId) {
          // 1. Create syllabus entity first
          const syllabusRes = await SyllabusService.createSyllabusByAccount(
            currentUserEmail,
            {
              subjectId,
              syllabusName: syllabusName.trim(),
              minBloomLevel: 0,
            },
          );
          finalTargetId =
            (syllabusRes as any)?.data?.syllabusId ||
            (syllabusRes as any)?.syllabusId;
          if (!finalTargetId)
            throw new Error("Failed to create copied Syllabus");

          // 2. Call the API to copy the old syllabus content to the newly created syllabus
          await SyllabusService.copySyllabus(selectedSyllabusId, finalTargetId);
        }
      }

      // Create Task
      await TaskService.createTask({
        sprintId,
        assignTo,
        taskName: taskName.trim(),
        description: description.trim(),
        action,
        priority,
        type: "SYLLABUS",
        targetId: finalTargetId || undefined,
        rootTaskId,
        dueDate,
      });

      showToast(`${action} SYLLABUS task created successfully`, "success");

      if (rootTaskId && typeof window !== "undefined") {
        localStorage.removeItem(`final_decision_comment_${rootTaskId}`);
      }

      // Invalidate relevant queries
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: ["clos", subjectId] });
        queryClient.invalidateQueries({
          queryKey: ["mapping-matrix", subjectId],
        });
        queryClient.invalidateQueries({
          queryKey: ["subject-syllabi", subjectId],
        });
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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-6 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-[10px] flex items-center justify-center bg-primary/10 text-primary">
              <BookPlus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                ASSIGN SYLLABUS TASK
              </h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                {subjectName || "Subject Details"}
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

        {/* Tab Selector: Action (Create vs Update) */}
        <div className="flex border-b border-zinc-100 bg-zinc-50/50 p-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setAction("CREATE")}
            className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              action === "CREATE"
                ? "bg-white text-primary border border-zinc-200/50 shadow-sm"
                : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            Create Syllabus
          </button>
          <button
            type="button"
            onClick={() => setAction("UPDATE")}
            className={`flex-1 py-3 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              action === "UPDATE"
                ? "bg-white text-primary border border-zinc-200/50 shadow-sm"
                : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            Update Syllabus
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-8 py-6 space-y-5"
        >
          {/* ACTION = UPDATE FLOW */}
          {action === "UPDATE" && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <FolderOpen size={12} />
                Select Existing Syllabus to Update
              </label>
              {isLoadingSyllabi ? (
                <div className="h-12 flex items-center gap-2 px-4 border border-zinc-200 bg-zinc-50/30 rounded-[10px] text-xs font-bold text-zinc-400">
                  <RefreshCw size={14} className="animate-spin" /> Loading
                  syllabi...
                </div>
              ) : syllabiList.length === 0 ? (
                <div className="p-4 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center gap-2 text-xs font-bold text-rose-700">
                  <AlertCircle size={14} /> No syllabi found for this subject.
                  You cannot perform an Update action.
                </div>
              ) : (
                <select
                  value={selectedSyllabusId}
                  onChange={(e) => handleSyllabusSelectChange(e.target.value)}
                  className={`w-full h-12 rounded-[10px] border ${
                    fieldErrors.selectedSyllabusId
                      ? "border-red-500 bg-red-50/30"
                      : "border-zinc-200 bg-zinc-50/50"
                  } px-4 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all`}
                  required
                >
                  {syllabiList.map((s) => (
                    <option key={s.syllabusId} value={s.syllabusId}>
                      {s.syllabusName} ({s.status || "DRAFT"})
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.selectedSyllabusId && (
                <p className="text-[10px] font-bold text-red-500">
                  {fieldErrors.selectedSyllabusId}
                </p>
              )}
            </div>
          )}

          {/* ACTION = CREATE FLOW */}
          {action === "CREATE" && (
            <div className="space-y-4 bg-zinc-50/30 border border-zinc-150 p-4 rounded-xl">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Syllabus Creation Option
                </p>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-[10px] cursor-pointer hover:border-primary/50 transition-all select-none">
                    <span className="flex items-center gap-2 text-xs font-black text-zinc-800 uppercase tracking-wider">
                      <PlusCircle size={14} className="text-zinc-400" />
                      Create New
                    </span>
                    <input
                      type="radio"
                      name="createMode"
                      checked={createMode === "NEW"}
                      onChange={() => setCreateMode("NEW")}
                      className="accent-primary h-4 w-4"
                    />
                  </label>
                  <label className="flex-1 flex items-center justify-between p-3.5 bg-white border border-zinc-200 rounded-[10px] cursor-pointer hover:border-primary/50 transition-all select-none">
                    <span className="flex items-center gap-2 text-xs font-black text-zinc-800 uppercase tracking-wider">
                      <Copy size={14} className="text-zinc-400" />
                      Copy Existing
                    </span>
                    <input
                      type="radio"
                      name="createMode"
                      checked={createMode === "COPY"}
                      onChange={() => setCreateMode("COPY")}
                      className="accent-primary h-4 w-4"
                    />
                  </label>
                </div>
              </div>

              {/* Mode = Copy Existing: Select source syllabus */}
              {createMode === "COPY" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <FolderOpen size={12} />
                    Select Source Syllabus to Copy
                  </label>
                  {isLoadingSyllabi ? (
                    <div className="h-12 flex items-center gap-2 px-4 border border-zinc-200 bg-zinc-50/30 rounded-[10px] text-xs font-bold text-zinc-400">
                      <RefreshCw size={14} className="animate-spin" /> Loading
                      syllabi...
                    </div>
                  ) : syllabiList.length === 0 ? (
                    <div className="p-4 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center gap-2 text-xs font-bold text-rose-700">
                      <AlertCircle size={14} /> No existing syllabi to copy
                      from. Choose "Create New" instead.
                    </div>
                  ) : (
                    <select
                      value={selectedSyllabusId}
                      onChange={(e) =>
                        handleSyllabusSelectChange(e.target.value)
                      }
                      className="w-full h-12 rounded-[10px] border border-zinc-200 bg-white px-4 text-sm font-bold text-zinc-900 outline-none focus:border-primary transition-all"
                      required
                    >
                      <option value="">Select source syllabus</option>
                      {syllabiList.map((s) => (
                        <option key={s.syllabusId} value={s.syllabusId}>
                          {s.syllabusName}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.selectedSyllabusId && (
                    <p className="text-[10px] font-bold text-red-500">
                      {fieldErrors.selectedSyllabusId}
                    </p>
                  )}
                </div>
              )}

              {/* Syllabus Name Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <BookPlus size={12} />
                  {createMode === "COPY"
                    ? "New Copied Syllabus Name"
                    : "Syllabus Entity Name"}
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
                    setTaskName(`CREATE SYLLABUS: ${val}`);
                    setDescription(
                      `Draft syllabus content for ${val}${createMode === "COPY" ? " (Copied)" : ""}`,
                    );
                  }}
                  placeholder="e.g. Syllabus Name v1"
                  className={`w-full h-12 rounded-[10px] border ${
                    fieldErrors.syllabusName
                      ? "border-red-500 bg-red-50/30"
                      : "border-zinc-200 bg-white"
                  } px-4 text-sm font-bold text-zinc-900 outline-none focus:border-primary transition-all`}
                  required
                />
                {fieldErrors.syllabusName && (
                  <p className="text-[10px] font-bold text-red-500">
                    {fieldErrors.syllabusName}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Form Fields: Assign To and Due Date */}
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
                <p className="text-[10px] font-bold text-red-500">
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
                min={new Date().toISOString().slice(0, 10)}
                max={
                  sprintDeadline
                    ? new Date(sprintDeadline).toISOString().slice(0, 10)
                    : undefined
                }
                className={`w-full h-12 rounded-[10px] border ${
                  fieldErrors.dueDate
                    ? "border-red-500 bg-red-50/30"
                    : "border-zinc-200 bg-zinc-50/50"
                } px-4 text-sm font-bold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all`}
                required
              />
              {fieldErrors.dueDate && (
                <p className="text-[10px] font-bold text-red-500">
                  {fieldErrors.dueDate}
                </p>
              )}
              {sprintDeadline && (
                <div className="flex items-center gap-1.5 px-1 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tight">
                    Sprint Deadline:{" "}
                    {new Date(sprintDeadline).toLocaleDateString("en-GB")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Task Title */}
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
              <p className="text-[10px] font-bold text-red-500">
                {fieldErrors.taskName}
              </p>
            )}
          </div>

          {/* Description */}
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
              <p className="text-[10px] font-bold text-red-500">
                {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Priority
            </label>
            <div className="flex gap-2">
              {[
                { id: "LOW", color: "emerald" },
                { id: "MEDIUM", color: "blue" },
                { id: "HIGH", color: "amber" },
                { id: "CRITICAL", color: "rose" },
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

        {/* Footer Actions */}
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
            disabled={
              isSubmitting || (action === "UPDATE" && syllabiList.length === 0)
            }
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
