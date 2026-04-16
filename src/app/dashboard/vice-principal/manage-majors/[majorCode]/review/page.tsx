"use client";

import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { MajorService } from "@/services/major.service";
import { PoService } from "@/services/po.service";
import {
    ChevronLeft, CheckCircle2, AlertCircle, Loader2,
    Target, ArrowRight, ShieldCheck, Sparkles,
    FileText, LayoutGrid, Info, BadgeCheck,
    Hash, Type, TextQuote, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";

export default function MajorReviewPage() {
    const params = useParams();
    const majorCode = params.majorCode as string;
    const router = useRouter();
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    // Queries
    const { data: majorResponse, isLoading: isLoadingMajor } = useQuery({
        queryKey: ['major', majorCode],
        queryFn: () => MajorService.getMajorByCode(majorCode),
        enabled: !!majorCode,
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
            
            // Call both APIs in parallel to sync status
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
        // Rule: uppercase prefix "PO" followed by digits
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
// ... (omitting loading check for brevity)
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-white">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-400">Accessing Institutional Repository...</p>
            </div>
        );
    }

    const handleApprove = () => {
        if (confirm("Advance this Major to Internal Review? This signals that the program structure is verified.")) {
            mutation.mutate('INTERNAL_REVIEW');
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
                                <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Institutional Review</span>
                                <span className="text-zinc-300">•</span>
                                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{majorCode}</span>
                            </div>
                            <h1 className="text-xl font-black text-zinc-900 tracking-tight">Major Structure Verification.</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black text-amber-500 uppercase tracking-widest">Awaiting Verification</span>
                            <span className="text-sm font-bold text-zinc-400">{pos.length} Objectives • VP Approval Req.</span>
                        </div>
                        <button
                            onClick={handleApprove}
                            disabled={mutation.isPending}
                            className="px-8 py-3 bg-zinc-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-xl hover:bg-amber-600 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            {mutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                            Approve Structure
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto mt-12 px-8 space-y-10">
                {/* Major Identity Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-sm relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-8 space-y-6">
                            <div className="space-y-2">
                                <span className="text-xs font-black text-primary uppercase tracking-[0.3em] block">Major Blueprint</span>
                                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter">{major?.majorName}</h2>
                            </div>
                            <p className="text-base font-medium text-zinc-500 leading-relaxed italic">
                                "{major?.description || "No strategic description provided for this major."}"
                            </p>
                        </div>
                        <div className="lg:col-span-4 flex justify-end">
                            <div className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 text-center space-y-1 min-w-[200px]">
                                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest block">Institutional Code</span>
                                <span className="text-2xl font-black text-primary">{majorCode}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Institutional Compliance Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* PO Count */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
                                <Target size={20} />
                            </div>
                            {compliance?.isCountValid ? (
                                <BadgeCheck className="text-emerald-500" size={18} />
                            ) : (
                                <AlertTriangle className="text-amber-500" size={18} />
                            )}
                        </div>
                        <div>
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest block">PO Count Limit</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-xl font-black ${compliance?.isCountValid ? 'text-zinc-900' : 'text-amber-600'}`}>
                                    {compliance?.count || 0}/12
                                </span>
                                <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">(Min 5)</span>
                            </div>
                        </div>
                    </div>


                    {/* Description Depth */}
                    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                                <Type size={20} />
                            </div>
                            {compliance?.isDepthValid ? (
                                <BadgeCheck className="text-emerald-500" size={18} />
                            ) : (
                                <AlertTriangle className="text-amber-500" size={18} />
                            )}
                        </div>
                        <div>
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest block">Description Depth</span>
                            <span className={`text-sm font-black uppercase tracking-widest ${compliance?.isDepthValid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {compliance?.isDepthValid ? 'Sufficient' : 'Requires Detail'}
                            </span>
                        </div>
                    </div>

                    {/* Standard Format */}
                    <div 
                        className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4 relative group/format cursor-help"
                        onMouseEnter={() => setShowRules(true)}
                        onMouseLeave={() => setShowRules(false)}
                    >
                        <div className="flex items-center justify-between">
                            <div className="w-10 h-10 bg-zinc-50 text-zinc-400 rounded-xl flex items-center justify-center">
                                <TextQuote size={20} />
                            </div>
                            {compliance?.isStandardFormat ? (
                                <BadgeCheck className="text-emerald-500" size={18} />
                            ) : (
                                <Info className="text-zinc-300" size={18} />
                            )}
                        </div>
                        <div>
                            <span className="text-xs font-black text-zinc-400 uppercase tracking-widest block">Format Standard</span>
                            <span className="text-xs font-black uppercase tracking-widest text-zinc-900">
                                {compliance?.isStandardFormat ? 'Standard Applied' : 'Non-Standard Codes'}
                            </span>
                        </div>

                        <AnimatePresence>
                            {showRules && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute bottom-full left-0 right-0 mb-4 p-6 bg-white/90 backdrop-blur-xl border border-zinc-100 rounded-[2rem] shadow-2xl z-[60] space-y-3 pointer-events-none"
                                >
                                    <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2">Institutional Rules</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                                            <div className="w-1 h-1 bg-primary rounded-full" />
                                            Prefix: Must start with "PO"
                                        </li>
                                        <li className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                                            <div className="w-1 h-1 bg-primary rounded-full" />
                                            Ordinal: Followed by a number (PO1, PO2)
                                        </li>
                                        <li className="flex items-center gap-2 text-xs font-bold text-zinc-600">
                                            <div className="w-1 h-1 bg-primary rounded-full" />
                                            Case: Must be all Uppercase
                                        </li>
                                    </ul>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Detailed PO List */}
                <div className="bg-white p-10 rounded-[3rem] border border-zinc-100 shadow-sm space-y-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-zinc-900 text-white rounded-2xl flex items-center justify-center">
                                <LayoutGrid size={24} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-zinc-900 uppercase tracking-widest">Program Objectives Matrix</h3>
                                <p className="text-xs font-bold text-zinc-400 uppercase mt-0.5">Core competencies established by this major</p>
                            </div>
                        </div>
                        <span className="text-xs font-black text-zinc-300 uppercase tracking-widest">Read Only Mode</span>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {pos && pos.length > 0 ? (
                            pos.map((po: any) => (
                                <div key={po.poId} className="p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 hover:border-amber-200 transition-all group flex items-start gap-6">
                                    <div className="w-20 shrink-0">
                                        <div className="p-3 bg-white border border-zinc-100 rounded-2xl text-center shadow-sm">
                                            <span className="text-[11px] font-black text-primary tracking-tighter uppercase">{po.poCode}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Objective Statement</h4>
                                        <p className="text-sm font-medium text-zinc-700 leading-relaxed font-sans">
                                            {po.description}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end justify-between self-stretch">
                                        <div className="px-3 py-1 bg-white border border-zinc-100 rounded-full text-xs font-black text-emerald-600 uppercase tracking-widest shadow-sm">
                                            DRAFT
                                        </div>
                                        <span className="text-xs text-zinc-300 font-bold">{new Date().getFullYear()} Framework</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-20 text-center bg-zinc-50 rounded-[2.5rem] border border-dashed border-zinc-200">
                                <Target className="mx-auto text-zinc-200 mb-4" size={48} />
                                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">No POs found for review</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Final Action Footer */}
                <div className="flex flex-col items-center justify-center pt-10 space-y-4">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest max-w-lg text-center leading-relaxed">
                        By approving this structure, you confirm that these Program Objectives are institutionalized and ready for official internal assessment.
                    </p>
                    <button
                        onClick={handleApprove}
                        disabled={mutation.isPending}
                        className="group flex flex-col items-center gap-3"
                    >
                        <div className="w-16 h-16 bg-zinc-900 text-white rounded-full flex items-center justify-center group-hover:bg-amber-600 transition-all shadow-xl group-active:scale-95">
                            {mutation.isPending ? <Loader2 className="animate-spin" size={24} /> : <ArrowRight size={24} />}
                        </div>
                        <span className="text-xs font-black text-zinc-900 uppercase tracking-widest group-hover:text-amber-600 transition-colors">
                            Push to Institutional Review
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
