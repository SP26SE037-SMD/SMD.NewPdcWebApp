"use client";

import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Plus,
  Trash2,
  Loader2,
  Save,
  Info,
  CheckCircle2,
  Circle,
  Pencil,
  Download,
  Upload,
  ShieldCheck,
  FileSearch,
  Lightbulb,
  AlertCircle,
  X,
  Target,
  Gauge,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { SubjectClo } from "@/services/cloplo.service";
import { PLO } from "@/services/curriculum.service";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import { MappingService } from "@/services/mapping.service";
import { useToast } from "@/components/ui/Toast";
import { useSearchParams } from "next/navigation";

const BLOOM_LEVEL_LABELS: Record<number, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Evaluate",
  6: "Create",
};

const BLOOM_LEVEL_BY_KEY: Record<string, number> = {
  REMEMBER: 1,
  UNDERSTAND: 2,
  APPLY: 3,
  ANALYZE: 4,
  EVALUATE: 5,
  CREATE: 6,
};

function formatBloomLevel(value?: string | number): string {
  if (value === undefined || value === null || value === "") {
    return "Bloom N/A";
  }

  const normalized = String(value).trim();
  const parsedNumber = Number(normalized);
  if (!Number.isNaN(parsedNumber) && BLOOM_LEVEL_LABELS[parsedNumber]) {
    return `${parsedNumber} - ${BLOOM_LEVEL_LABELS[parsedNumber]}`;
  }

  const mappedNumber = BLOOM_LEVEL_BY_KEY[normalized.toUpperCase()];
  if (mappedNumber) {
    return `${mappedNumber} - ${BLOOM_LEVEL_LABELS[mappedNumber]}`;
  }

  return normalized;
}

function renderMarkdown(text: string, wrapInQuotes = false) {
  if (!text) return null;
  
  let cleaned = text.trim();
  if (wrapInQuotes) {
    if (!cleaned.startsWith('"') && !cleaned.endsWith('"')) {
      cleaned = `"${cleaned}"`;
    }
  }

  const lines = cleaned.split("\n");
  return (
    <div className="space-y-1.5 text-xs text-zinc-600 leading-relaxed font-medium">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1.5" />;
        
        if (trimmed.startsWith("###")) {
          const headingText = trimmed.replace(/^###\s*/, "");
          return (
            <h3 key={idx} className="text-[10px] font-black text-zinc-800 uppercase tracking-wider mt-2 mb-1">
              {parseBoldText(headingText)}
            </h3>
          );
        }
        
        if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
          const itemText = trimmed.replace(/^[-*]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-1.5 ml-1.5 text-left">
              <span className="text-zinc-400 mt-1.5 shrink-0 block w-1 h-1 rounded-full bg-zinc-400" />
              <span className="text-zinc-600">{parseBoldText(itemText)}</span>
            </div>
          );
        }
        
        return <p key={idx} className="text-zinc-600 text-left">{parseBoldText(line)}</p>;
      })}
    </div>
  );
}

function parseBoldText(text: string) {
  const parts = text.split("**");
  return parts.map((part, idx) => {
    if (idx % 2 === 1) {
      return <strong key={idx} className="font-extrabold text-zinc-950">{part}</strong>;
    }
    return part;
  });
}

function renderWarningText(text: string, wrapInQuotes = false) {
  if (!text) return null;

  // Normalize run-on sentences for Option 1 and Option 2 to place them on new lines
  const formattedText = text
    .replace(/\. (Option 1:)/gi, ".\n* Option 1:")
    .replace(/\. (Option 2:)/gi, ".\n* Option 2:")
    .replace(/\. \* (Option 1:)/gi, ".\n* Option 1:")
    .replace(/\. \* (Option 2:)/gi, ".\n* Option 2:");

  return renderMarkdown(formattedText, wrapInQuotes);
}

