"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Layers, Box, Edit3 } from "lucide-react";
import { motion } from "framer-motion";

import { GroupResponse } from "@/services/group.service";

interface ElectiveDetailProps {
    elective: GroupResponse | null;
    subjects: any[]; // PagedResponseSubjectSimpleResponse content
}

export default function ElectiveDetail({ elective, subjects }: ElectiveDetailProps) {
    const router = useRouter();

    if (!elective) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
            <Box size={48} className="mb-4 opacity-20" />
            <p>Elective Group not found or failed to load.</p>
            <button onClick={() => router.push("/dashboard/hocfdc/electives")} className="mt-4 text-emerald-600 hover:underline">
                Return to Electives
            </button>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto py-10 px-8">
            <div className="flex justify-between items-start mb-10">
                <div className="flex gap-4">
                    <button
                        onClick={() => router.push("/dashboard/hocfdc/electives")}
                        className="w-10 h-10 mt-1 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-emerald-600 hover:border-emerald-600/30 transition-all shadow-sm group shrink-0"
                    >
                        <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform" size={20} />
                    </button>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/50">
                            <Layers size={12} />
                            Group Profile
                        </div>
                        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">{elective.groupName}</h1>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-emerald-600/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                {elective.type || 'ELECTIVE'}
                            </span>
                            <span className="text-sm font-medium text-zinc-500">
                                {elective.groupCode}
                            </span>
                        </div>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-zinc-200 text-zinc-600 font-bold text-xs rounded-xl hover:text-emerald-600 hover:border-emerald-600/30 transition-all shadow-sm">
                    <Edit3 size={14} /> Edit Group
                </button>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Info Panel */}
                <div className="col-span-4 space-y-6">
                    <div className="p-8 bg-white rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/20 space-y-6">
                        <div className="space-y-2">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Description</h3>
                            <p className="text-sm text-zinc-600 font-medium leading-relaxed">
                                {elective.description || "No description available for this elective group."}
                            </p>
                        </div>
                        
                        <div className="pt-6 border-t border-zinc-100 grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Candidates</p>
                                <p className="text-2xl font-black text-zinc-900">{subjects.length}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Max Credits</p>
                                <p className="text-2xl font-black text-zinc-900">
                                    {Math.max(...subjects.map(s => s.credits || 0), 0) || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modules Panel */}
                <div className="col-span-8">
                    <div className="p-8 bg-white rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/20">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-black text-zinc-900">Mapped Modules</h3>
                                <p className="text-xs text-zinc-500 font-medium whitespace-nowrap">Subjects contained within this elective pool.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {subjects.length === 0 ? (
                                <p className="text-sm text-zinc-400 italic py-4">No subjects mapped to this elective yet.</p>
                            ) : subjects.map((subject, index) => (
                                <motion.div
                                    key={subject.subjectId || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-5 rounded-2xl border border-zinc-100 hover:border-emerald-600/30 hover:bg-zinc-50/50 transition-all group flex items-start gap-4"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-600/5 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform">
                                        <Box size={18} />
                                    </div>
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-sm text-zinc-900">{subject.subjectCode}</h4>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-600/10 px-2 py-1 rounded-md">
                                                {subject.credits || 0} CR
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 font-medium">{subject.subjectName}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

