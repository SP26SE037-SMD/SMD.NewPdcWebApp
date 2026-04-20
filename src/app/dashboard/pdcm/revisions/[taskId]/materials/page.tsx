"use client";

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskService } from '@/services/task.service';
import { MaterialService } from '@/services/material.service';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Edit2, FileType, ListOrdered, X, CheckCircle2 } from 'lucide-react';
import { useRevisionRequest } from '@/hooks/useRevisionRequest';
import { ReviewerFeedback } from '@/components/dashboard/ReviewerFeedback';

const C = {
    primary: "#41683f",
    primaryDim: "#355c34",
    primaryContainer: "#c1eeba",
    onPrimaryContainer: "#345a32",
    secondaryContainer: "#d5e8cf",
    onSecondaryContainer: "#465643",
    tertiaryContainer: "#f9fbb7",
    onTertiaryContainer: "#5e602c",
    surface: "#f8faf2",
    surfaceContainerLowest: "#ffffff",
    surfaceContainerLow: "#f1f5eb",
    surfaceContainer: "#ebf0e5",
    surfaceContainerHigh: "#e4eade",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    outlineVariant: "#adb4a8",
    onPrimary: "#eaffe2",
};

type Material = {
    materialId: string;
    title: string;
    materialType: string;
    uploadedAt: string;
    id: number;
    version: number;
    status: string;
    syllabusId: string;
};

