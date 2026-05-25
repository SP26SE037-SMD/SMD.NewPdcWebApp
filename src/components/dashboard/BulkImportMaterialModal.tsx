"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UploadCloud, Loader2, CheckCircle2, XCircle, FileText, AlertTriangle } from "lucide-react";
import { MaterialService } from "@/services/material.service";
import { BlockService } from "@/services/block.service";
import { parseDocxFile, ParsedBlock } from "@/lib/docx-parser";

const C = {
  primary: "#41683f",
  surface: "#f8faf2",
  onSurface: "#2d342b",
  onSurfaceVariant: "#5a6157",
  outlineVariant: "#adb4a8",
};

type FileStatus = "pending" | "processing" | "success" | "error";

interface ImportFile {
  id: string;
  file: File;
  status: FileStatus;
  materialTitle?: string;
  blocksCount?: number;
  error?: string;
}

interface BulkImportMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  syllabusId: string;
  onSuccess?: () => void;
}

const statusConfig: Record<FileStatus, { icon: any; color: string; label: string }> = {
  pending:    { icon: FileText,       color: "#5a6157", label: "Pending" },
  processing: { icon: Loader2,        color: "#0369a1", label: "Processing..." },
  success:    { icon: CheckCircle2,   color: "#15803d", label: "Success" },
  error:      { icon: XCircle,        color: "#b91c1c", label: "Failed" },
};

