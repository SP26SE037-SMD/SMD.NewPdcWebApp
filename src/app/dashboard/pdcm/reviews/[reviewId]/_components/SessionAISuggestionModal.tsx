"use client";

import React, { useState, useEffect } from 'react';
import { X, Clock, Link2, Sparkles, ChevronUp, ChevronDown, AlertTriangle, TrendingDown, TrendingUp, Minus } from 'lucide-react';

interface SessionAISuggestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    aiResult: any;
}

export function SessionAISuggestionModal({ isOpen, onClose, aiResult }: SessionAISuggestionModalProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({ sessions: true, mapping: true });

    useEffect(() => {
        if (isOpen) setExpanded({ sessions: true, mapping: true });
    }, [isOpen]);

    if (!isOpen || !aiResult) return null;

    const SectionIcon = ({ id }: { id: string }) =>
        id === 'sessions'
            ? <Clock size={14} className="text-gray-400" />
            : <Link2 size={14} className="text-gray-400" />;

    const StatCard = ({ stat }: { stat: { label: string; value: string; type: string } }) => {
        const Icon = stat.type === 'error' ? TrendingDown : stat.type === 'ok' ? TrendingUp : Minus;
        const styles = {
            error: { bg: 'bg-amber-50 border-amber-200',    val: 'text-amber-600',    icon: 'text-amber-500',    label: 'text-amber-600'    },
            ok:    { bg: 'bg-emerald-50 border-emerald-200', val: 'text-emerald-600', icon: 'text-emerald-400', label: 'text-emerald-500' },
            info:  { bg: 'bg-gray-50 border-gray-200',    val: 'text-gray-800',    icon: 'text-gray-400',    label: 'text-gray-400'    },
        };
        const s = styles[stat.type as keyof typeof styles] || styles.info;
        return (
            <div className={`rounded-xl border px-3 py-3 flex flex-col gap-1 ${s.bg}`}>
                <div className="flex items-center justify-between">
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${s.label}`}>{stat.label}</p>
                    <Icon size={12} className={s.icon} />
                </div>
                <p className={`text-xl font-black leading-tight ${s.val}`}>{stat.value}</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-[600px] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] rounded-2xl overflow-hidden bg-white">

                {/* ── Header ── */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>

                        <h2 className="text-xl font-black text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            AI Suggestion
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 mt-1 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-3">

                    {/* Banner */}
                    <div className="relative overflow-hidden rounded-2xl p-5"
                        style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 60%, #6366f1 100%)' }}>
                        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                        <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
                        <div className="relative flex items-start gap-3">
                            <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <p className="text-white text-xs font-black uppercase tracking-widest">AI Suggestion</p>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white/80 border border-white/20">
                                        For reference only
                                    </span>
                                </div>
                                <p className="text-white/85 text-sm leading-relaxed">{aiResult.conclusion}</p>
                            </div>
                        </div>
                    </div>

                    {/* Section cards — white background */}
                    {aiResult.sections?.map((section: any) => (
                        <div key={section.id}
                            className="rounded-2xl overflow-hidden border bg-white"
                            style={{
                                borderColor: section.status === 'FAIL' ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'
                            }}
                        >
                            {/* Card header */}
                            <button
                                onClick={() => setExpanded(p => ({ ...p, [section.id]: !p[section.id] }))}
                                className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                                    section.status === 'FAIL' ? 'bg-amber-50/60 hover:bg-amber-50' : 'bg-emerald-50/40 hover:bg-emerald-50/60'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <SectionIcon id={section.id} />
                                    <p className="text-sm font-bold text-gray-800">{section.title}</p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${
                                        section.status === 'FAIL'
                                            ? 'bg-amber-100 text-amber-600 border-amber-200'
                                            : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                                    }`}>
                                        {section.status === 'FAIL' ? '⚠  Warning' : '✓  Looks good'}
                                    </span>
                                    {expanded[section.id]
                                        ? <ChevronUp size={14} className="text-gray-400" />
                                        : <ChevronDown size={14} className="text-gray-400" />
                                    }
                                </div>
                            </button>

                            {expanded[section.id] && (
                                <div className="px-5 pb-5 space-y-4 border-t border-gray-100 bg-white">

                                    {/* Stats */}
                                    {section.stats?.length > 0 && (
                                        <div className={`pt-4 grid gap-2.5 ${section.stats.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                                            {section.stats.map((s: any, i: number) => <StatCard key={i} stat={s} />)}
                                        </div>
                                    )}

                                    {/* Warnings */}
                                    {section.warnings?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Warnings</p>
                                            {section.warnings.map((w: any, i: number) => (
                                                <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3 bg-amber-50 border border-amber-200">
                                                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-800">{w.label}</p>
                                                        {w.detail && <p className="text-[11px] text-amber-700 mt-1 leading-relaxed whitespace-pre-wrap">{w.detail.replace(/\.\s*(Step \d+)/g, '.\n$1')}</p>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Unmapped CLOs */}
                                    {section.unmappedClos?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Unmapped CLOs <span className="text-amber-600">({section.unmappedClos.length})</span>
                                            </p>
                                            {section.unmappedClos.map((c: any, i: number) => (
                                                <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3 bg-amber-50 border border-amber-200">
                                                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">CLO</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-800">{c.code}</p>
                                                        <p className="text-[11px] text-amber-700 mt-0.5">{c.suggestion}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Unmapped Sessions */}
                                    {section.unmappedSessions?.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Unmapped Sessions <span className="text-amber-600">({section.unmappedSessions.length})</span>
                                            </p>
                                            {section.unmappedSessions.map((s: any, i: number) => (
                                                <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3 bg-amber-50 border border-amber-200">
                                                    <span className="text-[10px] font-black text-amber-600 bg-amber-100 rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">#{i + 1}</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-amber-800">{s.title}</p>
                                                        <p className="text-[11px] text-amber-700 mt-0.5">{s.suggestion}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Footer ── */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end shrink-0">
                    <button onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all shadow-md shadow-indigo-200">
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
}
