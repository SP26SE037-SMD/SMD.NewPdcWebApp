"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { MajorService } from "@/services/major.service";
import { CurriculumService, PLO } from "@/services/curriculum.service";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Target,
  Layers,
  Info,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isMajorOpen, setIsMajorOpen] = useState(false);
  const majorDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (majorDropdownRef.current && !majorDropdownRef.current.contains(event.target as Node)) {
        setIsMajorOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Form State
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const [curriculumCode, setCurriculumCode] = useState("");
  const [description, setDescription] = useState("");
  const [plos, setPlos] = useState<PLO[]>([
    { ploId: "1", ploName: "PLO1", description: "", mappingPOIds: [] },
  ]);

  // Fetch Majors
  const { data: majorData } = useQuery({
    queryKey: ["majors-select"],
    queryFn: () => MajorService.getMajors({ size: 100 }),
  });
  const majors = majorData?.data?.content || [];
  const selectedMajor = majors.find((m) => m.majorId === selectedMajorId);

  // Auto-select major if majorCode is in URL
  useEffect(() => {
    if (majorCodeFromUrl && majors.length > 0 && !selectedMajorId) {
      const matchedMajor = majors.find((m) => m.majorCode === majorCodeFromUrl);
      if (matchedMajor) {
        setSelectedMajorId(matchedMajor.majorId);
      }
    }
  }, [majorCodeFromUrl, majors, selectedMajorId]);

  const addPLO = () => {
    const nextId = (plos.length + 1).toString();
    setPlos([
      ...plos,
      {
        ploId: nextId,
        ploName: `PLO${nextId}`,
        description: "",
        mappingPOIds: [],
      },
    ]);
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
      const curriculumId =
        response?.data?.curriculumId || response?.curriculumId;

      // If we have PLOs, save them now
      if (curriculumId && plos.length > 0) {
        try {
          await CurriculumService.bulkCreatePLOs(curriculumId, plos);
        } catch (error) {
          console.error("Failed to auto-save PLOs:", error);
          // We still navigate, as the curriculum was created
        }
      }

      router.push(`/dashboard/hocfdc/curriculums/${curriculumId}`);
    },
  });

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else {
      createMutation.mutate({
        curriculumCode,
        curriculumName: `${selectedMajor?.majorName || ""} - ${curriculumCode}`, // Construct a name since it's required
        majorId: selectedMajorId,
        startYear: new Date().getFullYear(), // Add a default start year if needed
      });
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Breadcrumbs / Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors font-bold text-xs uppercase tracking-widest"
      >
        <ChevronLeft size={16} /> Backward
      </button>

      {/* Stepper Header */}
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${step >= 1 ? "bg-primary text-white" : "bg-zinc-100 text-zinc-400"}`}
        >
          1
        </div>
        <div className="h-0.5 w-12 bg-zinc-100" />
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${step >= 2 ? "bg-primary text-white" : "bg-zinc-100 text-zinc-400"}`}
        >
          2
        </div>
        <div className="ml-4">
          <h1 className="text-2xl font-black text-zinc-900 leading-tight">
            {step === 1 ? "Strategic Context." : "Program Outcomes."}
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            {step === 1
              ? "Define major association and framework identification."
              : "Define PLOs and map them to Major Objectives."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        <div className="flex-1 p-10">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3 relative" ref={majorDropdownRef}>
                    <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900">
                      Target Major
                    </label>
                    <button
                      onClick={() => setIsMajorOpen(!isMajorOpen)}
                      className="w-full flex items-center justify-between bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all text-left"
                    >
                      {selectedMajor
                        ? `${selectedMajor.majorName} (${selectedMajor.majorCode})`
                        : "Select a Major..."}
                      <ChevronDown
                        size={14}
                        className={`opacity-40 transition-transform ${isMajorOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isMajorOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-100 rounded-2xl shadow-xl z-50 overflow-hidden p-1 max-h-[300px] overflow-y-auto"
                        >
                          <button
                            onClick={() => {
                              setSelectedMajorId("");
                              setIsMajorOpen(false);
                            }}
                            className="w-full text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-zinc-400 hover:bg-zinc-50 rounded-xl transition-colors"
                          >
                            Select a Major...
                          </button>
                          {majors.map((m) => (
                            <button
                              key={m.majorId}
                              onClick={() => {
                                setSelectedMajorId(m.majorId);
                                setIsMajorOpen(false);
                              }}
                              className={`w-full text-left px-5 py-3 text-xs font-bold rounded-xl transition-colors flex items-center justify-between ${
                                selectedMajorId === m.majorId
                                  ? "bg-primary text-white"
                                  : "text-zinc-600 hover:bg-zinc-50"
                              }`}
                            >
                              <span>
                                {m.majorName}{" "}
                                <span className={`ml-1 text-[10px] opacity-60`}>
                                  ({m.majorCode})
                                </span>
                              </span>
                              {selectedMajorId === m.majorId && (
                                <CheckCircle2 size={14} />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900">
                      Framework Code
                    </label>
                    <input
                      value={curriculumCode}
                      onChange={(e) => setCurriculumCode(e.target.value)}
                      placeholder="e.g. SE_K18"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black uppercase tracking-widest text-zinc-900">
                    Strategic Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Outline the goals and scope of this curriculum framework..."
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none resize-none"
                  />
                </div>

                {selectedMajor && (
                  <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100/50 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600">
                      <Target size={18} />
                      <h4 className="text-xs font-black uppercase tracking-widest">
                        Major Objectives (POs) from VP
                      </h4>
                    </div>
                    <ul className="space-y-2">
                      {selectedMajor.pos?.length ? (
                        selectedMajor.pos.map((po, i) => (
                          <li
                            key={i}
                            className="text-xs font-medium text-zinc-600 flex items-start gap-2"
                          >
                            <span className="w-4 h-4 rounded-full bg-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm border border-indigo-100">
                              {i + 1}
                            </span>
                            {po.description}
                          </li>
                        ))
                      ) : (
                        <li className="text-xs italic text-zinc-400">
                          No POs defined for this major by the Vice Principal.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-6">
                  {plos.map((plo, ploIdx) => (
                    <div
                      key={ploIdx}
                      className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/30 space-y-6 relative group"
                    >
                      <button
                        onClick={() => removePLO(ploIdx)}
                        className="absolute -right-2 -top-2 w-8 h-8 bg-white border border-zinc-200 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      >
                        <X size={14} />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1 space-y-2">
                          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-900 px-1">
                            Identifier
                          </label>
                          <input
                            value={plo.ploName}
                            onChange={(e) =>
                              updatePLO(ploIdx, "ploName", e.target.value)
                            }
                            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none"
                          />
                        </div>
                        <div className="md:col-span-3 space-y-2">
                          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-zinc-900 px-1">
                            Outcome Description
                          </label>
                          <textarea
                            value={plo.description}
                            onChange={(e) =>
                              updatePLO(ploIdx, "description", e.target.value)
                            }
                            placeholder="e.g. Students will be able to design microservices..."
                            rows={2}
                            className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-4 focus:ring-primary/5 outline-none resize-none"
                          />
                        </div>
                      </div>

                      {/* PO Mapping Grid */}
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {selectedMajor?.pos?.map((po) => (
                            <button
                              key={po.poId}
                              onClick={() => togglePOMapping(ploIdx, po.poId)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-2 ${
                                plo.mappingPOIds?.includes(po.poId)
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                                  : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                              }`}
                            >
                              {plo.mappingPOIds?.includes(po.poId) && (
                                <CheckCircle2 size={12} />
                              )}
                              {po.poCode || "PO"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addPLO}
                    className="w-full py-4 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Add Program Outcome
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-8 border-t border-zinc-50 bg-zinc-50/20 flex justify-between items-center">
          <div className="flex items-center gap-3 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
            <Info size={14} />
            Framework data is persistent once established.
          </div>
          <div className="flex gap-4">
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-all"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={
                step === 1
                  ? !selectedMajorId || !curriculumCode
                  : plos.some((p) => !p.description)
              }
              className="bg-primary text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed group"
            >
              {step === 1 ? "Define Outcomes" : "Initialize Framework"}
              {step === 1 ? (
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              ) : (
                <Layers size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
