"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import {
  Signature,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  Zap,
  LayoutGrid,
  History,
  Loader2,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";
import ActivityHeatmap from "./ActivityHeatmap";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MajorService } from "@/services/major.service";

// Mock Data for the Heatmap
const heatmapData = [
  { 
    date: "2024-03-14", 
    count: 3, 
    details: [
        { subjectCode: "SWE302", curriculum: "SE_K18", major: "Software Engineering" },
        { subjectCode: "PRN231", curriculum: "SE_K18", major: "Software Engineering" },
        { subjectCode: "LAB211", curriculum: "AI_K19", major: "AI & Data Science" }
    ]
  },
  { 
    date: "2024-03-12", 
    count: 1, 
    details: [
        { subjectCode: "CSD201", curriculum: "SE_K18", major: "Software Engineering" }
    ]
  },
  { 
    date: "2024-03-10", 
    count: 2, 
    details: [
        { subjectCode: "IOT102", curriculum: "IT_K17", major: "Information Technology" },
        { subjectCode: "MKT101", curriculum: "GBL_K18", major: "Global Business" }
    ]
  },
  // Add more mock nodes for density
  { date: "2024-01-15", count: 2, details: [] },
  { date: "2024-02-20", count: 3, details: [] },
  { date: "2023-12-05", count: 1, details: [] },
  { date: "2024-03-01", count: 2, details: [] },
];

const enactmentQueue = [
  { title: "K18 Framework Approval", ref: "SE_K18", time: "2h ago", initiator: "HoCFDC" },
  { title: "Syllabus Re-Enactment", ref: "PRN231", time: "5h ago", initiator: "HoPDC" },
  { title: "Elective Chaining Audit", ref: "AI_K19", time: "1d ago", initiator: "Quality Assurance" },
];

const bottleneckItems = [
  { name: "Global Business K17", status: "DRAFT", daysOpen: 45, major: "Global Business" },
  { name: "Multimedia Design K18", status: "DRAFT", daysOpen: 32, major: "Design" },
  { name: "Cyber Security K18", status: "DRAFT", daysOpen: 18, major: "IT Security" },
];

