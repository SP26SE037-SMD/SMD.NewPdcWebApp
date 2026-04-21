"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CurriculumService, PLO, CURRICULUM_STATUS } from "@/services/curriculum.service";
import { PoService, PO } from "@/services/po.service";
import { PoPloService, PoPloMapping } from "@/services/poplo.service";
import {
  Check,
  Loader2,
  Lock,
  SaveAll,
  Target,
  Activity,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

// --- Custom Internal Components ---

const ToggleSwitch = ({
  on,
  onChange,
  disabled,
  isPending,
}: {
  on: boolean;
  onChange: () => void;
  disabled?: boolean;
  isPending?: boolean;
}) => (
  <div
    onClick={() => !disabled && onChange()}
    className={`w-14 h-7 rounded-full p-1 transition-all duration-300 cursor-pointer flex items-center relative border-2 ${
      on ? "bg-[#34C759] border-[#34C759]" : "bg-white border-[#E5E5EA]"
    } ${disabled ? "opacity-30 cursor-not-allowed" : "hover:scale-110 active:scale-90 shadow-sm"}`}
  >
    <motion.div
      animate={{ x: on ? 28 : 0 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`w-4 h-4 rounded-full shadow-md ${on ? "bg-white" : "bg-[#D1D1D6]"}`}
    />
    {isPending && (
      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-white animate-pulse" />
    )}
  </div>
);

interface PoPloMatrixProps {
  curriculumId: string;
  majorId?: string;
  mode?: "edit" | "review";
  isLocked?: boolean;
  selectedPloId?: string | null;
  onSelectPlo?: (ploId: string) => void;
  className?: string;
  onSyncComplete?: () => void;
}

export default function PoPloMatrix({
  curriculumId,
  majorId: initialMajorId,
  mode = "review",
  isLocked: initialIsLocked,
  selectedPloId,
  onSelectPlo,
  className = "",
  onSyncComplete,
}: PoPloMatrixProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Local State
  const [tempMappings, setTempMappings] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingSync, setIsSavingSync] = useState(false);

  // 1. Fetch Curriculum (to get majorId if not provided)
  const { data: curriculumRes, isLoading: isLoadingCurriculum } = useQuery({
    queryKey: ["curriculum", curriculumId],
    queryFn: () => CurriculumService.getCurriculumById(curriculumId),
    enabled: !initialMajorId || initialIsLocked === undefined,
    refetchOnWindowFocus: false,
  });

  const curriculum = curriculumRes?.data;
  const majorId = initialMajorId || curriculum?.major?.majorId || curriculum?.majorId;
  const isLocked =
    initialIsLocked !== undefined
      ? initialIsLocked
      : curriculum?.status 
        ? (curriculum.status !== CURRICULUM_STATUS.DRAFT && curriculum.status !== CURRICULUM_STATUS.STRUCTURE_REVIEW)
        : false;

  // 2. Fetch POs
  const { data: posRes, isLoading: isLoadingPos } = useQuery({
    queryKey: ["pos-major", majorId],
    queryFn: () => PoService.getPOsByMajorId(majorId as string),
    enabled: !!majorId,
    refetchOnWindowFocus: false,
  });
  const pos = ((posRes?.data as any)?.content as PO[]) || [];

  // 3. Fetch PLOs
  const { data: plosRes, isLoading: isLoadingPlos } = useQuery({
    queryKey: ["plos-curriculum", curriculumId],
    queryFn: () => CurriculumService.getPloByCurriculumId(curriculumId),
    enabled: !!curriculumId,
    refetchOnWindowFocus: false,
  });
  const plos = ((plosRes?.data as any)?.content as PLO[]) || [];

  // 4. Fetch Mappings
  const { data: mappingsRes, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["po-plo-mappings", curriculumId],
    queryFn: () => PoPloService.getMappingsByCurriculum(curriculumId),
    enabled: !!curriculumId,
    refetchOnWindowFocus: false,
  });
  const initialMappings = mappingsRes?.data || [];

  // Sync Initial Mappings to Local State
  useEffect(() => {
    if (initialMappings.length > 0) {
      const mappingKeys = initialMappings.map((m) => `${m.poId}||${m.ploId}`);
      setTempMappings(new Set(mappingKeys));
    }
  }, [initialMappings]);

  const isMapped = (poId: string, ploId: string) => {
    return tempMappings.has(`${poId}||${ploId}`);
  };

  const handleToggleMapping = (poId: string, ploId: string) => {
    if (isLocked || mode === "review") return;

    const key = `${poId}||${ploId}`;
    const newTemp = new Set(tempMappings);

    if (newTemp.has(key)) {
      newTemp.delete(key);
    } else {
      newTemp.add(key);
    }

    setTempMappings(newTemp);
    setHasUnsavedChanges(true);
  };

  const handleSyncArchitecture = async () => {
    setIsSavingSync(true);
    try {
      const initialKeys = new Set(initialMappings.map((m) => `${m.poId}||${m.ploId}`));

      const deletedMappings = initialMappings
        .filter((m) => !tempMappings.has(`${m.poId}||${m.ploId}`))
        .map((m) => ({ poId: m.poId, ploId: m.ploId }));

      const addedMappings = [...tempMappings]
        .filter((key) => key.includes("||") && !initialKeys.has(key))
        .map((key) => {
          const [poId, ploId] = key.split("||");
          return { poId, ploId };
        })
        .filter((m) => m.poId && m.ploId);

      await PoPloService.bulkUpdateMappings(curriculumId, {
        deletedMappings,
        addedMappings,
      });

      showToast("Architecture mapping synchronized with master framework.", "success");
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["po-plo-mappings", curriculumId] });
      if (onSyncComplete) onSyncComplete();
    } catch (error) {
      showToast("Synchronization constraint violation. Update failed.", "error");
    } finally {
      setIsSavingSync(false);
    }
  };

  // Metrics (internal)
  const mappedPloIds = new Set([...tempMappings].map((key) => key.split("||")[1]));
  const coveragePercentage = plos.length > 0 ? Math.round((mappedPloIds.size / plos.length) * 100) : 0;
  const posMetCount = new Set([...tempMappings].map((key) => key.split("||")[0])).size;
  const poCoveragePercentage = pos.length > 0 ? Math.round((posMetCount / pos.length) * 100) : 0;

  if (isLoadingCurriculum || isLoadingPos || isLoadingPlos || isLoadingMappings) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p className="font-bold text-[10px] uppercase tracking-[0.3em] opacity-50">Syncing Architecture Matrix...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full overflow-hidden ${className}`}>
      {/* Optional Stats Header when in Edit Mode */}
      {mode === "edit" && (
        <div className="mb-8 bg-white rounded-2xl p-8 shadow-sm border border-zinc-100 flex items-center justify-between gap-12 relative overflow-hidden group">
          <div className="flex items-center gap-10">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-zinc-100" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="264"
                  initial={{ strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 - (264 * coveragePercentage) / 100 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="text-[#102C57]"
                />
                <circle cx="50" cy="50" r="30" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-zinc-50" />
                <motion.circle
                  cx="50" cy="50" r="30" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray="188.5"
                  initial={{ strokeDashoffset: 188.5 }}
                  animate={{ strokeDashoffset: 188.5 - (188.5 * poCoveragePercentage) / 100 }}
                  transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  className="text-[#4F46E5]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-zinc-900 leading-none">
                  {Math.round((coveragePercentage + poCoveragePercentage) / 2)}%
                </span>
                <span className="text-[8px] font-black uppercase text-zinc-400 mt-1">Avg</span>
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Curriculum Sync</h3>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#102C57]" /> {coveragePercentage}% PLO Coverage
                </p>
                <p className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#4F46E5]" /> {poCoveragePercentage}% PO Coverage
                </p>
              </div>
            </div>
          </div>

          <div className="h-20 w-[1px] bg-zinc-100 hidden lg:block" />

          <div className="flex-1 px-10 hidden lg:block">
            <h4 className="text-lg font-black text-zinc-900 mb-1">POs Mapped</h4>
            <p className="text-2xl font-black text-zinc-900">({posMetCount}/{pos.length})</p>
          </div>

          <div className="h-20 w-[1px] bg-zinc-100 hidden lg:block" />

          <div className="flex-1 px-10 hidden lg:block">
            <h4 className="text-lg font-black text-zinc-900 mb-1">PLOs Mapped</h4>
            <p className="text-2xl font-black text-zinc-900">({mappedPloIds.size}/{plos.length})</p>
          </div>

          <div className="flex flex-col items-center gap-2 pl-10">
            <button
              onClick={handleSyncArchitecture}
              disabled={isSavingSync || isLocked}
              className={`group relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm active:scale-95 ${
                isSavingSync 
                  ? "bg-zinc-100 text-zinc-400" 
                  : isLocked
                    ? "bg-zinc-50 text-zinc-300 cursor-not-allowed border border-zinc-100"
                    : hasUnsavedChanges 
                      ? "bg-zinc-900 text-white hover:bg-primary" 
                      : "bg-zinc-100 text-zinc-900 hover:bg-primary hover:text-white"
              }`}
            >
              <AnimatePresence>
                {hasUnsavedChanges && !isSavingSync && !isLocked && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg animate-bounce" />
                )}
              </AnimatePresence>
              {isSavingSync ? <Loader2 size={16} className="animate-spin" /> : isLocked ? <Lock size={16} /> : <SaveAll size={16} />}
              <span>{isSavingSync ? "Synchronizing..." : isLocked ? "Structure Finalized" : "Synchronize Matrix"}</span>
            </button>
            <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
              {hasUnsavedChanges && !isLocked ? "Changes Pending" : isLocked ? "Structure Finalized" : "Matrix Synchronized"}
            </p>
          </div>
        </div>
      )}

      {/* The Matrix Table */}
      <div className="bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden flex flex-col flex-1">
        <div className="overflow-auto relative custom-scrollbar flex-1">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-40">
              <tr className="bg-[#EBEBFF] text-zinc-700">
                <th className="sticky left-0 top-0 z-50 bg-[#EBEBFF] p-6 border-b border-r border-zinc-200/50 min-w-[320px] text-left">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Program Outcomes (PLOs)</span>
                </th>
                {pos.map((po, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === pos.length - 1;
                  const tooltipPosition = isLast ? "right-0" : isFirst ? "left-0" : "left-1/2 -translate-x-1/2";
                  const arrowPosition = isLast ? "right-8" : isFirst ? "left-8" : "left-1/2 -translate-x-1/2";

                  return (
                    <th key={po.poId} className="p-6 border-b border-zinc-200/50 min-w-[140px] text-center bg-[#EBEBFF] relative group">
                      <span className="text-xs font-black uppercase tracking-widest block cursor-help">{po.poCode || `PO${idx + 1}`}</span>
                      <div className={`absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 top-full ${tooltipPosition} mt-2 w-[280px] bg-zinc-900 text-white text-xs rounded-2xl shadow-2xl p-5 z-[100] text-left pointer-events-none transform group-hover:translate-y-1 border border-zinc-800`}>
                        <div className={`absolute bottom-[100%] ${arrowPosition} border-[8px] border-transparent border-b-zinc-900`} />
                        <p className="font-black text-indigo-400 mb-1 tracking-widest uppercase border-b border-zinc-800 pb-2">{po.poCode || `PO${idx + 1}`}</p>
                        <p className="font-medium leading-relaxed mt-3 text-zinc-300">{po.description}</p>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {plos.map((plo) => (
                <tr key={plo.ploId} onClick={() => onSelectPlo?.(plo.ploId)} className={`group transition-all cursor-pointer border-b border-zinc-50 ${selectedPloId === plo.ploId ? "bg-indigo-50/20" : "hover:bg-zinc-50/50"}`}>
                  <td className={`sticky left-0 z-30 p-6 border-r border-zinc-100 flex flex-col gap-1 transition-colors min-w-[320px] ${selectedPloId === plo.ploId ? "bg-indigo-50 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]" : "bg-white group-hover/row:bg-zinc-50"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-1 h-4 rounded-full ${selectedPloId === plo.ploId ? "bg-indigo-600" : "bg-transparent"}`} />
                      <span className="text-sm font-black text-zinc-900 group-hover:translate-x-1 transition-transform">{plo.ploCode || "PLO.xx"}</span>
                    </div>
                    <span className="text-[11px] font-medium text-zinc-400 line-clamp-2 px-3">{plo.description}</span>
                  </td>
                  {pos.map((po) => {
                    const mapped = isMapped(po.poId, plo.ploId);
                    return (
                      <td key={po.poId} className="p-6 text-center align-middle border-r border-zinc-50/50">
                        <div className="flex justify-center items-center h-full">
                          {mode === "edit" ? (
                            <ToggleSwitch on={mapped} disabled={isLocked} onChange={() => handleToggleMapping(po.poId, plo.ploId)} />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${mapped ? "bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm" : "bg-zinc-50 text-zinc-200"}`}>
                              {mapped ? <Check size={18} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-zinc-200" />}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
      `}</style>
    </div>
  );
}
