"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { PoPloService } from "@/services/poplo.service";
import { Loader2 } from "lucide-react";

export default function MappingMatrix({
  curriculumId,
}: {
  curriculumId?: string;
}) {
  const { data: mappingRes, isLoading } = useQuery({
    queryKey: ["po-plo-mappings", curriculumId],
    queryFn: () => PoPloService.getMappingsByCurriculum(curriculumId!),
    enabled: !!curriculumId,
  });

  const mappings = mappingRes?.data || [];

  // Extract unique POs and PLOs
  const poMap = new Map();
  const ploMap = new Map();

  mappings.forEach((m: any) => {
    if (m.poId)
      poMap.set(m.poId, { id: m.poId, code: m.poCode, description: m.descriptionPo });
    if (m.ploId)
      ploMap.set(m.ploId, {
        id: m.ploId,
        code: m.ploCode,
        description: m.descriptionPlo,
      });
  });

  const pos = Array.from(poMap.values()).sort((a: any, b: any) =>
    a.code.localeCompare(b.code, undefined, { numeric: true }),
  );
  const plos = Array.from(ploMap.values()).sort((a: any, b: any) =>
    a.code.localeCompare(b.code, undefined, { numeric: true }),
  );

  const isMapped = (poId: string, ploId: string) => {
    return mappings.some((m: any) => m.poId === poId && m.ploId === ploId);
  };

  const getPloCoverage = (ploId: string) => {
    return pos.filter((po) => isMapped(po.id, ploId)).length;
  };

  const getPoSupportCount = (poId: string) => {
    return plos.filter((plo) => isMapped(poId, plo.id)).length;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Loading Matrix Architecture...
        </p>
      </div>
    );
  }

  if (pos.length === 0 || plos.length === 0) {
    return (
      <div className="p-12 border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300">
          <span className="material-symbols-outlined text-4xl">grid_off</span>
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">
            No Matrix Data Available
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            Program Objectives or Learning Outcomes have not been mapped yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0px_4px_20px_rgba(45,51,53,0.04)] overflow-hidden flex flex-col gap-6 border border-zinc-200">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[var(--primary)] text-2xl">grid_on</span>
              Matrix Alignment
            </h3>
            <p className="text-xs text-zinc-500 font-medium italic">
              Visualizing the relationship between Program Objectives and Learning Outcomes.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                circle
              </span>
              <span className="text-xs font-bold text-zinc-600">Mapped</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-zinc-200 text-sm">circle</span>
              <span className="text-xs font-bold text-zinc-600">Unmapped</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="p-4 bg-zinc-50 border-b border-zinc-200 text-xs font-bold text-zinc-600 rounded-tl-xl w-[280px] sticky left-0 z-20">
                  Program Learning Outcomes
                </th>
                {pos.map((po, idx) => (
                  <th
                    key={po.id}
                    className="p-4 bg-zinc-50 border-b border-zinc-200 text-center min-w-[120px] group/header relative"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {po.code || `PO-${idx + 1}`}
                    </span>
                    <div className="absolute opacity-0 invisible group-hover/header:opacity-100 group-hover/header:visible transition-all duration-300 top-full left-1/2 -translate-x-1/2 mt-2 w-[240px] bg-zinc-900 text-white text-[10px] rounded-xl shadow-2xl p-4 z-[100] text-left pointer-events-none border border-zinc-800">
                      <p className="font-black text-indigo-400 mb-1 tracking-widest uppercase border-b border-zinc-800 pb-2">
                        {po.code}
                      </p>
                      <p className="font-medium leading-relaxed mt-2 text-zinc-300 line-clamp-4">
                        {po.description}
                      </p>
                    </div>
                  </th>
                ))}
                <th className="p-4 bg-[#f8faf8] border-b border-[#e1ede3] text-center rounded-tr-xl">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">
                    Coverage
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {plos.map((plo) => {
                const coverage = getPloCoverage(plo.id);
                const isUnmapped = coverage === 0;
                return (
                  <tr
                    key={plo.id}
                    className={`group hover:bg-zinc-50 transition-colors font-medium ${
                      isUnmapped ? "bg-red-50/10" : ""
                    }`}
                  >
                    <td className="p-4 border-b border-zinc-100 sticky left-0 bg-white group-hover:bg-zinc-50 transition-colors z-10 w-[280px]">
                      <div className="flex flex-col gap-1">
                        <span className={`font-bold text-sm ${isUnmapped ? "text-red-600" : "text-zinc-900"}`}>
                          {plo.code || "PLO-XX"}
                        </span>
                        <span className={`text-xs line-clamp-2 leading-relaxed ${isUnmapped ? "text-red-400 font-bold" : "text-zinc-500"}`}>
                          {plo.description}
                        </span>
                      </div>
                    </td>
                    {pos.map((po) => {
                      const mapped = isMapped(po.id, plo.id);
                      return (
                        <td
                          key={po.id}
                          className={`p-4 border-b border-zinc-100 text-center transition-all ${
                            mapped ? "bg-indigo-50/10" : ""
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined transition-all ${
                              mapped ? "text-primary scale-125" : "text-zinc-200"
                            }`}
                            style={{ fontVariationSettings: mapped ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            circle
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-4 border-b border-[#e1ede3] bg-[#f8faf8] text-center group-hover:bg-[#f0f5f1] transition-colors">
                      <span className={`text-xs font-black ${isUnmapped ? "text-red-500" : "text-primary"}`}>
                        {coverage}/{pos.length}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="p-4 bg-zinc-50 border-t border-zinc-200 text-xs font-black uppercase tracking-widest text-zinc-500 rounded-bl-xl sticky left-0 z-10">
                  PO Support Count
                </td>
                {pos.map((po) => {
                  const supportCount = getPoSupportCount(po.id);
                  return (
                    <td key={po.id} className="p-4 bg-zinc-50 border-t border-zinc-200 text-center">
                      <span
                        className={`text-[10px] font-black ${
                          supportCount === 0 ? "text-red-400" : "text-primary"
                        }`}
                      >
                        {supportCount}
                      </span>
                    </td>
                  );
                })}
                <td className="p-4 bg-[#f8faf8] border-t border-[#e1ede3] text-center rounded-br-xl">
                  <span className="text-[10px] font-bold text-zinc-500">Total</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
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
