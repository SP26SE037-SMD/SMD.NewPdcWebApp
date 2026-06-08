"use client";

import React from 'react';
import { AssessmentItem } from '@/services/assessment.service';

interface MappingValidationModalProps {
    result: any;
    assessments: AssessmentItem[];
    onClose: () => void;
}

export function MappingValidationModal({
    result,
    assessments,
    onClose,
}: MappingValidationModalProps) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div
                className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
                <div className={`p-8 border-b ${result.is_valid ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${result.is_valid ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                <span className="material-symbols-outlined text-3xl">
                                    {result.is_valid ? 'check_circle' : 'warning'}
                                </span>
                            </div>
                            <div>
                                <h3 className={`text-xl font-black ${result.is_valid ? 'text-emerald-900' : 'text-amber-900'}`}>
                                    {result.is_valid ? 'Mapping Alignment Validated' : 'Alignment Suggestions'}
                                </h3>
                                <p className={`text-sm font-medium opacity-70 ${result.is_valid ? 'text-emerald-800' : 'text-amber-800'}`}>
                                    {result.is_valid
                                        ? 'Your configuration is perfectly balanced.'
                                        : 'We found some gaps in your mapping configuration.'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full hover:bg-white/50 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-600"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {!result.is_valid ? (
                        <div className="space-y-8">
                            {/* Detailed Suggestions from 'data' array if available */}
                            {result.data?.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                        Recommended Mappings
                                    </h4>
                                    <div className="grid gap-3">
                                        {result.data.map((item: any, idx: number) => {
                                            const ass = assessments.find(a => a.assessmentId === item.assessment_id);
                                            return (
                                                <div key={idx} className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100 flex items-start gap-4 transition-all hover:bg-emerald-50/50">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-xl">link</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[10px] uppercase tracking-widest">{ass?.typeName || 'Evaluation'}</span>
                                                            <span>{ass?.categoryName || 'Assessment'} - Part {ass?.part}</span>
                                                        </p>
                                                        <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                                                            AI Validation Result. <span style={{ color: (item.confidence_score * 100) < 50 ? '#ef4444' : (item.confidence_score * 100) < 80 ? '#f59e0b' : '#10b981' }}>Confidence Score: <span className="font-bold">{(item.confidence_score * 100).toFixed(0)}%</span></span>
                                                        </p>
                                                        
                                                        {(() => {
                                                            const match = item.reasoning ? item.reasoning.match(/\[Suggested alternative: (.*?)\]/i) : null;
                                                            const suggestion = match ? match[1] : null;
                                                            const cleanReasoning = item.reasoning ? item.reasoning.replace(/\s*\[Suggested alternative: .*?\]/i, '').trim() : '';
                                                            return (
                                                                <>
                                                                    {cleanReasoning && (
                                                                        <p className="text-[11px] text-slate-500 mt-2 italic bg-white/50 p-2 rounded-lg border border-slate-100">
                                                                            "{cleanReasoning}"
                                                                        </p>
                                                                    )}
                                                                    {suggestion && (
                                                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                                                            <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                                                                            Suggested: {suggestion}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}

                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Unmapped CLOs */}
                            {result.unmapped_clos?.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">assignment_late</span>
                                        Unmapped CLOs ({result.unmapped_clos.length})
                                    </h4>
                                    <div className="grid gap-3">
                                        {result.unmapped_clos.map((item: any) => (
                                            <div key={item.clo_id} className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                                    {item.clo_code}
                                                </div>
                                                <p className="text-sm text-amber-900 font-medium leading-relaxed pt-1">
                                                    {item.suggestion}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {result.unmapped_assessments?.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">assessment</span>
                                        Unmapped Assessments ({result.unmapped_assessments.length})
                                    </h4>
                                    <div className="grid gap-3">
                                        {result.unmapped_assessments.map((item: any) => {
                                            const ass = assessments.find(a => a.assessmentId === item.assessment_id);
                                            return (
                                                <div key={item.assessment_id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-start gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 font-bold text-[10px]">
                                                        {ass?.categoryName?.substring(0, 3).toUpperCase() || 'ASS'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 mb-1">{ass?.categoryName} - Part {ass?.part}</p>
                                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                                            {item.suggestion}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            {(!result.unmapped_clos?.length && !result.unmapped_assessments?.length && !result.data?.length) && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 rounded-[32px] border border-slate-100">
                                    <div className="w-16 h-16 rounded-full bg-white text-slate-400 flex items-center justify-center mb-2 shadow-sm">
                                        <span className="material-symbols-outlined text-3xl">info</span>
                                    </div>
                                    <div className="max-w-xs px-6">
                                        <p className="text-sm font-bold text-slate-900">Validation Info</p>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                                            The validation completed with suggestions, but no specific gaps were detailed in the response. Please check the raw data below.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                                <span className="material-symbols-outlined text-5xl">verified</span>
                            </div>
                            <div className="max-w-xs">
                                <p className="text-lg font-bold text-slate-900">All Clear!</p>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    Your assessment mapping is complete and aligns with all learning outcomes. No gaps detected.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-slate-900/20 text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
