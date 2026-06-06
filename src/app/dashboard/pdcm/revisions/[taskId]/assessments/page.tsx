"use client";

import React, { use, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setAssessments, addAssessment, updateAssessment, removeAssessment } from '@/store/slices/syllabusSlice';
import { Loader2, Plus } from 'lucide-react';
import { TaskService } from '@/services/task.service';
import { AssessmentService, AssessmentItem, AssessmentCategory, AssessmentType } from '@/services/assessment.service';
import { SyllabusService } from '@/services/syllabus.service';
import { CloPloService } from '@/services/cloplo.service';
import { MappingService, CloAssessmentMapping } from '@/services/mapping.service';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import * as XLSX from 'xlsx';
import { useRevisionRequest } from '@/hooks/useRevisionRequest';
import { ReviewerFeedback } from '@/components/dashboard/ReviewerFeedback';
interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

const COMMON_QUESTION_TYPES = [
    "Multiple Choice", "Essay", "Practical Exam", "Oral Exam",
    "Project-based", "Presentation", "Portfolio", "Assignment", "Case Study"
];

const VALID_QUESTION_TYPES: Record<string, Record<string, string[]>> = {
    "Formative": {
        "Quiz": ["Multiple Choice", "Essay"],
        "Lab": ["Practical Exam", "Assignment"],
        "Presentation": ["Presentation"]
    },
    "Summative": {
        "Midterm": ["Multiple Choice", "Essay", "Case Study"],
        "Project": ["Project-based"],
        "Final": ["Practical Exam", "Essay", "Case Study", "Multiple Choice"]
    }
};

// Helper to get valid types map case-insensitively
const getValidTypesMap = (catName: string) => {
    if (!catName) return {};
    const key = Object.keys(VALID_QUESTION_TYPES).find(k => k.toLowerCase() === catName.toLowerCase());
    return key ? VALID_QUESTION_TYPES[key] : {};
};

// Helper to determine available question types based on selected category and type
const getAvailableQTypes = (catName: string, typeName: string) => {
    if (!catName || !typeName) return null;
    const map = getValidTypesMap(catName);
    const typeKey = Object.keys(map).find(k => k.toLowerCase() === typeName.toLowerCase());
    return typeKey ? map[typeKey] : null;
};

