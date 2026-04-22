"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MajorService } from "@/services/major.service";
import { PoService } from "@/services/po.service";
import { CurriculumService } from "@/services/curriculum.service";
import {
  Loader2,
  Target,
  ChevronLeft,
  Eye,
  PencilLine,
  AlertCircle,
  Calendar,
  BookOpen,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function HocMajorDetailContent() {
  const params = useParams();
  const router = useRouter();
  const majorIdFromParams = params.majorId as string;
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "CURRICULUMS">("OVERVIEW");

  // Major Details Query
  const {
    data: majorDetail,
    isLoading: isDetailLoading,
    error,
  } = useQuery({
    queryKey: ["major-hoc", majorIdFromParams],
    queryFn: () => MajorService.getMajorById(majorIdFromParams),
    enabled: !!majorIdFromParams,
  });

  const majorId = majorDetail?.data?.majorId;

  // POs Query
  const { data: posResponse, isLoading: isPOsLoading } = useQuery({
    queryKey: ["major-pos-hoc", majorId],
    queryFn: () => PoService.getPOsByMajorId(majorId || "", { size: 100 }),
    enabled: !!majorId,
  });

  // Curriculums Query for this Major
  const { data: curriculumResponse, isLoading: isCurriculumsLoading } = useQuery({
    queryKey: ["major-curriculums-hoc", majorId],
    queryFn: () => CurriculumService.getCurriculumsByMajorId(majorId || ""),
    enabled: !!majorId,
  });

  const major = majorDetail?.data;
  const curriculums = (curriculumResponse as any)?.data || curriculumResponse || [];

  if (isDetailLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-zinc-300">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="font-black text-xs uppercase tracking-[0.3em]">
          Accessing Program Metadata...
        </p>
      </div>
    );
  }

  if (error || !major) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-zinc-400 space-y-4">
        <AlertCircle size={48} />
        <p className="font-bold">Error retrieving major information.</p>
        <Link
          href="/dashboard/hocfdc"
          className="text-primary font-bold hover:underline"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="py-6 border-b border-zinc-100 bg-white sticky top-0 z-30">
        <div className="max-w-6xl mx-auto space-y-4">
          <Link
            href="/dashboard/hocfdc"
            className="flex items-center gap-2 text-xs font-black text-zinc-400 uppercase tracking-[0.2em] hover:text-primary transition-all group"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] px-2.5 py-1 bg-indigo-50 rounded-lg">
                  {major.majorCode}
                </span>
                <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                  {major.status?.replace("_", " ")}
                </span>
              </div>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                {major.majorName}
              </h1>
            </div>

            <div className="flex bg-zinc-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab("OVERVIEW")}
                className={`px-6 py-2.5 text-xs font-black uppercase tracking-[0.1em] rounded-lg transition-all ${
                  activeTab === "OVERVIEW"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("CURRICULUMS")}
                className={`px-6 py-2.5 text-xs font-black uppercase tracking-[0.1em] rounded-lg transition-all ${
                  activeTab === "CURRICULUMS"
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                Curriculum List
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="pt-8 max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "OVERVIEW" ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <section className="bg-zinc-50/50 border border-zinc-100 rounded-3xl p-8 space-y-6">
                <div className="space-y-3">
                  <h2 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                    Institutional Description
                  </h2>
                  <p className="text-base text-zinc-700 leading-relaxed font-medium">
                    {major.description || "Projected description pending."}
                  </p>
                </div>
              </section>

              <section className="space-y-5">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] px-2">
                  Program Objectives (POs)
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {isPOsLoading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-zinc-200" /></div>
                  ) : posResponse?.data?.content && posResponse.data.content.length > 0 ? (
                    posResponse.data.content.map((po) => (
                      <div key={po.poId} className="p-5 bg-white border border-zinc-100 rounded-2xl flex items-start gap-4 shadow-sm">
                        <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center shrink-0 border border-zinc-100/50 text-sm font-black text-zinc-400">
                          {po.poCode}
                        </div>
                        <div className="pt-1"><p className="text-sm text-zinc-700 font-medium leading-relaxed">{po.description}</p></div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 border-2 border-dashed border-zinc-100 rounded-3xl flex flex-col items-center text-center space-y-3">
                      <Target size={24} className="text-zinc-200" />
                      <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">No Objectives Synchronized</p>
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="curriculums"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                    Academic Frameworks
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    Manage version history and deployment status
                  </p>
                </div>
                <button
                  onClick={() =>
                    router.push(
                      `/dashboard/hocfdc/curriculums/new?majorCode=${major?.majorCode}`,
                    )
                  }
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-900 transition-all shadow-xl shadow-primary/20 active:scale-95 group"
                >
                  <Plus
                    size={16}
                    strokeWidth={3}
                    className="group-hover:rotate-90 transition-transform"
                  />
                  New Curriculum
                </button>
              </div>

              <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="bg-primary/[0.03] border-b border-zinc-100">
                      <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-widest text-zinc-500">Framework Code</th>
                      <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-widest text-zinc-500">Name</th>
                      <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-widest text-zinc-500">Status</th>
                      <th className="px-8 py-5 text-left text-xs font-black uppercase tracking-widest text-zinc-500">Version</th>
                      <th className="px-8 py-5 text-right text-xs font-black uppercase tracking-widest text-zinc-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {isCurriculumsLoading ? (
                      <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-zinc-200" /></td></tr>
                    ) : curriculums.length > 0 ? (
                      curriculums.map((curr: any) => (
                        <tr key={curr.curriculumId} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="px-8 py-6">
                            <span className="text-sm font-black text-primary uppercase tracking-widest">{curr.curriculumCode}</span>
                          </td>
                          <td className="px-8 py-6">
                            <h4 className="text-base font-black text-zinc-900">{curr.curriculumName || curr.frameworkName}</h4>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm border ${
                              curr.status === "PUBLISHED"
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                                : curr.status === "DRAFT"
                                ? "bg-zinc-50 text-zinc-400 border-zinc-100"
                                : curr.status === "ARCHIVED"
                                ? "bg-rose-50 text-rose-600 border-rose-100/50"
                                : curr.status?.includes("REVIEW")
                                ? "bg-amber-50 text-amber-600 border-amber-100/50"
                                : "bg-blue-50 text-blue-600 border-blue-100/50"
                            }`}>
                              {curr.status?.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-bold text-zinc-500 text-sm">{curr.version || "v1.0"}</td>
                          <td className="px-8 py-6 text-right">
                            {curr.status === "DRAFT" ? (
                              <button 
                                onClick={() => router.push(`/dashboard/hocfdc/curriculums/${curr.curriculumId}/builder`)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all shadow-lg shadow-zinc-200"
                              >
                                <PencilLine size={14} />
                                Edit Builder
                              </button>
                            ) : (
                              <button 
                                onClick={() => router.push(`/dashboard/hocfdc/curriculums/${curr.curriculumId}`)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-zinc-100 text-zinc-600 text-xs font-black uppercase tracking-widest rounded-xl hover:border-primary hover:text-primary transition-all"
                              >
                                <Eye size={14} />
                                View Detail
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-20 text-center space-y-3">
                          <BookOpen size={24} className="mx-auto text-zinc-200" />
                          <p className="text-xs font-black text-zinc-300 uppercase tracking-widest">No Frameworks Established Yet</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
