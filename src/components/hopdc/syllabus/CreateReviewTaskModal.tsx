"use client";

import React, { useState } from "react";
import { X, ClipboardCheck, Calendar, User, Loader2 } from "lucide-react";
import { DepartmentAccount } from "@/services/account.service";
import { CreateReviewTaskPayload, REVIEW_TASK_STATUS } from "@/services/review-task.service";

interface CreateReviewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateReviewTaskPayload) => Promise<void>;
  taskId: string;
  taskName: string;
  reviewers: DepartmentAccount[];
  taskDeadline?: string;
  sprintDeadline?: string;
  assigneeId?: string;
}

export function CreateReviewTaskModal({
  isOpen,
  onClose,
  onSubmit,
  taskId,
  taskName,
  reviewers,
  taskDeadline,
  sprintDeadline,
  assigneeId,
}: CreateReviewTaskModalProps) {
  const [reviewerId, setReviewerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Filter out the person who is assigned to the task
  const filteredReviewers = reviewers.filter(r => r.accountId !== assigneeId);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reviewerId || !dueDate) {
      setError("Please select a reviewer and set an audit deadline.");
      return;
    }

    // Validation logic
    const selectedAuditDeadline = new Date(dueDate);

    if (sprintDeadline) {
      const sprintDeadlineDate = new Date(sprintDeadline);
      sprintDeadlineDate.setHours(0, 0, 0, 0);
      selectedAuditDeadline.setHours(0, 0, 0, 0);

      if (selectedAuditDeadline >= sprintDeadlineDate) {
        setError(`Audit deadline must be before sprint deadline (${formatDate(sprintDeadline)}).`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        taskId,
        reviewerId,
        titleTask: `Review for ${taskName}`,
        dueDate: `${dueDate}T00:00:00Z`,
        status: REVIEW_TASK_STATUS.PENDING,
      });
      onClose();
      // Reset form
      setReviewerId("");
      setDueDate("");
    } catch (err: any) {
      setError(err.message || "Failed to create review task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-zinc-900 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center">
              <ClipboardCheck size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase tracking-widest leading-none">Create Review</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mt-1">Initiating Peer Audit</p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Target Task Info */}
          <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Target Deliverable</p>
            <p className="text-sm font-black text-zinc-900">{taskName}</p>
          </div>

          {/* Assign Reviewer */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <User size={12} /> Assign Reviewer
            </label>
            <select
              value={reviewerId}
              onChange={(e) => {
                setReviewerId(e.target.value);
                setError("");
              }}
              className="w-full bg-white border-2 border-zinc-100 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900 transition-all cursor-pointer"
            >
              <option value="">Select a PDCM Lead...</option>
              {filteredReviewers.map((r) => (
                <option key={r.accountId} value={r.accountId}>
                  {r.fullName} ({r.email})
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar size={12} /> Audit Deadline
            </label>
            <div className="relative">
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  setError("");
                }}
                className="w-full bg-white border-2 border-zinc-100 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-900 outline-none focus:border-zinc-900 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold rounded-2xl">
              {error}
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border-2 border-zinc-100 text-zinc-400 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] px-8 py-4 bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Finalize Audit Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
