"use client";

import { useState, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Loader2, BookOpen, Layers, Target, GraduationCap, ChevronRight, Filter, ChevronDown, AlertCircle, RefreshCw, ChevronLeft, Calendar, Eye, PencilLine } from "lucide-react";
import { CurriculumService, CurriculumFramework, CurriculumStatus, CURRICULUM_STATUS } from "@/services/curriculum.service";

const STATUS_COLORS: Record<string, string> = {
    [CURRICULUM_STATUS.DRAFT]: "text-zinc-600 bg-zinc-50 border-zinc-200",
    [CURRICULUM_STATUS.STRUCTURE_REVIEW]: "text-blue-600 bg-blue-50 border-blue-100",
    [CURRICULUM_STATUS.STRUCTURE_APPROVED]: "text-emerald-600 bg-emerald-50 border-emerald-100",
    [CURRICULUM_STATUS.SYLLABUS_DEVELOP]: "text-indigo-600 bg-indigo-50 border-indigo-100",
    [CURRICULUM_STATUS.FINAL_REVIEW]: "text-amber-600 bg-amber-50 border-amber-100",
    [CURRICULUM_STATUS.SIGNED]: "text-emerald-600 bg-emerald-50 border-emerald-100",
    [CURRICULUM_STATUS.PUBLISHED]: "text-emerald-600 bg-emerald-50 border-emerald-100",
    [CURRICULUM_STATUS.ARCHIVED]: "text-red-600 bg-red-50 border-red-100",
};