export default function RevisionMaterialsPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const router = useRouter();

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
    });

    const realTask = routeTaskData?.data;
    const syllabusId = realTask?.syllabus?.syllabusId;
    const displayId = realTask?.taskId || taskId;

    // Fetch Revision Request Data (Always enabled for this route)
    const { data: revisionRequest, isLoading: isRevisionLoading } = useRevisionRequest(taskId, true);

    const { data: materialsData, isLoading: isMaterialsLoading } = useQuery({
        queryKey: ['pdcm-materials', syllabusId, 'REVISION_REQUESTED'],
        queryFn: () => MaterialService.getMaterialsBySyllabusId(syllabusId!, 'REVISION_REQUESTED'),
        enabled: !!syllabusId,
    });

    const materials: Material[] = (materialsData?.data as Material[]) || [];
    const queryClient = useQueryClient();

    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [modalType, setModalType] = useState<'RENAME' | 'TYPE' | 'ORDER' | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [tempTitle, setTempTitle] = useState("");
    const [tempType, setTempType] = useState("");
    const [tempOrder, setTempOrder] = useState<string | number>(0);

    const openModal = (material: Material, type: 'RENAME' | 'TYPE' | 'ORDER') => {
        setEditingMaterial(material);
        setModalType(type);
        setTempTitle(material.title);
        setTempType(material.materialType);
        setTempOrder(material.id);
        setActiveMenuId(null);
    };

    const handleUpdate = async () => {
        if (!editingMaterial) return;
        setIsUpdating(true);
        try {
            await MaterialService.updateMaterial(editingMaterial.materialId, {
                title: tempTitle,
                materialType: tempType,
                id: Number(tempOrder) || 0,
                syllabusId: editingMaterial.syllabusId
            });
            queryClient.invalidateQueries({ queryKey: ['pdcm-materials'] });
            setModalType(null);
            setEditingMaterial(null);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Update failed. Please try again.");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isTaskLoading || (syllabusId && isMaterialsLoading)) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: C.primary }}></div>
            </div>
        );
    }

    if (!realTask) return null;

    return (
        <div className="space-y-0 relative">
            {!isRevisionLoading && revisionRequest && (
                <div className="mb-6">
                    <ReviewerFeedback 
                        reviewer={revisionRequest.reviewer}
                        comments={[{ title: 'Material Feedback', content: revisionRequest.commentMaterial }]}
                    />
                </div>
            )}

            <div className="px-0 py-0 flex justify-between items-end mb-2">
                <div className="max-w-2xl">
                    <h1 className="text-xl font-extrabold tracking-tight mb-0.5 leading-none" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Materials
                    </h1>
                </div>
                <div className="flex gap-4">
                    <button 
                         onClick={() => router.push(`/dashboard/pdcm/materials/new?syllabusId=${syllabusId}&taskId=${taskId}`)}
                         className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] shadow-lg text-sm"
                         style={{ background: '#4caf50', color: 'white' }}
                     >
                         <span className="material-symbols-outlined text-[20px]">add</span>
                         New Material
                     </button>
                </div>
            </div>

            <div className="max-h-[calc(100vh-180px)] overflow-y-auto custom-scrollbar px-6 py-4 rounded-t-[24px]" style={{ background: C.surfaceContainerLow }}>
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Draft Materials (Revision)
                        </h2>
                        <div className="h-px flex-1" style={{ background: `${C.outlineVariant}26` }}></div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: C.secondaryContainer, color: C.onSecondaryContainer }}>
                            {materials.length} ITEMS
                        </span>
                    </div>

                    {materials.length === 0 ? (
                        <div className="grid grid-cols-12 gap-8">
                            <div className="col-span-12 rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all"
                                style={{ background: C.surfaceContainerLowest, border: `1px solid ${C.outlineVariant}1a` }}>
                                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: C.surfaceContainer }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: `${C.primary}80` }}>auto_stories</span>
                                </div>
                                <h3 className="text-xl font-bold mb-2" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    No Draft Materials Found
                                </h3>
                                <p className="text-sm opacity-60 max-w-xs" style={{ color: C.onSurfaceVariant }}>
                                    Current syllabus does not have any materials in the draft state to revise.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {materials.map(material => (
                                <div key={material.materialId}
                                    className="rounded-xl p-4 group transition-all hover:shadow-md"
                                    style={{ background: C.surfaceContainerLowest, border: `1px solid ${C.outlineVariant}1a` }}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: C.primary }}>
                                            {material.materialType || 'Document'}
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase disabled:opacity-50 shadow-lg" style={{ background: '#fef3c7', color: '#92400e' }}>
                                            REVISION_REQ
                                        </span>
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === material.materialId ? null : material.materialId); }}
                                                className="p-1 rounded-lg hover:bg-[#dee5d8] transition-colors"
                                                style={{ color: C.onSurfaceVariant }}
                                            >
                                                <MoreVertical size={16} />
                                            </button>
                                            
                                            <AnimatePresence>
                                                {activeMenuId === material.materialId && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                                        <motion.div 
                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#dee1d8] py-2 z-20"
                                                        >
                                                            <button onClick={() => openModal(material, 'RENAME')} className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-[#f1f5eb] transition-colors" style={{ color: '#2d342b' }}>
                                                                <Edit2 size={14} /> Rename
                                                            </button>
                                                            <button onClick={() => openModal(material, 'TYPE')} className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-[#f1f5eb] transition-colors" style={{ color: '#2d342b' }}>
                                                                <FileType size={14} /> Change Type
                                                            </button>
                                                            <button onClick={() => openModal(material, 'ORDER')} className="w-full px-4 py-2 text-left text-xs font-bold flex items-center gap-2 hover:bg-[#f1f5eb] transition-colors" style={{ color: '#2d342b' }}>
                                                                <ListOrdered size={14} /> Change Order
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-bold mb-3 line-clamp-2" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        {material.title}
                                    </h3>
                                    <div className="flex items-center gap-1.5 mb-3" style={{ color: C.onSurfaceVariant }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
                                        <span className="text-[10px]">{new Date(material.uploadedAt).toLocaleDateString()}</span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/dashboard/pdcm/materials/${material.materialId}/edit?syllabusId=${syllabusId}&taskId=${taskId}`)}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-primary/5 active:scale-95"
                                        style={{ border: `1.5px solid ${C.primary}`, color: C.primary }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                                        Edit Material
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {modalType && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => !isUpdating && setModalType(null)}
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative z-10"
                        >
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold" style={{ color: '#2d342b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        {modalType === 'RENAME' ? 'Rename Material' : 
                                         modalType === 'TYPE' ? 'Change Material Type' : 
                                         'Change Material Order'}
                                    </h3>
                                    <button onClick={() => setModalType(null)} className="p-2 rounded-full hover:bg-[#f1f5eb] transition-colors">
                                        <X size={20} style={{ color: '#adb4a8' }} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {modalType === 'RENAME' && (
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#adb4a8' }}>New Title</label>
                                            <input 
                                                autoFocus
                                                type="text" 
                                                value={tempTitle}
                                                onChange={e => setTempTitle(e.target.value)}
                                                className="w-full px-4 py-3 rounded-2xl border border-[#dee1d8] bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-[#41683f26] transition-all"
                                                style={{ color: '#2d342b' }}
                                            />
                                        </div>
                                    )}

                                    {modalType === 'TYPE' && (
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#adb4a8' }}>Material Type</label>
                                            <select 
                                                value={tempType}
                                                onChange={e => setTempType(e.target.value)}
                                                className="w-full px-4 py-3 rounded-2xl border border-[#dee1d8] bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-[#41683f26] transition-all appearance-none cursor-pointer"
                                                style={{ color: '#2d342b' }}
                                            >
                                                <option value="DOCUMENT">Document</option>
                                                <option value="ASSIGNMENT">Assignment</option>
                                                <option value="READING">Reading</option>
                                            </select>
                                        </div>
                                    )}

                                    {modalType === 'ORDER' && (
                                        <div>
                                            <label className="block text-[10px] font-bold tracking-widest uppercase mb-2" style={{ color: '#adb4a8' }}>Order Index (Sequence ID)</label>
                                            <input 
                                                autoFocus
                                                type="number" 
                                                value={tempOrder}
                                                onChange={e => setTempOrder(e.target.value)}
                                                className="w-full px-4 py-3 rounded-2xl border border-[#dee1d8] bg-white text-sm font-semibold outline-none focus:ring-2 focus:ring-[#41683f26] transition-all"
                                                style={{ color: '#2d342b' }}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="mt-10 flex gap-3">
                                    <button 
                                        onClick={() => setModalType(null)}
                                        disabled={isUpdating}
                                        className="flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all hover:bg-[#f1f5eb]"
                                        style={{ color: '#5a6157' }}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleUpdate}
                                        disabled={isUpdating || (modalType === 'RENAME' && !tempTitle.trim())}
                                        className="flex-2 flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 shadow-lg shadow-[#41683f26]"
                                        style={{ background: '#41683f', color: 'white' }}
                                    >
                                        {isUpdating ? (
                                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 size={18} />
                                                Confirm Update
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
