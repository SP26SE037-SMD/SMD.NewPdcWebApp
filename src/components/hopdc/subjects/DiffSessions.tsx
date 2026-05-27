"use client";

import React from 'react';
import { SessionItem } from '@/services/session.service';
import { Plus, Minus, Eye, CheckCircle2, Edit2 } from 'lucide-react';

interface DiffSessionsProps {
    sessions: { item: SessionItem | null, status: string }[];
}

export function DiffSessions({ sessions }: DiffSessionsProps) {
    if (sessions.length === 0) {
        return (
            <div className="text-center py-12 rounded-2xl" style={{ background: '#ffffff', border: '2px dashed #adb4a8' }}>
                <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-4 border border-slate-100 text-slate-300">
                    <span className="material-symbols-outlined text-[32px]">calendar_month</span>
                </div>
                <h3 className="font-bold mt-4 mb-2" style={{ color: '#5a6157', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No Sessions Found</h3>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Table Header */}
            <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-[#5a6157]/60 border-b border-[#adb4a8]/10">
                <div className="col-span-2 md:col-span-1">No.</div>
                <div className="col-span-10 md:col-span-4">Session Title</div>
                <div className="hidden md:block md:col-span-5">Session Topic</div>
                <div className="hidden md:block md:col-span-2 text-right">Status</div>
            </div>

            {/* Scrollable Sessions List Container */}
            <div className="max-h-[calc(100vh-340px)] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {sessions.map((m, index) => {
                    if (!m.item) {
                        return (
                            <div key={index} className="grid grid-cols-12 items-center px-6 py-4 bg-zinc-50/30 rounded-xl border-2 border-dashed border-zinc-200">
                                <div className="col-span-12 text-center text-xs text-zinc-300 font-medium">Empty Space</div>
                            </div>
                        );
                    }

                    const session = m.item;
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
                        bgClass = "bg-blue-50/20";
                        borderClass = "border-blue-200";
                    }

                    return (
                        <div key={index}
                            className={`grid grid-cols-12 items-start md:items-center px-6 py-4 rounded-xl transition-all group border ${bgClass} ${borderClass} relative`}
                        >
                            <div className={`col-span-2 md:col-span-1 font-black text-sm ${isRemoved ? 'text-rose-400' : isAdded ? 'text-emerald-500' : 'text-[#adb4a8]'}`}>
                                {session.sessionNumber}
                            </div>
                            
                            <div className="col-span-10 md:col-span-4 pr-4">
                                <h4 className={`text-sm font-black leading-tight uppercase tracking-tight ${isRemoved ? 'text-rose-900 line-through decoration-rose-300' : isAdded ? 'text-emerald-900' : 'text-[#2d342b]'}`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {session.sessionTitle || `Session ${session.sessionNumber}`}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5" style={{ color: '#5a6157' }}>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isAdded ? 'bg-emerald-100 text-emerald-700' : isRemoved ? 'bg-rose-100 text-rose-700' : 'bg-[#eaffe2] text-[#345a32]'}`}>
                                        {session.teachingMethods || 'Lecture'}
                                    </span>
                                    <span className={`text-[9px] font-bold ${isAdded ? 'text-emerald-600' : isRemoved ? 'text-rose-400' : 'text-slate-400'}`}>• {session.duration || 50} MIN</span>
                                </div>
                            </div>
                            
                            <div className="col-span-12 mt-3 md:mt-0 md:col-span-5 md:pr-4">
                                {session.sessionTopic ? (
                                    <p className={`text-xs md:text-sm line-clamp-3 ${isRemoved ? 'text-rose-500/80 line-through' : isAdded ? 'text-emerald-700' : 'text-[#5a6157]/80'}`}>
                                        {session.sessionTopic}
                                    </p>
                                ) : (
                                    <p className="text-xs italic" style={{ color: '#adb4a8' }}>No topic assigned yet.</p>
                                )}
                            </div>
                            
                            <div className="absolute top-4 right-4 md:static md:col-span-2 flex items-center justify-end gap-1.5">
                                {isAdded && <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Plus size={12}/> Added</span>}
                                {isRemoved && <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Minus size={12}/> Removed</span>}
                                {isModified && !isAdded && !isRemoved && <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Edit2 size={12}/> Mod</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
