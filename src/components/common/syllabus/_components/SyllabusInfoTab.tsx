import React from 'react';

const C = {
    primary: "#41683f",
    primaryContainer: "#c1eeba",
    onPrimaryContainer: "#345a32",
    surfaceContainerLowest: "#ffffff",
    surfaceContainer: "#ebf0e5",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    outlineVariant: "#adb4a8",
};

const BLOOM_LABELS: Record<number, string> = {
    1: 'LEVEL 1: REMEMBER',
    2: 'LEVEL 2: UNDERSTAND',
    3: 'LEVEL 3: APPLY',
    4: 'LEVEL 4: ANALYZE',
    5: 'LEVEL 5: EVALUATE',
    6: 'LEVEL 6: CREATE',
};

interface SyllabusInfoTabProps {
    syllabus: any;
    subject?: any;
}

export function SyllabusInfoTab({ syllabus, subject }: SyllabusInfoTabProps) {
    if (!syllabus) return <div className="py-10 text-center text-on-surface-variant">No syllabus information found.</div>;

    const bloomNum = subject?.minBloomLevel || syllabus?.minBloomLevel || 0;
    const bloomLabel = BLOOM_LABELS[bloomNum] || "Level " + bloomNum;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-12 gap-5 text-left">
                {/* Bloom's Taxonomy */}
                <section className="col-span-12 lg:col-span-12 rounded-xl p-5 flex flex-col justify-between"
                    style={{ background: `${C.primaryContainer}4d`, borderLeft: `4px solid ${C.primary}` }}>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.primary }}>Bloom Minimum Target</span>
                        <h3 className="text-xl font-extrabold mt-0.5" style={{ color: C.onPrimaryContainer, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            {bloomLabel}
                        </h3>
                        <p className="mt-2 leading-relaxed italic text-[11px]" style={{ color: C.onSurfaceVariant }}>
                            This syllabus is designed to reach the {bloomLabel} competency level.
                        </p>
                    </div>
                    <div className="mt-5 flex gap-2">
                        {[1, 2, 3, 4, 5, 6].map(lvl => (
                            <span key={lvl} className="h-1 flex-1 rounded-full"
                                style={{ background: lvl <= bloomNum ? C.primary : "#dee5d8" }} />
                        ))}
                    </div>
                </section>
            </div>

            {/* Meta Info Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {[
                    {
                        icon: 'school',
                        label: 'Credits',
                        value: `${subject?.credits || syllabus?.credit || syllabus?.noCredit || 0} Credits`,
                    },
                    {
                        icon: 'grade',
                        label: 'Scoring Scale',
                        value: `${subject?.scoringScale || syllabus?.scoringScale || 10} / 10`,
                    },
                    {
                        icon: 'check_circle',
                        label: 'Min to Pass',
                        value: `${subject?.minToPass || syllabus?.minAvgGrade || syllabus?.minAvgMarkToPass || 0} Points`,
                    },
                    {
                        icon: 'policy',
                        label: 'Version',
                        value: `Version: ${syllabus?.version || '1.0'}`,
                        highlight: true,
                    },
                ].map((item) => (
                    <div key={item.label}
                        className="rounded-xl p-4 flex items-center gap-3 border"
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
        </div>
    );
}
