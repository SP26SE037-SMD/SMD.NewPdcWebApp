"use client";

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useReview } from '../ReviewContext';
import { useToast } from '@/components/ui/Toast';

interface MaterialItem {
    materialId: string;
    title: string;
    materialType?: string;
}

interface MaterialEvaluateModalProps {
    isOpen: boolean;
    onClose: () => void;
    materials: MaterialItem[];
    taskId: string;
}

type EvalState = { status: 'ACCEPTED' | 'REJECTED' | 'PENDING'; note: string };

export function MaterialEvaluateModal({ isOpen, onClose, materials, taskId }: MaterialEvaluateModalProps) {
    const { setMaterialEvaluation, materialEvaluations, setMaterialsReview } = useReview();
    const { showToast } = useToast();

    const [localEvals, setLocalEvals] = useState<Record<string, EvalState>>({});
    const [isSaving, setIsSaving] = useState(false);

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
        // Validation check for Rejected items without notes
        const invalidMaterial = materials.find(m => {
            const ev = localEvals[m.materialId];
            return ev?.status === 'REJECTED' && !ev.note.trim();
        });

        if (invalidMaterial) {
            showToast(`Please provide a reason for rejecting: ${invalidMaterial.title}`, "error");
            const el = document.getElementById(`eval-item-${invalidMaterial.materialId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Block save
        }

        setIsSaving(true);
        materials.forEach(m => {
            const ev = localEvals[m.materialId];
            if (!ev) return;
            setMaterialEvaluation(m.materialId, {
                materialId: m.materialId,
                title: m.title,
                status: ev.status,
                note: ev.note,
            });
        });

        const payload = materials.map(m => ({
            materialId: m.materialId,
            title: m.title,
            status: localEvals[m.materialId]?.status ?? 'PENDING',
            note: localEvals[m.materialId]?.note ?? '',
        }));
        localStorage.setItem(`pdcm-review-materials-${taskId}`, JSON.stringify(payload));

        const evList = materials.map(m => localEvals[m.materialId]?.status);
        const hasRejected = evList.some(s => s === 'REJECTED');
        const allReviewed = evList.every(s => s === 'ACCEPTED' || s === 'REJECTED');
        if (allReviewed) {
            setMaterialsReview({
                status: hasRejected ? 'FAIL' : 'PASS',
                note: hasRejected ? 'Some materials were rejected.' : 'All materials accepted.',
            });
        }

        setTimeout(() => { setIsSaving(false); onClose(); }, 400);
    };

    const allDone = materials.every(m => localEvals[m.materialId]?.status !== 'PENDING');

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300">

                {/* Header Section */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-[#4caf50] uppercase tracking-wider mb-0.5">Material Evaluation</p>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {materials.length === 1 ? materials[0].title : "Bulk Material Review"}
                        </h2>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                    {materials.map((m, index) => {
                        const ev = localEvals[m.materialId] || { status: 'PENDING', note: '' };
                        return (
                            <div key={m.materialId} id={`eval-item-${m.materialId}`} className={`space-y-6 scroll-mt-6 ${index > 0 ? 'pt-8 border-t border-gray-100' : ''}`}>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Document</p>
                                    <h3 className="text-lg font-bold text-gray-900">{m.title}</h3>
                                </div>

                                {/* Decision Toggles */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setStatus(m.materialId, 'ACCEPTED')}
                                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                                            ev.status === 'ACCEPTED' 
                                                ? 'border-green-600 bg-green-50' 
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            ev.status === 'ACCEPTED' ? 'border-green-600' : 'border-gray-300'
                                        }`}>
                                            {ev.status === 'ACCEPTED' && <div className="w-2.5 h-2.5 rounded-full bg-green-600" />}
                                        </div>
                                        <span className={`text-sm font-bold ${ev.status === 'ACCEPTED' ? 'text-green-700' : 'text-gray-900'}`}>Accept Material</span>
                                    </button>

                                    <button
                                        onClick={() => setStatus(m.materialId, 'REJECTED')}
                                        className={`p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                                            ev.status === 'REJECTED' 
                                                ? 'border-red-600 bg-red-50' 
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            ev.status === 'REJECTED' ? 'border-red-600' : 'border-gray-300'
                                        }`}>
                                            {ev.status === 'REJECTED' && <div className="w-2.5 h-2.5 rounded-full bg-red-600" />}
                                        </div>
                                        <span className={`text-sm font-bold ${ev.status === 'REJECTED' ? 'text-red-700' : 'text-gray-900'}`}>Reject Material</span>
                                    </button>
                                </div>

                                {/* Note Area - Only for Rejected */}
                                {ev.status === 'REJECTED' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <label className={`text-[10px] font-black uppercase tracking-widest ${!ev.note.trim() ? 'text-rose-500 animate-pulse' : 'text-red-600'}`}>
                                            Reason for Rejection * {!ev.note.trim() && "(Required)"}
                                        </label>
                                        <textarea
                                            value={ev.note}
                                            onChange={(e) => setNote(m.materialId, e.target.value)}
                                            placeholder="Reviewer Comments or Reason for Rejection..."
                                            className={`w-full min-h-[120px] p-4 rounded-xl border-2 bg-white outline-none text-sm font-medium transition-all resize-none shadow-inner ${
                                                !ev.note.trim() ? 'border-rose-200 focus:border-rose-500' : 'border-red-100 focus:border-red-500'
                                            }`}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer Section */}
                <div className="px-8 py-5 border-t border-gray-100 bg-white flex items-center justify-between">
                    <button 
                        onClick={onClose} 
                        className="text-sm font-bold text-gray-500 hover:text-red-600 underline underline-offset-4"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!allDone || isSaving}
                        className="px-10 py-3.5 rounded-xl bg-[#2e5d32] text-sm font-black text-white uppercase tracking-widest hover:bg-[#1e3d21] active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-3 shadow-lg shadow-green-900/20"
                    >
                        {isSaving && <Loader2 size={18} className="animate-spin" />}
                        Save & Finish
                    </button>
                </div>
            </div>
        </div>
    );
}
