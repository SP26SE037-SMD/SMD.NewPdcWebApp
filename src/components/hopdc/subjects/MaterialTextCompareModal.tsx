import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BlockService } from '@/services/block.service';
import { X, FileText } from 'lucide-react';

interface MaterialTextCompareModalProps {
    oldId?: string;
    newId?: string;
    title: string;
    onClose: () => void;
}

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
    highlightState?: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'NONE';
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

const fetchAllBlocks = async (materialId: string) => {
    let allBlocks: any[] = [];
    let page = 0;
    const size = 100;
    while (true) {
        try {
            const res = await BlockService.getBlocksByMaterialId(materialId, page, size);
            if (res?.data?.content) {
                allBlocks = [...allBlocks, ...res.data.content];
            }
            if (!res?.data?.content || res.data.content.length < size) {
                break;
            }
            page++;
        } catch (error) {
            console.error("Error fetching blocks page:", error);
            break;
        }
    }
    return { data: { content: allBlocks } };
};

export function MaterialTextCompareModal({ oldId, newId, title, onClose }: MaterialTextCompareModalProps) {
    const { data: oldBlocksRes, isLoading: oldLoading } = useQuery({
        queryKey: ['blocks', oldId],
        queryFn: () => oldId ? fetchAllBlocks(oldId) : Promise.resolve(null),
        enabled: !!oldId
    });
    
    const { data: newBlocksRes, isLoading: newLoading } = useQuery({
        queryKey: ['blocks', newId],
        queryFn: () => newId ? fetchAllBlocks(newId) : Promise.resolve(null),
        enabled: !!newId
    });

    const isLoading = oldLoading || newLoading;

    const oldParsedBlocks: ParsedBlock[] = useMemo(() => {
        const rawOldBlocks = oldBlocksRes?.data?.content || [];
        const rawNewBlocks = newBlocksRes?.data?.content || [];
        
        // Match by index to find highlight state
        return rawOldBlocks.map((b, idx) => {
            const newB = rawNewBlocks[idx];
            const isRemoved = !newB;
            const isModified = newB && (b.contentText !== newB.contentText || b.blockType !== newB.blockType);
            const highlightState = isRemoved ? 'REMOVED' : isModified ? 'MODIFIED' : 'NONE';
            
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
                id: `old-block-${b.blockId || idx}`,
                blockId: b.blockId,
                type: b.blockType?.toUpperCase() || 'PARAGRAPH',
                content: b.contentText || '',
                align: parsedStyle.align || 'left',
                color: parsedStyle.color,
                fontSize: parsedStyle.fontSize,
                highlightState
            };
        });
    }, [oldBlocksRes, newBlocksRes]);

    const newParsedBlocks: ParsedBlock[] = useMemo(() => {
        const rawOldBlocks = oldBlocksRes?.data?.content || [];
        const rawNewBlocks = newBlocksRes?.data?.content || [];
        
        // Match by index to find highlight state
        return rawNewBlocks.map((b, idx) => {
            const oldB = rawOldBlocks[idx];
            const isAdded = !oldB;
            const isModified = oldB && (b.contentText !== oldB.contentText || b.blockType !== oldB.blockType);
            const highlightState = isAdded ? 'ADDED' : isModified ? 'MODIFIED' : 'NONE';
            
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
                id: `new-block-${b.blockId || idx}`,
                blockId: b.blockId,
                type: b.blockType?.toUpperCase() || 'PARAGRAPH',
                content: b.contentText || '',
                align: parsedStyle.align || 'left',
                color: parsedStyle.color,
                fontSize: parsedStyle.fontSize,
                highlightState
            };
        });
    }, [oldBlocksRes, newBlocksRes]);

    const oldPages = paginateBlocks(oldParsedBlocks);
    const newPages = paginateBlocks(newParsedBlocks);

    const renderColumn = (pages: ParsedBlock[][], allBlocks: ParsedBlock[], isEmpty: boolean) => {
        if (isEmpty) {
            return (
                <div className="flex-1 overflow-y-auto pb-48 scroll-smooth bg-[#f0f2eb] p-8 pt-4 flex flex-col items-center justify-center border-r border-slate-200">
                    <div className="w-full max-w-[850px] mx-auto bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e6e9e0] rounded-sm min-h-[400px] px-16 py-20 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-[#f8faf2] border border-[#e2e8f0] text-[#cbd5e1] rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                            <FileText size={40} />
                        </div>
                        <h3 className="text-xl font-black text-[#1e293b] mb-2">No Content Blocks Found</h3>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex-1 overflow-y-auto pb-48 scroll-smooth bg-[#f0f2eb] p-8 pt-4 flex flex-col items-center gap-6 border-r border-slate-200 last:border-0 custom-scrollbar">
                {pages.map((pageBlocks, pageIndex) => (
                    <div key={pageIndex} className="w-full max-w-[850px] mx-auto bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e6e9e0] rounded-sm min-h-[1100px] px-16 pt-12 pb-20 relative transition-all">
                        <div className="flex flex-col gap-y-1">
                            {pageBlocks.map((block) => {
                                const globalIndex = allBlocks.findIndex(b => b.id === block.id);
                                return (
                                    <div key={block.id} id={block.id} className="relative">
                                        {renderReadOnlyBlock(block, allBlocks, globalIndex)}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="absolute bottom-6 right-8 text-[10px] font-bold tracking-wider text-[#adb4a8]">
                            {pageIndex + 1} / {pages.length}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[1000] flex justify-center items-center p-4 sm:p-6 bg-black/40 animate-in fade-in duration-200">
            <div className="bg-slate-100 w-full max-w-[1600px] h-[95vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden border-4 border-white">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Material Text Comparison
                        </h2>
                        <p className="text-sm font-semibold text-slate-500 mt-1">{title}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-rose-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    <div className="grid grid-cols-2 bg-white border-b border-[#e6e9e0] shadow-sm shrink-0">
                        <div className="px-12 py-4 text-xs font-black text-[#5a6157] uppercase tracking-widest border-r border-[#e6e9e0] text-center bg-[#f8faf2]">
                            Old Version
                        </div>
                        <div className="px-12 py-4 text-xs font-black text-[#5a6157] uppercase tracking-widest text-center bg-[#f8faf2]">
                            New Version
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden bg-[#f0f2eb]">
                        {isLoading ? (
                            <div className="flex w-full items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : (
                            <>
                                {renderColumn(oldPages, oldParsedBlocks, oldParsedBlocks.length === 0)}
                                {renderColumn(newPages, newParsedBlocks, newParsedBlocks.length === 0)}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Read-Only Block Renderer (with highlighting) ──
function renderReadOnlyBlock(block: ParsedBlock, allBlocks: ParsedBlock[], globalIndex: number) {
    const { align = 'left', color, fontSize, content, type, highlightState } = block;
    const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

    const getColors = () => {
        if (highlightState === 'REMOVED') return { bg: 'bg-rose-100/50', text: '#be123c', strikethrough: true };
        if (highlightState === 'ADDED') return { bg: 'bg-emerald-100/50', text: '#047857', strikethrough: false };
        if (highlightState === 'MODIFIED') return { bg: 'bg-amber-100/30', text: color || '#2d342b', strikethrough: false };
        return { bg: '', text: color || '#2d342b', strikethrough: false };
    };

    const c = getColors();
    const styleObj = { 
        color: c.text, 
        fontSize: fontSize, 
        fontFamily: type === 'H1' || type === 'H2' ? 'Plus Jakarta Sans, sans-serif' : 'inherit',
        textDecoration: c.strikethrough ? 'line-through' : 'none',
        textDecorationColor: c.strikethrough ? '#fda4af' : 'transparent'
    };

    const wrapperClass = `py-1.5 px-4 -mx-4 rounded-xl transition-colors ${c.bg}`;

    switch (type) {
        case 'H1':
            return (
                <div className={wrapperClass}>
                    <div className={`font-black mt-6 mb-4 leading-tight ${alignClass}`} style={{...styleObj, fontSize: fontSize || '36px'}} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        case 'H2':
            return (
                <div className={wrapperClass}>
                    <div className={`font-bold mt-4 mb-2 leading-tight ${alignClass}`} style={{...styleObj, fontSize: fontSize || '24px'}} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        case 'PARAGRAPH':
            return (
                <div className={wrapperClass}>
                    <div className={`font-medium leading-relaxed ${alignClass}`} style={{...styleObj, fontSize: fontSize || '16px', color: c.strikethrough ? c.text : color || '#5a6157'}} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        case 'BULLET_LIST':
            return (
                <div className={`${wrapperClass} flex items-start gap-3`}>
                    <div className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: c.text }}></div>
                    <div className="flex-1 font-medium" style={{...styleObj, fontSize: fontSize || '16px', color: c.strikethrough ? c.text : color || '#5a6157'}} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        case 'ORDERED_LIST': {
            const orderNum = allBlocks.filter((b, i) => b.type === 'ORDERED_LIST' && i <= globalIndex).length;
            return (
                <div className={`${wrapperClass} flex items-start gap-3`}>
                    <div className="mt-1 text-sm font-bold opacity-40 shrink-0 w-4" style={{ color: c.text }}>{orderNum}.</div>
                    <div className="flex-1 font-medium" style={{...styleObj, fontSize: fontSize || '16px', color: c.strikethrough ? c.text : color || '#5a6157'}} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        }
        case 'QUOTE':
            return (
                <div className={`${wrapperClass} pl-4 border-l-4 border-primary-500/30 py-2 my-4 bg-primary-50/20`}>
                    <div className={`font-medium italic ${alignClass}`} style={{...styleObj, fontSize: fontSize || '16px', color: c.strikethrough ? c.text : color || '#5a6157'}} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
        case 'CODE_BLOCK':
            return (
                <div className={`${wrapperClass} p-5 bg-zinc-900 rounded-2xl font-mono text-[14px] my-4 shadow-inner`}>
                    <pre className="text-green-400 whitespace-pre-wrap" style={{ textDecoration: c.strikethrough ? 'line-through' : 'none', textDecorationColor: '#fda4af' }}>{content}</pre>
                </div>
            );
        case 'TABLE':
            return (
                <div className={`${wrapperClass} p-5 bg-zinc-50 border border-zinc-200 rounded-2xl font-mono text-[13px] my-4`}>
                    <pre className="text-zinc-700 whitespace-pre-wrap" style={{ textDecoration: c.strikethrough ? 'line-through' : 'none', textDecorationColor: '#fda4af' }}>{content}</pre>
                </div>
            );
        case 'DIVIDER':
            return <div className={`${wrapperClass} py-8`}><div className="h-px w-full bg-zinc-200"></div></div>;
        case 'IMAGE':
            return (
                <div className={`${wrapperClass} my-6 rounded-2xl overflow-hidden shadow-md max-w-full ${align === 'center' ? 'mx-auto' : align === 'right' ? 'ml-auto' : 'mr-auto'}`} style={{ width: 'fit-content', opacity: c.strikethrough ? 0.5 : 1 }}>
                    <img src={content} alt="Material Content" className="max-w-full h-auto object-contain max-h-[800px]" />
                </div>
            );
        default:
            return (
                <div className={wrapperClass}>
                    <div className={alignClass} style={styleObj} dangerouslySetInnerHTML={{ __html: content }} />
                </div>
            );
    }
}
