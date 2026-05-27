import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BlockService } from '@/services/block.service';
import { X, Plus, Minus, Edit2 } from 'lucide-react';

interface MaterialTextCompareModalProps {
    oldId?: string;
    newId?: string;
    title: string;
    onClose: () => void;
}

export function MaterialTextCompareModal({ oldId, newId, title, onClose }: MaterialTextCompareModalProps) {
    const { data: oldBlocksRes, isLoading: oldLoading } = useQuery({
        queryKey: ['blocks', oldId],
        queryFn: () => oldId ? BlockService.getBlocksByMaterialId(oldId, 1, 1000) : Promise.resolve(null),
        enabled: !!oldId
    });
    
    const { data: newBlocksRes, isLoading: newLoading } = useQuery({
        queryKey: ['blocks', newId],
        queryFn: () => newId ? BlockService.getBlocksByMaterialId(newId, 1, 1000) : Promise.resolve(null),
        enabled: !!newId
    });

    const isLoading = oldLoading || newLoading;
    const oldBlocks = oldBlocksRes?.data?.content || [];
    const newBlocks = newBlocksRes?.data?.content || [];

    const maxIdx = Math.max(
        ...oldBlocks.map(b => b.idx),
        ...newBlocks.map(b => b.idx),
        -1
    );

    const pairs = [];
    for (let i = 0; i <= maxIdx; i++) {
        const oldB = oldBlocks.find(b => b.idx === i);
        const newB = newBlocks.find(b => b.idx === i);
        if (oldB || newB) {
            pairs.push({ old: oldB, new: newB });
        }
    }

    return (
        <div className="fixed inset-0 z-[60] flex justify-center items-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[1200px] h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Material Text Comparison
                        </h2>
                        <p className="text-sm font-semibold text-slate-500 mt-1">{title}</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="grid grid-cols-2 bg-slate-100/50 border-b border-slate-200">
                        <div className="px-8 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200">
                            Old Version
                        </div>
                        <div className="px-8 py-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
                            New Version
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : pairs.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                                No blocks found for this material.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {pairs.map((pair, idx) => {
                                    const isAdded = !pair.old && pair.new;
                                    const isRemoved = pair.old && !pair.new;
                                    const isModified = pair.old && pair.new && (pair.old.contentText !== pair.new.contentText || pair.old.blockType !== pair.new.blockType);

                                    return (
                                        <div key={idx} className="grid grid-cols-2 gap-8 relative group">
                                            {/* Old Block */}
                                            <div className={`p-5 rounded-2xl border ${!pair.old ? 'bg-zinc-50/50 border-dashed border-zinc-200' : isRemoved ? 'bg-rose-50 border-rose-200' : isModified ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                {pair.old ? (
                                                    <>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                Block {pair.old.idx} <span className="opacity-50 mx-1">•</span> {pair.old.blockType || pair.old.blockStyle}
                                                            </span>
                                                            {isRemoved && <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-700 px-2 py-1 rounded-md inline-flex items-center gap-1"><Minus size={10}/> Removed</span>}
                                                            {isModified && <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-md inline-flex items-center gap-1"><Edit2 size={10}/> Modified</span>}
                                                        </div>
                                                        <div 
                                                            className={`text-sm font-medium whitespace-pre-wrap break-words ${isRemoved ? 'text-rose-900 line-through decoration-rose-300' : 'text-slate-700'}`}
                                                            dangerouslySetInnerHTML={{ __html: pair.old.contentText }} 
                                                        />
                                                    </>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-medium">Empty Space</div>
                                                )}
                                            </div>

                                            {/* New Block */}
                                            <div className={`p-5 rounded-2xl border ${!pair.new ? 'bg-zinc-50/50 border-dashed border-zinc-200' : isAdded ? 'bg-emerald-50 border-emerald-200' : isModified ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                                                {pair.new ? (
                                                    <>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                                Block {pair.new.idx} <span className="opacity-50 mx-1">•</span> {pair.new.blockType || pair.new.blockStyle}
                                                            </span>
                                                            {isAdded && <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md inline-flex items-center gap-1"><Plus size={10}/> Added</span>}
                                                            {isModified && <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-md inline-flex items-center gap-1"><Edit2 size={10}/> Modified</span>}
                                                        </div>
                                                        <div 
                                                            className={`text-sm font-medium whitespace-pre-wrap break-words ${isAdded ? 'text-emerald-900' : 'text-slate-700'}`}
                                                            dangerouslySetInnerHTML={{ __html: pair.new.contentText }} 
                                                        />
                                                    </>
                                                ) : (
                                                    <div className="h-full flex items-center justify-center text-xs text-zinc-400 font-medium">Empty Space</div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