export default function VPDashboardContent() {
  const { user } = useSelector((state: RootState) => state.auth);

  // Fetch Draft Majors for Strategic Setup
  const { data: draftMajorsResponse, isLoading: isLoadingDrafts } = useQuery({
    queryKey: ['majors', 'draft'],
    queryFn: () => MajorService.getMajors({ status: 'DRAFT', size: 100 })
  });

  const draftMajors = draftMajorsResponse?.data?.content || [];

  if (!user) return null;

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto">
      {/* 1. Academic Health Metrics (Header) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.2em]">
                <ShieldCheck size={14} />
                Institutional Oversight
            </div>
            <h1 className="text-4xl font-black text-zinc-900 tracking-tight">VP Executive Hub.</h1>
            <p className="text-zinc-500 font-medium max-w-lg">Monitoring academic velocity and ensuring cross-major strategic alignment.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-900 text-white p-6 rounded-2xl space-y-3 min-w-[200px] shadow-xl shadow-zinc-200">
                <div className="flex justify-between items-start">
                    <LayoutGrid size={20} className="text-primary" />
                    <span className="text-xs font-black opacity-40 uppercase">Completion</span>
                </div>
                <div>
                    <h3 className="text-2xl font-black">84%</h3>
                    <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Major Frameworks Published</p>
                </div>
            </div>
            <div className="bg-white border border-zinc-100 p-6 rounded-2xl space-y-3 min-w-[200px] shadow-sm">
                <div className="flex justify-between items-start">
                    <Zap size={20} className="text-amber-500" />
                    <span className="text-xs font-black text-zinc-300 uppercase">Velocity</span>
                </div>
                <div>
                    <h3 className="text-2xl font-black text-zinc-900">+12.4%</h3>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">MoM Enactment Rate</p>
                </div>
            </div>
        </div>
      </div>

      {/* 2. Actionable Approval Center & Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Heatmap & Enactment */}
        <div className="lg:col-span-8 space-y-8">
            {/* Heatmap Section */}
            <ActivityHeatmap data={heatmapData} title="Syllabus Creation Velocity" />

            {/* Enactment Queue */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900">Enactment Queue</h2>
                    <Link href="/dashboard/vice-principal/digital-enactment" className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Process All</Link>
                </div>
                <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm divide-y divide-zinc-50">
                    {enactmentQueue.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-5 first:pt-0 last:pb-0 group">
                            <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <Signature size={20} />
                                </div>
                                <div>
                                    <h4 className="text-base font-bold text-zinc-900">{item.title}</h4>
                                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                        Ref: {item.ref} <span className="opacity-30">•</span> {item.time} BY {item.initiator}
                                    </p>
                                </div>
                            </div>
                            <button className="px-5 py-2 bg-zinc-900 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-primary transition-all active:scale-95">
                                Sign
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Right Column: Strategic Setup & Bottlenecks */}
        <div className="lg:col-span-4 space-y-8">
            {/* Strategic Setup Required */}
            <div className="space-y-6">
                <div className="flex items-center gap-2">
                    <AlertCircle size={18} className="text-rose-500" />
                    <h2 className="text-lg font-bold text-zinc-900">Strategic Setup</h2>
                </div>
                <div className="bg-rose-50/50 border border-rose-100/50 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-black text-rose-600/60 uppercase tracking-[0.2em]">Draft Majors ({draftMajors.length})</p>
                        {isLoadingDrafts && <Loader2 size={12} className="animate-spin text-rose-400" />}
                    </div>
                    
                    {/* Fixed Size Scrollbar Section */}
                    <div className="max-h-[320px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {draftMajors.length > 0 ? (
                            draftMajors.map((major) => (
                                <Link 
                                    key={major.majorId} 
                                    href={`/dashboard/vice-principal/manage-majors/${major.majorCode}`}
                                    className="flex items-center justify-between p-4 bg-white rounded-2xl border border-rose-100 shadow-sm group hover:shadow-md hover:border-rose-200 transition-all cursor-pointer"
                                >
                                    <div className="space-y-1">
                                        <span className="text-sm font-black text-zinc-900">{major.majorName}</span>
                                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{major.majorCode}</p>
                                    </div>
                                    <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                        <ArrowUpRight size={14} />
                                    </div>
                                </Link>
                            ))
                        ) : !isLoadingDrafts ? (
                            <div className="py-12 text-center space-y-2 opacity-40">
                                <ShieldCheck size={24} className="mx-auto text-rose-200" />
                                <p className="text-xs font-black uppercase tracking-widest">All Strategically Aligned</p>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Bottleneck Detector */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-900">Bottleneck Audit</h2>
                    <History size={16} className="text-zinc-300" />
                </div>
                <div className="bg-white border border-zinc-100 rounded-2xl p-7 shadow-sm divide-y divide-zinc-50">
                    {bottleneckItems.map((item, i) => (
                        <div key={i} className="py-4 first:pt-0 last:pb-0 space-y-2">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-black px-2 py-0.5 bg-orange-100 text-orange-600 rounded-md uppercase">{item.daysOpen} Days Stale</span>
                                <span className={`text-xs font-bold uppercase tracking-tighter ${
                                    item.status === 'PUBLISHED' ? 'text-emerald-600' :
                                    item.status === 'INTERNAL_REVIEW' ? 'text-amber-600' :
                                    item.status === 'DRAFT' ? 'text-blue-600' :
                                    item.status === 'ARCHIVED' ? 'text-rose-600' :
                                    'text-zinc-400'
                                }`}>{item.status}</span>
                            </div>
                            <div>
                                <h4 className="text-base font-bold text-zinc-900 leading-tight">{item.name}</h4>
                                <p className="text-xs font-semibold text-zinc-400">{item.major}</p>
                            </div>
                            <div className="flex items-center gap-2 pt-1 text-primary hover:underline cursor-pointer group">
                                <span className="text-xs font-black uppercase tracking-widest">Investigate</span>
                                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Quick Record Navigation */}
      <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/30 transition-colors" />
          <div className="relative z-10 space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                  <History size={24} className="text-primary" />
              </div>
              <div className="space-y-2">
                  <h3 className="text-xl font-black italic uppercase tracking-tight">Record Audit</h3>
                  <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                      Access historical digital enactments and verify cross-departmental curriculum handovers.
                  </p>
              </div>
              <Link 
                  href="/dashboard/vice-principal/digital-enactment"
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary hover:gap-3 transition-all"
              >
                  View Archive <ArrowUpRight size={14} />
              </Link>
          </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #fecdd3;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #fda4af;
        }
      `}</style>
    </div>
  );
}
