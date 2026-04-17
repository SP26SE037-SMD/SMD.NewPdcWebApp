"use client";

import { Check, Plus, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLO } from "@/services/curriculum.service";
import { PO } from "@/services/po.service";

interface ModernPoPloMatrixProps {
  plos: PLO[];
  pos: PO[];
  selectedPloId?: string | null; // Added for highlighting
  isMapped: (poId: string, ploId: string) => boolean;
  onToggleMapping: (poId: string, ploId: string) => void;
  onClearAll: () => void;
  onSync: () => void;
  onEditPlo: (ploId: string) => void;
  isLocked?: boolean;
  isSaving?: boolean;
}

export default function ModernPoPloMatrix({
  plos,
  pos,
  selectedPloId,
  isMapped,
  onToggleMapping,
  onClearAll,
  onSync,
  onEditPlo,
  isLocked,
  isSaving,
}: ModernPoPloMatrixProps) {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-[#ebeef0] overflow-hidden shadow-[0px_4px_20px_rgba(45,51,53,0.04)] ring-1 ring-black/5">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            {/* ... */}
            <tr>
              <th className="p-6 text-left bg-[#f1f4f5] rounded-tl-3xl w-64 border-r border-[#dee3e6]/50">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-[#5a6062] font-black mb-1">Row x Col</span>
                  <span className="text-sm font-black text-primary uppercase tracking-tight">PLO to PO Map</span>
                </div>
              </th>
              {pos.map((po, idx) => (
                <th 
                  key={po.poId} 
                  className={cn(
                    "p-6 bg-[#f1f4f5] min-w-[120px] transition-colors group relative",
                    idx === pos.length - 1 && "rounded-tr-3xl"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-black text-[#2d3335] tracking-widest">{po.poCode || `PO-${idx + 1}`}</span>
                    <span className="text-[9px] text-[#5a6062] font-bold mt-1 uppercase opacity-60 line-clamp-1 max-w-[80px]">
                      {po.description?.split(' ')[0] || "Target"}
                    </span>
                  </div>
                  {/* Tooltip on hover */}
                  <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#2d3335] text-white text-[11px] rounded-2xl shadow-2xl p-5 z-[100] text-left pointer-events-none transform group-hover:translate-y-1 border border-white/10">
                    <p className="font-black text-primary-fixed mb-2 tracking-widest uppercase border-b border-white/10 pb-2">{po.poCode || `PO-${idx+1}`}</p>
                    <p className="font-medium leading-relaxed mt-2 italic opacity-80">{po.description}</p>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f4f5]">
            {plos.map((plo) => (
              <tr 
                key={plo.ploId} 
                className={cn(
                  "group transition-all",
                  selectedPloId === plo.ploId ? "bg-primary/5" : "hover:bg-[#f1f4f5]/30"
                )}
              >
                <td 
                  onClick={() => onEditPlo(plo.ploId)}
                  className={cn(
                    "p-6 font-black text-sm text-[#2d3335] border-r border-[#f1f4f5] cursor-pointer transition-colors",
                    selectedPloId === plo.ploId ? "bg-primary/10 border-r-primary/20 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]" : "hover:bg-[#f1f4f5]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-1.5 h-6 rounded-full transition-all",
                      selectedPloId === plo.ploId ? "bg-primary scale-x-125" : "bg-primary"
                    )}></span>
                    {plo.ploCode || plo.ploName}
                  </div>
                  <p className="text-[10px] font-bold text-[#5a6062] mt-1 line-clamp-1 italic uppercase opacity-60 px-4">
                    {plo.description}
                  </p>
                </td>
                {pos.map((po) => {
                  const mapped = isMapped(po.poId, plo.ploId);
                  return (
                    <td key={po.poId} className="p-0 border-r border-[#f1f4f5]/50 last:border-r-0">
                      <button 
                        onClick={() => onToggleMapping(po.poId, plo.ploId)}
                        disabled={isLocked}
                        className={cn(
                          "w-full h-full min-h-[100px] flex items-center justify-center transition-all group relative",
                          mapped ? "bg-[#b1f0ce]/10" : "hover:bg-[#f1f4f5]/50"
                        )}
                      >
                        {mapped ? (
                          <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 scale-100 group-active:scale-90 transition-transform">
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>check</span>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-transparent border-2 border-[#dee3e6] text-[#dee3e6] group-hover:border-primary/30 group-hover:text-primary transition-all flex items-center justify-center group-hover:scale-105 group-active:scale-95">
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 500" }}>add</span>
                          </div>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12 pt-8 border-t border-[#f1f4f5] flex items-center justify-between">
        <div className="flex items-center gap-8 text-[11px] text-[#5a6062] font-black uppercase tracking-widest">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-primary shadow-sm ring-4 ring-primary/5"></div>
            <span>High Correlation</span>
          </div>
          <div className="flex items-center gap-3 opacity-40">
            <div className="w-4 h-4 rounded border-2 border-[#dee3e6]"></div>
            <span>No Mapping</span>
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            disabled={isLocked}
            onClick={() => {
              if (confirm("Are you sure you want to clear all mappings? This cannot be undone.")) {
                onClearAll();
              }
            }}
            className="px-8 py-3 rounded-xl text-[#5a6062] font-black hover:bg-[#f1f4f5] transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            Clear All
          </button>
          {/* Validation Check button removed - logic moved to Continue button */}
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
