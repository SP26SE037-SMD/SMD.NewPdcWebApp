"use client";

import React, { useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setSyllabusInfo } from '@/store/slices/syllabusSlice';
import { SyllabusService } from '@/services/syllabus.service';
import { SubjectService } from '@/services/subject.service';
import { SourceService } from '@/services/source.service';
import { CloPloService } from '@/services/cloplo.service';
import { useQuery } from '@tanstack/react-query';

export const BLOOM_LEVELS: Record<number, string> = {
    1: 'Remember',
    2: 'Understand',
    3: 'Apply',
    4: 'Analyze',
    5: 'Evaluate',
    6: 'Create',
};

export function formatBloomLevel(level: number | string | undefined): string {
    const num = Number(level);
    const name = BLOOM_LEVELS[num];
    return name ? `Level ${num}: ${name}` : String(level ?? 'Unknown');
}

export interface SyllabusContextInfo {
    bloomTaxonomy: string;
    sourcesReference: string[];
    clos: string[];
}

interface SyllabusInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    syllabusInfo?: SyllabusContextInfo;
    syllabusId?: string | null;
}

const C = {
    primary: "#41683f",
    primaryContainer: "#c1eeba",
    onPrimaryContainer: "#345a32",
    secondaryContainer: "#d5e8cf",
    onSecondaryContainer: "#465643",
    tertiaryContainer: "#f9fbb7",
    onTertiaryContainer: "#5e602c",
    surface: "#ffffff",
    surfaceContainerLowest: "#ffffff",
    surfaceContainerLow: "#ffffff",
    surfaceContainer: "#ebf0e5",
    surfaceContainerHigh: "#e4eade",
    surfaceVariant: "#dee5d8",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    outlineVariant: "#adb4a8",
    error: "#a73b21",
};

const BLOOM_LABELS_FULL: Record<number, string> = {
    1: 'LEVEL 1: REMEMBER',
    2: 'LEVEL 2: UNDERSTAND',
    3: 'LEVEL 3: APPLY',
    4: 'LEVEL 4: ANALYZE',
    5: 'LEVEL 5: EVALUATE',
    6: 'LEVEL 6: CREATE',
};

