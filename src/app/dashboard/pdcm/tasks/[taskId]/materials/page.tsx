"use client";

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskService } from '@/services/task.service';
import { MaterialService } from '@/services/material.service';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Edit2, FileType, ListOrdered, X, CheckCircle2, Plus, Trash2, LayoutGrid, List } from 'lucide-react';
import ImportModal from '@/components/dashboard/ImportModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import localforage from 'localforage';

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
    syllabusId: string;
};

export default function MaterialsPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const router = useRouter();

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
    });

    const realTask = routeTaskData?.data as any;
    const syllabusId = realTask?.syllabus?.syllabusId || realTask?.syllabusId;
    const displayId = realTask?.taskId || taskId;

    const { data: materialsData, isLoading: isMaterialsLoading } = useQuery({
        queryKey: ['pdcm-materials', syllabusId, 'DRAFT'],
        queryFn: () => MaterialService.getMaterialsBySyllabusId(syllabusId!),
        enabled: !!syllabusId,
        staleTime: 0,
        refetchOnMount: 'always'
    });

    const materials: Material[] = (materialsData?.data as Material[]) || [];
    const queryClient = useQueryClient();

    // Modal & Menu states
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
    const [modalType, setModalType] = useState<'RENAME' | 'TYPE' | 'ORDER' | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    // Form states for modals
    const [tempTitle, setTempTitle] = useState("");
    const [tempType, setTempType] = useState("");
    const [tempOrder, setTempOrder] = useState<string | number>(0);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Delete states
    const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // View mode state
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

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

    const handleDeleteClick = (material: Material) => {
        setMaterialToDelete(material);
        setActiveMenuId(null);
    };

    const handleConfirmDelete = async () => {
        if (!materialToDelete) return;
        setIsDeleting(true);
        try {
            await MaterialService.deleteMaterial(materialToDelete.materialId);
            queryClient.invalidateQueries({ queryKey: ['pdcm-materials'] });
            setMaterialToDelete(null);
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Delete failed. Please try again.");
        } finally {
            setIsDeleting(false);
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

            {/* ── Header ── */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Materials
                    </h1>
                    <p className="text-xs font-semibold flex items-center gap-2" style={{ color: C.onSurfaceVariant }}>
                        <span>{materials.length} item{materials.length !== 1 ? 's' : ''} total</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300"></span>
                        <span>Drag and drop available</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {/* View mode toggle */}
                    <div className="flex items-center bg-[#ebf0e5]/60 p-1 rounded-xl border border-[#dee1d8]/40 mr-1 shrink-0">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#41683f]' : 'text-[#5a6157] hover:text-zinc-800'}`}
                            title="List View"
                        >
                            <List size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#41683f]' : 'text-[#5a6157] hover:text-zinc-800'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={16} />
                        </button>
                    </div>

                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm border"
                        style={{ borderColor: `${C.primary}40`, color: C.primary, background: `${C.primary}08` }}
                    >
                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                        Import File
                    </button>

                    <button
                        onClick={() => router.push(`/dashboard/pdcm/materials/new?syllabusId=${syllabusId}&taskId=${taskId}`)}
                        className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md text-sm text-white"
                        style={{ background: C.primary, boxShadow: `0 4px 12px ${C.primary}40` }}
                    >
                        <Plus size={18} />
                        New Material
                    </button>
                </div>
            </div>

            {/* ── Content Area ── */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pb-10">
                <div className="max-w-6xl mx-auto">

                    {materials.length === 0 ? (
                        <div className="text-center py-24 rounded-[32px] bg-white transition-all hover:shadow-sm" style={{ border: `2px dashed ${C.outlineVariant}40` }}>
                            <div className="p-5 rounded-full w-fit mx-auto mb-5" style={{ background: `${C.primaryContainer}4d` }}>
                                <span className="material-symbols-outlined text-[48px]" style={{ color: C.primary }}>auto_stories</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No Materials Found</h3>
                            <p className="text-sm max-w-sm mx-auto" style={{ color: C.onSurfaceVariant }}>Get started by creating a new material document or importing an existing file.</p>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="bg-white rounded-[24px] overflow-hidden border border-[#dee1d8]/40 shadow-sm animate-in fade-in duration-300">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-zinc-100" style={{ background: `${C.primary}04` }}>
                                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-400 w-12 text-center">#</th>
                                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">Name</th>
                                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">Type</th>
                                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">Uploaded Date</th>
                                            <th className="px-6 py-4 text-[11px] font-black uppercase tracking-wider text-zinc-500 text-right pr-8">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                        {materials.map((material, idx) => (
                                            <tr key={material.materialId} className="hover:bg-zinc-50/50 transition-colors group">
                                                <td className="px-6 py-4 text-xs font-bold text-zinc-400 text-center">{idx + 1}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${C.primary}12`, color: C.primary }}>
                                                            <span className="material-symbols-outlined text-[20px]">
                                                                {material.materialType === 'PDF' ? 'picture_as_pdf' : material.materialType === 'VIDEO' ? 'smart_display' : 'description'}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="text-sm font-extrabold text-[#2d342b] truncate max-w-md" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                                {material.title}
                                                            </h4>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border" style={{ background: `${C.primary}08`, color: C.primary, borderColor: `${C.primary}20` }}>
                                                        {material.materialType || 'Document'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-semibold text-zinc-500">
                                                    {new Date(material.uploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                </td>
                                                <td className="px-6 py-4 text-right pr-8">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => router.push(`/dashboard/pdcm/materials/${material.materialId}/edit?syllabusId=${syllabusId}&taskId=${taskId}`)}
                                                            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all flex items-center justify-center cursor-pointer"
                                                            title="View"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                        </button>
                                                        <button
                                                            onClick={() => router.push(`/dashboard/pdcm/materials/${material.materialId}/edit?syllabusId=${syllabusId}&taskId=${taskId}`)}
                                                            className="p-2 rounded-lg text-zinc-400 hover:text-[#41683f] hover:bg-[#41683f]08 transition-all flex items-center justify-center cursor-pointer"
                                                            title="Edit"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        </button>
                                                        
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === material.materialId ? null : material.materialId); }}
                                                                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-all flex items-center justify-center cursor-pointer"
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
                                                                            className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-zinc-100 py-1.5 z-20 text-left"
                                                                        >
                                                                            <button onClick={() => openModal(material, 'RENAME')} className="w-full px-3.5 py-2 text-left text-[11px] font-bold flex items-center gap-2.5 hover:bg-zinc-50 transition-colors" style={{ color: C.onSurface }}>
                                                                                <Edit2 size={14} /> Rename
                                                                            </button>
                                                                            <button onClick={() => openModal(material, 'TYPE')} className="w-full px-3.5 py-2 text-left text-[11px] font-bold flex items-center gap-2.5 hover:bg-zinc-50 transition-colors" style={{ color: C.onSurface }}>
                                                                                <FileType size={14} /> Change Type
                                                                            </button>
                                                                            <button onClick={() => openModal(material, 'ORDER')} className="w-full px-3.5 py-2 text-left text-[11px] font-bold flex items-center gap-2.5 hover:bg-zinc-50 transition-colors" style={{ color: C.onSurface }}>
                                                                                <ListOrdered size={14} /> Change Order
                                                                            </button>
                                                                            <div className="h-px bg-zinc-100 my-1" />
                                                                            <button onClick={() => handleDeleteClick(material)} className="w-full px-3.5 py-2 text-left text-[11px] font-bold flex items-center gap-2.5 hover:bg-red-50 hover:text-red-600 transition-colors text-red-500">
                                                                                <Trash2 size={14} /> Delete
                                                                            </button>
                                                                        </motion.div>
                                                                    </>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                            {materials.map(material => (
                                <div key={material.materialId}
                                    className="relative bg-white rounded-[24px] p-6 group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                    style={{ border: `1px solid ${C.outlineVariant}33` }}
                                >
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: `${C.primary}1a`, color: C.primary }}>
                                                <span className="material-symbols-outlined text-[22px]">
                                                    {material.materialType === 'PDF' ? 'picture_as_pdf' : material.materialType === 'VIDEO' ? 'smart_display' : 'description'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: C.primary }}>
                                                    {material.materialType || 'Document'}
                                                </span>
                                                <div className="flex items-center gap-1 mt-0.5" style={{ color: C.onSurfaceVariant }}>
                                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                                    <span className="text-[10px] font-semibold tracking-wide">{new Date(material.uploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === material.materialId ? null : material.materialId); }}
                                                className="p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
                                                style={{ color: C.onSurfaceVariant }}
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            <AnimatePresence>
                                                {activeMenuId === material.materialId && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                            className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-zinc-100 py-2 z-20"
                                                        >
                                                            <button onClick={() => openModal(material, 'RENAME')} className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-3 hover:bg-zinc-50 transition-colors" style={{ color: C.onSurface }}>
                                                                <Edit2 size={16} /> Rename
                                                            </button>
                                                            <button onClick={() => openModal(material, 'TYPE')} className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-3 hover:bg-zinc-50 transition-colors" style={{ color: C.onSurface }}>
                                                                <FileType size={16} /> Change Type
                                                            </button>
                                                            <button onClick={() => openModal(material, 'ORDER')} className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-3 hover:bg-zinc-50 transition-colors" style={{ color: C.onSurface }}>
                                                                <ListOrdered size={16} /> Change Order
                                                            </button>
                                                            <div className="h-px bg-zinc-100 my-1" />
                                                            <button onClick={() => handleDeleteClick(material)} className="w-full px-4 py-2.5 text-left text-xs font-bold flex items-center gap-3 hover:bg-red-50 hover:text-red-600 transition-colors text-red-500">
                                                                <Trash2 size={16} /> Delete
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                    <h3 className="text-[17px] font-extrabold mb-6 line-clamp-2 leading-snug" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                        {material.title}
                                    </h3>
                                    
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => router.push(`/dashboard/pdcm/materials/${material.materialId}/edit?syllabusId=${syllabusId}&taskId=${taskId}`)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                                            style={{ background: `${C.primaryContainer}80`, color: C.primary }}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                            View
                                        </button>
                                        <button
                                            onClick={() => router.push(`/dashboard/pdcm/materials/${material.materialId}/edit?syllabusId=${syllabusId}&taskId=${taskId}`)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-[0.98]"
                                            style={{ border: `1px solid ${C.outlineVariant}4d`, color: C.onSurfaceVariant }}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Save Button relocated to header */}
                </div>
            </div>

            {/* ── Modals ── */}
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

            <ImportModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                type="material"
                onImport={async (file) => {
                    try {
                        const arrayBuffer = await file.arrayBuffer();
                        await localforage.setItem('pdcm_material_import_draft', {
                            name: file.name,
                            type: file.type,
                            data: arrayBuffer
                        });
                        router.push(`/dashboard/pdcm/materials/new?syllabusId=${syllabusId}&taskId=${taskId}&importDraft=true`);
                    } catch (error) {
                        console.error("Failed to store file for import:", error);
                        alert("Failed to process file. Please try again.");
                    }
                }}
            />

            <ConfirmModal
                isOpen={!!materialToDelete}
                title="Delete Material"
                message={`Are you sure you want to delete "${materialToDelete?.title}"? This action cannot be undone.`}
                confirmLabel={isDeleting ? "Deleting..." : "Delete"}
                cancelLabel="Cancel"
                onConfirm={handleConfirmDelete}
                onClose={() => !isDeleting && setMaterialToDelete(null)}
                isDanger={true}
            />
        </div>
    );
}
