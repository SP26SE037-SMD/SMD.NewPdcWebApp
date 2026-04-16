"use client";

import React from 'react';
import { X, Clock, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MappingService } from '@/services/mapping.service';
import { CloPloService } from '@/services/cloplo.service';

interface SessionItem {
    session: string; // The UUID from API
    sessionId?: string; // Fallback
    sessionNumber: number;
    sessionTitle: string;
    teachingMethods?: string;
    duration: number;
    description?: string;
    content?: string;
    material?: any[];
    block?: any[];
}

interface SessionDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    session: SessionItem | null;
    subjectId?: string;
}

export function SessionDetailModal({ isOpen, onClose, session, subjectId }: SessionDetailModalProps) {
    const sessionId = session?.session || session?.sessionId || "";

    const { data: mappingRes, isLoading: isMappingLoading } = useQuery({
        queryKey: ['session-mappings', sessionId],
        queryFn: () => MappingService.getSessionMappings(sessionId),
        enabled: !!isOpen && !!sessionId,
    });

    const { data: subjectClosRes, isLoading: isClosLoading } = useQuery({
        queryKey: ['subject-clos', subjectId],
        queryFn: () => CloPloService.getSubjectClos(subjectId!, 0, 100),
        enabled: !!isOpen && !!subjectId,
    });

    if (!isOpen || !session) return null;

    const mappings = mappingRes?.data || [];
    const subjectClos = subjectClosRes?.data?.content || [];

    // Parse content summary
    let contentParts: Array<{ heading: string; detail: string }> = [];

    // Priority 1: New API structure with material and block arrays
    if (Array.isArray(session.material) && session.material.length > 0) {
        contentParts = session.material.map((mat: any) => {
            const blocksForMat = Array.isArray(session.block)
                ? session.block
                    .map((b: any) => ({ content: b.content || b.blockName || 'Value', idx: b.idx }))
                    .sort((a: any, b: any) => (a.idx ?? 0) - (b.idx ?? 0))
                : [];

            return {
                heading: mat.materialName || 'Chapter',
                detail: blocksForMat.map(b => b.content).join('\n') || 'Selected'
            };
        });
    }
    // Priority 2: Fallback to single block list if no material but blocks exist
    else if (Array.isArray(session.block) && session.block.length > 0) {
        contentParts = [{
            heading: 'Session Content',
            detail: session.block
                .sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
                .map(b => b.content || b.blockName)
                .join('\n')
        }];
    }
    // Priority 3: Legacy JSON content field
    else if (session.content) {
        try {
            const parsed = JSON.parse(session.content);
            if (Array.isArray(parsed)) {
                contentParts = parsed.map((item: any) => ({
                    heading: item.materialTitle || 'Section',
                    detail: (item.blockNames && item.blockNames.length > 0)
                        ? item.blockNames.join(', ')
                        : (item.blockName || 'Selected')
                }));
            }
        } catch {
            if (session.content.trim()) {
                contentParts = [{ heading: 'Content', detail: session.content.substring(0, 500) }];
            }
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-slate-200">
                {/* Header */}
                <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-widest uppercase">
                                Read Only
                            </span>
                            <h2 className="text-2xl font-bold text-slate-900">
                                Session {String(session.sessionNumber).padStart(2, '0')}
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{session.sessionTitle || 'Session Details'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors group">
                        <X size={20} className="text-slate-400 group-hover:text-slate-600" />
                    </button>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {/* Basic Info Grid - Minimalist Style */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Session No.</label>
                            <div className="text-lg font-bold text-slate-900">
                                {String(session.sessionNumber).padStart(2, '0')}
                            </div>
                        </div>
                        <div className="col-span-1 md:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Session Title</label>
                            <div className="text-lg font-bold text-slate-900 leading-tight">
                                {session.sessionTitle || 'N/A'}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Duration</label>
                            <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <Clock size={18} />
                                {session.duration || 50} mins
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 border-t border-slate-100">
                        <div className="md:col-span-3 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Teaching Method</label>
                            <div className="text-base text-slate-900 font-bold px-5 py-3 bg-slate-50 rounded-xl border border-slate-200">
                                {session.teachingMethods || 'Lecture'}
                            </div>
                        </div>
                    </div>

                    {/* Instructional Content */}
                    <section className="space-y-5">
                        <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider">
                            <div className="w-2 h-5 bg-slate-900 rounded-full"></div>
                            Instructional Content
                        </h3>
                        <div className="space-y-4">
                            {contentParts.length > 0 ? (
                                contentParts.map((part, idx) => (
                                    <div key={idx} className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
                                        <h4 className="text-sm font-black text-slate-900 uppercase mb-3 tracking-wide">{part.heading}</h4>
                                        <p className="text-base text-slate-800 leading-relaxed whitespace-pre-line font-medium">{part.detail}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-base italic text-slate-500 bg-slate-50 p-6 rounded-xl text-center border border-dashed border-slate-200">
                                    No specific content blocks assigned.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Description */}
                    {session.description && (
                        <section className="space-y-4">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider">
                                <div className="w-2 h-5 bg-slate-400 rounded-full"></div>
                                Description / Notes
                            </h3>
                            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-base text-slate-800 leading-relaxed font-medium">
                                {session.description}
                            </div>
                        </section>
                    )}

                    {/* Outcome Mapping */}
                    <section className="space-y-5 pt-6 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider">
                                <div className="w-2 h-5 bg-slate-600 rounded-full"></div>
                                Learning Outcomes (CLO)
                            </h3>
                            <span className="text-xs font-black text-slate-500 py-1.5 px-3 bg-slate-100 rounded-lg border border-slate-200">
                                {mappings.length} Linked
                            </span>
                        </div>

                        <div className="space-y-4">
                            {isMappingLoading || isClosLoading ? (
                                <div className="flex items-center gap-3 text-base text-slate-500 p-6">
                                    <Loader2 size={20} className="animate-spin" />
                                    Syncing data...
                                </div>
                            ) : mappings.length > 0 ? (
                                mappings.map((mapping: any) => {
                                    const detailedClo = subjectClos.find((c: any) => c.cloId === mapping.cloId);
                                    return (
                                        <div key={mapping.id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/80 transition-colors shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs font-black text-slate-900 bg-slate-200 px-3 py-1 rounded-md uppercase tracking-widest">
                                                    {mapping.cloCode}
                                                </span>
                                                {detailedClo?.bloomLevel && (
                                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Bloom {detailedClo.bloomLevel}</span>
                                                )}
                                            </div>
                                            <p className="text-base font-bold text-slate-900 mb-2">{mapping.cloName}</p>
                                            {detailedClo?.description && (
                                                <p className="text-sm text-slate-600 italic mt-3 border-l-3 border-slate-200 pl-4 leading-relaxed font-medium">
                                                    {detailedClo.description}
                                                </p>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-10 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                                    <p className="text-base text-slate-500 font-bold">No learning outcomes mapped to this session.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Footer */}
                <footer className="px-8 py-6 border-t border-slate-100 flex justify-end bg-slate-50/50">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 text-white text-base font-black rounded-xl hover:opacity-90 transition-opacity shadow-md"
                        style={{ backgroundColor: '#4caf50' }}
                    >
                        Close
                    </button>
                </footer>
            </div>
        </div>
    );
}
