"use client";

import React, { use, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, store } from '@/store';
import { setSessions, updateSession, removeSession, addSession } from '@/store/slices/syllabusSlice';
import { clearAiProcessingMessage } from '@/store/slices/notificationSlice';
import { Loader2, RefreshCw, Plus, Trash2, CalendarDays, Pencil, Eye } from 'lucide-react';
import { TaskService } from '@/services/task.service';
import { SessionService, SessionItem } from '@/services/session.service';
import { SyllabusService } from '@/services/syllabus.service';
import { RegulationService } from '@/services/regulation.service';
import { CloPloService } from '@/services/cloplo.service';
import { MaterialService, MaterialItem } from '@/services/material.service';
import { MappingService, CloSessionMapping } from '@/services/mapping.service';
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

export default function RevisionSessionsPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const dispatch = useDispatch<AppDispatch>();
    const { showToast } = useToast();
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [isViewOnly, setIsViewOnly] = useState(false);
    const [draftSession, setDraftSession] = useState<SessionItem | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [searchParams, setSearchParams] = useState<any>({});
    
    // DEBUG: dump swagger
    useEffect(() => {
        fetch('/api/dump-swagger').catch(console.error);
    }, []);
    const [previewPage, setPreviewPage] = useState(1);
    const [initialSessionJson, setInitialSessionJson] = useState<string | null>(null);
    const [existingMappings, setExistingMappings] = useState<CloSessionMapping[]>([]);
    const [isValidated, setIsValidated] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
    const [selectedSessions, setSelectedSessions] = useState<number[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [remainingQuotas, setRemainingQuotas] = useState<any[]>([]);
    const [isSingleValidated, setIsSingleValidated] = useState(false);
    const [isSingleValidating, setIsSingleValidating] = useState(false);
    const [singleValidationErrors, setSingleValidationErrors] = useState<any[]>([]);

    const [activeTab, setActiveTab] = useState<'list' | 'mapping'>('list');
    const [mappingStates, setMappingStates] = useState<Record<string, string[]>>({});
    const [isMappingValidating, setIsMappingValidating] = useState(false);
    const [mappingValidationResult, setMappingValidationResult] = useState<any>(null);
    const [isMappingSaving, setIsMappingSaving] = useState(false);
    const [isMappingResultModalOpen, setIsMappingResultModalOpen] = useState(false);

    const { aiProcessingStatus, aiProcessingData, aiProcessingMessage } = useSelector((state: RootState) => state.notification);

    useEffect(() => {
        if (isMappingValidating) {
            if (aiProcessingStatus === "VALIDATE_MAPPING_SUCCESS") {
                setMappingValidationResult(aiProcessingData);
                setIsMappingResultModalOpen(true);
                setIsMappingValidating(false);
                showToast("Mapping validation complete", "success");
                dispatch(clearAiProcessingMessage());
            } else if (aiProcessingStatus === "VALIDATE_MAPPING_FAIL") {
                setIsMappingValidating(false);
                showToast(aiProcessingMessage || "Mapping validation failed", "error");
                dispatch(clearAiProcessingMessage());
            }
        }
    }, [aiProcessingStatus, aiProcessingData, aiProcessingMessage, dispatch, showToast, isMappingValidating]);

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
    });

    const realTask = routeTaskData?.data;
    const syllabusId = realTask?.syllabus?.syllabusId || realTask?.syllabusId;

    // Fetch Revision Request Data (Always enabled for this route)
    const { data: revisionRequest, isLoading: isRevisionLoading } = useRevisionRequest(taskId, true);


    const { data: sessionDataRes, isLoading: isSessionLoading, isFetching: isFetchingSessions, error: sessionError, refetch: refetchSessions } = useQuery({
        queryKey: ['sessions', syllabusId],
        queryFn: () => syllabusId ? SessionService.getSessions(syllabusId, 0, 100) : Promise.reject('No syllabusId'),
        enabled: !!syllabusId
    });

    const { data: regulationsData, isLoading: isRegLoading } = useQuery({
        queryKey: ['regulations'],
        queryFn: () => RegulationService.getRegulations(),
    });

    const { data: syllabusData, isLoading: isSyllabusLoading } = useQuery({
        queryKey: ['syllabus', syllabusId],
        queryFn: () => SyllabusService.getSyllabusById(syllabusId!),
        enabled: !!syllabusId,
    });

    const { data: materialsRes } = useQuery({
        queryKey: ['materials', syllabusId, 'REVISION_REQUESTED'],
        queryFn: () => MaterialService.getMaterialsBySyllabusId(syllabusId!),
        enabled: !!syllabusId,
    });
    const materials = Array.isArray(materialsRes?.data) ? materialsRes.data :
        (Array.isArray((materialsRes?.data as any)?.data) ? (materialsRes?.data as any).data : []);

    const reduxSessions = useSelector((state: RootState) => syllabusId ? state.syllabus.sessionsDB[syllabusId] : undefined);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | null, index: number, number: number } | null>(null);
    const [isExporting, setIsExporting] = useState(false);

    const credit = syllabusData?.data?.credit || syllabusData?.data?.noCredit || 0;
    
    useEffect(() => {
        if (!isSessionLoading && !isFetchingSessions && !isRegLoading && !isSyllabusLoading && syllabusId && syllabusData?.data) {
            
            const rawData = sessionDataRes?.data as any;
            const apiSessions: any[] = Array.isArray(rawData?.content) ? rawData.content : [];

            const finalSessions: SessionItem[] = apiSessions.map(apiSess => {
                // Reconstruct content JSON from material/block mappings
                const selectionStates: any[] = [];
                const materialMap: Record<string, any> = {};

                // ... map material/block mappings logic (simplified but same result)
                apiSess.material?.forEach((m: any) => {
                    materialMap[m.materialId] = {
                        materialId: m.materialId,
                        materialTitle: m.materialName || 'Chapter',
                        blockIds: [],
                        blockNames: []
                    };
                });

                apiSess.block?.forEach((b: any) => {
                    const firstMatId = apiSess.material?.[0]?.materialId;
                    if (firstMatId && materialMap[firstMatId]) {
                        materialMap[firstMatId].blockIds.push(b.blockId);
                        const bName = b.blockName || b.contentText || b.content || 'Selected';
                        materialMap[firstMatId].blockNames.push(bName);
                    }
                });

                Object.values(materialMap).forEach(val => selectionStates.push(val));

                return {
                    sessionId: apiSess.session || apiSess.sessionId,
                    syllabusId,
                    sessionNumber: apiSess.sessionNumber,
                    sessionTitle: apiSess.sessionTitle,
                    teachingMethods: apiSess.teachingMethods,
                    duration: apiSess.duration,
                    content: JSON.stringify(selectionStates),
                    cloIds: apiSess.cloIds || [],
                    sessionTopic: (apiSess.sessionTopic || "").replace(/~/g, '\n'),
                };
            }).sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));

            dispatch(setSessions({ syllabusId, sessions: finalSessions }));
        }
    }, [isSessionLoading, isFetchingSessions, isRegLoading, isSyllabusLoading, sessionDataRes, syllabusId, dispatch, regulationsData, syllabusData]);

    // Calculate recommendation for the hint
    const regs = regulationsData?.data?.content || [];
    const rl1 = regs.find((r: any) => r.code === 'RL1')?.value || 50;
    const rl2 = regs.find((r: any) => r.code === 'RL2')?.value || 15;
    const recommendedMax = Math.ceil((credit * rl2 * 60) / rl1);

    const sessions = reduxSessions || [];
    const isLoading = isTaskLoading || isSessionLoading || isRegLoading || isSyllabusLoading;
    const sessionDuration = sessions[0]?.duration ?? 50;
    const totalHours = Math.round((sessions.length * (typeof sessionDuration === 'number' ? sessionDuration : 50)) / 60);
    const unsavedCount = sessions.filter(s => !s.sessionId).length;
    
    const subjectId = syllabusData?.data?.subjectId;

    const { data: closRes, isLoading: isClosLoading } = useQuery({
        queryKey: ['clos', subjectId],
        queryFn: () => subjectId ? CloPloService.getSubjectClos(subjectId, 0, 100) : null,
        enabled: !!subjectId,
    });

    const clos = closRes?.data?.content || [];

    // Fetch session-specific mappings when editing
    useEffect(() => {
        let isMounted = true;
        const fetchSessionMappings = async () => {
            if (draftSession?.sessionId && editingIndex !== null) {
                try {
                    const res = await MappingService.getSessionMappings(draftSession.sessionId);
                    if (isMounted && res.data) {
                        const dbMappings = res.data;
                        const dbCloIds = dbMappings.map((m: CloSessionMapping) => m.cloId);
                        
                        setExistingMappings(dbMappings);
                        
                        // Sync with draft session if they differ
                        const currentIds = draftSession.cloIds || [];
                        const hasDifference = dbCloIds.length !== currentIds.length || 
                                           dbCloIds.some((id: string) => !currentIds.includes(id));
                        
                        if (hasDifference) {
                            setDraftSession(prev => prev ? { ...prev, cloIds: dbCloIds } : null);
                        }
                    }
                } catch (error) {
                    console.error("Failed to fetch session mappings:", error);
                }
            }
        };
        fetchSessionMappings();
        return () => { isMounted = false; };
    }, [draftSession?.sessionId, editingIndex]);

    // Reset single session validation when form fields change
    useEffect(() => {
        setIsSingleValidated(false);
        setSingleValidationErrors([]);
    }, [draftSession?.sessionNumber, draftSession?.sessionTitle, draftSession?.duration, draftSession?.teachingMethods, draftSession?.sessionTopic, draftSession?.sessionType]);

    const { data: mappingsRes, refetch: refetchMappings } = useQuery({
        queryKey: ['session-mappings', syllabusId],
        queryFn: () => syllabusId ? MappingService.getSyllabusSessionMappings(syllabusId) : null,
        enabled: !!syllabusId,
    });

    // Initialize mapping states from API or sessions
    useEffect(() => {
        if (activeTab === 'mapping' && sessions.length > 0) {
            const newStates = { ...mappingStates };
            
            if (mappingsRes?.data) {
                const apiMappings = mappingsRes.data;
                const grouped: Record<string, string[]> = {};
                apiMappings.forEach((m: CloSessionMapping) => {
                    if (!grouped[m.sessionId]) grouped[m.sessionId] = [];
                    grouped[m.sessionId].push(m.cloId);
                });
                
                sessions.forEach(sess => {
                    if (sess.sessionId) {
                        newStates[sess.sessionId] = grouped[sess.sessionId] || [];
                    }
                });
            } else {
                sessions.forEach(sess => {
                    const sId = sess.sessionId;
                    if (sId && !newStates[sId]) {
                        newStates[sId] = sess.cloIds || [];
                    }
                });
            }
            setMappingStates(newStates);
        }
    }, [activeTab, sessions, mappingsRes?.data]);

    const handleValidateMappings = async () => {
        if (!syllabusId) return;
        setIsMappingValidating(true);
        dispatch(clearAiProcessingMessage());
        try {
            const payload = Object.entries(mappingStates).flatMap(([sessionId, cloIds]) => 
                cloIds.map(cloId => ({ sessionId, cloId }))
            );
            if (payload.length === 0) {
                showToast("Please select at least one mapping to validate.", "error");
                setIsMappingValidating(false);
                return;
            }
            const res: any = await MappingService.validateSessionMappings(syllabusId, payload);
            console.log("[Validate Mapping] Success Response:", res);
            
            if (res?.data && typeof res.data.is_valid !== 'undefined') {
                setMappingValidationResult(res.data);
                setIsMappingResultModalOpen(true);
                setIsMappingValidating(false);
                showToast(res?.message || "Mapping validation complete", "success");
            } else {
                showToast(res?.message || "Validation started. Please wait...", "info");
            }
        } catch (error: any) {
            console.error("[Validate Mapping] Error Response:", error);
            if (error.data?.data && typeof error.data.data.is_valid !== 'undefined') {
                setMappingValidationResult(error.data.data);
                setIsMappingResultModalOpen(true);
                showToast(error.message || error.data?.message || "Validation completed with issues", "warning");
            } else if (error.data && typeof error.data.is_valid !== 'undefined') {
                setMappingValidationResult(error.data);
                setIsMappingResultModalOpen(true);
                showToast(error.message || error.data?.message || "Validation completed with issues", "warning");
            } else {
                const errMsg = error.message || error.data?.message || "Failed to validate mappings";
                showToast(errMsg, "error");
            }
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
                const selectedCloIds = mappingStates[m.sessionId] || [];
                return !selectedCloIds.includes(m.cloId);
            });

            // 2. Identify mappings to ADD
            const additions: { sessionId: string; cloId: string }[] = [];
            Object.entries(mappingStates).forEach(([sessionId, selectedCloIds]) => {
                selectedCloIds.forEach(cloId => {
                    const exists = existingMappings.some(m => m.sessionId === sessionId && m.cloId === cloId);
                    if (!exists) {
                        additions.push({ sessionId, cloId });
                    }
                });
            });

            // 3. Execute Deletions
            if (deletions.length > 0) {
                await Promise.all(deletions.map(m => MappingService.deleteSessionMapping(m.id)));
            }

            // 4. Execute Additions
            if (additions.length > 0) {
                await MappingService.createSessionMappingsBatch(additions);
            }
            
            if (deletions.length > 0 || additions.length > 0) {
                showToast(`Saved successfully (${additions.length} added, ${deletions.length} removed)`, "success");
                queryClient.invalidateQueries({ queryKey: ['session-mappings', syllabusId] });
                refetchSessions();
            } else {
                showToast("No changes to save", "info");
            }
        } catch (error) {
            console.error("❌ Failed to save session mappings:", error);
            showToast("Failed to save mapping changes", "error");
        } finally {
            setIsMappingSaving(false);
        }
    };


    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedSessions(sessions.map(s => s.sessionNumber || 0));
        } else {
            setSelectedSessions([]);
        }
    };

    const handleBulkDeleteSessions = () => {
        if (selectedSessions.length === 0) return;
        setIsBulkDeleteModalOpen(true);
    };

    const handleViewSession = (index: number) => {
        const session = sessions[index];
        setDraftSession({ ...session });
        setInitialSessionJson(JSON.stringify(session));
        setEditingIndex(index);
        setIsViewOnly(true);
        setIsSingleValidated(false);
        setSingleValidationErrors([]);
    };

    const handleCreateNew = () => {
        setIsViewOnly(false);
        const nextSessionNumber = sessions.length > 0 
            ? Math.max(...sessions.map(s => s.sessionNumber || 0)) + 1 
            : 1;

        const newSession: SessionItem = {
            syllabusId: syllabusId || '',
            sessionNumber: nextSessionNumber,
            sessionTitle: `Session ${nextSessionNumber}`,
            teachingMethods: 'Lecture',
            sessionTopic: '',
            sessionType: 'THEORY',
            duration: 50,
            content: '',
            cloIds: []
        };
        
        setDraftSession(newSession);
        setInitialSessionJson(null);
        setEditingIndex(-1); // -1 means creating NEW
        setIsSingleValidated(false);
        setSingleValidationErrors([]);
    };

    const handleDeleteSession = (index: number) => {
        if (!syllabusId) return;
        const session = sessions[index];
        setDeleteConfirm({ 
             id: session.sessionId || null, 
             index, 
             number: session.sessionNumber || index + 1 
        });
    };

    const executeDeleteSession = async () => {
        if (!syllabusId || !deleteConfirm) return;
        const { id, index } = deleteConfirm;

        if (!id) {
            dispatch(removeSession({ syllabusId, index }));
            setDeleteConfirm(null);
            return;
        }

        setIsDeleting(true);
        try {
            await SessionService.deleteSession(id);
            dispatch(removeSession({ syllabusId, index }));
            if (refetchMappings) refetchMappings();
            showToast("Session deleted successfully", "success");
            setDeleteConfirm(null);
        } catch (error: any) {
            showToast(error.message || "Failed to delete session", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCloseModal = () => {
        setEditingIndex(null);
        setDraftSession(null);
        setInitialSessionJson(null);
        setIsSingleValidated(false);
        setSingleValidationErrors([]);
    };

    const hasChanges = initialSessionJson !== JSON.stringify(draftSession);

    if (!taskId) return null;

    if (isLoading && sessions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 size={32} className="animate-spin mb-4" style={{ color: '#41683f' }} />
                <p className="font-medium" style={{ color: '#5a6157' }}>Loading sessions...</p>
            </div>
        );
    }

    const handleExportSessions = async () => {
        if (!syllabusId) return;
        setIsExporting(true);
        try {
            const { SessionService } = await import('@/services/session.service');
            const blob = await SessionService.exportSessions(syllabusId as string);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const syllabusNameStr = syllabusData?.data?.syllabusName || syllabusId;
            a.download = `Syllabus_${syllabusNameStr}_Session.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            showToast("Export sessions successfully", "success");
        } catch (e) {
            console.error("Export error", e);
            showToast("Failed to export sessions", "error");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-0">

            {!isRevisionLoading && revisionRequest && (
                <div className="mb-6">
                    <ReviewerFeedback 
                        reviewer={revisionRequest.reviewer}
                        comments={[{ title: 'Sessions Feedback', content: revisionRequest.commentSession }]}
                    />
                </div>
            )}


            {/* ── Page Header ── */}
            <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                <div>
                    <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Sessions
                    </h1>
                    <p className="text-[12px] font-bold text-zinc-900 flex items-center gap-2">
                        <span>{sessions.length} sessions created</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                        <span>Recommended max: {recommendedMax} sessions</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-400"></span>
                        <span>{credit} credits</span>
                    </p>
                </div>
                <div className="flex gap-4 self-start md:self-end">
                    {activeTab === 'list' && (
                        <>
                            {selectedSessions.length > 0 && (
                                <button
                                    onClick={handleBulkDeleteSessions}
                                    disabled={isDeletingBulk}
                                    className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-red-600 disabled:opacity-50 text-sm shadow-sm"
                                >
                                    {isDeletingBulk ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    Delete Selected ({selectedSessions.length})
                                </button>
                            )}
                            <button
                                onClick={handleExportSessions}
                                disabled={isExporting}
                                className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 border-[#00966d] text-[#00966d] hover:bg-[#00966d]/5 active:bg-[#00966d]/10 disabled:opacity-50"
                            >
                                {isExporting ? <Loader2 size={18} className="animate-spin" /> : <span className="material-symbols-outlined text-[18px]">download</span>}
                                Export
                            </button>
                            <button
                                onClick={() => setIsImportModalOpen(true)}
                                className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 border-[#00966d] text-[#00966d] hover:bg-[#00966d]/5 active:bg-[#00966d]/10"
                            >
                                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                Import File
                            </button>
                            
                            <button
                                onClick={handleCreateNew}
                                className="bg-[#00966d] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#00966d]/20 text-sm"
                            >
                                <Plus size={18} />
                                New Session
                            </button>
                        </>
                    )}
                    {activeTab === 'mapping' && (
                        <>
                            {mappingValidationResult && (
                                <button
                                    onClick={() => {
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
                                {isMappingValidating ? (aiProcessingMessage || "Validating...") : "Validate Mapping"}
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
                    Session List
                    {activeTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"></div>}
                </button>
                <button 
                    onClick={() => {
                        if (sessions.length === 0) {
                            showToast("Please create sessions first before mapping CLOs", "info");
                            return;
                        }
                        setActiveTab('mapping');
                    }}
                    className={`px-8 py-3 font-bold text-sm transition-all relative ${sessions.length === 0 ? 'opacity-50 cursor-not-allowed' : ''} ${activeTab === 'mapping' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    CLO Mapping
                    {activeTab === 'mapping' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(var(--primary-rgb),0.3)]"></div>}
                </button>
            </div>

            <div className={activeTab === 'list' ? 'block' : 'hidden'}>
                <>
                    {/* ── Empty State ── */}
                    {sessions.length === 0 && !isLoading && (
                        <div className="text-center py-24 rounded-2xl" style={{ background: '#ffffff', border: '2px dashed #adb4a8' }}>
                            <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-4 border border-slate-100 text-slate-300">
                                <CalendarDays size={48} />
                            </div>
                            <h3 className="font-bold mt-4 mb-2" style={{ color: '#5a6157', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No Sessions Found</h3>
                            <p className="text-sm mb-6" style={{ color: '#adb4a8' }}>
                                Create your first session manually.<br />
                                <span className="font-bold text-primary-600">Total Credits: {credit}</span>
                            </p>
                            <button
                                onClick={handleCreateNew}
                                className="px-10 py-3 rounded-2xl font-black text-white uppercase tracking-widest text-[10px] shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                                style={{ background: 'linear-gradient(135deg, #41683f 0%, #2d452c 100%)' }}
                            >
                                Create First Session
                            </button>
                        </div>
                    )}

                    {/* ── Editorial Table ── */}
                    {sessions.length > 0 && (
                        <div className="space-y-6">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 border-b border-outline-variant/10">
                                <div className="col-span-1 flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary" 
                                        checked={sessions.length > 0 && selectedSessions.length === sessions.length}
                                        onChange={handleSelectAll}
                                    />
                                    <span>No.</span>
                                </div>
                                <div className="col-span-3">Session Title</div>
                                <div className="col-span-6">Session Topic</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>

                            {/* Scrollable Sessions List Container */}
                            <div className="max-h-[calc(100vh-340px)] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                {sessions.map((session, index) => {
                                    let contentParts: Array<{ heading: string; detail: string }> = [];
                                    if (session.content) {
                                        try {
                                            const parsed = JSON.parse(session.content);
                                            if (Array.isArray(parsed)) {
                                                contentParts = parsed.slice(0, 3).map((item: any) => {
                                                    const mTitle = item.materialTitle || 
                                                                  materials.find((m: MaterialItem) => m.materialId === item.materialId)?.title || 
                                                                  'Section';
                                                    return {
                                                        heading: mTitle,
                                                        detail: (item.blockNames && item.blockNames.length > 0)
                                                            ? item.blockNames.join(', ')
                                                            : (item.blockName || 'Selected')
                                                    };
                                                });
                                            }
                                        } catch {
                                            if (session.content.trim()) {
                                                contentParts = [{ heading: 'Content', detail: session.content.substring(0, 120) }];
                                            }
                                        }
                                    }

                                    return (
                                        <div key={session.sessionId || `local-${index}`}
                                            className="grid grid-cols-12 items-center px-6 py-3 bg-surface-container-lowest rounded-xl hover:shadow-lg hover:shadow-on-surface/5 transition-all group border border-transparent hover:border-primary/10"
                                        >
                                            <div className="col-span-1 flex items-center gap-3 font-black text-sm" style={{ color: '#adb4a8' }}>
                                                <input 
                                                    type="checkbox" 
                                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary" 
                                                    checked={selectedSessions.includes(session.sessionNumber || 0)}
                                                    onChange={(e) => {
                                                        const no = session.sessionNumber || 0;
                                                        if (e.target.checked) {
                                                            setSelectedSessions([...selectedSessions, no]);
                                                        } else {
                                                            setSelectedSessions(selectedSessions.filter(s => s !== no));
                                                        }
                                                    }}
                                                />
                                                <span>{session.sessionNumber}</span>
                                            </div>
                                            <div className="col-span-3">
                                                <h4 className="text-sm font-black leading-tight uppercase tracking-tight" style={{ color: '#2d342b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                    {session.sessionTitle || `Session ${session.sessionNumber}`}
                                                </h4>
                                                <div className="flex items-center gap-2 mt-1" style={{ color: '#5a6157' }}>
                                                    <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-[9px] font-black uppercase tracking-widest">{session.teachingMethods || 'Lecture'}</span>
                                                    <span className="text-[9px] font-bold text-slate-400">• {session.duration || 50} MIN</span>
                                                </div>
                                            </div>
                                            <div className="col-span-6 pr-8">
                                                {session.sessionTopic ? (
                                                    <p className="text-sm line-clamp-3" style={{ color: 'rgba(90,97,87,0.8)' }}>
                                                        {session.sessionTopic}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm italic" style={{ color: '#adb4a8' }}>No topic assigned yet.</p>
                                                )}
                                            </div>
                                            <div className="col-span-2 flex items-center justify-end gap-1.5">
                                                <button onClick={() => handleViewSession(index)}
                                                    className="h-8 px-2 flex items-center justify-center rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-all duration-200"
                                                    title="View Session"
                                                >
                                                    <Eye size={13} strokeWidth={2.5} className="mr-1" />
                                                    <span className="text-[10px] font-bold">View</span>
                                                </button>
                                                <button onClick={() => handleDeleteSession(index)}
                                                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
                                                    title="Delete Session"
                                                >
                                                    <Trash2 size={13} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </>
            </div>

            <div className={activeTab === 'mapping' ? 'block' : 'hidden'}>
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SessionMappingTab 
                        sessions={sessions} 
                        subjectClos={clos}
                        mappingStates={mappingStates}
                        onMappingChange={(sessionId, cloIds) => setMappingStates(prev => ({ ...prev, [sessionId]: cloIds }))}
                        validationResult={mappingValidationResult}
                    />
                </div>
            </div>

            {/* ── Mapping Validation Modal ── */}
            {isMappingResultModalOpen && mappingValidationResult && (
                <SessionMappingValidationModal 
                    result={mappingValidationResult}
                    sessions={sessions}
                    clos={clos}
                    onClose={() => setIsMappingResultModalOpen(false)}
                />
            )}



            {/* ── Edit Session Modal ── */}
            {editingIndex !== null && draftSession && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/50 animate-in fade-in duration-200">
                    <div className="absolute inset-0" onClick={handleCloseModal}></div>

                    {/* Modal Container */}
                    <div className="relative bg-white w-full max-w-4xl max-h-[95vh] rounded-2xl flex flex-col overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] border border-slate-200">
                        {/* Modal Header */}
                        <header className="px-8 py-6 flex justify-between items-start bg-slate-50 border-b border-slate-100">
                            <div className="space-y-1">
                                    <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {draftSession.sessionId ? (isViewOnly ? `View Session ${String(draftSession.sessionNumber).padStart(2, '0')}` : `Edit Session ${String(draftSession.sessionNumber).padStart(2, '0')}`) : 'Create New Session'}
                                    </h2>
                            </div>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 rounded-full transition-colors group">
                                <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-600">close</span>
                            </button>
                        </header>

                        {/* Modal Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            {singleValidationErrors.length > 0 && singleValidationErrors[0]?.errors?.length > 0 && (
                                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-start gap-3">
                                    <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                                    <div>
                                        <h4 className="font-bold text-sm">Validation Errors</h4>
                                        <p className="text-xs mb-2">Please fix these errors before saving.</p>
                                        <ul className="text-xs list-disc list-inside space-y-1">
                                            {singleValidationErrors[0]?.errors?.map((err: any, idx: number) => (
                                                <li key={idx}>{err.errorMessage || err.message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <section className="grid grid-cols-4 gap-x-6 gap-y-8 mb-8">
                                <div className="col-span-1 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Session No.</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden text-center font-bold disabled:opacity-70"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        placeholder="0"
                                        value={draftSession.sessionNumber || ''}
                                        onChange={e => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setDraftSession(prev => prev ? { ...prev, sessionNumber: val === '' ? 0 : Number(val) } : null);
                                        }}
                                    />
                                </div>
                                <div className="col-span-3 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Session Title</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden disabled:opacity-70"
                                        type="text"
                                        value={draftSession.sessionTitle || ''}
                                        onChange={e => setDraftSession(prev => prev ? { ...prev, sessionTitle: e.target.value } : null)}
                                    />
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Duration (Mins)</label>
                                    <input
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden disabled:opacity-70"
                                        type="number"
                                        value={draftSession.duration}
                                        onChange={e => setDraftSession(prev => prev ? { ...prev, duration: Number(e.target.value) } : null)}
                                        disabled={isViewOnly}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Teaching Method</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden appearance-none cursor-pointer disabled:opacity-70"
                                            value={draftSession.teachingMethods}
                                            onChange={e => setDraftSession(prev => prev ? { ...prev, teachingMethods: e.target.value } : null)}
                                        >
                                            <option value="Lecture">Lecture</option>
                                            <option value="Laboratory">Laboratory</option>
                                            <option value="Seminar">Seminar</option>
                                            <option value="Workshop">Workshop</option>
                                            <option value="Case Study">Case Study</option>
                                            <option value="Project-based">Project-based</option>
                                            <option value="Self-study">Self-study</option>
                                        </select>
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg pointer-events-none">school</span>
                                    </div>
                                </div>
                                <div className="col-span-1 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Session Type</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden appearance-none cursor-pointer disabled:opacity-70"
                                            value={draftSession.sessionType || 'THEORY'}
                                            onChange={e => setDraftSession(prev => prev ? { ...prev, sessionType: e.target.value } : null)}
                                        >
                                            <option value="THEORY">Theory</option>
                                            <option value="PRACTICE">Practice</option>
                                            <option value="SELF_STUDY">Self Study</option>
                                        </select>
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 text-lg pointer-events-none">category</span>
                                    </div>
                                </div>
                                <div className="col-span-4 space-y-2">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Session Topic</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all outline-hidden resize-none h-24 disabled:opacity-70"
                                        placeholder="Enter the detailed topic for this session..."
                                        value={draftSession.sessionTopic || ''}
                                        onChange={e => setDraftSession(prev => prev ? { ...prev, sessionTopic: e.target.value } : null)}
                                    />
                                </div>
                            </section>

                            {/* Content Section Restored */}
                            <section className="flex flex-col gap-2 pt-6 mt-4 border-t border-slate-200">
                                <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><span className="material-symbols-outlined text-primary">view_quilt</span> Content Summary</h3>
                                <textarea
                                    className="bg-white border-2 border-slate-200 rounded-lg px-4 py-3 h-32 resize-none focus:ring-2 focus:ring-primary/20 transition-colors focus:border-primary placeholder-slate-400 outline-none"
                                    placeholder="Enter session content summary..."
                                    value={draftSession.content || ''}
                                    onChange={(e) => setDraftSession(prev => prev ? { ...prev, content: e.target.value } : null)}
                                />
                            </section>

                            {/* CLO Mappings section removed per new design */}
                        </div>

                        {/* Modal Footer Actions */}
                        <footer className="px-8 py-6 border-t border-slate-100 bg-white">
                            <div className="flex items-center justify-end">
                                <div className="flex gap-3">
                                    <button onClick={handleCloseModal}
                                        className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                                        {isViewOnly ? 'Close' : 'Cancel'}
                                    </button>

                                {!isViewOnly && (
                                <button 
                                    onClick={async () => {
                                        if (!draftSession || !syllabusId) return;
                                        setIsSaving(true);
                                        try {
                                            const { SessionService } = await import('@/services/session.service');
                                            
                                            const basePayload = {
                                                syllabusId,
                                                sessionNumber: Number(draftSession.sessionNumber),
                                                sessionTitle: draftSession.sessionTitle || `Session ${draftSession.sessionNumber}`,
                                                teachingMethods: draftSession.teachingMethods || "Lecture",
                                                sessionTopic: draftSession.sessionTopic?.replace(/\n/g, '~') || "General Topic",
                                                sessionType: draftSession.sessionType || "THEORY",
                                                duration: Number(draftSession.duration || 50),
                                            };

                                            let res: any = null;
                                            if (draftSession.sessionId) {
                                                // UPDATE (PUT)
                                                await SessionService.updateSession(draftSession.sessionId, basePayload);
                                                // SUCCESS: Update Redux
                                                dispatch(updateSession({ 
                                                    syllabusId, 
                                                    index: editingIndex, 
                                                    updates: draftSession 
                                                }));
                                            } else {
                                                // CREATE (POST)
                                                res = await SessionService.createSession(basePayload) as any;
                                                
                                                if (res?.data?.sessionId || (Array.isArray(res?.data) && res.data[0]?.sessionId)) {
                                                    const sessionId = res.data.sessionId || res.data[0].sessionId;
                                                    const createdSession = { ...draftSession, sessionId };
                                                    dispatch(addSession({ syllabusId, session: createdSession }));
                                                }
                                            }

                                            // Force list sorting after save by reading current state and dispatching sorted version
                                            setTimeout(() => {
                                                const currentState = store.getState() as RootState;
                                                const currentSessions = currentState.syllabus.sessionsDB[syllabusId as string] || [];
                                                const sortedSessions = [...currentSessions].sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));
                                                dispatch(setSessions({ syllabusId: syllabusId as string, sessions: sortedSessions }));
                                                refetchSessions();
                                                if (refetchMappings) refetchMappings();
                                            }, 100);

                                            showToast("Session saved successfully!", "success");
                                            handleCloseModal();
                                        } catch (e: any) {
                                            console.error("Save error:", e);
                                            // Try to parse validation errors from backend
                                            if (e?.response?.data?.data?.errors?.length > 0) {
                                                const msg = e.response.data.data.errors[0].errors[0]?.errorMessage || "Validation error";
                                                showToast(msg, "error");
                                            } else {
                                                const msg = e.message || "Failed to save session";
                                                showToast(msg, "error");
                                            }
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="flex items-center gap-2 px-10 py-3 text-sm font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 min-w-[140px] justify-center text-white bg-primary shadow-primary/20 hover:scale-[1.03] active:scale-95"
                                >
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
            )}

            {/* ── Delete Confirmation Modal ── */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
                            <span className="material-symbols-outlined text-3xl">warning</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Session {deleteConfirm.number}?</h3>
                            <p className="text-sm text-slate-500">
                                Are you sure you want to delete this session? This action cannot be undone.
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
                                onClick={executeDeleteSession} 
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


            {/* Custom Import & Preview Modal for Sessions */}
            {(isImportModalOpen || isPreviewOpen) && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => { if(!isSaving) { setIsImportModalOpen(false); setIsPreviewOpen(false); } }}
                    />
                    
                    <div 
                        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
                    >
                        <div className="p-8 pb-4 flex justify-between items-center border-b border-outline-variant/20">
                            <div>
                                <h2 className="text-2xl font-black text-[#2d342b]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {isPreviewOpen ? 'Preview Sessions' : 'Import Sessions'}
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
                                                { header: 'Session Number', key: 'sessionNumber', width: 16 },
                                                { header: 'Title', key: 'title', width: 35 },
                                                { header: 'Teaching Methods', key: 'teachingMethods', width: 22 },
                                                { header: 'Topic', key: 'topic', width: 25 },
                                                { header: 'Type', key: 'type', width: 15 },
                                                { header: 'CLO-Mapping', key: 'cloMapping', width: 20 },
                                            ];

                                            worksheet.addRow({ sessionNumber: 1, title: 'Introduction to Computer Science', teachingMethods: 'Lecture', topic: 'Intro', type: 'THEORY', cloMapping: 'CLO1, CLO2' });
                                            worksheet.addRow({ sessionNumber: 2, title: 'Data Structures', teachingMethods: 'Laboratory', topic: 'Arrays', type: 'PRACTICE', cloMapping: 'CLO2' });
                                            worksheet.addRow({ sessionNumber: 3, title: 'Assignment Review', teachingMethods: 'Self-study', topic: 'Review', type: 'SELF_STUDY', cloMapping: '' });

                                            worksheet.getRow(1).font = { bold: true };
                                            worksheet.getRow(1).fill = {
                                                type: 'pattern',
                                                pattern: 'solid',
                                                fgColor: { argb: 'FFD9D2E9' }
                                            };
                                            worksheet.getRow(1).alignment = { horizontal: 'center' };

                                            for (let i = 2; i <= 200; i++) {
                                                worksheet.getCell(`C${i}`).dataValidation = {
                                                    type: 'list',
                                                    allowBlank: true,
                                                    formulae: ['"Lecture,Laboratory,Seminar,Workshop,Case Study,Project-based,Self-study"']
                                                };
                                                worksheet.getCell(`E${i}`).dataValidation = {
                                                    type: 'list',
                                                    allowBlank: true,
                                                    formulae: ['"THEORY,PRACTICE,SELF_STUDY"']
                                                };
                                                worksheet.getCell(`A${i}`).alignment = { horizontal: 'center' };
                                            }

                                            const buffer = await workbook.xlsx.writeBuffer();
                                            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                                            saveAs(blob, 'Sessions_Template.xlsx');
                                        }}
                                        className="px-4 py-2 font-bold text-xs bg-primary/10 text-primary border border-primary/20 rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                        Download Template
                                    </button>
                                )}
                                <button 
                                    onClick={() => { if(!isSaving) { setIsImportModalOpen(false); setIsPreviewOpen(false); } }}
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
                                    onClick={() => {
                                        const el = document.getElementById('excel-upload-hidden');
                                        if (el) el.click();
                                    }}
                                >
                                    <input
                                        id="excel-upload-hidden"
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if(!file) return;
                                            setImportFile(file);
                                            
                                            try {
                                                const data = await file.arrayBuffer();
                                                const workbook = XLSX.read(data, { type: 'array' });
                                                const firstSheetName = workbook.SheetNames[0];
                                                const worksheet = workbook.Sheets[firstSheetName];
                                                const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                                                const rows = rawRows.filter((r: any) => {
                                                    const hasData = Object.keys(r).some((k: any) => r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== '');
                                                    if (!hasData) return false;
                                                    const title = String(r['Title'] || r['title'] || '').trim();
                                                    const topic = String(r['Topic'] || r['topic'] || '').trim();
                                                    // Require at least a title or a topic to consider it a valid session row
                                                    if (!title && !topic) return false;
                                                    return true;
                                                });

                                                if (!syllabusId) return;

                                                const subjectClosList = clos || [];

                                                const parsedSessions = rows.map((row: any, index) => {
                                                    const rawNumber = Number(row['Session Number'] || row['sessionNumber'] || row['Session'] || row['session'] || (index + 1));
                                                    const rawTitle = String(row['Title'] || row['title'] || '').trim();
                                                    const rawMethods = String(row['Teaching Methods'] || row['teachingMethods'] || row['Methods'] || '').trim();
                                                    const rawTopic = String(row['Topic'] || row['topic'] || '').trim();
                                                    const rawType = String(row['Type'] || row['type'] || '').trim().toUpperCase();
                                                    
                                                    // Robustly find CLO-Mapping key ignoring spaces, dashes, newlines
                                                    const cloKey = Object.keys(row).find(k => k.replace(/[\s\r\n\-_]/g, '').toLowerCase() === 'clomapping');
                                                    const rawCloMapping = cloKey ? String(row[cloKey]).trim() : '';

                                                    return {
                                                        _rowNum: index + 1,
                                                        syllabusId,
                                                        sessionNumber: rawNumber,
                                                        sessionTitle: rawTitle,
                                                        teachingMethods: rawMethods,
                                                        sessionTopic: rawTopic,
                                                        sessionType: rawType,
                                                        cloMapping: rawCloMapping,
                                                        content: "[]",
                                                        _importErrors: [],
                                                    };
                                                });
                                                setPreviewData(parsedSessions);
                                                setPreviewPage(1);
                                                setIsValidated(false);
                                                setValidationErrors([]);
                                                setRemainingQuotas([]);
                                                setIsImportModalOpen(false);
                                                setIsPreviewOpen(true);
                                            } catch (error) {
                                                console.error(error);
                                                showToast('Failed to parse Excel file', 'error');
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                    <div className="w-20 h-20 rounded-full bg-primary border-4 border-primary/20 flex items-center justify-center text-white mb-4 shadow-lg shadow-primary/20">
                                        <span className="material-symbols-outlined text-[36px]">upload_file</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-on-surface mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        Click or drag Excel file here
                                    </h3>
                                    <p className="text-sm font-medium text-on-surface-variant">
                                        Supports .xlsx, .xls
                                    </p>
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
                                                    if(document.getElementById('excel-upload-hidden')) {
                                                        (document.getElementById('excel-upload-hidden') as any).value = '';
                                                    }
                                                }}
                                                className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">delete</span> Delete & Upload New
                                            </button>
                                            
                                        </div>
                                    </div>
                                    
                                    

                                    {saveError && (
                                        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 p-3 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-1">
                                            <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                                            <div className="flex-1">
                                                <ul className="text-xs font-medium list-disc list-outside ml-3 space-y-1">
                                                    {saveError.split('\n').map((err, i) => (
                                                        <li key={i}>{err}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-auto border border-outline-variant/20 rounded-xl bg-white shadow-sm max-h-[50vh]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-surface-container-lowest sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap w-20">Session</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 min-w-[200px]">Title</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 min-w-[150px]">Methods</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 min-w-[200px]">Topic</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 min-w-[120px]">Type</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 min-w-[150px]">CLO-Mapping</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/10">
                                                {previewData.slice((previewPage - 1) * 10, previewPage * 10).map((item, idx) => {
                                                    const realIdx = (previewPage - 1) * 10 + idx;
                                                    const hasError = item._importErrors && item._importErrors.length > 0;
                                                    const hasWarning = item._importWarnings && item._importWarnings.length > 0;
                                                    
                                                    return (
                                                        <React.Fragment key={idx}>
                                                            <tr className={`group transition-colors ${hasError ? 'bg-amber-50/70 hover:bg-amber-100/70' : hasWarning ? 'bg-amber-50/70 hover:bg-amber-100/70' : 'hover:bg-primary/5'}`}>
                                                                <td className="px-4 py-3 font-medium text-slate-700 text-center relative">
                                                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${hasError ? 'bg-amber-100 text-amber-700' : hasWarning ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{item.sessionNumber}</span>
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
                                                                <td className="px-4 py-3 font-bold text-slate-800">
                                                                    <div title={String(item.sessionTitle || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.sessionTitle || ""}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 text-xs">
                                                                    <div title={String(item.teachingMethods || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.teachingMethods || ""}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 text-xs">
                                                                    <div title={String(item.sessionTopic || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.sessionTopic || ""}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 text-xs">
                                                                    <div title={String(item.sessionType || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.sessionType || ""}</div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-600 text-xs">
                                                                    <div title={String(item.cloMapping || "")} className="w-full px-1 py-0.5 text-xs opacity-80 whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{item.cloMapping || ""}</div>
                                                                </td>
                                                            </tr>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {previewData.length > 10 && (
                                        <div className="flex justify-between items-center mt-4 px-2">
                                            <span className="text-xs font-medium text-slate-400">
                                                Showing {((previewPage - 1) * 10) + 1} to {Math.min(previewPage * 10, previewData.length)} of {previewData.length} entries
                                            </span>
                                            <div className="flex gap-1 items-center">
                                                <button
                                                    disabled={previewPage === 1}
                                                    onClick={() => setPreviewPage(p => Math.max(1, p - 1))}
                                                    className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                                                </button>
                                                <div className="flex gap-1 mx-2 overflow-x-auto max-w-[200px] custom-scrollbar py-1">
                                                    {Array.from({ length: Math.ceil(previewData.length / 10) }).map((_, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => setPreviewPage(i + 1)}
                                                            className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-bold transition-all shadow-sm ${previewPage === i + 1 ? 'bg-primary text-white scale-110 shadow-primary/30' : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button
                                                    disabled={previewPage === Math.ceil(previewData.length / 10)}
                                                    onClick={() => setPreviewPage(p => Math.min(Math.ceil(previewData.length / 10), p + 1))}
                                                    className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {isPreviewOpen && (
                            <div className="p-6 bg-surface-container flex justify-end gap-4 border-t border-outline-variant/20">
                                <button 
                                    onClick={() => { setIsPreviewOpen(false); setPreviewData([]); setSaveError(null); setIsImportModalOpen(true); }}
                                    className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant bg-white border border-outline-variant/30 hover:bg-outline-variant/10 transition-colors"
                                >
                                    Back
                                </button>
                                <button 
                                    disabled={isSaving}
                                    onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            const { SessionService } = await import('@/services/session.service');
                                            
                                            if (!syllabusId || !subjectId || !importFile) return;
                                            const res = await SessionService.importSessions(syllabusId, subjectId, importFile) as any;
                                            if (res && res.data && !res.data.valid) {
                                                const err = new Error('Validation failed or import errors occurred.') as any;
                                                err.data = res;
                                                throw err;
                                            }

                                            showToast(`Successfully saved ${previewData.length} sessions`, 'success');
                                            
                                            setTimeout(() => {
                                                refetchSessions();
                                                if (refetchMappings) refetchMappings();
                                            }, 500);

                                            setIsPreviewOpen(false);
                                            setPreviewData([]);
                                            setIsSaving(false);
                                            setSaveError(null);
                                            setIsSaving(false);
                                            setSaveError(null);
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
                                                 if (globalErrs.length > 0) {
                                                     setSaveError(globalErrs.map((e: any) => e.message).join("\n"));
                                                 }
                                                 
                                                 showToast(errorData?.message || 'Validation failed or import errors occurred.', 'error');
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
                                                 const errMsg = error.message || 'Failed to save sessions';
                                                 setSaveError(errMsg);
                                                 showToast(errMsg, 'error');
                                            }
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    className={`px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-white shadow-lg hover:scale-[1.02] active:scale-95 ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    style={{ background: '#41683f' }}
                                >
                                    {isSaving ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">save</span>}
                                    Confirm & Save
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

        {/* ── Bulk Delete Confirmation Modal ── */}
        {isBulkDeleteModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="mx-auto w-20 h-20 bg-red-50 text-red-500 rounded-[24px] flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-4xl">warning</span>
                    </div>
                    <div className="text-center space-y-2 mb-8">
                        <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Delete Selected Items?</h3>
                        <p className="text-sm text-slate-500 font-medium">
                            Are you sure you want to delete {selectedSessions.length} selected item(s)? This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={async () => {
                                setIsBulkDeleteModalOpen(false);
                                setIsDeletingBulk(true);
                                try {
                                    const sessionsToDelete = sessions.filter(s => selectedSessions.includes(s.sessionNumber || 0));
                                    const remoteSessionNumbers = sessionsToDelete.filter(s => s.sessionId).map(s => s.sessionNumber || 0);

                                    if (remoteSessionNumbers.length > 0 && syllabusId) {
                                        await SessionService.batchDeleteSessions(syllabusId, remoteSessionNumbers);
                                    }

                                    const updatedSessions = sessions.filter(s => !selectedSessions.includes(s.sessionNumber || 0));
                                    dispatch(setSessions({ syllabusId: syllabusId as string, sessions: updatedSessions }));
                                    setSelectedSessions([]);
                                    showToast(`Successfully deleted ${selectedSessions.length} session(s).`, "success");
                                    refetchSessions();
                                    refetchMappings();
                                } catch (error) {
                                    console.error("Failed to bulk delete sessions:", error);
                                    showToast("Failed to delete sessions. Please try again.", "error");
                                } finally {
                                    setIsDeletingBulk(false);
                                }
                            }}
                            className="w-full bg-red-500 text-white font-bold py-3.5 rounded-2xl hover:bg-red-600 transition-all active:scale-[0.98] shadow-lg shadow-red-500/25"
                        >
                            Yes, delete
                        </button>
                        <button
                            onClick={() => setIsBulkDeleteModalOpen(false)}
                            className="w-full bg-slate-100 text-slate-700 font-bold py-3.5 rounded-2xl hover:bg-slate-200 transition-all active:scale-[0.98]"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
        </div>
    );
}

// ── Session Mapping Tab Component ──
function SessionMappingTab({ sessions, subjectClos, mappingStates, onMappingChange, validationResult }: { 
    sessions: SessionItem[], 
    subjectClos: any[],
    mappingStates: Record<string, string[]>,
    onMappingChange: (sessionId: string, cloIds: string[]) => void,
    validationResult?: any
}) {
    return (
        <div className="bg-white border border-zinc-100 rounded-[32px] overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 px-8 py-5 bg-slate-50/50 border-b border-zinc-100 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="col-span-1">No.</div>
                <div className="col-span-4">Session Detail</div>
                <div className="col-span-6">Mapped CLOs</div>
                <div className="col-span-1 text-right">Status</div>
            </div>
            <div className="divide-y divide-zinc-50">
                {sessions.map((session, idx) => (
                    <SessionMappingRow 
                        key={session.sessionId || idx}
                        session={session}
                        subjectClos={subjectClos}
                        selectedCloIds={mappingStates[session.sessionId || ''] || []}
                        onChange={(cloIds) => onMappingChange(session.sessionId || '', cloIds)}
                        validationResult={validationResult}
                    />
                ))}
            </div>
        </div>
    );
}

// ── Session Mapping Row Component ──
function SessionMappingRow({ session, subjectClos, selectedCloIds, onChange, validationResult }: { 
    session: SessionItem, 
    subjectClos: any[],
    selectedCloIds: string[],
    onChange: (cloIds: string[]) => void,
    validationResult?: any
}) {
    const [isExpanded, setIsExpanded] = useState(false);

    const suggestionsForThisSession = validationResult?.data?.filter((d: any) => d.session_id === session.sessionId && (d.confidence_score === undefined || d.confidence_score < 0.8)) || [];
    const suggestedCloCodes = suggestionsForThisSession.flatMap((d: any) => {
        const match = d.reasoning ? d.reasoning.match(/\[Suggested alternative: (.*?)\]/i) : null;
        if (match) {
            const extracted = match[1].match(/CLO\d+/gi);
            return extracted ? extracted.map((s: string) => s.toUpperCase()) : [];
        }
        return [];
    });
    const suggestedCloCodesStr = suggestedCloCodes.join(', ');

    return (
        <div className={`transition-all border-l-4 ${suggestionsForThisSession.length > 0 ? 'bg-amber-50/50 hover:bg-amber-100/50 border-amber-400' : isExpanded ? 'bg-primary/5 ring-1 ring-inset ring-primary/10 border-transparent' : 'hover:bg-slate-50/50 border-transparent'}`}>
            <div 
                className="grid grid-cols-12 px-8 py-5 items-center cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="col-span-1 font-black text-slate-400">
                    {session.sessionNumber}
                </div>
                <div className="col-span-4">
                    <h4 className="text-sm font-bold text-slate-800 mb-0.5">{session.sessionTitle}</h4>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{session.teachingMethods} • {session.duration} MIN</p>
                </div>
                <div className="col-span-6 flex flex-wrap gap-1.5 items-center">
                    {selectedCloIds.length > 0 ? (
                        selectedCloIds.map(id => {
                            const clo = subjectClos.find(c => c.cloId === id);
                            return (
                                <span key={id} className="px-2 py-1 bg-white border border-zinc-200 rounded-lg text-[10px] font-bold text-slate-600 shadow-sm">
                                    {clo?.cloCode || 'CLO'}
                                </span>
                            );
                        })
                    ) : (
                        <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            No CLOs mapped
                        </span>
                    )}
                    {suggestedCloCodesStr && (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 ml-2">
                            <span className="material-symbols-outlined text-[14px] text-amber-500">auto_awesome</span>
                            <span className="text-[10px] font-bold tracking-wide">
                                Suggested: {suggestedCloCodesStr}
                            </span>
                        </div>
                    )}
                </div>
                <div className="col-span-1 flex justify-end">
                    <span className={`material-symbols-outlined transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : 'text-slate-300'}`}>
                        expand_more
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="px-8 pb-8 pt-2 animate-in slide-in-from-top-2 duration-300">
                    <div className="bg-white/80 backdrop-blur-sm border border-primary/10 rounded-2xl p-6 shadow-inner">
                        <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">checklist</span>
                            Select Course Learning Outcomes
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {subjectClos.map(clo => {
                                const isSelected = selectedCloIds.includes(clo.cloId);
                                const isSuggested = suggestedCloCodes.includes(clo.cloCode);
                                
                                return (
                                    <label 
                                        key={clo.cloId}
                                        className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer group w-full
                                            ${isSelected 
                                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/5' 
                                                : isSuggested
                                                    ? 'border-blue-300 bg-blue-50/30 hover:bg-blue-50/50 shadow-sm shadow-blue-500/5'
                                                    : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <input 
                                            type="checkbox"
                                            className={`mt-1 w-4 h-4 rounded transition-all ${isSelected ? 'border-primary text-primary focus:ring-primary' : isSuggested ? 'border-blue-300 text-blue-500 focus:ring-blue-500' : 'border-slate-300 text-primary focus:ring-primary'}`}
                                            checked={isSelected}
                                            onChange={(e) => {
                                                const newIds = e.target.checked 
                                                    ? [...selectedCloIds, clo.cloId]
                                                    : selectedCloIds.filter(id => id !== clo.cloId);
                                                onChange(newIds);
                                            }}
                                        />
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1 w-full">
                                                <p className={`text-xs font-black transition-colors ${isSelected ? 'text-primary' : isSuggested ? 'text-blue-700' : 'text-slate-500'}`}>
                                                    {clo.cloCode}
                                                </p>
                                                {isSuggested && (
                                                    <span className="text-[9px] font-bold uppercase tracking-widest bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1 shrink-0">
                                                        <span className="material-symbols-outlined text-[10px]">auto_awesome</span> Suggested
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-[11px] font-medium leading-relaxed line-clamp-2 ${isSelected ? 'text-slate-700' : isSuggested ? 'text-blue-800' : 'text-slate-600'}`}>
                                            {clo.description}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Session Mapping Validation Modal Component ──
function SessionMappingValidationModal({ result, sessions, clos, onClose }: { 
    result: any, 
    sessions: SessionItem[],
    clos: any[],
    onClose: () => void 
}) {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div 
                className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
                <div className={`p-8 ${result.is_valid ? 'bg-emerald-50' : 'bg-amber-50'} border-b border-zinc-100`}>
                    <div className="flex justify-between items-start">
                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${result.is_valid ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'}`}>
                                <span className="material-symbols-outlined text-2xl">
                                    {result.is_valid ? 'verified' : 'report_problem'}
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
                                            const sess = sessions.find(s => s.sessionId === item.session_id);
                                            return (
                                                <div key={idx} className="bg-emerald-50/30 rounded-2xl p-4 border border-emerald-100 flex items-start gap-4 transition-all hover:bg-emerald-50/50">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-xl">link</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 mb-1">
                                                            Session {sess?.sessionNumber}: {sess?.sessionTitle || 'Session'}
                                                        </p>
                                                        <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                                                            AI Validation Result: <span className="font-bold">{clos.find(c => c.cloId === item.clo_id)?.cloCode || 'CLO'}</span>. <span style={{ color: (item.confidence_score * 100) < 50 ? '#ef4444' : (item.confidence_score * 100) < 80 ? '#f59e0b' : '#10b981' }}>Confidence Score: <span className="font-bold">{(item.confidence_score * 100).toFixed(0)}%</span></span>
                                                        </p>
                                                        
                                                        {(() => {
                                                            const match = item.reasoning ? item.reasoning.match(/\[Suggested alternative: (.*?)\]/i) : null;
                                                            const suggestion = match ? match[1] : null;
                                                            const cleanReasoning = item.reasoning ? item.reasoning.replace(/\s*\[Suggested alternative: .*?\]/i, '').trim() : '';
                                                            return (
                                                                <>
                                                                    {cleanReasoning && (
                                                                        <p className="text-[11px] text-slate-500 mt-2 italic bg-white/50 p-2 rounded-lg border border-slate-100">
                                                                            "{cleanReasoning}"
                                                                        </p>
                                                                    )}
                                                                    {suggestion && (
                                                                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100/50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
                                                                            <span className="material-symbols-outlined text-[14px]">lightbulb</span>
                                                                            Suggested: {suggestion}
                                                                        </div>
                                                                    )}
                                                                </>
                                                            );
                                                        })()}

                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

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

                            {result.unmapped_sessions?.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">calendar_today</span>
                                        Unmapped Sessions ({result.unmapped_sessions.length})
                                    </h4>
                                    <div className="grid gap-3">
                                        {result.unmapped_sessions.map((item: any) => {
                                            const sess = sessions.find(s => s.sessionId === item.session_id);
                                            return (
                                                <div key={item.session_id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-start gap-4">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 font-bold text-xs">
                                                        {sess?.sessionNumber || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-900 mb-1">
                                                            {item.chapter_title || sess?.sessionTitle || 'Session'}
                                                        </p>
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

                            {(!result.unmapped_clos?.length && !result.unmapped_sessions?.length && !result.data?.length) && (
                                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-slate-50 rounded-[32px] border border-slate-100">
                                    <div className="w-16 h-16 rounded-full bg-white text-slate-400 flex items-center justify-center mb-2 shadow-sm">
                                        <span className="material-symbols-outlined text-3xl">info</span>
                                    </div>
                                    <div className="max-w-xs px-6">
                                        <p className="text-sm font-bold text-slate-900">Validation Info</p>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                                            The validation completed with suggestions, but no specific gaps were detailed in the response.
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
                                    Your session mapping is complete and aligns with all learning outcomes. No gaps detected.
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