export function SyllabusInfoModal({ isOpen, onClose, syllabusInfo: overrideInfo, syllabusId }: SyllabusInfoModalProps) {
    const dispatch = useDispatch<AppDispatch>();

    const { data: syllabusRes, isLoading: isSyllabusLoading } = useQuery({
        queryKey: ['syllabus-info-modal', syllabusId],
        queryFn: () => SyllabusService.getSyllabusById(syllabusId || ""),
        enabled: !!syllabusId && isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const syllabusData = syllabusRes?.data;
    const subjectId = syllabusData?.subjectId;

    const { data: subjectRes, isLoading: isSubjectLoading } = useQuery({
        queryKey: ['subject-detail-modal', subjectId],
        queryFn: () => SubjectService.getSubjectById(subjectId || ""),
        enabled: !!subjectId && isOpen,
        staleTime: 5 * 60 * 1000,
    });

    const subjectData = subjectRes?.data;
    
    const syllabusInfoDB = useSelector((state: RootState) => state.syllabus.syllabusInfoDB);
    const reduxInfo = syllabusId ? syllabusInfoDB[syllabusId] : undefined;

    useEffect(() => {
        if (!isOpen || !syllabusId || reduxInfo) return;

        const fetchInfo = async () => {
            try {
                const res = await SyllabusService.getSyllabusById(syllabusId);
                const data = res.data;
                const minBloomLevel = data?.minBloomLevel;
                const bloomText = formatBloomLevel(minBloomLevel);
                const subjId = data?.subjectId;

                if (!subjId) {
                    dispatch(setSyllabusInfo({
                        syllabusId,
                        info: { bloomTaxonomy: bloomText, sourcesReference: [], clos: [] }
                    }));
                    return;
                }

                const [sourcesResult, closResult] = await Promise.allSettled([
                    SourceService.getSubjectSources(subjId),
                    CloPloService.getSubjectClos(subjId, 0, 100)
                ]);

                let sourcesReference: string[] = [];
                if (sourcesResult.status === 'fulfilled' && (sourcesResult.value as any)?.data) {
                    const sourcesData = (sourcesResult.value as any).data;
                    sourcesReference = (sourcesData || []).map((s: any) =>
                        `${s.author ? s.author + '. ' : ''}${s.sourceName}${s.publisher ? ' - ' + s.publisher : ''}${s.publishedYear ? ' (' + s.publishedYear + ')' : ''}`
                    );
                }

                let closText: string[] = [];
                if (closResult.status === 'fulfilled' && (closResult.value as any)?.data?.content) {
                    const closData = (closResult.value as any).data.content;
                    closText = closData.map((c: any) => `[${c.cloCode}] ${c.description}`);
                }

                dispatch(setSyllabusInfo({
                    syllabusId,
                    info: {
                        bloomTaxonomy: bloomText,
                        sourcesReference: sourcesReference.length > 0 ? sourcesReference : ["No references available."],
                        clos: closText.length > 0 ? closText : ["No CLOs available."]
                    }
                }));

            } catch (err) {
                console.error("Failed to fetch syllabus context information for modal:", err);
            }
        };

        fetchInfo();
    }, [syllabusId, reduxInfo, isOpen, dispatch]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; }
    }, [isOpen]);

    if (!isOpen) return null;

    const displayInfo = overrideInfo || reduxInfo || {
        bloomTaxonomy: "Loading...",
        sourcesReference: ["Loading..."],
        clos: ["Loading..."]
    };

    const activeBloomNum = subjectData?.minBloomLevel ?? syllabusData?.minBloomLevel;
    const bloomLabel = activeBloomNum && BLOOM_LABELS_FULL[activeBloomNum]
        ? BLOOM_LABELS_FULL[activeBloomNum]
        : (displayInfo.bloomTaxonomy || 'Loading...');

    const bloomNum = activeBloomNum ?? parseInt(displayInfo.bloomTaxonomy?.match(/\d+/)?.[0] || '0');

    const half = Math.ceil((displayInfo.sourcesReference?.length || 0) / 2);
    const sourcesCol1 = (displayInfo.sourcesReference || []).slice(0, half);
    const sourcesCol2 = (displayInfo.sourcesReference || []).slice(half);

    const CLO_COLORS = [
        { bg: C.secondaryContainer, text: C.onSecondaryContainer },
        { bg: C.tertiaryContainer, text: C.onTertiaryContainer },
        { bg: C.primaryContainer, text: C.onPrimaryContainer },
    ];

    const isLoadingData = isSyllabusLoading || (!!subjectId && isSubjectLoading);

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-6 font-sans">
            <div 
                className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            ></div>
            
            <div className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header Area */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-zinc-100 bg-[#f8faf2] shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg shadow-green-200">
                            <span className="material-symbols-outlined text-2xl">info</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-[#2d342b]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Syllabus Information
                            </h2>
                            <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-0.5">Contextual reference for development</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white border border-zinc-200 text-zinc-400 hover:bg-rose-50 hover:text-rose-500 transition-all hover:rotate-90 shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white">
                    {isLoadingData ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 text-zinc-400">
                            <Activity className="animate-pulse" size={48} />
                            <p className="text-sm font-bold tracking-tight">Synchronizing syllabus data...</p>
                        </div>
                    ) : !syllabusId ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ background: C.surfaceContainer }}>
                                <span className="material-symbols-outlined text-3xl" style={{ color: C.onSurfaceVariant }}>info</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2" style={{ color: C.onSurface }}>No Syllabus Information</h3>
                            <p style={{ color: C.onSurfaceVariant }} className="max-w-sm">
                                The syllabus details are not explicitly linked or could not be loaded.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-7">
                            {/* ── Bento Grid ── */}
                            <div className="grid grid-cols-12 gap-5">

                                {/* Bloom's Taxonomy */}
                                <section className="col-span-12 lg:col-span-4 rounded-xl p-5 flex flex-col justify-between"
                                    style={{ background: `${C.primaryContainer}4d`, borderLeft: `4px solid ${C.primary}` }}>
                                    <div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.primary }}>Bloom Minimum</span>
                                        <h3 className="text-xl font-extrabold mt-0.5" style={{ color: C.onPrimaryContainer, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            {bloomLabel || 'Loading...'}
                                        </h3>
                                        <p className="mt-2 leading-relaxed italic text-[11px]" style={{ color: C.onSurfaceVariant }}>
                                            Students will synthesize complex theories and justify decisions based on academic criteria and established standards.
                                        </p>
                                    </div>
                                    <div className="mt-5 flex gap-2">
                                        {[1, 2, 3, 4, 5, 6].map(lvl => (
                                            <span key={lvl} className="h-1 flex-1 rounded-full transition-colors duration-500"
                                                style={{ background: lvl <= bloomNum ? C.primary : C.surfaceVariant }} />
                                        ))}
                                    </div>
                                </section>

                                {/* Sources Reference */}
                                <section className="col-span-12 lg:col-span-8 rounded-xl p-5"
                                    style={{ background: C.surfaceContainerLowest, border: `1px solid ${C.outlineVariant}33` }}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="material-symbols-outlined text-xl" style={{ color: C.primary }}>library_books</span>
                                        <h3 className="text-base font-bold" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Sources Reference</h3>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-x-6 gap-y-2">
                                        {[sourcesCol1, sourcesCol2].map((col, ci) => (
                                            <ol key={ci} className="space-y-2">
                                                {col.map((ref, idx) => {
                                                    const num = ci === 0 ? idx + 1 : half + idx + 1;
                                                    const yearMatch = ref.match(/\((\d{4})\)/);
                                                    const year = yearMatch ? yearMatch[0] : '';
                                                    const title = ref.replace(/\(\d{4}\)/, '').trim().replace(/\.$/, '').trim();
                                                    return (
                                                        <li key={idx} className="flex items-start gap-2.5">
                                                            <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 mt-0.5"
                                                                style={{ background: C.surfaceContainer, color: C.primary }}>
                                                                {num}
                                                            </span>
                                                            <div className="text-[10.5px] leading-snug">
                                                                <span className="font-bold" style={{ color: C.onSurface }}>{title}</span>
                                                                {year && <span className="ml-1.5 opacity-60" style={{ color: C.onSurfaceVariant }}>{year}</span>}
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ol>
                                        ))}
                                    </div>
                                </section>
                            </div>

                            {/* ── Syllabus Meta Info ── */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    {
                                        icon: 'school',
                                        label: 'Credits',
                                        value: `${subjectData?.credits ?? syllabusData?.credit ?? syllabusData?.noCredit ?? 0} Credits`,
                                    },
                                    {
                                        icon: 'grade',
                                        label: 'Scoring Scale',
                                        value: `${subjectData?.scoringScale ?? (syllabusData?.scoringScale || 10)} / 10`,
                                    },
                                    {
                                        icon: 'check_circle',
                                        label: 'Min. Pass Score',
                                        value: `${subjectData?.minToPass ?? syllabusData?.minAvgGrade ?? syllabusData?.minAvgMarkToPass ?? 0} Points`,
                                    },
                                    {
                                        icon: 'policy',
                                        label: 'Decision Level',
                                        value: subjectData?.decisionNo ? `Decision: ${subjectData.decisionNo}` : `Level ${syllabusData?.decisionLevel || 1}`,
                                        highlight: true,
                                    },
                                ].map((item) => (
                                    <div key={item.label}
                                        className="rounded-xl p-4 flex items-center gap-3 border-2"
                                        style={{
                                            background: item.highlight ? `${C.primaryContainer}4d` : C.surfaceContainerLowest,
                                            borderColor: item.highlight ? `${C.primary}33` : `${C.outlineVariant}33`,
                                        }}>
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                                            style={{ background: item.highlight ? C.primaryContainer : C.surfaceContainer }}>
                                            <span className="material-symbols-outlined text-xl" style={{ color: C.primary }}>
                                                {item.icon}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
                                                style={{ color: C.onSurfaceVariant }}>{item.label}</p>
                                            <p className="text-sm font-extrabold"
                                                style={{ color: item.highlight ? C.primary : C.onSurface }}>
                                                {item.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ── Course Learning Outcomes ── */}
                            <section className="rounded-xl overflow-hidden shadow-sm" style={{ background: C.surfaceContainerLow, border: `1px solid ${C.outlineVariant}33` }}>
                                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${C.outlineVariant}1a` }}>
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-lg" style={{ color: C.primary }}>target</span>
                                        <h3 className="text-lg font-bold" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            Course Learning Outcomes (CLOs)
                                        </h3>
                                    </div>
                                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: C.onSurfaceVariant }}>
                                        {displayInfo.clos.length} Outcomes defined
                                    </span>
                                </div>

                                <div className="max-h-[300px] overflow-y-auto custom-scrollbar" style={{ borderTop: 'none' }}>
                                    {displayInfo.clos.map((clo, idx) => {
                                        const codeMatch = clo.match(/^\[([^\]]+)\]/);
                                        const code = codeMatch ? codeMatch[1] : `CLO${idx + 1}`;
                                        const description = clo.replace(/^\[[^\]]+\]\s*/, '');
                                        const colorStyle = CLO_COLORS[idx % CLO_COLORS.length];
                                        return (
                                            <div key={idx}
                                                className="px-6 py-4 flex gap-5 items-start group transition-colors"
                                                style={{ borderBottom: `1px solid ${C.outlineVariant}22` }}
                                                onMouseEnter={e => (e.currentTarget.style.background = C.surfaceContainer)}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div className="shrink-0 mt-0.5">
                                                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[9px] font-bold tracking-tight uppercase"
                                                        style={{ background: colorStyle.bg, color: colorStyle.text }}>
                                                        {code}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-sm" style={{ color: C.primary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                                        {code}
                                                    </h4>
                                                    <p className="mt-0.5 max-w-4xl leading-relaxed text-[11.5px]" style={{ color: C.onSurfaceVariant }}>
                                                        {description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* Footer Area */}
                <div className="p-5 sm:p-6 bg-zinc-50 border-t border-zinc-100 flex justify-end shrink-0">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-[#2d342b] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                        Done Reviewing
                    </button>
                </div>
            </div>
        </div>
    );
}
