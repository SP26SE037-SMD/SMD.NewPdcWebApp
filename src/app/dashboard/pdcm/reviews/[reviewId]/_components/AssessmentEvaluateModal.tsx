"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
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
    const [note, setNote] = useState(assessmentsReview.note || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStatus(assessmentsReview.status as any);
            setNote(assessmentsReview.note || '');
        }
    }, [isOpen, assessmentsReview]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (status === 'FAIL' && !note.trim()) {
            showToast("Please provide a reason for rejecting this assessment section.", "error");
            const el = document.getElementById("assessment-note-field");
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setIsSaving(true);
        const reviewData = { status: status as any, note: status === 'PASS' ? 'All assessments accepted.' : note };
        
        setAssessmentsReview(reviewData);
        localStorage.setItem(`pdcm-review-assessments-summary-${taskId}`, JSON.stringify(reviewData));

        setTimeout(() => { setIsSaving(false); onClose(); }, 400);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-300">
            <div className="bg-white rounded-xl w-full max-w-2xl flex flex-col overflow-hidden shadow-xl border border-gray-200 animate-in zoom-in-95 duration-300">

                {/* Header Section */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">Sectional Audit</p>
                        <h2 className="text-xl font-bold text-gray-900 uppercase">Assessment Review</h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 space-y-6">
                    <p className="text-sm text-gray-900 font-medium leading-relaxed">
                        Do you approve the current assessment categories and weighting for this syllabus?
                    </p>

                    {/* Radio Options */}
                    <div className="space-y-3">
                        <button
                            onClick={() => setStatus('PASS')}
                            className={`w-full p-4 rounded-lg border flex items-center gap-3 transition-all ${
                                status === 'PASS' 
                                    ? 'border-green-600 bg-green-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                status === 'PASS' ? 'border-green-600' : 'border-gray-300'
                            }`}>
                                {status === 'PASS' && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                            </div>
                            <span className={`text-sm font-semibold ${status === 'PASS' ? 'text-green-700' : 'text-gray-900'}`}>Accept Section</span>
                        </button>

                        <button
                            onClick={() => setStatus('FAIL')}
                            className={`w-full p-4 rounded-lg border flex items-center gap-3 transition-all ${
                                status === 'FAIL' 
                                    ? 'border-red-600 bg-red-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                status === 'FAIL' ? 'border-red-600' : 'border-gray-300'
                            }`}>
                                {status === 'FAIL' && <div className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                            </div>
                            <span className={`text-sm font-semibold ${status === 'FAIL' ? 'text-red-700' : 'text-gray-900'}`}>Reject Section</span>
                        </button>
                    </div>

                    {/* Feedback Area - Only show on Reject */}
                    {status === 'FAIL' && (
                        <div id="assessment-note-field" className="relative animate-in slide-in-from-top-2 duration-300">
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Reviewer Comments or Reason for Rejection..."
                                className={`w-full min-h-[160px] p-4 rounded-lg border outline-none text-sm font-normal transition-all resize-none ${
                                    !note.trim() ? 'border-rose-300 focus:border-rose-500' : 'border-gray-200 focus:border-gray-400'
                                }`}
                            />
                        </div>
                    )}
                </div>

                {/* Footer Section */}
                <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
                    <button 
                        onClick={onClose} 
                        className="px-6 py-3 rounded-lg text-sm font-bold text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={status === 'PENDING' || isSaving}
                        className="px-8 py-3 rounded-lg bg-white border border-gray-300 text-sm font-bold text-gray-700 uppercase tracking-wider hover:bg-[#4caf50] hover:text-white hover:border-[#4caf50] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2"
                    >
                        {isSaving && <Loader2 size={16} className="animate-spin" />}
                        Submit Decision
                    </button>
                </div>
            </div>
        </div>
    );
}
