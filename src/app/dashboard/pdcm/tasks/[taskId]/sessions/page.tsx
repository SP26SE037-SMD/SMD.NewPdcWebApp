"use client";

import React, { use, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, store } from '@/store';
import { setSessions, updateSession, removeSession, addSession } from '@/store/slices/syllabusSlice';
import { Loader2, RefreshCw, Plus, Trash2, CalendarDays, Pencil, Eye } from 'lucide-react';
import { TaskService } from '@/services/task.service';
import { SessionService, SessionItem } from '@/services/session.service';
import { SyllabusService } from '@/services/syllabus.service';
import { RegulationService } from '@/services/regulation.service';
import { CloPloService } from '@/services/cloplo.service';
import { MaterialService, MaterialItem } from '@/services/material.service';
import { MappingService, CloSessionMapping } from '@/services/mapping.service';
import { SessionContentSelector } from './session-content-selector';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
import * as XLSX from 'xlsx';

interface ApiResponse<T> {
    status: number;
    message: string;
    data: T;
}

export default function SessionsPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const dispatch = useDispatch<AppDispatch>();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draftSession, setDraftSession] = useState<SessionItem | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useState<any>({});
    
    // DEBUG: dump swagger
    useEffect(() => {
        fetch('/api/dump-swagger').catch(console.error);
    }, []);
    const [previewPage, setPreviewPage] = useState(1);
    const [initialSessionJson, setInitialSessionJson] = useState<string | null>(null);
    const [existingMappings, setExistingMappings] = useState<CloSessionMapping[]>([]);
    const [isValidated, setIsValidated] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationErrors, setValidationErrors] = useState<any[]>([]);
    const [remainingQuotas, setRemainingQuotas] = useState<any[]>([]);
    const [isSingleValidated, setIsSingleValidated] = useState(false);
    const [isSingleValidating, setIsSingleValidating] = useState(false);
    const [singleValidationErrors, setSingleValidationErrors] = useState<any[]>([]);

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
    });

    const realTask = routeTaskData?.data;
    const syllabusId = realTask?.syllabus?.syllabusId || realTask?.syllabusId;

    const { data: sessionDataRes, isLoading: isSessionLoading, isFetching: isFetchingSessions, error: sessionError, refetch: refetchSessions } = useQuery({
        queryKey: ['sessions', syllabusId],
        queryFn: () => syllabusId ? SessionService.getDetailedSessions(syllabusId, 0, 100) : Promise.reject('No syllabusId'),
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
        queryKey: ['materials', syllabusId, 'DRAFT'],
        queryFn: () => MaterialService.getMaterialsBySyllabusId(syllabusId!, 'DRAFT'),
        enabled: !!syllabusId,
    });
    const materials = Array.isArray(materialsRes?.data) ? materialsRes.data :
        (Array.isArray((materialsRes?.data as any)?.data) ? (materialsRes?.data as any).data : []);

    const reduxSessions = useSelector((state: RootState) => syllabusId ? state.syllabus.sessionsDB[syllabusId] : undefined);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | null, index: number, number: number } | null>(null);

    const credit = syllabusData?.data?.credit || syllabusData?.data?.noCredit || 0;
    
    useEffect(() => {
        if (!isSessionLoading && !isFetchingSessions && !isRegLoading && !isSyllabusLoading && syllabusId && syllabusData?.data) {
            
            const rawData = sessionDataRes?.data as any;
            const apiSessions: any[] = Array.isArray(rawData?.content) ? rawData.content : [];
            
            console.log('API Sessions Data received:', apiSessions);

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
                    cloIds: apiSess.cloIds || []
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

    // Fetch session-specific mappings when editing
    useEffect(() => {
        let isMounted = true;
        const fetchSessionMappings = async () => {
            if (draftSession?.sessionId && editingIndex !== null) {
                console.log(`[FE] Fetching CLO mappings for Session: ${draftSession.sessionId}`);
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

    const handleStartEdit = (index: number) => {
        const session = sessions[index];
        setDraftSession({ ...session });
        setInitialSessionJson(JSON.stringify(session));
        setEditingIndex(index);
        setIsSingleValidated(false);
        setSingleValidationErrors([]);
    };

    const handleCreateNew = () => {
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
            duration: rl1,
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

        try {
            await SessionService.deleteSession(id);
            dispatch(removeSession({ syllabusId, index }));
            showToast("Session deleted successfully", "success");
        } catch (error: any) {
            showToast(error.message || "Failed to delete session", "error");
        } finally {
            setDeleteConfirm(null);
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

    return (
        <div className="space-y-0">

            {/* ── Page Header ── */}
            <div className="flex justify-between items-end mb-4">
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
                                                                                <div className="flex gap-4">
                    <button
                        onClick={() => typeof setIsImportModalOpen !== 'undefined' ? setIsImportModalOpen(true) : console.log('Import clicked')}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8]"
                        style={{ borderColor: '#2d342b', color: '#2d342b', background: 'transparent' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Import Session
                    </button>
                    
                    <button
                        onClick={handleCreateNew}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm text-white hover:bg-[#345332]"
                        style={{ background: '#41683f' }}
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        New Session
                    </button>
                </div>
            </div>

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
                        <div className="col-span-1">No.</div>
                        <div className="col-span-3">Session Title</div>
                        <div className="col-span-6">Content Summary</div>
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
                                    <div className="col-span-1 font-black text-sm" style={{ color: '#adb4a8' }}>
                                        {session.sessionNumber}
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
                                        {contentParts.length > 0 ? (
                                            <div className="space-y-2">
                                                {contentParts.map((part, pi) => (
                                                    <div key={pi}>
                                                        <h5 className="text-[10px] font-black uppercase tracking-tighter mb-0.5" style={{ color: '#41683f' }}>
                                                            {part.heading}
                                                        </h5>
                                                        <p className="text-sm line-clamp-2" style={{ color: 'rgba(90,97,87,0.8)' }}>
                                                            {part.detail}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm italic" style={{ color: '#adb4a8' }}>No content assigned yet.</p>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex items-center justify-end gap-1.5">
                                        <button onClick={() => handleStartEdit(index)}
                                            className="h-8 px-2 flex items-center justify-center rounded-lg border border-primary/20 text-primary hover:bg-primary/5 transition-all duration-200"
                                            title="View Session"
                                        >
                                            <Eye size={13} strokeWidth={2.5} className="mr-1" />
                                            <span className="text-[10px] font-bold">View</span>
                                        </button>
                                        <button onClick={() => handleStartEdit(index)}
                                            className="h-8 px-2 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200"
                                            title="Edit Session"
                                        >
                                            <Pencil size={13} strokeWidth={2.5} className="mr-1" />
                                            <span className="text-[10px] font-bold">Edit</span>
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



            {/* ── Edit Session Modal ── */}
            {editingIndex !== null && draftSession && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4 md:p-8">
                    {/* Backdrop Blur */}
                    <div className="absolute inset-0 bg-on-surface/20" onClick={handleCloseModal}></div>

                    {/* Modal Container */}
                    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-bright">
                            <div>
                                <h2 className="text-2xl font-extrabold text-on-surface">
                                    {editingIndex === -1 ? 'Create New Session' : `Edit Session ${String(draftSession.sessionNumber).padStart(2, '0')}`}
                                </h2>
                                <p className="text-sm text-on-surface-variant">Configure timing, topics, and pedagogical mappings.</p>
                            </div>
                            <button onClick={handleCloseModal}
                                className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                                <span className="material-symbols-outlined text-on-surface-variant">close</span>
                            </button>
                        </div>

                        {/* Modal Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                            {isSingleValidated && singleValidationErrors.length > 0 && (
                                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl flex items-start gap-3">
                                    <span className="material-symbols-outlined text-amber-500 mt-0.5">warning</span>
                                    <div>
                                        <h4 className="font-bold text-sm">Validation Suggestions</h4>
                                        <p className="text-xs mb-2">These are suggestions. You can still save the session.</p>
                                        <ul className="text-xs list-disc list-inside space-y-1">
                                            {singleValidationErrors[0]?.errors?.map((err: any, idx: number) => (
                                                <li key={idx}>{err.errorMessage}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Session No.</label>
                                    <input
                                        className="bg-white border-2 border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-colors focus:border-primary placeholder-slate-400 font-black text-center outline-none"
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
                                <div className="md:col-span-7 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Session Title</label>
                                    <input
                                        className="bg-white border-2 border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-colors focus:border-primary placeholder-slate-400 outline-none"
                                        type="text"
                                        value={draftSession.sessionTitle || ''}
                                        onChange={e => setDraftSession(prev => prev ? { ...prev, sessionTitle: e.target.value } : null)}
                                    />
                                </div>
                                <div className="md:col-span-3 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Duration (Mins)</label>
                                    <input
                                        className="bg-white border-2 border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-colors focus:border-primary placeholder-slate-400 outline-none"
                                        type="number"
                                        value={draftSession.duration}
                                        onChange={e => setDraftSession(prev => prev ? { ...prev, duration: Number(e.target.value) } : null)}
                                    />
                                </div>
                                <div className="md:col-span-6 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Teaching Method</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-colors focus:border-primary appearance-none cursor-pointer outline-none"
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
                                <div className="md:col-span-6 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Session Type</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-white border-2 border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-colors focus:border-primary appearance-none cursor-pointer outline-none"
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
                                <div className="md:col-span-12 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Session Topic</label>
                                    <textarea
                                        className="bg-white border-2 border-slate-200 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-colors focus:border-primary placeholder-slate-400 outline-none resize-none h-24"
                                        placeholder="Enter the detailed topic for this session..."
                                        value={draftSession.sessionTopic || ''}
                                        onChange={e => setDraftSession(prev => prev ? { ...prev, sessionTopic: e.target.value } : null)}
                                    />
                                </div>
                            </section>

                            {/* Content & CLO Mappings sections removed per new design */}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="px-8 py-6 border-t border-outline-variant/10 flex justify-end items-center gap-4 bg-surface-bright">
                            <button onClick={handleCloseModal}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Discard Changes</button>
                            
                            {!isSingleValidated ? (
                                <button
                                    onClick={async () => {
                                        if (!draftSession || !syllabusId) return;
                                        setIsSingleValidating(true);
                                        try {
                                            const { SessionService } = await import('@/services/session.service');
                                            const basePayload = {
                                                syllabusId,
                                                sessionNumber: Number(draftSession.sessionNumber),
                                                sessionTitle: draftSession.sessionTitle || `Session ${draftSession.sessionNumber}`,
                                                teachingMethods: draftSession.teachingMethods || "Lecture",
                                                sessionTopic: draftSession.sessionTopic || "",
                                                sessionType: draftSession.sessionType || "THEORY",
                                                duration: Number(draftSession.duration || 50),
                                            };
                                            console.log("VALIDATE SINGLE SESSION PAYLOAD:", [basePayload]);
                                            const validateRes = await SessionService.validateSessions(syllabusId!, [basePayload]) as any;
                                            
                                            setSingleValidationErrors(validateRes?.data?.errors || []);
                                            setIsSingleValidated(true);
                                            
                                            if (!validateRes?.data?.errors || validateRes.data.errors.length === 0) {
                                                showToast('Session data is valid!', 'success');
                                            } else {
                                                showToast('Validation completed with suggestions', 'warning');
                                            }
                                        } catch (e: any) {
                                            console.error("Validation error:", e);
                                            setSingleValidationErrors(e?.response?.data?.data?.errors || []);
                                            setIsSingleValidated(true);
                                            showToast('Validation completed with suggestions', 'warning');
                                        } finally {
                                            setIsSingleValidating(false);
                                        }
                                    }}
                                    disabled={isSingleValidating}
                                    className="bg-blue-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-md hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSingleValidating ? <Loader2 size={18} className="animate-spin" /> : <span className="material-symbols-outlined text-lg">fact_check</span>}
                                    Validate Session
                                </button>
                            ) : (
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
                                                sessionTopic: draftSession.sessionTopic || "",
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
                                                
                                                if (res?.data?.sessionId) {
                                                    const createdSession = { ...draftSession, sessionId: res.data.sessionId };
                                                    dispatch(addSession({ syllabusId, session: createdSession }));
                                                }
                                            }

                                            // Force list sorting after save by reading current state and dispatching sorted version
                                            setTimeout(() => {
                                                const currentState = store.getState() as RootState;
                                                const currentSessions = currentState.syllabus.sessionsDB[syllabusId as string] || [];
                                                const sortedSessions = [...currentSessions].sort((a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0));
                                                dispatch(setSessions({ syllabusId: syllabusId as string, sessions: sortedSessions }));
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
                                                showToast(e.message || "Failed to save session", "error");
                                            }
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    disabled={isSaving}
                                    className="bg-primary-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-md hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <span className="material-symbols-outlined text-lg">check_circle</span>}
                                    {draftSession.sessionId ? 'Update Session' : 'Create Session'}
                                </button>
                            )}
                        </div>
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
                            <button onClick={() => setDeleteConfirm(null)} className="px-6 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-1/2">
                                Cancel
                            </button>
                            <button onClick={executeDeleteSession} className="px-6 py-2.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 w-1/2">
                                Delete
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
                                        onClick={() => {
                                            const wb = XLSX.utils.book_new();
                                            const ws = XLSX.utils.json_to_sheet([
                                                { 'Session Number': 1, 'Title': 'Introduction to Computer Science', 'Duration': 50, 'Teaching Methods': 'Lecture', 'Topic': 'Intro', 'Type': 'THEORY' },
                                                { 'Session Number': 2, 'Title': 'Data Structures', 'Duration': 50, 'Teaching Methods': 'Lab', 'Topic': 'Arrays', 'Type': 'PRACTICE' },
                                                { 'Session Number': 3, 'Title': 'Assignment Review', 'Duration': 50, 'Teaching Methods': 'Self-study', 'Topic': 'Review', 'Type': 'SELF_STUDY' }
                                            ]);
                                            XLSX.utils.book_append_sheet(wb, ws, "Template");
                                            XLSX.writeFile(wb, "Sessions_Template.xlsx");
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
                                            
                                            try {
                                                const data = await file.arrayBuffer();
                                                const workbook = XLSX.read(data, { type: 'array' });
                                                const firstSheetName = workbook.SheetNames[0];
                                                const worksheet = workbook.Sheets[firstSheetName];
                                                const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                                                const rows = rawRows.filter((r: any) => Object.keys(r).some((k: any) => r[k] !== undefined && r[k] !== null && String(r[k]).trim() !== ''));

                                                if (!syllabusId) return;

                                                const subjectClosList = clos || [];

                                                const parsedSessions = rows.map((row: any, index) => {
                                                    const rawNumber = Number(row['Session Number'] || row['sessionNumber'] || row['Session'] || row['session'] || (index + 1));
                                                    const rawTitle = String(row['Title'] || row['title'] || '').trim();
                                                    const rawDuration = Number(row['Duration'] || row['duration'] || 50);
                                                    const rawMethods = String(row['Teaching Methods'] || row['teachingMethods'] || row['Methods'] || '').trim();
                                                    const rawTopic = String(row['Topic'] || row['topic'] || '').trim();
                                                    const rawType = String(row['Type'] || row['type'] || '').trim();

                                                    return {
                                                        _rowNum: index + 1,
                                                        syllabusId,
                                                        sessionNumber: rawNumber,
                                                        sessionTitle: rawTitle,
                                                        duration: rawDuration,
                                                        teachingMethods: rawMethods,
                                                        sessionTopic: rawTopic,
                                                        sessionType: rawType,
                                                        content: "[]",
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
                                            {!isValidated && (
                                                <button
                                                    disabled={isValidating}
                                                    onClick={async () => {
                                                        setIsValidating(true);
                                                        try {
                                                            const { SessionService } = await import('@/services/session.service');
                                                            const payload = previewData.map(item => {
                                                                const p = { ...item };
                                                                delete p._rowNum;
                                                                delete p.content; // Exclude internal state
                                                                return p;
                                                            });
                                                            console.log("VALIDATE PAYLOAD:", payload);
                                                            const res = await SessionService.validateSessions(syllabusId!, payload) as any;
                                                            setValidationErrors(res?.data?.errors || []);
                                                            setRemainingQuotas(res?.data?.remainingQuotas || []);
                                                            setIsValidated(true);
                                                            if (!res?.data?.errors || res.data.errors.length === 0) {
                                                                showToast('All sessions are valid!', 'success');
                                                            } else {
                                                                showToast('Validation completed with issues', 'error');
                                                            }
                                                        } catch (error: any) {
                                                            console.error(error);
                                                            setValidationErrors(error?.response?.data?.data?.errors || []);
                                                            setRemainingQuotas(error?.response?.data?.data?.remainingQuotas || []);
                                                            setIsValidated(true);
                                                            showToast('Validation completed with errors', 'error');
                                                        } finally {
                                                            setIsValidating(false);
                                                        }
                                                    }}
                                                    className="text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 ml-2 shadow-sm"
                                                >
                                                    {isValidating ? <Loader2 size={14} className="animate-spin" /> : <span className="material-symbols-outlined text-[14px]">fact_check</span>}
                                                    Validate Sessions
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {isValidated && validationErrors.length > 0 && (
                                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start gap-3">
                                            <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
                                            <div>
                                                <h4 className="font-bold text-sm">Validation Issues Found</h4>
                                                <p className="text-xs mt-1">There are {validationErrors.length} rows with errors. Please review and edit the highlighted fields below before saving.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 overflow-auto border border-outline-variant/20 rounded-xl bg-white shadow-sm max-h-[50vh]">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-surface-container-lowest sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap w-20">Session</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Title</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap w-24">Duration</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Methods</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Topic</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Type</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500 w-48">Errors</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/10">
                                                {previewData.slice((previewPage - 1) * 10, previewPage * 10).map((item, idx) => {
                                                    const realIdx = (previewPage - 1) * 10 + idx;
                                                    const rowErrorsObj = validationErrors.find(e => e.rowNumber === item.sessionNumber);
                                                    const rowErrors = rowErrorsObj?.errors || [];
                                                    const hasError = rowErrors.length > 0;
                                                    
                                                    return (
                                                    <tr key={idx} className={`transition-colors ${hasError ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-primary/5'}`}>
                                                        <td className="px-4 py-3 font-medium text-slate-700 text-center"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-xs font-bold">{item.sessionNumber}</span></td>
                                                        <td className="px-4 py-3 font-bold text-slate-800">
                                                            <input 
                                                                className={`w-full bg-transparent border-b ${hasError && rowErrors.some((e: any) => e.field === 'sessionTitle') ? 'border-red-400 text-red-700 focus:border-red-600 focus:ring-red-200' : 'border-transparent hover:border-slate-300 focus:border-primary'} px-1 py-0.5 outline-none`} 
                                                                value={item.sessionTitle} 
                                                                onChange={(e) => {
                                                                    const newData = [...previewData];
                                                                    newData[realIdx].sessionTitle = e.target.value;
                                                                    setPreviewData(newData);
                                                                    setIsValidated(false);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-500">
                                                            <input 
                                                                type="number"
                                                                className={`w-full bg-transparent border-b ${hasError && rowErrors.some((e: any) => e.field === 'duration') ? 'border-red-400 text-red-700 focus:border-red-600 focus:ring-red-200' : 'border-transparent hover:border-slate-300 focus:border-primary'} px-1 py-0.5 outline-none`} 
                                                                value={item.duration} 
                                                                onChange={(e) => {
                                                                    const newData = [...previewData];
                                                                    newData[realIdx].duration = Number(e.target.value);
                                                                    setPreviewData(newData);
                                                                    setIsValidated(false);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                                            <input 
                                                                className={`w-full bg-transparent border-b ${hasError && rowErrors.some((e: any) => e.field === 'teachingMethods') ? 'border-red-400 text-red-700 focus:border-red-600 focus:ring-red-200' : 'border-transparent hover:border-slate-300 focus:border-primary'} px-1 py-0.5 outline-none`} 
                                                                value={item.teachingMethods || ''} 
                                                                onChange={(e) => {
                                                                    const newData = [...previewData];
                                                                    newData[realIdx].teachingMethods = e.target.value;
                                                                    setPreviewData(newData);
                                                                    setIsValidated(false);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                                            <input 
                                                                className={`w-full bg-transparent border-b ${hasError && rowErrors.some((e: any) => e.field === 'sessionTopic') ? 'border-red-400 text-red-700 focus:border-red-600 focus:ring-red-200' : 'border-transparent hover:border-slate-300 focus:border-primary'} px-1 py-0.5 outline-none`} 
                                                                value={item.sessionTopic || ''} 
                                                                onChange={(e) => {
                                                                    const newData = [...previewData];
                                                                    newData[realIdx].sessionTopic = e.target.value;
                                                                    setPreviewData(newData);
                                                                    setIsValidated(false);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                                            <input 
                                                                className={`w-full bg-transparent border-b ${hasError && rowErrors.some((e: any) => e.field === 'sessionType') ? 'border-red-400 text-red-700 focus:border-red-600 focus:ring-red-200' : 'border-transparent hover:border-slate-300 focus:border-primary'} px-1 py-0.5 outline-none`} 
                                                                value={item.sessionType || ''} 
                                                                onChange={(e) => {
                                                                    const newData = [...previewData];
                                                                    newData[realIdx].sessionType = e.target.value;
                                                                    setPreviewData(newData);
                                                                    setIsValidated(false);
                                                                }}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {hasError && (
                                                                <div className="flex flex-col gap-1">
                                                                    {rowErrors.map((err: any, i: number) => (
                                                                        <span key={i} className="text-[10px] text-red-600 bg-red-100 px-1.5 py-0.5 rounded leading-tight">
                                                                            • {err.errorMessage}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )})}
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
                                    onClick={() => { setIsPreviewOpen(false); setPreviewData([]); setIsImportModalOpen(true); }}
                                    className="px-6 py-2.5 rounded-xl font-bold text-on-surface-variant bg-white border border-outline-variant/30 hover:bg-outline-variant/10 transition-colors"
                                >
                                    Back
                                </button>
                                <button 
                                    disabled={isSaving || !isValidated}
                                    onClick={async () => {
                                        setIsSaving(true);
                                        try {
                                            const { SessionService } = await import('@/services/session.service');
                                            
                                            const payload = previewData.map(item => {
                                                const p = { ...item };
                                                delete p._rowNum;
                                                delete p.content; // Exclude internal state
                                                return p;
                                            });

                                            console.log("BULK CREATE PAYLOAD:", payload);
                                            await SessionService.bulkCreateSessions(payload);

                                            showToast(`Successfully saved ${previewData.length} sessions`, 'success');
                                            
                                            setTimeout(() => {
                                                window.location.reload();
                                            }, 500);

                                            setIsPreviewOpen(false);
                                            setPreviewData([]);
                                        } catch (error) {
                                            console.error(error);
                                            showToast('Failed to save sessions. Please try validating again.', 'error');
                                        } finally {
                                            setIsSaving(false);
                                        }
                                    }}
                                    className="px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg text-white"
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

        </div>
    );
}
