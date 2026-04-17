"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft, Loader2 } from "lucide-react";

interface CurriculumStudioLayoutProps {
  activeStep: number;
  curriculumId: string;
  curriculumCode?: string;
  majorName?: string;
  children: React.ReactNode;
  sidebar?: React.ReactNode; // Optional sidebar prop
  isLoading?: boolean;
  onBack?: () => void;
}

export default function CurriculumStudioLayout({
  activeStep,
  curriculumId,
  curriculumCode,
  majorName,
  children,
  sidebar,
  isLoading,
  onBack,
}: CurriculumStudioLayoutProps) {
  const router = useRouter();

  const steps = [
    { id: 1, label: "Basic Info", sub: "Structural Identity" },
    { id: 2, label: "PLO Definitions", sub: "Program Outcomes" },
    { id: 3, label: "PLO-PO Mapping", sub: "Institutional Alignment" },
    { id: 4, label: "Course Builder", sub: "Syllabus Creation" },
    { id: 5, label: "Review & Submit", sub: "Final Validation" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-12 pb-20 pt-10">
      {/* ... header and stepper omitted for brevity but they remain same ... */}
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <span className="px-3 py-1 bg-[#b1f0ce] text-[#1d5c42] text-[10px] font-black rounded-full uppercase tracking-widest">Setup Phase</span>
          <div className="h-[1px] flex-1 bg-[#dee3e6]"></div>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-5xl font-extrabold text-[#2d3335] tracking-tighter mb-4 leading-none font-headline uppercase">
              {steps.find(s => s.id === activeStep)?.label || "Curriculum Studio"}
            </h1>
            <p className="text-[#5a6062] text-lg max-w-2xl leading-relaxed italic">
              {curriculumCode ? `${curriculumCode} — ` : ""}{majorName || "Curriculum Development"}
            </p>
          </div>
          <button 
            onClick={() => router.push('/dashboard/hocfdc/curriculums')}
            className="w-12 h-12 rounded-2xl bg-white border border-[#ebeef0] flex items-center justify-center text-[#5a6062] hover:text-primary transition-all shadow-sm active:scale-90"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      </header>

      {/* Stepper Bento Grid */}
      <div className="grid grid-cols-5 gap-4 mb-16 px-2">
        {steps.map((s) => (
          <div 
            key={s.id}
            className={cn(
              "p-6 rounded-2xl transition-all duration-500 relative overflow-hidden",
              activeStep === s.id 
                ? "bg-white shadow-xl shadow-primary/5 border-l-4 border-primary ring-1 ring-black/5" 
                : activeStep > s.id 
                  ? "bg-white shadow-sm border-l-4 border-emerald-400 opacity-80"
                  : "bg-[#f1f4f5] opacity-50 shadow-inner"
            )}
          >
            <div className={cn(
              "font-extrabold text-2xl mb-1",
              activeStep === s.id ? "text-primary" : "text-[#5a6062]"
            )}>
              {activeStep > s.id ? (
                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
              ) : `0${s.id}`}
            </div>
            <div className="text-[#2d3335] font-bold text-sm tracking-tight">{s.label}</div>
            <div className="text-[10px] text-[#5a6062] font-semibold mt-2 uppercase tracking-widest">{s.sub}</div>
            {activeStep === s.id && (
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

      {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
            <Loader2 className="animate-spin mb-4" size={48} strokeWidth={1} />
            <p className="font-black text-[10px] uppercase tracking-[0.3em] opacity-50">Syncing Architecture Matrix...</p>
          </div>
      ) : (
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className={cn("col-span-12", sidebar ? "lg:col-span-8" : "lg:col-span-12")}>
            {children}
          </div>
          {sidebar && (
            <aside className="col-span-12 lg:col-span-4 space-y-6">
              {sidebar}
            </aside>
          )}
        </div>
      )}

      {/* Action Footer */}
      <footer className="mt-20 pt-10 border-t border-[#ebeef0] flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest">Registry Sync Active</span>
          </div>
        </div>
        
        {/* Navigation is usually handled by the specific page, but we can provide the slots here if needed */}
      </footer>
    </div>
  );
}
