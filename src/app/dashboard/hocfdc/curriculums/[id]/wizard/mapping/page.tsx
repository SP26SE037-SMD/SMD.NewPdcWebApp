"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CurriculumService,
  PLO,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";
import { PoPloService } from "@/services/poplo.service";
import { PoService, PO } from "@/services/po.service";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/Toast";
import CurriculumStudioLayout from "@/components/hocfdc/CurriculumStudioLayout";
import ModernPoPloMatrix from "@/components/hocfdc/ModernPoPloMatrix";
import { ChevronLeft, ArrowRight, Edit3, Save, Trash2, Target, Loader2, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WizardMappingPage() {
  const { id: curriculumId } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [tempMappings, setTempMappings] = useState<Set<string>>(new Set());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSavingSync, setIsSavingSync] = useState(false);

  // Context Insights State
  const [selectedPloId, setSelectedPloId] = useState<string | null>(null);
  const [editPloForm, setEditPloForm] = useState({
    ploCode: "",
    description: "",
  });
  const [isSavingPlo, setIsSavingPlo] = useState(false);

  // 1. Fetch Curriculum
  const { data: curriculumRes, isLoading: isLoadingCurriculum } = useQuery({
    queryKey: ["curriculum", curriculumId],
    queryFn: () => CurriculumService.getCurriculumById(curriculumId),
  });
  const curriculum = curriculumRes?.data;
  const majorId = curriculum?.major?.majorId || curriculum?.majorId;
  const isLocked = curriculum?.status
    ? curriculum.status !== CURRICULUM_STATUS.DRAFT &&
      curriculum.status !== CURRICULUM_STATUS.STRUCTURE_REVIEW
    : false;

  // 2. Fetch POs
  const { data: posRes } = useQuery({
    queryKey: ["pos-major", majorId],
    queryFn: () => PoService.getPOsByMajorId(majorId as string),
    enabled: !!majorId,
  });
  const pos = ((posRes?.data as any)?.content as PO[]) || [];

  // 3. Fetch PLOs
  const { data: plosRes } = useQuery({
    queryKey: ["plos-curriculum", curriculumId],
    queryFn: () => CurriculumService.getPloByCurriculumId(curriculumId),
    enabled: !!curriculumId,
  });
  const plos = ((plosRes?.data as any)?.content as PLO[]) || [];

  const selectedPlo = plos.find(p => p.ploId === selectedPloId);

  useEffect(() => {
    if (selectedPlo) {
      setEditPloForm({
        ploCode: selectedPlo.ploCode || "",
        description: selectedPlo.description,
      });
    }
  }, [selectedPlo]);

  const handleSavePlo = async () => {
    if (!selectedPlo) return;
    setIsSavingPlo(true);
    try {
      await CurriculumService.updatePLO(selectedPlo.ploId, {
        ...editPloForm,
        curriculumId,
      });
      showToast("Outcome parameters updated successfully.", "success");
      queryClient.invalidateQueries({ queryKey: ["plos-curriculum", curriculumId] });
    } catch (error) {
      showToast("Configuration update failed.", "error");
    } finally {
      setIsSavingPlo(false);
    }
  };

  const handleDeletePlo = async () => {
    if (!selectedPlo) return;
    if (!confirm(`Are you sure you want to remove ${selectedPlo.ploCode || "this outcome"}?`)) return;
    try {
      await CurriculumService.deletePLO(selectedPlo.ploId);
      showToast("Outcome removed.", "success");
      setSelectedPloId(null);
      queryClient.invalidateQueries({ queryKey: ["plos-curriculum", curriculumId] });
      queryClient.invalidateQueries({ queryKey: ["po-plo-mappings", curriculumId] });
    } catch (error) {
      showToast("Failed to delete PLO.", "error");
    }
  };


  // 4. Fetch Mappings
  const { data: mappingsRes } = useQuery({
    queryKey: ["po-plo-mappings", curriculumId],
    queryFn: () => PoPloService.getMappingsByCurriculum(curriculumId),
    enabled: !!curriculumId,
  });
  const initialMappings = mappingsRes?.data || [];

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
    if (isLocked) return;
    const key = `${poId}||${ploId}`;
    const newTemp = new Set(tempMappings);
    if (newTemp.has(key)) newTemp.delete(key);
    else newTemp.add(key);
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
    } catch (error) {
      showToast("Synchronization constraint violation. Update failed.", "error");
    } finally {
      setIsSavingSync(false);
    }
  };

  const handleClearAll = () => {
    setTempMappings(new Set());
    setHasUnsavedChanges(true);
  };

  const handleContinue = async () => {
    // 1. Check if each PLO has at least one mapping
    const unmappedPLOs = plos.filter(plo => {
      return !pos.some(po => tempMappings.has(`${po.poId}||${plo.ploId}`));
    });

    if (unmappedPLOs.length > 0) {
      const names = unmappedPLOs.map(p => p.ploCode || p.ploName).join(", ");
      showToast(`Mandatory Alignment: Each PLO must map to at least one Institutional PO. Missing: ${names}`, "error");
      return;
    }

    // 2. Check if each PO has at least one mapping (Bidirectional Validation)
    const unmappedPOs = pos.filter(po => {
      return !plos.some(plo => tempMappings.has(`${po.poId}||${plo.ploId}`));
    });

    if (unmappedPOs.length > 0) {
      const names = unmappedPOs.map(p => p.poCode || `PO-${pos.indexOf(p) + 1}`).join(", ");
      showToast(`Institutional Coverage: Each PO must be addressed by at least one Program Outcome. Not covered: ${names}`, "error");
      return;
    }

    // 3. Sync Architecture logic
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

      showToast("Architecture mapping synchronized successfully.", "success");
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["po-plo-mappings", curriculumId] });
      
      // 3. Finally navigate
      router.push(`/dashboard/hocfdc/curriculums/${curriculumId}/wizard/overview`);
    } catch (error) {
      showToast("Failed to save mapping architecture. Please try again.", "error");
    } finally {
      setIsSavingSync(false);
    }
  };

  const sidebarContent = (
    <div className="h-full bg-white rounded-[2.5rem] shadow-xl border border-[#ebeef0] flex flex-col overflow-hidden ring-1 ring-black/5">
      <div className="p-8 border-b border-[#f1f4f5] bg-[#f1f4f5]/50 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-[#2d3335] tracking-tight">
            Context Insights
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#adb3b5] mt-1 italic">
            Program Outcome Parameters
          </p>
        </div>
        <Activity size={24} className="text-[#dee3e6]" />
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
        <AnimatePresence mode="wait">
          {selectedPloId ? (
            <motion.div
              key="selected"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Edit3 size={18} />
                  </div>
                  <p className="text-xs font-black uppercase tracking-widest text-[#2d3335]">
                    Outcome Definition
                  </p>
                </div>
                <div className="space-y-6 bg-[#f1f4f5]/30 p-6 rounded-2xl border border-[#ebeef0]">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#adb3b5] ml-1">
                      Internal Reference ID
                    </label>
                    <input
                      type="text"
                      value={editPloForm.ploCode}
                      onChange={(e) =>
                        setEditPloForm({
                          ...editPloForm,
                          ploCode: e.target.value,
                        })
                      }
                      disabled={isLocked}
                      className={`w-full bg-white border border-[#dee3e6] rounded-xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#adb3b5] ml-1">
                      Detailed Description
                    </label>
                    <textarea
                      rows={6}
                      value={editPloForm.description}
                      onChange={(e) =>
                        setEditPloForm({
                          ...editPloForm,
                          description: e.target.value,
                        })
                      }
                      disabled={isLocked}
                      className={`w-full bg-white border border-[#dee3e6] rounded-xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none leading-relaxed ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    {!isLocked && (
                      <>
                        <button
                          onClick={handleSavePlo}
                          disabled={isSavingPlo}
                          className="flex-1 bg-[#2d3335] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {isSavingPlo ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Save size={12} />
                          )}
                          Apply Changes
                        </button>
                        <button
                          onClick={handleDeletePlo}
                          className="px-5 py-4 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95 flex items-center justify-center"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-center space-y-6 py-20"
            >
              <div className="w-24 h-24 bg-[#f1f4f5] rounded-full flex items-center justify-center text-[#dee3e6] animate-pulse">
                <Target size={40} strokeWidth={1} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-[#2d3335] uppercase tracking-widest">
                  Awaiting Selection
                </h4>
                <p className="text-xs text-[#adb3b5] font-bold px-10 leading-relaxed italic uppercase tracking-tighter opacity-60">
                  Select a PLO row from the matrix to configure parameters or alignment logic.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <CurriculumStudioLayout
      activeStep={3}
      curriculumId={curriculumId}
      curriculumCode={curriculum?.curriculumCode}
      majorName={curriculum?.majorName}
      isLoading={isLoadingCurriculum}
      sidebar={sidebarContent}
    >
      <div className="space-y-8">
        <ModernPoPloMatrix 
          plos={plos}
          pos={pos}
          selectedPloId={selectedPloId}
          isMapped={isMapped}
          onToggleMapping={handleToggleMapping}
          onClearAll={handleClearAll}
          onSync={handleSyncArchitecture}
          onEditPlo={(ploId) => setSelectedPloId(ploId)}
          isLocked={isLocked}
          isSaving={isSavingSync}
        />

        {/* Wizard Navigation */}
        <div className="flex justify-between items-center pt-8">
           <button 
             onClick={() => router.back()}
             className="flex items-center gap-3 px-8 py-4 border border-[#dee3e6] text-[#5a6062] font-black rounded-2xl hover:bg-[#f1f4f5] transition-all uppercase tracking-widest text-[10px]"
           >
              <ChevronLeft size={16} /> Previous Step
           </button>
           <button 
             onClick={handleContinue}
             disabled={isSavingSync}
             className="flex items-center gap-3 px-12 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.03] active:scale-95 transition-all uppercase tracking-widest text-[10px] disabled:opacity-70 disabled:cursor-wait"
           >
              {isSavingSync ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving Architecture...
                </>
              ) : (
                <>
                  Continue to Course Builder <ArrowRight size={16} />
                </>
              )}
           </button>
        </div>
      </div>
    </CurriculumStudioLayout>
  );
}
