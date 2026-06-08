"use client";

import React, { useState } from 'react';
import { SessionItem } from '@/services/session.service';

interface SessionMappingTabProps {
    sessions: SessionItem[];
    subjectClos: any[];
    mappingStates: Record<string, string[]>;
    onMappingChange: (sessionId: string, cloIds: string[]) => void;
    validationResult?: any;
}

export function SessionMappingTab({
    sessions,
    subjectClos,
    mappingStates,
    onMappingChange,
    validationResult,
}: SessionMappingTabProps) {
    return (
        <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 px-8 py-5 bg-slate-50/50 border-b border-zinc-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="col-span-1">No.</div>
                <div className="col-span-4">Session Detail</div>
                <div className="col-span-6">Mapped CLOs</div>
                <div className="col-span-1 text-right">Status</div>
            </div>
            <div className="divide-y divide-zinc-50">
                {sessions.map((session, idx) => (
                    <SessionMappingRow
                        key={session.sessionId || idx}
                        session={session}
                        subjectClos={subjectClos}
                        selectedCloIds={mappingStates[session.sessionId || ''] || []}
                        onChange={(cloIds) => onMappingChange(session.sessionId || '', cloIds)}
                        validationResult={validationResult}
                    />
                ))}
            </div>
        </div>
    );
}

interface SessionMappingRowProps {
    session: SessionItem;
    subjectClos: any[];
    selectedCloIds: string[];
    onChange: (cloIds: string[]) => void;
    validationResult?: any;
}

function SessionMappingRow({
    session,
    subjectClos,
    selectedCloIds,
    onChange,
    validationResult,
}: SessionMappingRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const suggestionsForThisSession = validationResult?.data?.filter(
        (d: any) => d.session_id === session.sessionId && (d.confidence_score === undefined || d.confidence_score <= 0.8)
    ) || [];
    const suggestedCloCodes = suggestionsForThisSession.flatMap((d: any) => {
        const match = d.reasoning ? d.reasoning.match(/\[Suggested alternative: (.*?)\]/i) : null;
        if (match) {
            const extracted = match[1].match(/CLO\d+/gi);
            return extracted ? extracted.map((s: string) => s.toUpperCase()) : [];
        }
        return [];
    });
    const suggestedCloCodesStr = suggestedCloCodes.join(', ');

    return (
        <div className={`transition-all border-l-4 ${suggestionsForThisSession.length > 0 ? 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-400' : isExpanded ? 'bg-primary/5 ring-1 ring-inset ring-primary/10 border-transparent' : 'hover:bg-slate-50/50 border-transparent'}`}>
            <div
                className="grid grid-cols-12 px-8 py-5 items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="col-span-1 font-black text-slate-400">
                    {session.sessionNumber}
                </div>
                <div className="col-span-4">
                    <h4 className="text-sm font-bold text-slate-800 mb-0.5">{session.sessionTitle}</h4>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{session.teachingMethods} • {session.duration} MIN</p>
                </div>
                <div className="col-span-6 flex flex-wrap gap-1.5 items-center">
                    {selectedCloIds.length > 0 ? (
                        selectedCloIds.map(id => {
                            const clo = subjectClos.find(c => c.cloId === id);
                            return (
                                <span key={id} className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm">
                                    {clo?.cloCode || 'CLO'}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            No CLOs mapped
                        </span>
                    )}
                    {suggestedCloCodesStr && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 ml-2">
                            <span className="material-symbols-outlined text-[14px] text-amber-500">auto_awesome</span>
                            <span className="text-[10px] font-bold tracking-wide">
                                Suggested: {suggestedCloCodesStr}
                            </span>
                        </div>
                    )}
                </div>
                <div className="col-span-1 flex justify-end">
                    <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : 'text-slate-300'}`}>
                        expand_more
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-white/80 backdrop-blur-sm border border-primary/10 rounded-2xl p-6 shadow-inner">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">checklist</span>
                            Mapped Course Learning Outcomes
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {subjectClos.filter(clo => selectedCloIds.includes(clo.cloId) || suggestedCloCodes.includes(clo.cloCode)).length > 0 ? (
                                subjectClos.filter(clo => selectedCloIds.includes(clo.cloId) || suggestedCloCodes.includes(clo.cloCode)).map(clo => {
                                    const isSelected = selectedCloIds.includes(clo.cloId);
                                    const isSuggested = suggestedCloCodes.includes(clo.cloCode);

                                    return (
                                        <div
                                            key={clo.cloId}
                                            className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all group w-full
                                                ${isSelected
                                                    ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                                                    : isSuggested
                                                        ? 'border-blue-300 bg-blue-50/30 shadow-sm shadow-blue-500/5'
                                                        : 'border-slate-100 bg-slate-50/50'}`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1 w-full">
                                                    <p className={`text-xs font-black transition-colors ${isSelected ? 'text-primary' : isSuggested ? 'text-blue-700' : 'text-slate-500'}`}>
                                                        {clo.cloCode}
                                                    </p>
                                                    {isSuggested && (
                                                        <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1 shrink-0">
                                                            <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Suggested
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-[11px] font-medium leading-relaxed line-clamp-2 ${isSelected ? 'text-slate-700' : isSuggested ? 'text-blue-800' : 'text-slate-600'}`}>
                                                    {clo.description}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-1 md:col-span-2 lg:col-span-3 py-6 text-center text-slate-500 rounded-xl border border-dashed border-slate-200">
                                    <span className="material-symbols-outlined text-2xl opacity-20 mb-1">link_off</span>
                                    <p className="text-xs font-bold">No mapped or suggested CLOs</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
