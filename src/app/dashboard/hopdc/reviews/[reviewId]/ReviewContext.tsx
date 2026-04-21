"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ReviewStatus = 'PENDING' | 'PASS' | 'FAIL' | 'NEEDS_IMPROVEMENT';

export interface SectionReview {
    status: ReviewStatus;
    note: string;
}

export interface MaterialEvaluation {
    materialId: string;
    title: string;
    status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
    note: string;  // only used when REJECTED
}

export interface SessionEvaluation {
    sessionId: string;
    sessionTitle: string;
    status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
    note: string;
}

export interface AssessmentEvaluation {
    assessmentId: string;
    categoryName: string;
    status: 'ACCEPTED' | 'REJECTED' | 'PENDING';
    note: string;
}

interface ReviewContextType {
    // Section-level reviews (for evaluate page summary)
    syllabusReview: SectionReview;
    materialsReview: SectionReview;
    sessionsReview: SectionReview;
    assessmentsReview: SectionReview;
    // Item-level feedbacks (legacy)
    itemFeedbacks: Record<string, string>;
    // Granular evaluations per item
    materialEvaluations: Record<string, MaterialEvaluation>;
    sessionEvaluations: Record<string, SessionEvaluation>;
    assessmentEvaluations: Record<string, AssessmentEvaluation>;
    // Setters
    setSyllabusReview: (review: SectionReview) => void;
    setMaterialsReview: (review: SectionReview) => void;
    setSessionsReview: (review: SectionReview) => void;
    setAssessmentsReview: (review: SectionReview) => void;
    setItemFeedback: (id: string, feedback: string) => void;
    setMaterialEvaluation: (id: string, evaluation: MaterialEvaluation) => void;
    setSessionEvaluation: (id: string, evaluation: SessionEvaluation) => void;
    setAssessmentEvaluation: (id: string, evaluation: AssessmentEvaluation) => void;
    isFullyReviewed: boolean;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children, reviewId }: { children: ReactNode; reviewId: string }) {
    // Helper to load from localStorage
    const loadSaved = (key: string) => {
        if (typeof window === 'undefined') return undefined;
        try {
            const saved = localStorage.getItem(key);
            if (!saved) return undefined;
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
                const record: any = {};
                parsed.forEach((item: any) => {
                    const id = item.materialId || item.sessionId || item.assessmentId;
                    if (id) record[id] = item;
                });
                return record;
            }
            return parsed;
        } catch (e) {
            console.error("Failed to load review data", e);
            return undefined;
        }
    };

    const [syllabusReview, setSyllabusReview] = useState<SectionReview>(() => loadSaved(`pdcm-review-syllabus-summary-${reviewId}`) as SectionReview || { status: 'PENDING', note: '' });
    const [materialsReview, setMaterialsReview] = useState<SectionReview>(() => loadSaved(`pdcm-review-materials-summary-${reviewId}`) as SectionReview || { status: 'PENDING', note: '' });
    const [sessionsReview, setSessionsReview] = useState<SectionReview>(() => loadSaved(`pdcm-review-sessions-summary-${reviewId}`) as SectionReview || { status: 'PENDING', note: '' });
    const [assessmentsReview, setAssessmentsReview] = useState<SectionReview>(() => loadSaved(`pdcm-review-assessments-summary-${reviewId}`) as SectionReview || { status: 'PENDING', note: '' });
    const [itemFeedbacks, setItemFeedbacks] = useState<Record<string, string>>({});

    // Initialize from local storage based on reviewId
    const [materialEvaluations, setMaterialEvaluations] = useState<Record<string, MaterialEvaluation>>(() =>
        loadSaved(`pdcm-review-materials-${reviewId}`) || {});
    const [sessionEvaluations, setSessionEvaluations] = useState<Record<string, SessionEvaluation>>(() =>
        loadSaved(`pdcm-review-sessions-${reviewId}`) || {});
    const [assessmentEvaluations, setAssessmentEvaluations] = useState<Record<string, AssessmentEvaluation>>(() =>
        loadSaved(`pdcm-review-assessments-${reviewId}`) || {});

    const setItemFeedback = (id: string, feedback: string) => {
        setItemFeedbacks(prev => ({ ...prev, [id]: feedback }));
    };

    const setMaterialEvaluation = (id: string, evaluation: MaterialEvaluation) => {
        setMaterialEvaluations(prev => ({ ...prev, [id]: evaluation }));
    };

    const setSessionEvaluation = (id: string, evaluation: SessionEvaluation) => {
        setSessionEvaluations(prev => ({ ...prev, [id]: evaluation }));
    };

    const setAssessmentEvaluation = (id: string, evaluation: AssessmentEvaluation) => {
        setAssessmentEvaluations(prev => ({ ...prev, [id]: evaluation }));
    };

    const isFullyReviewed =
        syllabusReview.status !== 'PENDING' &&
        materialsReview.status !== 'PENDING' &&
        sessionsReview.status !== 'PENDING' &&
        assessmentsReview.status !== 'PENDING';

    return (
        <ReviewContext.Provider value={{
            syllabusReview,
            materialsReview,
            sessionsReview,
            assessmentsReview,
            itemFeedbacks,
            materialEvaluations,
            sessionEvaluations,
            assessmentEvaluations,
            setSyllabusReview,
            setMaterialsReview,
            setSessionsReview,
            setAssessmentsReview,
            setItemFeedback,
            setMaterialEvaluation,
            setSessionEvaluation,
            setAssessmentEvaluation,
            isFullyReviewed
        }}>
            {children}
        </ReviewContext.Provider>
    );
}

export function useReview() {
    const context = useContext(ReviewContext);
    if (!context) {
        throw new Error('useReview must be used within a ReviewProvider');
    }
    return context;
}
