"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Plus, Trash2, GripVertical, Upload, X,
    Type, Heading1, Heading2, Code, Quote, List, Image as ImageIcon, Loader2, Minus, Table, ListOrdered,
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link, ChevronDown, Highlighter
} from "lucide-react";
import { HeaderRightActions } from "@/components/layout/HeaderRightActions";
import { TableBlock } from '@/components/dashboard/TableBlock';
import { motion, AnimatePresence } from "framer-motion";
import { SyllabusInfoModal } from "@/components/dashboard/SyllabusInfoModal";
import { MaterialService } from "@/services/material.service";
import { BlockService } from "@/services/block.service";
import { SyllabusService } from "@/services/syllabus.service";
import mammoth from "mammoth";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";


type BlockType = 'H1' | 'H2' | 'PARAGRAPH' | 'ORDERED_LIST' | 'BULLET_LIST' | 'CODE_BLOCK' | 'QUOTE' | 'TABLE' | 'DIVIDER' | 'IMAGE';

interface Block {
    id: string;
    type: BlockType;
    content: string;
    align?: 'left' | 'center' | 'right' | 'justify';
    color?: string;
    fontSize?: string;
}

const BLOCK_TYPES: { id: BlockType; label: string; icon: any; shortcut: string }[] = [
    { id: 'H1', label: 'Heading 1', icon: Heading1, shortcut: '# ' },
    { id: 'H2', label: 'Heading 2', icon: Heading2, shortcut: '## ' },
    { id: 'PARAGRAPH', label: 'Text', icon: Type, shortcut: '/p ' },
    { id: 'ORDERED_LIST', label: 'Numbered List', icon: ListOrdered, shortcut: '1. ' },
    { id: 'BULLET_LIST', label: 'Bullet List', icon: List, shortcut: '- ' },
    { id: 'CODE_BLOCK', label: 'Code', icon: Code, shortcut: '/code ' },
    { id: 'QUOTE', label: 'Quote', icon: Quote, shortcut: '> ' },
    { id: 'TABLE', label: 'Table (Markdown)', icon: Table, shortcut: '/table ' },
    { id: 'DIVIDER', label: 'Divider', icon: Minus, shortcut: '---' },
    { id: 'IMAGE', label: 'Image', icon: ImageIcon, shortcut: '/img ' },
];

/**
 * A specialized ContentEditable component that prevents re-setting innerHTML
 * when the content matches the current state, resolving cursor jumping issues.
 */
