"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  BookPlus,
  Loader2,
  Calendar,
  AlertCircle,
  FolderOpen,
  BookOpen,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  SyllabusService,
  SubjectSyllabusOption,
} from "@/services/syllabus.service";
import { SubjectService } from "@/services/subject.service";
import { TaskService } from "@/services/task.service";
import { DepartmentAccount } from "@/services/account.service";
import { useToast } from "@/components/ui/Toast";

interface CreateSingleTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: DepartmentAccount[];
  currentUserEmail: string;
  departmentId: string;
}

export function CreateSingleTaskModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  currentUserEmail,
  departmentId,
}: CreateSingleTaskModalProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // Subject Selection State
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  // Advanced Mode State
  const [action, setAction] = useState<"CREATE" | "UPDATE">("CREATE");
  const [createMode, setCreateMode] = useState<"NEW" | "COPY">("NEW");
  const [selectedSyllabusId, setSelectedSyllabusId] = useState("");

  // Base Form State
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [assignTo, setAssignTo] = useState("");

  // Query all subjects in department
  const { data: subjectsRes, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["department-subjects-dropdown", departmentId],
    queryFn: () => SubjectService.getSubjects({ departmentId, size: 200 }),
    enabled: !!departmentId && isOpen,
  });

  const subjects = useMemo(() => subjectsRes?.data?.content || [], [subjectsRes]);

  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.subjectId === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  // Clean Name logic
  const cleanSubjectName = useMemo(() => {
    if (!selectedSubject) return "";
    const subjectName = selectedSubject.subjectName;
    const parts = subjectName.split(" - ");
    if (parts.length > 1 && /^\d+$/.test(parts[0])) {
      return parts.slice(1).join(" - ");
    }
    return subjectName;
  }, [selectedSubject]);

  const defaultSyllabusName = useMemo(() => {
    return cleanSubjectName ? `${cleanSubjectName} Syllabus.v1` : "";
  }, [cleanSubjectName]);

  const [syllabusName, setSyllabusName] = useState("");

  // Fetch syllabi for the current selected subject to populate dropdowns
  const { data: syllabiRes, isLoading: isLoadingSyllabi } = useQuery({
    queryKey: ["subject-syllabi-dropdown-single", selectedSubjectId],
    queryFn: () => SyllabusService.getSyllabiBySubject(selectedSubjectId),
    enabled: !!selectedSubjectId && isOpen,
    staleTime: 0,
  });

  const syllabiList = useMemo(() => syllabiRes?.data || [], [syllabiRes]);

  // Suggest version helper
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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSubjectId("");
      setAction("CREATE");
      setCreateMode("NEW");
      setSelectedSyllabusId("");
      setSyllabusName("");
      setTaskName("");
      setDescription("");
      setPriority("NORMAL");
      setDueDate("");
      setAssignTo("");
      setError("");
      setFieldErrors({});
      setShowConfirm(false);
    }
  }, [isOpen]);

  // Sync state when selected subject or details change
  useEffect(() => {
    if (!isOpen || !selectedSubjectId) return;

    if (action === "UPDATE") {
      setTaskName(`UPDATE SYLLABUS: ${cleanSubjectName}`);
      setDescription(`Update syllabus content for ${cleanSubjectName}`);
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
    selectedSubjectId,
    isOpen,
  ]);

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

  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const role = acc.roleName?.toUpperCase();
      return role === "PDCM" || role === "COLLABORATOR";
    });
  }, [accounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: Record<string, string> = {};
    if (!selectedSubjectId) errors.selectedSubjectId = "Subject selection is required";
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

    if (action === "CREATE" && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      let finalTargetId = selectedSyllabusId;

      if (action === "CREATE") {
        if (createMode === "NEW" && selectedSubjectId) {
          const syllabusRes = await SyllabusService.createSyllabusByAccount(
            currentUserEmail,
            {
              subjectId: selectedSubjectId,
              syllabusName: syllabusName.trim(),
              minBloomLevel: 0,
            },
          );
          finalTargetId =
            (syllabusRes as any)?.data?.syllabusId ||
            (syllabusRes as any)?.syllabusId;
          if (!finalTargetId)
            throw new Error("Failed to create brand new Syllabus");
        } else if (createMode === "COPY" && selectedSubjectId) {
          const syllabusRes = await SyllabusService.createSyllabusByAccount(
            currentUserEmail,
            {
              subjectId: selectedSubjectId,
              syllabusName: syllabusName.trim(),
              minBloomLevel: 0,
            },
          );
          finalTargetId =
            (syllabusRes as any)?.data?.syllabusId ||
            (syllabusRes as any)?.syllabusId;
          if (!finalTargetId)
            throw new Error("Failed to create copied Syllabus");

          await SyllabusService.copySyllabus(selectedSyllabusId, finalTargetId);
        }
      }

      // Create Single Task
      await TaskService.createTask({
        sprintId: "",
        assignTo,
        taskName: taskName.trim(),
        description: description.trim(),
        action,
        priority: priority as any,
        type: "SYLLABUS",
        targetId: finalTargetId || undefined,
        rootTaskId: null,
        dueDate,
      });

      showToast(`Standalone ${action} SYLLABUS task assigned successfully`, "success");

      // Invalidate relevant queries
      if (selectedSubjectId) {
        queryClient.invalidateQueries({ queryKey: ["clos", selectedSubjectId] });
        queryClient.invalidateQueries({
          queryKey: ["mapping-matrix", selectedSubjectId],
        });
        queryClient.invalidateQueries({
          queryKey: ["subject-syllabi", selectedSubjectId],
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
                ASSIGN SINGLE TASK
              </h3>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                Standalone Syllabus Management
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
          {/* Subject Dropdown */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <BookOpen size={12} />
              Select Target Subject <span className="text-rose-500">*</span>
            </label>
            {isLoadingSubjects ? (
              <div className="h-12 flex items-center gap-2 px-4 border border-zinc-200 bg-zinc-50/30 rounded-[10px] text-xs font-bold text-zinc-400">
                <Loader2 size={14} className="animate-spin" /> Loading subjects...
              </div>
            ) : (
              <select
                className={`w-full h-12 px-4 border rounded-[10px] text-xs font-bold text-zinc-700 bg-zinc-50/30 outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
                  fieldErrors.selectedSubjectId ? "border-rose-300 bg-rose-50/10" : "border-zinc-200"
                }`}
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <option value="">Select subject...</option>
                {subjects.map((sub) => (
                  <option key={sub.subjectId} value={sub.subjectId}>
                    {sub.subjectCode} - {sub.subjectName}
                  </option>
                ))}
              </select>
            )}
            {fieldErrors.selectedSubjectId && (
              <p className="text-[10px] font-bold text-rose-500">{fieldErrors.selectedSubjectId}</p>
            )}
          </div>

          {/* ACTION = UPDATE FLOW */}
          {selectedSubjectId && action === "UPDATE" && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <FolderOpen size={12} />
                Select Existing Syllabus to Update <span className="text-rose-500">*</span>
              </label>
              {isLoadingSyllabi ? (
                <div className="h-12 flex items-center gap-2 px-4 border border-zinc-200 bg-zinc-50/30 rounded-[10px] text-xs font-bold text-zinc-400">
                  <Loader2 size={14} className="animate-spin" /> Loading syllabi...
                </div>
              ) : syllabiList.length === 0 ? (
                <div className="p-4 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center gap-2 text-xs font-bold text-rose-700">
                  <AlertCircle size={14} /> No syllabi found for this subject.
                  You cannot perform an Update action.
                </div>
              ) : (
                <select
                  className={`w-full h-12 px-4 border rounded-[10px] text-xs font-bold text-zinc-700 bg-zinc-50/30 outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
                    fieldErrors.selectedSyllabusId ? "border-rose-300 bg-rose-50/10" : "border-zinc-200"
                  }`}
                  value={selectedSyllabusId}
                  onChange={(e) => handleSyllabusSelectChange(e.target.value)}
                >
                  {syllabiList.map((s) => (
                    <option key={s.syllabusId} value={s.syllabusId}>
                      {s.syllabusName} ({s.status})
                    </option>
                  ))}
                </select>
              )}
              {fieldErrors.selectedSyllabusId && (
                <p className="text-[10px] font-bold text-rose-500">{fieldErrors.selectedSyllabusId}</p>
              )}
            </div>
          )}

          {/* ACTION = CREATE FLOW */}
          {selectedSubjectId && action === "CREATE" && (
            <div className="space-y-4">
              {/* Option Selector: Create Mode */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                  Syllabus Creation Option
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setCreateMode("NEW")}
                    className={`flex items-center justify-center gap-2 h-12 border rounded-[10px] text-xs font-black uppercase tracking-wider transition-all ${
                      createMode === "NEW"
                        ? "border-[#2d6a4f] text-[#2d6a4f] bg-emerald-50/10"
                        : "border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/50"
                    }`}
                  >
                    Create New
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateMode("COPY")}
                    className={`flex items-center justify-center gap-2 h-12 border rounded-[10px] text-xs font-black uppercase tracking-wider transition-all ${
                      createMode === "COPY"
                        ? "border-[#2d6a4f] text-[#2d6a4f] bg-emerald-50/10"
                        : "border-zinc-200 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/50"
                    }`}
                  >
                    Copy Existing
                  </button>
                </div>
              </div>

              {/* COPY Mode details */}
              {createMode === "COPY" && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <FolderOpen size={12} />
                    Source Syllabus <span className="text-rose-500">*</span>
                  </label>
                  {isLoadingSyllabi ? (
                    <div className="h-12 flex items-center gap-2 px-4 border border-zinc-200 bg-zinc-50/30 rounded-[10px] text-xs font-bold text-zinc-400">
                      <Loader2 size={14} className="animate-spin" /> Loading syllabi...
                    </div>
                  ) : syllabiList.length === 0 ? (
                    <div className="p-4 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center gap-2 text-xs font-bold text-rose-700">
                      <AlertCircle size={14} /> No existing syllabi to copy from.
                    </div>
                  ) : (
                    <select
                      className={`w-full h-12 px-4 border rounded-[10px] text-xs font-bold text-zinc-700 bg-zinc-50/30 outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
                        fieldErrors.selectedSyllabusId ? "border-rose-300 bg-rose-50/10" : "border-zinc-200"
                      }`}
                      value={selectedSyllabusId}
                      onChange={(e) => handleSyllabusSelectChange(e.target.value)}
                    >
                      <option value="">Select source...</option>
                      {syllabiList.map((s) => (
                        <option key={s.syllabusId} value={s.syllabusId}>
                          {s.syllabusName}
                        </option>
                      ))}
                    </select>
                  )}
                  {fieldErrors.selectedSyllabusId && (
                    <p className="text-[10px] font-bold text-rose-500">{fieldErrors.selectedSyllabusId}</p>
                  )}
                </div>
              )}

              {/* Syllabus Name Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                  Syllabus Entity Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full h-12 px-4 border rounded-[10px] text-xs font-bold text-zinc-700 outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
                    fieldErrors.syllabusName ? "border-rose-300 bg-rose-50/10" : "border-zinc-200"
                  }`}
                  value={syllabusName}
                  onChange={(e) => {
                    setSyllabusName(e.target.value);
                    setTaskName(`CREATE SYLLABUS: ${e.target.value}`);
                    setDescription(`Draft syllabus content for ${e.target.value}`);
                  }}
                  placeholder="e.g. Computer Science Syllabus.v1"
                />
                {fieldErrors.syllabusName && (
                  <p className="text-[10px] font-bold text-rose-500">{fieldErrors.syllabusName}</p>
                )}
              </div>
            </div>
          )}

          {/* Form common details if subject is selected */}
          {selectedSubjectId && (
            <div className="space-y-4 pt-2 border-t border-zinc-100">
              <div className="grid grid-cols-2 gap-4">
                {/* Assign to Dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Assign To <span className="text-rose-500">*</span>
                  </label>
                  <select
                    className={`w-full h-12 px-4 border rounded-[10px] text-xs font-bold text-zinc-700 bg-zinc-50/30 outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
                      fieldErrors.assignTo ? "border-rose-300 bg-rose-50/10" : "border-zinc-200"
                    }`}
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                  >
                    <option value="">Select PDCM...</option>
                    {filteredAccounts.map((acc) => (
                      <option key={acc.accountId} value={acc.accountId}>
                        {acc.fullName} ({acc.roleName})
                      </option>
                    ))}
                  </select>
                  {fieldErrors.assignTo && (
                    <p className="text-[10px] font-bold text-rose-500">{fieldErrors.assignTo}</p>
                  )}
                </div>

                {/* Due Date Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    className={`w-full h-12 px-4 border rounded-[10px] text-xs font-bold text-zinc-700 outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
                      fieldErrors.dueDate ? "border-rose-300 bg-rose-50/10" : "border-zinc-200"
                    }`}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                  {fieldErrors.dueDate && (
                    <p className="text-[10px] font-bold text-rose-500">{fieldErrors.dueDate}</p>
                  )}
                </div>
              </div>

              {/* Task Title Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  className={`w-full h-12 px-4 border rounded-[10px] text-xs font-bold text-zinc-700 outline-none transition-all bg-zinc-50/50 cursor-not-allowed ${
                    fieldErrors.taskName ? "border-rose-300" : "border-zinc-200"
                  }`}
                  value={taskName}
                  readOnly
                  placeholder="Task title"
                />
                {fieldErrors.taskName && (
                  <p className="text-[10px] font-bold text-rose-500">{fieldErrors.taskName}</p>
                )}
              </div>

              {/* Description/Comments Textarea */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                  Description / Comments <span className="text-rose-500">*</span>
                </label>
                <textarea
                  className={`w-full min-h-24 px-4 py-3 border rounded-[10px] text-xs font-medium text-zinc-700 outline-none transition-all resize-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 ${
                    fieldErrors.description ? "border-rose-300 bg-rose-50/10" : "border-zinc-200"
                  }`}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this task..."
                />
                {fieldErrors.description && (
                  <p className="text-[10px] font-bold text-rose-500">{fieldErrors.description}</p>
                )}
              </div>

              {/* Priority Selector */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
                  Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {["LOW", "NORMAL", "HIGH", "URGENT"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`h-10 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                        priority === p
                          ? "bg-primary text-white border-primary shadow-md shadow-primary/20"
                          : "border-zinc-200 text-zinc-500 bg-white hover:bg-zinc-50/50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-[10px] bg-rose-50 border border-rose-100 flex items-center gap-2 text-xs font-bold text-rose-700">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Confirm Warn Block */}
          {showConfirm && (
            <div className="p-4 rounded-[10px] bg-amber-50 border border-amber-200 space-y-2 text-xs font-medium text-amber-800 shrink-0">
              <div className="flex items-center gap-2 font-bold">
                <AlertCircle size={14} className="text-amber-600" />
                <span>Confirm Task Assignment</span>
              </div>
              <p>
                This will assign a new syllabus task for the selected subject.
                Are you sure you want to proceed?
              </p>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 border border-amber-300 rounded-md hover:bg-amber-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-black"
                >
                  {isSubmitting ? "Assigning..." : "Confirm"}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!showConfirm && (
            <div className="flex items-center gap-4 pt-4 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-4 border border-zinc-200 rounded-[10px] text-xs font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50/50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (action === "UPDATE" && syllabiList.length === 0) || !selectedSubjectId}
                className="flex-1 py-4 bg-primary text-white rounded-[10px] text-xs font-black uppercase tracking-widest hover:brightness-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span>Confirm Assignment</span>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
