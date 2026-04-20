"use client";

import React, { use, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setAssessments, addAssessment, updateAssessment, removeAssessment } from '@/store/slices/syllabusSlice';
import { Loader2 } from 'lucide-react';
import { TaskService } from '@/services/task.service';
import { AssessmentService, AssessmentItem, AssessmentCategory, AssessmentType } from '@/services/assessment.service';
import { SyllabusService } from '@/services/syllabus.service';
import { CloPloService } from '@/services/cloplo.service';
import { MappingService, CloAssessmentMapping } from '@/services/mapping.service';
// Import the same component used in tasks but adapted for pathing if needed
// Assuming AssessmentEditModal can be imported or copied. Let's define it here to be safe and independent.
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import { useRevisionRequest } from '@/hooks/useRevisionRequest';
import { ReviewerFeedback } from '@/components/dashboard/ReviewerFeedback';

const COMMON_QUESTION_TYPES = [
    "Multiple Choice", "Essay", "Practical Exam", "Oral Exam",
    "Project-based", "Presentation", "Portfolio", "Assignment", "Case Study"
];

const COMMON_KNOWLEDGE_SKILLS = [
    "Remembering", "Understanding", "Applying", "Analyzing",
    "Evaluating", "Creating", "Technical Skill", "Soft Skill", "Problem Solving"
];