function renderReasonText(text: string) {
  if (!text) return null;

  let cleaned = text.trim();
  
  // Strip enclosing quotes, single quotes, asterisks, or underscores
  while (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'")) ||
    (cleaned.startsWith('*') && cleaned.endsWith('*')) ||
    (cleaned.startsWith('_') && cleaned.endsWith('_'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Strip all other markdown italic/bold markers to keep the text non-italic and plain
  cleaned = cleaned.replace(/\*+/g, "").replace(/_+/g, "");

  // Split Solution: to a new line, keeping any text before it
  const formatted = cleaned.replace(/(\s+)?Solution:/gi, "\nSolution:");
  const lines = formatted.split("\n");

  return (
    <span className="block space-y-1 text-left">
      {lines.map((line, idx) => {
        const trimmedLine = line.trim();
        const lowerLine = trimmedLine.toLowerCase();

        if (lowerLine.startsWith("reason:")) {
          const content = trimmedLine.slice(7).trim();
          return (
            <span key={idx} className="block">
              <strong className="font-extrabold text-zinc-950">Reason:</strong>{" "}
              {content}
            </span>
          );
        }

        if (lowerLine.startsWith("solution:")) {
          const content = trimmedLine.slice(9).trim();
          return (
            <span key={idx} className="block">
              <strong className="font-extrabold text-zinc-950">Solution:</strong>{" "}
              {content}
            </span>
          );
        }

        return <span key={idx} className="block">{trimmedLine}</span>;
      })}
    </span>
  );
}

interface CloPloMappingProps {
  plos: PLO[];
  clos: SubjectClo[];
  isPloLoading: boolean;
  isCloLoading: boolean;
  isMappingLoading: boolean;
  matrixMappings: Set<string>;
  toggleMapping: (cloId: string, ploId: string) => void;
  isMapped: (cloId: string, ploId: string) => boolean;
  syncMatrix: () => Promise<void>;
  submittingKey: string | null;
  mappingNotice: string;
  onCreateClo?: () => void;
  onEditClo?: (clo: SubjectClo) => void;
  onDeleteClo?: (cloId: string) => Promise<void>;
  deletingCloId?: string | null;
  hasUnsavedChanges?: boolean;
  addedCount?: number;
  deletedCount?: number;
  iconBgColor?: string;
  iconTextColor?: string;
  onImportClos?: (clos: any[]) => Promise<void>;
  isImportingClos?: boolean;
  disableMapping?: boolean;
  hideImport?: boolean;
  hideCreate?: boolean;
  hideSync?: boolean;
  curriculumId?: string;
  subjectId?: string;
}

export function CloPloMapping({
  plos,
  clos,
  isPloLoading,
  isCloLoading,
  isMappingLoading,
  matrixMappings,
  toggleMapping,
  isMapped,
  syncMatrix,
  submittingKey,
  mappingNotice,
  onCreateClo,
  onEditClo,
  onDeleteClo,
  deletingCloId,
  hasUnsavedChanges = false,
  addedCount = 0,
  deletedCount = 0,
  iconBgColor = "bg-emerald-50",
  iconTextColor = "text-emerald-700",
  onImportClos,
  isImportingClos = false,
  disableMapping = false,
  hideImport = false,
  hideCreate = false,
  hideSync = false,
  curriculumId: curriculumIdProp,
  subjectId: subjectIdProp,
}: CloPloMappingProps) {
  const searchParams = useSearchParams();
  const curriculumId = curriculumIdProp || searchParams.get("curriculumId");
  const subjectId =
    subjectIdProp || searchParams.get("subjectId") || searchParams.get("id");
  const { showToast } = useToast();

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [cloToDelete, setCloToDelete] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [localImporting, setLocalImporting] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);

  const handleValidate = async () => {
    if (!curriculumId || !subjectId) {
      showToast("Curriculum or Subject ID is missing", "error");
      return;
    }
    setIsValidating(true);

    try {
      // Collect current mappings from matrixMappings
      const currentMappings = clos.flatMap((clo) =>
        plos
          .filter((plo) => isMapped(clo.cloId, plo.ploId))
          .map((plo) => ({
            cloId: clo.cloId,
            ploId: plo.ploId,
            contributionLevel: "High", // Default or we could try to find it if we had levels
          })),
      );

      const res = await MappingService.validateCloPloMappings(
        curriculumId,
        subjectId,
        currentMappings,
      );

      if (res.status === 9001) {
        showToast("Failed to validate with AI. Please try again.", "error");
        setValidationResult(null);
        return;
      }

      setValidationResult(res.data);
      if (res.data?.is_logic_valid) {
        showToast("Matrix is logically valid!", "success");
      } else {
        showToast("Logic issues found in the matrix!", "warning");
      }
    } catch (error: any) {
      if (error?.status === 9001 || error?.response?.data?.status === 9001) {
        showToast("Failed to validate with AI. Please try again.", "error");
        setValidationResult(null);
      } else {
        showToast(
          error?.response?.data?.message ||
            error?.message ||
            "Validation failed",
          "error",
        );
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteClick = (cloId: string) => {
    setCloToDelete(cloId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (cloToDelete && onDeleteClo) {
      await onDeleteClo(cloToDelete);
    }
    setIsConfirmModalOpen(false);
    setCloToDelete(null);
  };

  const getCloCoverage = (cloId: string) => {
    return plos.filter((plo) => isMapped(cloId, plo.ploId)).length;
  };

  const getPloSupportCount = (ploId: string) => {
    return clos.filter((clo) => isMapped(clo.cloId, ploId)).length;
  };

  const isSyncing = submittingKey === "sync";

  const handleDownloadTemplate = () => {
    window.location.href = "/Subject_CLOs.xlsx";
  };

  const handleImportClick = () => {
    if (onImportClos) {
      onImportClos([]); // Trigger the modal in SubjectIntakeNewContent
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm p-6 md:p-8 space-y-6 overflow-hidden">
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Delete CLO"
        message="Are you sure you want to delete this CLO? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmModalOpen(false)}
        isDanger={true}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
        <div className="flex items-center gap-3">
          <div
            className={`h-11 w-11 rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shadow-sm`}
          >
            <GitBranch size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">
              CLO-PLO Alignment Matrix
            </h2>
            <p className="text-base text-zinc-500">
              Map Course Learning Outcomes to Program Learning Outcomes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating || clos.length === 0 || plos.length === 0}
              className="h-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isValidating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ShieldCheck size={14} className="text-emerald-600" />
              )}
              {isValidating ? "Validating..." : "Validate Mapping"}
            </button>
          </div>
          {!hideImport && (
            <>
              <button
                type="button"
                onClick={handleImportClick}
                disabled={isImportingClos || localImporting}
                className="h-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isImportingClos || localImporting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                Import Excel
              </button>
            </>
          )}
          {onCreateClo && !hideCreate && (
            <button
              type="button"
              onClick={onCreateClo}
              className="h-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus size={14} />
              Create CLO
            </button>
          )}
          {/* Sync Button Container */}
          {!hideSync && (
            <div className="flex flex-col items-end gap-1.5">
              <button
                type="button"
                onClick={syncMatrix}
                disabled={isSyncing || clos.length === 0 || plos.length === 0}
                className={`h-10 px-6 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md ${
                  hasUnsavedChanges
                    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100 animate-pulse-subtle"
                    : "bg-[#0b7a47] hover:bg-[#08683c] text-white shadow-emerald-100"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isSyncing ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <Save size={14} />
                )}
                {isSyncing ? "Syncing..." : "Sync Matrix"}
              </button>

              {hasUnsavedChanges && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-amber-50/50 border border-amber-100/50 rounded-lg"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tight">
                    Unsaved: {addedCount > 0 && `+${addedCount}`}{" "}
                    {deletedCount > 0 && `-${deletedCount}`}
                  </span>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100">
        <p className="text-sm font-medium text-zinc-600 italic">
          <Info size={14} className="inline mr-1.5 text-zinc-400" />
          {disableMapping
            ? "Mapping alignment is locked for finalized tasks."
            : "Click on the intersections to toggle mapping relationships."}
        </p>
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#0b7a47] shadow-sm shadow-emerald-200" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
              Mapped
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-zinc-200" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
              Unmapped
            </span>
          </div>
        </div>
      </div>



      <AnimatePresence>
        {validationResult && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-primary/5 border border-primary/10 rounded-2xl p-6 overflow-hidden relative"
          >
            <button
              onClick={() => setValidationResult(null)}
              className="absolute top-4 right-4 p-1 hover:bg-primary/10 rounded-full transition-colors"
            >
              <X size={16} className="text-primary" />
            </button>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-primary/10">
                  <Gauge className="text-primary" size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                    Logic Consistency
                  </p>
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        validationResult.is_logic_valid
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                          : "bg-amber-50 border-amber-200 text-amber-600"
                      }`}
                    >
                      {validationResult.is_logic_valid
                        ? "Logically Valid"
                        : "Logic Issues Found"}
                    </div>
                  </div>
                </div>
              </div>

              {validationResult.unmapped_clos?.length > 0 && (
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center border border-red-100">
                    <Target className="text-red-500" size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">
                      Unmapped CLOs
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {validationResult.unmapped_clos.map((cloCode: string) => (
                        <span
                          key={cloCode}
                          className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-md text-[10px] font-black"
                        >
                          {cloCode}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="p-5 bg-white rounded-2xl border border-primary/10 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    AI Suggestions
                  </span>
                </div>
                {renderMarkdown(validationResult.suggestions)}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        {isCloLoading || isPloLoading || isMappingLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#0b7a47]" size={32} />
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
              Loading Matrix Architecture...
            </p>
          </div>
        ) : clos.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base text-zinc-500 font-medium">
              No CLOs found for this subject.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-4 bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 rounded-tl-xl w-[400px] min-w-[400px] max-w-[400px] sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    Course Learning Outcomes (CLOs)
                  </th>
                  {plos.map((plo, idx) => (
                    <th
                      key={plo.ploId}
                      className="p-4 bg-zinc-50 border-b border-zinc-200 text-center min-w-[120px] group/header relative"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[11px] font-black uppercase tracking-widest text-[#0b7a47]">
                          {plo.ploCode || `PLO-${idx + 1}`}
                        </span>
                      </div>

                      {/* Tooltip on hover */}
                      <div className="absolute opacity-0 invisible group-hover/header:opacity-100 group-hover/header:visible transition-all duration-300 top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] bg-zinc-900 text-white text-[11px] rounded-2xl shadow-2xl p-4 z-[100] text-left pointer-events-none border border-zinc-800 backdrop-blur-sm bg-opacity-95">
                        <p className="font-black text-emerald-400 mb-2 tracking-widest uppercase border-b border-zinc-800 pb-2 flex items-center gap-2">
                          <CheckCircle2 size={12} />
                          {plo.ploCode}
                        </p>
                        <p className="font-medium leading-relaxed text-zinc-300 text-sm whitespace-pre-wrap">
                          {plo.description}
                        </p>
                      </div>
                    </th>
                  ))}
                  <th className="p-4 bg-emerald-50/30 border-b border-emerald-100/50 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">
                      Coverage
                    </span>
                  </th>
                  <th className="p-4 bg-emerald-50/30 border-b border-emerald-100/50 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">
                      Validate
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {clos.map((clo, cloIdx) => {
                  const coverage = getCloCoverage(clo.cloId);
                  const isUnmapped = coverage === 0;
                  const isFirstRow = cloIdx === 0;
                  const isLastRow = cloIdx === clos.length - 1;

                  return (
                    <tr
                      key={clo.cloId}
                      className={`group hover:bg-zinc-50/80 transition-colors ${isUnmapped ? "bg-red-50/5" : ""} hover:relative hover:z-20`}
                    >
                      <td className="p-4 border-b border-zinc-100 sticky left-0 bg-white group-hover:bg-zinc-50/80 transition-colors z-10 group-hover:z-30 w-[400px] min-w-[400px] max-w-[400px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col gap-1.5 pr-2">
                          <div className="flex items-center justify-between gap-2">
                            {(() => {
                              const hasInvalidMapping =
                                validationResult?.invalid_mappings?.some(
                                  (m: any) => m.clo_code === clo.cloCode,
                                );
                              return (
                                <span
                                  className={`text-[13px] font-black tracking-tight px-1 rounded ${
                                    hasInvalidMapping
                                      ? "bg-amber-100 text-amber-900"
                                      : isUnmapped
                                        ? "text-red-600"
                                        : "text-zinc-900"
                                  }`}
                                >
                                  {clo.cloCode || "CLO"}
                                </span>
                              );
                            })()}
                            <div className="flex items-center gap-1.5">
                              {(() => {
                                const levelWarning = validationResult?.wrong_level_warnings?.find(
                                  (w: any) => w.clo_code === clo.cloCode
                                );
                                return (
                                  <div className="relative group/bloom inline-block">
                                    <span
                                      className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border flex items-center gap-1.5 transition-all ${
                                        levelWarning
                                          ? "bg-amber-50 text-amber-700 border-amber-200 cursor-help"
                                          : "bg-zinc-100 text-zinc-500 border-zinc-200"
                                      }`}
                                    >
                                      {levelWarning && <AlertTriangle size={10} className="text-amber-500 shrink-0" />}
                                      Bloom: {formatBloomLevel(clo.bloomLevel)}
                                    </span>
                                    {levelWarning && (
                                      <div className={`absolute opacity-0 invisible group-hover/bloom:opacity-100 group-hover/bloom:visible transition-all duration-300 left-0 w-[280px] bg-white border border-amber-200 shadow-2xl rounded-2xl p-4 z-[120] text-left pointer-events-none animate-in fade-in ${isFirstRow ? "top-full mt-2 slide-in-from-top-1" : "bottom-full mb-2 slide-in-from-bottom-1"}`}>
                                        <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-50">
                                          <AlertCircle className="text-amber-500 shrink-0" size={14} />
                                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                            Bloom Level Warning
                                          </p>
                                        </div>
                                        <div className="text-xs text-zinc-600 font-medium leading-relaxed">
                                          {renderWarningText(levelWarning.warning)}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                              {onEditClo && (
                                <button
                                  type="button"
                                  onClick={() => onEditClo(clo)}
                                  className="text-zinc-300 hover:text-emerald-500 transition-colors p-0.5"
                                  title="Edit CLO"
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                              {onDeleteClo && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteClick(clo.cloId)}
                                  className="text-zinc-300 hover:text-red-500 transition-colors p-0.5"
                                  title="Delete CLO"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                          <span
                            className={`text-sm leading-relaxed ${isUnmapped ? "text-red-400 font-medium italic" : "text-zinc-500"}`}
                          >
                            {clo.description}
                          </span>
                        </div>
                      </td>
                      {plos.map((plo) => {
                        const mapped = isMapped(clo.cloId, plo.ploId);
                        const invalidMapping =
                          validationResult?.invalid_mappings?.find(
                            (m: any) =>
                              m.clo_code === clo.cloCode &&
                              m.plo_code === plo.ploCode,
                          );

                        return (
                          <td
                            key={plo.ploId}
                            onClick={
                              disableMapping
                                ? undefined
                                : () => toggleMapping(clo.cloId, plo.ploId)
                            }
                            className={`p-4 border-b border-zinc-100 text-center relative group/cell ${
                              disableMapping
                                ? "cursor-default"
                                : "cursor-pointer hover:bg-zinc-100/50"
                            } ${mapped ? (invalidMapping ? "bg-amber-50" : "bg-emerald-50/20") : ""}`}
                          >
                            <div className="flex items-center justify-center">
                              {mapped ? (
                                <div
                                  className={`h-6 w-6 rounded-lg flex items-center justify-center shadow-sm animate-in zoom-in duration-200 ${
                                    invalidMapping
                                      ? "bg-amber-200 text-amber-900 border border-amber-300"
                                      : "bg-emerald-100 text-[#0b7a47]"
                                  }`}
                                >
                                  {invalidMapping ? (
                                    <AlertTriangle size={14} />
                                  ) : (
                                    <CheckCircle2 size={16} />
                                  )}
                                </div>
                              ) : (
                                <Circle
                                  size={16}
                                  className="text-zinc-200 group-hover:text-zinc-300 transition-colors"
                                />
                              )}
                            </div>

                            {/* Invalid Mapping Reason Tooltip */}
                            {invalidMapping && (
                              <div className={`absolute opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all duration-300 left-1/2 -translate-x-1/2 w-[280px] bg-white border border-amber-200 shadow-2xl rounded-2xl p-4 z-[110] text-left pointer-events-none animate-in fade-in ${isFirstRow ? "top-full mt-2 slide-in-from-top-1" : "bottom-full mb-2 slide-in-from-bottom-1"}`}>
                                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-50">
                                  <AlertTriangle
                                    size={14}
                                    className="text-amber-500"
                                  />
                                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                    Logic Warning
                                  </p>
                                </div>
                                <div className="text-xs text-zinc-600 font-medium leading-relaxed">
                                  {renderReasonText(invalidMapping.reason)}
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-4 border-b border-emerald-100/50 bg-emerald-50/30 text-center group-hover:bg-emerald-50/50 transition-colors">
                        <span
                          className={`text-xs font-black ${isUnmapped ? "text-red-500" : "text-[#0b7a47]"}`}
                        >
                          {coverage}/{plos.length}
                        </span>
                      </td>
                      <td className="p-4 border-b border-emerald-100/50 bg-emerald-50/30 text-center group-hover:bg-emerald-50/50 transition-colors">
                        {(() => {
                          const invalid =
                            validationResult?.invalid_mappings?.find(
                              (m: any) => m.clo_code === clo.cloCode,
                            );
                          const warning =
                            validationResult?.wrong_level_warnings?.find(
                              (w: any) => w.clo_code === clo.cloCode,
                            );
                          const isUnmappedInResult =
                            validationResult?.unmapped_clos?.includes(
                              clo.cloCode,
                            );

                          if (invalid) {
                            return (
                              <div className="group/validate relative inline-block">
                                <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all active:scale-95">
                                  <AlertCircle size={16} />
                                </button>
                                  <div className={`absolute opacity-0 invisible group-hover/validate:opacity-100 group-hover/validate:visible transition-all duration-500 right-0 w-[280px] bg-white border border-red-100 shadow-2xl rounded-2xl p-5 z-[100] text-left pointer-events-none animate-in fade-in ${isLastRow ? "bottom-full mb-2 slide-in-from-bottom-1" : "top-full mt-2 slide-in-from-top-1"}`}>
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-50">
                                      <AlertTriangle
                                        size={14}
                                        className="text-red-500"
                                      />
                                      <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">
                                        Logical Error
                                      </p>
                                    </div>
                                    <div className="text-xs text-zinc-600 font-medium leading-relaxed">
                                      {renderReasonText(invalid.reason)}
                                    </div>
                                  </div>
                              </div>
                            );
                          }

                          if (warning) {
                            return (
                              <div className="group/validate relative inline-block">
                                <button className="p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-all active:scale-95">
                                  <Info size={16} />
                                </button>
                                  <div className={`absolute opacity-0 invisible group-hover/validate:opacity-100 group-hover/validate:visible transition-all duration-500 right-0 w-[280px] bg-white border border-amber-100 shadow-2xl rounded-2xl p-5 z-[100] text-left pointer-events-none animate-in fade-in ${isLastRow ? "bottom-full mb-2 slide-in-from-bottom-1" : "top-full mt-2 slide-in-from-top-1"}`}>
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-50">
                                      <AlertTriangle
                                        size={14}
                                        className="text-amber-500"
                                      />
                                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                        Level Warning
                                      </p>
                                    </div>
                                    <div className="text-xs text-zinc-600 font-medium leading-relaxed italic">
                                      {renderWarningText(warning.warning, true)}
                                    </div>
                                  </div>
                              </div>
                            );
                          }

                          if (isUnmappedInResult) {
                            return (
                              <div className="group/validate relative inline-block">
                                <div className="p-2 bg-zinc-100 text-zinc-400 rounded-lg shadow-sm border border-zinc-200/50">
                                  <AlertTriangle size={16} />
                                </div>
                                  <div className={`absolute opacity-0 invisible group-hover/validate:opacity-100 group-hover/validate:visible transition-all duration-500 right-0 w-[280px] bg-white border border-zinc-200 shadow-2xl rounded-2xl p-5 z-[100] text-left pointer-events-none animate-in fade-in ${isLastRow ? "bottom-full mb-2 slide-in-from-bottom-1" : "top-full mt-2 slide-in-from-top-1"}`}>
                                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                                      <Info size={14} className="text-zinc-400" />
                                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                        Unmapped Outcome
                                      </p>
                                    </div>
                                    <p className="text-xs text-zinc-600 font-medium leading-relaxed italic">
                                      "This CLO is currently not mapped to any
                                      Program Learning Outcomes (PLOs). Please
                                      establish at least one connection."
                                    </p>
                                  </div>
                              </div>
                            );
                          }

                          if (validationResult) {
                            return (
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-in zoom-in duration-300">
                                <CheckCircle2 size={16} />
                              </div>
                            );
                          }

                          return <span className="text-zinc-300">—</span>;
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-zinc-50/80">
                <tr>
                  <td className="p-4 border-t border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 rounded-bl-xl sticky left-0 z-10 bg-zinc-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)] w-[400px] min-w-[400px] max-w-[400px]">
                    PLO Support Count
                  </td>
                  {plos.map((plo) => {
                    const count = getPloSupportCount(plo.ploId);
                    return (
                      <td
                        key={plo.ploId}
                        className="p-4 border-t border-zinc-200 text-center"
                      >
                        <span
                          className={`text-[11px] font-black ${count === 0 ? "text-red-400" : "text-[#0b7a47]"}`}
                        >
                          {count}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-4 border-t border-emerald-100/50 bg-emerald-50/30 text-center rounded-br-xl">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Total
                    </span>
                  </td>
                  <td className="p-4 border-t border-emerald-100/50 bg-emerald-50/30 text-center rounded-br-xl sticky right-0 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      —
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <AiValidationLoadingModal isOpen={isValidating} />
    </section>
  );
}

function AiValidationLoadingModal({ isOpen }: { isOpen: boolean }) {
  const [step, setStep] = useState(0);
  const steps = [
    "Initiating AI validator and preparing mapping data...",
    "Analyzing course learning outcomes (CLOs) and program learning outcomes (PLOs)...",
    "Running semantic consistency and cognitive level analysis (Bloom's Taxonomy)...",
    "Identifying logic discrepancies and generating alignment recommendations...",
  ];

  useEffect(() => {
    if (!isOpen) {
      setStep(0);
      return;
    }
    const interval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 3500);
    return () => clearInterval(interval);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="relative max-w-md w-full bg-white rounded-[2.5rem] p-8 border border-emerald-100 shadow-2xl text-center space-y-6 overflow-hidden"
          >
            {/* Pulsing AI Logo Sphere */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping duration-1000 opacity-75" />
                <div className="absolute inset-2 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full animate-pulse shadow-lg shadow-emerald-200" />
                <div className="relative z-10 text-white flex flex-col items-center justify-center">
                  <Sparkles size={32} className="animate-bounce" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight font-sans">
                AI Mapping Evaluation
              </h3>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse font-sans">
                Consulting quality assurance model
              </p>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                initial={{ width: "0%" }}
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Stepper text */}
            <div className="min-h-12 flex items-center justify-center px-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={step}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-sm font-semibold text-zinc-500 leading-relaxed font-sans"
                >
                  {steps[step]}
                </motion.p>
              </AnimatePresence>
            </div>
            
            {/* Subtle micro-animation dots */}
            <div className="flex justify-center gap-1.5 pt-2">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "bg-emerald-500 w-4" : "bg-zinc-200"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
