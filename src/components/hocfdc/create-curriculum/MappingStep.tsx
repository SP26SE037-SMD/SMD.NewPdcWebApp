import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { CurriculumService, PLO, CURRICULUM_STATUS } from "@/services/curriculum.service";
import { PoService, PO } from "@/services/po.service";
import { PoPloService } from "@/services/poplo.service";
import StepNavigation from "./StepNavigation";

interface StepProps {
  onNext?: () => void;
  onBack?: () => void;
  curriculumIdProp?: string;
}

interface OutcomeMapping {
  poId: string;
  ploId: string;
}

export default function MappingStep({ onNext, onBack, curriculumIdProp }: StepProps) {
  const searchParams = useSearchParams();
  const curriculumId = curriculumIdProp || searchParams.get("id");
  const queryClient = useQueryClient();

  const [tempMappings, setTempMappings] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [shouldProceedAfterSave, setShouldProceedAfterSave] = useState(false);

  const { data: curriculumRes, isLoading: isLoadingCurriculum } = useQuery({
    queryKey: ["curriculum", curriculumId],
    queryFn: () => CurriculumService.getCurriculumById(curriculumId!),
    enabled: !!curriculumId,
  });

  const curriculum = curriculumRes?.data;
  const majorId = curriculum?.major?.majorId || curriculum?.majorId;
  const isLocked = curriculum?.status 
    ? (curriculum.status !== CURRICULUM_STATUS.DRAFT && curriculum.status !== CURRICULUM_STATUS.STRUCTURE_REVIEW)
    : false;

  const { data: posRes, isLoading: isLoadingPos } = useQuery({
    queryKey: ["pos-major", majorId],
    queryFn: () => PoService.getPOsByMajorId(majorId as string, { size: 100 }),
    enabled: !!majorId,
  });
  const pos = ((posRes?.data as any)?.content as PO[]) || [];

  const { data: plosRes, isLoading: isLoadingPlos } = useQuery({
    queryKey: ["plos-curriculum", curriculumId],
    queryFn: () => CurriculumService.getPloByCurriculumId(curriculumId!, "ACTIVE", 100),
    enabled: !!curriculumId,
  });
  const plos = ((plosRes?.data as any)?.content as PLO[]) || [];

  const { data: mappingsRes, isLoading: isLoadingMappings } = useQuery({
    queryKey: ["po-plo-mappings", curriculumId],
    queryFn: () => PoPloService.getMappingsByCurriculum(curriculumId!),
    enabled: !!curriculumId,
  });
  const initialMappings = mappingsRes?.data || [];

  useEffect(() => {
    if (initialMappings.length > 0) {
      const mappingKeys = initialMappings.map((m) => `${m.poId}||${m.ploId}`);
      setTempMappings(new Set(mappingKeys));
    }
  }, [initialMappings]);

  const syncMutation = useMutation({
    mutationFn: (payload: { deletedMappings: OutcomeMapping[]; addedMappings: OutcomeMapping[] }) => 
      PoPloService.bulkUpdateMappings(curriculumId!, payload),
    onSuccess: () => {
      toast.success("Mapping synchronized");
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["po-plo-mappings", curriculumId] });
      if (shouldProceedAfterSave) onNext?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Sync failed");
      setShouldProceedAfterSave(false);
    }
  });

  const isMapped = (poId: string, ploId: string) => tempMappings.has(`${poId}||${ploId}`);

  const handleToggleMapping = (poId: string, ploId: string) => {
    if (isLocked) return;
    const key = `${poId}||${ploId}`;
    const newTemp = new Set(tempMappings);
    if (newTemp.has(key)) newTemp.delete(key);
    else newTemp.add(key);
    setTempMappings(newTemp);
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = (proceed: boolean = false) => {
    if (!curriculumId) return;
    setShouldProceedAfterSave(proceed);
    
    const initialKeys = new Set(initialMappings.map((m) => `${m.poId}||${m.ploId}`));
    const deletedMappings = initialMappings
      .filter((m) => !tempMappings.has(`${m.poId}||${m.ploId}`))
      .map((m) => ({ poId: m.poId, ploId: m.ploId }));
    const addedMappings = [...tempMappings]
      .filter((key) => !initialKeys.has(key))
      .map((key) => {
        const [poId, ploId] = key.split("||");
        return { poId, ploId };
      });

    syncMutation.mutate({ deletedMappings, addedMappings });
  };

  const handleNextClick = () => {
    if (hasUnsavedChanges) setShowConfirmModal(true);
    else onNext?.();
  };

  const getPoStats = (poId: string) => plos.filter(plo => isMapped(poId, plo.ploId)).length;
  const getPloCoverage = (ploId: string) => pos.filter(po => isMapped(po.poId, ploId)).length;

  const isLoading = isLoadingCurriculum || isLoadingPos || isLoadingPlos || isLoadingMappings;

  return (
    <div className="min-h-screen px-4 md:px-12 pb-20 pt-10 font-['Plus_Jakarta_Sans']">
      {/* Page Header */}
      <header className="mb-10 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-2">PO - PLO Mapping</h1>
          <p className="text-zinc-500 max-w-2xl leading-relaxed font-medium">Establish the correlations between Program Outcomes (POs) and Program Learning Outcomes (PLOs).</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1 mr-2">
            <span className={`text-[9px] font-black uppercase tracking-widest ${hasUnsavedChanges ? "text-amber-500" : "text-emerald-500"}`}>
              {hasUnsavedChanges ? "● Pending Sync" : "● Matrix Synced"}
            </span>
          </div>
          <button 
            onClick={() => handleSaveDraft(false)}
            disabled={syncMutation.isPending || !hasUnsavedChanges}
            className={`btn-pdcm-ghost px-8 py-4 rounded-2xl ${syncMutation.isPending || !hasUnsavedChanges ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {syncMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Save Draft
          </button>
        </div>
      </header>

      {/* Mapping Matrix Layout */}
      <div className="grid grid-cols-12 gap-8 max-w-5xl mx-auto">
        <section className="col-span-12">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0px_4px_20px_rgba(45,51,53,0.04)] overflow-hidden flex flex-col gap-6 border border-zinc-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-[var(--primary)]">grid_on</span>
                  Matrix Alignment
                </h3>
                <p className="text-xs text-zinc-500 font-medium italic">Click on the intersections to toggle mapping relationships.</p>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>
                  <span className="text-xs font-bold text-zinc-600">Mapped</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-zinc-200 text-sm">circle</span>
                  <span className="text-xs font-bold text-zinc-600">Unmapped</span>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Loading Matrix Architecture...</p>
              </div>
            ) : (
              <div className="overflow-x-auto pb-4 custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr>
                      <th className="p-4 bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-600 rounded-tl-xl w-[280px] sticky left-0 z-20">Program Learning Outcomes</th>
                      {pos.map((po, idx) => (
                        <th key={po.poId} className="p-4 bg-zinc-50 border-b border-zinc-200 text-center min-w-[120px] group/header relative">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary">{po.poCode || `PO-${idx + 1}`}</span>
                          <div className="absolute opacity-0 invisible group-hover/header:opacity-100 group-hover/header:visible transition-all duration-300 top-full left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-zinc-900 text-white text-[10px] rounded-xl shadow-2xl p-4 z-[100] text-left pointer-events-none border border-zinc-800">
                            <p className="font-black text-indigo-400 mb-1 tracking-widest uppercase border-b border-zinc-800 pb-2">{po.poCode}</p>
                            <p className="font-medium leading-relaxed mt-2 text-zinc-300 line-clamp-4">{po.description}</p>
                          </div>
                        </th>
                      ))}
                      <th className="p-4 bg-[#f8faf8] border-b border-[#e1ede3] text-center rounded-tr-xl">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">Coverage</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {plos.map((plo) => {
                      const coverage = getPloCoverage(plo.ploId);
                      const isUnmapped = coverage === 0;
                      return (
                        <tr key={plo.ploId} className={`group hover:bg-zinc-50 transition-colors font-medium ${isUnmapped ? "bg-red-50/10" : ""}`}>
                          <td className="p-4 border-b border-zinc-100 sticky left-0 bg-white group-hover:bg-zinc-50 transition-colors z-10 w-[280px]">
                            <div className="flex flex-col gap-1">
                              <span className={`font-bold text-sm ${isUnmapped ? "text-red-600" : "text-zinc-900"}`}>{plo.ploCode || "PLO-XX"}</span>
                              <span className={`text-xs line-clamp-2 leading-relaxed ${isUnmapped ? "text-red-400 font-bold" : "text-zinc-500"}`}>{plo.description}</span>
                            </div>
                          </td>
                          {pos.map((po) => {
                            const mapped = isMapped(po.poId, plo.ploId);
                            return (
                              <td key={po.poId} onClick={() => handleToggleMapping(po.poId, plo.ploId)} className={`p-4 border-b border-zinc-100 text-center cursor-pointer transition-all hover:bg-zinc-100 ${mapped ? "bg-indigo-50/30" : ""}`}>
                                <span className={`material-symbols-outlined transition-all ${mapped ? "text-primary scale-125" : "text-zinc-200"}`} style={{ fontVariationSettings: mapped ? "'FILL' 1" : "'FILL' 0" }}>circle</span>
                              </td>
                            );
                          })}
                          <td className="p-4 border-b border-[#e1ede3] bg-[#f8faf8] text-center group-hover:bg-[#f0f5f1] transition-colors">
                            <span className={`text-xs font-black ${isUnmapped ? "text-red-500" : "text-primary"}`}>{coverage}/{pos.length}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs font-black uppercase tracking-widest text-zinc-500 rounded-bl-xl sticky left-0 z-10">PO Support Count</td>
                      {pos.map((po) => (
                        <td key={po.poId} className="p-4 bg-zinc-50 border-t border-zinc-200 text-center">
                          <span className={`text-[10px] font-black ${getPoStats(po.poId) === 0 ? "text-red-400" : "text-primary"}`}>{getPoStats(po.poId)}</span>
                        </td>
                      ))}
                      <td className="p-4 bg-[#f8faf8] border-t border-[#e1ede3] text-center rounded-br-xl">
                        <span className="text-[10px] font-bold text-zinc-500">Total</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      <StepNavigation onNext={handleNextClick} onBack={onBack} />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
          <div className="relative bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-100">
            <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-8"><CheckCircle2 className="text-primary-600" size={32} /></div>
            <h3 className="text-3xl font-extrabold text-zinc-900 mb-3 tracking-tight">Save Matrix Changes?</h3>
            <p className="text-zinc-500 leading-relaxed mb-10 font-medium">You have modified the PO-PLO mapping matrix. Would you like to save these changes before moving to the next step?</p>
            <div className="flex gap-4">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-4 px-6 border border-zinc-100 text-zinc-500 font-bold rounded-2xl hover:bg-zinc-50 transition-all">Review</button>
              <button onClick={() => { setShowConfirmModal(false); handleSaveDraft(true); }} disabled={syncMutation.isPending} className="flex-1 py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2">
                {syncMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save & Next
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.1); }
      `}</style>
    </div>
  );
}