export default function CurriculumsManagement({
    initialData = [],
    initialTotalPages = 0,
    initialTotalElements = 0,
    currentPage = 0,
    currentSearch = "",
    currentStatus = "",
    error = null
}: {
    initialData?: CurriculumFramework[];
    initialTotalPages?: number;
    initialTotalElements?: number;
    currentPage?: number;
    currentSearch?: string;
    currentStatus?: string;
    error?: string | null;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [isStatusOpen, setIsStatusOpen] = useState(false);
    
    // For smooth typing without immediate re-renders
    const [localSearch, setLocalSearch] = useState(currentSearch);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updateUrlParams = (changes: { page?: number, search?: string, status?: string }) => {
        const params = new URLSearchParams(searchParams.toString());
        
        if (changes.search !== undefined) {
            if (changes.search) params.set('search', changes.search);
            else params.delete('search');
        }
        
        if (changes.status !== undefined) {
            if (changes.status) params.set('status', changes.status);
            else params.delete('status');
        }
        
        if (changes.page !== undefined) {
            params.set('page', changes.page.toString());
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    const handleFilterChange = (status: string) => {
        setIsStatusOpen(false);
        updateUrlParams({ status, page: 0 });
    };

    const handleSearchChange = (val: string) => {
        setLocalSearch(val);
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        
        debounceTimerRef.current = setTimeout(() => {
            updateUrlParams({ search: val, page: 0 });
        }, 500);
    };

    const handlePageChange = (newPage: number) => {
        updateUrlParams({ page: newPage });
    };

    interface StatusTab {
        label: string;
        value: string;
        statuses?: string[];
    }

    const TABS: StatusTab[] = [
        { label: "All", value: "" },
        { label: "Draft", value: CURRICULUM_STATUS.DRAFT },
        { label: "Structure Review", value: CURRICULUM_STATUS.STRUCTURE_REVIEW },
        { label: "Structure Approved", value: CURRICULUM_STATUS.STRUCTURE_APPROVED },
        { label: "Syllabus Develop", value: CURRICULUM_STATUS.SYLLABUS_DEVELOP },
        { label: "Final Review", value: CURRICULUM_STATUS.FINAL_REVIEW },
        { label: "Signed", value: CURRICULUM_STATUS.SIGNED },
        { label: "Published", value: CURRICULUM_STATUS.PUBLISHED },
        { label: "Archived", value: CURRICULUM_STATUS.ARCHIVED },
    ];

    const handleTabChange = (status: string) => {
        updateUrlParams({ status, page: 0 });
    };

    return (
        <div className="min-h-screen bg-zinc-50/50">
            {/* Sticky Header */}
            <div className="px-8 py-6 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                         <Layers size={20} />
                    </div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">
                        Curriculum Frameworks
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 active:scale-95 flex items-center gap-2 group"
                        onClick={() => router.push('/dashboard/hocfdc/curriculums/new')}
                    >
                        <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                        New Curriculum
                    </button>
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400">
                         <Target size={18} />
                    </div>
                </div>
            </div>

            {/* Shopee-style Search & Status Tabs */}
            <div className="bg-white border-b border-zinc-100 sticky top-[89px] z-20">
                <div className="max-w-[1600px] mx-auto px-8">
                    {/* Status Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar relative">
                        {TABS.map((tab) => {
                            const isActive = currentStatus === tab.value;
                            return (
                                <button
                                    key={tab.label}
                                    onClick={() => handleTabChange(tab.value)}
                                    className={`relative px-8 py-5 text-[11px] font-black uppercase tracking-widest transition-colors whitespace-nowrap min-w-[120px] ${
                                        isActive ? "text-primary" : "text-zinc-400 hover:text-zinc-600"
                                    }`}
                                >
                                    {tab.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="tab-indicator"
                                            className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Bar */}
                    <div className="py-4 border-t border-zinc-50 flex items-center gap-4">
                         <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
                            <input
                                type="text"
                                placeholder="Search framework code, name, major..."
                                value={localSearch}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-4 focus:ring-primary/5 transition-all outline-none"
                            />
                         </div>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8 max-w-[1400px] mx-auto min-h-screen">

                <AnimatePresence mode="wait">
                    {error ? (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-32 text-red-400 w-full"
                        >
                            <AlertCircle className="mb-4" size={32} />
                            <p className="font-black text-[10px] uppercase tracking-widest mb-4 text-center max-w-xs">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors"
                            >
                                <RefreshCw size={14} />
                                Retry Connection
                            </button>
                        </motion.div>
                    ) : (
                        <div className="space-y-12">
                        <div className="space-y-6">
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col gap-6"
                            >
                                <AnimatePresence mode="popLayout">
                                    {initialData.map((curriculum, idx) => (
                                        <motion.div
                                            key={curriculum.curriculumId}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="bg-white rounded-[2rem] border border-zinc-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-zinc-200 transition-all duration-500 group cursor-default"
                                        >
                                            {/* Card Header */}
                                            <div className="px-8 py-4 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/30">
                                                <div className="flex items-center gap-2">
                                                     <GraduationCap size={16} className="text-zinc-400" />
                                                     <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{curriculum.major?.majorName || "Standard Division"}</span>
                                                </div>
                                                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${STATUS_COLORS[curriculum.status] || STATUS_COLORS.DRAFT}`}>
                                                    {curriculum.status.replace(/_/g, " ")}
                                                </div>
                                            </div>

                                            {/* Card Body */}
                                            <div className="p-8 flex items-center gap-8">
                                                <div className="w-20 h-20 rounded-[1.5rem] bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary/5 group-hover:text-primary transition-all shrink-0">
                                                     <BookOpen size={32} strokeWidth={1.5} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-xs font-black text-primary uppercase tracking-[0.2em]">{curriculum.curriculumCode}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-zinc-900 leading-tight tracking-tight group-hover:text-primary transition-colors truncate mb-3">
                                                        {curriculum.curriculumName}
                                                    </h3>
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-zinc-300" />
                                                            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">{curriculum.startYear} — {curriculum.endYear} Term</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">120 Total Credits</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            {curriculum.status !== CURRICULUM_STATUS.DRAFT && (
                                                                <button 
                                                                    className="px-6 py-2.5 bg-zinc-50 text-zinc-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white hover:shadow-xl hover:shadow-zinc-200 transition-all border border-zinc-100 flex items-center gap-2"
                                                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/hocfdc/curriculums/${curriculum.curriculumId}`); }}
                                                                >
                                                                    <Eye size={14} />
                                                                    View Curriculum
                                                                </button>
                                                            )}
                                                            {curriculum.status === CURRICULUM_STATUS.DRAFT && (
                                                                <button 
                                                                    className="px-8 py-2.5 bg-zinc-100 text-zinc-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all shadow-lg flex items-center gap-2 group/btn"
                                                                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/hocfdc/curriculums/${curriculum.curriculumId}`); }}
                                                                >
                                                                    <PencilLine size={14} />
                                                                    Edit Builder 
                                                                    <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                    ))}
                                    {initialData.length === 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="py-20 text-center text-zinc-300"
                                        >
                                            <BookOpen size={32} strokeWidth={1} className="mx-auto mb-3" />
                                            <p className="font-black text-[10px] uppercase tracking-widest">No frameworks match your search</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                            {/* Pagination */}
                            {initialTotalPages > 1 && (
                                <div className="flex items-center justify-between pt-8 border-t border-zinc-100">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                        Showing <span className="text-zinc-900">{initialData.length}</span> of <span className="text-zinc-900">{initialTotalElements}</span> Frameworks
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            disabled={currentPage === 0}
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            className="w-10 h-10 rounded-xl border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <div className="flex gap-1">
                                            {[...Array(initialTotalPages)].map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handlePageChange(i)}
                                                    className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${currentPage === i
                                                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                            : "border border-zinc-100 text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900"
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            disabled={currentPage === initialTotalPages - 1}
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            className="w-10 h-10 rounded-xl border border-zinc-100 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