export default function BulkImportMaterialModal({
  isOpen,
  onClose,
  syllabusId,
  onSuccess,
}: BulkImportMaterialModalProps) {
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isRunning) return;
    setFiles([]);
    setIsDone(false);
    onClose();
  };

  const addFiles = (newFiles: File[]) => {
    const docxFiles = newFiles.filter(f => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ext === "doc" || ext === "docx";
    });
    if (docxFiles.length === 0) {
      alert("Please select a Word file (.doc, .docx).");
      return;
    }
    setFiles(prev => [
      ...prev,
      ...docxFiles.map(f => ({
        id: crypto.randomUUID(),
        file: f,
        status: "pending" as FileStatus,
      })),
    ]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processAll = async () => {
    if (files.length === 0 || isRunning) return;
    setIsRunning(true);
    setIsDone(false);

    const pendingFiles = files.filter(f => f.status === "pending");

    // Fetch existing materials to find max id
    let nextId = 0;
    try {
      const existingRes = await MaterialService.getMaterialsBySyllabusId(syllabusId);
      const existingMaterials = existingRes?.data || [];
      if (Array.isArray(existingMaterials) && existingMaterials.length > 0) {
        const maxId = Math.max(...existingMaterials.map(m => m.id || 0));
        nextId = maxId + 1;
      }
    } catch (err) {
      console.error("Failed to fetch existing materials to calculate nextId", err);
    }

    for (const importFile of pendingFiles) {
      // Mark as processing
      setFiles(prev =>
        prev.map(f => (f.id === importFile.id ? { ...f, status: "processing" } : f))
      );

      try {
        // 1. Parse the docx file
        const { title, blocks } = await parseDocxFile(importFile.file);

        // 2. Create the material
        const materialRes = await MaterialService.createMaterial({
          title,
          materialType: "DOCUMENT",
          id: nextId,
          syllabusId,
        });

        const materialId =
          (materialRes as any)?.data?.materialId ||
          (materialRes as any)?.materialId;

        if (!materialId) throw new Error("Failed to retrieve materialId from server.");

        // 3. Create blocks
        if (blocks.length > 0) {
          const blockPayload = blocks.map((b: ParsedBlock, idx: number) => ({
            idx: idx + 1,
            blockStyle: b.align || "left",
            blockType: b.type,
            contentText: b.content,
          }));
          await BlockService.createBlocksWithIdx(materialId, blockPayload);
        }

        // 4. Mark success
        setFiles(prev =>
          prev.map(f =>
            f.id === importFile.id
              ? { ...f, status: "success", materialTitle: title, blocksCount: blocks.length }
              : f
          )
        );
      } catch (err: any) {
        setFiles(prev =>
          prev.map(f =>
            f.id === importFile.id
              ? { ...f, status: "error", error: err?.message || "Unknown error" }
              : f
          )
        );
      }
      
      nextId++; // Increment ID for the next file
    }

    setIsRunning(false);
    setIsDone(true);
    onSuccess?.();
  };

  const successCount = files.filter(f => f.status === "success").length;
  const errorCount = files.filter(f => f.status === "error").length;
  const pendingCount = files.filter(f => f.status === "pending").length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-2xl font-black"
                  style={{ color: C.onSurface, fontFamily: "Plus Jakarta Sans, sans-serif" }}
                >
                  Import Materials
                </h2>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                  Supports multiple Word files
                </p>
              </div>
              <button
                onClick={handleClose}
                disabled={isRunning}
                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-zinc-50 hover:bg-rose-50 hover:text-rose-500 transition-all text-zinc-400 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-6">
            {/* Drop zone */}
            {!isDone && (
              <div
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer mb-5 ${
                  dragActive
                    ? "border-[#41683f] bg-[#41683f]/5"
                    : "border-zinc-200 bg-zinc-50 hover:border-[#41683f80]"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !isRunning && inputRef.current?.click()}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  multiple
                  onChange={handleChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mb-3 shadow-sm border border-zinc-100 text-[#41683f]">
                  <UploadCloud size={28} />
                </div>
                <p className="font-bold text-[#2d342b] text-sm mb-1">Drag & drop or click to select files</p>
                <p className="text-xs text-zinc-400">Supports .doc, .docx — Select multiple files</p>
              </div>
            )}

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar mb-5">
                {files.map(f => {
                  const cfg = statusConfig[f.status];
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={f.id}
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl border"
                      style={{
                        borderColor: f.status === "success" ? "#bbf7d0" : f.status === "error" ? "#fecaca" : "#e4e4e7",
                        background: f.status === "success" ? "#f0fdf4" : f.status === "error" ? "#fff5f5" : "#fafafa",
                      }}
                    >
                      <Icon
                        size={18}
                        style={{ color: cfg.color, flexShrink: 0 }}
                        className={f.status === "processing" ? "animate-spin" : ""}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: C.onSurface }}>
                          {f.materialTitle || f.file.name}
                        </p>
                        {f.status === "error" && (
                          <p className="text-xs text-red-500 font-semibold truncate">{f.error}</p>
                        )}
                        {f.status === "pending" && (
                          <p className="text-xs text-zinc-400">{(f.file.size / 1024).toFixed(1)} KB</p>
                        )}
                      </div>
                      {f.status === "pending" && !isRunning && (
                        <button
                          onClick={() => removeFile(f.id)}
                          className="text-zinc-300 hover:text-red-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Summary banner */}
            {isDone && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-2xl mb-5"
                style={{ background: errorCount > 0 ? "#fff7ed" : "#f0fdf4", border: `1px solid ${errorCount > 0 ? "#fed7aa" : "#bbf7d0"}` }}
              >
                {errorCount > 0 ? (
                  <AlertTriangle size={20} className="text-orange-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={20} className="text-green-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-black" style={{ color: C.onSurface }}>
                    Completed!
                  </p>
                  <p className="text-xs text-zinc-500">
                    {successCount > 0 && <span className="text-green-600 font-bold">{successCount} successful</span>}
                    {successCount > 0 && errorCount > 0 && " · "}
                    {errorCount > 0 && <span className="text-red-500 font-bold">{errorCount} failed</span>}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 pb-8 pt-0 flex gap-3">
            <button
              onClick={handleClose}
              disabled={isRunning}
              className="flex-1 py-3.5 rounded-2xl font-bold text-sm bg-zinc-50 text-zinc-500 hover:bg-zinc-100 transition-all disabled:opacity-50"
            >
              {isDone ? "Close" : "Cancel"}
            </button>
            {!isDone && (
              <button
                onClick={processAll}
                disabled={pendingCount === 0 || isRunning}
                className="flex-[2] py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                style={{ background: C.primary, boxShadow: `0 4px 12px ${C.primary}30` }}
              >
                {isRunning ? (
                  <><Loader2 size={18} className="animate-spin" /> Importing ({files.filter(f => f.status === "processing").length}/{files.length})...</>
                ) : (
                  <><UploadCloud size={18} /> Import {pendingCount} file{pendingCount !== 1 ? "s" : ""}</>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
