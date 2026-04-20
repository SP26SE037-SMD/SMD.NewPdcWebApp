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
import { SessionContentSelector } from '../../../tasks/[taskId]/sessions/session-content-selector';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/components/ui/Toast';
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
    const [isSaving, setIsSaving] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draftSession, setDraftSession] = useState<SessionItem | null>(null);
    const [initialSessionJson, setInitialSessionJson] = useState<string | null>(null);
    const [existingMappings, setExistingMappings] = useState<CloSessionMapping[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | null, index: number, number: number } | null>(null);

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
    });

    const realTask = routeTaskData?.data;
    const syllabusId = realTask?.syllabus?.syllabusId;
    
    // Fetch Revision Request Data (Always enabled for this route)
    const { data: revisionRequest, isLoading: isRevisionLoading } = useRevisionRequest(taskId, true);

    const { data: sessionDataRes, isLoading: isSessionLoading, isFetching: isFetchingSessions, refetch: refetchSessions } = useQuery({
        queryKey: ['sessions', syllabusId, 'REVISION_REQUESTED'],
        queryFn: () => syllabusId ? SessionService.getDetailedSessions(syllabusId, 0, 100, 'REVISION_REQUESTED') : Promise.reject('No syllabusId'),
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
        queryFn: () => MaterialService.getMaterialsBySyllabusId(syllabusId!, 'REVISION_REQUESTED'),
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
            
            const finalSessions: SessionItem[] = apiSessions.map(apiSess => {
                const selectionStates: any[] = [];
                const materialMap: Record<string, any> = {};

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

    const regs = regulationsData?.data?.content || [];
    const rl1 = regs.find((r: any) => r.code === 'RL1')?.value || 50;
    const rl2 = regs.find((r: any) => r.code === 'RL2')?.value || 15;
    const recommendedMax = Math.ceil((credit * rl2 * 60) / rl1);

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
                        const currentIds = draftSession.cloIds || [];
                        const hasDifference = dbCloIds.length !== currentIds.length || dbCloIds.some((id: string) => !currentIds.includes(id));
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
        setEditingIndex(-1);
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
            {!isRevisionLoading && revisionRequest && (
                <div className="mb-6">
                    <ReviewerFeedback 
                        reviewer={revisionRequest.reviewer}
                        comments={[{ title: 'Session Feedback', content: revisionRequest.commentSession }]}
                    />
                </div>
            )}

            <div className="flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-xl font-extrabold text-on-surface tracking-tight mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Revision: Sessions
                    </h1>
                    <p className="text-[10px] font-light text-on-surface-variant flex items-center gap-2">
                        <span>{sessions.length} sessions created</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-primary-600 font-bold">Recommended max: {recommendedMax}</span>
                    </p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleCreateNew}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm text-white"
                        style={{ background: '#4caf50' }}
                    >
                        <Plus size={18} /> New Session
                    </button>
                    <button
                        onClick={() => refetchSessions()}
                        disabled={isFetchingSessions}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border-2 hover:bg-[#f0f4f0]"
                        style={{ borderColor: '#4caf50', color: '#4caf50' }}
                    >
                        <RefreshCw size={18} className={isFetchingSessions ? "animate-spin" : ""} /> Refresh
                    </button>
                </div>
            </div>

            {sessions.length === 0 && !isLoading && (
                <div className="text-center py-24 rounded-2xl" style={{ background: '#ffffff', border: '2px dashed #adb4a8' }}>
                    <div className="p-4 rounded-full bg-slate-50 w-fit mx-auto mb-4 border border-slate-100 text-slate-300">
                        <CalendarDays size={48} />
                    </div>
                    <h3 className="font-bold mt-4 mb-2" style={{ color: '#5a6157' }}>No Sessions Found</h3>
                    <button
                        onClick={handleCreateNew}
                        className="px-10 py-3 rounded-2xl font-black text-white uppercase tracking-widest text-[10px]"
                        style={{ background: 'linear-gradient(135deg, #41683f 0%, #2d452c 100%)' }}
                    >
                        Create First Session
                    </button>
                </div>
            )}

            {sessions.length > 0 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-12 px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 border-b border-outline-variant/10">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-3">Session Title</div>
                        <div className="col-span-5">Content Summary</div>
                        <div className="col-span-2">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                    </div>

                    <div className="max-h-[calc(100vh-340px)] overflow-y-auto pr-2 custom-scrollbar space-y-2">
                        {sessions.map((session, index) => {
                            let contentParts: Array<{ heading: string; detail: string }> = [];
                            if (session.content) {
                                try {
                                    const parsed = JSON.parse(session.content);
                                    if (Array.isArray(parsed)) {
                                        contentParts = parsed.slice(0, 3).map((item: any) => {
                                            const mTitle = item.materialTitle || materials.find((m: MaterialItem) => m.materialId === item.materialId)?.title || 'Section';
                                            return {
                                                heading: mTitle,
                                                detail: (item.blockNames && item.blockNames.length > 0) ? item.blockNames.join(', ') : (item.blockName || 'Selected')
                                            };
                                        });
                                    }
                                } catch {
                                    if (session.content.trim()) contentParts = [{ heading: 'Content', detail: session.content.substring(0, 120) }];
                                }
                            }

                            return (
                                <div key={session.sessionId || `local-${index}`}
                                    className="grid grid-cols-12 items-center px-6 py-3 bg-surface-container-lowest rounded-xl hover:shadow-lg transition-all border border-transparent hover:border-primary/10"
                                >
                                    <div className="col-span-1 font-mono text-[10px]" style={{ color: '#5a6157' }}>#{String(session.sessionNumber).padStart(3, '0')}</div>
                                    <div className="col-span-3">
                                        <h4 className="text-sm font-black leading-tight uppercase tracking-tight" style={{ color: '#2d342b' }}>{session.sessionTitle || `Session ${session.sessionNumber}`}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-[9px] font-black uppercase tracking-widest">{session.teachingMethods || 'Lecture'}</span>
                                            <span className="text-[9px] font-bold text-slate-400">• {session.duration || 50} MIN</span>
                                        </div>
                                    </div>
                                    <div className="col-span-5 pr-8">
                                        {contentParts.length > 0 ? (
                                            <div className="space-y-2">
                                                {contentParts.map((part, pi) => (
                                                    <div key={pi}>
                                                        <h5 className="text-[10px] font-black uppercase tracking-tighter mb-0.5" style={{ color: '#41683f' }}>{part.heading}</h5>
                                                        <p className="text-sm line-clamp-2" style={{ color: 'rgba(90,97,87,0.8)' }}>{part.detail}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-sm italic" style={{ color: '#adb4a8' }}>No content assigned yet.</p>}
                                    </div>
                                    <div className="col-span-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${session.sessionId ? 'bg-surface-variant' : 'bg-primary/10'}`}>{session.sessionId ? 'SAVED' : 'DRAFT'}</span>
                                    </div>
                                    <div className="col-span-1 flex items-center justify-end gap-1.5">
                                        <button onClick={() => handleStartEdit(index)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all"><Pencil size={13} /></button>
                                        <button onClick={() => handleDeleteSession(index)} className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={13} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {editingIndex !== null && draftSession && (
                <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-on-surface/20" onClick={handleCloseModal}></div>
                    <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-bright">
                            <h2 className="text-2xl font-extrabold text-on-surface">{editingIndex === -1 ? 'Create New Session' : 'Edit Revision Session'}</h2>
                            <button onClick={handleCloseModal} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-surface-container"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                           <section className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                <div className="md:col-span-3 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Session No.</label>
                                    <input className="bg-surface-container-highest border-none rounded-lg px-4 py-3 font-black text-center" type="number" value={draftSession.sessionNumber} onChange={e => setDraftSession(prev => prev ? { ...prev, sessionNumber: Number(e.target.value) } : null)} />
                                </div>
                                <div className="md:col-span-6 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Session Title</label>
                                    <input className="bg-surface-container-highest border-none rounded-lg px-4 py-3" type="text" value={draftSession.sessionTitle || ''} onChange={e => setDraftSession(prev => prev ? { ...prev, sessionTitle: e.target.value } : null)} />
                                </div>
                                <div className="md:col-span-3 flex flex-col gap-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Duration</label>
                                    <input className="bg-surface-container-highest border-none rounded-lg px-4 py-3" type="number" value={draftSession.duration} onChange={e => setDraftSession(prev => prev ? { ...prev, duration: Number(e.target.value) } : null)} />
                                </div>
                           </section>
                           <section>
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">view_quilt</span> Content</h3>
                                <SessionContentSelector materials={materials} value={draftSession.content} onChange={(newValue: string) => setDraftSession(prev => prev ? { ...prev, content: newValue } : null)} />
                           </section>
                           <section className="pt-6 border-t border-outline-variant/10">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><span className="material-symbols-outlined text-primary">target</span> Outcomes (CLO)</h3>
                                {isClosLoading ? <p>Loading CLOs...</p> : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {clos.map(clo => {
                                            const isSelected = draftSession.cloIds?.includes(clo.cloId);
                                            return (
                                                <button key={clo.cloId} onClick={() => {
                                                    const currentIds = draftSession.cloIds || [];
                                                    const newIds = isSelected ? currentIds.filter(id => id !== clo.cloId) : [...currentIds, clo.cloId];
                                                    setDraftSession(prev => prev ? { ...prev, cloIds: newIds } : null);
                                                }} className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${isSelected ? 'bg-primary/5 border-primary' : 'bg-surface-container-lowest border-outline-variant/10'}`}>
                                                    <div className={`mt-0.5 shrink-0 w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-white'}`}>{isSelected && <span className="material-symbols-outlined text-[14px]">check</span>}</div>
                                                    <div><p className="text-[10px] font-bold uppercase">{clo.cloCode}</p><p className="text-sm line-clamp-2">{clo.description}</p></div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                           </section>
                        </div>
                        <div className="px-8 py-6 border-t border-outline-variant/10 flex justify-end items-center gap-4 bg-surface-bright">
                            <button onClick={handleCloseModal} className="px-6 py-2.5 rounded-lg text-sm font-bold text-on-surface-variant">Discard</button>
                            <button onClick={async () => {
                                if (!draftSession || !syllabusId) return;
                                setIsSaving(true);
                                try {
                                    let selectedMaterialIds: string[] = [];
                                    let selectedBlockIds: string[] = [];
                                    if (draftSession.content) {
                                        try {
                                            const parsed = JSON.parse(draftSession.content);
                                            if (Array.isArray(parsed)) {
                                                parsed.forEach((item: any) => {
                                                    selectedMaterialIds.push(item.materialId);
                                                    if (Array.isArray(item.blockIds)) selectedBlockIds.push(...item.blockIds);
                                                });
                                            }
                                        } catch (e) { console.error(e); }
                                    }
                                    const basePayload = {
                                        sessionNumber: Number(draftSession.sessionNumber),
                                        sessionTitle: draftSession.sessionTitle || `Session ${draftSession.sessionNumber}`,
                                        teachingMethods: draftSession.teachingMethods || "Lecture",
                                        duration: Number(draftSession.duration || 50),
                                        material: Array.from(new Set(selectedMaterialIds)),
                                        block: Array.from(new Set(selectedBlockIds)),
                                        cloIds: draftSession.cloIds || []
                                    };
                                    if (draftSession.sessionId) {
                                        await SessionService.updateSessionBlocks({ ...basePayload, sessionId: draftSession.sessionId });
                                        dispatch(updateSession({ syllabusId, index: editingIndex, updates: draftSession }));
                                    } else {
                                        const res = await SessionService.bulkConfigureSession({ ...basePayload, syllabusId }) as any;
                                        if (res?.data?.sessionId) {
                                            const createdSession = { ...draftSession, sessionId: res.data.sessionId };
                                            dispatch(addSession({ syllabusId, session: createdSession }));
                                        }
                                    }
                                    showToast("Session saved!", "success");
                                    handleCloseModal();
                                } catch (e: any) { showToast(e.message || "Failed", "error"); } finally { setIsSaving(false); }
                            }} disabled={isSaving || !hasChanges} className="bg-primary-500 text-white px-8 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2">
                                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <span className="material-symbols-outlined">check_circle</span>}
                                {draftSession.sessionId ? 'Update' : 'Create'}
                            </button>
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
        </div>
    );
}
