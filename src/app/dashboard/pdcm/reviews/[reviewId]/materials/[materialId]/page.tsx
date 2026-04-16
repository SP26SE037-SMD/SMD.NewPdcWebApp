"use client";

import React, { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileText, ShieldCheck, Info, Bell, ChevronDown } from 'lucide-react';
import { BlockService, BlockItem } from "@/services/block.service";
import { MaterialService } from "@/services/material.service";
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { MaterialEvaluateModal } from '../../_components/MaterialEvaluateModal';
import { ReviewTaskService } from '@/services/review-task.service';
import { TaskService } from '@/services/task.service';
import { SyllabusInfoModal } from '@/components/dashboard/SyllabusInfoModal';
import { HeaderRightActions } from '@/components/layout/HeaderRightActions';

// ── Pagination Helpers ──
const PAGE_HEIGHT = 1000;

const stripHtml = (htmlContent: string) => {
    if (typeof window === 'undefined') return htmlContent;
    const tmp = document.createElement("DIV");
    tmp.innerHTML = htmlContent;
    return tmp.textContent || tmp.innerText || "";
};

interface ParsedBlock {
    id: string;
    blockId?: string;
    type: string;
    content: string;
    align: 'left' | 'center' | 'right';
    color?: string;
    fontSize?: string;
}

const getBlockHeight = (block: ParsedBlock) => {
    const textOnly = stripHtml(block.content);
    switch (block.type) {
        case 'H1': return 80;
        case 'H2': return 60;
        case 'IMAGE': return 450;
        case 'CODE_BLOCK': return 200;
        case 'DIVIDER': return 80;
        case 'QUOTE': return 120;
        default: return 40 + (textOnly.length / 80) * 24;
    }
};

const paginateBlocks = (allBlocks: ParsedBlock[]) => {
    const pages: ParsedBlock[][] = [];
    let currentPage: ParsedBlock[] = [];
    let currentHeight = 0;

    allBlocks.forEach(block => {
        const h = getBlockHeight(block);
        if (currentHeight + h > PAGE_HEIGHT && currentPage.length > 0) {
            pages.push(currentPage);
            currentPage = [block];
            currentHeight = h;
        } else {
            currentPage.push(block);
            currentHeight += h;
        }
    });
    if (currentPage.length > 0) pages.push(currentPage);
    if (pages.length === 0) pages.push([]);
    return pages;
};

