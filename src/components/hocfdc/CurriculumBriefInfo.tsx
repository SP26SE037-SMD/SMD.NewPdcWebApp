"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CurriculumService } from "@/services/curriculum.service";
import {
  Loader2,
  FileText,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Tag,
  ShieldCheck,
} from "lucide-react";

export default function CurriculumBriefInfo({
  id,
  isEmbedded,
}: {
  id: string;
  isEmbedded?: boolean;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["curriculum-details", id],
    queryFn: () => CurriculumService.getCurriculumById(id),
    enabled: !!id,
  });

  const curriculum = data?.data;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">
          Syncing Academic Records...
        </p>
      </div>
    );
  }

  if (!curriculum) return null;

  return (
    <div
      className={`w-full max-w-7xl mx-auto ${isEmbedded ? "" : "py-10"} px-20`}
    >
      <div className="grid grid-cols-12 gap-8 pt-10">
        {/* Main Info Card */}
        <section className="col-span-12 space-y-8">
          <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-[0px_20px_50px_rgba(0,0,0,0.03)] border border-zinc-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary-50 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none group-hover:bg-primary-100 transition-colors duration-700" />

            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center shadow-inner">
                <FileEdit className="text-primary-600" size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">
                  Institutional Identity
                </h3>
                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
                  Structural Baseline
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                  <Tag size={10} /> Framework Code
                </label>
                <div className="bg-zinc-50/50 border-2 border-zinc-50 rounded-2xl py-4 px-6 font-bold text-zinc-900 shadow-sm">
                  {curriculum.curriculumCode}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                  <Layers size={10} /> Major
                </label>
                <div className="bg-zinc-50/50 border-2 border-zinc-50 rounded-2xl py-4 px-6 font-bold text-zinc-900 shadow-sm truncate">
                  {curriculum.major?.majorName ||
                    curriculum.majorName ||
                    "Standard Program"}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                  <Calendar size={10} /> Effective Date
                </label>
                <div className="bg-zinc-50/50 border-2 border-zinc-50 rounded-2xl py-4 px-6 font-bold text-zinc-900 shadow-sm">
                  {curriculum.startYear}{" "}
                  <span className="text-xs text-zinc-400">(Expected)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                  <ShieldCheck size={10} /> Governance
                </label>
                <div className="bg-zinc-50/50 border-2 border-zinc-100 border-dashed rounded-2xl py-4 px-6 font-bold text-zinc-500 shadow-sm flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />{" "}
                  Academic Board
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1 flex items-center gap-2">
                <FileText size={10} /> Strategic Description
              </label>
              <div className="w-full bg-zinc-50/50 border-2 border-zinc-50 rounded-3xl py-6 px-8 font-normal leading-relaxed shadow-sm">
                {curriculum.description ||
                  "No strategic description provided for this academic framework."}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
