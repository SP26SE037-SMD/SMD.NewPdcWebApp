
"use client";

import { Suspense } from "react";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { use } from "react";
import {
    ArrowLeft, Save, Plus, Trash2, GripVertical, Upload, X,
    Type, Heading1, Heading2, Code, Quote, List, Image as ImageIcon, Loader2, Minus, Table, ListOrdered, Info,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, ChevronDown, Highlighter
} from "lucide-react";
import { HeaderRightActions } from "@/components/layout/HeaderRightActions";
import mammoth from "mammoth";
import { motion, AnimatePresence } from "framer-motion";
import { SyllabusInfoModal, formatBloomLevel } from "@/components/dashboard/SyllabusInfoModal";
import { TableBlock } from "@/components/dashboard/TableBlock";
import { BlockService, BlockItem } from "@/services/block.service";
import { MaterialService } from "@/services/material.service";
import { SyllabusService } from "@/services/syllabus.service";
import { SourceService } from "@/services/source.service";
import { CloPloService } from "@/services/cloplo.service";
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setSyllabusInfo } from '@/store/slices/syllabusSlice';

type BlockType = 'H1' | 'H2' | 'PARAGRAPH' | 'ORDERED_LIST' | 'BULLET_LIST' | 'CODE_BLOCK' | 'QUOTE' | 'DIVIDER' | 'IMAGE' | 'TABLE';

interface Block {
    id: string;        // local UUID for React key
    blockId?: string;  // backend ID (undefined for newly added blocks)
    type: BlockType;
    content: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    fontSize?: string;
    originalContent?: string; // snapshot at load time to detect changes
    originalType?: BlockType;
}

const BLOCK_TYPES: { id: BlockType; label: string; icon: any; shortcut: string; symbol: string }[] = [
    { id: 'H1', label: 'Heading 1', icon: Heading1, shortcut: '# ', symbol: 'format_h1' },
    { id: 'H2', label: 'Heading 2', icon: Heading2, shortcut: '## ', symbol: 'format_h2' },
    { id: 'PARAGRAPH', label: 'Text', icon: Type, shortcut: '/p ', symbol: 'article' },
    { id: 'ORDERED_LIST', label: 'Numbered List', icon: ListOrdered, shortcut: '1. ', symbol: 'format_list_numbered' },
    { id: 'BULLET_LIST', label: 'Bullet List', icon: List, shortcut: '- ', symbol: 'format_list_bulleted' },
    { id: 'CODE_BLOCK', label: 'Code', icon: Code, shortcut: '/code ', symbol: 'code' },
    { id: 'QUOTE', label: 'Quote', icon: Quote, shortcut: '> ', symbol: 'format_quote' },
    { id: 'DIVIDER', label: 'Divider', icon: Minus, shortcut: '---', symbol: 'horizontal_rule' },
    { id: 'IMAGE', label: 'Image', icon: ImageIcon, shortcut: '/img ', symbol: 'image' },
    { id: 'TABLE', label: 'Table', icon: Table, shortcut: '/table ', symbol: 'table_chart' },
];

/**
 * A specialized ContentEditable component that prevents re-setting innerHTML
 * when the content match the current state, resolving cursor jumping issues.
 */
const EditableBlock = ({
    html,
    onChange,
    onKeyDown,
    onFocus,
    className,
    style,
    placeholder,
    id,
    onBlur,
    onPaste
}: {
    html: string,
    onChange: (val: string) => void,
    onKeyDown?: (e: React.KeyboardEvent) => void,
    onFocus?: () => void,
    onBlur?: () => void,
    onPaste?: (e: React.ClipboardEvent) => void,
    className?: string,
    style?: React.CSSProperties,
    placeholder?: string,
    id: string
}) => {
    const elRef = useRef<HTMLDivElement>(null);

    // Sync state to DOM only if they differ (prevents cursor jumping)
    useEffect(() => {
        if (elRef.current && elRef.current.innerHTML !== html) {
            elRef.current.innerHTML = html;
        }
    }, [html]);

    return (
        <div
            ref={elRef}
            contentEditable
            spellCheck={false}
            suppressContentEditableWarning
            onInput={e => {
                const current = e.currentTarget.innerHTML;
                if (current === '<br>') onChange(''); // Normalize empty content
                else onChange(current);
            }}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            onPaste={onPaste}
            className={`${className} ${!html && placeholder ? 'before:content-[attr(data-placeholder)] before:opacity-30 before:pointer-events-none' : ''}`}
            style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                ...style,
                overflowWrap: 'break-word',
                wordBreak: 'break-word'
            }}
            data-block-id={id}
            data-placeholder={placeholder}
        />
    );
};


export default function EditMaterialPageWrapper({ params }: { params: Promise<{ materialId: string }> }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditMaterialPage params={params} />
    </Suspense>
  );
}