export default function RevisionAssessmentsPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const dispatch = useDispatch<AppDispatch>();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | null, index: number } | null>(null);

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
    });

    const realTask = routeTaskData?.data;
    const syllabusId = realTask?.syllabus?.syllabusId;
    
    // Fetch Revision Request Data (Always enabled for this route)
    const { data: revisionRequest, isLoading: isRevisionLoading } = useRevisionRequest(taskId, true);

    const { data: syllabusData, isLoading: isSyllabusLoading } = useQuery({
        queryKey: ['syllabus', syllabusId],
        queryFn: () => SyllabusService.getSyllabusById(syllabusId!),
        enabled: !!syllabusId,
    });

    const { data: assessmentDataRes, isLoading: isAssessmentLoading, refetch: refetchAssessments } = useQuery({
        queryKey: ['assessments', syllabusId, 'REVISION_REQUESTED'],
        queryFn: () => (syllabusId ? AssessmentService.getAssessmentsBySyllabusId(syllabusId, 'REVISION_REQUESTED') : null),
        enabled: !!syllabusId,
    });

    const { data: categoriesRes } = useQuery({
        queryKey: ['assessment-categories'],
        queryFn: () => AssessmentService.getCategories(100),
    });

    const { data: typesRes } = useQuery({
        queryKey: ['assessment-types'],
        queryFn: () => AssessmentService.getTypes(100),
    });

    const ASSESSMENT_CATEGORIES = categoriesRes?.data?.content || [];
    const ASSESSMENT_TYPES = typesRes?.data?.content || [];

    const reduxAssessments = useSelector((state: RootState) => syllabusId ? state.syllabus.assessmentsDB[syllabusId] : undefined);

    useEffect(() => {
        if (assessmentDataRes?.data && Array.isArray(assessmentDataRes.data) && syllabusId) {
            dispatch(setAssessments({ syllabusId, assessments: assessmentDataRes.data }));
        } else if (assessmentDataRes?.data?.content && syllabusId) {
             dispatch(setAssessments({ syllabusId, assessments: assessmentDataRes.data.content }));
        }
    }, [assessmentDataRes?.data, syllabusId, dispatch]);

    const handleReload = async () => {
        if (!syllabusId) return;
        const { data } = await refetchAssessments();
        if (data?.data) {
             const fetched = Array.isArray(data.data) ? data.data : (data.data.content || []);
             dispatch(setAssessments({ syllabusId, assessments: fetched }));
        }
    };

    const assessments = reduxAssessments || [];
    const isLoading = isTaskLoading || isAssessmentLoading;

    if (!taskId) return null;

    if (isLoading && assessments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 min-h-[500px]">
                <Loader2 size={32} className="animate-spin mb-4" />
                <p>Loading assessments...</p>
            </div>
        );
    }

    const handleAddComponent = () => {
        if (!syllabusId) return;
        const defaultCategory = ASSESSMENT_CATEGORIES[0];
        const defaultType = ASSESSMENT_TYPES[0];

        dispatch(addAssessment({
            syllabusId,
            assessment: {
                syllabusId,
                categoryId: defaultCategory?.categoryId || "",
                categoryName: defaultCategory?.categoryName || "",
                typeId: defaultType?.typeId || "",
                typeName: defaultType?.typeName || "",
                part: 1, weight: 0, completionCriteria: "", duration: 0,
                questionType: "", knowledgeSkill: "", gradingGuide: "", note: "", status: "DRAFT"
            }
        }));
        setExpandedIndex(assessments.length);
    };

    const handleDeleteApi = (assessmentId: string, index: number) => {
        setDeleteConfirm({ id: assessmentId, index });
    };

    const executeDelete = async () => {
        if (!syllabusId || !deleteConfirm) return;
        const { id, index } = deleteConfirm;

        if (!id) {
            dispatch(removeAssessment({ syllabusId, index }));
            setDeleteConfirm(null);
            return;
        }

        try {
            await AssessmentService.deleteAssessment(id);
            dispatch(removeAssessment({ syllabusId, index }));
            showToast("Deleted", "success");
        } catch (e) { showToast("Error", "error"); } finally {
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="min-h-screen pb-32">
            {!isRevisionLoading && revisionRequest && (
                <div className="mb-6 mt-2">
                    <ReviewerFeedback 
                        reviewer={revisionRequest.reviewer}
                        comments={[{ title: 'Assessment Feedback', content: revisionRequest.commentAssessment }]}
                    />
                </div>
            )}

            <div className="mb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-extrabold text-on-surface tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Revision: Assessments
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleReload} className="px-6 py-2.5 rounded-xl font-bold border-2 border-primary text-primary text-sm">Refresh</button>
                    <button onClick={handleAddComponent} className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white text-sm">New Component</button>
                </div>
            </div>

            <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-3 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3 pb-4">
                    {assessments.map((ass, index) => (
                        <div key={ass.assessmentId || `local-${index}`} className="group bg-surface-container-lowest p-4 rounded-xl border border-transparent hover:border-primary/10 transition-all">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-primary-container text-primary flex items-center justify-center">
                                         <span className="material-symbols-outlined">history_edu</span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold">{ass.categoryName} - Part {ass.part}</h3>
                                        <p className="text-[11px] opacity-60">{ass.typeName} • {ass.weight}% Weight</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => setExpandedIndex(index)} className="px-3 py-1.5 bg-surface-container rounded-lg text-[11px] font-bold">Edit</button>
                                     <button onClick={() => ass.assessmentId ? handleDeleteApi(ass.assessmentId, index) : setDeleteConfirm({ id: null, index })} className="p-1.5 text-error"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={handleAddComponent} className="w-full py-8 border-2 border-dashed border-outline-variant/30 rounded-xl hover:bg-slate-50 transition-all font-bold opacity-60">+ Add Assessment Task</button>
                </div>
            </div>

            {expandedIndex !== null && (
                <AssessmentEditModal
                    assessment={assessments[expandedIndex]}
                    onClose={() => setExpandedIndex(null)}
                    onSave={handleReload}
                    onUpdate={(updates: Partial<AssessmentItem>) => dispatch(updateAssessment({ syllabusId: syllabusId!, index: expandedIndex, updates }))}
                    categories={ASSESSMENT_CATEGORIES}
                    types={ASSESSMENT_TYPES}
                    otherAssessmentsWeight={assessments.reduce((sum, item, idx) => idx === expandedIndex ? sum : sum + (item.weight || 0), 0)}
                    subjectId={syllabusData?.data?.subjectId}
                />
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Assessment?</h3>
                            <p className="text-sm text-slate-500">
                                Are you sure you want to delete this assessment component? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center pt-2">
                            <button onClick={() => setDeleteConfirm(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-1/2">
                                Cancel
                            </button>
                            <button onClick={executeDelete} className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 w-1/2">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Assessment Edit Modal (Minimal Version For Revisions) ──
function AssessmentEditModal({ assessment, onClose, onSave, onUpdate, categories, types, otherAssessmentsWeight, subjectId }: any) {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isSkillOpen, setIsSkillOpen] = useState(false);

    const handleSave = async () => {
        if (!assessment.weight || Number(assessment.weight) <= 0) {
            showToast("Assessment weight is required and must be greater than 0%", "warning");
            return;
        }

        const currentTotalWeight = (otherAssessmentsWeight || 0) + Number(assessment.weight || 0);
        if (currentTotalWeight > 100) {
            showToast("Total weight cannot exceed 100%", "warning");
            return;
        }

        setIsSaving(true);
        try {
            let finalAssessmentId = assessment.assessmentId;
            if (assessment.assessmentId) {
                await AssessmentService.updateAssessment(assessment.assessmentId, assessment);
            } else {
                const res = await AssessmentService.createAssessment(assessment);
                finalAssessmentId = (res as any).data?.assessmentId;
            }
            
            // Sync CLO Mappings (Simplified for brevity)
            if (finalAssessmentId && assessment.cloIds) {
                await MappingService.createAssessmentMappingsBatch(assessment.cloIds.map((cloId: any) => ({ cloId, assessmentId: finalAssessmentId })));
            }

            showToast("Saved", "success");
            await onSave();
            onClose();
        } catch (error) { showToast("Save failed", "error"); } finally { setIsSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden">
                <header className="px-8 py-4 border-b flex justify-between items-center bg-slate-50">
                    <h2 className="font-bold">Edit Revision Assessment</h2>
                    <button onClick={onClose}><span className="material-symbols-outlined">close</span></button>
                </header>
                <div className="flex-1 overflow-y-auto p-8 grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold opacity-50 uppercase">Category</label>
                        <select value={assessment.categoryId} onChange={e => onUpdate({ categoryId: e.target.value })} className="w-full p-3 border rounded-xl">
                            {categories.map((c: any) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold opacity-50 uppercase">Weight %</label>
                        <input value={assessment.weight} onChange={e => onUpdate({ weight: Number(e.target.value) })} type="number" className="w-full p-3 border rounded-xl" />
                    </div>
                    <div className="col-span-2 space-y-2">
                        <label className="text-[11px] font-bold opacity-50 uppercase">Note</label>
                        <textarea value={assessment.note} onChange={e => onUpdate({ note: e.target.value })} rows={4} className="w-full p-3 border rounded-xl"></textarea>
                    </div>
                </div>
                <footer className="p-6 border-t flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 font-bold opacity-60">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-8 py-2 bg-primary text-white rounded-xl font-bold flex items-center gap-2">
                        {isSaving && <Loader2 size={16} className="animate-spin" />} Save Changes
                    </button>
                </footer>
            </div>
        </div>
    );
}