export default function PDCMReviewMaterialBlocksPage({ params }: { params: Promise<{ reviewId: string, materialId: string }> }) {
    const { reviewId, materialId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTitle = searchParams.get('title');
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const { data: reviewTaskRes, isLoading: isReviewTaskLoading } = useQuery({
        queryKey: ['pdcm-review-detail', reviewId],
        queryFn: () => ReviewTaskService.getReviewTaskById(reviewId),
        enabled: !!reviewId,
        staleTime: 5 * 60 * 1000,
    });

    const taskId = reviewTaskRes?.data?.task?.taskId;

    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId!),
        enabled: !!taskId,
        staleTime: 5 * 60 * 1000,
    });

    const [activeAnchor, setActiveAnchor] = useState<string | null>(null);

    // 1. Fetch Material details
    const { data: materialRes, isLoading: isMaterialLoading } = useQuery({
        queryKey: ['pdcm-material-detail', materialId],
        queryFn: () => MaterialService.getMaterialById(materialId),
        enabled: !!materialId,
    });

    // 2. Fetch Blocks using useInfiniteQuery
    const { 
        data: blocksData, 
        fetchNextPage, 
        hasNextPage, 
        isFetchingNextPage,
        isLoading: isBlocksLoading 
    } = useInfiniteQuery({
        queryKey: ['pdcm-material-blocks-infinite', materialId],
        queryFn: ({ pageParam = 1 }) => BlockService.getBlocksByMaterialId(materialId, pageParam as number, 20),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const pagedData = lastPage.data;
            if (!pagedData || pagedData.page >= pagedData.totalPages - 1 || !pagedData.content || pagedData.content.length === 0) {
                return undefined;
            }
            return pagedData.page + 2;
        },
        enabled: !!materialId,
    });

    const observer = React.useRef<IntersectionObserver | null>(null);
    const triggerRef = React.useCallback((node: HTMLDivElement) => {
        if (isBlocksLoading || isFetchingNextPage) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasNextPage) {
                fetchNextPage();
            }
        }, { threshold: 0.1 });

        if (node) observer.current.observe(node);
    }, [isBlocksLoading, isFetchingNextPage, hasNextPage, fetchNextPage]);

    const materialRaw = materialRes?.data;
    const material = Array.isArray(materialRaw) ? materialRaw[0] : materialRaw;
    const rawBlocks = blocksData?.pages.flatMap(page => page.data.content) || [];

    // Parse blocks into structured format with styles
    const parsedBlocks: ParsedBlock[] = useMemo(() => {
        return rawBlocks.map((b, idx) => {
            let parsedStyle: any = {};
            try {
                if (b.blockStyle && b.blockStyle.startsWith('{')) {
                    parsedStyle = JSON.parse(b.blockStyle);
                } else {
                    parsedStyle = { align: b.blockStyle || 'left' };
                }
            } catch {
                parsedStyle = { align: 'left' };
            }

            return {
                id: `block-${b.blockId || idx}`,
                blockId: b.blockId,
                type: b.blockType?.toUpperCase() || 'PARAGRAPH',
                content: b.contentText || '',
                align: parsedStyle.align || 'left',
                color: parsedStyle.color,
                fontSize: parsedStyle.fontSize,
            };
        });
    }, [rawBlocks]);

    const pages = paginateBlocks(parsedBlocks);

    // Outline items for sidebar
    const outlineItems = useMemo(() => {
        return parsedBlocks
            .filter(b => b.type === 'H1' || b.type === 'H2')
            .map(b => ({
                ...b,
                content: stripHtml(b.content).trim()
            }));
    }, [parsedBlocks]);

    const scrollToBlock = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setActiveAnchor(id);
        }
    };

    const isTriggerItem = (index: number) => {
        if (!hasNextPage || isFetchingNextPage) return false;
        return index === parsedBlocks.length - 9;
    };

    if (isReviewTaskLoading || isTaskLoading || isMaterialLoading || isBlocksLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <>
        <div className="h-dvh w-full flex flex-col overflow-hidden" style={{ background: '#f8faf2', fontFamily: 'Inter, sans-serif' }}>
            {/* ── Top Navigation — matches develop page ── */}
            <header className="flex justify-between items-center px-10 h-20 w-full shrink-0 border-b border-black/5" style={{ background: '#f8faf2' }}>
                <div className="flex items-center gap-6">
                    <img src="/icon-with-name.png" alt="SMD Logo" className="h-8 w-auto cursor-pointer" onClick={() => router.push('/dashboard/pdcm')} />
                </div>

                <div className="flex items-center gap-3">
                    {/* Evaluate Button */}
                    <button
                        onClick={() => setIsEvalModalOpen(true)}
                        className="relative overflow-hidden flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md hover:shadow-lg mr-2"
                        style={{
                            background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
                            boxShadow: '0 4px 12px rgba(76,175,80,0.35)',
                        }}
                    >
                        <ShieldCheck size={14} />
                        Evaluate
                    </button>

                    {/* Divider */}
                    <div className="w-px h-6 bg-[#dee5d8] mx-1"></div>
                    
                    <HeaderRightActions />
                </div>
            </header>

            {/* ── Main Workspace + Sidebar ── */}
            <div className="flex flex-1 overflow-hidden">
                {/* ── Left Sidebar — Outline ── */}
                <aside className="w-72 flex flex-col gap-y-4 p-6 h-full overflow-y-auto"
                    style={{ background: '#f1f5eb', borderRight: '1px solid rgba(173,180,168,0.15)' }}>
                    <div className="mb-6">
                        {/* Navigation & Title */}
                        <div className="flex flex-col gap-3 mb-8">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 self-start p-1.5 -ml-1.5 rounded-lg transition-all text-[#2d342b] hover:bg-[#ebf0e5]"
                            >
                                <ArrowLeft size={16} />
                                <span className="text-xs font-bold uppercase tracking-widest text-[#5a6157]">Back</span>
                            </button>
                            
                            <div className="flex flex-col gap-1">
                                <span className="text-xl font-black tracking-tight leading-tight" style={{ color: '#2d342b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                    {material?.title || initialTitle || "Material Content"}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase" style={{ background: '#dee5d8', color: '#5a6157' }}>REVIEWING</span>
                                    <span className="text-[10px] font-medium" style={{ color: 'rgba(45,52,43,0.6)' }}>Peer review</span>
                                </div>
                            </div>
                        </div>

                        {/* Reviewer Mode Banner */}
                        <div className="flex items-center gap-3 mb-4 p-3 rounded-2xl bg-[#ebf0e5] border border-[#dee5d8]/50">
                            <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center font-black text-sm shrink-0 bg-white"
                                style={{ color: '#41683f', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                <ShieldCheck size={18} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold" style={{ color: '#2d342b' }}>Reviewer Mode</h3>
                                <p className="text-[10px] tracking-wider uppercase font-bold" style={{ color: 'rgba(45,52,43,0.6)' }}>
                                    Read Only · Content Review
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Heading Outline */}
                            {outlineItems.length > 0 && (
                                <div className="p-4 rounded-2xl bg-white border border-[#dee5d8] shadow-sm">
                                    <h4 className="text-[10px] font-black tracking-widest uppercase mb-4" style={{ color: '#adb4a8' }}>On This Page</h4>
                                    <nav className="space-y-1">
                                        {outlineItems.map(item => (
                                            <button key={item.id} onClick={() => scrollToBlock(item.id)} title={item.content}
                                                className="w-full text-left text-[11px] font-bold py-2 truncate transition-all rounded-xl px-3 hover:translate-x-1"
                                                style={{
                                                    background: activeAnchor === item.id ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                                    color: activeAnchor === item.id ? '#4caf50' : '#5a6157',
                                                    paddingLeft: item.type === 'H2' ? '24px' : undefined
                                                }}
                                            >
                                                {item.content}
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="p-4 rounded-2xl bg-white border border-[#dee5d8] shadow-sm">
                                <h4 className="text-[10px] font-black tracking-widest uppercase mb-3" style={{ color: '#adb4a8' }}>Statistics</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium" style={{ color: '#5a6157' }}>Pages</span>
                                        <span className="font-black" style={{ color: '#2d342b' }}>{pages.length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── Main Content Area — Page-style cards ── */}
                <div className="flex-1 overflow-y-auto pb-48 scroll-smooth bg-[#f0f2eb] p-8 pt-4 flex flex-col items-center gap-6">
                    {parsedBlocks.length === 0 ? (
                        <div className="w-full max-w-[850px] mx-auto bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e6e9e0] rounded-sm min-h-[400px] px-16 py-20 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-[#f8faf2] border border-[#e2e8f0] text-[#cbd5e1] rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                                <FileText size={40} />
                            </div>
                            <h3 className="text-xl font-black text-[#1e293b] mb-2">No Content Blocks Found</h3>
                            <p className="text-[#64748b] max-w-xs font-medium">This material doesn&apos;t have any structured content blocks yet.</p>
                        </div>
                    ) : (
                        pages.map((pageBlocks, pageIndex) => (
                            <div key={pageIndex} className="w-full max-w-[850px] mx-auto bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e6e9e0] rounded-sm min-h-[1100px] px-16 pt-12 pb-20 relative">
                                <div className="flex flex-col gap-y-1">
                                    {pageBlocks.map((block, idx) => {
                                        const globalIndex = parsedBlocks.findIndex(b => b.id === block.id);
                                        return (
                                            <div
                                                key={block.id}
                                                id={block.id}
                                                ref={isTriggerItem(globalIndex) ? triggerRef : null}
                                                className="relative"
                                            >
                                                {renderReadOnlyBlock(block, parsedBlocks, globalIndex)}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Page number */}
                                <div className="absolute bottom-6 right-8 text-[10px] font-bold tracking-wider" style={{ color: '#adb4a8' }}>
                                    {pageIndex + 1} / {pages.length}
                                </div>
                            </div>
                        ))
                    )}

                    {isFetchingNextPage && (
                        <div className="flex justify-center py-10">
                            <Loader2 size={24} className="animate-spin text-primary-500" />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Material Evaluate Modal */}
        {material && (
            <MaterialEvaluateModal
                isOpen={isEvalModalOpen}
                onClose={() => setIsEvalModalOpen(false)}
                materials={[{
                    materialId: material.materialId || materialId,
                    title: material.title || initialTitle || 'Material',
                    materialType: material.materialType,
                    status: material.status,
                }]}
                taskId={reviewId}
            />
        )}

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
            syllabusId={routeTaskData?.data?.syllabusId || ''} 
        />
        </>
    );
}

// ── Read-Only Block Renderer ──
function renderReadOnlyBlock(block: ParsedBlock, allBlocks: ParsedBlock[], globalIndex: number) {
    const { align = 'left', color, fontSize, content, type } = block;
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    switch (type) {
        case 'H1':
            return (
                <div
                    className={`font-black py-1 mt-6 mb-4 leading-tight ${alignClass}`}
                    style={{ color: color || '#2d342b', fontSize: fontSize || '36px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        case 'H2':
            return (
                <div
                    className={`font-bold py-1 mt-4 mb-2 leading-tight ${alignClass}`}
                    style={{ color: color || '#2d342b', fontSize: fontSize || '24px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        case 'PARAGRAPH':
            return (
                <div
                    className={`font-medium py-1 leading-relaxed ${alignClass}`}
                    style={{ color: color || '#5a6157', fontSize: fontSize || '16px' }}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        case 'BULLET_LIST':
            return (
                <div className="flex items-start gap-3 py-1">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#2d342b' }}></div>
                    <div className="flex-1 font-medium" style={{ color: color || '#5a6157', fontSize: fontSize || '16px' }} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        case 'ORDERED_LIST': {
            const orderNum = allBlocks.filter((b, i) => b.type === 'ORDERED_LIST' && i <= globalIndex).length;
            return (
                <div className="flex items-start gap-3 py-1">
                    <div className="mt-1 text-sm font-bold opacity-30 shrink-0 w-4">{orderNum}.</div>
                    <div className="flex-1 font-medium" style={{ color: color || '#5a6157', fontSize: fontSize || '16px' }} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        }
        case 'QUOTE':
            return (
                <div className="pl-4 border-l-4 border-primary-500/20 py-2 my-4 bg-primary-50/10">
                    <div className={`font-medium italic ${alignClass}`} style={{ color: color || '#5a6157', fontSize: fontSize || '16px' }} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        case 'CODE_BLOCK':
            return (
                <div className="p-5 bg-zinc-900 rounded-2xl font-mono text-[14px] my-4 shadow-inner">
                    <pre className="text-green-400 whitespace-pre-wrap">{content}</pre>
                </div>
            );
        case 'TABLE':
            return (
                <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-2xl font-mono text-[13px] my-4">
                    <pre className="text-zinc-700 whitespace-pre-wrap">{content}</pre>
                </div>
            );
        case 'DIVIDER':
            return <div className="py-8"><div className="h-px w-full bg-zinc-200"></div></div>;
        case 'IMAGE':
            return (
                <div className={`my-6 rounded-2xl overflow-hidden shadow-md max-w-full ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : 'mr-auto'}`} style={{ width: 'fit-content' }}>
                    <img src={content} alt="Material Content" className="max-w-full h-auto object-contain max-h-[800px]" />
                </div>
            );
        default:
            return <div className={alignClass} style={{ color, fontSize }} dangerouslySetInnerHTML={{ __html: content }} />;
    }
}
