"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CurriculumService } from "@/services/curriculum.service";
import { Loader2, Target, Plus, Search, Tag, MoreHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CurriculumPLOs({ curriculumIdProp, isEmbedded }: { curriculumIdProp: string, isEmbedded?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ploData, isLoading } = useQuery({
    queryKey: ["curriculum-plos", curriculumIdProp],
    queryFn: () => CurriculumService.getPLOsByCurriculumId(curriculumIdProp),
  });

  const plos = ploData?.data?.content || [];

  const filteredPlos = plos.filter((plo: any) =>
    plo.ploCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plo.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${isEmbedded ? 'py-8 px-6' : 'p-8'} relative`}>
      <div className="flex justify-between items-end mb-8">
        <div>
           <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest"><Target size={14}/></span>
             <span className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">
              Program Outcomes Archive
            </span>
          </div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Program Learning Outcomes.</h2>
        </div>
      </div>

      {filteredPlos.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-zinc-100 rounded-3xl bg-zinc-50/50">
          <Target className="mx-auto h-12 w-12 text-zinc-200 mb-4" />
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">No Found Program Learning Outcomes</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredPlos.map((plo: any) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={plo.ploId}
                className="group relative bg-white border border-zinc-100 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary/20 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1.5 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-primary/10 flex items-center gap-2">
                        <Tag size={12} /> {plo.ploCode || "No Code"}
                    </div>
                    <button className="text-zinc-300 hover:text-zinc-600 transition-colors">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
                <p className="text-[13px] font-medium text-zinc-600 leading-relaxed group-hover:text-zinc-900 transition-colors">
                  {plo.description || "—"}
                </p>
                <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center gap-3">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">ID: {plo.ploId}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