function EditMaterialPage({ params }: { params: Promise<{ materialId: string }> }) {

    const { materialId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const syllabusId = searchParams.get("syllabusId");
    const { user } = useSelector((state: RootState) => state.auth);

    // Toast State
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Blocks State
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [mounted, setMounted] = useState(false);

    // UI State
    const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
    const [showMenuForBlockId, setShowMenuForBlockId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
    const [deletedBlockIds, setDeletedBlockIds] = useState<string[]>([]);
    const saveInProgress = useRef(false);
    const [originalMetadata, setOriginalMetadata] = useState<{ title: string, type: string, id: number | string } | null>(null);
    const [title, setTitle] = useState("");
    const [materialType, setMaterialType] = useState("DOCUMENT");
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
    const [showSizePicker, setShowSizePicker] = useState<string | null>(null);
    const [sequenceId, setSequenceId] = useState<string | number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [syllabusName, setSyllabusName] = useState("");
    const [isImporting, setIsImporting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    // ── Table Creation States ──
    const [showTableModal, setShowTableModal] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [tableTargetIndex, setTableTargetIndex] = useState<number | null>(null);
    const [tableTargetBlockId, setTableTargetBlockId] = useState<string | null>(null);


    // ── Unsaved Changes Protection (Hard Exit & Browser Back) ──
    useEffect(() => {
        if (!hasChanges) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        };

        const handlePopState = (e: PopStateEvent) => {
            // Re-inject history state to block navigation and show custom modal
            window.history.pushState(null, '', window.location.href);
            setShowExitModal(true);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        // Trap the user with a dummy entry so 'back' triggers popstate instead of navigating
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [hasChanges]);

    // Track dirty state by comparing current state with original
    useEffect(() => {
        if (!originalMetadata) return;

        const isMetadataChanged =
            title !== originalMetadata.title ||
            materialType !== originalMetadata.type ||
            String(sequenceId) !== String(originalMetadata.id);

        const isBlocksChanged = blocks.some(b =>
            b.content !== b.originalContent ||
            b.type !== b.originalType
        );

        if (isMetadataChanged || isBlocksChanged || deletedBlockIds.length > 0) {
            setHasChanges(true);
        }
    }, [blocks, title, materialType, sequenceId, originalMetadata, deletedBlockIds]);

    const handleBackWithWarning = () => {
        if (hasChanges) {
            setShowExitModal(true);
        } else {
            router.back();
        }
    };


    // Helper to strip HTML for stable height calculation
    const stripHtml = (htmlContent: string) => {
        if (typeof window === 'undefined') return htmlContent;
        const tmp = document.createElement("DIV");
        tmp.innerHTML = htmlContent;
        return tmp.textContent || tmp.innerText || "";
    };

    const sanitizeBlockContent = (html: string) => {
        if (!html) return "";
        let cleaned = html
            .replace(/&nbsp;/g, ' ')
            .replace(/\u00A0/g, ' ')
            .trim();

        // 1. Strip block-level wrapping tags (p, div) but PRESERVE their inner content and 
        // convert them to line breaks if they were separate paragraphs initially.
        // This targets the top-level structure Mammoth might yield.
        cleaned = cleaned
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/p>/gi, '<br>')
            .replace(/<div[^>]*>/gi, '')
            .replace(/<\/div>/gi, '<br>');

        // 2. Remove trailing line breaks
        cleaned = cleaned.replace(/(<br\s*\/?>)+$/g, '').trim();

        // 3. Optional: We could strip specific problematic attributes here if needed,
        // but for now let's allow strong, em, u, span style=...
        return cleaned;
    };



    const COLORS = [
        { name: 'Default', value: '#2d342b' },
        { name: 'Grey', value: '#5a6157' },
        { name: 'Red', value: '#ef4444' },
        { name: 'Orange', value: '#f97316' },
        { name: 'Yellow', value: '#eab308' },
        { name: 'Green', value: '#22c55e' },
        { name: 'Blue', value: '#3b82f6' },
        { name: 'Purple', value: '#a855f7' },
        { name: 'Primary', value: '#4caf50' },
    ];

    const SIZES = [
        { label: 'Small', value: '14px' },
        { label: 'Normal', value: '16px' },
        { label: 'Medium', value: '20px' },
        { label: 'Large', value: '24px' },
        { label: 'Extra', value: '32px' },
        { label: 'Huge', value: '48px' },
    ];
    const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
    const dispatch = useDispatch<AppDispatch>();
    const syllabusInfoDB = useSelector((state: RootState) => state.syllabus.syllabusInfoDB);
    const syllabusInfo = syllabusId ? syllabusInfoDB[syllabusId] : undefined;
    const [isFetchingInfo, setIsFetchingInfo] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync DOM focus with state
    useEffect(() => {
        if (!mounted || !focusedBlockId) return;

        let frameId: number;

        const performFocus = () => {
            const wrapper = document.querySelector(`[data-block-id="${focusedBlockId}"]`) as HTMLElement;
            if (!wrapper) return;

            // Target the actual editable element
            const el = (wrapper.contentEditable === 'true' || wrapper.tagName === 'TEXTAREA')
                ? wrapper
                : wrapper.querySelector('div[contenteditable="true"], textarea') as HTMLElement | HTMLTextAreaElement;

            if (el) {
                // Focus immediately
                if (document.activeElement !== el) {
                    el.focus();
                }

                // Rapid caret placement
                const selection = window.getSelection();
                if (selection) {
                    if (el instanceof HTMLTextAreaElement) {
                        const l = el.value.length;
                        el.setSelectionRange(l, l);
                    } else {
                        const range = document.createRange();
                        range.selectNodeContents(el);
                        range.collapse(false); // true to start, false to end
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }
        };

        // Use requestAnimationFrame for snappier response than setTimeout
        frameId = requestAnimationFrame(performFocus);

        return () => cancelAnimationFrame(frameId);
    }, [focusedBlockId, mounted]);

    // Initial scroll and focus
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = () => {
            setShowColorPicker(null);
            setShowSizePicker(null);
            setShowMenuForBlockId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch syllabus context info for the Syllabus Info modal (if not already cached in Redux)
    useEffect(() => {
        if (!syllabusId || syllabusInfo || isFetchingInfo) return;

        setIsFetchingInfo(true);
        (async () => {
            try {
                const [syllabusRes] = await Promise.allSettled([
                    SyllabusService.getSyllabusById(syllabusId),
                    SourceService.getSubjectSources(''), // will be replaced after we get subjectId
                    Promise.resolve(null)
                ]);

                let subjectId: string | undefined;
                let bloomText = 'Unknown';
                if (syllabusRes.status === 'fulfilled' && syllabusRes.value?.data) {
                    const s = syllabusRes.value.data as any;
                    bloomText = formatBloomLevel(s.minBloomLevel);
                    subjectId = s.subjectId;
                }

                let sourcesReference: string[] = [];
                let clos: string[] = [];

                if (subjectId) {
                    const [src, cloRes] = await Promise.allSettled([
                        SourceService.getSubjectSources(subjectId),
                        CloPloService.getSubjectClos(subjectId, 0, 100)
                    ]);
                    if (src.status === 'fulfilled' && src.value?.data) {
                        const d = src.value.data as any[];
                        sourcesReference = d.map((s: any) =>
                            `${s.author ? s.author + '. ' : ''}${s.sourceName}${s.publisher ? ' - ' + s.publisher : ''}${s.publishedYear ? ' (' + s.publishedYear + ')' : ''}`
                        );
                    }
                    if (cloRes.status === 'fulfilled' && cloRes.value?.data?.content) {
                        clos = cloRes.value.data.content.map((c: any) => `[${c.cloCode}] ${c.description}`);
                    }
                }

                dispatch(setSyllabusInfo({
                    syllabusId,
                    info: {
                        bloomTaxonomy: bloomText,
                        sourcesReference: sourcesReference.length > 0 ? sourcesReference : ['No references available.'],
                        clos: clos.length > 0 ? clos : ['No CLOs available.'],
                    }
                }));
            } catch (e) {
                console.error('Failed to fetch syllabus info:', e);
            } finally {
                setIsFetchingInfo(false);
            }
        })();
    }, [syllabusId, syllabusInfo, isFetchingInfo, dispatch]);

    // Memoize the outline to prevent heavy re-calculations on every keystroke
    const outlineItems = useMemo(() => {
        return blocks
            .filter(b => b.type === 'H1' || b.type === 'H2')
            .map(b => ({
                ...b,
                content: sanitizeBlockContent(stripHtml(b.content)) // Clean for display in sidebar
            }));
    }, [blocks]);

    const scrollToBlock = (id: string) => {
        const el = document.getElementById(`block-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setActiveAnchor(id);
        }
    };

    // Auto-focus on focused block change
    useEffect(() => {
        if (!focusedBlockId) return;
        const timer = setTimeout(() => {
            const wrapper = document.querySelector(`[data-block-id="${focusedBlockId}"]`);
            if (wrapper) {
                const el = wrapper.querySelector('div[contenteditable="true"], textarea') as HTMLElement | HTMLTextAreaElement;
                if (el) {
                    el.focus();
                    if (el instanceof HTMLTextAreaElement) {
                        const l = el.value.length;
                        el.setSelectionRange(l, l);
                    } else {
                        // For contenteditable, move cursor to end
                        const range = document.createRange();
                        const sel = window.getSelection();
                        range.selectNodeContents(el);
                        range.collapse(false);
                        sel?.removeAllRanges();
                        sel?.addRange(range);
                    }
                }
            }
        }, 10);
        return () => clearTimeout(timer);
    }, [focusedBlockId]);

    // Fetch existing blocks and material details on mount
    useEffect(() => {
        if (!materialId) return;
        setIsLoadingBlocks(true);

        const fetchAllData = async () => {
            try {
                // Fetch blocks and material details in parallel
                const [blocksRes, materialRes] = await Promise.all([
                    BlockService.getBlocksByMaterialId(materialId, 1, 20),
                    MaterialService.getMaterialById(materialId)
                ]);

                // 1. Process Material Metadata
                if (materialRes?.data) {
                    setTitle(materialRes.data.title || "");
                    setMaterialType(materialRes.data.materialType || "DOCUMENT");
                    setSequenceId(materialRes.data.id || 0);
                    setOriginalMetadata({
                        title: materialRes.data.title,
                        type: materialRes.data.materialType,
                        id: materialRes.data.id
                    });
                }

                // 1.1 Fetch Syllabus Name if exists
                if (syllabusId) {
                    try {
                        const sRes = await SyllabusService.getSyllabusById(syllabusId);
                        if (sRes?.data?.syllabusName) {
                            setSyllabusName(sRes.data.syllabusName);
                        }
                    } catch (err) {
                        console.error("Failed to fetch syllabus name:", err);
                    }
                }


                // 2. Process Blocks
                const responseData = blocksRes as any;
                console.log("DEBUG: Full Blocks response:", responseData);

                let backendBlocks: BlockItem[] = [];
                let paginationInfo: any = null;

                // Handle nested structure
                if (responseData?.data?.content && Array.isArray(responseData.data.content)) {
                    backendBlocks = responseData.data.content;
                    paginationInfo = responseData.data;
                } else if (responseData?.data && Array.isArray(responseData.data)) {
                    backendBlocks = responseData.data;
                    paginationInfo = responseData;
                } else if (responseData?.content && Array.isArray(responseData.content)) {
                    backendBlocks = responseData.content;
                    paginationInfo = responseData;
                } else if (Array.isArray(responseData)) {
                    backendBlocks = responseData;
                }

                console.log(`DEBUG: Found ${backendBlocks.length} backend blocks`);

                if (paginationInfo && 'totalPages' in paginationInfo) {
                    setHasMore((paginationInfo.page || 0) + 1 < paginationInfo.totalPages);
                } else {
                    setHasMore(false);
                }

                if (backendBlocks.length === 0) {
                    console.log("DEBUG: No blocks from backend, adding default paragraph");
                    setBlocks([
                        { id: crypto.randomUUID(), type: 'PARAGRAPH', content: '' }
                    ]);
                } else {
                    const sorted = [...backendBlocks].sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
                    const mapped = sorted.map((b, i) => {
                        let parsedStyle: { align?: 'left' | 'center' | 'right', color?: string, fontSize?: string } = {};
                        try {
                            const styleJson = b.blockStyle || ''; // SWAPPED
                            if (styleJson && styleJson.startsWith('{')) {
                                parsedStyle = JSON.parse(styleJson);
                            } else {
                                parsedStyle = { align: (styleJson as any) || 'left' };
                            }
                        } catch (e) {
                            parsedStyle = { align: 'left' };
                        }

                        // Robust type mapping
                        let rawType = (b.blockType || b.blockStyle || 'PARAGRAPH').toUpperCase(); // SWAPPED
                        let finalType: BlockType = 'PARAGRAPH';

                        if (rawType.includes('H1') || rawType.includes('HEADING 1') || rawType === 'HEADING') finalType = 'H1';
                        else if (rawType.includes('H2') || rawType.includes('HEADING 2') || rawType === 'SUBHEADING') finalType = 'H2';
                        else if (rawType.includes('BULLET') || rawType.includes('LIST_ITEM') || rawType === 'UL') finalType = 'BULLET_LIST';
                        else if (rawType.includes('ORDER') || rawType.includes('NUMBER') || rawType === 'OL') finalType = 'ORDERED_LIST';
                        else if (rawType.includes('QUOTE') || rawType === 'BLOCKQUOTE') finalType = 'QUOTE';
                        else if (rawType.includes('CODE')) finalType = 'CODE_BLOCK';
                        else if (rawType.includes('IMAGE') || rawType === 'IMG') finalType = 'IMAGE';
                        else if (rawType.includes('DIVIDER') || rawType.includes('HR')) finalType = 'DIVIDER';
                        else if (rawType.includes('TEXT') || rawType === 'P' || rawType === 'PARAGRAPH') finalType = 'PARAGRAPH';
                        else finalType = 'PARAGRAPH'; // Default to paragraph for any unknown type

                        const rawContent = b.contentText || '';
                        const cleanContent = sanitizeBlockContent(rawContent);

                        return {
                            id: crypto.randomUUID(),
                            blockId: b.blockId,
                            type: finalType,
                            content: finalType === 'H2' ? cleanContent.replace(/\s+/g, ' ').trim() : cleanContent,
                            align: parsedStyle.align || 'left',
                            color: parsedStyle.color,
                            fontSize: parsedStyle.fontSize,
                            originalContent: cleanContent,
                            originalType: finalType,
                        };
                    });

                    console.log("DEBUG: Mapped blocks:", mapped);
                    setBlocks(mapped);

                    if (mapped.length > 0) {
                        setFocusedBlockId(mapped[0].id);
                    }
                }

                // Ensure page starts at the top
                window.scrollTo({ top: 0, behavior: 'instant' });
            } catch (err) {
                console.error("Critical error loading material data:", err);
                // Fail-safe: show at least one empty block
                const firstId = crypto.randomUUID();
                setBlocks([{ id: firstId, type: 'PARAGRAPH', content: '' }]);
                setFocusedBlockId(firstId);
            } finally {
                setIsLoadingBlocks(false);
            }
        };

        fetchAllData();
    }, [materialId]);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastBlockElementRef = useCallback((node: HTMLDivElement | null) => {
        if (isLoadingBlocks || isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => {
                    const nextPage = prev + 1;
                    fetchMoreBlocks(nextPage);
                    return nextPage;
                });
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingBlocks, isLoadingMore, hasMore]);

    const fetchMoreBlocks = async (nextPage: number) => {
        if (!materialId) return;
        setIsLoadingMore(true);
        try {
            const res = await BlockService.getBlocksByMaterialId(materialId, nextPage, 20);
            const responseData = res as any;
            let backendBlocks: BlockItem[] = [];
            let paginationInfo: any = null;

            if (responseData?.data?.content && Array.isArray(responseData.data.content)) {
                backendBlocks = responseData.data.content;
                paginationInfo = responseData.data;
            } else if (responseData?.data && Array.isArray(responseData.data)) {
                backendBlocks = responseData.data;
                paginationInfo = responseData;
            } else if (responseData?.content && Array.isArray(responseData.content)) {
                backendBlocks = responseData.content;
                paginationInfo = responseData;
            } else if (Array.isArray(responseData)) {
                backendBlocks = responseData;
            }

            if (paginationInfo && 'totalPages' in paginationInfo) {
                setHasMore(nextPage < paginationInfo.totalPages);
            } else {
                setHasMore(false);
            }

            if (backendBlocks.length > 0) {
                const sorted = [...backendBlocks].sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0));
                const mapped = sorted.map(b => {
                    let parsedStyle: { align?: 'left' | 'center' | 'right', color?: string, fontSize?: string } = {};
                    try {
                        const styleJson = b.blockStyle || ''; // SWAPPED
                        if (styleJson && styleJson.startsWith('{')) {
                            parsedStyle = JSON.parse(styleJson);
                        } else {
                            parsedStyle = { align: (styleJson as any) || 'left' };
                        }
                    } catch (e) {
                        parsedStyle = { align: 'left' };
                    }

                    // Robust type mapping
                    let rawType = (b.blockType || b.blockStyle || 'PARAGRAPH').toUpperCase(); // SWAPPED
                    let finalType: BlockType = 'PARAGRAPH';

                    if (rawType.includes('H1') || rawType.includes('HEADING 1') || rawType === 'HEADING') finalType = 'H1';
                    else if (rawType.includes('H2') || rawType.includes('HEADING 2') || rawType === 'SUBHEADING') finalType = 'H2';
                    else if (rawType.includes('BULLET') || rawType.includes('LIST_ITEM') || rawType === 'UL') finalType = 'BULLET_LIST';
                    else if (rawType.includes('ORDER') || rawType.includes('NUMBER') || rawType === 'OL') finalType = 'ORDERED_LIST';
                    else if (rawType.includes('QUOTE') || rawType === 'BLOCKQUOTE') finalType = 'QUOTE';
                    else if (rawType.includes('CODE')) finalType = 'CODE_BLOCK';
                    else if (rawType.includes('IMAGE') || rawType === 'IMG') finalType = 'IMAGE';
                    else if (rawType.includes('DIVIDER') || rawType.includes('HR')) finalType = 'DIVIDER';
                    else finalType = 'PARAGRAPH';

                    const cleanContent = sanitizeBlockContent(b.contentText || '');

                    return {
                        id: crypto.randomUUID(),
                        blockId: b.blockId,
                        type: finalType,
                        content: finalType === 'H2' ? cleanContent.replace(/\s+/g, ' ').trim() : cleanContent,
                        align: parsedStyle.align || 'left',
                        color: parsedStyle.color,
                        fontSize: parsedStyle.fontSize,
                        originalContent: cleanContent,
                        originalType: finalType,
                    };
                });
                setBlocks(prev => [...prev, ...mapped]);
            }
        } catch (e) {
            console.error("Failed to load more blocks", e);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // ── Block editor helpers ──────────────────────────────────────────────────

    const addBlock = async (index: number, type: BlockType = 'PARAGRAPH', shouldSave: boolean = true, initialContent: string = '') => {
        const newBlock: Block = { id: crypto.randomUUID(), type, content: initialContent };

        const nextBlocks = [...blocks];
        nextBlocks.splice(index + 1, 0, newBlock);
        setBlocks(nextBlocks);

        // Set focus to the new block immediately
        setFocusedBlockId(newBlock.id);
        setShowMenuForBlockId(null);
        if (shouldSave) await handleSaveDraft(nextBlocks);
        return newBlock;
    };

    const confirmTableCreation = async () => {
        const initialData = {
            rows: Array.from({ length: tableRows }, () => Array(tableCols).fill(''))
        };
        const content = JSON.stringify(initialData);

        if (tableTargetBlockId) {
            await updateBlockType(tableTargetBlockId, 'TABLE', content);
        } else if (tableTargetIndex !== null) {
            await addBlock(tableTargetIndex, 'TABLE', true, content);
        }

        setShowTableModal(false);
        setTableTargetIndex(null);
        setTableTargetBlockId(null);
        setTableRows(3);
        setTableCols(3);
    };

    const removeBlock = async (id: string) => {
        const blockToDelete = blocks.find(b => b.id === id);
        const index = blocks.findIndex(b => b.id === id);

        if (blocks.length <= 1) return;

        const nextBlocks = blocks.filter(b => b.id !== id);

        // UI Update
        setBlocks(nextBlocks);

        // Move focus
        if (index > 0) {
            setTimeout(() => setFocusedBlockId(nextBlocks[index - 1].id), 0);
        } else if (nextBlocks.length > 0) {
            setTimeout(() => setFocusedBlockId(nextBlocks[0].id), 0);
        }

        // Add to deletion queue for the Bulk API (if we still need individual deletes)
        if (blockToDelete?.blockId) {
            setDeletedBlockIds(prev => [...prev, blockToDelete.blockId!]);

            // Delete immediately since we no longer have a bulk delete API in the new model
            try {
                await BlockService.deleteBlock(blockToDelete.blockId!);
            } catch (err) {
                console.error("Failed to delete block from server:", err);
            }
        }

        await handleSaveDraft(nextBlocks);
    };

    const updateBlockContent = (id: string, content: string) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
        if (content === '/h1 ') updateBlockType(id, 'H1', '');
        else if (content === '/h2 ') updateBlockType(id, 'H2', '');
        else if (content === '/quote ') updateBlockType(id, 'QUOTE', '');
        else if (content === '/code ') updateBlockType(id, 'CODE_BLOCK', '');
        else if (content === '/ul ' || content === '- ') updateBlockType(id, 'BULLET_LIST', '');
        else if (content === '/ol ' || content === '1. ') updateBlockType(id, 'ORDERED_LIST', '');
        else if (content === '/div ' || content === '---') updateBlockType(id, 'DIVIDER', '');
        else if (content === '/p ') updateBlockType(id, 'PARAGRAPH', '');
        else if (content === '/table ') updateBlockType(id, 'TABLE', '');
    };


    const updateBlockType = (id: string, type: BlockType, contentOverride?: string) => {
        // Only show modal if we are switching TO table and don't have content yet
        if (type === 'TABLE' && contentOverride === undefined) {
            setTableTargetBlockId(id);
            setShowTableModal(true);
            return;
        }

        setBlocks(prev => prev.map(b => {
            if (b.id === id) {
                let newContent = contentOverride !== undefined ? contentOverride : b.content;
                const newType = type as BlockType;

                // Initialize table structure if switching to table
                if (newType === 'TABLE' && (!b.content || !b.content.startsWith('{'))) {
                    newContent = JSON.stringify({ rows: [['', ''], ['', '']] });
                }

                return { ...b, type: newType, content: newContent };
            }
            return b;
        }));
        setShowMenuForBlockId(null);
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement> | React.FocusEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const lastEnterTimestamp = useRef(0);

    const handleKeyDown = async (e: React.KeyboardEvent, index: number, block: Block) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            const now = Date.now();
            if (now - lastEnterTimestamp.current < 100) {
                e.preventDefault();
                return;
            }
            lastEnterTimestamp.current = now;

            e.preventDefault();
            e.stopPropagation();
            e.nativeEvent.stopImmediatePropagation();

            // 1. Exit List logic (Enter on empty list)
            const cleanContent = block.content.replace(/&nbsp;|<br>/g, '').trim();
            if (cleanContent === '' && (block.type === 'BULLET_LIST' || block.type === 'ORDERED_LIST')) {
                updateBlockType(block.id, 'PARAGRAPH', '');
                return;
            }

            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const el = e.currentTarget as HTMLElement;
                const range = selection.getRangeAt(0);

                // Split at caret
                const preRange = document.createRange();
                preRange.selectNodeContents(el);
                preRange.setEnd(range.startContainer, range.startOffset);

                const postRange = document.createRange();
                postRange.selectNodeContents(el);
                postRange.setStart(range.startContainer, range.startOffset);

                const htmlBefore = document.createElement('div');
                htmlBefore.appendChild(preRange.cloneContents());
                const htmlAfter = document.createElement('div');
                htmlAfter.appendChild(postRange.cloneContents());

                // List continuity logic
                const nextType: BlockType = (block.type === 'BULLET_LIST' || block.type === 'ORDERED_LIST') ? block.type : 'PARAGRAPH';

                // Cleanup automatic browser noise (&nbsp; or <br>)
                const cleanedAfter = htmlAfter.innerHTML.replace(/^&nbsp;|<br>$/g, '').trim();

                const newBlock: Block = { id: crypto.randomUUID(), type: nextType, content: cleanedAfter };
                let nextBlocks: Block[] = [];
                setBlocks(prev => {
                    const next = [...prev];
                    const targetIdx = next.findIndex(b => b.id === block.id);
                    if (targetIdx !== -1) {
                        next[targetIdx] = { ...next[targetIdx], content: htmlBefore.innerHTML };
                        next.splice(targetIdx + 1, 0, newBlock);
                    }
                    nextBlocks = next;
                    return next;
                });

                setShowMenuForBlockId(null);
                setFocusedBlockId(newBlock.id);

                // Immediate API Sync
                if (nextBlocks.length > 0) {
                    await handleSaveDraft(nextBlocks);
                }
            } else {
                await addBlock(index, 'PARAGRAPH');
            }
            return;
        } else if (e.key === 'Backspace' && block.content === '' && index > 0) {
            e.preventDefault();
            removeBlock(block.id);
        } else if (e.key === 'ArrowDown') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const isAtEnd = range.startOffset === range.startContainer.textContent?.length;
                if (isAtEnd && index < blocks.length - 1) {
                    setFocusedBlockId(blocks[index + 1].id);
                }
            }
        } else if (e.key === 'ArrowUp') {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const isAtStart = range.startOffset === 0;
                if (isAtStart && index > 0) {
                    setFocusedBlockId(blocks[index - 1].id);
                }
            }
        }
    };

    const handleToolbarAction = (action: string) => {
        if (!focusedBlockId) return;

        if (['p', 'h1', 'h2', 'ul', 'ol', 'quote'].includes(action)) {
            const types: Record<string, BlockType> = {
                p: 'PARAGRAPH', h1: 'H1', h2: 'H2',
                ul: 'BULLET_LIST', ol: 'ORDERED_LIST', quote: 'QUOTE'
            };
            setBlocks(prev => prev.map(b => b.id === focusedBlockId ? { ...b, type: types[action] } : b));
            return;
        }

        if (['bold', 'italic', 'underline'].includes(action)) {
            document.execCommand(action, false);
            // Sync current DOM state back to block state immediately after command
            const el = document.querySelector(`[data-block-id="${focusedBlockId}"]`) as HTMLElement;
            if (el) updateBlockContent(focusedBlockId, el.innerHTML);
            return;
        }

        if (action === 'table') {
            setTableTargetBlockId(focusedBlockId);
            setShowTableModal(true);
            return;
        }

        if (action.startsWith('align-')) {
            updateBlockAlign(focusedBlockId, action.replace('align-', '') as any);
            return;
        }

        if (action === 'img') {
            updateBlockType(focusedBlockId, 'IMAGE');
            return;
        }
    };

    const updateBlockStyle = (id: string, updates: Partial<Pick<Block, 'color' | 'fontSize'>>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const updateBlockAlign = (id: string, align: 'left' | 'center' | 'right' | 'justify') => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, align } : b));
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'Upload failed');
        }
        const data = await response.json();
        return data.url;
    };

    const handlePaste = async (e: React.ClipboardEvent, index: number, block: Block) => {
        const items = e.clipboardData.items;
        let imageFile: File | null = null;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) { imageFile = items[i].getAsFile(); break; }
        }

        // 1. Handle Image Paste
        if (imageFile) {
            e.preventDefault();
            let targetBlockId = block.id;
            if (block.content.trim() !== "") {
                const newBlock = await addBlock(index, 'IMAGE');
                targetBlockId = newBlock.id;
            } else {
                updateBlockType(block.id, 'IMAGE');
            }
            setIsUploading(prev => ({ ...prev, [targetBlockId]: true }));
            try {
                const url = await uploadToCloudinary(imageFile);
                updateBlockContent(targetBlockId, url);
                await addBlock(index + (targetBlockId === block.id ? 0 : 1), 'PARAGRAPH');
            } catch {
            } finally {
                setIsUploading(prev => ({ ...prev, [targetBlockId]: false }));
            }
            return;
        }

        // 2. Smart HTML/Text Paste
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');

        if (html) {
            e.preventDefault();
            const tmp = document.createElement('div');
            tmp.innerHTML = html;

            // Extract style from the root if possible
            const firstChild = tmp.firstElementChild as HTMLElement;
            if (firstChild) {
                const style = firstChild.style;
                const updates: any = {};
                if (style.textAlign) updates.align = style.textAlign;
                if (style.color) updates.color = style.color;
                if (style.fontSize) updates.fontSize = style.fontSize;

                if (Object.keys(updates).length > 0) {
                    setBlocks(prev => prev.map(b => b.id === block.id ? { ...b, ...updates } : b));
                }
            }

            // Deep clean tags and strip attributes
            const clean = (parent: HTMLElement) => {
                const allowedTags = ['B', 'I', 'U', 'STRONG', 'EM', 'A', 'BR', 'P', 'DIV', 'SPAN', 'BLOCKQUOTE', 'PRE', 'CODE'];
                const children = Array.from(parent.childNodes);
                children.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const el = node as HTMLElement;
                        if (!allowedTags.includes(el.tagName)) {
                            el.replaceWith(...Array.from(el.childNodes));
                        } else {
                            const attrs = Array.from(el.attributes);
                            attrs.forEach(attr => {
                                if (el.tagName === 'A' && attr.name === 'href') return;
                                el.removeAttribute(attr.name);
                            });
                            clean(el);
                        }
                    }
                });
            };
            clean(tmp);

            // Detect multi-paragraph HTML
            const topBlocks = Array.from(tmp.children).filter(child => ['P', 'DIV', 'H1', 'H2', 'BLOCKQUOTE', 'LI'].includes(child.tagName));

            if (topBlocks.length > 1) {
                const parts = topBlocks.map(b => b.innerHTML.trim()).filter(h => h.length > 0);
                const startIdx = index;
                const newBlocks: Block[] = parts.map((content, i) => ({
                    id: crypto.randomUUID(),
                    type: i === 0 ? block.type : 'PARAGRAPH',
                    content: sanitizeBlockContent(content),
                    align: block.align
                }));

                let nextBlocks: Block[] = [];
                setBlocks(prev => {
                    const next = [...prev];
                    next.splice(startIdx, 1, ...newBlocks);
                    nextBlocks = next;
                    return next;
                });
                if (nextBlocks.length > 0) await handleSaveDraft(nextBlocks);
            } else {
                document.execCommand('insertHTML', false, tmp.innerHTML);
            }
        } else if (text && (text.includes('\n\n') || text.split('\n').length > 2)) {
            // Multi-paragraph text paste
            e.preventDefault();
            const lines = text.split(/\r?\n\s*\r?\n|\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 1) {
                const startIdx = index;
                const newBlocks: Block[] = lines.map((line, i) => ({
                    id: crypto.randomUUID(),
                    type: i === 0 ? block.type : 'PARAGRAPH',
                    content: line,
                    align: block.align
                }));

                let nextBlocks: Block[] = [];
                setBlocks(prev => {
                    const next = [...prev];
                    next.splice(startIdx, 1, ...newBlocks);
                    nextBlocks = next;
                    return next;
                });
                if (nextBlocks.length > 0) await handleSaveDraft(nextBlocks);
                return;
            } else if (text) {
                e.preventDefault();
                document.execCommand('insertText', false, text);
                return;
            }
        }

        // Single line paste (either HTML or plain text) should be handled by default browser behavior 
        // to preserve formatting like bold/italic, OR we can explicitly handle it here.
        // For now, let's keep it simple.
    };

    const autoSaveBlock = async (id: string, index: number) => {
        if (saveInProgress.current) return;
        const block = blocks.find(b => b.id === id);
        if (!block || block.blockId || block.content.trim() === '') return;

        try {
            const sanitized = block.type === 'H2' ? sanitizeBlockContent(block.content || "").replace(/\s+/g, ' ').trim() : sanitizeBlockContent(block.content || "");
            const res = await BlockService.createSingleBlock(materialId, {
                idx: index,
                blockType: block.type || 'PARAGRAPH',
                blockStyle: JSON.stringify({ align: block.align || 'left', color: block.color, fontSize: block.fontSize }),
                contentText: sanitized
            });

            if (res?.data?.blockId) {
                setBlocks(prev => prev.map(b => b.id === id ? {
                    ...b,
                    blockId: res.data.blockId,
                    originalContent: b.content,
                    originalType: b.type
                } : b));
                console.log("Auto-save success:", res.data.blockId);
            }
        } catch (err) {
            console.error("Auto-save failed:", err);
        }
    };

    const handleSaveDraft = async (blocksToSync?: Block[]) => {
        if (saveInProgress.current) {
            console.log("DEBUG: Save already in progress, skipping...");
            return;
        }

        saveInProgress.current = true;
        setIsSaving(true);
        const targetBlocks = blocksToSync || blocks;

        try {
            // 1. Handle Existing Blocks (PUT)
            const modifiedBlocks = targetBlocks
                .map((b, index) => ({ b, index }))
                .filter(({ b }) => b.blockId)
                .map(({ b, index }) => {
                    const sanitized = b.type === 'H2' ? sanitizeBlockContent(b.content || "").replace(/\s+/g, ' ').trim() : sanitizeBlockContent(b.content || "");
                    return {
                        blockId: b.blockId,
                        blockType: b.type || 'PARAGRAPH',
                        blockStyle: JSON.stringify({ align: b.align || 'left', color: b.color, fontSize: b.fontSize }),
                        contentText: sanitized,
                        idx: index
                    };
                });

            if (modifiedBlocks.length > 0) {
                await BlockService.updateBlockList(modifiedBlocks);
            }

            // 2. Handle New Blocks (POST with-idx)
            const newBlocksToCreate = targetBlocks
                .map((b, index) => ({ block: b, index }))
                .filter(({ block }) => !block.blockId && block.content.trim() !== '')
                .map(({ block, index }) => {
                    const sanitized = block.type === 'H2' ? sanitizeBlockContent(block.content || "").replace(/\s+/g, ' ').trim() : sanitizeBlockContent(block.content || "");
                    return {
                        blockType: block.type || 'PARAGRAPH',
                        blockStyle: JSON.stringify({ align: block.align || 'left', color: block.color, fontSize: block.fontSize }),
                        contentText: sanitized,
                        idx: index
                    };
                });

            if (newBlocksToCreate.length > 0) {
                try {
                    const res = await BlockService.createBlocksWithIdx(materialId, newBlocksToCreate);
                    if (res?.data && Array.isArray(res.data)) {
                        // Update local blocks with the new blockIds from server
                        setBlocks(prev => {
                            const next = [...prev];
                            res.data.forEach(serverBlock => {
                                // Match by index (idx)
                                const localIndex = serverBlock.idx;
                                if (next[localIndex]) {
                                    next[localIndex] = {
                                        ...next[localIndex],
                                        blockId: serverBlock.blockId,
                                        originalContent: next[localIndex].content,
                                        originalType: next[localIndex].type
                                    };
                                }
                            });
                            return next;
                        });
                    }
                } catch (blockErr: any) {
                    console.error("Block creation error:", blockErr);
                    if (blockErr?.message?.includes('Vector embedding')) {
                        throw new Error('Changes saved, but search indexing failed (Vector Service Error). Your content is safe.');
                    }
                    throw blockErr;
                }
            }

            setBlocks(prev => prev.map(b => {
                const clean = sanitizeBlockContent(b.content);
                const final = b.type === 'H2' ? clean.replace(/\s+/g, ' ').trim() : clean;
                return {
                    ...b,
                    content: final,
                    originalContent: final,
                    originalType: b.type
                };
            }));

            // ── METADATA SYNC ──
            const hasMetadataChanged =
                title !== originalMetadata?.title ||
                materialType !== originalMetadata?.type ||
                Number(sequenceId) !== Number(originalMetadata?.id);

            if (hasMetadataChanged) {
                await MaterialService.updateMaterial(materialId, {
                    title: title,
                    materialType: materialType as string,
                    id: Number(sequenceId),
                    syllabusId: syllabusId || ""
                });
                setOriginalMetadata({ title, type: materialType, id: Number(sequenceId) });
            }

            showToast("Draft saved successfully");
            setHasChanges(false);
        } catch (error: any) {
            console.error("Failed to save draft:", error);
            const msg = error?.message || "Failed to save draft. Please try again.";
            showToast(msg, "error");
        } finally {
            setIsSaving(false);
            saveInProgress.current = false;
        }
    };

    const handleWordImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        showToast("Processing Word document...", "success");

        try {
            const arrayBuffer = await file.arrayBuffer();

            // Set Material Name from Filename
            const filename = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            setTitle(filename);

            const mammothOptions = {

                styleMap: [
                    "p[style-name='Center'] => p.center",
                    "p[style-name='Centered'] => p.center",
                    "p[style-name='Right'] => p.right",
                    "p[style-name='Heading 1'] => h1",
                    "p[style-name='Heading 2'] => h2",
                    "p[style-name='Heading 3'] => h2",
                    "p[style-name='Heading 4'] => h2"
                ]
            };
            const result = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);

            if (result.messages.length > 0) {
                console.warn("Mammoth messages:", result.messages);
            }

            const html = result.value;
            const newBlocks = parseHtmlToBlocks(html);

            if (newBlocks.length > 0) {
                const isEmpty = blocks.length === 0 || (blocks.length === 1 && !stripHtml(blocks[0].content).trim());

                if (isEmpty) {
                    setBlocks(newBlocks);
                } else {
                    setBlocks(prev => [...prev, ...newBlocks]);
                }

                showToast(`Successfully imported ${newBlocks.length} blocks!`, "success");
            } else {
                showToast("No readable content found in the Word file.", "error");
            }
        } catch (error) {
            console.error("Error importing Word file:", error);
            showToast("Failed to parse Word file. Please ensure it's a valid .docx.", "error");
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const parseHtmlToBlocks = (html: string): Block[] => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const body = doc.body;
        const resultBlocks: Block[] = [];

        const processNode = (node: Node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            const el = node as HTMLElement;
            const tag = el.tagName.toLowerCase();

            let type: BlockType = 'PARAGRAPH';
            let align: Block['align'] = 'left';
            const content = el.innerHTML;

            // Extract alignment from style or classes (mapped via mammoth)
            if (el.style.textAlign) {
                align = el.style.textAlign as any;
            } else if (el.classList.contains('center')) {
                align = 'center';
            } else if (el.classList.contains('right')) {
                align = 'right';
            }

            if (tag === 'h1') type = 'H1';
            else if (tag === 'h2') type = 'H2';
            else if (tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') type = 'H2';
            else if (tag === 'p') type = 'PARAGRAPH';
            else if (tag === 'ul' || tag === 'ol') {
                const listType: BlockType = tag === 'ul' ? 'BULLET_LIST' : 'ORDERED_LIST';
                const items = el.querySelectorAll('li');
                items.forEach(li => {
                    resultBlocks.push({
                        id: crypto.randomUUID(),
                        type: listType,
                        content: sanitizeBlockContent(li.innerHTML),
                        align: align // Inherit alignment for list items if set on parent
                    });
                });
                return;
            } else if (tag === 'blockquote') type = 'QUOTE';
            else if (tag === 'hr') type = 'DIVIDER';
            else if (tag === 'table') {
                const rows: string[][] = [];
                const trElements = el.querySelectorAll('tr');
                trElements.forEach(tr => {
                    const cells: string[] = [];
                    const tdElements = tr.querySelectorAll('td, th');
                    tdElements.forEach(td => {
                        cells.push(td.innerHTML.trim());
                    });
                    if (cells.length > 0) rows.push(cells);
                });

                if (rows.length > 0) {
                    resultBlocks.push({
                        id: crypto.randomUUID(),
                        type: 'TABLE',
                        content: JSON.stringify({ rows }),
                        align: 'left'
                    });
                }
                return;
            } else if (tag === 'li') {
                // Fallback if LI is top-level (direct child of body)
                type = 'BULLET_LIST';
            } else {
                if (el.innerText.trim()) {
                    type = 'PARAGRAPH';
                } else {
                    return;
                }
            }

            resultBlocks.push({
                id: crypto.randomUUID(),
                type,
                content: sanitizeBlockContent(content),
                align: align
            });
        };

        Array.from(body.childNodes).forEach(processNode);
        return resultBlocks;
    };


    // ── Render ───────────────────────────────────────────────────────────────


    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#f8faf2', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>

            {/* ── Toast Notification ── */}
            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-200 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all"
                    style={{
                        background: toast.type === 'success' ? '#41683f' : '#b91c1c',
                        color: 'white',
                        minWidth: '240px',
                        animation: 'slideUp 0.3s ease',
                    }}
                >
                    <span className="material-symbols-outlined text-base">
                        {toast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {toast.message}
                </div>
            )}
            {/* Top Navigation — matches reference HTML */}
            <header className="flex justify-between items-center px-10 h-20 w-full sticky top-0 z-[300]" style={{ background: '#f8faf2' }}>
                <div className="flex items-center gap-6">
                    <button
                        onClick={handleBackWithWarning}
                        className="p-2 rounded-lg transition-all"
                        style={{ color: '#2d342b' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#ebf0e5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <span className="text-[10px] font-black uppercase tracking-wider leading-none" style={{ color: 'rgba(45,52,43,0.4)' }}>
                                {syllabusName || (materialId === 'new' ? "New Material" : "Edit Material")}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider uppercase flex items-center justify-center leading-none" style={{ background: '#dee5d8', color: '#5a6157' }}>DRAFT</span>
                        </div>
                        <div className="relative inline-grid items-center max-w-[450px] min-w-[200px] overflow-hidden">
                            <span className="invisible whitespace-pre text-xl font-bold tracking-tight px-1 row-start-1 col-start-1 select-none pointer-events-none"
                                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {title || "Untitled Material"}&nbsp;
                            </span>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Untitled Material"
                                className="row-start-1 col-start-1 bg-transparent border border-transparent outline-none text-xl font-bold tracking-tight py-1 px-1 -ml-1 rounded-lg focus:bg-white focus:border-[#dee1d8] focus:shadow-sm transition-all w-full truncate"
                                style={{ color: '#2d342b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fileInputRef.current?.click()}

                        disabled={isImporting}
                        className="px-6 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-[0.96] flex items-center gap-2 disabled:opacity-50"
                        style={{
                            background: '#ebf0e5',
                            color: '#41683f',
                            border: '1px solid #dee5d8'
                        }}
                        onMouseEnter={e => {
                            if (!isImporting) {
                                e.currentTarget.style.background = '#e1e8db';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }
                        }}
                        onMouseLeave={e => {
                            if (!isImporting) {
                                e.currentTarget.style.background = '#ebf0e5';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        {isImporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                <span>Importing...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                <span>Import Word</span>
                            </>
                        )}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleWordImport}
                        accept=".docx"
                        className="hidden"
                    />
                    <button
                        onClick={() => handleSaveDraft()}
                        disabled={isSaving}
                        className="px-6 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-[0.96] disabled:opacity-50 shadow-sm hover:shadow-md flex items-center gap-2"
                        style={{
                            background: '#4caf50',
                            color: '#f8faf2',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#43a047';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#4caf50';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                <span>Saving...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-base">save</span>
                                <span>Save as Draft</span>
                            </>
                        )}
                    </button>
                    <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#dee5d8]">
                        <HeaderRightActions />
                    </div>
                </div>
            </header>

            {/* Main Workspace + Sidebar */}
            <div className="flex flex-1">

                {/* ── Left Sidebar ── */}
                <aside className="w-72 flex flex-col gap-y-4 p-6 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar"
                    style={{ background: '#f1f5eb', borderRight: '1px solid rgba(173,180,168,0.15)' }}>

                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-black text-sm"
                                style={{ background: '#ebf0e5', color: '#41683f', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {mounted && user?.fullName ? user.fullName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'AA'}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold" style={{ color: '#2d342b' }}>
                                    {mounted && user?.fullName ? user.fullName : 'Academic Atelier'}
                                </h3>
                                <p className="text-[10px] tracking-wider uppercase font-bold" style={{ color: 'rgba(45,52,43,0.6)' }}>
                                    Spring 2024 • Draft
                                </p>
                            </div>
                        </div>

                        {/* Material Type & Sequence Selector moved here */}
                        <div className="mb-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[9px] font-black tracking-widest uppercase mb-1.5" style={{ color: '#adb4a8' }}>Material Type</label>
                                    <div className="relative">
                                        <select
                                            value={materialType}
                                            onChange={e => setMaterialType(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-[#dee1d8] bg-white text-xs font-bold outline-none focus:border-primary-500 transition-all appearance-none cursor-pointer pr-8"
                                            style={{ color: '#2d342b' }}
                                        >
                                            <option value="DOCUMENT">Document</option>
                                            <option value="ASSIGNMENT">Assignment</option>
                                            <option value="READING">Reading</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#adb4a8]">
                                            <ChevronDown size={14} />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[9px] font-black tracking-widest uppercase mb-1.5" style={{ color: '#adb4a8' }}>Sequence ID</label>
                                    <input
                                        type="number"
                                        value={sequenceId}
                                        onChange={e => setSequenceId(e.target.value)}
                                        className="w-full px-3 py-2 rounded-xl border border-[#adb4a8] bg-white text-xs font-bold outline-none focus:border-primary-500 transition-all"
                                        style={{ color: '#2d342b' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Heading Outline Moved to Left */}
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
                        </div>
                    </div>
                </aside>

                {/* Main Workspace */}
                <div className="flex-1 pb-48 scroll-smooth bg-[#f0f2eb] overflow-y-auto h-[calc(100vh-80px)]" onClick={() => setShowMenuForBlockId(null)}>

                    {/* Floating Design Toolbar - Sticky within Workspace */}
                    <div className="sticky top-0 z-[100] w-full pt-4 pb-2 flex justify-center pointer-events-none">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#adb4a8] rounded-2xl shadow-xl pointer-events-auto">
                            {/* Block Type Dropdown */}
                            <div className="relative group/tool pr-2 mr-2 border-r border-zinc-100">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#f1f5eb] text-[#2d342b] transition-all">
                                    <Type size={16} className="text-primary-500" />
                                    <span className="text-xs font-bold">Text</span>
                                    <ChevronDown size={12} className="opacity-40" />
                                </button>
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-[#adb4a8] rounded-xl shadow-xl opacity-0 invisible group-hover/tool:opacity-100 group-hover/tool:visible transition-all z-50 py-2">
                                    {[
                                        { id: 'p', label: 'Paragraph', icon: Type },
                                        { id: 'h1', label: 'Heading 1', icon: Heading1 },
                                        { id: 'h2', label: 'Heading 2', icon: Heading2 },
                                        { id: 'ul', label: 'Bullet List', icon: List },
                                        { id: 'ol', label: 'Numbered List', icon: ListOrdered },
                                        { id: 'quote', label: 'Quote', icon: Quote },
                                        { id: 'table', label: 'Table', icon: Table },
                                    ].map(t => (
                                        <button key={t.id} onClick={() => handleToolbarAction(t.id)} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-[#2d342b] hover:bg-[#f1f5eb] transition-colors text-left">
                                            <t.icon size={14} className="text-[#5a6157]" />
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Inline Styles */}
                            <div className="flex items-center gap-1">
                                <button onMouseDown={e => e.preventDefault()} onClick={() => handleToolbarAction('bold')} title="Bold" className="p-2 rounded-lg hover:bg-[#f1f5eb] text-[#5a6157] hover:text-primary-500 transition-all">
                                    <Bold size={16} />
                                </button>
                                <button onMouseDown={e => e.preventDefault()} onClick={() => handleToolbarAction('italic')} title="Italic" className="p-2 rounded-lg hover:bg-[#f1f5eb] text-[#5a6157] hover:text-primary-500 transition-all">
                                    <Italic size={16} />
                                </button>
                                <button onMouseDown={e => e.preventDefault()} onClick={() => handleToolbarAction('underline')} title="Underline" className="p-2 rounded-lg hover:bg-[#f1f5eb] text-[#5a6157] hover:text-primary-500 transition-all">
                                    <Underline size={16} />
                                </button>
                            </div>

                            <div className="w-px h-6 bg-zinc-100 mx-1"></div>

                            {/* Alignment */}
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleToolbarAction('align-left')} title="Align Left" className={`p-2 rounded-lg transition-all ${blocks.find(b => b.id === focusedBlockId)?.align === 'left' ? 'bg-[#f1f5eb] text-primary-500' : 'text-[#5a6157] hover:bg-[#f1f5eb] hover:text-primary-500'}`}>
                                    <AlignLeft size={16} />
                                </button>
                                <button onClick={() => handleToolbarAction('align-center')} title="Align Center" className={`p-2 rounded-lg transition-all ${blocks.find(b => b.id === focusedBlockId)?.align === 'center' ? 'bg-[#f1f5eb] text-primary-500' : 'text-[#5a6157] hover:bg-[#f1f5eb] hover:text-primary-500'}`}>
                                    <AlignCenter size={16} />
                                </button>
                                <button onClick={() => handleToolbarAction('align-right')} title="Align Right" className={`p-2 rounded-lg transition-all ${blocks.find(b => b.id === focusedBlockId)?.align === 'right' ? 'bg-[#f1f5eb] text-primary-500' : 'text-[#5a6157] hover:bg-[#f1f5eb] hover:text-primary-500'}`}>
                                    <AlignRight size={16} />
                                </button>
                            </div>

                            <div className="w-px h-6 bg-zinc-100 mx-1"></div>

                            {/* Font Size & Color */}
                            <div className="flex items-center gap-1.5 relative">
                                <div className="relative">
                                    <button
                                        onClick={() => { setShowSizePicker(showSizePicker ? null : focusedBlockId); setShowColorPicker(null); }}
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${showSizePicker ? 'bg-[#f1f5eb] text-primary-500' : 'text-[#5a6157] hover:bg-[#f1f5eb] hover:text-primary-500'}`}
                                        title="Font Size"
                                    >
                                        <Type size={16} />
                                        <span className="text-[10px] font-black w-10 truncate">{SIZES.find(s => s.value === blocks.find(b => b.id === focusedBlockId)?.fontSize)?.label || 'Normal'}</span>
                                        <ChevronDown size={10} className="opacity-40" />
                                    </button>
                                    <AnimatePresence>
                                        {showSizePicker && (
                                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute top-full left-0 mt-2 w-32 bg-white border border-[#adb4a8] rounded-xl shadow-xl z-[60] py-1 overflow-hidden">
                                                {SIZES.map(s => (
                                                    <button key={s.value} onClick={() => { updateBlockStyle(focusedBlockId!, { fontSize: s.value }); setShowSizePicker(null); }}
                                                        className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-[#f1f5eb] transition-colors" style={{ color: '#2d342b' }}>
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() => { setShowColorPicker(showColorPicker ? null : focusedBlockId); setShowSizePicker(null); }}
                                        className={`p-2 rounded-lg transition-all ${showColorPicker ? 'bg-[#f1f5eb]' : 'hover:bg-[#f1f5eb]'}`}
                                        title="Text Color"
                                    >
                                        <div className="flex flex-col items-center">
                                            <Highlighter size={16} style={{ color: blocks.find(b => b.id === focusedBlockId)?.color || '#2d342b' }} />
                                            <div className="h-0.5 w-full mt-0.5 rounded-full" style={{ background: blocks.find(b => b.id === focusedBlockId)?.color || '#2d342b' }} />
                                        </div>
                                    </button>
                                    <AnimatePresence>
                                        {showColorPicker && (
                                            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }}
                                                className="absolute top-full right-0 mt-2 p-2 bg-white border border-[#dee1d8] rounded-xl shadow-xl z-[60] grid grid-cols-5 gap-1 w-40">
                                                {COLORS.map(c => (
                                                    <button key={c.value} onClick={() => { updateBlockStyle(focusedBlockId!, { color: c.value }); setShowColorPicker(null); }}
                                                        className="w-6 h-6 rounded-md border border-[#adb4a8] transition-transform hover:scale-110"
                                                        style={{ background: c.value }} title={c.name} />
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-[1100px] mx-auto py-20 px-4 min-h-full">
                        {/* Single Continuous Wrapper */}
                        <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#adb4a8] rounded-sm relative w-full min-h-[1100px] px-12 pt-16 pb-60 flex flex-col" onClick={e => e.stopPropagation()}>
                            <div className="flex-1 flex flex-col gap-y-1">
                                {isLoadingBlocks ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-40 gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-4 border-[#dee5d8] border-t-primary-500 animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Loader2 size={24} className="text-primary-500 animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <p className="text-sm font-bold text-[#2d342b]">Preparing your workspace...</p>
                                            <p className="text-[10px] uppercase tracking-widest font-black text-[#adb4a8]">Academic Atelier v2.4</p>
                                        </div>
                                    </div>
                                ) : blocks.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center py-20 grayscale opacity-40">
                                        <div className="w-20 h-20 rounded-full bg-[#f1f5eb] flex items-center justify-center mb-4">
                                            <Info size={32} className="text-[#5a6157]" />
                                        </div>
                                        <p className="text-sm font-bold">No content blocks found.</p>
                                        <button
                                            onClick={() => addBlock(0, 'PARAGRAPH')}
                                            className="mt-4 text-xs font-bold text-primary-600 hover:underline"
                                        >
                                            Click here to start writing
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {blocks.map((block, globalIndex) => {
                                            const isTargetRef = globalIndex === blocks.length - 1;
                                            return (
                                                <div
                                                    ref={isTargetRef ? lastBlockElementRef : null}
                                                    key={block.id}
                                                    data-block-id={block.id}
                                                    className="group relative flex items-start gap-2"
                                                    onMouseEnter={() => setHoveredBlockId(block.id)}
                                                    onMouseLeave={() => setHoveredBlockId(null)}
                                                >
                                                    <div className={`absolute -left-12 top-2 flex flex-col gap-1 transition-opacity ${hoveredBlockId === block.id || showMenuForBlockId === block.id ? 'opacity-100' : 'opacity-0'}`}>
                                                        <div className="relative">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setShowMenuForBlockId(showMenuForBlockId === block.id ? null : block.id);
                                                                }}
                                                                className="p-1.5 rounded-lg transition-all hover:bg-[rgba(65,104,63,0.1)] group/btn"
                                                                style={{ color: showMenuForBlockId === block.id ? '#4caf50' : '#adb4a8' }}
                                                            >
                                                                <Plus size={18} className={`transition-transform duration-300 ${showMenuForBlockId === block.id ? 'rotate-45' : ''}`} />
                                                            </button>

                                                            {/* Turn into... Menu Popup */}
                                                            <AnimatePresence>
                                                                {showMenuForBlockId === block.id && (
                                                                    <motion.div
                                                                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                                                                        className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.18)] border border-[#adb4a8] py-3 z-[150] overflow-hidden"
                                                                        onClick={e => e.stopPropagation()}
                                                                    >
                                                                        <div className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#adb4a8] mb-1">Turn into...</div>
                                                                        <div className="max-h-[350px] overflow-y-auto px-1 custom-scrollbar">
                                                                            {BLOCK_TYPES.map(bt => {
                                                                                const Icon = bt.icon;
                                                                                return (
                                                                                    <button key={bt.id}
                                                                                        onClick={() => {
                                                                                            if (bt.id === 'TABLE') {
                                                                                                setTableTargetBlockId(block.id);
                                                                                                setShowTableModal(true);
                                                                                            } else {
                                                                                                updateBlockType(block.id, bt.id, block.content === '/' ? '' : undefined);
                                                                                            }
                                                                                            setShowMenuForBlockId(null);
                                                                                            setFocusedBlockId(block.id);
                                                                                        }}
                                                                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-[rgba(65,104,63,0.08)] transition-all group/item text-left"
                                                                                    >
                                                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white border border-[#adb4a8] text-[#5a6157] group-hover/item:border-primary-200 group-hover/item:text-primary-600 transition-colors">
                                                                                            <Icon size={16} />
                                                                                        </div>
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-sm font-bold text-[#2d342b] group-hover/item:text-primary-700">{bt.label}</span>
                                                                                            <span className="text-[9px] font-medium text-[#adb4a8]">Convert this block</span>
                                                                                        </div>
                                                                                    </button>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                        <div className="p-1.5 cursor-grab active:cursor-grabbing text-[#adb4a8] hover:text-[#5a6157] transition-colors">
                                                            <GripVertical size={16} />
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 min-w-0 relative">
                                                        {block.type === 'H1' && (
                                                            <EditableBlock
                                                                id={block.id}
                                                                html={block.content}
                                                                onFocus={() => setFocusedBlockId(block.id)}
                                                                onBlur={() => autoSaveBlock(block.id, globalIndex)}
                                                                onChange={val => updateBlockContent(block.id, val)}
                                                                onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                onPaste={e => handlePaste(e, globalIndex, block)}
                                                                placeholder=""
                                                                className={`w-full ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : block.align === 'justify' ? 'text-justify' : 'text-left'} font-black bg-transparent outline-none py-1 mt-6 mb-4 leading-tight min-h-[1em]`}
                                                                style={{ color: block.color || '#2d342b', fontSize: block.fontSize || '36px' }}
                                                            />
                                                        )}
                                                        {block.type === 'H2' && (
                                                            <EditableBlock
                                                                id={block.id}
                                                                html={block.content}
                                                                onFocus={() => setFocusedBlockId(block.id)}
                                                                onBlur={() => autoSaveBlock(block.id, globalIndex)}
                                                                onChange={val => updateBlockContent(block.id, val)}
                                                                onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                onPaste={e => handlePaste(e, globalIndex, block)}
                                                                placeholder=""
                                                                className={`w-full ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : block.align === 'justify' ? 'text-justify' : 'text-left'} font-bold bg-transparent outline-none py-1 mt-4 mb-2 leading-tight min-h-[1em]`}
                                                                style={{ color: block.color || '#2d342b', fontSize: block.fontSize || '24px' }}
                                                            />
                                                        )}
                                                        {block.type === 'PARAGRAPH' && (
                                                            <EditableBlock
                                                                id={block.id}
                                                                html={block.content}
                                                                onFocus={() => setFocusedBlockId(block.id)}
                                                                onBlur={() => autoSaveBlock(block.id, globalIndex)}
                                                                onChange={val => updateBlockContent(block.id, val)}
                                                                onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                onPaste={e => handlePaste(e, globalIndex, block)}
                                                                placeholder=""
                                                                className={`w-full ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : block.align === 'justify' ? 'text-justify' : 'text-left'} font-medium bg-transparent outline-none py-1 leading-relaxed min-h-[1em]`}
                                                                style={{ color: block.color || '#5a6157', fontSize: block.fontSize || '16px' }}
                                                            />
                                                        )}
                                                        {block.type === 'BULLET_LIST' && (
                                                            <div className="flex items-start gap-3 py-1 group relative">
                                                                <div className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#2d342b' }}></div>
                                                                <EditableBlock
                                                                    id={block.id}
                                                                    html={block.content}
                                                                    onFocus={() => setFocusedBlockId(block.id)}
                                                                    onBlur={() => autoSaveBlock(block.id, globalIndex)}
                                                                    onChange={val => updateBlockContent(block.id, val)}
                                                                    onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                    placeholder=""
                                                                    className="w-full font-medium bg-transparent outline-none min-h-[1em]"
                                                                    style={{ color: block.color || '#5a6157', fontSize: block.fontSize || '16px' }}
                                                                />
                                                            </div>
                                                        )}
                                                        {block.type === 'ORDERED_LIST' && (
                                                            <div className="flex items-start gap-3 py-1 group relative">
                                                                <div className="mt-1 text-sm font-bold opacity-30 shrink-0 w-4">
                                                                    {blocks.filter((b, i) => b.type === 'ORDERED_LIST' && i <= globalIndex).length}.
                                                                </div>
                                                                <EditableBlock
                                                                    id={block.id}
                                                                    html={block.content}
                                                                    onFocus={() => setFocusedBlockId(block.id)}
                                                                    onBlur={() => autoSaveBlock(block.id, globalIndex)}
                                                                    onChange={val => updateBlockContent(block.id, val)}
                                                                    onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                    onPaste={e => handlePaste(e, globalIndex, block)}
                                                                    className="w-full font-medium bg-transparent outline-none min-h-[1em]"
                                                                    style={{ color: block.color || '#5a6157', fontSize: block.fontSize || '16px' }}
                                                                />
                                                            </div>
                                                        )}
                                                        {block.type === 'QUOTE' && (
                                                            <div className="pl-6 border-l-4 py-2 my-2 transition-all" style={{ borderColor: '#dee5d8', background: '#f8faf7' }}>
                                                                <EditableBlock
                                                                    id={block.id}
                                                                    html={block.content}
                                                                    onFocus={() => setFocusedBlockId(block.id)}
                                                                    onBlur={() => autoSaveBlock(block.id, globalIndex)}
                                                                    onChange={val => updateBlockContent(block.id, val)}
                                                                    onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                    onPaste={e => handlePaste(e, globalIndex, block)}
                                                                    className="w-full font-medium italic bg-transparent outline-none min-h-[1.5em]"
                                                                    style={{ color: block.color || '#5a6157', fontSize: block.fontSize || '20px' }}
                                                                />
                                                            </div>
                                                        )}
                                                        {block.type === 'CODE_BLOCK' && (
                                                            <div className="p-5 rounded-2xl font-mono text-sm shadow-inner my-3" style={{ background: '#1a1c18' }}>
                                                                <textarea autoFocus={focusedBlockId === block.id} value={block.content}
                                                                    onChange={e => { handleTextareaInput(e); updateBlockContent(block.id, e.target.value); }}
                                                                    onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                    onFocus={e => { setFocusedBlockId(block.id); handleTextareaInput(e); }}
                                                                    placeholder=""
                                                                    className="w-full bg-transparent outline-none resize-none overflow-hidden leading-relaxed"
                                                                    style={{ color: '#7fcc76', fontFamily: 'Plus Jakarta Sans, sans-serif' }} rows={1} spellCheck={false} />
                                                            </div>
                                                        )}
                                                        {block.type === 'DIVIDER' && (
                                                            <div className="py-6 flex items-center">
                                                                <div className="h-[2px] w-full" style={{ background: '#dee5d8' }}></div>
                                                            </div>
                                                        )}
                                                        {block.type === 'IMAGE' && (
                                                            <div className="my-4 relative rounded-2xl overflow-hidden flex justify-center w-full" style={{ border: '1px solid #dee5d8', background: '#f1f5eb' }}>
                                                                {isUploading[block.id] ? (
                                                                    <div className="flex flex-col items-center justify-center py-4" style={{ color: '#adb4a8' }}>
                                                                        <Loader2 className="animate-spin" size={28} />
                                                                    </div>
                                                                ) : block.content ? (
                                                                    <img src={block.content} alt="Material" className="max-w-full h-auto object-contain" />
                                                                ) : (
                                                                    <label className="py-16 w-full flex flex-col items-center justify-center cursor-pointer transition-colors"
                                                                        onMouseEnter={e => (e.currentTarget.style.background = '#e4eade')}
                                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                                        <ImageIcon size={32} className="mb-3" style={{ color: '#adb4a8' }} />
                                                                        <span className="text-sm font-medium" style={{ color: '#5a6157' }}>Click to upload an image</span>
                                                                        <input type="file" accept="image/*" className="hidden" onChange={async e => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) {
                                                                                setIsUploading(prev => ({ ...prev, [block.id]: true }));
                                                                                try { updateBlockContent(block.id, await uploadToCloudinary(file)); }
                                                                                catch { alert("Upload failed."); }
                                                                                finally { setIsUploading(prev => ({ ...prev, [block.id]: false })); }
                                                                            }
                                                                        }} />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        )}
                                                        {block.type === 'TABLE' && (
                                                            <TableBlock
                                                                id={block.id}
                                                                content={block.content}
                                                                onFocus={() => setFocusedBlockId(block.id)}
                                                                onChange={val => updateBlockContent(block.id, val)}
                                                                align={block.align as any}
                                                            />
                                                        )}

                                                        {/* Fallback for unknown types to ensure visibility */}
                                                        {(!['H1', 'H2', 'PARAGRAPH', 'BULLET_LIST', 'ORDERED_LIST', 'QUOTE', 'CODE_BLOCK', 'DIVIDER', 'IMAGE', 'TABLE'].includes(block.type)) && (
                                                            <EditableBlock
                                                                id={block.id}
                                                                html={block.content}
                                                                onFocus={() => setFocusedBlockId(block.id)}
                                                                onBlur={() => autoSaveBlock(block.id, globalIndex)}
                                                                onChange={val => updateBlockContent(block.id, val)}
                                                                onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                onPaste={e => handlePaste(e, globalIndex, block)}
                                                                placeholder="Start typing..."
                                                                className={`w-full ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left'} font-medium bg-transparent outline-none py-1 leading-relaxed min-h-[1em]`}
                                                                style={{ color: block.color || '#5a6157', fontSize: block.fontSize || '16px' }}
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Delete */}
                                                    <div className={`absolute -right-8 top-2 flex flex-col gap-1 transition-opacity ${hoveredBlockId === block.id ? 'opacity-100' : 'opacity-0'}`}>
                                                        <button onClick={() => removeBlock(block.id)}
                                                            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                                                            style={{ color: '#adb4a8' }}
                                                            onMouseEnter={e => { e.currentTarget.style.color = '#a73b21'; e.currentTarget.style.background = '#fd795a1a'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.color = '#adb4a8'; e.currentTarget.style.background = 'transparent'; }}>
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Bottom click area to add block */}
                                        <div className="py-20 cursor-text" onClick={async () => { if (blocks.length === 0 || blocks[blocks.length - 1].content !== '' || blocks[blocks.length - 1].type !== 'PARAGRAPH') await addBlock(blocks.length, 'PARAGRAPH'); }}>
                                        </div>

                                        {/* Infinite Scroll Loader */}
                                        {isLoadingMore && (
                                            <div className="py-8 flex justify-center">
                                                <Loader2 className="animate-spin text-primary-500" size={24} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Floating Info Button */}
            <button
                onClick={() => setIsInfoModalOpen(true)}
                className="fixed bottom-8 right-6 h-10 pl-3 pr-4 bg-primary-600 text-white rounded-full flex items-center gap-2 shadow-xl hover:bg-primary-700 hover:scale-105 active:scale-95 transition-all z-50 border-2 border-white ring-2 ring-primary-100"
            >
                <Info size={18} className="animate-pulse" />
                <span className="font-bold text-xs whitespace-nowrap">Syllabus Info</span>
            </button>


            <SyllabusInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} syllabusInfo={syllabusInfo} syllabusId={syllabusId} />

            {/* ── Unsaved Changes Modal ── */}
            <AnimatePresence>
                {showExitModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden flex flex-col"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
                                    <h3 className="text-lg font-bold text-zinc-900">Warning</h3>
                                </div>
                                <button 
                                    onClick={() => setShowExitModal(false)}
                                    className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-8">
                                <p className="text-zinc-600 font-medium leading-relaxed">
                                    Document not saved, do you want to save it?
                                </p>
                            </div>
                            
                            {/* Footer */}
                            <div className="px-6 py-5 flex flex-row justify-end gap-3">
                                <button 
                                    onClick={() => setShowExitModal(false)}
                                    className="px-5 py-2.5 bg-zinc-50 text-zinc-600 rounded-xl font-bold text-xs hover:bg-zinc-100 transition-all active:scale-[0.98]"
                                >
                                    Close
                                </button>
                                
                                <button 
                                    onClick={() => {
                                        setHasChanges(false);
                                        // Use go(-2) to skip both the dummy history entry and the current page
                                        window.history.go(-2);
                                    }}
                                    className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition-all active:scale-[0.98]"
                                >
                                    Don't Save
                                </button>
                                
                                <button 
                                    onClick={async () => {
                                        await handleSaveDraft();
                                        setHasChanges(false);
                                        window.history.go(-2);
                                    }}
                                    disabled={isSaving}
                                    className="px-7 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-xs hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-900/10 active:scale-[0.98]"
                                >
                                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <span className="material-symbols-outlined text-sm">save</span>}
                                    Save and Exit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Table Creation Modal ── */}
            <AnimatePresence>
                {showTableModal && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-[#adb4a8]"
                        >
                            <div className="p-8 pb-4">
                                <div className="w-16 h-16 rounded-2xl bg-[#f1f5eb] flex items-center justify-center mb-6">
                                    <Table size={32} className="text-primary-600" />
                                </div>
                                <h3 className="text-2xl font-black text-[#2d342b] mb-1">Create Table</h3>
                                <p className="text-[#5a6157] text-sm font-medium">Specify your table dimensions.</p>
                            </div>

                            <div className="px-8 py-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#adb4a8]">Rows</label>
                                        <input
                                            type="number"
                                            min="1" max="20"
                                            value={tableRows}
                                            onChange={e => setTableRows(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                                            className="w-full px-4 py-3 rounded-xl border border-[#adb4a8] text-sm font-bold focus:border-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-[#adb4a8]">Columns</label>
                                        <input
                                            type="number"
                                            min="1" max="10"
                                            value={tableCols}
                                            onChange={e => setTableCols(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                            className="w-full px-4 py-3 rounded-xl border border-[#adb4a8] text-sm font-bold focus:border-primary-500 outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#f8faf2] p-6 flex flex-col gap-3 mt-4">
                                <button
                                    onClick={confirmTableCreation}
                                    className="w-full py-4 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary-900/20"
                                >
                                    Create Table
                                </button>
                                <button
                                    onClick={() => setShowTableModal(false)}
                                    className="w-full py-3.5 bg-white border border-[#adb4a8] text-[#5a6157] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-50 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
