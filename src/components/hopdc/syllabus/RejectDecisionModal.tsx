"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Calendar, UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { DepartmentAccount } from "@/services/account.service";
import { TaskItem } from "@/services/task.service";
import { useToast } from "@/components/ui/Toast";

const formatToLocalDateInput = (dateInput?: string | Date | null): string => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface RejectDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assignTo: string, dueDate: string, comment: string) => Promise<void>;
  originalTask: TaskItem;
  departmentAccounts: DepartmentAccount[];
  sprintDeadline?: string;
  initialComment?: string;
  isFloating?: boolean;
}

export function RejectDecisionModal({
  isOpen,
  onClose,
  onConfirm,
  originalTask,
  departmentAccounts,
  sprintDeadline,
  initialComment = "",
  isFloating = false,
}: RejectDecisionModalProps) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states
  const [comment, setComment] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeType, setAssigneeType] = useState<"old" | "new">("old");
  const [selectedNewAssignee, setSelectedNewAssignee] = useState("");

  const hasOldAssignee = Boolean(originalTask?.account?.accountId);

  useEffect(() => {
    if (isOpen) {
      setComment(initialComment);
      setDueDate("");
      setAssigneeType(hasOldAssignee ? "old" : "new");
      setSelectedNewAssignee("");
    }
  }, [isOpen, initialComment, hasOldAssignee]);

  // Filter department accounts:
  // - roleName must be "PDCM" or "COLLABORATOR"
  // - exclude old assignee (originalTask.account?.accountId)
  // - exclude task creator (originalTask.createdBy?.accountId)
  const filteredAccounts = useMemo(() => {
    if (!departmentAccounts) return [];
    return departmentAccounts.filter((acc) => {
      const role = acc.roleName?.toUpperCase();
      const isPdcmOrCollab = role === "PDCM" || role === "COLLABORATOR";
      const isOldAssignee = acc.accountId === originalTask?.account?.accountId;
      const isCreator = acc.accountId === originalTask?.createdBy?.accountId;
      return isPdcmOrCollab && !isOldAssignee && !isCreator;
    });
  }, [departmentAccounts, originalTask]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      showToast("Please enter a rejection comment", "error");
      return;
    }
    if (!dueDate) {
      showToast("Please select a due date", "error");
      return;
    }

    let finalAssignee = "";
    if (assigneeType === "old") {
      finalAssignee = originalTask?.account?.accountId || "";
    } else {
      if (!selectedNewAssignee) {
        showToast("Please select a new assignee", "error");
        return;
      }
      finalAssignee = selectedNewAssignee;
    }

    if (!finalAssignee) {
      showToast("No valid assignee selected", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(finalAssignee, dueDate, comment.trim());
      onClose();
    } catch (err: any) {
      showToast(err.message || "Failed to confirm rejection", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const wrapperClass = isFloating
    ? "absolute top-0 left-0 right-0 z-[60] rounded-3xl border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col w-full max-h-[calc(100vh-10rem)] animate-in fade-in slide-in-from-top-2 duration-300"
    : "w-full max-w-xl rounded-[20px] border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300";

  const renderContent = () => (
    <>
      {/* Header */}
      <div className={`flex items-center justify-between border-b border-zinc-100 bg-white shrink-0 ${isFloating ? "px-6 py-4" : "px-8 py-6"}`}>
        <div className="flex items-center gap-3">
          <div className={`rounded-[10px] bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 ${isFloating ? "h-10 w-10" : "h-12 w-12"}`}>
            <AlertCircle size={isFloating ? 20 : 24} />
          </div>
          <div>
            <h3 className={`font-black text-zinc-900 tracking-tight ${isFloating ? "text-sm leading-none" : "text-lg"}`}>
              Reject & Request Update
            </h3>
            <p className={`font-bold text-zinc-400 uppercase tracking-widest mt-1.5 leading-none ${isFloating ? "text-[9px]" : "text-xs"}`}>
              {originalTask?.taskName?.replace("CREATE SYLLABUS: ", "") || "Syllabus Review"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={`border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-all shadow-sm ${isFloating ? "h-8 w-8 rounded-[8px]" : "h-10 w-10 rounded-[10px]"}`}
        >
          <X size={isFloating ? 16 : 20} className="mx-auto" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className={`flex-1 overflow-y-auto space-y-4 ${isFloating ? "px-6 py-4" : "px-8 py-6 space-y-6"}`}>
        
        {/* Rejection Comment */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
            Rejection Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Provide clear reasons and revision requirements..."
            rows={3}
            className={`w-full rounded-[10px] border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-sm font-semibold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all resize-none ${isFloating ? "min-h-[80px]" : "min-h-[90px]"}`}
            required
          />
        </div>

        {/* Assignee Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block">
            Assignee Choice
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {hasOldAssignee && (
              <label
                className={`flex flex-col rounded-xl border-2 cursor-pointer transition-all ${
                  isFloating ? "p-3" : "p-4"
                } ${
                  assigneeType === "old"
                    ? "border-primary bg-emerald-50/5"
                    : "border-zinc-200 hover:border-zinc-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="assigneeType"
                    checked={assigneeType === "old"}
                    onChange={() => setAssigneeType("old")}
                    className="text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span className="text-[10px] font-black text-zinc-800 uppercase tracking-wider">
                    Keep Old User
                  </span>
                </div>
                <span className="text-xs font-bold text-zinc-500 mt-1.5 line-clamp-1">
                  {originalTask?.account?.fullName || "Unassigned"}
                </span>
                <span className="text-[9px] text-zinc-400 font-semibold line-clamp-1 mt-0.5">
                  {originalTask?.account?.email || ""}
                </span>
              </label>
            )}

            <label
              className={`flex flex-col rounded-xl border-2 cursor-pointer transition-all ${
                isFloating ? "p-3" : "p-4"
              } ${
                assigneeType === "new"
                  ? "border-primary bg-emerald-50/5"
                  : "border-zinc-200 hover:border-zinc-300 bg-white"
              } ${!hasOldAssignee ? "col-span-2" : ""}`}
            >
              <div className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="assigneeType"
                  checked={assigneeType === "new"}
                  onChange={() => setAssigneeType("new")}
                  className="text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span className="text-[10px] font-black text-zinc-800 uppercase tracking-wider">
                  Assign New User
                </span>
              </div>
              <span className="text-xs font-bold text-zinc-500 mt-1.5">
                Pick collaborator
              </span>
              <span className="text-[9px] text-zinc-400 font-semibold mt-0.5">
                Active dept account
              </span>
            </label>
          </div>

          {/* New Assignee Select Dropdown */}
          {assigneeType === "new" && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <UserPlus size={12} />
                Select New Assignee
              </label>
              <select
                value={selectedNewAssignee}
                onChange={(e) => setSelectedNewAssignee(e.target.value)}
                className={`w-full rounded-[10px] border border-zinc-200 bg-zinc-50/50 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all appearance-none ${isFloating ? "h-10" : "h-12"}`}
                required
              >
                <option value="">Select Collaborator</option>
                {filteredAccounts.map((acc) => (
                  <option key={acc.accountId} value={acc.accountId}>
                    {acc.fullName} ({acc.roleName || "Collaborator"}) • {acc.email}
                  </option>
                ))}
              </select>
              {filteredAccounts.length === 0 && (
                <p className="text-[10px] font-bold text-amber-600 block mt-1">
                  No other eligible accounts found.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Due Date */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
            <Calendar size={12} />
            Due Date / Deadline
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={formatToLocalDateInput(new Date())}
            max={formatToLocalDateInput(sprintDeadline)}
            className={`w-full rounded-[10px] border border-zinc-200 bg-zinc-50/50 px-4 text-sm font-semibold text-zinc-900 outline-none focus:border-primary focus:bg-white transition-all ${isFloating ? "h-10" : "h-12"}`}
            required
          />
          {sprintDeadline && !isNaN(new Date(sprintDeadline).getTime()) && (
            <span className="text-[10px] font-bold text-amber-600 block mt-1">
              Sprint Deadline: {new Date(sprintDeadline).toLocaleDateString("en-GB")}
            </span>
          )}
        </div>

      </form>

      {/* Footer */}
      <div className={`flex items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/30 shrink-0 ${isFloating ? "px-6 py-4" : "px-8 py-6"}`}>
        <button
          type="button"
          onClick={onClose}
          className={`rounded-[10px] border border-zinc-200 bg-white text-[11px] font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 transition-all ${isFloating ? "h-10 px-4" : "h-12 px-6"}`}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className={`rounded-[10px] bg-rose-600 text-[11px] font-black uppercase tracking-widest text-white hover:bg-rose-700 disabled:opacity-60 shadow-xl shadow-rose-100 transition-all flex items-center gap-2 ${isFloating ? "h-10 px-5" : "h-12 px-8"}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Rejecting...
            </>
          ) : (
            "Confirm Reject"
          )}
        </button>
      </div>
    </>
  );

  if (isFloating) {
    return (
      <div className={wrapperClass}>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md">
      <div className={wrapperClass}>
        {renderContent()}
      </div>
    </div>
  );
}
