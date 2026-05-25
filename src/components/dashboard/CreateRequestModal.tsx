"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, ClipboardList, BookOpen, ChevronDown } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { RequestService } from "@/services/request.service";
import { TaskService } from "@/services/task.service";
import { SyllabusService } from "@/services/syllabus.service";
import { AccountService } from "@/services/account.service";

const C = {
  primary: "#41683f",
  primaryDim: "#355c34",
  primaryContainer: "#c1eeba",
  surface: "#f8faf2",
  surfaceContainerLow: "#f1f5eb",
  surfaceContainer: "#ebf0e5",
  onSurface: "#2d342b",
  onSurfaceVariant: "#5a6157",
  outlineVariant: "#adb4a8",
  onPrimary: "#ffffff",
};

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type RequestType = "TASK" | "SYLLABUS";

export default function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
  const { user } = useSelector((state: RootState) => state.auth);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<RequestType>("TASK");
  const [targetId, setTargetId] = useState("");
  const [receivedById, setReceivedById] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Task list for TASK type
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Syllabus list for SYLLABUS type
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [isLoadingSyllabuses, setIsLoadingSyllabuses] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setContent("");
      setType("TASK");
      setTargetId("");
      setReceivedById("");
      setError(null);
    }
  }, [isOpen]);

  // Fetch HOPDC receiver automatically
  useEffect(() => {
    if (isOpen && user?.accountId) {
      AccountService.getHopdcByAccountId(user.accountId)
        .then(accounts => {
          if (accounts && accounts.length > 0) {
            setReceivedById(accounts[0].accountId);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, user?.accountId]);

  // Load tasks when type = TASK
  useEffect(() => {
    if (!isOpen || type !== "TASK" || !user?.accountId) return;
    setIsLoadingTasks(true);
    setTargetId("");
    TaskService.getTasksV2({
      assignTo: user.accountId,
      action: ["CREATE", "UPDATE"],
      type: "SYLLABUS",
      size: 50,
    })
      .then(res => setTasks(res.content || []))
      .catch(() => setTasks([]))
      .finally(() => setIsLoadingTasks(false));
  }, [isOpen, type, user?.accountId]);

  // Load syllabuses when type = SYLLABUS
  useEffect(() => {
    if (!isOpen || type !== "SYLLABUS" || !user?.accountId) return;
    setIsLoadingSyllabuses(true);
    setTargetId("");
    SyllabusService.getInProgressSyllabiByDepartment()
      .then((res: any) => {
        const data = res?.data?.content || res?.data || [];
        setSyllabuses(Array.isArray(data) ? data : []);
      })
      .catch(() => setSyllabuses([]))
      .finally(() => setIsLoadingSyllabuses(false));
  }, [isOpen, type, user?.accountId]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Vui lòng nhập tiêu đề."); return; }
    if (!content.trim()) { setError("Vui lòng nhập nội dung."); return; }
    if (!targetId) { setError("Vui lòng chọn mục tiêu."); return; }

    setIsSubmitting(true);
    setError(null);
    try {
      await RequestService.createRequestV2({
        title: title.trim(),
        content: content.trim(),
        type,
        targetId,
        receivedById: receivedById.trim() || null,
      });
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Tạo request thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => !isSubmitting && onClose()}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black" style={{ color: C.onSurface, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
                  Tạo Request mới
                </h2>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  Gửi yêu cầu đến người phụ trách
                </p>
              </div>
              <button
                onClick={() => !isSubmitting && onClose()}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 hover:bg-rose-50 hover:text-rose-500 transition-all text-zinc-400"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6 space-y-5 max-h-[65vh] overflow-y-auto">

            {/* Type Dropdown */}
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: C.onSurfaceVariant }}>
                Loại Request
              </label>
              <div className="relative">
                <select
                  value={type}
                  onChange={e => setType(e.target.value as RequestType)}
                  className="w-full px-4 py-3 pr-10 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#41683f26] focus:border-[#41683f80] transition-all appearance-none cursor-pointer"
                  style={{ color: C.onSurface }}
                >
                  <option value="TASK">Task</option>
                  <option value="SYLLABUS">Syllabus</option>
                </select>
                <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: C.onSurfaceVariant }}>
                Tiêu đề
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề request..."
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#41683f26] focus:border-[#41683f80] transition-all"
                style={{ color: C.onSurface }}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: C.onSurfaceVariant }}>
                Nội dung
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Mô tả chi tiết yêu cầu của bạn..."
                rows={3}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#41683f26] focus:border-[#41683f80] transition-all resize-none"
                style={{ color: C.onSurface }}
              />
            </div>

            {/* Target selection */}
            <div>
              <label className="block text-[10px] font-black tracking-widest uppercase mb-2" style={{ color: C.onSurfaceVariant }}>
                {type === "TASK" ? "Chọn Task" : "Chọn Syllabus"}
              </label>
              <div className="relative">
                {(type === "TASK" ? isLoadingTasks : isLoadingSyllabuses) ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
                    <Loader2 size={16} className="animate-spin" /> Đang tải...
                  </div>
                ) : (
                  <>
                    <select
                      value={targetId}
                      onChange={e => setTargetId(e.target.value)}
                      className="w-full px-4 py-3 pr-10 rounded-2xl border border-zinc-200 bg-zinc-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#41683f26] focus:border-[#41683f80] transition-all appearance-none cursor-pointer"
                      style={{ color: targetId ? C.onSurface : C.onSurfaceVariant }}
                    >
                      <option value="">— Chọn {type === "TASK" ? "task" : "syllabus"} —</option>
                      {type === "TASK"
                        ? tasks.map(t => (
                            <option key={t.taskId} value={t.taskId}>
                              {t.taskName || "Untitled Task"} ({t.status})
                            </option>
                          ))
                        : syllabuses.map((s: any) => (
                            <option key={s.syllabusId} value={s.syllabusId}>
                              {s.syllabusName || s.syllabusId}
                            </option>
                          ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400" />
                  </>
                )}
              </div>
            </div>



            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-4 flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-zinc-50 text-zinc-500 hover:bg-zinc-100 transition-all"
            >
              Huỷ
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !content.trim() || !targetId}
              className="flex-[2] py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              style={{ background: C.primary, boxShadow: `0 4px 12px ${C.primary}30` }}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="animate-spin" /> Đang gửi...</>
              ) : (
                <><CheckCircle2 size={18} /> Gửi Request</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
