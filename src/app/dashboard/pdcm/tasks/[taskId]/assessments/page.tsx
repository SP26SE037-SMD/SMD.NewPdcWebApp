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
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

const COMMON_QUESTION_TYPES = [
    "Multiple Choice", "Essay", "Practical Exam", "Oral Exam",
    "Project-based", "Presentation", "Portfolio", "Assignment", "Case Study"
];

const COMMON_KNOWLEDGE_SKILLS = [
    "Remembering", "Understanding", "Applying", "Analyzing",
    "Evaluating", "Creating", "Technical Skill", "Soft Skill", "Problem Solving"
];

export default function AssessmentsPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const dispatch = useDispatch<AppDispatch>();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [originalAssessmentsMap, setOriginalAssessmentsMap] = useState<Record<string, AssessmentItem>>({});
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | null, index: number } | null>(null);

    // 1. Fetch Task to get.syllabus?.syllabusId
    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
    });

    const realTask = routeTaskData?.data;
    const syllabusId = realTask?.syllabus?.syllabusId || realTask?.syllabusId;

    const { data: syllabusData, isLoading: isSyllabusLoading } = useQuery({
        queryKey: ['syllabus', syllabusId],
        queryFn: () => SyllabusService.getSyllabusById(syllabusId!),
        enabled: !!syllabusId,
    });

    // 2. Fetch Assessments
    const { data: assessmentDataRes, isLoading: isAssessmentLoading, refetch: refetchAssessments } = useQuery({
        queryKey: ['assessments', syllabusId],
        queryFn: () => (syllabusId ? AssessmentService.getAssessmentsBySyllabusId(syllabusId) : null),
        enabled: !!syllabusId,
    });

    // 2.1 Fetch Categories & Types
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

    // 3. Sync to Redux
    useEffect(() => {
        if (assessmentDataRes?.data && Array.isArray(assessmentDataRes.data) && syllabusId) {
            const fetched = assessmentDataRes.data;
            const origMap: Record<string, AssessmentItem> = {};
            fetched.forEach((a: AssessmentItem) => {
                if (a.assessmentId) origMap[a.assessmentId] = a;
            });
            setOriginalAssessmentsMap(origMap);
            dispatch(setAssessments({ syllabusId, assessments: fetched }));
        } else if (assessmentDataRes?.data?.content && syllabusId) {
            // fallback if it's pagination format
            const fetched = assessmentDataRes.data.content;
            const origMap: Record<string, AssessmentItem> = {};
            fetched.forEach((a: AssessmentItem) => {
                if (a.assessmentId) origMap[a.assessmentId] = a;
            });
            setOriginalAssessmentsMap(origMap);
            dispatch(setAssessments({ syllabusId, assessments: fetched }));
        }
    }, [assessmentDataRes?.data, syllabusId, dispatch]);

    const handleReload = async () => {
        if (!syllabusId) return;
        try {
            const { data } = await refetchAssessments();
            if (data?.data) {
                const fetched = Array.isArray(data.data) ? data.data : (data.data.content || []);
                const origMap: Record<string, AssessmentItem> = {};
                fetched.forEach((a: AssessmentItem) => {
                    if (a.assessmentId) origMap[a.assessmentId] = a;
                });
                setOriginalAssessmentsMap(origMap);
                dispatch(setAssessments({ syllabusId, assessments: fetched }));
            }
        } catch (e) {
            console.error("Failed to reload", e);
        }
    };

    const assessments = reduxAssessments || [];
    const isLoading = isTaskLoading || isAssessmentLoading;

    const totalWeight = assessments.reduce((sum, a) => sum + (Number(a.weight) || 0), 0);
    const isWeightValid = totalWeight === 100;
    const isWeightOver = totalWeight > 100;

    if (!taskId) return null;

    if (isLoading && assessments.length === 0) {
        return (
            <div className="bg-white border flex flex-col items-center justify-center text-zinc-400 border-zinc-200 rounded-3xl p-8 shadow-sm min-h-[500px]">
                <Loader2 size={32} className="animate-spin mb-4" />
                <p>Loading assessments...</p>
            </div>
        );
    }

    const handleAddComponent = () => {
        if (!syllabusId) return;
        const newIndex = assessments.length;
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
                part: 1,
                weight: "" as any, // Start with empty for easier typing
                completionCriteria: "",
                duration: "" as any, // Start with empty 
                questionType: "",
                knowledgeSkill: "",
                gradingGuide: "",
                note: "",
                status: "DRAFT"
            }
        }));
        setExpandedIndex(newIndex);
    };

    const handleNumberChange = (index: number, field: keyof AssessmentItem, value: string) => {
        // If empty string, keep as empty string to allow clearing in UI
        const val = value === "" ? "" : Number(value);
        dispatch(updateAssessment({ syllabusId: syllabusId!, index, updates: { [field]: val } as any }));
    };

    const handleDeleteLocal = (index: number) => {
        if (!syllabusId) return;
        setDeleteConfirm({ id: null, index });
    };

    const handleDeleteApi = (assessmentId: string, index: number) => {
        if (!syllabusId) return;
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
            showToast("Assessment deleted successfully", "success");
            dispatch(removeAssessment({ syllabusId, index }));
            handleReload();
        } catch (e) {
            console.error(e);
            showToast("Failed to delete assessment", "error");
        } finally {
            setDeleteConfirm(null);
        }
    };

    const handleSave = async () => {
        // Bulk save removed. Logic moved to Modal.
    };

    return (
        <div className="min-h-screen pb-32 animate-in fade-in duration-500">

            {/* ── Page Header ── */}
            <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold tracking-[0.15em] text-primary/80 leading-none">Active Configuration</p>
                    <h1 className="text-xl font-extrabold text-on-surface tracking-tight mb-0.5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Syllabus Assessments
                    </h1>
                    <p className="text-[10px] font-light text-on-surface-variant max-w-xl leading-tight">
                        {syllabusData?.data?.subjectName || 'this course'}
                    </p>
                </div>

                <div className="flex gap-4 self-start md:self-end">
                    <button
                        onClick={handleReload}
                        disabled={isSaving || !syllabusId}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-sm text-sm border-2 disabled:opacity-50"
                        style={{ borderColor: '#41683f', color: '#41683f', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[20px]">refresh</span>
                        Refresh List
                    </button>
                    <button
                        onClick={handleAddComponent}
                        disabled={isSaving || !syllabusId}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg text-sm bg-primary text-white disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        New Component
                    </button>
                </div>
            </div>

            {/* ── Scrollable Bento Grid List of Assessments ── */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-3 custom-scrollbar">
                <div className="grid grid-cols-1 gap-3 pb-4">
                    {assessments.map((ass, index) => (
                        <div key={ass.assessmentId || `local-${index}`}
                            className="group relative bg-surface-container-lowest p-0.5 rounded-xl transition-all duration-300 hover:shadow-lg border border-transparent hover:border-primary/10">
                            <div className="flex items-center justify-between p-3">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${ass.typeName?.toLowerCase().includes('formative') ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                                        <span className="material-symbols-outlined text-xl">
                                            {ass.typeName?.toLowerCase().includes('formative') ? 'edit_note' : 'history_edu'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-on-surface" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            {ass.categoryName} - Part {ass.part}
                                            {!ass.assessmentId && <span className="ml-2 text-[8px] font-bold uppercase bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full inline-block">Draft</span>}
                                        </h3>
                                        <div className="flex items-center space-x-2 mt-0.5">
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${ass.typeName?.toLowerCase().includes('formative') ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary-container text-on-primary-container'}`}>
                                                {ass.typeName}
                                            </span>
                                            <span className="text-[11px] text-on-surface-variant/60">•</span>
                                            <span className="text-[11px] text-on-surface-variant font-medium">
                                                {ass.note ? (ass.note.length > 50 ? ass.note.substring(0, 50) + '...' : ass.note) : 'No instructions provided.'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="text-right">
                                        <p className="text-[8px] uppercase tracking-widest text-on-surface-variant font-bold mb-0">Weighting</p>
                                        <p className="text-lg font-bold text-on-surface leading-none">{ass.weight}%</p>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button onClick={() => setExpandedIndex(index)}
                                            className="p-1 px-2 text-on-surface-variant hover:bg-surface-container rounded-md transition-colors flex items-center gap-1 border border-outline-variant/20 shadow-xs">
                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                            <span className="text-[10px] font-bold">Edit</span>
                                        </button>
                                        <button
                                            onClick={() => ass.assessmentId ? handleDeleteApi(ass.assessmentId, index) : handleDeleteLocal(index)}
                                            className="p-1 text-error hover:bg-error-container/10 rounded-md transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Preview Details */}
                            <div className="mx-4 mb-4 h-px bg-surface-container"></div>
                            <div className="px-4 pb-4 text-[11px] text-on-surface-variant grid grid-cols-3 gap-6">
                                <div>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest mb-0.5 text-on-surface-variant/60">Duration</span>
                                    <span className="font-medium">{ass.duration} Min</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest mb-0.5 text-on-surface-variant/60">Eval Range</span>
                                    <span className="font-medium">{ass.completionCriteria || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest mb-0.5 text-on-surface-variant/60">Methodology</span>
                                    <span className="px-1.5 py-0.5 rounded-md bg-tertiary-container text-on-tertiary-container text-[9px] font-bold">
                                        {ass.questionType || 'Standard'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State / Add Action */}
                    <button onClick={handleAddComponent}
                        className="w-full py-8 border-2 border-dashed border-outline-variant/30 rounded-xl hover:bg-surface-container-low/50 hover:border-primary/40 transition-all group">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-colors mb-3">
                                <span className="material-symbols-outlined text-xl">add</span>
                            </div>
                            <span className="text-base font-bold text-on-surface-variant group-hover:text-primary transition-colors">Add Component</span>
                            <p className="text-[10px] text-on-surface-variant/60 mt-0.5 uppercase tracking-widest">Create a new assessment task</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* ── Bottom Actions ── */}
            <div className="mt-16 border-t border-outline-variant/20 pt-10">
                <p className="text-[10px] text-on-surface-variant/40 italic text-center">
                    Assessments are automatically synchronized when saved within the editing modal.
                </p>
            </div>

            {/* ── Edit Assessment Modal ── */}
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

// ── Assessment Edit Modal Component ──
function AssessmentEditModal({ assessment, onClose, onSave, onUpdate, categories, types, otherAssessmentsWeight, subjectId }: {
    assessment: AssessmentItem;
    onClose: () => void;
    onSave: () => Promise<void>;
    onUpdate: (updates: Partial<AssessmentItem>) => void;
    categories: AssessmentCategory[];
    types: AssessmentType[];
    otherAssessmentsWeight: number;
    subjectId?: string;
}) {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [existingMappings, setExistingMappings] = useState<CloAssessmentMapping[]>([]);
    const [isSkillOpen, setIsSkillOpen] = useState(false);

    const weightValue = assessment.weight || 0;
    const currentTotalWeight = otherAssessmentsWeight + weightValue;
    const isOverWeight = currentTotalWeight > 100;

    // Fetch existing mappings when editing
    useEffect(() => {
        let isMounted = true;
        const fetchMappings = async () => {
            if (assessment.assessmentId) {
                console.log(`[FE] Fetching CLO mappings for Assessment: ${assessment.assessmentId}`);
                try {
                    const res = await MappingService.getAssessmentMappings(assessment.assessmentId);
                    if (isMounted && res.data) {
                        const dbMappings = res.data;
                        const dbCloIds = dbMappings.map(m => m.cloId);

                        console.log(`[FE] Found ${dbCloIds.length} mappings in DB:`, dbCloIds);

                        setExistingMappings(dbMappings);
                        // Always sync CLO IDs from the database when opening the modal for an existing assessment
                        onUpdate({ cloIds: dbCloIds });
                    }
                } catch (error) {
                    console.error("Failed to fetch assessment mappings:", error);
                }
            }
        };
        fetchMappings();
        return () => { isMounted = false; };
    }, [assessment.assessmentId]);

    const { data: closRes, isLoading: isClosLoading } = useQuery({
        queryKey: ['clos', subjectId],
        queryFn: () => subjectId ? CloPloService.getSubjectClos(subjectId, 0, 100) : null,
        enabled: !!subjectId,
    });

    const clos = closRes?.data?.content || [];

    if (!assessment) return null;

    const handleSave = async () => {
        const url = assessment.assessmentId ? `/api/assessments/${assessment.assessmentId}` : '/api/assessments';
        console.log("ASSESSMENT MODAL SAVE ATTEMPT - URL:", url, "Data:", assessment);

        if (!assessment.weight || Number(assessment.weight) <= 0) {
            showToast("Assessment weight is required and must be greater than 0%", "warning");
            return;
        }

        if (isOverWeight) {
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

            // Sync CLO Mappings
            if (finalAssessmentId) {
                const currentCloIds = assessment.cloIds || [];
                const existingCloIds = existingMappings.map(m => m.cloId);

                // 1. Delete mappings that were removed
                const mappingsToDelete = existingMappings.filter(m => !currentCloIds.includes(m.cloId));
                console.log(`[FE] Sync: Removing ${mappingsToDelete.length} mappings`, mappingsToDelete);

                for (const m of mappingsToDelete) {
                    if (m.id) {
                        console.log(`[FE] Deleting mapping ID: ${m.id} (CLO: ${m.cloCode})`);
                        await MappingService.deleteAssessmentMapping(m.id);
                    } else {
                        console.warn("[FE] Skipping mapping deletion: Missing ID", m);
                    }
                }

                // 2. Add new mappings via batch
                const cloIdsToAdd = currentCloIds.filter(id => !existingCloIds.includes(id));
                console.log(`[FE] Sync: Adding ${cloIdsToAdd.length} new CLO mappings`, cloIdsToAdd);

                if (cloIdsToAdd.length > 0) {
                    const newMappings = cloIdsToAdd.map(cloId => ({
                        cloId,
                        assessmentId: finalAssessmentId!
                    }));
                    await MappingService.createAssessmentMappingsBatch(newMappings);
                }
            }

            showToast(`Assessment ${assessment.assessmentId ? 'updated' : 'created'} successfully with CLO mappings`, "success");
            await onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save assessment:", error);
            showToast("Failed to save assessment. Please try again.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[95vh] rounded-2xl flex flex-col overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-200">
                {/* Modal Header */}
                <header className="px-8 py-6 flex justify-between items-start bg-slate-50 border-b border-slate-100">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-widest uppercase">
                                {assessment.assessmentId ? 'Editing' : 'Drafting'}
                            </span>
                            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {assessment.categoryName || 'New Assessment'} - Part {assessment.part}
                            </h2>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">Syllabus Component Configuration</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors group">
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600">close</span>
                    </button>
                </header>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-10">
                    <div className="grid grid-cols-6 gap-x-8 gap-y-10">
                        {/* Row 1: Essential Configuration */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Category</label>
                            <select
                                value={assessment.categoryId}
                                onChange={(e) => {
                                    const cat = categories.find(c => c.categoryId === e.target.value);
                                    onUpdate({ categoryId: e.target.value, categoryName: cat?.categoryName });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden appearance-none"
                            >
                                <option value="" disabled>Select Category</option>
                                {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Evaluation Type</label>
                            <select
                                value={assessment.typeId}
                                onChange={(e) => {
                                    const type = types.find(t => t.typeId === e.target.value);
                                    onUpdate({ typeId: e.target.value, typeName: type?.typeName });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden appearance-none"
                            >
                                <option value="" disabled>Select Type</option>
                                {types.map(t => <option key={t.typeId} value={t.typeId}>{t.typeName}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Part #</label>
                            <input
                                value={assessment.part}
                                onChange={(e) => onUpdate({ part: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden"
                                type="number"
                                min={1}
                            />
                        </div>
                        <div className="col-span-1 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Weight %</label>
                            <input
                                value={assessment.weight}
                                onChange={(e) => onUpdate({ weight: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-emerald-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden font-bold text-primary"
                                type="number"
                                min={0}
                                max={100}
                            />
                        </div>

                        {/* Row 2: Criteria & Duration */}
                        <div className="col-span-4 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Completion Criteria</label>
                            <input
                                value={assessment.completionCriteria}
                                onChange={(e) => onUpdate({ completionCriteria: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden"
                                placeholder="e.g., Minimum 70% accuracy on functional code snippets"
                                type="text"
                            />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Duration (mins)</label>
                            <input
                                value={assessment.duration}
                                onChange={(e) => onUpdate({ duration: Number(e.target.value) })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden"
                                type="number"
                                min={0}
                            />
                        </div>

                        {/* Row 3 */}
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Question Type</label>
                            <select
                                value={assessment.questionType}
                                onChange={(e) => onUpdate({ questionType: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden"
                            >
                                <option value="" disabled>Select Methodology</option>
                                {COMMON_QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-2 relative">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Knowledge / Skill</label>

                            {/* Custom Multi-select Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsSkillOpen(!isSkillOpen)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm flex justify-between items-center hover:border-primary/50 transition-all focus:ring-2 focus:ring-primary/20 focus:bg-white"
                                >
                                    <span className={`truncate mr-2 ${!assessment.knowledgeSkill ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                                        {assessment.knowledgeSkill || 'Select Knowledge Skills'}
                                    </span>
                                    <span className={`material-symbols-outlined text-slate-400 transition-transform duration-200 ${isSkillOpen ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>

                                {isSkillOpen && (
                                    <>
                                        {/* Overlay to close when clicking outside */}
                                        <div className="fixed inset-0 z-40" onClick={() => setIsSkillOpen(false)}></div>

                                        {/* Dropdown Menu */}
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 max-h-[280px] overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-2 border-b border-slate-50 mb-1 flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Blooms Taxonomy</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsSkillOpen(false)}
                                                    className="text-[10px] font-bold text-primary hover:underline"
                                                >
                                                    Done
                                                </button>
                                            </div>
                                            {COMMON_KNOWLEDGE_SKILLS.map(skill => {
                                                const currentSkills = assessment.knowledgeSkill ? assessment.knowledgeSkill.split(', ').filter(Boolean) : [];
                                                const isSelected = currentSkills.includes(skill);

                                                return (
                                                    <button
                                                        key={skill}
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newSkills = isSelected
                                                                ? currentSkills.filter(s => s !== skill)
                                                                : [...currentSkills, skill];
                                                            onUpdate({ knowledgeSkill: newSkills.join(', ') });
                                                        }}
                                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors text-left group"
                                                    >
                                                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected
                                                                ? 'bg-emerald-500 border-emerald-600 text-white'
                                                                : 'bg-white border-slate-200 group-hover:border-emerald-300'
                                                            }`}>
                                                            {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                                                        </div>
                                                        <span className={`text-sm ${isSelected ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>
                                                            {skill}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Grading Guide</label>
                            <input
                                value={assessment.gradingGuide}
                                onChange={(e) => onUpdate({ gradingGuide: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden"
                                placeholder="e.g., Standard Rubric V2"
                                type="text"
                            />
                        </div>

                        {/* Description Text Area */}
                        <div className="col-span-6 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Note / Description</label>
                                <span className="text-[10px] text-slate-400 italic">Supports clinical or pedagogical notes</span>
                            </div>
                            <textarea
                                value={assessment.note}
                                onChange={(e) => onUpdate({ note: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden resize-none"
                                placeholder="Provide detailed instructions for the assessment facilitator..."
                                rows={5}
                            ></textarea>
                        </div>

                        {/* CLO Mapping Section */}
                        <div className="col-span-6 space-y-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm">target</span>
                                    Outcome Mapping (CLO)
                                </label>
                                <span className="text-[10px] text-slate-400 italic">Select learning outcomes covered by this assessment</span>
                            </div>

                            {isClosLoading ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400 p-4">
                                    <Loader2 size={16} className="animate-spin" />
                                    Loading CLOs...
                                </div>
                            ) : clos.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                    {clos.map(clo => {
                                        const isSelected = assessment.cloIds?.includes(clo.cloId);
                                        return (
                                            <button
                                                key={clo.cloId}
                                                onClick={() => {
                                                    const currentIds = assessment.cloIds || [];
                                                    const newIds = isSelected
                                                        ? currentIds.filter(id => id !== clo.cloId)
                                                        : [...currentIds, clo.cloId];
                                                    onUpdate({ cloIds: newIds });
                                                }}
                                                className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all group ${isSelected
                                                        ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'
                                                        : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                <div className={`mt-0.5 shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                                                    }`}>
                                                    {isSelected && <span className="material-symbols-outlined text-[12px] font-bold">check</span>}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className={`text-[10px] font-bold uppercase tracking-wide ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                        {clo.cloCode}
                                                    </p>
                                                    <p className={`text-[11px] line-clamp-2 leading-relaxed ${isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>
                                                        {clo.description}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                                    <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">assignment_late</span>
                                    <p className="text-sm text-slate-400 font-medium">No CLOs found for this subject.</p>
                                    <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Please check syllabus setup</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <footer className="px-8 py-8 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-12">
                        {/* Weight Distribution Preview */}
                        <div className="flex-1 max-w-xs space-y-2">
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">Weight Distribution</span>
                                <span className={`text-sm font-bold ${isOverWeight ? 'text-red-500' : 'text-primary'}`}>{currentTotalWeight}% Total</span>
                            </div>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                                <div className={`h-full transition-all duration-300 ${isOverWeight ? 'bg-red-500' : 'bg-primary'}`} style={{ width: `${Math.min(currentTotalWeight, 100)}%` }}></div>
                                {isOverWeight && (
                                    <div className="h-full bg-red-300 animate-pulse" style={{ width: `${currentTotalWeight - 100}%` }}></div>
                                )}
                            </div>
                            {isOverWeight && (
                                <p className="text-[10px] text-red-500 font-bold italic animate-bounce">Warning: Total weight exceeds 100%!</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={onClose} disabled={isSaving}
                                className="px-6 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={isSaving}
                                className={`flex items-center gap-2 px-10 py-3 text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 min-w-[140px] justify-center text-white
                                    ${isOverWeight ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-primary shadow-primary/20 hover:scale-[1.03]'}`}>
                                {isSaving ? (
                                    <Loader2 size={20} className="animate-spin" />
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[20px]">save</span>
                                        Save
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
