"use client";

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useReview, MaterialEvaluation } from '../ReviewContext';

interface MaterialItem {
    materialId: string;
    title: string;
    materialType?: string;
    status?: string;
}

interface MaterialEvaluateModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Pass a single material to evaluate only that one, or all materials for bulk */
    materials: MaterialItem[];
    taskId: string;
}

const C = {
    primary: 'var(--primary)',
    primaryDark: '#388e3c',
    primaryLight: '#e8f5e9',
    danger: '#ef4444',
    dangerLight: '#fef2f2',
    onSurface: '#2d342b',
    onSurfaceVariant: '#5a6157',
    outlineVariant: '#dee1d8',
    surfaceContainer: '#f8faf2',
};

type EvalState = { status: 'ACCEPTED' | 'REJECTED' | 'PENDING'; note: string };

export function MaterialEvaluateModal({ isOpen, onClose, materials, taskId }: MaterialEvaluateModalProps) {
    const { setMaterialEvaluation, materialEvaluations, setMaterialsReview } = useReview();

    // Local state: one entry per material
    const [localEvals, setLocalEvals] = useState<Record<string, EvalState>>({});
    const [isSaving, setIsSaving] = useState(false);

    // Initialize from existing context when modal opens
    useEffect(() => {
        if (!isOpen) return;
        const initial: Record<string, EvalState> = {};
        materials.forEach(m => {
            const existing = materialEvaluations[m.materialId];
            initial[m.materialId] = existing
                ? { status: existing.status as any, note: existing.note }
                : { status: 'PENDING', note: '' };
        });
        setLocalEvals(initial);
    }, [isOpen, materials, materialEvaluations]);

    if (!isOpen) return null;

    const setStatus = (id: string, status: 'ACCEPTED' | 'REJECTED') => {
        setLocalEvals(prev => ({ ...prev, [id]: { ...prev[id], status } }));
    };

    const setNote = (id: string, note: string) => {
        setLocalEvals(prev => ({ ...prev, [id]: { ...prev[id], note } }));
    };

    const handleSave = () => {
        setIsSaving(true);
        // Save each evaluation to context
        materials.forEach(m => {
            const ev = localEvals[m.materialId];
            if (!ev) return;
            setMaterialEvaluation(m.materialId, {
                materialId: m.materialId,
                title: m.title,
                status: ev.status === 'PENDING' ? 'PENDING' : ev.status,
                note: ev.note,
            });
        });

        // ── Persist to localStorage ──
        const payload = materials.map(m => ({
            materialId: m.materialId,
            title: m.title,
            status: localEvals[m.materialId]?.status ?? 'PENDING',
            note: localEvals[m.materialId]?.note ?? '',
        }));
        localStorage.setItem(`pdcm-review-materials-${taskId}`, JSON.stringify(payload));

        // Derive overall section status
        const evList = materials.map(m => localEvals[m.materialId]?.status);
        const hasRejected = evList.some(s => s === 'REJECTED');
        const allReviewed = evList.every(s => s === 'ACCEPTED' || s === 'REJECTED');
        if (allReviewed) {
            setMaterialsReview({
                status: hasRejected ? 'FAIL' : 'PASS',
                note: hasRejected ? 'Some materials were rejected.' : 'All materials accepted.',
            });
        }

        setTimeout(() => {
            setIsSaving(false);
            onClose();
        }, 300);
    };

    const allDone = materials.every(m => {
        const ev = localEvals[m.materialId];
        return ev?.status === 'ACCEPTED' || ev?.status === 'REJECTED';
    });

    return (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4"
            style={{ background: 'rgba(45,52,43,0.5)', backdropFilter: 'blur(6px)' }}>
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
                style={{ border: `1px solid ${C.outlineVariant}` }}>

                {/* Header */}
                <div className="px-8 py-5 flex items-center justify-between border-b"
                    style={{ borderColor: C.outlineVariant }}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-0.5"
                            style={{ color: C.primary }}>Material Evaluation</p>
                        <h2 className="text-xl font-black" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {materials.length === 1 ? materials[0].title : `${materials.length} Materials`}
                        </h2>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-gray-100">
                        <X size={18} style={{ color: C.onSurfaceVariant }} />
                    </button>
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 custom-scrollbar">
                    {materials.map(m => {
                        const ev = localEvals[m.materialId] || { status: 'PENDING', note: '' };
                        const isAccepted = ev.status === 'ACCEPTED';
                        const isRejected = ev.status === 'REJECTED';

                        return (
                            <div key={m.materialId}
                                className="rounded-2xl border overflow-hidden transition-all"
                                style={{
                                    borderColor: isAccepted ? C.primary + '66' : isRejected ? C.danger + '66' : C.outlineVariant,
                                    background: isAccepted ? C.primaryLight : isRejected ? C.dangerLight : C.surfaceContainer,
                                }}>
                                {/* Material header */}
                                <div className="px-5 py-4 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest mb-0.5"
                                            style={{ color: C.onSurfaceVariant }}>
                                            {m.materialType || 'GENERAL'}
                                        </p>
                                        <h3 className="text-sm font-bold line-clamp-1"
                                            style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            {m.title}
                                        </h3>
                                    </div>
                                    {/* Accept / Reject toggle */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => setStatus(m.materialId, 'ACCEPTED')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                            style={{
                                                background: isAccepted ? C.primary : 'white',
                                                color: isAccepted ? 'white' : C.primary,
                                                border: `2px solid ${C.primary}`,
                                            }}>
                                            <CheckCircle2 size={13} />
                                            Accept
                                        </button>
                                        <button
                                            onClick={() => setStatus(m.materialId, 'REJECTED')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                            style={{
                                                background: isRejected ? C.danger : 'white',
                                                color: isRejected ? 'white' : C.danger,
                                                border: `2px solid ${C.danger}`,
                                            }}>
                                            <XCircle size={13} />
                                            Reject
                                        </button>
                                    </div>
                                </div>

                                {/* Only show note textarea when rejected */}
                                {isRejected && (
                                    <div className="px-5 pb-4 animate-in slide-in-from-top-2 duration-200">
                                        <label className="text-[9px] font-black uppercase tracking-widest mb-1.5 block"
                                            style={{ color: C.danger }}>
                                            Reason for Rejection *
                                        </label>
                                        <textarea
                                            value={ev.note}
                                            onChange={e => setNote(m.materialId, e.target.value)}
                                            placeholder="Describe what needs to be fixed or improved..."
                                            rows={3}
                                            className="w-full rounded-xl p-3 text-sm font-medium resize-none outline-none transition-all"
                                            style={{
                                                background: 'white',
                                                border: `2px solid ${C.danger}44`,
                                                color: C.onSurface,
                                            }}
                                            onFocus={e => { e.currentTarget.style.borderColor = C.danger; }}
                                            onBlur={e => { e.currentTarget.style.borderColor = `${C.danger}44`; }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t flex items-center justify-between gap-4"
                    style={{ borderColor: C.outlineVariant }}>
                    <p className="text-[10px] font-bold" style={{ color: C.onSurfaceVariant }}>
                        {materials.filter(m => localEvals[m.materialId]?.status !== 'PENDING').length} / {materials.length} evaluated
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                            style={{ background: C.surfaceContainer, color: C.onSurfaceVariant }}>
                            Cancel
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={!allDone || isSaving}
                            className="relative overflow-hidden px-8 py-2.5 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            style={{
                                background: allDone ? `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` : '#adb4a8',
                                boxShadow: allDone ? `0 6px 16px rgba(76,175,80,0.35)` : 'none',
                            }}>
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Save & Finish
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
