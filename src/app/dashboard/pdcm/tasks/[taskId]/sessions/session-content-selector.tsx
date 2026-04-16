import React, { useState, useEffect, useRef } from 'react';
import { MaterialItem } from '@/services/material.service';
import { BlockItem, BlockService } from '@/services/block.service';
import { ChevronDown, ChevronRight, Check, X, FileText, LayoutGrid, Loader2 } from 'lucide-react';

interface SelectionState {
    materialId: string;
    materialTitle: string;
    blockIds: string[];
    blockNames?: string[];
}

interface SessionContentSelectorProps {
    materials: MaterialItem[];
    value: string; // the JSON string
    onChange: (newValue: string) => void;
}

export function SessionContentSelector({ materials, value, onChange }: SessionContentSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selections, setSelections] = useState<SelectionState[]>([]);

    // Cache memory for blocks to avoid refetching everywhere
    const [expandedMaterials, setExpandedMaterials] = useState<Set<string>>(new Set());
    const [blocksCache, setBlocksCache] = useState<Record<string, BlockItem[]>>({});
    const [loadingMaterials, setLoadingMaterials] = useState<Set<string>>(new Set());

    const popoverRef = useRef<HTMLDivElement>(null);

    // Initialize state from JSON string
    useEffect(() => {
        if (!value) {
            setSelections([]);
            return;
        }

        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                setSelections(parsed);
            } else {
                setSelections([]);
            }
        } catch (e) {
            // Legacy text fallback (do not crash)
            setSelections([]);
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchBlocksForMaterial = async (materialId: string) => {
        if (!materialId || materialId === 'undefined' || blocksCache[materialId] || loadingMaterials.has(materialId)) return;

        setLoadingMaterials(prev => new Set(prev).add(materialId));
        try {
            const res = await BlockService.getBlocksByMaterialIdAndType(materialId, 'H2');
            setBlocksCache(prev => ({ ...prev, [materialId]: res.data || [] }));
        } catch (error) {
            // Silently cache empty to avoid infinite loop and reduce console noise
            console.warn('Blocks not found or API error for material:', materialId);
            setBlocksCache(prev => ({ ...prev, [materialId]: [] })); 
        } finally {
            setLoadingMaterials(prev => {
                const next = new Set(prev);
                next.delete(materialId);
                return next;
            });
        }
    };

    const toggleMaterialExpansion = (materialId: string) => {
        const next = new Set(expandedMaterials);
        if (next.has(materialId)) {
            next.delete(materialId);
        } else {
            next.add(materialId);
            fetchBlocksForMaterial(materialId);
        }
        setExpandedMaterials(next);
    };

    const handleBlockToggle = (materialId: string, blockId: string) => {
        const currentSelections = [...selections];
        const materialIndex = currentSelections.findIndex(s => s.materialId === materialId);
        const material = materials.find(m => m.materialId === materialId);
        const block = blocksCache[materialId]?.find(b => b.blockId === blockId);
        
        const blockName = (block as any)?.blockName || block?.contentText || 'Unnamed Block';

        if (materialIndex !== -1) {
            const materialSelection = { ...currentSelections[materialIndex] };
            if (materialSelection.blockIds.includes(blockId)) {
                // Remove block
                const idx = materialSelection.blockIds.indexOf(blockId);
                materialSelection.blockIds = materialSelection.blockIds.filter(id => id !== blockId);
                if (materialSelection.blockNames) {
                    materialSelection.blockNames = materialSelection.blockNames.filter((_, i) => i !== idx);
                }
                
                if (materialSelection.blockIds.length === 0) {
                    currentSelections.splice(materialIndex, 1);
                } else {
                    currentSelections[materialIndex] = materialSelection;
                }
            } else {
                // Add block
                materialSelection.blockIds.push(blockId);
                if (!materialSelection.blockNames) materialSelection.blockNames = [];
                materialSelection.blockNames.push(blockName);
                currentSelections[materialIndex] = materialSelection;
            }
        } else {
            // Add new material & block
            currentSelections.push({
                materialId,
                materialTitle: material?.title || 'Unknown Material',
                blockIds: [blockId],
                blockNames: [blockName]
            });
        }

        onChange(JSON.stringify(currentSelections));
    };

    const handleMaterialToggle = (materialId: string, blocks: BlockItem[]) => {
        const currentSelections = [...selections];
        const materialIndex = currentSelections.findIndex(s => s.materialId === materialId);
        const material = materials.find(m => m.materialId === materialId);

        if (materialIndex !== -1) {
            // Remove all
            currentSelections.splice(materialIndex, 1);
        } else {
            // Select all H2 blocks of this material
            const blockNames = blocks.map(b => (b as any).blockName || b.contentText || 'Unnamed Block');
            
            if (blocks && blocks.length > 0) {
                currentSelections.push({
                    materialId,
                    materialTitle: material?.title || 'Unknown Material',
                    blockIds: blocks.map(b => b.blockId),
                    blockNames: blockNames
                });
            } else {
                currentSelections.push({
                    materialId,
                    materialTitle: material?.title || 'Unknown Material',
                    blockIds: [],
                    blockNames: []
                });
            }
        }

        onChange(JSON.stringify(currentSelections));
    };

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const isMaterialFullySelected = (materialId: string, blocks: BlockItem[]) => {
        const sel = selections.find(s => s.materialId === materialId);
        if (!sel) return false;
        if (!blocks || blocks.length === 0) return true; // If selected and no blocks, it's fully selected
        return sel.blockIds.length === blocks.length;
    };

    const isMaterialPartiallySelected = (materialId: string, blocks: BlockItem[]) => {
        const sel = selections.find(s => s.materialId === materialId);
        if (!sel || !blocks || blocks.length === 0) return false;
        return sel.blockIds.length > 0 && sel.blockIds.length < blocks.length;
    };

    // Calculate display summary
    const totalMaterialsSelected = selections.length;
    const totalBlocksSelected = selections.reduce((acc, curr) => acc + curr.blockIds.length, 0);

    let displayValue = "Select Content...";

    // Legacy fallback detection
    const isLegacyText = value && typeof value === 'string' && !value.startsWith('[');

    if (isLegacyText) {
        displayValue = value.length > 30 ? value.substring(0, 30) + '...' : value;
    } else if (totalMaterialsSelected > 0) {
        const firstMaterial = selections[0]?.materialTitle || 'Selected Items';
        if (totalMaterialsSelected === 1) {
            displayValue = `${firstMaterial} (${totalBlocksSelected} blocks)`;
        } else {
            displayValue = `${firstMaterial} + ${totalMaterialsSelected - 1} more`;
        }
    }

    return (
        <div className="relative" ref={popoverRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-2.5 bg-white border border-zinc-200 hover:border-zinc-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-left flex items-center justify-between cursor-pointer min-h-[44px] ${selections.length > 0 ? 'text-primary-700 font-semibold' : 'text-zinc-500'
                    }`}
            >
                <div className="flex truncate mr-2 items-center gap-2">
                    {selections.length > 0 ? <LayoutGrid size={16} className="text-primary-500 shrink-0" /> : <FileText size={16} className="text-zinc-400 shrink-0" />}
                    <span className="truncate">{displayValue}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    {(selections.length > 0 || isLegacyText) && (
                        <button
                            onClick={clearSelection}
                            className="p-1 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-rose-500 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown size={16} className={`text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1.5 w-[320px] bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-zinc-200 overflow-hidden backdrop-blur-xl">
                    <div className="p-3 bg-zinc-50 border-b border-zinc-100 pb-2">
                        <h4 className="font-bold text-xs text-zinc-500 uppercase tracking-widest mb-1">Select Materials & Blocks</h4>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                        {materials.length === 0 ? (
                            <div className="p-4 text-center text-zinc-400 text-sm">
                                No DRAFT materials available in this syllabus.
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1">
                                {materials.map(material => {
                                    const blocks = blocksCache[material.materialId] || [];
                                    const isExpanded = expandedMaterials.has(material.materialId);
                                    const isLoading = loadingMaterials.has(material.materialId);
                                    const isSelected = isMaterialFullySelected(material.materialId, blocks);
                                    const isPartial = isMaterialPartiallySelected(material.materialId, blocks);

                                    return (
                                        <div key={material.materialId} className="flex flex-col border border-transparent hover:border-zinc-100 rounded-lg transition-colors overflow-hidden">
                                            {/* Material Row */}
                                            <div className="flex items-center p-2 rounded-lg hover:bg-zinc-50/80 cursor-pointer group">
                                                <button
                                                    onClick={() => toggleMaterialExpansion(material.materialId)}
                                                    className="w-6 h-6 flex items-center justify-center shrink-0 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-200"
                                                >
                                                    {isLoading ? (
                                                        <Loader2 size={14} className="animate-spin text-primary-500" />
                                                    ) : (
                                                        isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                                    )}
                                                </button>

                                                <div
                                                    className="flex-1 flex items-center gap-2 px-2 overflow-hidden"
                                                    onClick={() => toggleMaterialExpansion(material.materialId)}
                                                >
                                                    <span className="text-sm font-semibold text-zinc-700 truncate">{material.title}</span>
                                                </div>

                                                <div
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent toggling expansion
                                                        // Ensure blocks are loaded before selecting all
                                                        if (!blocksCache[material.materialId]) {
                                                            fetchBlocksForMaterial(material.materialId).then(() => {
                                                                handleMaterialToggle(material.materialId, blocksCache[material.materialId] || []);
                                                            });
                                                        } else {
                                                            handleMaterialToggle(material.materialId, blocks);
                                                        }
                                                    }}
                                                    className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all shrink-0 ml-2 cursor-pointer hover:scale-105 active:scale-95
                                                        ${isSelected ? 'bg-primary-500 border-primary-500 text-white shadow-sm shadow-primary-200' :
                                                            isPartial ? 'bg-primary-100 border-primary-500 text-primary-600' :
                                                                'bg-white border-zinc-300 hover:border-primary-400'}
                                                    `}
                                                >
                                                    {isSelected && <Check size={14} strokeWidth={3} />}
                                                    {isPartial && <div className="w-2.5 h-0.5 bg-primary-600 rounded-full" />}
                                                </div>
                                            </div>

                                            {/* Blocks Sub-list */}
                                            {isExpanded && (
                                                <div className="pl-8 pr-2 pb-2 flex flex-col gap-0.5">
                                                    {blocks.length === 0 && !isLoading && (
                                                        <span className="text-xs text-zinc-400 py-1 italic">No H2 blocks found.</span>
                                                    )}
                                                    {blocks.map(block => {
                                                        const isBlockSelected = selections.find(s => s.materialId === material.materialId)?.blockIds.includes(block.blockId) || false;
                                                        return (
                                                            <div
                                                                key={block.blockId}
                                                                onClick={() => handleBlockToggle(material.materialId, block.blockId)}
                                                                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-primary-50 cursor-pointer group/block"
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors shrink-0
                                                                    ${isBlockSelected ? 'bg-primary-500 border-primary-500 text-white' : 'bg-white border-zinc-300 group-hover/block:border-primary-400'}
                                                                `}>
                                                                    {isBlockSelected && <Check size={10} strokeWidth={3} />}
                                                                </div>
                                                                <span 
                                                                    className={`text-xs truncate ${isBlockSelected ? 'text-primary-700 font-semibold' : 'text-zinc-600'}`}
                                                                    dangerouslySetInnerHTML={{ __html: (block as any).blockName || block.contentText }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
