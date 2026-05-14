"use client";

import React, { useState } from "react";
import { GitBranch, Plus, Trash2, Loader2, Save, Info, CheckCircle2, Circle, Pencil, Download, Upload, ShieldCheck, FileSearch, Lightbulb, AlertCircle, X, Target, Gauge, AlertTriangle } from "lucide-react";
import { SubjectClo } from "@/services/cloplo.service";
import { PLO } from "@/services/curriculum.service";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import { MappingService } from "@/services/mapping.service";
import { toast } from "sonner";
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
  const subjectId = subjectIdProp || searchParams.get("subjectId") || searchParams.get("id");

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [cloToDelete, setCloToDelete] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [localImporting, setLocalImporting] = useState(false);

  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleValidate = async () => {
    if (!curriculumId || !subjectId) {
      toast.error("Curriculum or Subject ID is missing");
      return;
    }
    setIsValidating(true);
    setValidationError(null);

    try {
      // Collect current mappings from matrixMappings
      const currentMappings = clos.flatMap(clo => 
        plos
          .filter(plo => isMapped(clo.cloId, plo.ploId))
          .map(plo => ({
            cloId: clo.cloId,
            ploId: plo.ploId,
            contributionLevel: "High" // Default or we could try to find it if we had levels
          }))
      );

      const res = await MappingService.validateCloPloMappings(curriculumId, subjectId, currentMappings);
      
      if (res.status === 9001) {
        setValidationError("Failed to validate with AI. Please try again.");
        setValidationResult(null);
        return;
      }

      setValidationResult(res.data);
      toast.success("Validation completed!");
    } catch (error: any) {
      if (error?.status === 9001 || error?.response?.data?.status === 9001) {
        setValidationError("Failed to validate with AI. Please try again.");
        setValidationResult(null);
      } else {
        toast.error(error?.response?.data?.message || error?.message || "Validation failed");
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
            <h2 className="text-xl font-black text-zinc-900 tracking-tight">CLO-PLO Alignment Matrix</h2>
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
            {validationError && (
              <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest px-1 animate-in fade-in slide-in-from-top-1">
                {validationError}
              </p>
            )}
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
                    Unsaved: {addedCount > 0 && `+${addedCount}`} {deletedCount > 0 && `-${deletedCount}`}
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
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Mapped</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-zinc-200" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Unmapped</span>
          </div>
        </div>
      </div>

      {mappingNotice && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2 border ${
            mappingNotice.toLowerCase().includes("fail") || mappingNotice.toLowerCase().includes("error")
              ? "bg-red-50 border-red-100 text-red-600"
              : "bg-emerald-50 border-emerald-100 text-emerald-700"
          }`}
        >
          {mappingNotice.toLowerCase().includes("success") ? <CheckCircle2 size={16} /> : <Info size={16} />}
          {mappingNotice}
        </motion.div>
      )}

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
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Logic Consistency</p>
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      validationResult.is_logic_valid 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                        : "bg-amber-50 border-amber-200 text-amber-600"
                    }`}>
                      {validationResult.is_logic_valid ? "Logically Valid" : "Logic Issues Found"}
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
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Unmapped CLOs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {validationResult.unmapped_clos.map((cloCode: string) => (
                        <span key={cloCode} className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded-md text-[10px] font-black">{cloCode}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="p-4 bg-white rounded-xl border border-primary/10 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI Suggestions</span>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed font-medium italic whitespace-pre-line">
                  {validationResult.suggestions}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative border border-zinc-200 rounded-2xl overflow-hidden bg-white shadow-sm">
        {(isCloLoading || isPloLoading || isMappingLoading) ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="animate-spin text-[#0b7a47]" size={32} />
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Loading Matrix Architecture...</p>
          </div>
        ) : clos.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base text-zinc-500 font-medium">No CLOs found for this subject.</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-4 bg-zinc-50 border-b border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 rounded-tl-xl w-[320px] sticky left-0 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">Coverage</span>
                  </th>
                  <th className="p-4 bg-emerald-50/30 border-b border-emerald-100/50 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">Validate</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {clos.map((clo) => {
                  const coverage = getCloCoverage(clo.cloId);
                  const isUnmapped = coverage === 0;
                  
                  return (
                    <tr 
                      key={clo.cloId} 
                      className={`group hover:bg-zinc-50/80 transition-colors ${isUnmapped ? "bg-red-50/5" : ""}`}
                    >
                      <td className="p-4 border-b border-zinc-100 sticky left-0 bg-white group-hover:bg-zinc-50/80 transition-colors z-10 w-[320px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col gap-1.5 pr-2">
                          <div className="flex items-center justify-between gap-2">
                            {(() => {
                              const hasInvalidMapping = validationResult?.invalid_mappings?.some((m: any) => m.clo_code === clo.cloCode);
                              return (
                                <span className={`text-[13px] font-black tracking-tight px-1 rounded ${
                                  hasInvalidMapping ? "bg-amber-100 text-amber-900" : isUnmapped ? "text-red-600" : "text-zinc-900"
                                }`}>
                                  {clo.cloCode || "CLO"}
                                </span>
                              );
                            })()}
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200">
                                B{clo.bloomLevel}
                              </span>
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
                          <span className={`text-sm leading-relaxed ${isUnmapped ? "text-red-400 font-medium italic" : "text-zinc-500"}`}>
                            {clo.description}
                          </span>
                        </div>
                      </td>
                      {plos.map((plo) => {
                        const mapped = isMapped(clo.cloId, plo.ploId);
                        const invalidMapping = validationResult?.invalid_mappings?.find(
                          (m: any) => m.clo_code === clo.cloCode && m.plo_code === plo.ploCode
                        );

                        return (
                          <td 
                            key={plo.ploId} 
                            onClick={disableMapping ? undefined : () => toggleMapping(clo.cloId, plo.ploId)} 
                            className={`p-4 border-b border-zinc-100 text-center relative group/cell ${
                              disableMapping ? 'cursor-default' : 'cursor-pointer hover:bg-zinc-100/50'
                            } ${mapped ? (invalidMapping ? "bg-amber-50" : "bg-emerald-50/20") : ""}`}
                          >
                            <div className="flex items-center justify-center">
                              {mapped ? (
                                <div className={`h-6 w-6 rounded-lg flex items-center justify-center shadow-sm animate-in zoom-in duration-200 ${
                                  invalidMapping ? "bg-amber-200 text-amber-900 border border-amber-300" : "bg-emerald-100 text-[#0b7a47]"
                                }`}>
                                  {invalidMapping ? <AlertTriangle size={14} /> : <CheckCircle2 size={16} />}
                                </div>
                              ) : (
                                <Circle size={16} className="text-zinc-200 group-hover:text-zinc-300 transition-colors" />
                              )}
                            </div>

                            {/* Invalid Mapping Reason Tooltip */}
                            {invalidMapping && (
                              <div className="absolute opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all duration-300 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] bg-white border border-amber-200 shadow-2xl rounded-2xl p-4 z-[110] text-left pointer-events-none">
                                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-amber-50">
                                  <AlertTriangle size={14} className="text-amber-500" />
                                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Logic Warning</p>
                                </div>
                                <p className="text-xs text-zinc-600 font-medium leading-relaxed italic">
                                  "{invalidMapping.reason}"
                                </p>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-4 border-b border-emerald-100/50 bg-emerald-50/30 text-center group-hover:bg-emerald-50/50 transition-colors">
                        <span className={`text-xs font-black ${isUnmapped ? "text-red-500" : "text-[#0b7a47]"}`}>
                          {coverage}/{plos.length}
                        </span>
                      </td>
                      <td className="p-4 border-b border-emerald-100/50 bg-emerald-50/30 text-center group-hover:bg-emerald-50/50 transition-colors">
                        {(() => {
                          const invalid = validationResult?.invalid_mappings?.find((m: any) => m.clo_code === clo.cloCode);
                          const warning = validationResult?.wrong_level_warnings?.find((w: any) => w.clo_code === clo.cloCode);
                          const isUnmappedInResult = validationResult?.unmapped_clos?.includes(clo.cloCode);

                          if (invalid) {
                            return (
                              <div className="group/validate relative inline-block">
                                <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all active:scale-95">
                                  <AlertCircle size={16} />
                                </button>
                                <div className="absolute opacity-0 invisible group-hover/validate:opacity-100 group-hover/validate:visible transition-all duration-500 top-full right-0 mt-2 w-[280px] bg-white border border-red-100 shadow-2xl rounded-2xl p-5 z-[100] text-left pointer-events-none">
                                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-50">
                                    <AlertTriangle size={14} className="text-red-500" />
                                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Logical Error</p>
                                  </div>
                                  <p className="text-xs text-zinc-600 font-medium leading-relaxed italic">
                                    "{invalid.reason}"
                                  </p>
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
                                <div className="absolute opacity-0 invisible group-hover/validate:opacity-100 group-hover/validate:visible transition-all duration-500 top-full right-0 mt-2 w-[280px] bg-white border border-amber-100 shadow-2xl rounded-2xl p-5 z-[100] text-left pointer-events-none">
                                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-50">
                                    <AlertTriangle size={14} className="text-amber-500" />
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Level Warning</p>
                                  </div>
                                  <p className="text-xs text-zinc-600 font-medium leading-relaxed italic">
                                    "{warning.warning}"
                                  </p>
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
                                <div className="absolute opacity-0 invisible group-hover/validate:opacity-100 group-hover/validate:visible transition-all duration-500 top-full right-0 mt-2 w-[280px] bg-white border border-zinc-200 shadow-2xl rounded-2xl p-5 z-[100] text-left pointer-events-none">
                                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100">
                                    <Info size={14} className="text-zinc-400" />
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Unmapped Outcome</p>
                                  </div>
                                  <p className="text-xs text-zinc-600 font-medium leading-relaxed italic">
                                    "This CLO is currently not mapped to any Program Learning Outcomes (PLOs). Please establish at least one connection."
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
                  <td className="p-4 border-t border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 rounded-bl-xl sticky left-0 z-10 bg-zinc-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                    PLO Support Count
                  </td>
                  {plos.map((plo) => {
                    const count = getPloSupportCount(plo.ploId);
                    return (
                      <td key={plo.ploId} className="p-4 border-t border-zinc-200 text-center">
                        <span className={`text-[11px] font-black ${count === 0 ? "text-red-400" : "text-[#0b7a47]"}`}>
                          {count}
                        </span>
                      </td>
                    );
                  })}
                  <td className="p-4 border-t border-emerald-100/50 bg-emerald-50/30 text-center rounded-br-xl">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total</span>
                  </td>
                  <td className="p-4 border-t border-emerald-100/50 bg-emerald-50/30 text-center rounded-br-xl sticky right-0 z-10 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">—</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
      `}</style>
    </section>
  );
}
