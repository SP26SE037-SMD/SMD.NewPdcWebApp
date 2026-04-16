"use client";

import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, MessageSquare, Info, ThumbsUp, ThumbsDown, AlertTriangle } from 'lucide-react';
import { ReviewStatus, SectionReview } from '../ReviewContext';

interface SectionReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (review: SectionReview) => void;
    initialReview: SectionReview;
    sectionName: string;
}

export function SectionReviewModal({ isOpen, onClose, onSave, initialReview, sectionName }: SectionReviewModalProps) {
    const [status, setStatus] = useState<ReviewStatus>(initialReview.status);
    const [note, setNote] = useState(initialReview.note);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ status, note });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[40px] w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-[#f8faf9]">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg">
                            <span className="material-symbols-outlined text-[24px]">rate_review</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[#2d342b]">Review {sectionName}</h2>
                            <p className="text-[10px] font-black text-[#5a6157] uppercase tracking-widest">Granular Audit Feedback</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#5a6157] uppercase tracking-widest flex items-center gap-2">
                           <Info size={14} className="text-primary-500" /> Select Verdict
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setStatus('PASS')}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                    status === 'PASS' ? 'bg-green-50 border-primary-500 text-primary-500' : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'PASS' ? 'bg-primary-500 text-white' : 'bg-white text-gray-400'}`}>
                                    <ThumbsUp size={18} />
                                </div>
                                <span className="text-sm font-bold">Pass</span>
                            </button>

                            <button 
                                onClick={() => setStatus('FAIL')}
                                className={`p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                    status === 'FAIL' ? 'bg-red-50 border-red-500 text-red-500' : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'FAIL' ? 'bg-red-500 text-white' : 'bg-white text-gray-400'}`}>
                                    <ThumbsDown size={18} />
                                </div>
                                <span className="text-sm font-bold">Fail</span>
                            </button>

                            <button 
                                onClick={() => setStatus('NEEDS_IMPROVEMENT')}
                                className={`col-span-2 p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                                    status === 'NEEDS_IMPROVEMENT' ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                                }`}
                            >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'NEEDS_IMPROVEMENT' ? 'bg-orange-500 text-white' : 'bg-white text-gray-400'}`}>
                                    <AlertTriangle size={18} />
                                </div>
                                <span className="text-sm font-bold">Needs Improvement</span>
                            </button>
                        </div>
                    </div>

                    {/* Note Input */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-[#5a6157] uppercase tracking-widest flex items-center gap-2">
                           <MessageSquare size={14} className="text-primary-500" /> Reviewer Notes
                        </label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Provide specific feedback for this section..."
                            className="w-full min-h-[150px] p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl text-sm font-medium focus:border-primary-500 focus:bg-white outline-none transition-all resize-none"
                        />
                    </div>

                    <button 
                        onClick={handleSave}
                        className="w-full py-4 bg-[#1e293b] hover:bg-primary-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
                    >
                        Save Evaluation
                    </button>
                </div>
            </div>
        </div>
    );
}
