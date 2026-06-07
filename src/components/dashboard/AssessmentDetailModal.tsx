"use client";

import React from 'react';
import { X, Clock, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { MappingService } from '@/services/mapping.service';
import { CloPloService } from '@/services/cloplo.service';

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
    subjectId?: string;
}

export function AssessmentDetailModal({ isOpen, onClose, assessment, subjectId }: AssessmentDetailModalProps) {
    const { data: mappingRes, isLoading: isMappingLoading } = useQuery({
        queryKey: ['assessment-mappings', assessment?.assessmentId],
        queryFn: () => MappingService.getAssessmentMappings(assessment?.assessmentId || ""),
        enabled: !!isOpen && !!assessment?.assessmentId,
    });

    const { data: subjectClosRes, isLoading: isClosLoading } = useQuery({
        queryKey: ['subject-clos', subjectId],
        queryFn: () => CloPloService.getSubjectClos(subjectId!, 0, 100),
        enabled: !!isOpen && !!subjectId,
    });

    if (!isOpen || !assessment) return null;

    const mappings = mappingRes?.data || [];
    const subjectClos = subjectClosRes?.data?.content || [];

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
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Category</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-base text-slate-900 font-bold">
                                {assessment.categoryName || 'N/A'}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Evaluation Type</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-base text-slate-900 font-bold">
                                {assessment.typeName || 'N/A'}
                            </div>
                        </div>
                        <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Part #</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-base text-slate-900 font-bold text-center">
                                {assessment.part || 1}
                            </div>
                        </div>
                        <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Weight %</label>
                            <div className="w-full bg-slate-50 border border-emerald-200 rounded-xl px-5 py-3 text-base font-bold text-primary text-center">
                                {assessment.weight}%
                            </div>
                        </div>

                        {/* Row 2: Criteria & Duration */}
                        <div className="col-span-4 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Completion Criteria</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-base text-slate-900 font-bold min-h-[48px]">
                                {assessment.completionCriteria || 'No criteria provided'}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Duration (mins)</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-base text-slate-900 font-bold flex items-center gap-2">
                                <Clock size={16} className="text-primary-500" />
                                {assessment.duration || 0} min
                            </div>
                        </div>

                        {/* Row 3 */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Question Type</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-base text-slate-900 font-bold">
                                {assessment.questionType || 'Standard'}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Knowledge / Skill</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-base text-slate-900 font-bold">
                                {assessment.knowledgeSkill || 'N/A'}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Grading Guide</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-base text-slate-900 font-bold">
                                {assessment.gradingGuide || 'N/A'}
                            </div>
                        </div>

                        {/* Note */}
                        <div className="col-span-6 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Note / Description</label>
                                <span className="text-[10px] text-slate-400 italic">Read only</span>
                            </div>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-5 text-base text-slate-900 font-bold leading-relaxed min-h-[100px]">
                                {assessment.note || 'No description provided.'}
                            </div>
                        </div>

                        {/* CLO Mapping Section — matches develop modal */}
                        <div className="col-span-6 space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-slate-900 flex items-center gap-3 uppercase tracking-wider">
                                    <div className="w-2 h-5 bg-slate-600 rounded-full"></div>
                                    Outcome Mapping (CLO)
                                </h3>
                                <span className="text-xs font-black text-slate-500 py-1.5 px-3 bg-slate-100 rounded-lg border border-slate-200">
                                    {isMappingLoading || isClosLoading ? 'Loading...' : `${mappings.length} Linked`}
                                </span>
                            </div>

                            {isMappingLoading || isClosLoading ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400 p-4">
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading CLOs...
                                </div>
                            ) : mappings.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {mappings.map((mapping: any) => {
                                        const detailedClo = subjectClos.find((c: any) => c.cloId === mapping.cloId);
                                        return (
                                            <div
                                                key={mapping.id}
                                                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/30 hover:bg-slate-50/80 transition-colors shadow-sm"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-black text-slate-900 bg-slate-200 px-3 py-1 rounded-md uppercase tracking-widest">
                                                        {mapping.cloCode}
                                                    </span>
                                                    {detailedClo?.bloomLevel && (
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                                            Bloom {detailedClo.bloomLevel}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-base font-bold text-slate-900 mb-2">
                                                    {mapping.cloName}
                                                </p>
                                                {detailedClo?.description && detailedClo.description !== mapping.cloName && (
                                                    <p className="text-sm text-slate-600 italic mt-3 border-l-3 border-slate-200 pl-4 leading-relaxed font-medium">
                                                        {detailedClo.description}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
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
