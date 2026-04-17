"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { MajorService } from "@/services/major.service";
import { CurriculumService, PLO } from "@/services/curriculum.service";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function NewCurriculumPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="animate-spin text-zinc-300" size={32} />
        </div>
      }
    >
      <NewCurriculumContent />
    </Suspense>
  );
}

function NewCurriculumContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const majorCodeFromUrl = searchParams.get("majorCode");

  const [step, setStep] = useState(1);

  // Form State
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const [curriculumCode, setCurriculumCode] = useState("");
  const [description, setDescription] = useState("");
  const [plos, setPlos] = useState<PLO[]>([
    { ploId: "1", ploName: "PLO1", description: "", mappingPOIds: [] },
  ]);

  // Temporary state for drafting a new PLO in Step 2 Left Sidebar
  const [draftPLO, setDraftPLO] = useState({ name: "PLO1", description: "" });

  // Fetch Majors
  const { data: majorData } = useQuery({
    queryKey: ["majors-select"],
    queryFn: () => MajorService.getMajors({ size: 100 }),
  });
  const majors = majorData?.data?.content || [];
  const selectedMajor = majors.find((m: any) => m.majorId === selectedMajorId);

  // Auto-select major if majorCode is in URL
  useEffect(() => {
    if (majorCodeFromUrl && majors.length > 0 && !selectedMajorId) {
      const matchedMajor = majors.find((m: any) => m.majorCode === majorCodeFromUrl);
      if (matchedMajor) {
        setSelectedMajorId(matchedMajor.majorId);
      }
    }
  }, [majorCodeFromUrl, majors, selectedMajorId]);

  // Sync draftPLO name when plos length changes
  useEffect(() => {
    setDraftPLO(prev => ({ ...prev, name: `PLO${plos.length + 1}` }));
  }, [plos.length]);

  const addPLO = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!draftPLO.description.trim()) return;

    const nextId = (plos.length + 1).toString();
    setPlos([
      ...plos,
      {
        ploId: nextId,
        ploName: draftPLO.name,
        description: draftPLO.description,
        mappingPOIds: [],
      },
    ]);
    // Reset draft
    setDraftPLO({ name: `PLO${plos.length + 2}`, description: "" });
  };

  const removePLO = (index: number) => {
    setPlos(plos.filter((_, i) => i !== index));
  };

  const updatePLO = (index: number, field: keyof PLO, value: any) => {
    const updated = [...plos];
    updated[index] = { ...updated[index], [field]: value };
    setPlos(updated);
  };

  const togglePOMapping = (ploIndex: number, poId: string) => {
    const updated = [...plos];
    const currentMapping = updated[ploIndex].mappingPOIds || [];
    if (currentMapping.includes(poId)) {
      updated[ploIndex].mappingPOIds = currentMapping.filter(
        (id) => id !== poId,
      );
    } else {
      updated[ploIndex].mappingPOIds = [...currentMapping, poId];
    }
    setPlos(updated);
  };

  // Mutation
  const createMutation = useMutation({
    mutationFn: CurriculumService.createCurriculum,
    onSuccess: async (response: any) => {
      const curriculumId = response?.data?.curriculumId || response?.curriculumId;
      if (curriculumId && plos.length > 0) {
        try {
          await CurriculumService.bulkCreatePLOs(curriculumId, plos);
        } catch (error) {
          console.error("Failed to auto-save PLOs:", error);
        }
      }
      // Redirect to Mapping page per user request
      router.push(`/dashboard/hocfdc/curriculums/${curriculumId}/mapping/po-plo`);
    },
  });

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else {
      createMutation.mutate({
        curriculumCode,
        curriculumName: `${selectedMajor?.majorName || ""} - ${curriculumCode}`, 
        majorId: selectedMajorId,
        startYear: new Date().getFullYear(),
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-12 pb-20 pt-10">
      {/* Academic Editorial Header */}
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <span className="px-3 py-1 bg-[#b1f0ce] text-[#1d5c42] text-[10px] font-black rounded-full uppercase tracking-widest">Setup Phase</span>
          <div className="h-[1px] flex-1 bg-[#dee3e6]"></div>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-extrabold text-[#2d3335] tracking-tighter mb-4 leading-none font-headline">
              {step === 1 ? "Basic Information" : "Program Learning Outcomes"}
            </h1>
            <p className="text-[#5a6062] text-lg max-w-2xl leading-relaxed italic">
              {step === 1 
                ? "Define the structural core of your academic program. This data forms the metadata foundation for all subsequent curriculum mapping."
                : "Define the high-level competencies students will achieve upon graduation. These outcomes bridge the gap between academic standards and career readiness."}
            </p>
          </div>
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 rounded-2xl bg-white border border-[#ebeef0] flex items-center justify-center text-[#5a6062] hover:text-primary transition-all shadow-sm active:scale-90"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* Stepper Bento Grid */}
      <div className="grid grid-cols-5 gap-4 mb-16 px-2">
        {[
          { id: 1, label: "Basic Info", sub: "Structural Identity" },
          { id: 2, label: "PLO Definitions", sub: "Program Outcomes" },
          { id: 3, label: "PLO-PO Mapping", sub: "Institutional Alignment" },
          { id: 4, label: "Course Builder", sub: "Syllabus Creation" },
          { id: 5, label: "Review & Submit", sub: "Final Validation" },
        ].map((s) => (
          <div 
            key={s.id}
            className={cn(
              "p-6 rounded-2xl transition-all duration-500 relative overflow-hidden",
              step === s.id 
                ? "bg-white shadow-xl shadow-primary/5 border-l-4 border-primary ring-1 ring-black/5" 
                : step > s.id 
                  ? "bg-white shadow-sm border-l-4 border-emerald-400 opacity-80"
                  : "bg-[#f1f4f5] opacity-50 shadow-inner"
            )}
          >
            <div className={cn(
              "font-extrabold text-2xl mb-1",
              step === s.id ? "text-primary" : "text-[#5a6062]"
            )}>
              {step > s.id ? (
                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              ) : `0${s.id}`}
            </div>
            <div className="text-[#2d3335] font-bold text-sm tracking-tight">{s.label}</div>
            <div className="text-[10px] text-[#5a6062] font-semibold mt-2 uppercase tracking-widest">{s.sub}</div>
            {step === s.id && (
              <motion.div 
                layoutId="step-dot"
                className="text-[10px] text-primary font-black mt-3 flex items-center gap-1.5 uppercase tracking-tighter"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Current Phase
              </motion.div>
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col lg:flex-row gap-12"
          >
            <section className="flex-1">
              <div className="bg-white p-10 rounded-[2.5rem] border border-[#ebeef0] shadow-[0px_4px_20px_rgba(45,51,53,0.04)] ring-1 ring-black/5">
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a6062] ml-1">Curriculum Code *</label>
                      <input 
                        value={curriculumCode}
                        onChange={(e) => setCurriculumCode(e.target.value)}
                        className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 focus:bg-white rounded-xl px-5 py-3.5 transition-all text-[#2d3335] font-bold placeholder:text-[#adb3b5]" 
                        placeholder="e.g., CS-2024-ENG" 
                        type="text"
                      />
                      <p className="text-[10px] text-[#adb3b5] italic font-medium">Unique institutional identifier.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a6062] ml-1">Target Major *</label>
                      <select 
                        value={selectedMajorId}
                        onChange={(e) => setSelectedMajorId(e.target.value)}
                        className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 focus:bg-white rounded-xl px-5 py-3.5 transition-all text-[#2d3335] font-bold appearance-none cursor-pointer"
                      >
                        <option value="">Select Target Major...</option>
                        {majors.map((m: any) => (
                          <option key={m.majorId} value={m.majorId}>{m.majorName} ({m.majorCode})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a6062] ml-1">General Description *</label>
                    <textarea 
                      rows={10}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 focus:bg-white rounded-2xl px-6 py-4 transition-all text-[#2d3335] font-medium resize-none placeholder:text-[#adb3b5]" 
                      placeholder="Describe the educational philosophy, core objectives, and unique value proposition..." 
                    />
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] text-[#adb3b5] font-bold uppercase tracking-widest">Recommended: 200-500 words</span>
                      <span className="text-[10px] text-[#adb3b5] font-bold uppercase tracking-widest">{description.length} / 2500 CHARS</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="w-full lg:w-80 space-y-8">
              <div className="bg-[#b1f0ce]/30 p-8 rounded-[2.5rem] border border-primary/10 ring-1 ring-primary/5">
                <span className="material-symbols-outlined text-primary mb-6" style={{ fontSize: 36, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                <h4 className="text-[#1d5c42] font-black text-xl mb-4 leading-tight tracking-tight uppercase">Design Strategy</h4>
                <p className="text-sm text-[#1d5c42]/80 leading-relaxed italic mb-6">
                  "The General Description should clearly articulate how this curriculum meets industry demands while maintaining academic rigor."
                </p>
                <div className="h-[1px] w-16 bg-[#1d5c42]/20 mb-6"></div>
                <p className="text-[10px] font-black text-[#1d5c42]/60 uppercase tracking-widest">
                  Dr. Elena Vance<br />Registry Lead
                </p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] relative overflow-hidden group border border-[#ebeef0] shadow-sm ring-1 ring-black/5 hover:shadow-xl transition-all h-64 flex flex-col justify-between">
                <div className="relative z-10">
                  <h4 className="text-[#2d3335] font-black text-lg mb-3 tracking-tight uppercase">Registry Help?</h4>
                  <p className="text-[11px] text-[#5a6062] font-semibold leading-relaxed mb-4 uppercase tracking-tighter opacity-70">
                    Access our knowledge base for standard curriculum templates and accreditation guidelines.
                  </p>
                </div>
                <a 
                  className="relative z-10 w-full py-4 bg-[#f1f4f5] rounded-2xl text-primary text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all active:scale-95 group/link shadow-sm" 
                  href="#"
                >
                  View Docs
                  <span className="material-symbols-outlined text-sm group-hover/link:translate-x-1 transition-transform">open_in_new</span>
                </a>
                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[#ebeef0] opacity-40 select-none group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700" style={{ fontSize: 160 }}>menu_book</span>
              </div>
            </aside>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-12 gap-8"
          >
            {/* Left: Definition Form (New Outcome) */}
            <section className="col-span-12 lg:col-span-5 flex flex-col gap-6">
              <div className="bg-white p-8 rounded-[2rem] border border-[#ebeef0] shadow-xl shadow-black/5 ring-1 ring-black/5">
                <h3 className="text-xl font-headline font-black text-[#1d5c42] mb-8 flex items-center gap-3 uppercase tracking-tight">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>add_circle</span>
                  New Outcome
                </h3>
                <form onSubmit={addPLO} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6062] mb-3 ml-1">Outcome Identifier</label>
                    <input 
                      value={draftPLO.name}
                      onChange={(e) => setDraftPLO({...draftPLO, name: e.target.value})}
                      className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 focus:bg-white rounded-xl py-4 px-5 font-bold text-[#2d3335] placeholder:text-[#adb3b5] transition-all" 
                      placeholder="e.g., PLO-01" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#5a6062] mb-3 ml-1">Detailed Description</label>
                    <textarea 
                      value={draftPLO.description}
                      onChange={(e) => setDraftPLO({...draftPLO, description: e.target.value})}
                      className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 focus:bg-white rounded-xl py-4 px-5 font-medium text-[#2d3335] placeholder:text-[#adb3b5] resize-none h-40 transition-all" 
                      placeholder="Describe the specific skill, knowledge, or behavior..." 
                    />
                  </div>
                  {/* Tip box removed as per user request */}
                  <button 
                    type="submit"
                    disabled={!draftPLO.description.trim()}
                    className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs disabled:opacity-50"
                  >
                    Add to Curriculum
                  </button>
                </form>
              </div>

              {/* Guidance card removed as per user request */}
            </section>

            {/* Right: Outcomes Inventory (Gallery View) */}
            <section className="col-span-12 lg:col-span-7 space-y-6">
              <div className="flex items-end justify-between mb-8 px-4">
                <div>
                  <span className="text-[10px] font-black text-primary tracking-[0.3em] uppercase">Current Progress</span>
                  <h3 className="text-3xl font-headline font-black text-[#2d3335] tracking-tight">Outcome Inventory</h3>
                </div>
                <div className="flex gap-4">
                   <div className="px-4 py-2 bg-white rounded-xl border border-[#ebeef0] text-[10px] font-black text-[#adb3b5] uppercase tracking-widest">
                      {plos.length} Outcomes Defined
                   </div>
                </div>
              </div>

              <div className="space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {plos.length === 0 ? (
                  <div className="border-4 border-dashed border-[#ebeef0] rounded-[2.5rem] p-20 flex flex-col items-center justify-center text-center opacity-40">
                    <div className="w-20 h-20 bg-[#f1f4f5] rounded-full flex items-center justify-center mb-6">
                      <span className="material-symbols-outlined text-[40px]">add</span>
                    </div>
                    <h5 className="font-black text-xl text-[#2d3335] uppercase tracking-tight">Draft your first outcome</h5>
                    <p className="text-xs text-[#5a6062] font-bold uppercase tracking-widest mt-2 max-w-[250px]">Recommended: 5 to 12 outcomes for a comprehensive curriculum.</p>
                  </div>
                ) : (
                  plos.map((plo, ploIdx) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={ploIdx}
                      className="group bg-white hover:bg-[#f8f9fa] transition-all p-8 rounded-[2rem] border border-[#ebeef0] hover:border-primary/20 hover:shadow-2xl shadow-black/5 relative flex flex-col gap-6"
                    >
                      <div className="flex items-start gap-6">
                        <div className="w-16 h-16 shrink-0 bg-[#f1f4f5] rounded-2xl flex flex-col items-center justify-center border border-transparent group-hover:bg-primary group-hover:text-white transition-all duration-500">
                          <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">ID</span>
                          <span className="text-xl font-black">{plo.ploId.padStart(2, '0')}</span>
                        </div>
                        <div className="flex-grow space-y-4">
                           <div className="space-y-2">
                             <input 
                               value={plo.ploName}
                               onChange={(e) => updatePLO(ploIdx, "ploName", e.target.value)}
                               className="text-xl font-black text-[#2d3335] bg-transparent border-transparent focus:border-primary/20 focus:bg-white rounded-lg px-2 py-1 -ml-2 w-full outline-none transition-all uppercase"
                             />
                             <textarea 
                               value={plo.description}
                               onChange={(e) => updatePLO(ploIdx, "description", e.target.value)}
                               rows={3}
                               className="text-[#5a6062] text-sm font-medium leading-relaxed bg-transparent border-transparent focus:border-primary/20 focus:bg-white rounded-lg px-2 py-1 -ml-2 w-full outline-none transition-all resize-none"
                             />
                           </div>

                           {/* PO Mapping Embedded Section */}
                           <div className="pt-4 border-t border-[#f1f4f5] space-y-3">
                              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#adb3b5]">Align with Institutional POs</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedMajor?.pos?.map((po: any) => (
                                  <button
                                    key={po.poId}
                                    onClick={() => togglePOMapping(ploIdx, po.poId)}
                                    className={cn(
                                      "px-4 py-2 rounded-xl text-[10px] font-bold transition-all border shadow-sm",
                                      plo.mappingPOIds?.includes(po.poId)
                                        ? "bg-primary text-white border-primary scale-105"
                                        : "bg-white text-[#5a6062] border-[#ebeef0] hover:border-[#adb3b5]"
                                    )}
                                  >
                                    {po.poCode || "PO"}
                                  </button>
                                ))}
                                {(!selectedMajor?.pos || selectedMajor.pos.length === 0) && (
                                  <span className="text-[10px] italic text-[#adb3b5]">No POs available for mapping</span>
                                )}
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => removePLO(ploIdx)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-3 text-[#adb3b5] hover:text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Visual Accent Card removed as per user request */}
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Footer */}
      <footer className="mt-20 pt-10 border-t border-[#ebeef0] flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest">Registry Sync Active</span>
          </div>
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-4 text-[10px] font-black text-[#5a6062] hover:text-primary transition-all uppercase tracking-[0.2em] group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f1f4f5] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                 <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </div>
              Strategic Info
            </button>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-8 py-4 rounded-xl font-black text-[10px] text-[#5a6062] hover:bg-[#f1f4f5] transition-all uppercase tracking-[0.2em]"
          >
            Discard Draft
          </button>
          <button
            disabled={
              createMutation.isPending ||
              (step === 1 ? !selectedMajorId || !curriculumCode : plos.length === 0)
            }
            onClick={handleNext}
            className="px-12 py-5 bg-[#2d3335] text-white font-black rounded-2xl shadow-2xl shadow-black/10 hover:bg-black hover:scale-[1.03] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50 uppercase tracking-[0.2em]"
          >
            {createMutation.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>
                <span>{step === 1 ? "Define Outcomes" : "Finalize Framework"}</span>
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'wght' 700" }}>arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
