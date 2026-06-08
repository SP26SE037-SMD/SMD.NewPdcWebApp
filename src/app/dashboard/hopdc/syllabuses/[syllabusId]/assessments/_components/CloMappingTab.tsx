"use client";

import React, { useState } from 'react';
import { AssessmentItem } from '@/services/assessment.service';

interface CloMappingTabProps {
    assessments: AssessmentItem[];
    subjectClos: any[];
    mappingStates: Record<string, string[]>;
    onMappingChange: (assessmentId: string, cloIds: string[]) => void;
    validationResult?: any;
    isReadOnly?: boolean;
}

export function CloMappingTab({
    assessments,
    subjectClos,
    mappingStates,
    onMappingChange,
    validationResult,
    isReadOnly = true,
}: CloMappingTabProps) {
    const savedAssessments = assessments.filter(a => !!a.assessmentId);

    if (savedAssessments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">assignment_late</span>
                <p className="text-lg font-medium text-slate-900/60" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No saved assessments available</p>
                <p className="text-sm opacity-60 mt-1 text-center max-w-xs">You must save assessments in the Assessment List tab before you can map them to CLOs.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Assessment Component</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Type</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Weight</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mapping Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {savedAssessments.map((ass) => (
                                <MappingRow
                                    key={ass.assessmentId}
                                    assessment={ass}
                                    subjectClos={subjectClos}
                                    selectedCloIds={mappingStates[ass.assessmentId!] || []}
                                    onSelectionChange={(ids) => onMappingChange(ass.assessmentId!, ids)}
                                    validationResult={validationResult}
                                    isReadOnly={isReadOnly}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center gap-3">
                    <span className="material-symbols-outlined text-zinc-500 text-lg">info</span>
                    <p className="text-[11px] text-zinc-500 font-medium">
                        {isReadOnly ? 'This view is read-only. You cannot edit these mappings.' : 'Changes here are temporary. Please click "Save Changes" at the top to persist your mappings.'}
                    </p>
                </div>
            </div>
        </div>
    );
}

interface MappingRowProps {
    assessment: AssessmentItem;
    subjectClos: any[];
    selectedCloIds: string[];
    onSelectionChange: (ids: string[]) => void;
    validationResult?: any;
    isReadOnly?: boolean;
}

function MappingRow({
    assessment,
    subjectClos,
    selectedCloIds,
    onSelectionChange,
    validationResult,
    isReadOnly = true,
}: MappingRowProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    const suggestionsForThisAss = validationResult?.data?.filter(
        (d: any) => d.assessment_id === assessment.assessmentId && (d.confidence_score === undefined || d.confidence_score <= 0.8)
    ) || [];
    const suggestedCloCodes = suggestionsForThisAss.flatMap((d: any) => {
        const match = d.reasoning ? d.reasoning.match(/\[Suggested alternative: (.*?)\]/i) : null;
        if (match) {
            const extracted = match[1].match(/CLO\d+/gi);
            return extracted ? extracted.map((s: string) => s.toUpperCase()) : [];
        }
        return [];
    });

    return (
        <>
            <tr
                onClick={() => setIsExpanded(!isExpanded)}
                className={`transition-colors group cursor-pointer border-l-4 ${suggestionsForThisAss.length > 0 ? 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-400' : isExpanded ? 'bg-slate-50 border-transparent' : 'hover:bg-slate-50/50 border-transparent'}`}
            >
                <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-200 text-slate-600' : 'bg-primary-container text-on-primary-container'}`}>
                            <span className="material-symbols-outlined text-lg">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                        </div>
                        <span className="font-bold text-slate-900">{assessment.categoryName} - {assessment.typeName} - Part {assessment.part}</span>
                    </div>
                </td>
                <td className="px-6 py-5">
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider border border-slate-200">
                        {assessment.typeName}
                    </span>
                </td>
                <td className="px-6 py-5 font-bold text-slate-700">
                    {assessment.weight}%
                </td>
                <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1">
                        {selectedCloIds.length > 0 ? (
                            selectedCloIds.map(id => {
                                const clo = subjectClos.find(c => c.cloId === id);
                                return (
                                    <span key={id} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold border border-emerald-200">
                                        {clo?.cloCode || 'CLO'}
                                    </span>
                                );
                            })
                        ) : (
                            <span className="text-[10px] text-slate-400 italic">Not mapped yet</span>
                        )}
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr>
                    <td colSpan={4} className="px-6 py-6 bg-slate-50 border-b border-slate-200/60 animate-in slide-in-from-top-4 duration-300">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900">Select Course Learning Outcomes</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">Pick outcomes that are assessed in this component</p>
                                </div>
                                <button
                                    onClick={() => setIsExpanded(false)}
                                    className="text-xs font-bold text-slate-500 hover:text-slate-700"
                                >
                                    Close Editor
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {subjectClos.map(clo => {
                                    const isSelected = selectedCloIds.includes(clo.cloId);
                                    return (
                                        <button
                                            key={clo.cloId}
                                            disabled={isReadOnly}
                                            onClick={() => {
                                                const newIds = isSelected
                                                    ? selectedCloIds.filter(id => id !== clo.cloId)
                                                    : [...selectedCloIds, clo.cloId];
                                                onSelectionChange(newIds);
                                            }}
                                            className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all group w-full ${
                                                isReadOnly 
                                                    ? 'cursor-not-allowed opacity-80' 
                                                    : 'hover:border-emerald-200 hover:bg-emerald-50/10'
                                            } ${isSelected
                                                    ? 'bg-white border-emerald-400 ring-1 ring-emerald-100 shadow-sm'
                                                    : suggestedCloCodes.includes(clo.cloCode)
                                                        ? `bg-blue-50/30 border-blue-300 ring-1 ring-blue-100 shadow-sm ${isReadOnly ? '' : 'hover:bg-blue-50/50'}`
                                                        : 'bg-white border-slate-200'
                                                }`}
                                        >
                                            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                                                }`}>
                                                {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                                            </div>
                                            <div className="space-y-1 w-full">
                                                <div className="flex justify-between items-center w-full">
                                                    <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-700' : suggestedCloCodes.includes(clo.cloCode) ? 'text-blue-700' : 'text-slate-500'}`}>
                                                        {clo.cloCode}
                                                    </p>
                                                    {suggestedCloCodes.includes(clo.cloCode) && (
                                                        <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Suggested
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-xs leading-relaxed ${isSelected ? 'text-emerald-900' : suggestedCloCodes.includes(clo.cloCode) ? 'text-blue-800' : 'text-slate-600'}`}>
                                                    {clo.description}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}
