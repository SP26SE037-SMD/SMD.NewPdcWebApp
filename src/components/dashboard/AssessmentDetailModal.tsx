"use client";

import React from 'react';
import { X, Clock, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MappingService } from '@/services/mapping.service';

interface AssessmentItem {
    assessmentId: string;
    categoryName?: string;
    typeName?: string;
    part?: number;
    weight?: number;
    duration?: number;
    completionCriteria?: string;
    questionType?: string;
    knowledgeSkill?: string;
    gradingGuide?: string;
    note?: string;
}

interface AssessmentDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessment: AssessmentItem | null;
}

export function AssessmentDetailModal({ isOpen, onClose, assessment }: AssessmentDetailModalProps) {
    const { data: mappingRes, isLoading: isMappingLoading } = useQuery({
        queryKey: ['assessment-mappings', assessment?.assessmentId],
        queryFn: () => MappingService.getAssessmentMappings(assessment?.assessmentId || ""),
        enabled: !!isOpen && !!assessment?.assessmentId,
    });

    if (!isOpen || !assessment) return null;

    const mappings = mappingRes?.data || [];

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-2xl flex flex-col overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-200">
                {/* Modal Header — matches develop edit modal */}
                <header className="px-8 py-6 flex justify-between items-start bg-slate-50 border-b border-slate-100">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold tracking-widest uppercase">
                                Read Only
                            </span>
                            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {assessment.categoryName || 'Assessment'} - Part {assessment.part || 1}
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Syllabus Component Details</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors group">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600">close</span>
                    </button>
                </header>

                {/* Modal Content — matches develop edit modal grid layout */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-10">
                    <div className="grid grid-cols-6 gap-x-8 gap-y-10">
                        {/* Row 1: Essential Configuration */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium">
                                {assessment.categoryName || 'N/A'}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Evaluation Type</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium">
                                {assessment.typeName || 'N/A'}
                            </div>
                        </div>
                        <div className="col-span-1 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Part #</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium text-center">
                                {assessment.part || 1}
                            </div>
                        </div>
                        <div className="col-span-1 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Weight %</label>
                            <div className="w-full bg-slate-50 border border-emerald-200 rounded-xl p-3.5 text-sm font-bold text-primary text-center">
                                {assessment.weight}%
                            </div>
                        </div>

                        {/* Row 2: Criteria & Duration */}
                        <div className="col-span-4 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Completion Criteria</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium min-h-[48px]">
                                {assessment.completionCriteria || 'No criteria provided'}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Duration (mins)</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium flex items-center gap-2">
                                <Clock size={14} className="text-primary-500" />
                                {assessment.duration || 0} min
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Question Type</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium">
                                {assessment.questionType || 'Standard'}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Knowledge / Skill</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium">
                                {assessment.knowledgeSkill || 'N/A'}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Grading Guide</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-700 font-medium">
                                {assessment.gradingGuide || 'N/A'}
                            </div>
                        </div>

                        {/* Note */}
                        <div className="col-span-6 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Note / Description</label>
                                <span className="text-[10px] text-slate-400 italic">Read only</span>
                            </div>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 font-medium leading-relaxed min-h-[100px]">
                                {assessment.note || 'No description provided.'}
                            </div>
                        </div>

                        {/* CLO Mapping Section — matches develop modal */}
                        <div className="col-span-6 space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">target</span>
                                    Outcome Mapping (CLO)
                                </label>
                                <span className="text-[10px] text-slate-400 italic">
                                    {isMappingLoading ? 'Loading...' : `${mappings.length} outcomes mapped`}
                                </span>
                            </div>

                            {isMappingLoading ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400 p-4">
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading CLOs...
                                </div>
                            ) : mappings.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {mappings.map((mapping: any) => (
                                        <div
                                            key={mapping.id}
                                            className="flex items-start gap-3 p-3 rounded-xl border text-left bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200"
                                        >
                                            <div className="mt-0.5 shrink-0 w-4 h-4 rounded border bg-emerald-500 border-emerald-500 text-white flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                                    {mapping.cloCode}
                                                </p>
                                                <p className="text-[11px] line-clamp-2 leading-relaxed text-emerald-800">
                                                    {mapping.cloName}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">assignment_late</span>
                                    <p className="text-sm text-slate-400 font-medium">No Course Learning Outcomes mapped yet.</p>
                                    <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Please check syllabus setup</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <footer className="px-8 py-6 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-end">
                        <button onClick={onClose}
                            className="bg-primary-500 text-white px-10 py-3 rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] transition-transform active:scale-95">
                            Close
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
}
