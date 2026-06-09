"use client";

import React, { use, useState } from 'react';
import { BookOpen, FileText, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { MaterialService } from '@/services/material.service';
import { TaskService } from '@/services/task.service';
import { useReview } from '../ReviewContext';
import { MaterialEvaluateModal } from '../_components/MaterialEvaluateModal';
import { ReviewTaskService } from '@/services/review-task.service';
import { SyllabusInfoModal } from '@/components/dashboard/SyllabusInfoModal';

export default function PDCMReviewMaterialsPage({ params }: { params: Promise<{ reviewId: string }> }) {
    const { reviewId } = use(params);
    const router = useRouter();
    const { materialEvaluations } = useReview();
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const taskId = reviewId;

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId!),
        enabled: !!taskId,
        staleTime: 5 * 60 * 1000,
    });

    const taskData = routeTaskData?.data;
    const syllabusId = taskData?.syllabus?.syllabusId || (taskData as any)?.syllabusId || taskData?.targetId || (taskData as any)?.target_id;

    const { data: materialsRes, isLoading: isMaterialsLoading } = useQuery({
        queryKey: ['pdcm-materials', syllabusId],
        queryFn: () => MaterialService.getMaterialsBySyllabusId(syllabusId || ""),
        enabled: !!syllabusId,
        staleTime: 5 * 60 * 1000,
    });

    const materials = Array.isArray((materialsRes as any)?.data) ? (materialsRes as any).data : [];
    
    console.log("=== MATERIALS DATA ===", materialsRes, materials);

    if (isTaskLoading || (!!syllabusId && isMaterialsLoading)) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    // Get evaluation status badge for each material
    const getEvalBadge = (materialId: string) => {
        const ev = materialEvaluations[materialId];
        if (!ev || ev.status === 'PENDING') return null;
        if (ev.status === 'ACCEPTED') return { label: 'Accepted', color: '#4caf50', bg: '#e8f5e9' };
        return { label: 'Rejected', color: '#ef4444', bg: '#fef2f2' };
    };

    const evaluatedCount = materials.filter((m: any) => {
        const ev = materialEvaluations[m.materialId];
        return ev && ev.status !== 'PENDING';
    }).length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6 text-left">
            <div className="flex items-center justify-between mb-6 mt-2">
                <h1 className="text-2xl font-bold text-[#2d342b] tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                    Materials
                </h1>

                <button
                    onClick={() => setIsEvalModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:opacity-90 active:scale-[0.98] shadow-md text-sm text-white"
                    style={{ backgroundColor: '#4caf50' }}
                >
                    <ShieldCheck size={18} />
                    Evaluate Now
                    {evaluatedCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-[9px]">
                            {evaluatedCount}/{materials.length}
                        </span>
                    )}
                </button>
            </div>

                {materials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[#dee1d8] rounded-2xl bg-[#f8faf2]/50">
                        <FileText size={28} className="text-[#adb4a8] mb-3" />
                        <h3 className="text-base font-bold text-[#2d342b] mb-1">No materials found</h3>
                        <p className="text-xs text-[#5a6157] max-w-sm">No teaching materials have been created for this syllabus yet.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(
                            materials.reduce((acc: any, m: any) => {
                                const type = m.materialType || 'GENERAL';
                                if (!acc[type]) acc[type] = [];
                                acc[type].push(m);
                                return acc;
                            }, {})
                        ).map(([type, group]: [string, any]) => (
                            <div key={type} className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#dee1d8]"></div>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a6157] whitespace-nowrap bg-[#f8faf2] px-3 py-1 rounded-full border border-[#dee1d8]">
                                        {type.replace('_', ' ')}s
                                    </h3>
                                    <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#dee1d8]"></div>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {group.map((material: any) => {
                                        const badge = getEvalBadge(material.materialId);
                                        return (
                                            <div
                                                key={material.materialId}
                                                className="group border border-[#dee1d8] rounded-2xl p-4 bg-white hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/5 transition-all flex flex-col gap-3 relative overflow-hidden"
                                                style={badge ? { borderColor: badge.color + '55' } : {}}
                                            >
                                                {badge && (
                                                    <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none opacity-10">
                                                        <ShieldCheck 
                                                            size={64} 
                                                            style={{ color: badge.color }} 
                                                            className="-mr-4 -mt-4 rotate-12"
                                                        />
                                                    </div>
                                                )}

                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[9px] font-bold text-[#adb4a8] uppercase tracking-widest mb-1">Document</p>
                                                        <h3 className="text-sm font-extrabold text-[#2d342b] line-clamp-2 group-hover:text-primary-500 transition-colors" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                            {material.title}
                                                        </h3>
                                                        <div className="flex flex-wrap gap-1.5 mt-3">
                                                            {badge && (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide flex items-center gap-1"
                                                                    style={{ background: badge.bg, color: badge.color }}>
                                                                    <ShieldCheck size={10} />
                                                                    {badge.label}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => router.push(`/dashboard/pdcm/reviews/${reviewId}/materials/${material.materialId}?title=${encodeURIComponent(material.title)}`)}
                                                        className="shrink-0 px-5 py-2.5 bg-[#4caf50] hover:bg-[#388e3c] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-green-900/10 active:scale-95 flex items-center gap-2 group/btn"
                                                    >
                                                        <ExternalLink size={12} className="group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                                                        Open
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}




            {/* Material Evaluate Modal (all materials) */}
            <MaterialEvaluateModal
                isOpen={isEvalModalOpen}
                onClose={() => setIsEvalModalOpen(false)}
                materials={materials.map((m: any) => ({
                    materialId: m.materialId,
                    title: m.title,
                    materialType: m.materialType,
                    status: m.status,
                }))}
                taskId={reviewId}
            />

            {/* Floating Syllabus Info Button */}
            <button
                onClick={() => setIsInfoModalOpen(true)}
                className="fixed bottom-10 right-10 z-[100] flex items-center gap-2 px-5 py-3 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-white"
                style={{ background: '#4caf50', color: '#ffffff' }}
            >
                <Info size={16} />
                Syllabus Info
            </button>

            <SyllabusInfoModal 
                isOpen={isInfoModalOpen} 
                onClose={() => setIsInfoModalOpen(false)} 
                syllabusId={routeTaskData?.data?.syllabus?.syllabusId || (routeTaskData?.data as any)?.syllabusId || ''} 
            />

        </div>
    );
}
