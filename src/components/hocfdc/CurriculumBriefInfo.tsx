"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CurriculumService } from "@/services/curriculum.service";
import { Loader2, AlignLeft, GraduationCap, CheckCircle2, Award } from "lucide-react";

export default function CurriculumBriefInfo({ id, isEmbedded }: { id: string, isEmbedded?: boolean }) {
  const { data, isLoading } = useQuery({
    queryKey: ["curriculum-details", id],
    queryFn: () => CurriculumService.getCurriculumById(id),
  });
  const curriculum = data?.data;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!curriculum) return null;

  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${isEmbedded ? 'py-8 px-6' : 'p-8'}`}>
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-zinc-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
            <h2 className="text-[12px] font-black text-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <AlignLeft size={14} /> Fundamental Architecture
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Official Code</label>
                        <div className="text-sm font-bold text-zinc-900 bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 flex items-center gap-3">
                            <TagIcon /> {curriculum.curriculumCode}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Nomenclature</label>
                        <div className="text-sm font-bold text-zinc-900 bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100">
                            {curriculum.curriculumName}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                     <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Discipline</label>
                        <div className="text-sm font-bold text-zinc-900 bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 flex items-center gap-3">
                            <GraduationCap size={16} className="text-zinc-400" /> {curriculum.majorName}
                        </div>
                    </div>
                     <div>
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">English Translation</label>
                        <div className="text-sm font-bold text-zinc-900 bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-100 flex items-center justify-between">
                            <span className="truncate">{curriculum.englishCurriculumName || "Not Provided"}</span>
                            <span className="text-[9px] text-zinc-400 uppercase tracking-widest bg-white px-2 py-1 rounded-md shadow-sm border border-zinc-100 shrink-0">EN</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-zinc-100">
                 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 block">Architecture Definition</label>
                 <p className="text-[13px] leading-relaxed text-zinc-600 font-medium">
                     {curriculum.description || "The architectural foundation lacks an explicit description block."}
                 </p>
            </div>
        </div>
    </div>
  );
}

function TagIcon() {
    return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
}
