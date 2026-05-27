"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  Eye,
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { RequestItem, RequestService } from "@/services/request.service";
import { TaskService } from "@/services/task.service";
import { CurriculumService } from "@/services/curriculum.service";

interface RequestsWorkspaceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
  role: "HoCFDC" | "HoPDC" | "VP";
  requestSource: "CREATED" | "RECEIVED";
  onSuccess: () => void;
}

export default function RequestsWorkspaceDetailModal({
  isOpen,
  onClose,
  requestId,
  role,
  requestSource,
  onSuccess,
}: RequestsWorkspaceDetailModalProps) {
  const router = useRouter();
  const [selectedRequest, setSelectedRequest] = useState<RequestItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailComment, setDetailComment] = useState("");
  const [commentError, setCommentError] = useState(false);
  const [viewTaskLoading, setViewTaskLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && requestId) {
      fetchRequestDetail(requestId);
    } else {
      setSelectedRequest(null);
      setDetailComment("");
      setCommentError(false);
    }
  }, [isOpen, requestId]);

  const fetchRequestDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const response = await RequestService.getRequestById(id);
      if (response && response.data) {
        setSelectedRequest(response.data);
      } else {
        setSelectedRequest(null);
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load request detail");
      onClose();
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewTask = async (taskId: string) => {
    if (!taskId) return;
    setViewTaskLoading(true);
    try {
      const res = await TaskService.getSprintCurriculumByTaskId(taskId);
      const data = res?.data || res;
      if (data?.sprintId && data?.curriculumId) {
        onClose();
        if (role === "HoPDC") {
          router.push(
            `/dashboard/hopdc/assignments?sprintId=${data.sprintId}&curriculumId=${data.curriculumId}`,
          );
        } else {
          router.push(
            `/dashboard/hocfdc/framework-execution/${data.curriculumId}/sprints/${data.sprintId}`,
          );
        }
      } else {
        toast.error("Failed to retrieve sprint and curriculum information.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load task details");
    } finally {
      setViewTaskLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: "APPROVED" | "REJECTED") => {
    if (!selectedRequest) return;

    if (newStatus === "REJECTED" && !detailComment.trim()) {
      setCommentError(true);
      toast.error("Comment is required when rejecting a request.");
      return;
    }

    setSubmitting(true);
    try {
      await RequestService.updateRequestStatus(
        selectedRequest.requestId,
        newStatus,
        detailComment.trim() || undefined,
      );
      toast.success(
        newStatus === "APPROVED"
          ? "Request approved successfully!"
          : "Request rejected successfully!",
      );
      onClose();
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update request status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFixCurriculum = async (request: RequestItem) => {
    const majorId =
      request.major?.majorId || request.curriculum?.major?.majorId;
    const curriculumId = request.curriculum?.curriculumId;

    if (!curriculumId || !majorId) {
      toast.error("Required information missing for this request");
      return;
    }

    const toastId = toast.loading("Analyzing curriculum state...");
    try {
      const curRes = await CurriculumService.getCurriculumById(curriculumId);
      const curriculum = curRes?.data || curRes;
      const status = curriculum?.status || curriculum?.curriculumStatus;

      if (role === "HoCFDC") {
        if (status === "DRAFT") {
          const res = await TaskService.getTasks({ majorId, size: 100 });
          const task = res?.content?.find(
            (t) =>
              t.majorId === majorId ||
              t.major?.majorId === majorId ||
              t.curriculumId === curriculumId,
          );

          if (task) {
            toast.success("Navigating to task builder...", { id: toastId });
            router.push(
              `/dashboard/hocfdc/tasks/${task.taskId}?majorId=${majorId}`,
            );
          } else {
            toast.error("Original task not found. Please use the Tasks menu.", {
              id: toastId,
            });
          }
        } else if (status === "SYLLABUS_DEVELOP") {
          toast.success("Navigating to syllabus workspace...", { id: toastId });
          const feedback = request.comment || "";
          router.push(
            `/dashboard/hocfdc/curriculums/${curriculumId}?isFromRejected=true&feedback=${encodeURIComponent(feedback)}`,
          );
        } else {
          toast.error(`Curriculum is currently in ${status} status.`, {
            id: toastId,
          });
        }
      } else {
        if (status === "DRAFT") {
          const res = await TaskService.getTasks({ majorId, size: 100 });
          const task = res?.content?.find(
            (t) =>
              t.majorId === majorId ||
              t.major?.majorId === majorId ||
              t.curriculumId === curriculumId,
          );

          if (task) {
            toast.success("Navigating to assignment workspace...", {
              id: toastId,
            });
            router.push(
              `/dashboard/hopdc/assignments?sprintId=${task.sprintId}&curriculumId=${curriculumId}`,
            );
          } else {
            toast.error("Original task not found.", { id: toastId });
          }
        } else {
          toast.success("Navigating to curriculum deliverables...", {
            id: toastId,
          });
          router.push(`/dashboard/hopdc/sprint-management`);
        }
      }
    } catch (err) {
      console.error("Navigation error:", err);
      toast.error("Failed to analyze curriculum state", { id: toastId });
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
  };

  const getStatusClass = (status: string) => {
    if (status === "PENDING")
      return "bg-amber-500/10 text-amber-600 border border-amber-500/20";
    if (status === "APPROVED")
      return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    if (status === "REJECTED")
      return "bg-rose-500/10 text-rose-600 border border-rose-500/20";
    return "bg-zinc-100 text-zinc-500 border border-zinc-200";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[10px] border border-zinc-200 bg-white shadow-2xl z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div>
              <h2 className="text-xl font-bold text-zinc-900">
                Request Detail
              </h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar text-left">
            {detailLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-400">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold uppercase tracking-widest">
                  Synchronizing Data...
                </p>
              </div>
            ) : selectedRequest ? (
              <div className="space-y-5">
                {/* Title + Status + Date row */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="text-lg font-bold text-zinc-900 leading-snug flex-1">
                      {selectedRequest.title}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider whitespace-nowrap flex-shrink-0 ${getStatusClass(
                        selectedRequest.status,
                      )}`}
                    >
                      {selectedRequest.status === "PENDING" && (
                        <Clock size={11} />
                      )}
                      {selectedRequest.status === "APPROVED" && (
                        <CheckCircle2 size={11} />
                      )}
                      {selectedRequest.status === "REJECTED" && (
                        <XCircle size={11} />
                      )}
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-zinc-400 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={13} className="text-primary/60" />
                      {formatDate(selectedRequest.createdAt)}
                    </span>
                    {selectedRequest.updatedAt && (
                      <span className="text-zinc-300">•</span>
                    )}
                    {selectedRequest.updatedAt && (
                      <span>Modified: {formatDate(selectedRequest.updatedAt)}</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                {selectedRequest.content && (
                  <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
                    <p className="text-sm text-zinc-600 leading-relaxed font-medium whitespace-pre-line">
                      {selectedRequest.content}
                    </p>
                  </div>
                )}

                {/* Info grid: Sender, Receiver */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Sender
                    </label>
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {selectedRequest.createdBy?.fullName || "-"}
                    </p>
                    {selectedRequest.createdBy?.email && (
                      <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                        {selectedRequest.createdBy.email}
                      </p>
                    )}
                  </div>
                  <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      Receiver
                    </label>
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {selectedRequest.receivedBy?.fullName || "-"}
                    </p>
                    {selectedRequest.receivedBy?.email && (
                      <p className="text-[11px] text-zinc-400 font-medium truncate mt-0.5">
                        {selectedRequest.receivedBy.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Attachments */}
                <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-100 flex items-center justify-between text-left">
                  <div className="space-y-1 flex-1 mr-4">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                      {(() => {
                        const t = selectedRequest.type;
                        if (t === "TASK") return "Attachments (Task)";
                        if (t === "SUBJECT") return "Attachments (Subject)";
                        if (t === "SPRINT") return "Attachments (Sprint)";
                        if (t === "MAJOR") return "Attachments (Major)";
                        if (t === "CURRICULUM") return "Attachments (Curriculum)";
                        return "Attachments";
                      })()}
                    </label>
                    <p className="text-sm font-bold text-zinc-900 break-words">
                      {(() => {
                        const t = selectedRequest.type;
                        if (t === "TASK") return selectedRequest.task?.taskName || "-";
                        if (t === "SUBJECT") return selectedRequest.subject ? `${selectedRequest.subject.subjectCode} - ${selectedRequest.subject.subjectName}` : "-";
                        if (t === "SPRINT") return selectedRequest.sprint?.sprintName || "-";
                        if (t === "MAJOR") return selectedRequest.major ? `${selectedRequest.major.majorCode} - ${selectedRequest.major.majorName}` : "-";
                        if (t === "CURRICULUM") return selectedRequest.curriculum ? `${selectedRequest.curriculum.curriculumCode} - ${selectedRequest.curriculum.curriculumName}` : "-";
                        return selectedRequest.curriculum?.curriculumCode || selectedRequest.major?.majorName || "-";
                      })()}
                    </p>
                    {selectedRequest.type === "CURRICULUM" && selectedRequest.curriculum?.major && (
                      <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                        {selectedRequest.curriculum.major.majorCode} - {selectedRequest.curriculum.major.majorName}
                      </p>
                    )}
                  </div>

                  {selectedRequest.type === "TASK" && (
                    <button
                      onClick={() => {
                        const tId = selectedRequest.task?.taskId || selectedRequest.targetId;
                        if (tId) handleViewTask(tId);
                      }}
                      disabled={viewTaskLoading}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2 text-xs font-bold text-primary transition-all duration-300 hover:bg-primary hover:text-white active:scale-95 whitespace-nowrap disabled:opacity-60 disabled:hover:bg-primary/5 disabled:hover:text-primary disabled:hover:scale-100"
                    >
                      {viewTaskLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {viewTaskLoading ? "Loading..." : "View Task"}
                    </button>
                  )}
                </div>

                {/* Decision Comment */}
                {selectedRequest.comment && (
                  <div className={`rounded-xl p-4 border text-left ${
                    selectedRequest.status === "APPROVED" 
                      ? "bg-emerald-50 border-emerald-200/50 text-emerald-950" 
                      : selectedRequest.status === "REJECTED" 
                      ? "bg-rose-50 border-rose-200/50 text-rose-950" 
                      : "bg-amber-50 border-amber-200/50 text-amber-950"
                  }`}>
                    <label className={`text-[10px] font-black uppercase tracking-widest block mb-1.5 ${
                      selectedRequest.status === "APPROVED" 
                        ? "text-emerald-600" 
                        : selectedRequest.status === "REJECTED" 
                        ? "text-rose-600" 
                        : "text-amber-600"
                    }`}>
                      Decision Comment
                    </label>
                    <p className="text-sm font-semibold leading-relaxed italic">
                      &ldquo;{selectedRequest.comment}&rdquo;
                    </p>
                  </div>
                )}

                {/* Action buttons for REJECTED */}
                {selectedRequest && selectedRequest.status === "REJECTED" && role === "HoPDC" && (
                  <div className="flex justify-end gap-3 border-t border-zinc-100 pt-4">
                    <button
                      onClick={() => handleFixCurriculum(selectedRequest)}
                      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-amber-500/20"
                    >
                      <Wrench className="h-4 w-4" />
                      Update Curriculum
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-14 text-center text-zinc-400 italic">
                No detailed metadata available for this entity.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
            {selectedRequest?.status === "PENDING" && requestSource === "RECEIVED" ? (
              <div className="space-y-4">
                <div className="space-y-2 text-left">
                  <label className={`text-xs font-bold uppercase tracking-widest ml-1 ${
                    commentError ? "text-rose-500" : "text-zinc-500"
                  }`}>
                    Comment <span className={`${commentError ? "text-rose-400" : "text-zinc-400"} normal-case tracking-normal font-medium`}>(required for rejection)</span>
                  </label>
                  <textarea
                    value={detailComment}
                    onChange={(e) => {
                      setDetailComment(e.target.value);
                      if (e.target.value.trim()) {
                        setCommentError(false);
                      }
                    }}
                    placeholder="Add your comment here..."
                    rows={3}
                    className={`w-full rounded-xl border px-5 py-3 text-sm font-medium outline-none transition resize-none ${
                      commentError
                        ? "border-rose-500 bg-rose-50/20 focus:border-rose-600 focus:ring-4 focus:ring-rose-500/10"
                        : "border-zinc-200 bg-zinc-50 focus:border-primary focus:ring-4 focus:ring-primary/10"
                    }`}
                  />
                  {commentError && (
                    <p className="text-xs text-rose-500 font-bold ml-1 animate-in fade-in duration-200">
                      Please enter a comment before rejecting this request.
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleUpdateStatus("REJECTED")}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-rose-500 bg-rose-50 px-6 py-2.5 text-sm font-bold text-rose-600 transition-all hover:bg-rose-500 hover:text-white active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateStatus("APPROVED")}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-end">
                <button
                  onClick={onClose}
                  className="px-8 py-2.5 rounded-xl bg-zinc-900 text-white text-sm font-bold shadow-lg shadow-zinc-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
