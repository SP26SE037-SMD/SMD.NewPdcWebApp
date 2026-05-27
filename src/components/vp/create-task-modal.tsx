"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save, FileText, Calendar, Tag, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { MajorService, Major } from "@/services/major.service";
import { DocumentService, DocumentDetail } from "@/services/document.service";
import { TaskService } from "@/services/task.service";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [majors, setMajors] = useState<Major[]>([]);
  const [documents, setDocuments] = useState<DocumentDetail[]>([]);
  
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [action, setAction] = useState("CREATE");
  const [priority, setPriority] = useState("HIGH");
  const [type, setType] = useState("CURRICULUM");
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const [targetId, setTargetId] = useState("");

  const assignTo = "a7e97b05-4fce-4f65-9b01-bd8cafaf3a9a"; // Hardcoded VP assignment

  useEffect(() => {
    if (isOpen) {
      fetchMajors();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedMajorId) {
      fetchDocuments(selectedMajorId);
      setTargetId(""); // Reset document selection when major changes
    } else {
      setDocuments([]);
      setTargetId("");
    }
  }, [selectedMajorId]);

  const resetForm = () => {
    setTaskName("");
    setDescription("");
    setDueDate("");
    setAction("CREATE");
    setPriority("HIGH");
    setType("CURRICULUM");
    setSelectedMajorId("");
    setTargetId("");
  };

  const fetchMajors = async () => {
    try {
      const response = await MajorService.getMajors({ searchBy: "all", size: 100 });
      setMajors(response.data?.content || []);
    } catch (error) {
      toast.error("Failed to load majors.");
    }
  };

  const fetchDocuments = async (majorId: string) => {
    try {
      const response = await DocumentService.getAllDocuments({ majorId, status: "ACTIVE" });
      setDocuments(response.data || []);
    } catch (error) {
      toast.error("Failed to load documents.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!taskName || !action || !priority || !type || !targetId || !dueDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      await TaskService.createTask({
        sprintId: "", // Ignore sprintId per requirements
        assignTo,
        taskName,
        description,
        action,
        priority,
        type,
        targetId,
        dueDate,
      } as any);

      toast.success("Task created successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create task.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-outline/10 flex items-center justify-between bg-primary/5">
            <div>
              <h2 className="text-xl font-bold text-primary">Create New Task</h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Assign a new task to standard VP flow
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-outline/10 text-on-surface-variant transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 overflow-y-auto custom-scrollbar">
            <form id="create-task-form" onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-on-surface-variant flex items-center gap-1.5">
                    <FileText size={16} className="text-primary/70" />
                    Task Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                    placeholder="Enter task name"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-bold text-on-surface-variant">Description</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm resize-none custom-scrollbar font-medium"
                    placeholder="Provide additional details..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-on-surface-variant flex items-center gap-1.5">
                    <Calendar size={16} className="text-primary/70" />
                    Due Date <span className="text-error">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-on-surface-variant flex items-center gap-1.5">
                    <Tag size={16} className="text-primary/70" />
                    Priority <span className="text-error">*</span>
                  </label>
                  <select
                    required
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium bg-white"
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-on-surface-variant flex items-center gap-1.5">
                    Action <span className="text-error">*</span>
                  </label>
                  <select
                    required
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium bg-white"
                  >
                    <option value="CREATE">Create</option>
                    <option value="UPDATE">Update</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-on-surface-variant flex items-center gap-1.5">
                    Type <span className="text-error">*</span>
                  </label>
                  <select
                    required
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-outline/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium bg-white"
                  >
                    <option value="CURRICULUM">Curriculum</option>
                    <option value="MAJOR">Major</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <div className="p-4 rounded-xl border border-outline/10 bg-surface-container-lowest space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle size={16} className="text-primary" />
                      <span className="text-sm font-bold text-on-surface-variant">Target Document Selection</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                          1. Select Major <span className="text-error">*</span>
                        </label>
                        <select
                          required
                          value={selectedMajorId}
                          onChange={(e) => setSelectedMajorId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-outline/20 focus:border-primary outline-none transition-all text-sm font-medium bg-white"
                        >
                          <option value="" disabled>-- Select a major --</option>
                          {majors.map((major) => (
                            <option key={major.majorId} value={major.majorId}>
                              {major.majorCode} - {major.majorName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                          2. Select Document <span className="text-error">*</span>
                        </label>
                        <select
                          required
                          disabled={!selectedMajorId}
                          value={targetId}
                          onChange={(e) => setTargetId(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-outline/20 focus:border-primary outline-none transition-all text-sm font-medium bg-white disabled:bg-outline/5 disabled:cursor-not-allowed"
                        >
                          <option value="" disabled>
                            {selectedMajorId ? "-- Select a document --" : "Select major first"}
                          </option>
                          {documents.map((doc) => (
                            <option key={doc.documentId} value={doc.documentId}>
                              {doc.name || `Document (${doc.documentId.slice(0, 8)})`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-outline/10 bg-white flex justify-end gap-3 mt-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-outline/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-task-form"
              disabled={loading}
              className="px-6 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Create Task
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
