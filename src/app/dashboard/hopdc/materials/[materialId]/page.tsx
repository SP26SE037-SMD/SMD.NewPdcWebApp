"use client";

import React, { use, useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileText, Info, Eye, AlertCircle, X, Check, ClipboardList, MessageSquare } from 'lucide-react';
import { BlockService, BlockItem } from "@/services/block.service";
import { MaterialService } from "@/services/material.service";
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { SyllabusInfoModal } from '@/components/dashboard/SyllabusInfoModal';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useToast } from "@/components/ui/Toast";
import { TaskService } from "@/services/task.service";
import { AccountService } from "@/services/account.service";
import { SprintService } from "@/services/sprint.service";
import { HeaderRightActions } from '@/components/layout/HeaderRightActions';
import { FinalDecisionCard } from '@/components/hopdc/syllabus/FinalDecisionCard';

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

export default function HoPDCMaterialMonitorPage({ params }: { params: Promise<{ materialId: string }> }) {
    const { materialId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTitle = searchParams.get('title');
    const syllabusId = searchParams.get('syllabusId');
    const rejectComment = searchParams.get('comment');
    const evalStatus = searchParams.get('status');
    const taskIdFromUrl = searchParams.get('taskId');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [showRejectBanner, setShowRejectBanner] = useState(true);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isDecisionOpen, setIsDecisionOpen] = useState(false);

    const [activeAnchor, setActiveAnchor] = useState<string | null>(null);

    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const { user } = useSelector((state: RootState) => state.auth);

    // Final Decision card state managed internally by FinalDecisionCard component

    // Fetch task details by taskIdFromUrl
    const { data: urlTask } = useQuery({
        queryKey: ["task-by-id", taskIdFromUrl],
        queryFn: async () => {
            if (!taskIdFromUrl) return null;
            const res = await TaskService.getTaskById(taskIdFromUrl);
            return res?.data || null;
        },
        enabled: !!taskIdFromUrl,
    });

    // Fetch CREATE/UPDATE SYLLABUS task by syllabusId
    const { data: createSyllabusTask, error: taskQueryError, isLoading: isTaskQueryLoading } = useQuery({
        queryKey: ['create-syllabus-task-by-syllabus', syllabusId],
        queryFn: async () => {
            console.log("[Material Detail Debug] Fetching tasks for syllabusId:", syllabusId);
            if (!syllabusId) return null;
            try {
                // Try querying by syllabusId first via getTasks (which supports syllabusId query param)
                let res = await TaskService.getTasks({
                    syllabusId: syllabusId,
                    size: 50,
                });
                let list = res?.content || [];
                
                // Fallback to targetId if syllabusId returned nothing
                if (list.length === 0) {
                    console.log("[Material Detail Debug] No tasks found by syllabusId, trying targetId...");
                    res = await TaskService.getTasks({
                        targetId: syllabusId,
                        size: 50,
                    });
                    list = res?.content || [];
                }
                
                console.log("[Material Detail Debug] API response tasks list:", list);
                // Prioritize active (not DONE/CANCELLED) syllabus tasks
                const activeSyllabusTask = list.find(t => 
                    (t.action === 'CREATE' || t.action === 'UPDATE' || t.type === 'SYLLABUS' || t.type === 'SYLLABUS_DEVELOP') &&
                    t.status !== 'DONE'
                );
                
                const matchedTask = activeSyllabusTask
                    || list.find(t => t.action === 'CREATE' || t.action === 'UPDATE') 
                    || list.find(t => t.type === 'SYLLABUS' || t.type === 'SYLLABUS_DEVELOP') 
                    || list[0] 
                    || null;
                console.log("[Material Detail Debug] Selected syllabus task:", matchedTask);
                return matchedTask;
            } catch (err) {
                console.error("[Material Detail Debug] Error fetching tasks:", err);
                throw err;
            }
        },
        enabled: !!syllabusId,
    });

    if (taskQueryError) {
        console.error("[Material Detail Debug] Query error:", taskQueryError);
    }

    // Handled internally by FinalDecisionCard component

    const normalizedStatus = evalStatus?.toUpperCase()?.trim();
    const isRevisionRequested = normalizedStatus === 'REVISION_REQUIRED' || 
                               normalizedStatus === 'REVISION_REQUESTED' ||
                               normalizedStatus?.replace(/_/g, ' ') === 'REVISION REQUESTED';

    const hasDecisionBeenMade = createSyllabusTask && (createSyllabusTask.isAccepted !== null && createSyllabusTask.isAccepted !== undefined);

    const activeTaskForDecision = taskIdFromUrl ? urlTask : createSyllabusTask;
    const showFloatingDecision = !!syllabusId && (!!createSyllabusTask || !!taskIdFromUrl) && activeTaskForDecision?.isAccepted !== true;

    // 1. Fetch Material details
    const { data: materialRes, isLoading: isMaterialLoading } = useQuery({
        queryKey: ['hopdc-monitor-material-detail', materialId],
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
        queryKey: ['hopdc-monitor-material-blocks-infinite', materialId],
        queryFn: ({ pageParam = 1 }) => BlockService.getBlocksByMaterialId(materialId as string, pageParam as number, 20),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const pagedData = lastPage.data;
            if (!pagedData || !pagedData.content || pagedData.content.length === 0) {
                return undefined;
            }
            if (pagedData.content.length < 20) {
                return undefined;
            }
            return allPages.length + 1;
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

    if (isMaterialLoading || isBlocksLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <>
        <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden rounded-3xl border border-zinc-200 shadow-sm bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>
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
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase" style={{ background: '#dee5d8', color: '#5a6157' }}>MONITORING</span>
                                    <span className="text-[10px] font-medium" style={{ color: 'rgba(45,52,43,0.6)' }}>Read-only View</span>
                                </div>
                            </div>
                        </div>



                        <div className="space-y-4">
                            {/* Heading Outline */}
                            {outlineItems.length > 0 && (
                                <div className="p-5 rounded-[24px] bg-white border border-[#dee5d8]/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_4px_25px_rgb(0,0,0,0.06)] transition-shadow">
                                    <h4 className="text-[10px] font-black tracking-widest uppercase mb-4 flex items-center gap-2" style={{ color: '#8b9485' }}>
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#41683f]"></div>
                                        Table of Contents
                                    </h4>
                                    <nav className="space-y-1.5">
                                        {outlineItems.map(item => (
                                            <button key={item.id} onClick={() => scrollToBlock(item.id)} title={item.content.length > 80 ? item.content.substring(0, 80) + '...' : item.content}
                                                className="w-full text-left py-2.5 px-4 truncate transition-all rounded-xl relative group overflow-hidden"
                                                style={{
                                                    background: activeAnchor === item.id ? 'linear-gradient(to right, #ebf0e5, #f4f7ef)' : 'transparent',
                                                    paddingLeft: item.type === 'H2' ? '28px' : '16px'
                                                }}
                                            >
                                                {activeAnchor === item.id && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#41683f] rounded-r-full"></div>
                                                )}
                                                <span 
                                                    className="relative z-10 text-[12px] font-bold transition-colors"
                                                    style={{ color: activeAnchor === item.id ? '#2d342b' : '#5a6157' }}
                                                >
                                                    {item.content}
                                                </span>
                                                <div className="absolute inset-0 bg-[#ebf0e5]/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            </button>
                                        ))}
                                    </nav>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* ── Main Content Area ── */}
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
                        <div className="w-full max-w-[850px] mx-auto bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e6e9e0] rounded-sm min-h-[1100px] h-max shrink-0 px-16 pt-12 pb-20 relative">
                            <div className="flex flex-col gap-y-4">
                                {parsedBlocks.map((block, idx) => (
                                    <div
                                        key={`${block.id}-${idx}`}
                                        id={block.id}
                                        ref={isTriggerItem(idx) ? triggerRef : null}
                                        className="relative"
                                    >
                                        {renderReadOnlyBlock(block, parsedBlocks, idx)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isFetchingNextPage && (
                        <div className="flex justify-center py-10">
                            <Loader2 size={24} className="animate-spin text-primary-500" />
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Floating Syllabus Info Button */}
        {syllabusId && (
            <>
                <button
                    onClick={() => setIsInfoModalOpen(true)}
                    className="fixed bottom-10 right-10 z-[100] flex items-center gap-2 px-5 py-3 rounded-full font-bold uppercase tracking-widest text-[11px] shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all border-2 border-white"
                    style={{ background: 'var(--primary)', color: '#ffffff' }}
                >
                    <Info size={16} />
                    Syllabus Info
                </button>

                <SyllabusInfoModal 
                    isOpen={isInfoModalOpen} 
                    onClose={() => setIsInfoModalOpen(false)} 
                    syllabusId={syllabusId} 
                />
            </>
        )}

        {/* Floating Panels Container */}
        {(rejectComment || showFloatingDecision) && (
            <div className="fixed top-32 right-6 z-[150] flex flex-col items-end gap-4 pointer-events-none">
                {/* Floating Rejection Comment Banner */}
                {rejectComment && (
                    <div className="flex items-start gap-3 pointer-events-auto">
                        {isFeedbackOpen && (
                            <div id="rejected-feedback-banner" className="w-96 p-5 rounded-2xl border border-rose-200 bg-white/95 backdrop-blur-md text-left flex items-start gap-4 shadow-2xl animate-in fade-in slide-in-from-right-4 duration-300 relative">
                                <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
                                    <AlertCircle size={20} />
                                </div>
                                <div className="space-y-1 relative w-full pr-6">
                                    <p className="text-[10px] font-black text-rose-700 uppercase tracking-widest leading-none mb-1">
                                        Rejected Feedback
                                    </p>
                                    <p className="text-xs font-bold text-rose-955 leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                                        {rejectComment}
                                    </p>
                                </div>
                            </div>
                        )}
                        <button
                            onClick={() => setIsFeedbackOpen(!isFeedbackOpen)}
                            className={`relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg border transition-all duration-300 shrink-0 ${
                                isFeedbackOpen 
                                    ? 'bg-rose-600 border-rose-600 text-white hover:bg-rose-700' 
                                    : 'bg-white border-rose-200 text-rose-600 hover:bg-rose-50 hover:scale-105 active:scale-95'
                            }`}
                            title="View Rejected Feedback"
                        >
                            {isFeedbackOpen ? <X size={20} /> : <AlertCircle size={20} />}
                            {!isFeedbackOpen && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Floating Decision Card */}
                {showFloatingDecision && (
                    <div className="flex items-start gap-3 pointer-events-auto">
                        {isDecisionOpen && (
                            <div className="w-96 relative">
                                <FinalDecisionCard syllabusId={syllabusId} taskId={taskIdFromUrl || createSyllabusTask?.taskId} />
                            </div>
                        )}
                        <button
                            onClick={() => setIsDecisionOpen(!isDecisionOpen)}
                            className={`relative flex items-center justify-center w-12 h-12 rounded-full shadow-lg border transition-all duration-300 shrink-0 ${
                                isDecisionOpen 
                                    ? 'bg-amber-600 border-amber-600 text-white hover:bg-amber-700' 
                                    : 'bg-white border-amber-200 text-amber-600 hover:bg-amber-50 hover:scale-105 active:scale-95'
                            }`}
                            title="Syllabus Approval Decision"
                        >
                            {isDecisionOpen ? <X size={20} /> : <ClipboardList size={20} />}
                            {!isDecisionOpen && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        )}
        </>
    );
}

// ── Read-Only Block Renderer (Reused from Review Viewer) ──
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
                    className={`font-medium py-2 leading-[1.8] ${alignClass}`}
                    style={{ color: color || '#5a6157', fontSize: fontSize || '16px' }}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        case 'BULLET_LIST':
            return (
                <div className="flex items-start gap-3 py-1.5">
                    <div className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#2d342b' }}></div>
                    <div className="flex-1 font-medium leading-[1.8]" style={{ color: color || '#5a6157', fontSize: fontSize || '16px' }} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        case 'ORDERED_LIST': {
            const orderNum = allBlocks.filter((b, i) => b.type === 'ORDERED_LIST' && i <= globalIndex).length;
            return (
                <div className="flex items-start gap-3 py-1.5">
                    <div className="mt-1.5 text-sm font-bold opacity-30 shrink-0 w-4">{orderNum}.</div>
                    <div className="flex-1 font-medium leading-[1.8]" style={{ color: color || '#5a6157', fontSize: fontSize || '16px' }} dangerouslySetInnerHTML={{ __html: content }} />
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
