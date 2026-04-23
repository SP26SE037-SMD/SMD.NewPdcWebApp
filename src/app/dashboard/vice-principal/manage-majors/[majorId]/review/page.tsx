"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { MajorService } from "@/services/major.service";
import { PoService } from "@/services/po.service";
import {
    CheckCircle2, AlertCircle, Loader2,
    Target, ShieldCheck,
    FileText, LayoutGrid, Info, BadgeCheck,
    Type, TextQuote, AlertTriangle, ChevronRight, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

export default function MajorReviewPage() {
    const params = useParams();
    const majorId = params.majorId as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // Queries
    const { data: majorResponse, isLoading: isLoadingMajor } = useQuery({
        queryKey: ['major', majorId],
        queryFn: () => MajorService.getMajorById(majorId),
        enabled: !!majorId,
    });

    const major = majorResponse?.data;

    const { data: posResponse, isLoading: isLoadingPOs } = useQuery({
        queryKey: ['major-pos', major?.majorId],
        queryFn: () => PoService.getPOsByMajorId(major?.majorId || "", { size: 100 }),
        enabled: !!major?.majorId,
    });

    const pos = posResponse?.data?.content || [];

    const mutation = useMutation({
        mutationFn: async (newStatus: string) => {
            const majorId = major?.majorId || "";
            if (!majorId) throw new Error("Major ID is required");
            return Promise.all([
                MajorService.updateMajorStatus(majorId, newStatus),
                PoService.updatePOsStatusByMajor(majorId, newStatus)
            ]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['majors'] });
            showToast("Major and Program Objectives advanced to Internal Review successfully.", "success");
            router.push(`/dashboard/vice-principal/manage-majors`);
        },
        onError: (error: any) => {
            showToast(error.message || "Failed to advance major or POs status.", "error");
        }
    });

    // Compliance Calculations
    const compliance = useMemo(() => {
        if (!pos || pos.length === 0) return null;
        const avgLength = pos.reduce((acc, p) => acc + (p.description?.length || 0), 0) / pos.length;
        const isStandardFormat = pos.every(p => /^PO\d+$/.test(p.poCode));
        return {
            count: pos.length,
            isCountValid: pos.length >= 5 && pos.length <= 8,
            avgLength,
            isDepthValid: avgLength > 40,
            isStandardFormat
        };
    }, [pos]);

    const [showRules, setShowRules] = React.useState(false);

    if (isLoadingMajor || isLoadingPOs) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center text-[#adb3b5]">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p className="font-black text-xs uppercase tracking-[0.3em]">
                    Accessing Institutional Repository...
                </p>
            </div>
        );
    }

    const handleApprove = () => {
        if (confirm("Advance this Major to Internal Review? This signals that the program structure is verified.")) {
            mutation.mutate('INTERNAL_REVIEW');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] text-[#2d3335] pb-20">
            {/* Header - đồng bộ với Established view */}
            <div className="bg-white border-b border-[#ebeef0]">
                <div className="max-w-7xl mx-auto px-8 py-8">
                    <nav className="flex items-center gap-2 text-[10px] font-bold text-[#5a6062] uppercase tracking-[0.2em] mb-4">
                        <Link
                            href="/dashboard/vice-principal/manage-majors"
                            className="hover:text-[#2d6a4f] transition-colors"
                        >
                            Curriculum Catalog
                        </Link>
                        <ChevronRight size={10} />
                        <Link
                            href={`/dashboard/vice-principal/manage-majors/${encodeURIComponent(majorId)}`}
                            className="hover:text-[#2d6a4f] transition-colors"
                        >
                            {major?.majorCode || "..."}
                        </Link>
                        <ChevronRight size={10} />
                        <span className="text-[#2d6a4f]">Review</span>
                    </nav>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h1 className="text-5xl font-extrabold tracking-tighter text-[#2d3335] mb-4 font-['Plus_Jakarta_Sans']">
                                {major?.majorName}
                            </h1>
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full bg-amber-100 text-amber-700">
                                    INTERNAL REVIEW
                                </span>
                                <span className="text-xs text-[#5a6062] flex items-center gap-1.5 font-medium">
                                    <Calendar size={14} className="text-[#adb3b5]" />
                                    {pos.length} Objectives · VP Approval Required
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleApprove}
                                disabled={mutation.isPending}
                                className="px-8 py-3 bg-[#2d6a4f] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-[#2d6a4f]/10 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {mutation.isPending
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : <ShieldCheck size={14} strokeWidth={2.5} />
                                }
                                Approve Structure
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-8 pt-10 space-y-8">
                {/* Major Identity Card */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-[#ebeef0] relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest flex items-center gap-2">
                            <FileText size={16} className="text-[#2d6a4f]" />
                            Strategic Description
                        </h3>
                        <div className="px-3 py-1 bg-[#f1f4f5] rounded-full text-[10px] font-bold text-[#5a6062] uppercase tracking-widest">
                            {major?.majorCode}
                        </div>
                    </div>
                    <p className="text-[#5a6062] text-lg leading-relaxed font-medium italic">
                        "{major?.description || "No strategic description provided for this major."}"
                    </p>
                </section>

                {/* Compliance Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* PO Count */}
                    <div className="bg-white p-6 rounded-2xl border border-[#ebeef0] shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                                <Target size={20} />
                            </div>
                            {compliance?.isCountValid ? (
                                <BadgeCheck className="text-[#2d6a4f]" size={18} />
                            ) : (
                                <AlertTriangle className="text-amber-500" size={18} />
                            )}
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest block mb-1">
                                PO Count Limit
                            </span>
                            <div className="flex items-center gap-2">
                                <span className={`text-xl font-black ${compliance?.isCountValid ? 'text-[#2d3335]' : 'text-amber-600'}`}>
                                    {compliance?.count || 0}/12
                                </span>
                                <span className="text-xs font-bold text-[#adb3b5] uppercase tracking-widest">(Min 5)</span>
                            </div>
                        </div>
                    </div>

                    {/* Description Depth */}
                    <div className="bg-white p-6 rounded-2xl border border-[#ebeef0] shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                <Type size={20} />
                            </div>
                            {compliance?.isDepthValid ? (
                                <BadgeCheck className="text-[#2d6a4f]" size={18} />
                            ) : (
                                <AlertTriangle className="text-amber-500" size={18} />
                            )}
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest block mb-1">
                                Description Depth
                            </span>
                            <span className={`text-sm font-black uppercase tracking-widest ${compliance?.isDepthValid ? 'text-[#2d6a4f]' : 'text-amber-600'}`}>
                                {compliance?.isDepthValid ? 'Sufficient' : 'Requires Detail'}
                            </span>
                        </div>
                    </div>

                    {/* Format Standard */}
                    <div
                        className="bg-white p-6 rounded-2xl border border-[#ebeef0] shadow-sm space-y-4 relative cursor-help"
                        onMouseEnter={() => setShowRules(true)}
                        onMouseLeave={() => setShowRules(false)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-[#f1f4f5] text-[#adb3b5] rounded-xl flex items-center justify-center">
                                <TextQuote size={20} />
                            </div>
                            {compliance?.isStandardFormat ? (
                                <BadgeCheck className="text-[#2d6a4f]" size={18} />
                            ) : (
                                <Info className="text-[#adb3b5]" size={18} />
                            )}
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest block mb-1">
                                Format Standard
                            </span>
                            <span className="text-xs font-black uppercase tracking-widest text-[#2d3335]">
                                {compliance?.isStandardFormat ? 'Standard Applied' : 'Non-Standard Codes'}
                            </span>
                        </div>

                        <AnimatePresence>
                            {showRules && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 right-0 mb-4 p-6 bg-white border border-[#ebeef0] rounded-2xl shadow-2xl z-[60] space-y-3 pointer-events-none"
                                >
                                    <h4 className="text-xs font-black text-[#2d3335] uppercase tracking-widest border-b border-[#f1f4f5] pb-2">
                                        Institutional Rules
                                    </h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-xs font-bold text-[#5a6062]">
                                            <div className="w-1 h-1 bg-[#2d6a4f] rounded-full" />
                                            Prefix: Must start with "PO"
                                        </li>
                                        <li className="flex items-center gap-2 text-xs font-bold text-[#5a6062]">
                                            <div className="w-1 h-1 bg-[#2d6a4f] rounded-full" />
                                            Ordinal: Followed by a number (PO1, PO2)
                                        </li>
                                        <li className="flex items-center gap-2 text-xs font-bold text-[#5a6062]">
                                            <div className="w-1 h-1 bg-[#2d6a4f] rounded-full" />
                                            Case: Must be all Uppercase
                                        </li>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Program Objectives Matrix */}
                <section className="bg-white rounded-2xl p-8 shadow-sm border border-[#ebeef0]">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-sm font-bold text-[#2d3335] uppercase tracking-widest flex items-center gap-2">
                            <LayoutGrid size={16} className="text-[#2d6a4f]" />
                            Program Objectives Matrix
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest">
                                Read Only Mode
                            </span>
                            <div className="px-3 py-1 bg-[#f1f4f5] rounded-full text-[10px] font-bold text-[#5a6062] uppercase tracking-widest">
                                {pos.length} Objectives
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {pos && pos.length > 0 ? (
                            pos.map((po: any) => (
                                <div
                                    key={po.poId}
                                    className="group flex gap-6 p-4 rounded-xl hover:bg-[#f8f9fa] transition-colors border border-transparent hover:border-[#ebeef0]"
                                >
                                    <div className="w-12 text-sm font-black text-[#2d6a4f] opacity-40 group-hover:opacity-100 transition-opacity pt-1 shrink-0">
                                        {po.poCode}
                                    </div>
                                    <div className="flex-1 text-[#5a6062] text-sm font-medium leading-relaxed">
                                        {po.description}
                                    </div>
                                    <div className="shrink-0 flex items-start pt-0.5">
                                        <span className="px-2 py-0.5 bg-[#f1f4f5] text-[#5a6062] text-[10px] font-bold rounded uppercase tracking-widest">
                                            DRAFT
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-16 border-2 border-dashed border-[#ebeef0] rounded-2xl flex flex-col items-center text-center space-y-3">
                                <Target size={24} className="text-[#adb3b5]" />
                                <p className="text-xs font-black text-[#adb3b5] uppercase tracking-widest">
                                    No POs found for review
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Confirmation Footer */}
                <section>
                    <div className="flex items-center justify-between gap-6 p-8 bg-[#1b5e20] rounded-2xl shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-white font-bold text-xl font-['Plus_Jakarta_Sans']">
                                Ready for Institutional Review?
                            </h4>
                            <p className="text-[#a5d6a7] text-sm font-medium">
                                By approving, you confirm these Program Objectives are ready for official internal assessment.
                            </p>
                        </div>
                        <button
                            onClick={handleApprove}
                            disabled={mutation.isPending}
                            className="shrink-0 px-10 py-3 bg-[#2d6a4f] text-white font-black uppercase tracking-widest text-[13px] rounded-xl shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {mutation.isPending
                                ? <Loader2 size={18} className="animate-spin" />
                                : <ShieldCheck size={18} />
                            }
                            Push to Internal Review
                        </button>
                        <ShieldCheck
                            size={140}
                            className="absolute -bottom-10 -right-10 text-white/5 group-hover:rotate-12 transition-transform duration-700"
                        />
                    </div>
                </section>
            </main>
        </div>
    );
}
