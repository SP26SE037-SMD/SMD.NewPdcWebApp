"use client";

import React from 'react';
import { AssessmentItem } from '@/services/assessment.service';
import { Plus, Minus, Edit2, Scale } from 'lucide-react';

interface DiffAssessmentsProps {
    assessments: { item: AssessmentItem | null, status: string, changes?: string[] }[];
}

export function DiffAssessments({ assessments }: DiffAssessmentsProps) {
    if (assessments.length === 0) {
        return (
            <div className="text-center py-12 rounded-2xl border-2 border-dashed border-zinc-200 bg-white">
                <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-4 text-slate-300">
                    <span className="material-symbols-outlined text-[32px]">inventory_2</span>
                </div>
                <h3 className="font-bold mt-4 mb-2 text-slate-500" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No Assessments Found</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                <div className="col-span-12 md:col-span-4">Category & Part</div>
                <div className="hidden md:block md:col-span-4">Type & Weight</div>
                <div className="hidden md:block md:col-span-2">Duration</div>
                <div className="hidden md:block md:col-span-2 text-right">Status</div>
            </div>

            {/* Scrollable List Container */}
            <div className="max-h-[calc(100vh-340px)] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {assessments.map((m, index) => {
                    if (!m.item) {
                        return (
                            <div key={index} className="grid grid-cols-12 items-center px-6 py-4 bg-zinc-50/50 rounded-xl border-2 border-dashed border-zinc-200">
                                <div className="col-span-12 text-center text-xs text-zinc-400 font-medium">Empty Space</div>
                            </div>
                        );
                    }

                    const assessment = m.item;
                    const isAdded = m.status === 'ADDED';
                    const isRemoved = m.status === 'REMOVED';
                    const isModified = m.status === 'MODIFIED';

                    let bgClass = "bg-white";
                    let borderClass = "border-transparent";

                    if (isAdded) {
                        bgClass = "bg-emerald-50/40";
                        borderClass = "border-emerald-200";
                    } else if (isRemoved) {
                        bgClass = "bg-rose-50/40 opacity-70";
                        borderClass = "border-rose-200";
                    } else if (isModified) {
                        bgClass = "bg-amber-50/20";
                        borderClass = "border-amber-200";
                    }

                    return (
                        <div key={index}
                            className={`grid grid-cols-12 items-start md:items-center px-6 py-4 rounded-xl transition-all group border ${bgClass} ${borderClass} relative`}
                        >
                            <div className="col-span-12 md:col-span-4 pr-4">
                                <h4 className={`text-sm font-black leading-tight tracking-tight ${isRemoved ? 'text-rose-900 line-through decoration-rose-300' : isAdded ? 'text-emerald-900' : 'text-slate-800'}`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {assessment.categoryName} <span className="opacity-50">#</span>{assessment.part}
                                </h4>
                                <div className="mt-1.5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Criteria</span>
                                    <p className={`text-xs font-semibold line-clamp-1 ${isAdded ? 'text-emerald-800' : isRemoved ? 'text-rose-800' : 'text-slate-500'}`}>
                                        {assessment.completionCriteria || "No criteria specified"}
                                    </p>
                                </div>
                            </div>

                            <div className="col-span-12 mt-3 md:mt-0 md:col-span-4 flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${isAdded ? 'bg-emerald-100 text-emerald-700' : isRemoved ? 'bg-rose-100 text-rose-700' : isModified ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                        {assessment.typeName}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                        <Scale size={10} /> Weight:
                                    </span>
                                    <span className={`text-sm font-black ${isAdded ? 'text-emerald-600' : isRemoved ? 'text-rose-500' : isModified ? 'text-amber-600' : 'text-primary'}`}>
                                        {assessment.weight}%
                                    </span>
                                </div>
                            </div>
                            
                            <div className="col-span-12 mt-2 md:mt-0 md:col-span-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block md:hidden mb-0.5">Duration</span>
                                <span className={`text-sm font-bold ${isAdded ? 'text-emerald-700' : isRemoved ? 'text-rose-700' : 'text-slate-700'}`}>
                                    {assessment.duration} mins
                                </span>
                            </div>
                            
                            <div className="absolute top-4 right-4 md:static md:col-span-2 flex flex-col items-end justify-center gap-1.5">
                                <div className="flex items-center gap-1.5">
                                    {isAdded && <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Plus size={12}/> Added</span>}
                                    {isRemoved && <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Minus size={12}/> Removed</span>}
                                    {isModified && !isAdded && !isRemoved && <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Edit2 size={12}/> Mod</span>}
                                    {(!isAdded && !isRemoved && !isModified) && <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-black uppercase inline-flex items-center gap-1">Unchanged</span>}
                                </div>
                            </div>

                            {m.changes && m.changes.length > 0 && (
                                <div className="col-span-12 mt-3 pt-3 border-t border-amber-200/50">
                                    <ul className="list-disc list-inside text-[11px] text-amber-700/80 space-y-1 font-medium">
                                        {m.changes.map((c, i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