export default function RevisionAssessmentsPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const dispatch = useDispatch<AppDispatch>();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
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

    // Fetch Revision Request Data (Always enabled for this route)
    const { data: revisionRequest, isLoading: isRevisionLoading } = useRevisionRequest(taskId, true);


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

    const subjectId = syllabusData?.data?.subjectId;
    const { data: closRes } = useQuery({
        queryKey: ['clos', subjectId],
        queryFn: () => subjectId ? CloPloService.getSubjectClos(subjectId, 0, 100) : null,
        enabled: !!subjectId,
    });
    const subjectClos = closRes?.data?.content || [];

    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'list' | 'mapping'>('list');
    const [previewPage, setPreviewPage] = useState(1);

    // Validation state for Import flow
    const [isValidating, setIsValidating] = useState(false);
    const [isValidated, setIsValidated] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [validationSummary, setValidationSummary] = useState<any>(null);


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

    // Mapping specific state
    const [mappingStates, setMappingStates] = useState<Record<string, string[]>>({});
    const [isMappingValidating, setIsMappingValidating] = useState(false);
    const [mappingValidationResult, setMappingValidationResult] = useState<any>(null);
    const [isMappingSaving, setIsMappingSaving] = useState(false);
    const [isMappingResultModalOpen, setIsMappingResultModalOpen] = useState(false);

    const { data: mappingsRes, refetch: refetchMappings } = useQuery({
        queryKey: ['assessment-mappings', syllabusId],
        queryFn: () => syllabusId ? MappingService.getSyllabusAssessmentMappings(syllabusId) : null,
        enabled: !!syllabusId,
    });

    // Initialize mapping states from API or assessments
    useEffect(() => {
        if (activeTab === 'mapping' && assessments.length > 0) {
            const newStates = { ...mappingStates };

            if (mappingsRes?.data) {
                const apiMappings = mappingsRes.data;
                const grouped: Record<string, string[]> = {};
                apiMappings.forEach((m: CloAssessmentMapping) => {
                    if (!grouped[m.assessmentId]) grouped[m.assessmentId] = [];
                    grouped[m.assessmentId].push(m.cloId);
                });

                assessments.forEach(ass => {
                    if (ass.assessmentId) {
                        newStates[ass.assessmentId] = grouped[ass.assessmentId] || [];
                    }
                });
            } else {
                assessments.forEach(ass => {
                    if (ass.assessmentId && !newStates[ass.assessmentId]) {
                        newStates[ass.assessmentId] = ass.cloIds || [];
                    }
                });
            }
            setMappingStates(newStates);
        }
    }, [activeTab, assessments, mappingsRes?.data]);

    const handleValidateMappings = async () => {
        if (!syllabusId) return;
        setIsMappingValidating(true);
        try {
            const payload = Object.entries(mappingStates).flatMap(([assessmentId, cloIds]) =>
                cloIds.map(cloId => ({ assessmentId, cloId }))
            );
            if (payload.length === 0) {
                showToast("Please select at least one mapping to validate.", "error");
                setIsMappingValidating(false);
                return;
            }
            const res = await MappingService.validateAssessmentMappings(syllabusId, payload);
            if (res.data) {
                console.log("✅ Mapping validation result received:", res.data);
                setMappingValidationResult(res.data);
                setIsMappingResultModalOpen(true);
                showToast("Mapping validation complete", "success");
            }
        } catch (error: any) {
            // Validation errors are expected, no need to log the entire error to trigger the Next.js overlay
            const errMsg = error.message || "Failed to validate mappings";
            showToast(errMsg, "error");
        } finally {
            setIsMappingValidating(false);
        }
    };

    const handleSaveAllMappings = async () => {
        if (!syllabusId || !mappingsRes?.data) return;
        setIsMappingSaving(true);
        try {
            const existingMappings = mappingsRes.data;

            // 1. Identify mappings to DELETE
            const deletions = existingMappings.filter(m => {
                const selectedCloIds = mappingStates[m.assessmentId] || [];
                return !selectedCloIds.includes(m.cloId);
            });

            // 2. Identify mappings to ADD
            const additions: { assessmentId: string; cloId: string }[] = [];
            Object.entries(mappingStates).forEach(([assessmentId, selectedCloIds]) => {
                selectedCloIds.forEach(cloId => {
                    const exists = existingMappings.some(m => m.assessmentId === assessmentId && m.cloId === cloId);
                    if (!exists) {
                        additions.push({ assessmentId, cloId });
                    }
                });
            });

            // 3. Execute Deletions
            if (deletions.length > 0) {
                console.log(`🗑️ Deleting ${deletions.length} mappings...`);
                await Promise.all(deletions.map(m => MappingService.deleteAssessmentMapping(m.id)));
            }

            // 4. Execute Additions
            if (additions.length > 0) {
                console.log(`➕ Adding ${additions.length} mappings...`);
                await MappingService.createAssessmentMappingsBatch(additions);
            }

            if (deletions.length > 0 || additions.length > 0) {
                showToast(`Saved successfully (${additions.length} added, ${deletions.length} removed)`, "success");
                queryClient.invalidateQueries({ queryKey: ['assessment-mappings', syllabusId] });
                refetchAssessments();
            } else {
                showToast("No changes to save", "info");
            }
        } catch (error) {
            console.error("❌ Failed to save mappings:", error);
            showToast("Failed to save some mappings", "error");
        } finally {
            setIsMappingSaving(false);
        }
    };

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
                note: ""
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

        setIsDeleting(true);
        try {
            await AssessmentService.deleteAssessment(id);
            showToast("Assessment deleted successfully", "success");
            dispatch(removeAssessment({ syllabusId, index }));
            handleReload();
            setDeleteConfirm(null);
        } catch (e: any) {
            console.error(e);
            showToast(e.message || "Failed to delete assessment", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSave = async () => {
        // Bulk save removed. Logic moved to Modal.
    };

    return (
        <div className="min-h-screen pb-32 animate-in fade-in duration-500">
            {!isRevisionLoading && revisionRequest && (
                <div className="mb-6">
                    <ReviewerFeedback
                        reviewer={revisionRequest.reviewer}
                        comments={[{ title: 'Assessments Feedback', content: revisionRequest.commentAssessment }]}
                    />
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Revision: Assessments
                    </h1>
                    <p className="text-[12px] font-bold text-zinc-900 flex items-center gap-2">
                        <span>{assessments.length} assessments created</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                        <span className={isWeightValid ? 'text-emerald-600' : isWeightOver ? 'text-red-600' : 'text-amber-600'}>
                            Total Weight: {totalWeight}%
                        </span>
                    </p>
                </div>

                <div className="flex gap-4 self-start md:self-end">
                    {activeTab === 'list' && (
                        <>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 border-[#00966d] text-[#00966d] hover:bg-[#00966d]/5 active:bg-[#00966d]/10"
                            >
                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                Import File
                            </button>
                            <button
                                onClick={() => {
                                    const newIdx = assessments.length;
                                    dispatch(addAssessment({
                                        syllabusId: syllabusId!,
                                        assessment: {
                                            part: (assessments.length > 0 ? Math.max(...assessments.map(a => a.part || 0)) : 0) + 1,
                                            weight: 0,
                                            syllabusId: syllabusId!,
                                            categoryId: '',
                                            typeId: '',
                                            completionCriteria: '',
                                            duration: 0,
                                            questionType: '',
                                            knowledgeSkill: '',
                                            gradingGuide: '',
                                            note: ''
                                        }
                                    }));
                                    setExpandedIndex(newIdx);
                                }}
                                className="bg-[#00966d] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00966d]/20 text-sm"
                            >
                                <Plus size={18} />
                                New Assessment
                            </button>
                        </>
                    )}
                    {activeTab === 'mapping' && (
                        <>
                            {mappingValidationResult && (
                                <button
                                    onClick={() => {
                                        console.log("🖱️ View Result clicked");
                                        setIsMappingResultModalOpen(true);
                                    }}
                                    className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 border-[#00966d]/30 text-[#00966d] bg-[#00966d]/5 hover:bg-[#00966d]/10 relative z-50"
                                >
                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    View Validate Suggestion
                                </button>
                            )}
                            <button
                                onClick={handleValidateMappings}
                                disabled={isMappingValidating}
                                className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 border-[#00966d] text-[#00966d] hover:bg-[#00966d]/5 active:bg-[#00966d]/10 disabled:opacity-50"
                            >
                                {isMappingValidating ? <Loader2 size={18} className="animate-spin" /> : <span className="material-symbols-outlined text-[18px]">fact_check</span>}
                                Validate Mapping
                            </button>
                            <button
                                onClick={handleSaveAllMappings}
                                disabled={isMappingSaving}
                                className="bg-[#00966d] text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00966d]/20 text-sm disabled:opacity-50"
                            >
                                {isMappingSaving ? <Loader2 size={18} className="animate-spin" /> : <span className="material-symbols-outlined text-[18px]">save</span>}
                                Save Changes
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Tabs Navigation ── */}
            <div className="flex border-b border-outline-variant/30 mb-8 mt-4">
                <button
                    onClick={() => setActiveTab('list')}
                    className={`px-8 py-3 font-bold text-sm transition-all relative ${activeTab === 'list' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Assessment List
                    {activeTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"></div>}
                </button>
                <button
                    onClick={() => {
                        if (assessments.length === 0) {
                            showToast("Please create assessments first before mapping CLOs", "info");
                            return;
                        }
                        setActiveTab('mapping');
                    }}
                    className={`px-8 py-3 font-bold text-sm transition-all relative ${assessments.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${activeTab === 'mapping' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    CLO Mapping
                    {activeTab === 'mapping' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"></div>}
                </button>
            </div>

            <div className={activeTab === 'list' ? 'block' : 'hidden'}>
                <>
                    {/* ── Scrollable Bento Grid List of Assessments ── */}
                    <div className="max-h-[calc(100vh-280px)] overflow-y-auto pr-3 custom-scrollbar">
                        {assessments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-zinc-400 bg-surface-container-lowest rounded-3xl border-2 border-dashed border-outline-variant/30 animate-in fade-in zoom-in duration-500">
                                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">assignment_late</span>
                                <p className="text-lg font-medium text-on-surface/60" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No assessments found</p>
                                <p className="text-sm opacity-60 mt-1">Please add a new assessment or import from an Excel file</p>
                            </div>
                        ) : (
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
                                                        className="p-1 px-2 text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-1 border border-primary/20 shadow-xs">
                                                        <span className="material-symbols-outlined text-[16px]">visibility</span>
                                                        <span className="text-[10px] font-bold">View</span>
                                                    </button>
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
                            </div>
                        )}
                    </div>



                </>
            </div>

            <div className={activeTab === 'mapping' ? 'block' : 'hidden'}>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <CloMappingTab
                        assessments={assessments}
                        subjectClos={subjectClos}
                        mappingStates={mappingStates}
                        onMappingChange={(assessmentId, cloIds) => setMappingStates(prev => ({ ...prev, [assessmentId]: cloIds }))}
                    />
                </div>
            </div>

            {/* ── Mapping Validation Modal ── */}
            {isMappingResultModalOpen && mappingValidationResult && (
                <MappingValidationModal
                    result={mappingValidationResult}
                    assessments={assessments}
                    onClose={() => setIsMappingResultModalOpen(false)}
                />
            )}

            {/* ── Edit Assessment Modal ── */}
            {expandedIndex !== null && (
                <AssessmentEditModal
                    assessment={assessments[expandedIndex]}
                    onClose={(saved?: boolean) => {
                        const ass = assessments[expandedIndex];
                        if (!saved && ass && !ass.assessmentId) {
                            dispatch(removeAssessment({ syllabusId: syllabusId!, index: expandedIndex }));
                        }
                        setExpandedIndex(null);
                    }}
                    onSave={handleReload}
                    onUpdate={(updates: Partial<AssessmentItem>) => dispatch(updateAssessment({ syllabusId: syllabusId!, index: expandedIndex, updates }))}
                    categories={ASSESSMENT_CATEGORIES}
                    types={ASSESSMENT_TYPES}
                    otherAssessmentsWeight={assessments.reduce((sum, item, idx) => idx === expandedIndex ? sum : sum + (item.weight || 0), 0)}
                    subjectId={syllabusData?.data?.subjectId}
                    syllabusId={syllabusId}
                />
            )}



            {/* ── Delete Confirmation Modal ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mb-6">
                            <span className="material-symbols-outlined text-4xl">warning</span>
                        </div>
                        <div className="text-center space-y-2 mb-8">
                            <h3 className="text-2xl font-black text-slate-900">Delete Assessment?</h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                Are you sure you want to delete this assessment component? This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center pt-2">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                disabled={isDeleting}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-1/2 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                disabled={isDeleting}
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 w-1/2 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : null}
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Custom Import & Preview Modal for Assessments */}
            {(isImportModalOpen || isPreviewOpen) && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => { if (!isSaving) { setIsImportModalOpen(false); setIsPreviewOpen(false); } }}
                    />

                    <div
                        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
                    >
                        <div className="p-8 pb-4 flex justify-between items-center border-b border-outline-variant/20">
                            <div>
                                <h2 className="text-2xl font-black text-[#2d342b]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {isPreviewOpen ? 'Preview Assessments' : 'Import Assessments'}
                                </h2>
                                <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-1">
                                    {isPreviewOpen ? `Review ${previewData.length} records before saving` : 'Upload Excel data'}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                {!isPreviewOpen && (
                                    <button
                                        onClick={async () => {
                                            const ExcelJS = (await import('exceljs')).default;
                                            const fs = await import('file-saver');
                                            const saveAs = fs.saveAs || fs.default?.saveAs || fs.default;

                                            const workbook = new ExcelJS.Workbook();
                                            const worksheet = workbook.addWorksheet('Template');

                                            worksheet.columns = [
                                                { header: 'Category', key: 'category', width: 16 },
                                                { header: 'Type', key: 'type', width: 16 },
                                                { header: 'Part', key: 'part', width: 10 },
                                                { header: 'Weight', key: 'weight', width: 10 },
                                                { header: 'Completion Criteria', key: 'completionCriteria', width: 22 },
                                                { header: 'Duration', key: 'duration', width: 12 },
                                                { header: 'Question Type', key: 'questionType', width: 20 },
                                                { header: 'Knowledge Skill', key: 'knowledgeSkill', width: 20 },
                                                { header: 'Grading Guide', key: 'gradingGuide', width: 20 },
                                                { header: 'Note', key: 'note', width: 20 },
                                                { header: 'CLO-Mapping', key: 'cloMapping', width: 20 },
                                            ];

                                            worksheet.addRow({ category: 'Summative', type: 'Quiz', part: 1, weight: 10, completionCriteria: 'Pass 50%', duration: 15, questionType: 'Multiple Choice', knowledgeSkill: '', gradingGuide: '1 point/question', note: 'Optional', cloMapping: 'CLO1, CLO2' });
                                            worksheet.addRow({ category: 'Summative', type: 'Quiz', part: 1, weight: 40, completionCriteria: '', duration: 90, questionType: 'Multiple Choice', knowledgeSkill: '', gradingGuide: 'Rubric A', note: 'Mandatory', cloMapping: 'CLO2, CLO3' });

                                            worksheet.getRow(1).font = { bold: true };
                                            worksheet.getRow(1).fill = {
                                                type: 'pattern',
                                                pattern: 'solid',
                                                fgColor: { argb: 'FFD9D2E9' }
                                            };
                                            worksheet.getRow(1).alignment = { horizontal: 'center' };

                                            for (let i = 2; i <= 200; i++) {
                                                worksheet.getCell(`A${i}`).dataValidation = {
                                                    type: 'list',
                                                    allowBlank: true,
                                                    formulae: ['"Formative,Summative"']
                                                };
                                                worksheet.getCell(`B${i}`).dataValidation = {
                                                    type: 'list',
                                                    allowBlank: true,
                                                    formulae: ['"Quiz,Lab,Project,Midterm,Presentation,Final"']
                                                };
                                                worksheet.getCell(`G${i}`).dataValidation = {
                                                    type: 'list',
                                                    allowBlank: true,
                                                    formulae: ['"Multiple Choice,Essay,Practical Exam,Project-based,Presentation,Assignment,Case Study"']
                                                };
                                                worksheet.getCell(`C${i}`).alignment = { horizontal: 'right' };
                                                worksheet.getCell(`D${i}`).alignment = { horizontal: 'right' };
                                                worksheet.getCell(`F${i}`).alignment = { horizontal: 'right' };
                                            }

                                            const buffer = await workbook.xlsx.writeBuffer();
                                            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                            saveAs(blob, 'Assessments_Template.xlsx');
                                        }}
                                        className="px-4 py-2 font-bold text-xs bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                        Download Template
                                    </button>
                                )}
                                <button
                                    onClick={() => { if (!isSaving) { setIsImportModalOpen(false); setIsPreviewOpen(false); } }}
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#f8faf2] text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">
                            {!isPreviewOpen ? (
                                <div
                                    className="border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all border-[#adb4a8]/30 bg-[#f8faf2] hover:border-primary hover:bg-primary/5 cursor-pointer"
                                    onClick={() => document.getElementById('excel-upload-hidden')?.click()}
                                >
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                                        <span className="material-symbols-outlined text-3xl">upload_file</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-[#2d342b] mb-1">Click to upload Excel file</h3>
                                    <p className="text-sm text-black/40">Supported formats: .xlsx, .xls, .csv</p>

                                    <input
                                        id="excel-upload-hidden"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            setImportFile(file);

                                            try {
                                                const data = await file.arrayBuffer();
                                                const workbook = XLSX.read(data, { type: 'array' });
                                                const firstSheetName = workbook.SheetNames[0];
                                                const worksheet = workbook.Sheets[firstSheetName];
                                                const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as Record<string, any>[];
                                                const rows = rawRows.filter((r: any) => Object.keys(r).some((k: any) => r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== ''));

                                                if (!syllabusId) return;

                                                // Log available categories and types from API
                                                console.log("📋 ASSESSMENT_CATEGORIES from API:", ASSESSMENT_CATEGORIES);
                                                console.log("📋 ASSESSMENT_TYPES from API:", ASSESSMENT_TYPES);

                                                const parsedAssessments = rows.map((row, index) => {
                                                    const rawCategory = String(row['Category'] || row['category'] || '').trim();
                                                    const rawType = String(row['Type'] || row['type'] || '').trim();
                                                    const rawPart = row['Part'] || row['part'] || 1;
                                                    let rawWeight = Number(row['Weight'] || row['weight'] || 0);
                                                    if (rawWeight > 0 && rawWeight <= 1) {
                                                        rawWeight = Math.round(rawWeight * 100);
                                                    }
                                                    const rawCriteria = String(row['Completion Criteria'] || row['completionCriteria'] || '').trim();
                                                    const rawDuration = row['Duration'] || row['duration'] || '';
                                                    const rawQuestionType = String(row['Question Type'] || row['questionType'] || '').trim();
                                                    const rawKnowledge = String(row['Knowledge Skill'] || row['knowledgeSkill'] || '').trim();
                                                    const rawGuide = String(row['Grading Guide'] || row['gradingGuide'] || '').trim();
                                                    const rawNote = String(row['Note'] || row['note'] || '').trim();
                                                    const rawCloMapping = String(row['CLO-Mapping'] || row['cloMapping'] || '').trim();

                                                    // Match category: exact → includes → first fallback
                                                    const matchedCategory = ASSESSMENT_CATEGORIES.find((c: any) => c.categoryName.toLowerCase() === rawCategory.toLowerCase())
                                                        || ASSESSMENT_CATEGORIES.find((c: any) => c.categoryName.toLowerCase().includes(rawCategory.toLowerCase()) || rawCategory.toLowerCase().includes(c.categoryName.toLowerCase()));

                                                    // Match type: exact → includes → first fallback
                                                    const matchedType = ASSESSMENT_TYPES.find((t: any) => t.typeName.toLowerCase() === rawType.toLowerCase())
                                                        || ASSESSMENT_TYPES.find((t: any) => t.typeName.toLowerCase().includes(rawType.toLowerCase()) || rawType.toLowerCase().includes(t.typeName.toLowerCase()));

                                                    if (!matchedCategory) console.warn(`⚠️ Row ${index + 1}: Category "${rawCategory}" not found in API`);
                                                    if (!matchedType) console.warn(`⚠️ Row ${index + 1}: Type "${rawType}" not found in API`);

                                                    const finalCategoryName = matchedCategory?.categoryName || rawCategory || ASSESSMENT_CATEGORIES[0]?.categoryName || "";
                                                    const finalTypeName = matchedType?.typeName || rawType || ASSESSMENT_TYPES[0]?.typeName || "";

                                                    const rowErrors: string[] = [];
                                                    // Removed client-side validation as requested by user

                                                    // Determine validQuestionType based on mapped rules (just falling back to raw if invalid)
                                                    let validQuestionType = rawQuestionType;
                                                    const validQuestionTypesForCombo = getAvailableQTypes(finalCategoryName, finalTypeName);

                                                    if (validQuestionTypesForCombo) {
                                                        const isValid = validQuestionTypesForCombo.some((v: string) => v.toLowerCase() === rawQuestionType.toLowerCase());
                                                        if (!isValid && rawQuestionType) {
                                                            validQuestionType = rawQuestionType;
                                                        } else if (!rawQuestionType && validQuestionTypesForCombo.length > 0) {
                                                            validQuestionType = validQuestionTypesForCombo[0];
                                                        }
                                                    } else if (rawQuestionType && !COMMON_QUESTION_TYPES.some((v: string) => v.toLowerCase() === rawQuestionType.toLowerCase())) {
                                                        validQuestionType = rawQuestionType;
                                                    }

                                                    return {
                                                        _rowNum: index + 1,
                                                        _importErrors: rowErrors,
                                                        syllabusId,
                                                        categoryId: matchedCategory?.categoryId || ASSESSMENT_CATEGORIES[0]?.categoryId || "",
                                                        categoryName: finalCategoryName,
                                                        typeId: matchedType?.typeId || ASSESSMENT_TYPES[0]?.typeId || "",
                                                        typeName: finalTypeName,
                                                        part: rawPart,
                                                        weight: rawWeight,
                                                        completionCriteria: rawCriteria,
                                                        duration: rawDuration,
                                                        questionType: validQuestionType,
                                                        knowledgeSkill: rawKnowledge,
                                                        gradingGuide: rawGuide,
                                                        note: rawNote,
                                                        cloMapping: rawCloMapping,
                                                        status: "DRAFT"
                                                    };
                                                });

                                                console.log("✅ PARSED ASSESSMENTS (preview):", parsedAssessments);
                                                setPreviewData(parsedAssessments);
                                                setIsValidated(false);
                                                setValidationErrors([]);
                                                setValidationSummary(null);
                                                setIsImportModalOpen(false);
                                                setIsPreviewOpen(true);
                                                (e.target as HTMLInputElement).value = '';
                                            } catch (err) {
                                                console.error(err);
                                                showToast('Invalid Excel file format', 'error');
                                            }
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col h-full animate-in fade-in duration-200">
                                    <div className="flex justify-between items-center mb-4 mt-2">
                                        <h3 className="text-lg font-bold text-on-surface">Data Preview</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setPreviewData([]);
                                                    setIsPreviewOpen(false);
                                                    setIsImportModalOpen(true);
                                                    setIsValidated(false);
                                                    setValidationErrors([]);
                                                    setValidationSummary(null);
                                                }}
                                                className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span> Delete & Upload New
                                            </button>
                                            
                                        </div>
                                    </div>

                                    

                                    {isValidated && validationSummary && (
                                        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-xl">
                                            <h4 className="font-bold text-sm mb-1">Summary</h4>
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div>Total Weight: <span className="font-bold">{validationSummary.currentTotalWeight}%</span></div>
                                                <div>Total Count: <span className="font-bold">{validationSummary.totalAssessmentCount}</span></div>
                                                <div>Formative: <span className="font-bold">{validationSummary.formativeCount}</span> | Final: <span className="font-bold">{validationSummary.finalCount}</span></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Editable Preview Table */}
                                    <div className="flex-1 overflow-auto border border-outline-variant/20 rounded-xl bg-white shadow-sm max-h-[40vh]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-surface-container-lowest sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-3 py-3 font-bold text-slate-500 w-10">#</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 min-w-[100px]">Category</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 min-w-[100px]">Type</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 w-16">Part</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 w-20">Weight</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 min-w-[150px]">Completion Criteria</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 w-20">Duration</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 min-w-[100px]">Question Type</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 min-w-[150px]">Knowledge Skill</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 min-w-[150px]">Grading Guide</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 min-w-[120px]">Note</th>
                                                    <th className="px-3 py-3 font-bold text-slate-500 min-w-[120px]">CLO-Mapping</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/10">
                                                {previewData.slice((previewPage - 1) * 10, previewPage * 10).map((item, idx) => {
                                                    const realIdx = (previewPage - 1) * 10 + idx;
                                                    const hasError = item._importErrors && item._importErrors.length > 0;
                                                    const hasWarning = item._importWarnings && item._importWarnings.length > 0;
                                                    return (
                                                        <React.Fragment key={idx}>
                                                            <tr className={`group transition-colors ${hasError ? 'bg-red-50/70 hover:bg-red-100/70' : hasWarning ? 'bg-amber-50/70 hover:bg-amber-100/70' : 'hover:bg-primary/5'}`}>
                                                                <td className="px-3 py-2 text-center relative">
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${hasError ? 'bg-red-100 text-red-700' : hasWarning ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{realIdx + 1}</span>
                                                                    {(hasError || hasWarning) && (
                                                                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 hidden group-hover:flex flex-col z-[60] min-w-[280px] max-w-[400px] bg-white border border-slate-200 shadow-xl rounded-xl pointer-events-none animate-in fade-in zoom-in-95 slide-in-from-left-2 duration-200">
                                                                            {/* Caret pointing left */}
                                                                            <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-l border-b border-slate-200 rotate-45"></div>
                                                                            
                                                                            {/* Body */}
                                                                            <div className="p-3.5 flex flex-col gap-2.5 relative z-10">
                                                                                {item._importErrors?.map((err: string, i: number) => (
                                                                                     <div key={`err-${i}`} className="flex gap-2 items-start text-[12px] leading-snug">
                                                                                         <span className="material-symbols-outlined text-[16px] shrink-0 text-red-600">error</span>
                                                                                         <span className="text-red-700 font-medium" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{err}</span>
                                                                                     </div>
                                                                                 ))}
                                                                                 {item._importWarnings?.map((warn: string, i: number) => (
                                                                                     <div key={`warn-${i}`} className="flex gap-2 items-start text-[12px] leading-snug">
                                                                                         <span className="material-symbols-outlined text-[16px] shrink-0 text-amber-500">warning</span>
                                                                                         <span className="text-amber-600 font-medium" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{warn}</span>
                                                                                     </div>
                                                                                 ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-2 text-xs">
                                                                    <select className="w-full bg-transparent outline-none text-xs appearance-none opacity-80 cursor-not-allowed" value={item.categoryId || ""} disabled>
                                                                        {ASSESSMENT_CATEGORIES.map((c: any) => (
                                                                            <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                                <td className="px-3 py-2 text-xs">
                                                                    <select className="w-full bg-transparent outline-none text-xs appearance-none opacity-80 cursor-not-allowed" value={item.typeId || ""} disabled>
                                                                        {(() => {
                                                                            const validMap = getValidTypesMap(item.categoryName || "");
                                                                            const validNames = Object.keys(validMap);
                                                                            const availTypes = validNames.length > 0
                                                                                ? ASSESSMENT_TYPES.filter((t: any) => validNames.some(v => t.typeName.toLowerCase() === v.toLowerCase()))
                                                                                : ASSESSMENT_TYPES;
                                                                            return availTypes.map((t: any) => (
                                                                                <option key={t.typeId} value={t.typeId}>{t.typeName}</option>
                                                                            ));
                                                                        })()}
                                                                    </select>
                                                                </td>
                                                                <td className="px-3 py-2"><div title={String(item.part || "")} className="w-full px-1 py-0.5 text-center text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.part || ""}</div></td>
                                                                <td className="px-3 py-2"><div title={String(item.weight)} className="w-full px-1 py-0.5 text-center text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.weight}</div></td>
                                                                <td className="px-3 py-2"><div title={String(item.completionCriteria || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.completionCriteria || ""}</div></td>
                                                                <td className="px-3 py-2"><div title={String(item.duration || "")} className="w-full px-1 py-0.5 text-center text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.duration || ""}</div></td>
                                                                <td className="px-3 py-2"><div title={String(item.questionType || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.questionType || ""}</div></td>
                                                                <td className="px-3 py-2"><div title={String(item.knowledgeSkill || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.knowledgeSkill || ""}</div></td>
                                                                <td className="px-3 py-2"><div title={String(item.gradingGuide || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.gradingGuide || ""}</div></td>
                                                                <td className="px-3 py-2"><div title={String(item.note || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.note || ""}</div></td>
                                                                <td className="px-3 py-2"><div title={String(item.cloMapping || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.cloMapping || ""}</div></td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {previewData.length > 10 && (
                                        <div className="flex justify-between items-center mt-3 px-2">
                                            <span className="text-xs text-slate-400">Showing {((previewPage - 1) * 10) + 1}–{Math.min(previewPage * 10, previewData.length)} of {previewData.length}</span>
                                            <div className="flex gap-1">
                                                <button disabled={previewPage === 1} onClick={() => setPreviewPage(p => p - 1)} className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 border border-slate-200 shadow-sm"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                                                {Array.from({ length: Math.ceil(previewData.length / 10) }).map((_, i) => (
                                                    <button key={i} onClick={() => setPreviewPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold ${previewPage === i + 1 ? 'bg-primary text-white' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'}`}>{i + 1}</button>
                                                ))}
                                                <button disabled={previewPage === Math.ceil(previewData.length / 10)} onClick={() => setPreviewPage(p => p + 1)} className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 border border-slate-200 shadow-sm"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {isPreviewOpen && (
                            <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/20 flex justify-end gap-3 rounded-b-[32px]">
                                <button
                                    onClick={() => { setIsPreviewOpen(false); setPreviewData([]); setIsImportModalOpen(true); setIsValidated(false); setValidationErrors([]); setValidationSummary(null); }}
                                    className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant bg-white border border-outline-variant/30 hover:bg-outline-variant/10 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    disabled={isSaving}
                                    onClick={async () => {
                                        if (!syllabusId || !subjectId || !importFile) return;
                                        setIsSaving(true);
                                        try {
                                            const { AssessmentService } = await import('@/services/assessment.service');
                                            const res = await AssessmentService.importAssessments(syllabusId, subjectId, importFile) as any;
                                            if (res && res.data && res.data.valid) {
                                                showToast(`Successfully saved ${res.data.savedCount} assessments`, 'success');
                                                setTimeout(() => { refetchAssessments(); refetchMappings(); }, 500);
                                                setIsPreviewOpen(false);
                                                setPreviewData([]);
                                                setImportFile(null);
                                            } else {
                                                const errorData = res?.data;
                                                const importErrs = errorData?.importErrors || [];
                                                const validateErrs = errorData?.validateError?.errors || [];
                                                const validateWarnsContent = errorData?.validateError?.warningsContent || [];
                                                const validateWarnsCovered = errorData?.validateError?.warningsCovered || [];
                                                const legacyErrs = (errorData?.errors && Array.isArray(errorData?.errors)) ? errorData.errors : [];

                                                const allErrors = [
                                                    ...importErrs.map((e: any) => ({ ...e, type: 'error' })),
                                                    ...validateErrs.map((e: any) => ({ ...e, type: 'error' })),
                                                    ...validateWarnsContent.map((e: any) => ({ ...e, type: 'warning' })),
                                                    ...validateWarnsCovered.map((e: any) => ({ ...e, type: 'warning' })),
                                                    ...legacyErrs.map((e: any) => ({ ...e, type: 'error' }))
                                                ];

                                                if (allErrors.length > 0) {
                                                     const globalErrs = allErrors.filter((e: any) => (!e.sessionNumber || e.sessionNumber === 0) && !e.rowNumber);
                                                     let errorMsg = errorData?.message || 'Validation failed or import errors occurred.';
                                                     if (globalErrs.length > 0) {
                                                         errorMsg += '\n' + globalErrs.map((e: any) => e.message).join('\n');
                                                     }
                                                     showToast(errorMsg, 'error');
                                                     setPreviewData(prev => {
                                                         const newData = [...prev];
                                                         newData.forEach(item => { item._importErrors = []; item._importWarnings = []; });
                                                         allErrors.forEach((err: any) => {
                                                             const targetItem = newData.find(n => 
                                                                 (err.sessionNumber !== undefined && err.sessionNumber > 0 && n.sessionNumber === err.sessionNumber) || 
                                                                 (err.rowNumber !== undefined && n._rowNum === err.rowNumber - 1)
                                                             );
                                                             if (targetItem) {
                                                                 if (err.type === 'warning') {
                                                                     if (!targetItem._importWarnings) targetItem._importWarnings = [];
                                                                     targetItem._importWarnings.push(err.message);
                                                                 } else {
                                                                     if (!targetItem._importErrors) targetItem._importErrors = [];
                                                                     targetItem._importErrors.push(err.message);
                                                                 }
                                                             }
                                                         });
                                                         return newData;
                                                     });
                                                } else {
                                                    showToast('Validation failed or import errors occurred.', 'error');
                                                }
                                            }
                                        } catch (error: any) {
                                            // Validation errors are expected, no need to log the entire error to trigger the Next.js overlay
                                            const errorData = error.data?.data || error.data;
                                            const importErrs = errorData?.importErrors || [];
                                            const validateErrs = errorData?.validateError?.errors || [];
                                            const validateWarnsContent = errorData?.validateError?.warningsContent || [];
                                            const validateWarnsCovered = errorData?.validateError?.warningsCovered || [];
                                            const legacyErrs = (errorData?.errors && Array.isArray(errorData?.errors)) ? errorData.errors : [];

                                            const allErrors = [
                                                ...importErrs.map((e: any) => ({ ...e, type: 'error' })),
                                                ...validateErrs.map((e: any) => ({ ...e, type: 'error' })),
                                                ...validateWarnsContent.map((e: any) => ({ ...e, type: 'warning' })),
                                                ...validateWarnsCovered.map((e: any) => ({ ...e, type: 'warning' })),
                                                ...legacyErrs.map((e: any) => ({ ...e, type: 'error' }))
                                            ];

                                            if (allErrors.length > 0) {
                                                 const globalErrs = allErrors.filter((e: any) => (!e.sessionNumber || e.sessionNumber === 0) && !e.rowNumber);
                                                 let errorMsg = errorData?.message || 'Validation failed or import errors occurred.';
                                                 if (globalErrs.length > 0) {
                                                     errorMsg += '\n' + globalErrs.map((e: any) => e.message).join('\n');
                                                 }
                                                 showToast(errorMsg, 'error');
                                                 setPreviewData(prev => {
                                                     const newData = [...prev];
                                                     newData.forEach(item => { item._importErrors = []; item._importWarnings = []; });
                                                     allErrors.forEach((err: any) => {
                                                         const targetItem = newData.find(n => 
                                                             (err.sessionNumber !== undefined && err.sessionNumber > 0 && n.sessionNumber === err.sessionNumber) || 
                                                             (err.rowNumber !== undefined && n._rowNum === err.rowNumber - 1)
                                                         );
                                                         if (targetItem) {
                                                             if (err.type === 'warning') {
                                                                 if (!targetItem._importWarnings) targetItem._importWarnings = [];
                                                                 targetItem._importWarnings.push(err.message);
                                                             } else {
                                                                 if (!targetItem._importErrors) targetItem._importErrors = [];
                                                                 targetItem._importErrors.push(err.message);
                                                             }
                                                         }
                                                     });
                                                     return newData;
                                                 });
                                            } else {
                                                 showToast(error?.message || 'Failed to import assessments', 'error');
                                            }
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-white shadow-lg hover:scale-[1.02] active:scale-95 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    style={{ background: '#41683f' }}
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <span className="material-symbols-outlined text-[20px]">save</span>}
                                    Confirm & Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}





// ── Assessment Edit Modal Component ──
function AssessmentEditModal({ assessment, onClose, onSave, onUpdate, categories, types, otherAssessmentsWeight, subjectId, syllabusId }: {
    assessment: AssessmentItem;
    onClose: (saved?: boolean) => void;
    onSave: () => Promise<void>;
    onUpdate: (updates: Partial<AssessmentItem>) => void;
    categories: AssessmentCategory[];
    types: AssessmentType[];
    otherAssessmentsWeight: number;
    subjectId?: string;
    syllabusId?: string;
}) {
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [existingMappings, setExistingMappings] = useState<CloAssessmentMapping[]>([]);
    const [isSkillOpen, setIsSkillOpen] = useState(false);

    // Validate-first state
    const [isSingleValidating, setIsSingleValidating] = useState(false);
    const [isSingleValidated, setIsSingleValidated] = useState(!!assessment.assessmentId); // Skip validate for existing
    const [singleValidationErrors, setSingleValidationErrors] = useState<any[]>([]);
    const [singleValidationSummary, setSingleValidationSummary] = useState<any>(null);

    const weightValue = assessment.weight || 0;
    const currentTotalWeight = otherAssessmentsWeight + weightValue;
    const isOverWeight = currentTotalWeight > 100;

    const currentCategory = categories.find(c => c.categoryId === assessment.categoryId);
    const currentType = types.find(t => t.typeId === assessment.typeId);

    // Determine available types based on selected category
    const validTypesMap = getValidTypesMap(currentCategory?.categoryName || "");
    const validTypeNames = Object.keys(validTypesMap);
    const availableTypes = validTypeNames.length > 0
        ? types.filter(t => validTypeNames.some(vtn => t.typeName.toLowerCase() === vtn.toLowerCase()))
        : types;

    const availableQuestionTypes = getAvailableQTypes(currentCategory?.categoryName || "", currentType?.typeName || "")
        || COMMON_QUESTION_TYPES;

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

            showToast(`Assessment ${assessment.assessmentId ? 'updated' : 'created'} successfully`, "success");
            await onSave();
            onClose(true);
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
                    <button onClick={() => onClose(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors group">
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
                                    onUpdate({
                                        categoryId: e.target.value,
                                        categoryName: cat?.categoryName,
                                        typeId: "", typeName: "", questionType: ""
                                    });
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
                                    onUpdate({
                                        typeId: e.target.value,
                                        typeName: type?.typeName,
                                        questionType: ""
                                    });
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden appearance-none"
                            >
                                <option value="" disabled>Select Type</option>
                                {availableTypes.map(t => <option key={t.typeId} value={t.typeId}>{t.typeName}</option>)}
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
                                {availableQuestionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-2 relative">
                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Knowledge / Skill</label>

                            {/* Knowledge Skill Text Input */}
                            <input
                                value={assessment.knowledgeSkill || ""}
                                onChange={(e) => onUpdate({ knowledgeSkill: e.target.value })}
                                placeholder="Enter knowledge or skills"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden"
                                type="text"
                            />
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


                    </div>
                </div>

                {/* Validation Results in Modal */}
                {singleValidationErrors.length > 0 && (
                    <div className="mx-8 mb-0 bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                        <div>
                            <h4 className="font-bold text-sm">Validation Errors</h4>
                            <ul className="text-xs mt-1 list-disc list-inside space-y-0.5">
                                {singleValidationErrors.map((err: any, i: number) => (
                                    <li key={i}><span className="font-semibold">[{err.code || 'ERROR'}]</span> {err.message}</li>
                                ))}
                            </ul>
                            <p className="text-[10px] mt-2 italic text-amber-600">Please fix these errors before saving.</p>
                        </div>
                    </div>
                )}

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
                            <button onClick={() => onClose(false)} disabled={isSaving || isSingleValidating}
                                className="px-6 py-3 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
                                Cancel
                            </button>

                            {!isSingleValidated ? (
                                <button
                                    onClick={async () => {
                                        if (!syllabusId) return;
                                        setIsSingleValidating(true);
                                        try {
                                            // 1. Fetch existing assessments
                                            const existingRes = await AssessmentService.getAssessmentsBySyllabusId(syllabusId);
                                            const existingAssessments = Array.isArray(existingRes?.data) ? existingRes.data : (existingRes?.data?.content || []);
                                            
                                            // 2. Prepare draft assessment
                                            const draftMapped = {
                                                categoryId: assessment.categoryId,
                                                typeId: assessment.typeId,
                                                syllabusId: assessment.syllabusId || syllabusId,
                                                part: Number(assessment.part),
                                                weight: Number(assessment.weight),
                                                completionCriteria: assessment.completionCriteria || "",
                                                duration: Number(assessment.duration || 0),
                                                questionType: assessment.questionType || "",
                                                knowledgeSkill: assessment.knowledgeSkill || "",
                                                gradingGuide: assessment.gradingGuide || "",
                                                note: assessment.note || "",
                                            };

                                            // 3. Combine existing with draft
                                            let combinedPayload = [];
                                            if (!assessment.assessmentId) {
                                                combinedPayload = existingAssessments.map((a: any) => ({
                                                    categoryId: a.categoryId,
                                                    typeId: a.typeId,
                                                    syllabusId: a.syllabusId,
                                                    part: Number(a.part),
                                                    weight: Number(a.weight),
                                                    completionCriteria: a.completionCriteria || "",
                                                    duration: Number(a.duration || 0),
                                                    questionType: a.questionType || "",
                                                    knowledgeSkill: a.knowledgeSkill || "",
                                                    gradingGuide: a.gradingGuide || "",
                                                    note: a.note || "",
                                                }));
                                                combinedPayload.push(draftMapped);
                                            } else {
                                                combinedPayload = existingAssessments.map((a: any) => {
                                                    if (a.assessmentId === assessment.assessmentId) return draftMapped;
                                                    return {
                                                        categoryId: a.categoryId,
                                                        typeId: a.typeId,
                                                        syllabusId: a.syllabusId,
                                                        part: Number(a.part),
                                                        weight: Number(a.weight),
                                                        completionCriteria: a.completionCriteria || "",
                                                        duration: Number(a.duration || 0),
                                                        questionType: a.questionType || "",
                                                        knowledgeSkill: a.knowledgeSkill || "",
                                                        gradingGuide: a.gradingGuide || "",
                                                        note: a.note || "",
                                                    };
                                                });
                                            }

                                            // 4. Validate
                                            const res = await AssessmentService.validateAssessmentsSyllabus(syllabusId, combinedPayload) as any;
                                            const resData = res?.data || {};
                                            const errorsArray = resData.errors || [];
                                            const isValid = resData.valid === true && errorsArray.length === 0;

                                            setSingleValidationErrors(errorsArray);
                                            setSingleValidationSummary(resData.summary || null);

                                            if (isValid) {
                                                setIsSingleValidated(true);
                                                showToast('Assessment is valid!', 'success');
                                            } else {
                                                setIsSingleValidated(false);
                                                showToast('Validation failed. Please fix the errors.', 'error');
                                            }
                                        } catch (e: any) {
                                            console.error("Validation error:", e);
                                            const errorData = e.data || e.response?.data?.data || e.response?.data || {};
                                            const errorsArray = Array.isArray(errorData) ? errorData : (errorData.errors || []);
                                            setSingleValidationErrors(errorsArray);
                                            setIsSingleValidated(false);
                                            showToast('Validation failed. Please fix the errors.', 'error');
                                        } finally {
                                            setIsSingleValidating(false);
                                        }
                                    }}
                                    disabled={isSingleValidating}
                                    className="flex items-center gap-2 px-10 py-3 text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 min-w-[140px] justify-center text-white bg-blue-500 hover:bg-blue-600 shadow-blue-500/20 hover:scale-[1.03]"
                                >
                                    {isSingleValidating ? <Loader2 size={20} className="animate-spin" /> : <span className="material-symbols-outlined text-[20px]">fact_check</span>}
                                    Validate
                                </button>
                            ) : (
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
                            )}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}

// ── CLO Mapping Tab Component ──
function CloMappingTab({ assessments, subjectClos, mappingStates, onMappingChange }: {
    assessments: AssessmentItem[],
    subjectClos: any[],
    mappingStates: Record<string, string[]>,
    onMappingChange: (assessmentId: string, cloIds: string[]) => void
}) {
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
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-500 text-lg">info</span>
                    <p className="text-[11px] text-slate-500 font-medium">
                        Changes here are temporary. Please click "Save Changes" at the top to persist your mappings.
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── Mapping Row Component (Inline Expandable) ──
function MappingRow({ assessment, subjectClos, selectedCloIds, onSelectionChange }: {
    assessment: AssessmentItem,
    subjectClos: any[],
    selectedCloIds: string[],
    onSelectionChange: (ids: string[]) => void
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <tr
                onClick={() => setIsExpanded(!isExpanded)}
                className={`transition-colors group cursor-pointer ${isExpanded ? 'bg-slate-50' : 'hover:bg-slate-50/50'}`}
            >
                <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-slate-200 text-slate-600' : 'bg-primary-container text-on-primary-container'}`}>
                            <span className="material-symbols-outlined text-lg">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                            </span>
                        </div>
                        <span className="font-bold text-slate-900">{assessment.categoryName} - Part {assessment.part}</span>
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
                                            onClick={() => {
                                                const newIds = isSelected
                                                    ? selectedCloIds.filter(id => id !== clo.cloId)
                                                    : [...selectedCloIds, clo.cloId];
                                                onSelectionChange(newIds);
                                            }}
                                            className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all group ${isSelected
                                                    ? 'bg-white border-emerald-400 ring-1 ring-emerald-100 shadow-sm'
                                                    : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-emerald-50/10'
                                                }`}
                                        >
                                            <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 bg-white'
                                                }`}>
                                                {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                                            </div>
                                            <div className="space-y-1">
                                                <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                    {clo.cloCode}
                                                </p>
                                                <p className={`text-xs leading-relaxed ${isSelected ? 'text-emerald-900' : 'text-slate-600'}`}>
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
// ── Mapping Validation Modal Component ──
function MappingValidationModal({ result, assessments, onClose }: {
    result: any,
    assessments: AssessmentItem[],
    onClose: () => void
}) {
    console.log("📦 Rendering MappingValidationModal with result:", result);
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
                                            const cloId = item.clo_id;
                                            return (
                                                <div key={idx} className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100 flex items-start gap-4 transition-all hover:bg-emerald-50/50">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-xl">link</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 mb-1">
                                                            {ass?.categoryName || 'Assessment'} - Part {ass?.part}
                                                        </p>
                                                        <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                                                            Suggested mapping to CLO. <span style={{ color: (item.confidence_score * 100) < 20 ? '#ef4444' : (item.confidence_score * 100) < 80 ? '#f59e0b' : '#10b981' }}>Confidence Score: <span className="font-bold">{(item.confidence_score * 100).toFixed(0)}%</span></span>
                                                        </p>
                                                        {item.reasoning && (
                                                            <p className="text-[11px] text-slate-500 mt-2 italic bg-white/50 p-2 rounded-lg border border-slate-100">
                                                                "{item.reasoning}"
                                                            </p>
                                                        )}
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
