"use client";

import React, { use, useEffect } from 'react';
import { TaskService } from '@/services/task.service';
import { SyllabusService } from '@/services/syllabus.service';
import { SubjectService } from '@/services/subject.service';
import { SourceService } from '@/services/source.service';
import { CloPloService } from '@/services/cloplo.service';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import { setSyllabusInfo } from '@/store/slices/syllabusSlice';
import { formatBloomLevel } from '@/components/dashboard/SyllabusInfoModal';
import { useQuery } from '@tanstack/react-query';

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

const BLOOM_LABELS: Record<number, string> = {
    1: 'LEVEL 1: REMEMBER',
    2: 'LEVEL 2: UNDERSTAND',
    3: 'LEVEL 3: APPLY',
    4: 'LEVEL 4: ANALYZE',
    5: 'LEVEL 5: EVALUATE',
    6: 'LEVEL 6: CREATE',
};

export default function InformationPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const dispatch = useDispatch<AppDispatch>();

    // Fetch Task Data
    const { data: routeTaskData, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId,
        staleTime: 5 * 60 * 1000,
    });

    const realTask = routeTaskData?.data;
    const syllabusId = realTask?.syllabus?.syllabusId || realTask?.syllabusId;

    // Fetch Syllabus Data
    const { data: syllabusRes, isLoading: isSyllabusLoading } = useQuery({
        queryKey: ['pdcm-syllabus-info', syllabusId],
        queryFn: () => SyllabusService.getSyllabusById(syllabusId || ""),
        enabled: !!syllabusId,
        staleTime: 5 * 60 * 1000,
    });

    const syllabusData = syllabusRes?.data;
    const subjectId = syllabusData?.subjectId;

    // Fetch Subject Data (for Bloom and Meta Info)
    const { data: subjectRes, isLoading: isSubjectLoading } = useQuery({
        queryKey: ['pdcm-subject-detail', subjectId],
        queryFn: () => SubjectService.getSubjectById(subjectId || ""),
        enabled: !!subjectId,
        staleTime: 5 * 60 * 1000,
    });

    const subjectData = subjectRes?.data;
    const syllabusInfoDB = useSelector((state: RootState) => state.syllabus.syllabusInfoDB);
    const syllabusInfo = syllabusId ? syllabusInfoDB[syllabusId] : undefined;

    useEffect(() => {
        const fetchInfo = async () => {
            if (!syllabusId) return;
            if (syllabusInfo) return;

            try {
                const res = await SyllabusService.getSyllabusById(syllabusId);
                const data = res.data;
                const minBloomLevel = data?.minBloomLevel;
                const bloomText = formatBloomLevel(minBloomLevel);
                const sid = data?.subjectId;

                if (!sid) return;

                const [sourcesResult, closResult] = await Promise.allSettled([
                    SourceService.getSubjectSources(sid),
                    CloPloService.getSubjectClos(sid, 0, 100)
                ]);

                let sourcesReference: string[] = [];
                if (sourcesResult.status === 'fulfilled' && (sourcesResult.value as any)?.data) {
                    const sourcesData = (sourcesResult.value as any).data as Array<{ sourceName: string, author: string, publisher: string, publishedYear: number }>;
                    sourcesReference = (sourcesData || []).map(s =>
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
                console.error("Failed to fetch syllabus context information:", err);
                // Handle permission or network errors gracefully
                dispatch(setSyllabusInfo({
                    syllabusId,
                    info: {
                        bloomTaxonomy: "Level 4 (Est.)",
                        sourcesReference: ["Reference materials restricted for your role."],
                        clos: ["CLO details restricted for your role."]
                    }
                }));
            }
        };
        fetchInfo();
    }, [syllabusId, dispatch, syllabusInfo]);

    const displayInfo = syllabusInfo || {
        bloomTaxonomy: "Loading...",
        sourcesReference: ["Loading..."],
        clos: ["Loading..."]
    };

    // Calculate Bloom level from subject data (priority) then syllabus data
    const activeBloomNum = subjectData?.minBloomLevel ?? syllabusData?.minBloomLevel;
    const bloomLabel = activeBloomNum && BLOOM_LABELS[activeBloomNum]
        ? BLOOM_LABELS[activeBloomNum]
        : (displayInfo.bloomTaxonomy || 'Loading...');

    const bloomNum = activeBloomNum ?? parseInt(displayInfo.bloomTaxonomy?.match(/\d+/)?.[0] || '0');

    // Split sources into two columns
    const half = Math.ceil(displayInfo.sourcesReference.length / 2);
    const sourcesCol1 = displayInfo.sourcesReference.slice(0, half);
    const sourcesCol2 = displayInfo.sourcesReference.slice(half);

    // CLO badge color cycling
    const CLO_COLORS = [
        { bg: C.secondaryContainer, text: C.onSecondaryContainer },
        { bg: C.tertiaryContainer, text: C.onTertiaryContainer },
        { bg: C.primaryContainer, text: C.onPrimaryContainer },
    ];

    if (isTaskLoading || (!!syllabusId && isSyllabusLoading) || (!!subjectId && isSubjectLoading)) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!syllabusData) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: C.surfaceContainer }}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: C.onSurfaceVariant }}>info</span>
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: C.onSurface }}>No Syllabus Information</h3>
                <p style={{ color: C.onSurfaceVariant }} className="max-w-sm">
                    We couldn't retrieve the specific syllabus details for this development task.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-7">

            {/* ── Bento Grid ── */}
            <div className="grid grid-cols-12 gap-5">

                {/* Bloom's Taxonomy */}
                <section className="col-span-12 lg:col-span-4 rounded-xl p-5 flex flex-col justify-between"
                    style={{ background: `${C.primaryContainer}4d`, borderLeft: `4px solid ${C.primary}` }}>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.primary }}>Bloom Minimum</span>
                        <h3 className="text-xl font-extrabold mt-0.5" style={{ color: C.onPrimaryContainer, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {bloomLabel}
                        </h3>
                        <p className="mt-2 leading-relaxed italic text-[11px]" style={{ color: C.onSurfaceVariant }}>
                            Students will synthesize complex theories and justify decisions based on academic criteria and established standards.
                        </p>
                    </div>
                    <div className="mt-5 flex gap-2">
                        {[1, 2, 3, 4, 5, 6].map(lvl => (
                            <span key={lvl} className="h-1 flex-1 rounded-full"
                                style={{ background: lvl <= bloomNum ? C.primary : C.surfaceVariant }} />
                        ))}
                    </div>
                </section>

                {/* Sources Reference */}
                <section className="col-span-12 lg:col-span-8 rounded-xl p-5"
                    style={{ background: C.surfaceContainerLowest }}>
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
                        value: `${subjectData?.credits ?? syllabusData.credit ?? syllabusData.noCredit ?? 0} Credits`,
                    },
                    {
                        icon: 'grade',
                        label: 'Scoring Scale',
                        value: `${subjectData?.scoringScale ?? (syllabusData.scoringScale || 10)} / 10`,
                    },
                    {
                        icon: 'check_circle',
                        label: 'Min. Pass Score',
                        value: `${subjectData?.minToPass ?? syllabusData.minAvgGrade ?? syllabusData.minAvgMarkToPass ?? 0} Points`,
                    },
                    {
                        icon: 'policy',
                        label: 'Decision Level',
                        value: subjectData?.decisionNo ? `Decision: ${subjectData.decisionNo}` : `Level ${syllabusData.decisionLevel || 1}`,
                        highlight: true,
                    },
                ].map((item) => (
                    <div key={item.label}
                        className="rounded-xl p-4 flex items-center gap-3 border transition-all hover:border-primary-500/30"
                        style={{
                            background: item.highlight ? `${C.primaryContainer}4d` : C.surfaceContainerLowest,
                            borderColor: item.highlight ? `${C.primary}33` : `${C.outlineVariant}1a`,
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
            <section className="rounded-xl overflow-hidden shadow-sm" style={{ background: C.surfaceContainerLow }}>
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

                <div className="max-h-125 overflow-y-auto custom-scrollbar" style={{ borderTop: 'none' }}>
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
    );
}
