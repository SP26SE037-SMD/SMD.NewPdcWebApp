"use client";

import React, { use, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch, store } from '@/store';
import { setSessions, updateSession, removeSession, addSession } from '@/store/slices/syllabusSlice';
import { Loader2, RefreshCw, Plus, Trash2, CalendarDays, Pencil } from 'lucide-react';
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
    const [initialSessionJson, setInitialSessionJson] = useState<string | null>(null);
    const [existingMappings, setExistingMappings] = useState<CloSessionMapping[]>([]);

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
            duration: rl1,
            content: '',
            cloIds: []
        };
        
        setDraftSession(newSession);
        setInitialSessionJson(null);
        setEditingIndex(-1); // -1 means creating NEW
    };

    const handleDeleteSession = async (index: number) => {
        if (!syllabusId) return;
        const session = sessions[index];
        if (!session.sessionId) {
            dispatch(removeSession({ syllabusId, index }));
            return;
        }

        if (!confirm(`Are you sure you want to delete Session ${session.sessionNumber}?`)) return;

        try {
            await SessionService.deleteSession(session.sessionId);
            dispatch(removeSession({ syllabusId, index }));
            showToast("Session deleted successfully", "success");
        } catch (error: any) {
            showToast(error.message || "Failed to delete session", "error");
        }
    };

    const handleCloseModal = () => {
        setEditingIndex(null);
        setDraftSession(null);
        setInitialSessionJson(null);
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
                    <h1 className="text-xl font-extrabold text-on-surface tracking-tight mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Syllabus Sessions
                    </h1>
                    <p className="text-[10px] font-light text-on-surface-variant flex items-center gap-2">
                        <span>{sessions.length} sessions created</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-primary-600 font-bold">Recommended max: {recommendedMax} sessions</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{credit} credits</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleCreateNew}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm text-white"
                        style={{ background: '#4caf50' }}
                    >
                        <Plus size={18} />
                        New Session
                    </button>
                    <button
                        onClick={() => refetchSessions()}
                        disabled={isFetchingSessions}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0] active:bg-[#e8ede8] disabled:opacity-70"
                        style={{ borderColor: '#4caf50', color: '#4caf50', background: 'transparent' }}
                    >
                        <RefreshCw size={18} className={isFetchingSessions ? "animate-spin" : ""} />
                        Refresh
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
                        <div className="col-span-1">ID</div>
                        <div className="col-span-3">Session Title</div>
                        <div className="col-span-5">Content Summary</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
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
                                    <div className="col-span-1 font-mono text-[10px]" style={{ color: '#5a6157' }}>
                                        #{String(session.sessionNumber).padStart(3, '0')}
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
                                    <div className="col-span-5 pr-8">
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
                                    <div className="col-span-2">
                                        {session.sessionId ? (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-surface-variant text-on-surface-variant">SAVED</span>
                                        ) : (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-surface-variant text-on-surface-variant">DRAFT</span>
                                        )}
                                    </div>
                                    <div className="col-span-1 flex items-center justify-end gap-1.5">
                                        <button onClick={() => handleStartEdit(index)}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/10 active:scale-90"
                                            title="Edit Session"
                                        >
                                            <Pencil size={13} strokeWidth={2.5} />
                                        </button>
                                        <button onClick={() => handleDeleteSession(index)}
                                            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all duration-200 hover:shadow-md hover:shadow-red-500/10 active:scale-90"
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
                            <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                <div className="md:col-span-3 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Session No.</label>
                                    <input
                                        className="bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:ring-0 focus:bg-surface-container-lowest transition-colors border-b-2 border-transparent focus:border-primary placeholder-on-surface-variant/50 font-black text-center"
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
                                <div className="md:col-span-6 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Session Title</label>
                                    <input
                                        className="bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:ring-0 focus:bg-surface-container-lowest transition-colors border-b-2 border-transparent focus:border-primary placeholder-on-surface-variant/50"
                                        type="text"
                                        value={draftSession.sessionTitle || ''}
                                        onChange={e => setDraftSession(prev => prev ? { ...prev, sessionTitle: e.target.value } : null)}
                                    />
                                </div>
                                <div className="md:col-span-3 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Duration (Mins)</label>
                                    <input
                                        className="bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:ring-0 focus:bg-surface-container-lowest transition-colors border-b-2 border-transparent focus:border-primary placeholder-on-surface-variant/50"
                                        type="number"
                                        value={draftSession.duration}
                                        onChange={e => setDraftSession(prev => prev ? { ...prev, duration: Number(e.target.value) } : null)}
                                    />
                                </div>
                                <div className="md:col-span-12 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant font-label">Teaching Method</label>
                                    <div className="relative">
                                        <select
                                            className="w-full bg-surface-container-highest border-none rounded-lg px-4 py-3 focus:ring-0 focus:bg-surface-container-lowest transition-colors border-b-2 border-transparent focus:border-primary appearance-none cursor-pointer"
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
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant text-lg pointer-events-none">school</span>
                                    </div>
                                </div>
                            </section>

                            {/* Content Blocks Section */}
                            <section>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">view_quilt</span>
                                        Content
                                    </h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-6 bg-surface-container-low rounded-xl flex flex-col gap-6 group transition-all hover:bg-surface-container">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold uppercase text-on-surface-variant/70 font-label tracking-widest">Select Pedagogy Layers</label>
                                            <SessionContentSelector
                                                materials={materials}
                                                value={draftSession.content}
                                                onChange={(newValue) => setDraftSession(prev => prev ? { ...prev, content: newValue } : null)}
                                            />
                                        </div>
                                    </div>

                                    <p className="text-xs text-on-surface-variant/60 italic px-2">
                                        * Use the selector above to pick specific materials and their H2 blocks to include in this session.
                                    </p>
                                </div>
                            </section>

                            {/* CLO Mapping Section */}
                            <section className="pt-6 border-t border-outline-variant/10">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-lg font-bold text-on-surface flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">target</span>
                                        Outcome Mapping (CLO)
                                    </h3>
                                    <span className="text-xs text-on-surface-variant font-medium italic">Assign learning outcomes covered in this session</span>
                                </div>
                                
                                {isClosLoading ? (
                                    <div className="flex items-center gap-2 text-sm text-on-surface-variant p-4">
                                        <Loader2 size={16} className="animate-spin" />
                                        Loading CLOs...
                                    </div>
                                ) : clos.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {clos.map(clo => {
                                            const isSelected = draftSession.cloIds?.includes(clo.cloId);
                                            return (
                                                <button
                                                    key={clo.cloId}
                                                    onClick={() => {
                                                        const currentIds = draftSession.cloIds || [];
                                                        const newIds = isSelected 
                                                            ? currentIds.filter(id => id !== clo.cloId)
                                                            : [...currentIds, clo.cloId];
                                                        setDraftSession(prev => prev ? { ...prev, cloIds: newIds } : null);
                                                    }}
                                                    className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all group ${
                                                        isSelected 
                                                            ? 'bg-primary/5 border-primary ring-1 ring-primary/20' 
                                                            : 'bg-surface-container-lowest border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container-low'
                                                    }`}
                                                >
                                                    <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                                        isSelected ? 'bg-primary border-primary text-white' : 'border-outline-variant/50 bg-white'
                                                    }`}>
                                                        {isSelected && <span className="material-symbols-outlined text-[14px] font-bold">check</span>}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center justify-between">
                                                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>
                                                                {clo.cloCode}
                                                            </p>
                                                            {clo.bloomLevel && (
                                                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                                                    isSelected 
                                                                        ? 'bg-primary/10 text-primary border-primary/20' 
                                                                        : 'bg-surface-variant text-on-surface-variant border-transparent'
                                                                }`}>
                                                                    Bloom {clo.bloomLevel}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className={`text-sm line-clamp-2 leading-relaxed ${isSelected ? 'text-on-surface' : 'text-on-surface-variant/80'}`}>
                                                            {clo.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-10 border-2 border-dashed border-outline-variant/20 rounded-2xl text-center">
                                        <span className="material-symbols-outlined text-outline-variant/50 text-4xl mb-3">assignment_late</span>
                                        <p className="text-on-surface-variant font-medium">No learning outcomes found.</p>
                                        <p className="text-[10px] text-on-surface-variant/40 uppercase tracking-widest mt-2 font-bold">Check syllabus setup</p>
                                    </div>
                                )}
                            </section>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="px-8 py-6 border-t border-outline-variant/10 flex justify-end items-center gap-4 bg-surface-bright">
                            <button onClick={handleCloseModal}
                                className="px-6 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Discard Changes</button>
                            <button 
                                onClick={async () => {
                                    if (!draftSession || !syllabusId) return;
                                    setIsSaving(true);
                                    try {
                                        // Parse content JSON into material/block ID arrays
                                        let selectedMaterialIds: string[] = [];
                                        let selectedBlockIds: string[] = [];
                                        
                                        if (draftSession.content) {
                                            try {
                                                const parsed = JSON.parse(draftSession.content);
                                                if (Array.isArray(parsed)) {
                                                    parsed.forEach((item: any) => {
                                                        selectedMaterialIds.push(item.materialId);
                                                        if (Array.isArray(item.blockIds)) {
                                                            selectedBlockIds.push(...item.blockIds);
                                                        }
                                                    });
                                                }
                                            } catch (e) {
                                                console.error("Failed to parse content JSON", e);
                                            }
                                        }

                                        const basePayload = {
                                            sessionNumber: Number(draftSession.sessionNumber),
                                            sessionTitle: draftSession.sessionTitle || `Session ${draftSession.sessionNumber}`,
                                            teachingMethods: draftSession.teachingMethods || "Lecture",
                                            duration: Number(draftSession.duration || 50),
                                            // Ensure IDs are unique to prevent DB constraint violations
                                            material: Array.from(new Set(selectedMaterialIds)),
                                            block: Array.from(new Set(selectedBlockIds)),
                                            cloIds: draftSession.cloIds || []
                                        };

                                        console.log('Sending payload to API:', basePayload);

                                        let res: any = null;
                                        if (draftSession.sessionId) {
                                            // UPDATE (PUT)
                                            await SessionService.updateSessionBlocks({
                                                ...basePayload,
                                                sessionId: draftSession.sessionId
                                            });
                                            // SUCCESS: Update Redux
                                            dispatch(updateSession({ 
                                                syllabusId, 
                                                index: editingIndex, 
                                                updates: draftSession 
                                            }));
                                        } else {
                                            // CREATE (POST)
                                            res = await SessionService.bulkConfigureSession({
                                                ...basePayload,
                                                syllabusId
                                            }) as any;
                                            
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
                                        
                                        // ── CLO Mapping Persistence ──
                                        const finalSessId = draftSession.sessionId || (res as any)?.data?.sessionId;
                                        if (finalSessId) {
                                            const currentCloIds = draftSession.cloIds || [];
                                            
                                            // Diff mappings
                                            const toDelete = existingMappings.filter(em => !currentCloIds.includes(em.cloId));
                                            const toAdd = currentCloIds.filter(id => !existingMappings.some(em => em.cloId === id));

                                            console.log(`[FE] Syncing CLO Mappings for Session ${finalSessId}:`, { toDelete: toDelete.length, toAdd: toAdd.length });

                                            // Delete removed mappings
                                            for (const mapping of toDelete) {
                                                if (mapping.id) {
                                                    try {
                                                        await MappingService.deleteSessionMapping(mapping.id);
                                                    } catch (err) {
                                                        console.error("Failed to delete session mapping:", mapping.id, err);
                                                    }
                                                }
                                            }

                                            // Batch create new mappings
                                            if (toAdd.length > 0) {
                                                try {
                                                    await MappingService.createSessionMappingsBatch(
                                                        toAdd.map(cloId => ({ cloId, sessionId: finalSessId }))
                                                    );
                                                } catch (err) {
                                                    console.error("Failed to batch create session mappings:", err);
                                                }
                                            }
                                        }

                                        showToast("Session saved successfully!", "success");
                                        handleCloseModal();
                                    } catch (e: any) {
                                        console.error("Save error:", e);
                                        showToast(e.message || "Failed to save session", "error");
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                disabled={isSaving || !hasChanges}
                                className="bg-primary-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold shadow-md hover:scale-[1.02] transition-transform active:scale-95 flex items-center gap-2 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <span className="material-symbols-outlined text-lg">check_circle</span>}
                                {draftSession.sessionId ? 'Update Session' : 'Create Session'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
