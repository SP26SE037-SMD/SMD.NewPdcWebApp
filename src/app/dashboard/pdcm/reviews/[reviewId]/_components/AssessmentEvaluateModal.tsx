"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, XCircle, AlertTriangle, BookOpen, Link2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useReview } from '../ReviewContext';
import { useToast } from '@/components/ui/Toast';

interface AssessmentEvaluateModalProps {
    isOpen: boolean;
    onClose: () => void;
    assessments: any[];
    taskId: string;
}

export function AssessmentEvaluateModal({ isOpen, onClose, taskId }: AssessmentEvaluateModalProps) {
    const { setAssessmentsReview, assessmentsReview } = useReview();
    const { showToast } = useToast();

    const [status, setStatus] = useState<'PASS' | 'FAIL' | 'PENDING'>(assessmentsReview.status as any);
    const [aiResult, setAiResult] = useState<any>(null);
    const [reviewerComment, setReviewerComment] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ assessments: true, mapping: true });

    useEffect(() => {
        if (isOpen) {
            setStatus(assessmentsReview.status as any);
            const rawNote = assessmentsReview.note || '';
            try {
                const parsed = JSON.parse(rawNote);
                if (parsed.aiResult) {
                    setAiResult(parsed.aiResult);
                    setReviewerComment(parsed.reviewerComment || '');
                } else {
                    setAiResult(null);
                    setReviewerComment(rawNote);
                }
            } catch {
                setAiResult(null);
                setReviewerComment(rawNote);
            }
        }
    }, [isOpen, assessmentsReview]);

    if (!isOpen) return null;

    const toggleSection = (id: string) =>
        setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

    const fillCommentWithAI = () => {
        if (!aiResult) return;
        
        let text = `${aiResult.conclusion}\n\n`;
        
        aiResult.sections?.forEach((section: any) => {
            if (section.status === 'FAIL' || section.warnings?.length > 0 || section.unmappedClos?.length > 0 || section.unmappedAssessments?.length > 0) {
                text += `--- ${section.title} ---\n`;
                
                section.warnings?.forEach((w: any) => {
                    text += `⚠️ Warning: ${w.label}\n`;
                    if (w.detail) text += `   ${w.detail}\n`;
                });
                
                if (section.unmappedClos?.length > 0) {
                    text += `❌ Unmapped CLOs:\n`;
                    section.unmappedClos.forEach((c: any) => {
                        text += `   - ${c.code}: ${c.suggestion}\n`;
                    });
                }
                
                if (section.unmappedAssessments?.length > 0) {
                    text += `❌ Unmapped Assessments:\n`;
                    section.unmappedAssessments.forEach((a: any, i: number) => {
                        text += `   - ${a.questionType || `Assessment ${i+1}`}: ${a.suggestion}\n`;
                    });
                }
                text += '\n';
            }
        });
        
        setReviewerComment(text.trim());
    };

    const handleSave = () => {
        if (status === 'FAIL' && !reviewerComment.trim() && !aiResult) {
            showToast("Please provide a reason for rejecting this assessment section.", "error");
            document.getElementById('assessment-reviewer-comment')?.focus();
            return;
        }

        setIsSaving(true);
        const noteToSave = aiResult
            ? JSON.stringify({ aiResult, reviewerComment })
            : reviewerComment || (status === 'PASS' ? 'All assessments accepted.' : '');

        const reviewData = { status: status as any, note: noteToSave };

        setAssessmentsReview(reviewData);
        localStorage.setItem(`pdcm-review-assessments-summary-${taskId}`, JSON.stringify(reviewData));

        setTimeout(() => { setIsSaving(false); onClose(); }, 400);
    };

    const statTypeStyle = (type: string) => ({
        wrapper: type === 'error' ? 'bg-amber-50 border-amber-200' : type === 'ok' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200',
        value: type === 'error' ? 'text-amber-600' : type === 'ok' ? 'text-emerald-600' : 'text-slate-700',
        label: 'text-gray-500',
    });

    const sectionIcon = (id: string) =>
        id === 'assessments' ? <BookOpen size={15} /> : <Link2 size={15} />;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-[600px] flex flex-col shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[92vh]">

                {/* ── Header ─────────────────────────────── */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-start justify-between shrink-0">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Sectional Audit</p>
                        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Assessment Review
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 mt-1 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all">
                        <X size={18} />
                    </button>
                </div>

                {/* ── Scrollable Body ─────────────────────── */}
                <div className="overflow-y-auto flex-1 p-6 space-y-4">

                    {/* ── AI Result Panel ──────────────────── */}
                    {aiResult ? (
                        <div className="space-y-3">

                            {/* Overall AI Banner */}
                            <div className="relative overflow-hidden rounded-2xl p-5"
                                style={{ background: 'linear-gradient(135deg, #312e81 0%, #4338ca 60%, #6366f1 100%)' }}>
                                {/* decorative blobs */}
                                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

                                <div className="relative flex items-start gap-3">
                                    <div className="bg-white/15 rounded-xl p-2.5 shrink-0">
                                        <Sparkles size={18} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <p className="text-white text-xs font-black uppercase tracking-widest">AI Suggestion</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white/80 border border-white/20">
                                                For reference only
                                            </span>
                                        </div>
                                        <p className="text-white/85 text-sm leading-relaxed">{aiResult.conclusion}</p>
                                    </div>
                                    <Sparkles size={18} className="text-white/40 shrink-0 mt-0.5" />
                                </div>
                            </div>

                            {/* Individual Sections */}
                            {aiResult.sections?.map((section: any) => (
                                <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">

                                    {/* Section Header */}
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        className={`w-full px-4 py-3 flex items-center justify-between transition-colors ${section.status === 'FAIL' ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className={`${section.status === 'FAIL' ? 'text-amber-600' : 'text-gray-400'}`}>
                                                {sectionIcon(section.id)}
                                            </span>
                                            <p className="text-sm font-bold text-gray-800">{section.title}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${section.status === 'FAIL'
                                                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                }`}>
                                                {section.status === 'FAIL' ? '⚠  Warning' : '✓  Valid'}
                                            </span>
                                            {expandedSections[section.id]
                                                ? <ChevronUp size={14} className="text-gray-400" />
                                                : <ChevronDown size={14} className="text-gray-400" />
                                            }
                                        </div>
                                    </button>

                                    {expandedSections[section.id] && (
                                        <div className="p-4 space-y-4 border-t border-gray-100">

                                            {/* Stats Grid */}
                                            {section.stats?.length > 0 && (
                                                <div className={`grid gap-2 ${section.stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
                                                    {section.stats.map((stat: any, i: number) => {
                                                        const s = statTypeStyle(stat.type);
                                                        return (
                                                            <div key={i} className={`rounded-xl border p-3 ${s.wrapper}`}>
                                                                <p className={`text-[10px] font-medium mb-1 ${s.label}`}>{stat.label}</p>
                                                                <p className={`text-base font-extrabold leading-tight ${s.value}`}>{stat.value}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* Warnings */}
                                            {section.warnings?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Warnings</p>
                                                    <div className="space-y-2">
                                                        {section.warnings.map((w: any, i: number) => (
                                                            <div key={i} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
                                                                <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-xs font-bold text-amber-800">{w.label}</p>
                                                                    {w.detail && <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">{w.detail}</p>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unmapped CLOs */}
                                            {section.unmappedClos?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                        Unmapped CLOs <span className="text-amber-600">({section.unmappedClos.length})</span>
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {section.unmappedClos.map((c: any, i: number) => (
                                                            <div key={i} className="flex items-start gap-3 border border-amber-200 rounded-xl px-3.5 py-3 bg-amber-50/50">
                                                                <span className="text-[10px] font-black text-amber-600 bg-amber-100 rounded-md px-1.5 py-0.5 mt-0.5 shrink-0 uppercase">CLO</span>
                                                                <div>
                                                                    <p className="text-xs font-bold text-amber-900">{c.code}</p>
                                                                    <p className="text-[11px] text-amber-700 mt-0.5">{c.suggestion}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unmapped Assessments */}
                                            {section.unmappedAssessments?.length > 0 && (
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                        Unmapped Assessments <span className="text-amber-600">({section.unmappedAssessments.length})</span>
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {section.unmappedAssessments.map((a: any, i: number) => (
                                                            <div key={i} className="flex items-start gap-3 border border-amber-200 rounded-xl px-3.5 py-3 bg-amber-50/50">
                                                                <span className="text-[10px] font-black text-amber-600 bg-amber-100 rounded-md px-1.5 py-0.5 mt-0.5 shrink-0">#{i + 1}</span>
                                                                <div>
                                                                    <p className="text-xs font-bold text-amber-900">{a.questionType || `Assessment ${i+1}`}</p>
                                                                    <p className="text-[11px] text-amber-700 mt-0.5">{a.suggestion}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* No AI data — show plain note if any */
                        reviewerComment && (
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Review Notes</p>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{reviewerComment}</p>
                            </div>
                        )
                    )}

                    {/* ── Reviewer Decision ────────────────── */}
                    <div className="border-t border-dashed border-gray-200 pt-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Reviewer Decision</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setStatus('PASS')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${status === 'PASS'
                                    ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-100'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${status === 'PASS' ? 'border-emerald-500' : 'border-gray-300'}`}>
                                        {status === 'PASS' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                                    </div>
                                    <p className={`text-sm font-bold ${status === 'PASS' ? 'text-emerald-700' : 'text-gray-800'}`}>Accept</p>
                                </div>
                                <p className="text-[11px] text-gray-500 pl-6">Assessment weighting meets requirements</p>
                            </button>

                            <button
                                onClick={() => setStatus('FAIL')}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${status === 'FAIL'
                                    ? 'border-rose-500 bg-rose-50 shadow-sm shadow-rose-100'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${status === 'FAIL' ? 'border-rose-500' : 'border-gray-300'}`}>
                                        {status === 'FAIL' && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                                    </div>
                                    <p className={`text-sm font-bold ${status === 'FAIL' ? 'text-rose-700' : 'text-gray-800'}`}>Reject</p>
                                </div>
                                <p className="text-[11px] text-gray-500 pl-6">Request revisions before approval</p>
                            </button>
                        </div>
                    </div>

                    {/* ── Reviewer Comment ─────────────────── */}
                    <div id="assessment-reviewer-comment">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                                {status === 'PASS' ? 'Additional Notes (Optional)' : 'Reason for Rejection *'}
                            </label>
                            {status === 'FAIL' && aiResult && (
                                <button
                                    onClick={fillCommentWithAI}
                                    className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shadow-sm uppercase tracking-wider"
                                >
                                    <Sparkles size={12} />
                                    Use AI Feedback
                                </button>
                            )}
                        </div>
                        <textarea
                            value={reviewerComment}
                            onChange={(e) => setReviewerComment(e.target.value)}
                            placeholder={status === 'PASS' ? 'Add notes if needed...' : 'Enter detailed reason for rejection...'}
                            rows={3}
                            className={`w-full p-3.5 rounded-xl border outline-none text-sm transition-all resize-none leading-relaxed ${status === 'FAIL' && !reviewerComment.trim() && !aiResult
                                ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400'
                                : 'border-gray-200 bg-gray-50/50 focus:border-gray-400 focus:bg-white'
                                }`}
                        />
                    </div>
                </div>

                {/* ── Footer ─────────────────────────────── */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={status === 'PENDING' || isSaving}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2 shadow-md ${status === 'FAIL'
                            ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                            : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200'
                            }`}
                    >
                        {isSaving ? <Loader2 size={15} className="animate-spin" /> : (status === 'FAIL' ? <XCircle size={15} /> : <CheckCircle2 size={15} />)}
                        Confirm Decision
                    </button>
                </div>
            </div>
        </div>
    );
}
