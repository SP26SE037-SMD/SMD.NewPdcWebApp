"use client";

import React, { useState } from 'react';
import { MaterialItem } from '@/services/material.service';
import { BlockService } from '@/services/block.service';
import { useQuery } from '@tanstack/react-query';
import { Plus, Minus, Edit2, ChevronDown, ChevronRight } from 'lucide-react';

const C = {
    primary: "#41683f",
    primaryDim: "#355c34",
    primaryContainer: "#c1eeba",
    onPrimaryContainer: "#345a32",
    surface: "#f8faf2",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    outlineVariant: "#adb4a8",
};

interface DiffMaterialsProps {
    materials: { item: MaterialItem | null, pairedItem?: MaterialItem | null, status: string }[];
    syllabusId: string;
    viewMode: 'list' | 'grid';
    isOldSide?: boolean;
    onMaterialClick?: (oldId?: string, newId?: string, title?: string) => void;
}

export function DiffMaterials({ materials, syllabusId, viewMode, isOldSide = true, onMaterialClick }: DiffMaterialsProps) {
    if (materials.length === 0) {
        return (
            <div className="text-center py-12 rounded-[32px] bg-white transition-all hover:shadow-sm" style={{ border: `2px dashed ${C.outlineVariant}40` }}>
                <div className="p-4 rounded-full w-fit mx-auto mb-3" style={{ background: `${C.primaryContainer}4d` }}>
                    <span className="material-symbols-outlined text-[32px]" style={{ color: C.primary }}>auto_stories</span>
                </div>
                <h3 className="text-base font-bold mb-1" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>No Materials Found</h3>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="bg-white rounded-[24px] border border-[#dee1d8]/40 shadow-sm animate-in fade-in duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-zinc-100" style={{ background: `${C.primary}04` }}>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-400 w-10 text-center">Stt</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500">Name</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500">Type</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-zinc-500 text-right pr-6">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                            {materials.map((m, idx) => {
                                if (!m.item) {
                                    return (
                                        <tr key={idx} className="h-[73px] bg-zinc-50/30">
                                            <td colSpan={4} className="text-center text-xs text-zinc-300 border-2 border-dashed border-zinc-100 bg-zinc-50/50 m-2 rounded-xl">Empty Space</td>
                                        </tr>
                                    );
                                }
                                
                                const material = m.item;
                                const isAdded = m.status === 'ADDED';
                                const isRemoved = m.status === 'REMOVED';
                                const isModified = m.status === 'MODIFIED';
                                
                                let bgClass = "hover:bg-zinc-50/50 cursor-pointer";
                                if (isAdded) bgClass = "bg-emerald-50/40 hover:bg-emerald-50/70 cursor-pointer";
                                if (isRemoved) bgClass = "bg-rose-50/40 hover:bg-rose-50/70 cursor-pointer";
                                if (isModified) bgClass = "bg-amber-50/40 hover:bg-amber-50/70 cursor-pointer";

                                return (
                                    <tr 
                                        key={idx} 
                                        className={`${bgClass} transition-colors group`}
                                        onClick={() => {
                                            if (onMaterialClick) {
                                                const oldId = isOldSide ? m.item?.materialId : m.pairedItem?.materialId;
                                                const newId = isOldSide ? m.pairedItem?.materialId : m.item?.materialId;
                                                const title = m.item?.title;
                                                onMaterialClick(oldId, newId, title);
                                            }
                                        }}
                                    >
                                        <td className="px-4 py-3 text-xs font-bold text-zinc-400 text-center">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: isAdded ? '#d1fae5' : isRemoved ? '#ffe4e6' : isModified ? '#fef3c7' : `${C.primary}12`, color: isAdded ? '#059669' : isRemoved ? '#e11d48' : isModified ? '#d97706' : C.primary }}>
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {material.materialType === 'PDF' ? 'picture_as_pdf' : material.materialType === 'VIDEO' ? 'smart_display' : 'description'}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className={`text-sm font-extrabold truncate max-w-[200px] ${isRemoved ? 'line-through decoration-rose-300 text-rose-900' : isAdded ? 'text-emerald-900' : isModified ? 'text-amber-900' : 'text-[#2d342b]'}`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                        {material.title}
                                                    </h4>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide border ${isAdded ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : isRemoved ? 'bg-rose-100 text-rose-700 border-rose-200' : isModified ? 'bg-amber-100 text-amber-700 border-amber-200' : ''}`} style={(!isAdded && !isRemoved && !isModified) ? { background: `${C.primary}08`, color: C.primary, borderColor: `${C.primary}20` } : {}}>
                                                {material.materialType || 'Document'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right pr-6">
                                            {isAdded && <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Plus size={12}/> Added</span>}
                                            {isRemoved && <span className="px-2 py-1 rounded bg-rose-100 text-rose-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Minus size={12}/> Removed</span>}
                                            {isModified && <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 text-[10px] font-black uppercase inline-flex items-center gap-1"><Edit2 size={12}/> Modified</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    // Grid View
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-300">
            {materials.map((m, idx) => {
                if (!m.item) {
                    return (
                        <div key={idx} className="h-[148px] border-2 border-dashed border-zinc-200 rounded-[24px] bg-zinc-50/50 flex items-center justify-center text-sm text-zinc-400 font-medium">
                            Empty
                        </div>
                    );
                }

                const material = m.item;
                const isAdded = m.status === 'ADDED';
                const isRemoved = m.status === 'REMOVED';
                const isModified = m.status === 'MODIFIED';
                
                let borderStyle = `1px solid ${C.outlineVariant}33`;
                let bgStyle = "bg-white cursor-pointer";
                
                if (isAdded) {
                    borderStyle = `1px solid #34d399`; // emerald-400
                    bgStyle = "bg-emerald-50/30 hover:bg-emerald-50/50 cursor-pointer";
                } else if (isRemoved) {
                    borderStyle = `1px solid #fb7185`; // rose-400
                    bgStyle = "bg-rose-50/30 hover:bg-rose-50/50 cursor-pointer";
                } else if (isModified) {
                    borderStyle = `1px solid #fbbf24`; // amber-400
                    bgStyle = "bg-amber-50/30 hover:bg-amber-50/50 cursor-pointer";
                }

                return (
                    <div key={idx}
                        className={`relative rounded-[24px] p-5 group transition-all duration-300 hover:shadow-md ${bgStyle}`}
                        style={{ border: borderStyle }}
                        onClick={() => {
                            if (onMaterialClick) {
                                const oldId = isOldSide ? m.item?.materialId : m.pairedItem?.materialId;
                                const newId = isOldSide ? m.pairedItem?.materialId : m.item?.materialId;
                                const title = m.item?.title;
                                onMaterialClick(oldId, newId, title);
                            }
                        }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: isAdded ? '#d1fae5' : isRemoved ? '#ffe4e6' : isModified ? '#fef3c7' : `${C.primary}1a`, color: isAdded ? '#059669' : isRemoved ? '#e11d48' : isModified ? '#d97706' : C.primary }}>
                                    <span className="material-symbols-outlined text-[20px]">
                                        {material.materialType === 'PDF' ? 'picture_as_pdf' : material.materialType === 'VIDEO' ? 'smart_display' : 'description'}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: isAdded ? '#059669' : isRemoved ? '#e11d48' : isModified ? '#d97706' : C.primary }}>
                                        {material.materialType || 'Document'}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5 text-[9px] font-semibold text-zinc-500">
                                        <span className="material-symbols-outlined text-[10px]">schedule</span>
                                        <span>{new Date(material.uploadedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h3 className={`text-[15px] font-extrabold mb-4 line-clamp-2 leading-snug ${isRemoved ? 'line-through decoration-rose-300 text-rose-900' : isAdded ? 'text-emerald-900' : isModified ? 'text-amber-900' : 'text-[#2d342b]'}`} style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {material.title}
                        </h3>
                        
                        <div className="absolute top-4 right-4 flex items-center gap-1">
                            {isAdded && <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase flex items-center gap-1"><Plus size={10}/> Added</span>}
                            {isRemoved && <span className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 text-[9px] font-black uppercase flex items-center gap-1"><Minus size={10}/> Removed</span>}
                            {isModified && <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 text-[9px] font-black uppercase flex items-center gap-1"><Edit2 size={10}/> Modified</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
