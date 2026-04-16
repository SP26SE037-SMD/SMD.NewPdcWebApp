"use client";

import React, { useState } from 'react';
import { useReview, SectionReview } from '../ReviewContext';
import { SectionReviewModal } from './SectionReviewModal';
import { AlertCircle, CheckCircle2, MessageSquare, Sparkles } from 'lucide-react';

interface SectionReviewButtonProps {
    section: 'syllabus' | 'materials' | 'sessions';
    sectionName: string;
}

export function SectionReviewButton({ section, sectionName }: SectionReviewButtonProps) {
    const { syllabusReview, materialsReview, sessionsReview, setSyllabusReview, setMaterialsReview, setSessionsReview } = useReview();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const review = section === 'syllabus' ? syllabusReview : 
                   section === 'materials' ? materialsReview : sessionsReview;

    const setReview = section === 'syllabus' ? setSyllabusReview : 
                      section === 'materials' ? setMaterialsReview : setSessionsReview;

    const handleSave = (newReview: SectionReview) => {
        setReview(newReview);
    };

    const hasReview = review.status !== 'PENDING';

    return (
        <>
            <button 
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all hover:scale-105 active:scale-95 group ${
                    hasReview 
                    ? 'bg-[#e8f5e9] border-[#4caf50]/30 text-[#4caf50] shadow-lg shadow-[#4caf50]/5 hover:border-[#4caf50]' 
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'
                }`}
            >
                {hasReview ? (
                   <>
                      <div className="w-6 h-6 rounded-lg bg-[#4caf50] text-white flex items-center justify-center shrink-0">
                         {review.status === 'PASS' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Review: {review.status.replace('_', ' ')}</span>
                   </>
                ) : (
                   <>
                      <div className="w-6 h-6 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center shrink-0 group-hover:bg-[#4caf50] group-hover:text-white transition-all">
                         <MessageSquare size={14} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Evaluate Part</span>
                   </>
                )}
            </button>

            <SectionReviewModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialReview={review}
                sectionName={sectionName}
            />
        </>
    );
}
