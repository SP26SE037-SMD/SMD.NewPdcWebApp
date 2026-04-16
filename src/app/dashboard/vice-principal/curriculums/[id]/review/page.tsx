"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { CurriculumService, CURRICULUM_STATUS } from "@/services/curriculum.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { GroupService } from "@/services/group.service";
import { MajorService } from "@/services/major.service";
import { PoService } from "@/services/po.service";
import { PoPloService } from "@/services/poplo.service";
import { SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import {
    ChevronLeft, CheckCircle2, AlertCircle, Loader2,
    Layers, BookOpen, Target, Calendar, BarChart3,
    ArrowRight, ChevronDown, ChevronUp, Sparkles,
    Filter, LayoutGrid, Info, ShieldCheck, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function VicePrincipalReviewPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const queryClient = useQueryClient();

    // Simulation State
    const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
    const [expandedElectives, setExpandedElectives] = useState<Set<string>>(new Set());

    // Queries
    const { data: curriculumData, isLoading: isLoadingCur } = useQuery({
        queryKey: ['curriculum-details', id],
        queryFn: () => CurriculumService.getCurriculumById(id),
    });

    const { data: subjectsData, isLoading: isLoadingSub } = useQuery({
        queryKey: ['curriculum-mapped-subjects', id],
        queryFn: () => CurriculumGroupSubjectService.getSubjectsByCurriculum(id),
    });

    const { data: groupData, isLoading: isLoadingGroups } = useQuery({
        queryKey: ['warehouse-groups'],
        queryFn: () => GroupService.getGroups(),
    });

    const { data: plosData, isLoading: isLoadingPLOs } = useQuery({
        queryKey: ['curriculum-plos', id],
        queryFn: () => CurriculumService.getPLOsByCurriculumId(id),
        enabled: !!id,
    });

    const { data: mappingsData, isLoading: isLoadingMappings } = useQuery({
        queryKey: ["po-plo-mappings", id],
        queryFn: () => PoPloService.getMappingsByCurriculum(id),
        enabled: !!id,
    });

    const majorId = curriculumData?.data?.majorId || curriculumData?.data?.major?.majorId;
    const { data: posData, isLoading: isLoadingPOs } = useQuery({
        queryKey: ["pos-major", majorId],
        queryFn: () => PoService.getPOsByMajorId(majorId || ""),
        enabled: !!majorId,
    });

    const mutation = useMutation({
        mutationFn: async (newStatus: string) => {
            // Update Curriculum Status
            const curRes = await CurriculumService.updateCurriculumStatus(id, newStatus as any);

            // Synchronize Subject and PLO Statuses if it's Structure Review Enactment
            if (newStatus === CURRICULUM_STATUS.STRUCTURE_APPROVED) {
                // 1. Update Subjects to DEFINED
                await SubjectService.updateSubjectStatusesBulk(
                    id,
                    SUBJECT_STATUS.DEFINED,
                    undefined, // All departments
                    SUBJECT_STATUS.DRAFT
                );

                // 2. Update all PLOs to INTERNAL_REVIEW
                await CurriculumService.updatePloStatusByCurriculum(id, "INTERNAL_REVIEW");
            }

            return curRes;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['curriculum-details', id] });
            router.push(`/dashboard/vice-principal/digital-enactment`);
        }
    });

    const curriculum = curriculumData?.data;
    const mappings = subjectsData?.data?.semesterMappings || [];
    const allGroups = (groupData?.data as any)?.content || (Array.isArray(groupData?.data) ? groupData?.data : []);
    const plos = plosData?.data?.content || plosData?.data || (Array.isArray(plosData) ? plosData : []);
    const pos = (posData?.data as any)?.content || posData?.data || [];
    const poPloMappings = mappingsData?.data || [];

    // Derived Logic
    const usedGroupIds = useMemo(() => {
        const ids = new Set<string>();
        mappings.forEach((m: any) => m.subjects?.forEach((s: any) => {
            if (s.groupId) ids.add(s.groupId);
        }));
        return ids;
    }, [mappings]);

    const curriculumGroups = useMemo(() => {
        return allGroups.filter((g: any) => usedGroupIds.has(g.groupId));
    }, [allGroups, usedGroupIds]);

    const combos = useMemo(() => curriculumGroups.filter((g: any) => g.type === 'COMBO'), [curriculumGroups]);

    const toggleElective = (groupId: string) => {
        const next = new Set(expandedElectives);
        if (next.has(groupId)) next.delete(groupId);
        else next.add(groupId);
        setExpandedElectives(next);
    };

    // Statistics Calculation (Based on Simulation)
    const stats = useMemo(() => {
        let subjects: any[] = [];
        mappings.forEach((m: any) => {
            m.subjects?.forEach((s: any) => {
                const group = curriculumGroups.find((g: any) => g.groupId === s.groupId);
                if (!s.groupId || group?.type === 'ELECTIVE') {
                    subjects.push(s);
                } else if (group?.type === 'COMBO' && s.groupId === selectedComboId) {
                    subjects.push(s);
                }
            });
        });

        return {
            totalSubjects: subjects.length,
            totalCredits: subjects.reduce((acc: number, s: any) => acc + (s.credit ?? s.credits ?? 3), 0),
            semesterCount: mappings.length
        };
    }, [mappings, curriculumGroups, selectedComboId]);

    // Mapping Logic helpers
    const isMapped = (poId: string, ploId: string) => {
        return poPloMappings.some((m: any) => m.poId === poId && m.ploId === ploId);
    };

    if (isLoadingCur || isLoadingSub || isLoadingGroups || isLoadingPLOs || isLoadingPOs || isLoadingMappings) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="mt-4 text-[12px] font-black uppercase tracking-widest text-zinc-400">Loading Governance Matrix...</p>
            </div>
        );
    }

    const handleApprove = () => {
        if (confirm("Approve this curriculum structure? This will allow HoCFDC to proceed with syllabus development.")) {
            mutation.mutate(CURRICULUM_STATUS.STRUCTURE_APPROVED);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50/50 pb-20">
            {/* Sticky Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-zinc-100 sticky top-0 z-50 px-8 py-5">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-primary transition-all shadow-sm"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-[12px] font-black text-indigo-600 uppercase tracking-widest">VP Architecture Review</span>
                                <span className="text-zinc-300">•</span>
                                <span className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">{curriculum?.curriculumCode}</span>
                            </div>
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Governance Structure Verification.</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-[12px] font-black text-indigo-500 uppercase tracking-widest">Verification Active</span>
                            <span className="text-sm font-bold text-zinc-400">{stats.totalSubjects} Subjects • {stats.totalCredits} Credits</span>
                        </div>
                        <button
                            onClick={handleApprove}
                            disabled={mutation.isPending}
                            className="px-8 py-3 bg-zinc-900 text-white text-[12px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                            Approve Structure
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-12 px-8 space-y-10">

                {/* Curriculum Outcomes (PLOs) */}
                <div className="bg-white p-8 rounded-[1.5rem] border border-zinc-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                            <Target size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">PLO Verification</h3>
                            <p className="text-[12px] font-bold text-zinc-400 uppercase mt-0.5">Core competencies established by this curriculum</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {plos && plos.length > 0 ? (
                            plos.map((plo: any) => (
                                <div key={plo.ploId || plo.id} className="p-5 bg-zinc-50 rounded-xl border border-zinc-100/50 hover:border-indigo-200 transition-all group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center text-[12px] font-black text-indigo-600 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                            {(plo.ploCode || plo.ploName || plo.name)?.split(' ')[1] || (plo.ploCode || plo.ploName || plo.name) || 'PLO'}
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-black text-zinc-900 uppercase tracking-wider mb-1">{plo.ploCode || plo.ploName || plo.name}</h4>
                                            <p className="text-[13px] font-medium text-zinc-500 leading-relaxed">{plo.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-2 p-8 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                <p className="text-[12px] font-black text-zinc-400 uppercase tracking-widest">No PLOs defined for this curriculum</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Competency Alignment Matrix (PO-PLO) */}
                <div className="bg-[#FCFCFD] p-8 rounded-[1.5rem] border border-zinc-200/60 shadow-sm overflow-hidden">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                            <Layers size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">
                                Competency Alignment Matrix
                            </h3>
                            <p className="text-[12px] font-bold text-zinc-400 uppercase mt-0.5">
                                Verification of Program Learning Outcomes against Strategic
                                Objectives
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto overflow-y-hidden rounded-2xl custom-scrollbar">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-zinc-200/50 border-b-2 border-zinc-200">
                                    <th className="px-4 py-6 text-left border-r-2 border-zinc-200 w-[140px] min-w-[140px] max-w-[140px]">
                                        <span className="text-[12px] font-black uppercase tracking-widest text-zinc-600">
                                            Outcome (PLO)
                                        </span>
                                    </th>
                                    {pos.map((po: any, idx: number) => (
                                        <th
                                            key={po.poId || idx}
                                            className="p-6 text-center border-b border-r border-zinc-100/50 min-w-[100px] group relative"
                                        >
                                            <span className="text-[13px] font-black uppercase tracking-widest text-zinc-900 cursor-help underline decoration-dotted decoration-zinc-300">
                                                {po.poCode || `PO${idx + 1}`}
                                            </span>
                                            {/* PO Tooltip */}
                                            <div className="absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 top-full left-1/2 -translate-x-1/2 mt-2 w-64 p-4 bg-zinc-900 text-white rounded-xl shadow-2xl z-50 text-left pointer-events-none">
                                                <div className="text-[11px] font-black uppercase tracking-widest text-indigo-400 mb-2 border-b border-zinc-800 pb-2">
                                                    {po.poCode || `PO${idx + 1}`} objective
                                                </div>
                                                <p className="text-[12px] font-medium leading-relaxed opacity-80">
                                                    {po.description ||
                                                        "Program Objective established for this major."}
                                                </p>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {plos.map((plo: any, idx: number) => (
                                    <tr
                                        key={plo.ploId || plo.id}
                                        className="hover:bg-indigo-50/20 transition-colors group/row even:bg-zinc-50/50"
                                    >
                                        <td className="px-4 py-6 border-r-2 border-zinc-200 bg-zinc-100/20 relative group text-zinc-900 w-[140px] max-w-[140px]">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[13px] font-black text-zinc-900 uppercase">
                                                    {plo.ploCode || plo.ploName || plo.name}
                                                </span>
                                                <span className="text-[13px] font-medium text-zinc-400 line-clamp-1 italic cursor-help">
                                                    {plo.description}
                                                </span>
                                            </div>

                                            {/* PLO Description Tooltip (Projection) */}
                                            <div className={`absolute opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 left-[90%] w-72 p-5 bg-zinc-900 shadow-2xl rounded-xl z-[60] pointer-events-none border border-zinc-800 ${idx === plos.length - 1 ? "bottom-0" : "top-4"
                                                }`}>
                                                <div className={`absolute left-0 -translate-x-1/2 w-3 h-3 bg-zinc-900 rotate-45 border-l border-b border-zinc-800 ${idx === plos.length - 1 ? "bottom-8" : "top-6"
                                                    }`} />
                                                <div className="text-[11px] font-black uppercase tracking-widest text-emerald-400 mb-2 border-b border-zinc-800 pb-2">
                                                    {plo.ploCode || "PLO Detail"}
                                                </div>
                                                <p className="text-[12px] font-medium leading-relaxed text-zinc-300">
                                                    {plo.description}
                                                </p>
                                            </div>
                                        </td>
                                        {pos.map((po: any) => {
                                            const active = isMapped(po.poId, plo.ploId);
                                            return (
                                                <td
                                                    key={po.poId}
                                                    className={`p-6 text-center border-b border-zinc-100 border-r border-zinc-100/50 transition-colors ${active ? "bg-indigo-50/40" : "bg-white/40"
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-center">
                                                        {active ? (
                                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100/50">
                                                                <Check size={16} strokeWidth={3} />
                                                            </div>
                                                        ) : (
                                                            <div className="w-2 h-2 rounded-full bg-zinc-100" />
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Simulation Controls */}
                <div className="bg-white p-8 rounded-[1.5rem] border border-zinc-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">Specialization Matrix</h3>
                            <p className="text-[12px] font-bold text-zinc-400 uppercase mt-0.5">Preview academic flow for specific combos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <select
                            value={selectedComboId || ""}
                            onChange={(e) => setSelectedComboId(e.target.value || null)}
                            className="flex-1 md:w-64 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                        >
                            <option value="">No Combo Selected (Slot Mode)</option>
                            {combos.map((c: any) => (
                                <option key={c.groupId} value={c.groupId}>{c.groupCode} — {c.groupName}</option>
                            ))}
                        </select>
                        <LayoutGrid className="text-zinc-300" size={20} />
                    </div>
                </div>

                {/* Matrix Table */}
                <div className="bg-white rounded-[1.8rem] border border-zinc-100 shadow-xl overflow-hidden mb-20">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-zinc-900 text-white">
                                <th className="px-8 py-5 text-left text-[12px] font-black uppercase tracking-widest w-[160px]">SubjectCode</th>
                                <th className="px-8 py-5 text-left text-[12px] font-black uppercase tracking-widest">Subject Name</th>
                                <th className="px-8 py-5 text-center text-[12px] font-black uppercase tracking-widest w-[120px]">Semester</th>
                                <th className="px-8 py-5 text-center text-[12px] font-black uppercase tracking-widest w-[140px]">Credits</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mappings.map((semMap: any) => {
                                const subjects = semMap.subjects || [];

                                // Organize subjects by their role
                                const standalones = subjects.filter((s: any) => !s.groupId);
                                const comboSubjects = subjects.filter((s: any) => curriculumGroups.find((g: any) => g.groupId === s.groupId)?.type === 'COMBO');
                                const electiveSubjects = subjects.filter((s: any) => curriculumGroups.find((g: any) => g.groupId === s.groupId)?.type === 'ELECTIVE');

                                // Combo Slot Calculation
                                const comboGroupsInSem = Array.from(new Set(comboSubjects.map((s: any) => s.groupId as string))).filter(Boolean) as string[];
                                const subjectsByGroup: Record<string, any[]> = {};
                                comboGroupsInSem.forEach((gid: string) => {
                                    subjectsByGroup[gid] = comboSubjects.filter((s: any) => s.groupId === gid);
                                });

                                const subjectsByGroupValues = Object.values(subjectsByGroup);
                                const maxComboRows = subjectsByGroupValues.length > 0
                                    ? Math.max(...subjectsByGroupValues.map(list => list.length))
                                    : 0;
                                const comboSlots = Array.from({ length: maxComboRows }, (_, i) => i);

                                const electiveGroupIds = Array.from(new Set(electiveSubjects.map((s: any) => s.groupId as string))).filter(Boolean) as string[];

                                const semesterTotalCredits = subjects.reduce(
                                    (acc: number, s: any) => acc + (s.credit ?? s.credits ?? 0),
                                    0,
                                );

                                return (
                                    <React.Fragment key={semMap.semesterNo}>
                                        {/* Standalone Rows */}
                                        {standalones.map((sub: any) => (
                                            <tr key={sub.subjectId} className="hover:bg-zinc-50 transition-colors">
                                                <td className="px-8 py-6 text-[13px] font-black text-zinc-900 tracking-wide border-b border-zinc-100">
                                                    {sub.subjectCode}
                                                </td>
                                                <td className="px-8 py-6 border-b border-zinc-100">
                                                    <span className="text-[12px] font-bold text-zinc-900 line-clamp-1">{sub.subjectName}</span>
                                                </td>
                                                <td className="px-8 py-6 text-center text-[13px] font-black text-zinc-900 border-b border-zinc-100">{semMap.semesterNo}</td>
                                                <td className="px-8 py-6 text-center text-[13px] font-black text-zinc-900 border-b border-zinc-100">{sub.credit ?? sub.credits ?? 0}</td>
                                            </tr>
                                        ))}

                                        {/* Combo Slots (Aggregated) */}
                                        {comboSlots.map((slotIdx) => {
                                            const activeSubject = selectedComboId ? subjectsByGroup[selectedComboId]?.[slotIdx] : null;

                                            if (selectedComboId && activeSubject) {
                                                return (
                                                    <tr key={`combo-active-${semMap.semesterNo}-${slotIdx}`} className="bg-indigo-50/10 hover:bg-indigo-50/20 transition-colors group">
                                                        <td className="px-8 py-6 text-[13px] font-black text-indigo-600 tracking-wide border-b border-indigo-50">
                                                            {activeSubject.subjectCode}
                                                        </td>
                                                        <td className="px-8 py-6 border-b border-indigo-50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1 px-2 bg-indigo-500 text-white rounded-md text-[9px] font-black uppercase tracking-widest">
                                                                    COMBO
                                                                </div>
                                                                <span className="text-[12px] font-bold text-indigo-900 line-clamp-1">{activeSubject.subjectName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center text-[13px] font-black text-indigo-900 border-b border-indigo-50">{semMap.semesterNo}</td>
                                                        <td className="px-8 py-6 text-center text-[13px] font-black text-indigo-900 border-b border-indigo-50">{activeSubject.credit ?? activeSubject.credits ?? 0}</td>
                                                    </tr>
                                                );
                                            }

                                            if (!selectedComboId) {
                                                return (
                                                    <tr key={`combo-placeholder-${semMap.semesterNo}-${slotIdx}`} className="hover:bg-indigo-50/30 transition-colors group">
                                                        <td className="px-8 py-6 text-[13px] font-black text-indigo-400/50 tracking-wide border-b border-zinc-50 italic">
                                                            [COMBO SLOT]
                                                        </td>
                                                        <td className="px-8 py-6 border-b border-zinc-50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1 px-2 bg-indigo-50 text-indigo-500 rounded-md text-[9px] font-black uppercase tracking-widest opacity-50">
                                                                    SELECTION REQ.
                                                                </div>
                                                                <span className="text-[13px] font-bold text-zinc-300 italic uppercase tracking-widest leading-none">Slot {slotIdx + 1} — Select Specialization</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center text-[13px] font-black text-zinc-300 border-b border-zinc-50">{semMap.semesterNo}</td>
                                                        <td className="px-8 py-6 text-center text-[13px] font-black text-zinc-300 border-b border-zinc-50">—</td>
                                                    </tr>
                                                );
                                            }

                                            return null;
                                        })}

                                        {/* Elective Groups */}
                                        {electiveGroupIds.map((grpId) => {
                                            const group = curriculumGroups.find((g: any) => g.groupId === grpId);
                                            if (!group) return null;

                                            const groupSubjects = electiveSubjects.filter((s: any) => s.groupId === grpId);
                                            const isExpanded = expandedElectives.has(grpId);

                                            return (
                                                <React.Fragment key={`elective-group-${grpId}`}>
                                                    <tr
                                                        onClick={() => toggleElective(grpId!)}
                                                        className="hover:bg-emerald-50/30 transition-colors cursor-pointer group"
                                                    >
                                                        <td className="px-8 py-6 text-[13px] font-black text-emerald-600 tracking-wide border-b border-zinc-50">
                                                            <div className="flex items-center gap-2">
                                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                {group.groupCode}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 border-b border-zinc-50">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1 px-2 bg-emerald-50 text-emerald-600 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                                    ELECTIVE
                                                                </div>
                                                                <span className="text-[12px] font-bold text-zinc-900 line-clamp-1">{group.groupName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center text-[13px] font-black text-zinc-900 border-b border-zinc-50">{semMap.semesterNo}</td>
                                                        <td className="px-8 py-6 text-center text-[13px] font-black text-zinc-900 border-b border-zinc-100">VARIES</td>
                                                    </tr>
                                                    {isExpanded && groupSubjects.map((gs: any) => (
                                                        <tr key={`nested-${gs.subjectId}`} className="bg-emerald-50/10 transition-colors">
                                                            <td className="px-8 pl-16 py-4 text-[12px] font-bold text-zinc-400 border-b border-zinc-50/50">
                                                                {gs.subjectCode}
                                                            </td>
                                                            <td className="px-8 py-4 text-[13px] font-medium text-zinc-500 border-b border-zinc-50/50">
                                                                {gs.subjectName}
                                                            </td>
                                                            <td className="px-8 py-4 text-center text-[12px] font-bold text-zinc-300 border-b border-zinc-50/50">—</td>
                                                            <td className="px-8 py-4 text-center text-[12px] font-bold text-zinc-400 border-b border-zinc-50/50">{gs.credit ?? gs.credits ?? 0}</td>
                                                        </tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* Spacer between semesters */}
                                        <tr className="h-10 bg-zinc-50 border-y border-zinc-100">
                                            <td colSpan={3} className="px-8 text-right">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                                                    Semester {semMap.semesterNo} Aggregate
                                                </span>
                                            </td>
                                            <td className="px-8 text-center bg-zinc-100/50">
                                                <span className="text-[13px] font-black text-indigo-600">
                                                    {semesterTotalCredits} Credits
                                                </span>
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
