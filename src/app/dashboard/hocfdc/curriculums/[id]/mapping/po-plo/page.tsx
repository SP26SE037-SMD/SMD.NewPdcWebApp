"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CurriculumService,
  PLO,
  CURRICULUM_STATUS,
} from "@/services/curriculum.service";
import { MajorService } from "@/services/major.service";
import { PoService, PO } from "@/services/po.service";
import { PoPloService, PoPloMapping } from "@/services/poplo.service";
import {
  ChevronLeft,
  Check,
  Loader2,
  AlertCircle,
  RefreshCcw,
  Lock,
  Unlock,
  Search,
  Edit3,
  Trash2,
  X,
  Target,
  Activity,
  Save,
  ChevronUp,
  ChevronDown,
  SaveAll,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import PoPloMatrix from "@/components/hocfdc/PoPloMatrix";

export default function PoPloMappingPage() {
  const { id: curriculumId } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // UI State
  const [selectedPloId, setSelectedPloId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [editPloForm, setEditPloForm] = useState({
    ploCode: "",
    description: "",
  });
  const [isSavingPlo, setIsSavingPlo] = useState(false);

  // 1. Fetch Curriculum (minimal fetch for UI header/status)
  const { data: curriculumRes, isLoading: isLoadingCurriculum } = useQuery({
    queryKey: ["curriculum", curriculumId],
    queryFn: () => CurriculumService.getCurriculumById(curriculumId),
    refetchOnWindowFocus: false,
  });
  const curriculum = curriculumRes?.data;
  const isLocked = curriculum?.status
    ? curriculum.status !== CURRICULUM_STATUS.DRAFT &&
      curriculum.status !== CURRICULUM_STATUS.STRUCTURE_REVIEW
    : false;

  // 2. Fetch PLOs for the Sidebar Detail Editing
  const { data: plosRes } = useQuery({
    queryKey: ["plos-curriculum", curriculumId],
    queryFn: () => CurriculumService.getPloByCurriculumId(curriculumId),
    enabled: !!curriculumId,
  });
  const plos = ((plosRes?.data as any)?.content as PLO[]) || [];

  // Handle Selected PLO Sync
  const selectedPlo = useMemo(
    () => plos.find((p) => p.ploId === selectedPloId) || null,
    [plos, selectedPloId],
  );

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
      showToast("PLO updated successfully.", "success");
      queryClient.invalidateQueries({
        queryKey: ["plos-curriculum", curriculumId],
      });
    } catch (error) {
      showToast("Failed to save changes.", "error");
    } finally {
      setIsSavingPlo(false);
    }
  };

  const handleDeletePlo = async () => {
    if (!selectedPlo) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selectedPlo.ploCode}? This will remove all associated alignment data.`,
      )
    )
      return;

    try {
      await CurriculumService.deletePLO(selectedPlo.ploId);
      showToast("Outcome removed from framework.", "success");
      setSelectedPloId(null);
      queryClient.invalidateQueries({
        queryKey: ["plos-curriculum", curriculumId],
      });
      queryClient.invalidateQueries({
        queryKey: ["po-plo-mappings", curriculumId],
      });
    } catch (error) {
      showToast(
        "Relational constraint error. Cannot delete active PLO.",
        "error",
      );
    }
  };

  if (isLoadingCurriculum) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-zinc-400">
        <Loader2 className="animate-spin mb-4" size={40} strokeWidth={1.5} />
        <p className="font-bold text-[10px] uppercase tracking-[0.3em] opacity-50">
          Syncing Architecture...
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#F0F2F5] p-6 lg:p-10 font-sans selection:bg-indigo-100 overflow-hidden">
      {/* Dashboard Header */}
      <div className="mb-8 relative">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white rounded-xl shadow-sm border border-zinc-100 text-zinc-400 hover:text-zinc-900 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <ChevronLeft size={20} /> Repository
            </button>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
              Alignment Matrix Management
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Main Interface: The Matrix Component */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ease-in-out`}
        >
          <PoPloMatrix
            curriculumId={curriculumId}
            mode="edit"
            isLocked={isLocked}
            selectedPloId={selectedPloId}
            onSelectPlo={setSelectedPloId}
          />
        </div>

        {/* Action Panel / Context Insights */}
        <div
          className={`transition-all duration-500 ease-in-out shrink-0 ${isSidebarOpen ? "w-[450px]" : "w-0 opacity-0 pointer-events-none"}`}
        >
          <div className="h-full bg-white rounded-3xl shadow-xl border border-zinc-100 flex flex-col overflow-hidden">
            <div className="p-8 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                  Context Insights
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1 italic">
                  Program Outcome Parameters
                </p>
              </div>
              <Activity size={24} className="text-zinc-200" />
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
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Edit3 size={18} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-[#102C57]">
                          Outcome Definition
                        </p>
                      </div>
                      <div className="space-y-6 bg-zinc-50/50 p-6 rounded-2xl border border-zinc-100">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
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
                            className={`w-full bg-white border border-zinc-200 rounded-xl px-5 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                            Syllabus Description
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
                            className={`w-full bg-white border border-zinc-200 rounded-xl px-5 py-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none leading-relaxed ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                          />
                        </div>
                        <div className="flex gap-3 pt-2">
                          {!isLocked && (
                            <>
                              <button
                                onClick={handleSavePlo}
                                disabled={isSavingPlo}
                                className="flex-1 bg-[#102C57] text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
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
                    <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-200 animate-pulse">
                      <Target size={40} strokeWidth={1} />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                        Awaiting Selection
                      </h4>
                      <p className="text-xs text-zinc-400 font-medium px-10 leading-relaxed italic">
                        Select a Program Outcome row from the matrix to
                        configure internal parameters or review alignment logic.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isLocked && (
              <div className="px-8 py-5 bg-zinc-900 text-zinc-400 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Lock size={12} /> READ-ONLY MODE
                </div>
                <span className="opacity-50">FINALIZED</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Panel Trigger */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-3">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`w-16 h-16 rounded-[2rem] flex items-center justify-center transition-all duration-300 shadow-2xl ${isSidebarOpen ? "bg-[#102C57] text-white rotate-180" : "bg-white text-zinc-900 border border-zinc-100 hover:scale-110"}`}
        >
          {isSidebarOpen ? <ChevronUp size={24} /> : <Edit3 size={24} />}
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
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
    </div>
  );
}