const EditableBlock = ({ 
    html, 
    onChange, 
    onKeyDown, 
    onFocus, 
    onImagePaste,
    onMultiPaste,
    className, 
    style, 
    placeholder,
    id,
    shouldFocus
}: { 
    html: string, 
    onChange: (val: string) => void, 
    onKeyDown?: (e: React.KeyboardEvent) => void,
    onFocus?: () => void,
    onImagePaste?: (file: File) => void,
    onMultiPaste?: (parts: string[]) => void,
    className?: string, 
    style?: React.CSSProperties,
    placeholder?: string,
    id: string,
    shouldFocus?: boolean
}) => {
    const elRef = useRef<HTMLDivElement>(null);

    // Sync state to DOM only if they differ (prevents cursor jumping)
    // This runs ONCE on mount and only when truly needed from outside
    useEffect(() => {
        if (elRef.current && elRef.current.innerHTML !== html) {
            elRef.current.innerHTML = html || '';
        }
    }, [html]);

    // Focus effect - triggered by parent passing shouldFocus=true
    useEffect(() => {
        if (shouldFocus && elRef.current) {
            elRef.current.focus();
            // Place cursor at start of new block
            try {
                const range = document.createRange();
                const sel = window.getSelection();
                range.setStart(elRef.current, 0);
                range.collapse(true);
                sel?.removeAllRanges();
                sel?.addRange(range);
            } catch(e) { /* ignore selection errors on empty nodes */ }
        }
    }, [shouldFocus]);

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = Array.from(e.clipboardData.items);
        const imageItem = items.find(item => item.type.startsWith('image/'));
        
        if (imageItem && onImagePaste) {
            e.preventDefault();
            const file = imageItem.getAsFile();
            if (file) {
                onImagePaste(file);
                return;
            }
        }

        const text = e.clipboardData.getData('text/plain');
        
        // Smart Multi-Paragraph Splitting
        if (onMultiPaste && (text.includes('\n\n') || (text.includes('\n') && text.trim().split('\n').length > 1))) {
            const lines = text.split(/\r?\n\s*\r?\n|\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
            if (lines.length > 1) {
                e.preventDefault();
                onMultiPaste(lines);
                return;
            }
        }

        e.preventDefault();
        const html = e.clipboardData.getData('text/html');

        if (html) {
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
                    onChange(html); // Trigger state update, parent will handle style extraction if we passed it up, 
                    // but here we manipulate DOM directly or notify parent.
                    // For now, let's just make sure sanitize handles it.
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
            
            if (onMultiPaste && topBlocks.length > 1) {
                const parts = topBlocks.map(b => b.innerHTML.trim()).filter(h => h.length > 0);
                onMultiPaste(parts);
            } else {
                document.execCommand('insertHTML', false, tmp.innerHTML);
            }
        } else {
            document.execCommand('insertText', false, text);
        }
    };


    return (
        <div
            ref={elRef}
            contentEditable
            suppressContentEditableWarning
            onInput={e => {
                const current = e.currentTarget.innerHTML;
                if (current === '<br>') onChange(''); // Normalize empty content
                else onChange(current);
            }}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
            onPaste={handlePaste}
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

const NAV_LINKS = [
    { icon: 'info', label: 'Course Info' },
    { icon: 'target', label: 'Learning Objectives' },
    { icon: 'library_books', label: 'Required Texts', active: true },
    { icon: 'calendar_today', label: 'Weekly Schedule' },
    { icon: 'percent', label: 'Grading Policy' },
];

function NewMaterialPageInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const syllabusId = searchParams.get("syllabusId") || "";
    const taskId = searchParams.get("taskId") || "";
    const { user } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();

    const [syllabusName, setSyllabusName] = useState("");
    const [title, setTitle] = useState("");

    const [materialType, setMaterialType] = useState("DOCUMENT");
    const [blocks, setBlocks] = useState<Block[]>([
        { id: 'initial-h1', type: 'H1', content: '' },
        { id: 'initial-p', type: 'PARAGRAPH', content: '' }
    ]);
    const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
    const [showMenuForBlockId, setShowMenuForBlockId] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
    const [showSizePicker, setShowSizePicker] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

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

    // ── Table Creation States ──
    const [showTableModal, setShowTableModal] = useState(false);
    const [tableRows, setTableRows] = useState(3);
    const [tableCols, setTableCols] = useState(3);
    const [tableTargetIndex, setTableTargetIndex] = useState<number | null>(null);
    const [tableTargetBlockId, setTableTargetBlockId] = useState<string | null>(null);

    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Unsaved Changes Warning ──
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasChanges]);

    // Detect modifications to track dirty state
    useEffect(() => {
        // Simple heuristic: if blocks > 2 or title != empty or non-default content
        const isModified = 
            title.trim() !== '' || 
            materialType !== 'DOCUMENT' || 
            blocks.length > 2 || 
            (blocks.length > 0 && blocks.some(b => stripHtml(b.content).trim().length > 0));
        
        if (isModified) setHasChanges(true);
    }, [blocks, title, materialType]);

    const handleBackWithWarning = () => {
        if (hasChanges) {
            setShowExitModal(true);
        } else {
            router.back();
        }
    };

    // Fetch Syllabus Name
    useEffect(() => {
        if (!syllabusId) return;
        (async () => {
            try {
                const res = await SyllabusService.getSyllabusById(syllabusId);
                if (res?.data?.syllabusName) setSyllabusName(res.data.syllabusName);
            } catch (err) {
                console.error("Failed to fetch syllabus name:", err);
            }
        })();
    }, [syllabusId]);

    const handleWordImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
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
            const html = result.value;
            const importedBlocks = parseHtmlToBlocks(html);
            
            if (importedBlocks.length > 0) {
                // If editor is empty (or just placeholder blocks), replace with imported
                const isEmpty = blocks.length <= 2 && (blocks.every(b => !stripHtml(b.content).trim()));
                if (isEmpty) {
                    setBlocks(importedBlocks);
                } else {
                    setBlocks([...blocks, ...importedBlocks]);
                }
                showToast(`Imported ${importedBlocks.length} blocks from Word.`);
            } else {
                showToast("No readable content found in Word document.", "error");
            }
        } catch (err) {
            console.error("Word import error:", err);
            showToast("Failed to parse Word document.", "error");
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
                        align: align
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



    // Helper to clean content (remove &nbsp; and wrapping tags)
    const sanitizeBlockContent = (html: string) => {
        if (!html) return '';
        
        let cleaned = html
            .replace(/&nbsp;/g, ' ') 
            .replace(/\u00A0/g, ' ') 
            .trim();

        // 1. Strip block-level wrapping tags (p, div) but PRESERVE their inner content 
        // convert them to line breaks if they were separate paragraphs initially.
        cleaned = cleaned
            .replace(/<p[^>]*>/gi, '')
            .replace(/<\/p>/gi, '<br>')
            .replace(/<div[^>]*>/gi, '')
            .replace(/<\/div>/gi, '<br>');

        // 2. Remove trailing line breaks
        cleaned = cleaned.replace(/(<br\s*\/?>)+$/g, '').trim();

        return cleaned;
    };


    // High-performance regex-based HTML stripping to remove typing lag
    const stripHtml = (htmlContent: string) => {
        return htmlContent.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ');
    };

    const pendingFocusIdRef = useRef<string | null>(null);
    const [focusToken, setFocusToken] = useState(0); // increments to re-trigger focus


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

    useEffect(() => {
        const handleClickOutside = () => {
            setShowColorPicker(null);
            setShowSizePicker(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setMounted(true);
    }, []);



    // Focus the pending block after render
    useEffect(() => {
        if (!pendingFocusIdRef.current) return;
        const id = pendingFocusIdRef.current;
        pendingFocusIdRef.current = null;
        // Use rAF to ensure DOM is fully painted before focusing
        requestAnimationFrame(() => {
            const el = document.querySelector(`[data-block-id="${id}"]`) as HTMLElement | null;
            if (el) {
                el.focus();
                try {
                    const range = document.createRange();
                    const sel = window.getSelection();
                    range.setStart(el, 0);
                    range.collapse(true);
                    sel?.removeAllRanges();
                    sel?.addRange(range);
                } catch (e) { /* ignore */ }
            }
        });
    }, [focusToken]);

    const addBlock = (index: number, type: BlockType = 'PARAGRAPH', content: string = '') => {
        const nb: Block = { 
            id: crypto.randomUUID(),
            type, 
            content,
        };
        
        pendingFocusIdRef.current = nb.id;
        
        setBlocks(prev => { 
            const arr = [...prev];
            arr.splice(index + 1, 0, nb); 
            return arr; 
        });
        
        setShowMenuForBlockId(null);
        setFocusToken(t => t + 1);
        return nb;
    };

    const confirmTableCreation = () => {
        const initialData = {
            rows: Array.from({ length: tableRows }, () => Array(tableCols).fill(''))
        };
        const content = JSON.stringify(initialData);

        if (tableTargetBlockId) {
            updateBlockType(tableTargetBlockId, 'TABLE', content);
        } else if (tableTargetIndex !== null) {
            addBlock(tableTargetIndex, 'TABLE', content);
        }

        setShowTableModal(false);
        setTableTargetIndex(null);
        setTableTargetBlockId(null);
        setTableRows(3);
        setTableCols(3);
    };

    const removeBlock = (id: string) => {
        setBlocks(prev => {
            if (prev.length <= 1) return prev;
            const idx = prev.findIndex(b => b.id === id);
            if (idx > 0) setTimeout(() => setFocusedBlockId(prev[idx - 1].id), 0);
            return prev.filter(b => b.id !== id);
        });
    };

    const updateBlockContent = (id: string, content: string) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
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
                const newContent = contentOverride !== undefined ? contentOverride : b.content;
                const sanitized = sanitizeBlockContent(newContent);
                // For H2 specifically, ensure it's very clean by replacing multiple spaces
                return { 
                    ...b, 
                    type, 
                    content: type === 'H2' ? sanitized.replace(/\s+/g, ' ').trim() : sanitized 
                };
            }
            return b;
        }));
        setShowMenuForBlockId(null);
    };

    const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement> | React.FocusEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const handleMultiPaste = (globalIndex: number, parts: string[]) => {
        setBlocks(current => {
            const newBlocks = [...current];
            // Replace current block content with first part
            newBlocks[globalIndex] = { ...newBlocks[globalIndex], content: parts[0] };
            
            // Create and insert subsequent blocks
            const blocksToInsert = parts.slice(1).map(content => ({
                id: `pasted-${Math.random().toString(36).substr(2, 9)}`,
                type: 'PARAGRAPH' as BlockType,
                content
            }));
            
            newBlocks.splice(globalIndex + 1, 0, ...blocksToInsert);
            return newBlocks;
        });

        // Set focus to the last pasted block after a tiny delay
        setTimeout(() => {
            const lastId = `pasted-${parts[parts.length-1]}`; // This is a bit tricky since ID is random above
            // Better to just rely on re-render and user clicking, or find by index
            const newIndex = globalIndex + parts.length - 1;
            // Focus logic should handle this via state
        }, 10);
    };

    const handleKeyDown = (e: React.KeyboardEvent, index: number, block: Block) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            
            // Advanced Split Logic
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0 && (block.type === 'PARAGRAPH' || block.type === 'H1' || block.type === 'H2' || block.type === 'QUOTE' || block.type === 'BULLET_LIST' || block.type === 'ORDERED_LIST')) {
                const range = selection.getRangeAt(0);
                const caretContainer = range.startContainer;
                const caretOffset = range.startOffset;

                const el = e.currentTarget as HTMLElement;
                
                // Split logic using range
                const preRange = document.createRange();
                preRange.selectNodeContents(el);
                preRange.setEnd(caretContainer, caretOffset);
                
                const postRange = document.createRange();
                postRange.selectNodeContents(el);
                postRange.setStart(caretContainer, caretOffset);
                
                const preContent = document.createElement('div');
                preContent.appendChild(preRange.cloneContents());
                const postContent = document.createElement('div');
                postContent.appendChild(postRange.cloneContents());

                const htmlBefore = preContent.innerHTML;
                const htmlAfter = postContent.innerHTML;

                // Update current block and add new one
                const nextType: BlockType = (block.type === 'H1' || block.type === 'H2') ? 'PARAGRAPH' : block.type;
                
                updateBlockContent(block.id, htmlBefore);
                addBlock(index, nextType, htmlAfter);
            } else {
                addBlock(index, (block.type === 'H1' || block.type === 'H2') ? 'PARAGRAPH' : block.type);
            }
        } else if (e.key === 'Backspace') {
            const selection = window.getSelection();
            const range = selection?.getRangeAt(0);
            
            // If block is empty, delete it
            if (stripHtml(block.content).trim() === '' && index > 0) {
                e.preventDefault();
                const prevBlockId = blocks[index - 1]?.id;
                removeBlock(block.id);
                if (prevBlockId) setFocusedBlockId(prevBlockId);
            } 
            // If at the start of a block, merge with previous
            else if (range && range.startOffset === 0 && range.collapsed && index > 0) {
                e.preventDefault();
                const prevBlock = blocks[index - 1];
                const currentContent = block.content;
                
                // Merge content
                updateBlockContent(prevBlock.id, prevBlock.content + currentContent);
                removeBlock(block.id);
                setFocusedBlockId(prevBlock.id);
            }
        }
    };

    const handleToolbarAction = (action: string) => {
        if (!focusedBlockId) return;
        const block = blocks.find(b => b.id === focusedBlockId);
        if (!block) return;

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
    };

    const updateBlockAlign = (id: string, align: 'left' | 'center' | 'right' | 'justify') => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, align } : b));
    };

    const updateBlockStyle = (id: string, updates: Partial<Pick<Block, 'color' | 'fontSize'>>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const handleImagePaste = async (file: File, index: number) => {
        const dummyId = crypto.randomUUID();
        setIsUploading(prev => ({ ...prev, [dummyId]: true }));
        try {
            const url = await uploadToCloudinary(file);
            addBlock(index, 'IMAGE', url);
        } catch (err) {
            console.error("Image paste failed:", err);
            alert("Failed to upload pasted image.");
        } finally {
            setIsUploading(prev => {
                const copy = { ...prev };
                delete copy[dummyId];
                return copy;
            });
        }
    };

    const uploadToCloudinary = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        return (await res.json()).url;
    };

    const handleSaveDraft = async () => {
        if (!title.trim()) { 
            showToast('Please enter a material title.', 'error');
            return; 
        }
        if (!syllabusId) { 
            showToast('Missing syllabusId.', 'error');
            return; 
        }
        setIsSaving(true);
        try {
            // Logic to calculate next numeric ID based on existing materials
            let nextId = 0;
            try {
                const existingMaterialsRes = await MaterialService.getMaterialsBySyllabusId(syllabusId as string);
                const materials = Array.isArray(existingMaterialsRes?.data) ? existingMaterialsRes.data : [];
                const ids = materials.map((m: any) => m.id).filter((id: any) => id !== undefined && !isNaN(Number(id)));
                if (ids.length > 0) {
                    nextId = Math.max(...ids.map((id: any) => Number(id))) + 1;
                }
            } catch (err) {
                console.warn("Failed to fetch existing materials for ID calculation, defaulting to 0", err);
            }

            const materialRes = await MaterialService.createMaterial({
                title,
                materialType,
                id: nextId,
                syllabusId: syllabusId as string
            });
            const theNewId = materialRes?.data?.materialId || materialRes?.data?.id;

            const validBlocks = blocks.filter(b => b.content.trim() !== '' || b.type === 'IMAGE' || b.type === 'DIVIDER');
            if (validBlocks.length > 0) {
                try {
                    await BlockService.createBlocks(theNewId as string, validBlocks.map((b, i) => {
                        const sanitized = b.type === 'H2' ? sanitizeBlockContent(b.content).replace(/\s+/g, ' ').trim() : sanitizeBlockContent(b.content);
                        return {
                            contentText: sanitized,
                            blockType: b.type,
                            blockStyle: JSON.stringify({ align: b.align || 'left', color: b.color, fontSize: b.fontSize }),
                            idx: i
                        };
                    }));
                } catch (blockErr: any) {
                    console.error("Block creation error:", blockErr);
                    if (blockErr?.message?.includes('Vector embedding')) {
                        throw new Error('Material created, but block indexing failed (Vector Service Error). Please try again or contact support.');
                    }
                    throw blockErr;
                }
            }
            showToast('Material saved as draft!');
            setHasChanges(false);
            setTimeout(() => {
                router.push(`/dashboard/pdcm/materials/${theNewId}/edit?syllabusId=${syllabusId}${taskId ? `&taskId=${taskId}` : ''}`);
            }, 1000);
        } catch (err: any) {
            console.error("Save error:", err);
            const msg = err?.message || 'Failed to save draft material.';
            showToast(msg, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const displayTitle = title || 'Untitled Material';
    const outlineItems = blocks.filter(b => (b.type === 'H1' || b.type === 'H2') && b.content.trim());

    return (
        <div className="min-h-screen flex flex-col" style={{ background: '#f8faf2', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <input type="file" ref={fileInputRef} className="hidden" accept=".docx" onChange={handleWordImport} />

            {/* ── Toast Notification ── */}
            {toast && (
                <div
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all"
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
            <header className="flex justify-between items-center px-10 h-20 w-full sticky top-0 z-[300]" style={{ background: '#f8faf2' }}>
                <div className="flex items-center gap-6">
                    <button onClick={handleBackWithWarning} className="p-2 rounded-lg transition-all"
                        style={{ color: '#2d342b' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#ebf0e5')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2.5 mb-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest leading-none" style={{ color: 'rgba(45,52,43,0.3)' }}>
                                {syllabusName || "Material Atelier"}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-black tracking-wider uppercase flex items-center justify-center leading-none" style={{ background: '#dee5d8', color: '#5a6157' }}>DRAFT</span>
                        </div>
                        <div className="relative inline-grid items-center max-w-[400px] min-w-[300px] overflow-hidden">
                            <span className="invisible whitespace-pre text-xl font-bold tracking-tight px-1 row-start-1 col-start-1 select-none pointer-events-none" 
                                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                {title || "Untitled Material"}&nbsp;
                            </span>
                            <input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Untitled Material"
                                className="row-start-1 col-start-1 bg-transparent border border-transparent outline-none text-xl font-bold tracking-tight py-1 px-1 -ml-1 rounded-lg focus:bg-white focus:border-[#adb4a8] focus:shadow-sm transition-all w-full truncate"
                                style={{ color: '#2d342b', fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-[rgba(65,104,63,0.05)] text-[#4caf50] border border-[rgba(76,175,80,0.2)] text-sm"
                    >
                        {isImporting ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                        Import Word
                    </button>
                    <button onClick={handleSaveDraft} disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-green-900/10 text-sm text-white"
                        style={{ backgroundColor: '#4caf50' }}>
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>

                    <div className="flex items-center gap-4 ml-4 pl-4 border-l border-[#dee5d8]">
                        <HeaderRightActions />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                <aside className="w-72 flex flex-col gap-y-4 p-6 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar"
                    style={{ background: '#f1f5eb', borderRight: '1px solid rgba(173,180,168,0.15)' }}>
                    <div className="shrink-0 mb-6">
                        <div className="flex items-center gap-3 mb-2">
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

                        {/* Material Type Selector moved here */}
                        <div className="mt-4 px-2">
                            <label className="block text-[9px] font-black tracking-widest uppercase mb-1.5" style={{ color: '#adb4a8' }}>Material Type</label>
                            <div className="relative">
                                <select 
                                    value={materialType} 
                                    onChange={e => setMaterialType(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border border-[#adb4a8] bg-white text-xs font-bold outline-none focus:border-primary-500 transition-all appearance-none cursor-pointer pr-8"
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
                    </div>

                    {/* Navigation Outline */}
                    {outlineItems.length > 0 && (
                        <div className="mt-4 flex-1 flex flex-col min-h-0 border-t border-[rgba(173,180,168,0.15)] pt-6">
                            <h4 className="text-[10px] font-bold tracking-widest uppercase mb-4 px-2" style={{ color: 'rgba(45,52,43,0.4)' }}>On This Page</h4>
                            <nav className="space-y-1 overflow-y-auto pr-2 custom-scrollbar">
                                {outlineItems.map(item => (
                                    <button key={item.id} 
                                        onClick={() => {
                                            const el = document.querySelector(`[data-block-id="${item.id}"]`);
                                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        }}
                                        className="w-full text-left text-[11px] font-semibold py-2 px-3 rounded-xl hover:bg-[rgba(65,104,63,0.08)] transition-all truncate group flex items-center gap-2"
                                        style={{ 
                                            color: '#5a6157', 
                                            paddingLeft: item.type === 'H2' ? '24px' : '12px' 
                                        }}>
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0 transition-all opacity-20 group-hover:opacity-100" 
                                            style={{ background: item.type === 'H1' ? '#41683f' : '#adb4a8' }}></span>
                                        {stripHtml(item.content) || 'Untitled Section'}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    )}
                </aside>

                {/* Main Workspace - Multi-Page Architecture */}
                <div className="flex-1 pb-48 scroll-smooth bg-[#f0f2eb] overflow-y-auto h-[calc(100vh-80px)]" onClick={() => setShowMenuForBlockId(null)}>
                    
                    {/* Floating Design Toolbar - Sticky within Workspace */}
                    <div className="sticky top-0 z-[100] w-full pt-4 pb-2 flex justify-center pointer-events-none">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#adb4a8] rounded-2xl shadow-xl pointer-events-auto">
                            {/* Block Type Dropdown */}
                            <div className="relative group/tool pr-2 mr-2 border-r border-zinc-100">
                                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[#f1f5eb] text-[#2d342b] transition-all">
                                    <Type size={16} className="text-[#4caf50]" />
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
                                <button onMouseDown={e => e.preventDefault()} onClick={() => handleToolbarAction('bold')} title="Bold" className="p-2 rounded-lg hover:bg-[#f1f5eb] text-[#5a6157] hover:text-[#4caf50] transition-all">
                                    <Bold size={16} />
                                </button>
                                <button onMouseDown={e => e.preventDefault()} onClick={() => handleToolbarAction('italic')} title="Italic" className="p-2 rounded-lg hover:bg-[#f1f5eb] text-[#5a6157] hover:text-[#4caf50] transition-all">
                                    <Italic size={16} />
                                </button>
                                <button onMouseDown={e => e.preventDefault()} onClick={() => handleToolbarAction('underline')} title="Underline" className="p-2 rounded-lg hover:bg-[#f1f5eb] text-[#5a6157] hover:text-[#4caf50] transition-all">
                                    <Underline size={16} />
                                </button>
                            </div>

                            <div className="w-px h-6 bg-zinc-100 mx-1"></div>

                            {/* Alignment */}
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleToolbarAction('align-left')} title="Align Left" className={`p-2 rounded-lg transition-all ${blocks.find(b => b.id === focusedBlockId)?.align === 'left' ? 'bg-[#f1f5eb] text-[#4caf50]' : 'text-[#5a6157] hover:bg-[#f1f5eb] hover:text-[#4caf50]'}`}>
                                    <AlignLeft size={16} />
                                </button>
                                <button onClick={() => handleToolbarAction('align-center')} title="Align Center" className={`p-2 rounded-lg transition-all ${blocks.find(b => b.id === focusedBlockId)?.align === 'center' ? 'bg-[#f1f5eb] text-[#4caf50]' : 'text-[#5a6157] hover:bg-[#f1f5eb] hover:text-[#4caf50]'}`}>
                                    <AlignCenter size={16} />
                                </button>
                                <button onClick={() => handleToolbarAction('align-right')} title="Align Right" className={`p-2 rounded-lg transition-all ${blocks.find(b => b.id === focusedBlockId)?.align === 'right' ? 'bg-[#f1f5eb] text-[#4caf50]' : 'text-[#5a6157] hover:bg-[#f1f5eb] hover:text-[#4caf50]'}`}>
                                    <AlignRight size={16} />
                                </button>
                            </div>

                            <div className="w-px h-6 bg-zinc-100 mx-1"></div>

                            {/* Font Size & Color */}
                            <div className="flex items-center gap-1.5 relative">
                                <div className="relative">
                                    <button 
                                        onClick={() => { setShowSizePicker(showSizePicker ? null : focusedBlockId); setShowColorPicker(null); }} 
                                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg transition-all ${showSizePicker ? 'bg-[#f1f5eb] text-[#4caf50]' : 'text-[#5a6157] hover:bg-[#f1f5eb] hover:text-[#4caf50]'}`} 
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
                                                className="absolute top-full left-0 mt-2 w-32 bg-white border border-[#dee1d8] rounded-xl shadow-xl z-[60] py-1 overflow-hidden">
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
                                                onClick={(e) => e.stopPropagation()}
                                                className="absolute top-full right-0 mt-2 p-2 bg-white border border-[#dee1d8] rounded-xl shadow-xl z-[60] grid grid-cols-5 gap-1 w-40">
                                                {COLORS.map(c => (
                                                    <button key={c.value} onClick={() => { updateBlockStyle(focusedBlockId!, { color: c.value }); setShowColorPicker(null); }}
                                                        className="w-6 h-6 rounded-md border border-[#dee1d8] transition-transform hover:scale-110" 
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
                        <div className="bg-white shadow-[0_4px_24px_rgb(0,0,0,0.06)] border border-[#adb4a8] rounded-sm relative w-full min-h-[1100px] px-12 pt-16 pb-60 flex flex-col" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            <Suspense fallback={
                                <div className="flex-1 flex flex-col items-center justify-center py-40">
                                    <Loader2 size={32} className="animate-spin" style={{ color: '#4caf50' }} />
                                    <p className="mt-4 text-sm font-bold" style={{ color: '#adb4a8' }}>Preparing workspace...</p>
                                </div>
                            }>
                                <div className="flex-1 flex flex-col gap-y-1">
                            {blocks.map((block, globalIndex) => {
                                return (
                                    <React.Fragment key={block.id}>
                                        <div
                                            className="group relative flex items-start gap-2"
                                            data-block-wrapper={block.id}
                                                            onMouseEnter={() => setHoveredBlockId(block.id)}
                                                            onMouseLeave={() => setHoveredBlockId(null)}
                                                        >
                                                            {/* Left controls */}
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

                                                            {/* Block Content */}
                                                            <div className="flex-1 min-w-0">
                                                                {block.type === 'H1' && (
                                                                    <EditableBlock
                                                                        id={block.id}
                                                                        html={block.content}
                                                                        onFocus={() => setFocusedBlockId(block.id)}
                                                                        onChange={val => updateBlockContent(block.id, val)}
                                                                        onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                        onImagePaste={(file) => handleImagePaste(file, globalIndex)}
                                                                        onMultiPaste={parts => handleMultiPaste(globalIndex, parts)}
                                                                        placeholder="Heading 1..."
                                                                        shouldFocus={false}
                                                                        className={`w-full ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : block.align === 'justify' ? 'text-justify' : 'text-left'} font-black bg-transparent outline-none py-1 mt-6 mb-4 leading-tight min-h-[1em]`}
                                                                        style={{ color: block.color || '#2d342b', fontSize: block.fontSize || '36px' }}
                                                                    />
                                                                )}
                                                                {block.type === 'H2' && (
                                                                    <EditableBlock
                                                                        id={block.id}
                                                                        html={block.content}
                                                                        onFocus={() => setFocusedBlockId(block.id)}
                                                                        onChange={val => updateBlockContent(block.id, val)}
                                                                        onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                        onImagePaste={(file) => handleImagePaste(file, globalIndex)}
                                                                        onMultiPaste={parts => handleMultiPaste(globalIndex, parts)}
                                                                        placeholder="Heading 2..."
                                                                        shouldFocus={false}
                                                                        className={`w-full ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : block.align === 'justify' ? 'text-justify' : 'text-left'} font-bold bg-transparent outline-none py-1 mt-4 mb-2 leading-tight min-h-[1em]`}
                                                                        style={{ color: block.color || '#2d342b', fontSize: block.fontSize || '24px' }}
                                                                    />
                                                                )}
                                                                {block.type === 'PARAGRAPH' && (
                                                                    <EditableBlock
                                                                        id={block.id}
                                                                        html={block.content}
                                                                        onFocus={() => setFocusedBlockId(block.id)}
                                                                        onChange={val => updateBlockContent(block.id, val)}
                                                                        onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                        onImagePaste={(file) => handleImagePaste(file, globalIndex)}
                                                                        onMultiPaste={parts => handleMultiPaste(globalIndex, parts)}
                                                                        shouldFocus={false}
                                                                        className={`w-full ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : block.align === 'justify' ? 'text-justify' : 'text-left'} leading-relaxed bg-transparent outline-none py-1 min-h-[1.5em] whitespace-pre-wrap`}
                                                                        style={{ color: block.color || '#2d342b', fontSize: block.fontSize || '18px' }}
                                                                    />
                                                                )}
                                                                {block.type === 'BULLET_LIST' && (
                                                                    <div className="flex items-start gap-4 py-1">
                                                                        <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-black shrink-0" />
                                                                        <EditableBlock
                                                                            id={block.id}
                                                                            html={block.content}
                                                                            onFocus={() => setFocusedBlockId(block.id)}
                                                                            onChange={val => updateBlockContent(block.id, val)}
                                                                            onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                            onMultiPaste={parts => handleMultiPaste(globalIndex, parts)}
                                                                            shouldFocus={false}
                                                                            className="flex-1 outline-none min-h-[1.5em]"
                                                                            style={{ color: block.color || '#2d342b', fontSize: block.fontSize || '18px' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {block.type === 'ORDERED_LIST' && (
                                                                    <div className="flex items-start gap-4 py-1">
                                                                        <span className="mt-1 text-lg font-bold min-w-[1.5em] text-black">
                                                                            {blocks.slice(0, globalIndex + 1).filter(b => b.type === 'ORDERED_LIST').length}.
                                                                        </span>
                                                                        <EditableBlock
                                                                            id={block.id}
                                                                            html={block.content}
                                                                            onFocus={() => setFocusedBlockId(block.id)}
                                                                            onChange={val => updateBlockContent(block.id, val)}
                                                                            onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                            onMultiPaste={parts => handleMultiPaste(globalIndex, parts)}
                                                                            shouldFocus={false}
                                                                            className="flex-1 outline-none min-h-[1.5em]"
                                                                            style={{ color: block.color || '#2d342b', fontSize: block.fontSize || '18px' }}
                                                                        />
                                                                    </div>
                                                                )}
                                                                {block.type === 'QUOTE' && (
                                                                    <div className="pl-6 border-l-4 border-[#adb4a8] py-2 my-4 italic text-[#5a6157]" style={{ fontSize: '20px' }}>
                                                                        <EditableBlock
                                                                            id={block.id}
                                                                            html={block.content}
                                                                            onFocus={() => setFocusedBlockId(block.id)}
                                                                            onChange={val => updateBlockContent(block.id, val)}
                                                                            onKeyDown={e => handleKeyDown(e, globalIndex, block)}
                                                                            onMultiPaste={parts => handleMultiPaste(globalIndex, parts)}
                                                                            shouldFocus={false}
                                                                            className="w-full outline-none"
                                                                        />
                                                                    </div>
                                                                )}
                                                                {block.type === 'CODE_BLOCK' && (
                                                                    <div className="bg-[#1e1e1e] rounded-md p-6 my-4 font-mono text-sm overflow-x-auto">
                                                                        <textarea
                                                                            value={block.content}
                                                                            onChange={e => { handleTextareaInput(e); updateBlockContent(block.id, e.target.value); }}
                                                                            onFocus={() => setFocusedBlockId(block.id)}
                                                                            className="w-full bg-transparent text-[#d4d4d4] outline-none resize-none border-none min-h-[60px]"
                                                                            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
                                                                            spellCheck={false}
                                                                        />
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
                                                                {block.type === 'DIVIDER' && (
                                                                    <div className="py-8 flex items-center">
                                                                        <div className="h-[2px] w-full bg-[#adb4a8]"></div>
                                                                    </div>
                                                                )}
                                                                {block.type === 'IMAGE' && (
                                                                    <div className="my-6 relative flex flex-col items-center">
                                                                        {isUploading[block.id] ? (
                                                                            <div className="h-48 flex items-center justify-center">
                                                                                <Loader2 className="animate-spin text-[#adb4a8]" size={32} />
                                                                            </div>
                                                                        ) : block.content ? (
                                                                            <img src={block.content} alt="Material" className="max-w-full rounded-md shadow-sm border border-[#adb4a8]" />
                                                                        ) : (
                                                                            <div className="w-full h-48 border-2 border-dashed border-[#adb4a8] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-[#f1f5eb] transition-colors"
                                                                                onClick={() => {
                                                                                    const input = document.createElement('input');
                                                                                    input.type = 'file';
                                                                                    input.accept = 'image/*';
                                                                                    input.onchange = async (e: any) => {
                                                                                        const file = e.target.files?.[0];
                                                                                        if (file) {
                                                                                            setIsUploading(prev => ({ ...prev, [block.id]: true }));
                                                                                            try { const url = await uploadToCloudinary(file); updateBlockContent(block.id, url); }
                                                                                            finally { setIsUploading(prev => ({ ...prev, [block.id]: false })); }
                                                                                        }
                                                                                    };
                                                                                    input.click();
                                                                                }}>
                                                                                <ImageIcon size={32} className="text-[#adb4a8] mb-2" />
                                                                                <span className="text-sm font-medium text-[#adb4a8]">Upload Image</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Delete button */}
                                                            <button onClick={() => removeBlock(block.id)}
                                                                className={`absolute -right-8 top-2 p-1 text-[#adb4a8] opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all`}
                                                                title="Delete Block">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </React.Fragment>
                                                );
                                            })}

                                            {/* Bottom click area to add block */}
                                            <div className="py-20 cursor-text" onClick={() => { if (blocks.length === 0 || blocks[blocks.length - 1].content !== '' || blocks[blocks.length - 1].type !== 'PARAGRAPH') addBlock(blocks.length, 'PARAGRAPH'); }}>
                                            </div>
                                </div>
                            </Suspense>
                        </div>
                    </div>
                </div>


            </main>

            <SyllabusInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} syllabusId={syllabusId} />

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
                                        // The handleSaveDraft function navigates to the edit page on success.
                                        // However, if we want to "Exit", we should probably go back instead.
                                        // Let's modify handleSaveDraft to take a 'shouldExit' flag or just do it here.
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

export default function NewMaterialPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NewMaterialPageInner />
        </Suspense>
    );
}
