"use client";

import React from 'react';
import { X, Send, AlertCircle, CheckCircle2, Loader2, Sparkles, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface ConfirmReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (status: 'APPROVED' | 'REVISION_REQUESTED', notes: { material: string; session: string; assessment: string }) => void;
    isSubmitting: boolean;
    taskTitle: string;
    reviews: {
        syllabus: { status: string; note: string };
        materials: { status: string; note: string };
        sessions: { status: string; note: string };
        assessments: { status: string; note: string };
    };
    evaluations: {
        materials: Record<string, any>;
        sessions: Record<string, any>;
        assessments: Record<string, any>;
    };
}

export function ConfirmReviewModal({ isOpen, onClose, onConfirm, isSubmitting, taskTitle, reviews, evaluations }: ConfirmReviewModalProps) {
    // Determine automatic status based on individual evaluations
    const allMaterialsAccepted = Object.values(evaluations?.materials || {}).every(m => m.status === 'ACCEPTED');
    const allSessionsAccepted = Object.values(evaluations?.sessions || {}).every(s => s.status === 'ACCEPTED');
    const allAssessmentsAccepted = Object.values(evaluations?.assessments || {}).every(a => a.status === 'ACCEPTED');
    
    const hasRejections = 
        Object.values(evaluations?.materials || {}).some(m => m.status === 'REJECTED') ||
        Object.values(evaluations?.sessions || {}).some(s => s.status === 'REJECTED') ||
        Object.values(evaluations?.assessments || {}).some(a => a.status === 'REJECTED') ||
        reviews?.materials?.status === 'FAIL' ||
        reviews?.sessions?.status === 'FAIL' ||
        reviews?.assessments?.status === 'FAIL' ||
        reviews?.syllabus?.status === 'FAIL';

    const status: 'APPROVED' | 'REVISION_REQUESTED' = hasRejections 
        ? 'REVISION_REQUESTED' 
        : 'APPROVED';

    const getAggregatedNotes = (type: 'materials' | 'sessions' | 'assessments') => {
        const evs = Object.values(evaluations?.[type] || {});
        const rejections = evs.filter(e => e.status === 'REJECTED');
        
        if (rejections.length > 0) {
            return `Issues identified in ${type}: ` + 
                rejections.map(r => `${r.title || r.sessionTitle || r.categoryName || 'Item'}: ${r.note || 'No reason provided'}`).join('; ');
        }
        
        return reviews?.[type]?.note || `All ${type} items were reviewed and accepted.`;
    };

    const handleConfirm = () => {
        onConfirm(status, {
            material: getAggregatedNotes('materials'),
            session: getAggregatedNotes('sessions'),
            assessment: getAggregatedNotes('assessments')
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border border-white/20 flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-8 pb-4 border-b border-[#dee1d8] flex items-center justify-between bg-[#f8faf2]/50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles size={16} className="text-primary-500" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary-500">Supervisor Submission Review</p>
                        </div>
                        <h2 className="text-2xl font-black text-[#2d342b] tracking-tight uppercase" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Final Audit Consolidation
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
                    
                    {/* Status Banner */}
                    <div className={`p-6 rounded-[32px] flex items-center justify-between border-2 ${
                        status === 'APPROVED' ? 'bg-[#eaffe2] border-primary-500/30' : 'bg-[#fdf8f8] border-rose-100'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                status === 'APPROVED' ? 'bg-primary-500 text-white' : 'bg-slate-700 text-white'
                            }`}>
                                {status === 'APPROVED' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-0.5">Calculated Final Status</p>
                                <h3 className={`text-xl font-black tracking-tight ${
                                    status === 'APPROVED' ? 'text-green-800' : 'text-slate-800'
                                }`}>
                                    {status === 'APPROVED' ? 'APPROVED' : 'REVISION REQUESTED'}
                                </h3>
                            </div>
                        </div>
                        <div className="text-right">
                             <p className="text-[9px] font-bold text-[#5a6157] opacity-60 uppercase mb-1">Items Reviewed</p>
                             <div className="flex items-center gap-1">
                                 <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                 <span className="text-xs font-black text-[#2d342b]">Ready for Supervisor</span>
                             </div>
                        </div>
                    </div>

                    {/* Section 1: Materials Breakdown */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <p className="text-[12px] font-black uppercase tracking-tight text-[#2d342b]">1. Material Evaluation Breakdown</p>
                                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-[8px] font-black uppercase text-[#5a6157]">Individual Review</span>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            {Object.entries(evaluations?.materials || {}).map(([id, ev]: [string, any]) => (
                                <div key={id} className="p-4 rounded-2xl bg-[#f8faf2] border border-[#dee1d8] flex items-start gap-4 transition-all hover:border-primary-500/30">
                                    <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                        ev.status === 'ACCEPTED' ? 'bg-primary-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                        {ev.status === 'ACCEPTED' ? <CheckCircle2 size={14} /> : <X size={14} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-[13px] font-bold text-[#2d342b] truncate">{ev.materialName || ev.title || `Material ${id.slice(0, 4)}`}</p>
                                            <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                                ev.status === 'ACCEPTED' ? 'text-primary-600' : 'text-red-600'
                                            }`}>
                                                {ev.status}
                                            </span>
                                        </div>
                                        {ev.status !== 'ACCEPTED' && ev.note && (
                                            <p className="text-[11px] text-red-700 bg-red-50/50 p-2 rounded-xl border border-red-100 mt-2 font-medium leading-relaxed">
                                                {ev.note}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {(!evaluations?.materials || Object.keys(evaluations.materials).length === 0) && (
                                <p className="text-xs text-gray-400 italic font-medium p-4 text-center border-2 border-dashed border-gray-100 rounded-2xl">No materials evaluated yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Section 2: Sections Summary */}
                    <div className="grid grid-cols-2 gap-6">
                        {/* Session */}
                        <div className="space-y-4">
                            <p className="text-[12px] font-black uppercase tracking-tight text-[#2d342b]">2. Session Audit</p>
                            <div className={`p-5 rounded-3xl border-2 transition-all min-h-[100px] ${
                                reviews?.sessions?.status === 'PASS' ? 'bg-[#eaffe2] border-primary-500/30' : 'bg-red-50 border-red-200'
                            }`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                        reviews?.sessions?.status === 'PASS' ? 'bg-primary-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                        {reviews?.sessions?.status === 'PASS' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    </div>
                                    <p className="text-[11px] font-black text-[#2d342b] uppercase tracking-tight">Full Session Set</p>
                                </div>
                                {reviews?.sessions?.status !== 'PASS' && reviews?.sessions?.note ? (
                                    <p className="text-[11px] text-red-700 font-medium leading-tight">{reviews.sessions.note}</p>
                                ) : reviews?.sessions?.status === 'PASS' ? (
                                    <p className="text-[11px] text-green-700 font-medium">All sessions are accurately scheduled and distributed.</p>
                                ) : (
                                    <p className="text-[11px] text-gray-400 italic">No summary provided.</p>
                                )}
                            </div>
                        </div>

                        {/* Assessment */}
                        <div className="space-y-4">
                            <p className="text-[12px] font-black uppercase tracking-tight text-[#2d342b]">3. Assessment Audit</p>
                            <div className={`p-5 rounded-3xl border-2 transition-all min-h-[100px] ${
                                reviews?.assessments?.status === 'PASS' ? 'bg-[#eaffe2] border-primary-500/30' : 'bg-red-50 border-red-200'
                            }`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                                        reviews?.assessments?.status === 'PASS' ? 'bg-primary-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                        {reviews?.assessments?.status === 'PASS' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                    </div>
                                    <p className="text-[11px] font-black text-[#2d342b] uppercase tracking-tight">Full Assessment Set</p>
                                </div>
                                {reviews?.assessments?.status !== 'PASS' && reviews?.assessments?.note ? (
                                    <p className="text-[11px] text-red-700 font-medium leading-tight">{reviews.assessments.note}</p>
                                ) : reviews?.assessments?.status === 'PASS' ? (
                                    <p className="text-[11px] text-green-700 font-medium">Assessment types and weights are correctly configured.</p>
                                ) : (
                                    <p className="text-[11px] text-gray-400 italic">No summary provided.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-[#dee1d8] bg-[#f8faf2]/50 flex items-center justify-between gap-4">
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-8 py-4 text-[#5a6157] hover:text-[#2d342b] rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all bg-white border border-[#dee1d8] hover:border-[#5a6157] active:scale-95"
                    >
                        Back to Workspace
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className={`px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 ${
                            isSubmitting
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
                            : 'bg-primary-500 text-white hover:bg-primary-600 hover:-translate-y-1'
                        }`}
                        style={(!isSubmitting) ? {
                            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                            boxShadow: '0 12px 36px rgba(76,175,80,0.3)',
                        } : {}}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" /> Submitting Final Verdict...
                            </>
                        ) : (
                            <>
                                Yes, Agree & Submit to Supervisor <Send size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
