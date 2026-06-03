"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { CloPloService } from "@/services/cloplo.service";
import { CurriculumService } from "@/services/curriculum.service";
import { useRouter } from "next/navigation";

interface CloPloMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjectId: string;
  curriculum: {
    id: string;
    name: string;
    code: string;
  } | null;
  showViewCurriculumButton?: boolean;
}

export function CloPloMatrixModal({
  isOpen,
  onClose,
  subjectId,
  curriculum,
  showViewCurriculumButton = false,
}: CloPloMatrixModalProps) {
  const router = useRouter();
  const [matrixData, setMatrixData] = useState<{
    plos: any[];
    clos: any[];
    mappings: any[];
    loading: boolean;
  }>({
    plos: [],
    clos: [],
    mappings: [],
    loading: false,
  });

  useEffect(() => {
    const fetchMatrixData = async () => {
      if (!isOpen || !curriculum || !subjectId) return;
      setMatrixData((prev) => ({ ...prev, loading: true }));
      try {
        const [closRes, plosRes, mappingsRes] = await Promise.all([
          CloPloService.getSubjectClos(subjectId, 0, 100),
          CurriculumService.getPloByCurriculumId(curriculum.id),
          CloPloService.getMappingsBySubjectAndCurriculum(subjectId, curriculum.id),
        ]);

        const closList = closRes?.data?.content || [];
        const plosList = plosRes?.data?.content || [];
        const mappingsList = mappingsRes?.data || [];

        setMatrixData({
          clos: closList,
          plos: plosList,
          mappings: mappingsList,
          loading: false,
        });
      } catch (err) {
        console.error("Failed to fetch matrix data:", err);
        setMatrixData((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchMatrixData();
  }, [isOpen, curriculum, subjectId]);

  if (!isOpen || !curriculum) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md animate-in fade-in duration-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-6xl h-[85vh] rounded-[24px] border border-zinc-200 bg-white shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-8 py-6 bg-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-[16px] flex items-center justify-center bg-indigo-50 text-indigo-600 shadow-inner">
                <Layers size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                  CLO-PLO ALIGNMENT MATRIX
                </h3>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest leading-none mt-1">
                  Curriculum: {curriculum.code} — {curriculum.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {showViewCurriculumButton && (
                <button
                  onClick={() => {
                    router.push(`/dashboard/hocfdc/curriculums/${curriculum.id}`);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center gap-2 active:scale-95 animate-in fade-in duration-150"
                >
                  <Layers size={14} />
                  View Curriculum
                </button>
              )}
              <button
                onClick={onClose}
                className="h-10 w-10 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all flex items-center justify-center shadow-sm"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {matrixData.loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="animate-spin text-primary" size={36} />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Loading Matrix Relationships...
                </p>
              </div>
            ) : matrixData.clos.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-zinc-200 rounded-3xl text-center space-y-3">
                <AlertCircle size={32} className="text-zinc-300 mx-auto" />
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No CLOs Defined</p>
                <p className="text-xs text-zinc-400">This subject does not have any Course Learning Outcomes mapped.</p>
              </div>
            ) : matrixData.plos.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-zinc-200 rounded-3xl text-center space-y-3">
                <AlertCircle size={32} className="text-zinc-300 mx-auto" />
                <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest">No PLOs Defined</p>
                <p className="text-xs text-zinc-400">The selected curriculum does not have any Program Learning Outcomes defined.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <p className="text-xs text-zinc-500 font-medium italic">
                      Visualizing the mapping relationship between Course Learning Outcomes (CLOs) and Program Learning Outcomes (PLOs).
                    </p>
                  </div>
                  <div className="flex gap-4 shrink-0">
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
                      <tr className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] font-black tracking-widest text-zinc-500">
                        <th className="p-4 rounded-tl-xl w-[320px] min-w-[320px] max-w-[320px] sticky left-0 z-20 bg-zinc-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)] text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Course Learning Outcomes (CLOs)
                        </th>
                        {matrixData.plos.map((plo, idx) => (
                          <th
                            key={plo.ploId}
                            className="p-4 text-center min-w-[120px] group/header relative"
                          >
                            <span className="text-[11px] font-black uppercase tracking-widest text-primary">
                              {plo.ploCode || `PLO-${idx + 1}`}
                            </span>

                            {/* Tooltip */}
                            <div className="absolute opacity-0 invisible group-hover/header:opacity-100 group-hover/header:visible transition-all duration-300 top-full left-1/2 -translate-x-1/2 mt-2 w-[280px] bg-zinc-900 text-white text-[11px] rounded-2xl shadow-2xl p-4 z-[100] text-left pointer-events-none border border-zinc-800 backdrop-blur-sm bg-opacity-95 normal-case">
                              <p className="font-black text-emerald-400 mb-2 tracking-widest uppercase border-b border-zinc-800 pb-2 flex items-center gap-2">
                                <CheckCircle2 size={12} />
                                {plo.ploCode}
                              </p>
                              <p className="font-medium leading-relaxed text-zinc-300 text-sm whitespace-pre-wrap">
                                {plo.description}
                              </p>
                            </div>
                          </th>
                        ))}
                        <th className="p-4 bg-emerald-50/30 text-center rounded-tr-xl w-[100px]">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1d5c42]">
                            Coverage
                          </span>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {matrixData.clos.map((clo) => {
                        const supportCount = matrixData.plos.filter(
                          (plo) =>
                            matrixData.mappings.some(
                              (m) =>
                                m.cloId === clo.cloId && m.ploId === plo.ploId
                            )
                        ).length;
                        const isUnmapped = supportCount === 0;

                        return (
                          <tr
                            key={clo.cloId}
                            className={`group hover:bg-zinc-50/80 transition-colors ${
                              isUnmapped ? "bg-red-50/5" : ""
                            }`}
                          >
                            <td className="p-4 border-b border-zinc-100 sticky left-0 bg-white group-hover:bg-zinc-50/80 transition-colors z-10 w-[320px] min-w-[320px] max-w-[320px] shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                              <div className="flex flex-col gap-1 pr-2">
                                <span
                                  className={`text-[13px] font-black tracking-tight ${
                                    isUnmapped ? "text-red-600" : "text-zinc-900"
                                  }`}
                                >
                                  {clo.cloCode}
                                </span>
                                <span
                                  className={`text-xs leading-relaxed ${
                                    isUnmapped
                                      ? "text-red-400 font-medium italic"
                                      : "text-zinc-500"
                                  }`}
                                >
                                  {clo.description}
                                </span>
                              </div>
                            </td>
                            {matrixData.plos.map((plo) => {
                              const mapped = matrixData.mappings.some(
                                (m) =>
                                  m.cloId === clo.cloId && m.ploId === plo.ploId
                              );
                              return (
                                <td
                                  key={plo.ploId}
                                  className={`p-4 border-b border-zinc-100 text-center transition-all ${
                                    mapped ? "bg-emerald-50/10" : ""
                                  }`}
                                >
                                  <div className="flex items-center justify-center">
                                    <span
                                      className={`material-symbols-outlined transition-all ${
                                        mapped
                                          ? "text-primary scale-125"
                                          : "text-zinc-200"
                                      }`}
                                      style={{
                                        fontVariationSettings: mapped
                                          ? "'FILL' 1"
                                          : "'FILL' 0",
                                      }}
                                    >
                                      circle
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                            <td className="p-4 border-b border-emerald-150 bg-emerald-50/30 text-center group-hover:bg-emerald-50/50 transition-colors font-bold text-xs text-[#0b7a47]">
                              {supportCount}/{matrixData.plos.length}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    <tfoot className="bg-zinc-50/80">
                      <tr>
                        <td className="p-4 border-t border-zinc-200 text-[10px] font-black uppercase tracking-widest text-zinc-500 rounded-bl-xl sticky left-0 z-10 bg-zinc-50 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                          PLO Support Count
                        </td>
                        {matrixData.plos.map((plo) => {
                          const count = matrixData.clos.filter(
                            (clo) =>
                              matrixData.mappings.some(
                                (m) =>
                                  m.cloId === clo.cloId && m.ploId === plo.ploId
                              )
                          ).length;
                          return (
                            <td
                              key={plo.ploId}
                              className="p-4 border-t border-zinc-200 text-center"
                            >
                              <span
                                className={`text-[11px] font-black ${
                                  count === 0 ? "text-red-400" : "text-[#0b7a47]"
                                }`}
                              >
                                {count}
                              </span>
                            </td>
                          );
                        })}
                        <td className="p-4 border-t border-emerald-150 bg-emerald-50/30 text-center rounded-br-xl text-[10px] font-black text-zinc-400">
                          Total
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
