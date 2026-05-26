"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CalendarClock } from "lucide-react";
import { RequestService } from "@/services/request.service";
import { AccountService } from "@/services/account.service";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

const C = {
  primary: "#409b43",
  surface: "#f8faf2",
  onSurface: "#2d342b",
  onSurfaceVariant: "#5a6157",
  outlineVariant: "#adb4a8",
};

interface ExtensionRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any | null;
  onSuccess?: () => void;
}

export default function ExtensionRequestModal({
  isOpen,
  onClose,
  task,
  onSuccess,
}: ExtensionRequestModalProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !task) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Please fill out both title and content.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Get HOPDC account for the current user
      let receivedById: string | null = null;
      if (user?.accountId) {
        try {
          const hopdcList = await AccountService.getHopdcByAccountId(user.accountId);
          if (hopdcList && hopdcList.length > 0) {
            receivedById = hopdcList[0].accountId;
          }
        } catch (e) {
          console.warn("Could not fetch HOPDC account:", e);
        }
      }

      // 2. Submit the request
      await RequestService.createRequestV2({
        title,
        content,
        type: "EXTENSION",
        targetId: task.taskId,
        receivedById,
      });

      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setTitle("");
    setContent("");
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: C.outlineVariant }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl" style={{ background: `${C.primary}15`, color: C.primary }}>
                <CalendarClock size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: C.onSurface }}>
                  Extension Request
                </h2>
                <p className="text-xs" style={{ color: C.onSurfaceVariant }}>
                  Request more time for task: {task.taskName}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <X size={20} style={{ color: C.onSurfaceVariant }} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700 border border-red-200">
                {error}
              </div>
            )}
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: C.onSurface }}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Need 3 more days to complete"
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none transition-colors"
                style={{ borderColor: C.outlineVariant, color: C.onSurface }}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold" style={{ color: C.onSurface }}>
                Reason / Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Explain why you need an extension..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border focus:outline-none transition-colors resize-none"
                style={{ borderColor: C.outlineVariant, color: C.onSurface }}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-zinc-50 flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-semibold transition-colors hover:bg-zinc-200"
              style={{ color: C.onSurfaceVariant }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: C.primary, minWidth: '120px' }}
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Request"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
