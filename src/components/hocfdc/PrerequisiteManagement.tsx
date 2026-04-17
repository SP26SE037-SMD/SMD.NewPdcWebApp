"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Loader2, 
    ChevronDown, 
    X,
    LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubjectService } from '@/services/subject.service';
import PrerequisiteTree from './PrerequisiteTree';
import { DepartmentWhiteboard } from './DepartmentWhiteboard';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export default function PrerequisiteManagement() {
    const router = useRouter();
    const { showToast } = useToast();
    const [departments, setDepartments] = useState<any[]>([]);
    const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [isLoadingDepts, setIsLoadingDepts] = useState(true);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [activeSubject, setActiveSubject] = useState<{ id: string, code: string, name: string } | null>(null);
    const [isInitModalOpen, setIsInitModalOpen] = useState(false);
    const [initSearchQuery, setInitSearchQuery] = useState("");
    const [initSearchResults, setInitSearchResults] = useState<any[]>([]);
    const [isInitSearching, setIsInitSearching] = useState(false);

    // Fetch Departments
    useEffect(() => {
        const fetchDepts = async () => {
            try {
                const resp = await SubjectService.getDepartments({ size: 100 });
                setDepartments(resp.data?.content || []);
                if (resp.data?.content?.length > 0 && !selectedDeptId) {
                    setSelectedDeptId(resp.data.content[0].departmentId);
                }
            } catch (err) {
                console.error("Failed to fetch departments", err);
                showToast("Failed to load departments", "error");
            } finally {
                setIsLoadingDepts(false);
            }
        };
        fetchDepts();
    }, []);

    // Search Subjects for Init Modal
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (initSearchQuery.trim().length < 2) {
                setInitSearchResults([]);
                return;
            }
            setIsInitSearching(true);
            try {
                const resp = await SubjectService.getSubjects({ search: initSearchQuery, size: 5 });
                setInitSearchResults(resp.data?.content || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsInitSearching(false);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [initSearchQuery]);

    // Fetch Subjects when selectedDeptId changes
    useEffect(() => {
        if (!selectedDeptId) return;
        const fetchSubjects = async () => {
            setIsLoadingSubjects(true);
            try {
                const resp = await SubjectService.getSubjects({ 
                    departmentId: selectedDeptId, 
                    size: 100
                });
                setSubjects(resp.data?.content || []);
            } catch (err) {
                console.error("Failed to fetch subjects", err);
            } finally {
                setIsLoadingSubjects(false);
            }
        };
        fetchSubjects();
    }, [selectedDeptId]);

    const filteredSubjects = subjects.filter(s => 
        s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getSelectedDeptName = () => {
        return departments.find(d => d.departmentId === selectedDeptId)?.departmentName || "All Modules";
    };

    return (
        <div className="h-[calc(100vh-64px)] flex bg-[#f8f9fa] overflow-hidden">
            {/* Sidebar: Departments (Catalog Style) */}
            <aside className="w-80 border-r border-[#ebeef0] flex flex-col bg-white shadow-sm z-10">
                <div className="p-8 border-b border-[#ebeef0]">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/50 mb-4">
                        <span className="material-symbols-outlined text-[14px]">account_tree</span>
                        Architecture
                    </div>
                    <h2 className="text-2xl font-black text-[#2d3335] tracking-tight">Catalog.</h2>
                    <p className="text-[10px] text-[#5a6062] font-bold uppercase tracking-widest mt-1">Navigate by Department</p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar">
                    {isLoadingDepts ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-4 opacity-50">
                            <Loader2 className="animate-spin text-primary" size={24} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#5a6062]">Syncing Registry...</span>
                        </div>
                    ) : (
                        departments.map(dept => (
                            <button
                                key={dept.departmentId}
                                onClick={() => setSelectedDeptId(dept.departmentId)}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 group",
                                    selectedDeptId === dept.departmentId 
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
                                        : "hover:bg-[#f1f4f5] text-[#5a6062] hover:text-[#2d3335]"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                    selectedDeptId === dept.departmentId ? "bg-white/20" : "bg-[#f1f4f5] group-hover:bg-white"
                                )}>
                                    <span className={cn(
                                        "material-symbols-outlined text-[20px]",
                                        selectedDeptId === dept.departmentId ? "text-white" : "text-[#5a6062]"
                                    )}>
                                        corporate_fare
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn(
                                        "text-xs font-black truncate uppercase tracking-tight",
                                        selectedDeptId === dept.departmentId ? "text-white" : "text-[#2d3335]"
                                    )}>{dept.departmentName}</p>
                                    <p className={cn(
                                        "text-[9px] font-bold uppercase tracking-widest mt-0.5",
                                        selectedDeptId === dept.departmentId ? "text-white/60" : "text-[#adb3b5]"
                                    )}>{dept.departmentCode}</p>
                                </div>
                                {selectedDeptId === dept.departmentId && (
                                    <motion.div layoutId="active-indicator">
                                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                    </motion.div>
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="p-6 mt-auto">
                    <div className="p-4 rounded-2xl bg-[#f1f4f5] border border-[#ebeef0]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#5a6062] mb-1">Status</p>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-[#2d3335]">Registry Connected</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content: Subject Architecture Canvas */}
            <main className="flex-1 flex flex-col relative">
                {/* Header */}
                <header className="h-24 px-10 border-b border-[#ebeef0] bg-white flex items-center justify-between shrink-0 z-10 transition-all">
                    <div className="flex items-center gap-8">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                <span className="material-symbols-outlined text-[14px]">grid_view</span>
                                {getSelectedDeptName()}
                            </div>
                            <h2 className="text-2xl font-black text-[#2d3335] tracking-tight">Curriculum Cartography.</h2>
                        </div>

                        <div className="h-10 w-px bg-[#ebeef0] hidden md:block" />

                        {/* Bento Style Search Bar */}
                        <div className="hidden lg:flex items-center gap-4 bg-[#f1f4f5] h-12 px-4 rounded-2xl border border-transparent focus-within:border-primary/20 focus-within:bg-white transition-all w-80 shadow-inner">
                            <span className="material-symbols-outlined text-[#adb3b5] text-[20px]">search</span>
                            <input 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="QUICK FILTER MODULES..."
                                className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest w-full outline-none placeholder:text-[#adb3b5] text-[#2d3335]"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <p className="text-[10px] font-black text-[#2d3335] uppercase tracking-widest">Department Scale</p>
                            <p className="text-[10px] font-bold text-[#5a6062] uppercase tracking-[0.2em]">{filteredSubjects.length} MODULES MAPPED</p>
                        </div>
                        <button 
                            onClick={() => setIsInitModalOpen(true)}
                            className="flex items-center gap-3 px-8 py-3.5 bg-gradient-to-br from-primary to-[#1f5e44] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'wght' 700" }}>add</span>
                            <span>Expand Grid</span>
                        </button>
                    </div>
                </header>

                {/* Whiteboard / Graph View Area */}
                <div className="flex-1 relative overflow-hidden bg-[#f8f9fa]">
                    <AnimatePresence mode="wait">
                        {isLoadingSubjects ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                </div>
                                <div className="text-center space-y-1">
                                    <span className="block text-xs font-black uppercase tracking-[0.3em] text-[#2d3335] animate-pulse">Initializing Mapping...</span>
                                    <span className="block text-[9px] font-bold uppercase tracking-widest text-[#5a6062]">Generating Hierarchical Grid</span>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="whiteboard"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="absolute inset-0"
                            >
                                <DepartmentWhiteboard 
                                    subjects={subjects} 
                                    searchQuery={searchQuery}
                                    onNodeClick={(subject) => setActiveSubject(subject)}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Legend / Info Floating Bento has been removed as per user request */}
                </div>

                {/* Architect Mode Full-screen Architect Overlay */}
                <AnimatePresence>
                    {activeSubject && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.05 }}
                            transition={{ type: "spring", damping: 30, stiffness: 300 }}
                            className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden"
                        >
                            {/* Overlay Header */}
                            <header className="h-24 border-b border-[#ebeef0] px-10 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-xl z-50">
                                <div className="flex items-center gap-8">
                                    <button 
                                        onClick={() => setActiveSubject(null)}
                                        className="w-14 h-14 rounded-2xl bg-[#f1f4f5] text-[#5a6062] hover:bg-primary hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm active:scale-90 group"
                                    >
                                        <span className="material-symbols-outlined text-[24px] group-hover:-rotate-90 transition-transform">close</span>
                                    </button>
                                    <div className="h-10 w-px bg-[#ebeef0]" />
                                    <div>
                                        <div className="flex items-center gap-3 mb-1">
                                            <div className="px-2 py-0.5 bg-primary/10 text-primary rounded text-[9px] font-black uppercase tracking-widest">Active Draft</div>
                                            <span className="text-[#adb3b5] text-[10px] font-bold uppercase tracking-widest">/ Architecture Mode</span>
                                        </div>
                                        <h2 className="text-xl font-black text-[#2d3335] tracking-tighter flex items-center gap-3 uppercase">
                                            <span className="text-primary">{activeSubject.code}</span>
                                            <span className="text-[#ebeef0] text-2xl font-light">|</span>
                                            <span className="max-w-md truncate">{activeSubject.name}</span>
                                        </h2>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                    <div className="hidden xl:flex flex-col items-end mr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            <p className="text-[10px] font-black text-[#2d3335] uppercase tracking-widest">Auto-Save Active</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-[#adb3b5] uppercase tracking-[0.2em]">Syncing to Central Registry</p>
                                    </div>
                                    <button 
                                        onClick={() => setActiveSubject(null)}
                                        className="px-10 py-4 bg-[#2d3335] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black shadow-2xl transition-all shadow-black/10 active:scale-95"
                                    >
                                        Finalize Architecture
                                    </button>
                                </div>
                            </header>

                            {/* Editor Area (Inner Canvas) */}
                            <div className="flex-1 relative bg-[#f8f9fa] overflow-hidden">
                                <PrerequisiteTree initialSubjectId={activeSubject.id} />
                            </div >
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Initialization Modal (Modern Style) */}
                <AnimatePresence>
                    {isInitModalOpen && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsInitModalOpen(false)}
                                className="absolute inset-0 bg-[#0c0f10]/60 backdrop-blur-md"
                            />
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden ring-1 ring-black/10"
                            >
                                <div className="p-10 border-b border-[#f1f4f5] bg-gradient-to-b from-[#f8f9fa] to-white">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                                                <span className="material-symbols-outlined text-[16px]">account_tree</span>
                                                Initiate Mapping
                                            </div>
                                            <h3 className="text-3xl font-black text-[#2d3335] tracking-tight">Expand Cartography.</h3>
                                        </div>
                                        <button 
                                            onClick={() => setIsInitModalOpen(false)}
                                            className="w-12 h-12 rounded-xl hover:bg-[#f1f4f5] text-[#adb3b5] hover:text-[#2d3335] transition-all flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined">close</span>
                                        </button>
                                    </div>

                                    <div className="relative group">
                                        <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-[#adb3b5] transition-colors group-focus-within:text-primary">
                                            search
                                        </span>
                                        <input 
                                            autoFocus
                                            value={initSearchQuery}
                                            onChange={e => setInitSearchQuery(e.target.value)}
                                            className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-2xl py-5 pl-16 pr-8 text-sm font-bold shadow-sm outline-none transition-all placeholder:text-[#adb3b5] text-[#2d3335]"
                                            placeholder="Find module by name or code..."
                                        />
                                        <AnimatePresence>
                                            {isInitSearching && (
                                                <motion.div 
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    className="absolute right-6 top-1/2 -translate-y-1/2 text-primary"
                                                >
                                                    <Loader2 className="animate-spin" size={20} />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                
                                <div className="p-4 max-h-[450px] overflow-y-auto custom-scrollbar">
                                    <div className="space-y-2 p-2">
                                        {initSearchResults.map(sub => (
                                            <button
                                                key={sub.subjectId}
                                                onClick={() => {
                                                    setActiveSubject({ id: sub.subjectId, code: sub.subjectCode, name: sub.subjectName });
                                                    setIsInitModalOpen(false);
                                                    setInitSearchQuery("");
                                                }}
                                                className="w-full flex items-center justify-between p-5 rounded-2xl border-2 border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 transition-all text-left group relative overflow-hidden active:scale-[0.98]"
                                            >
                                                <div className="flex items-center gap-6 relative z-10">
                                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center font-black text-[10px] text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                                        {sub.subjectCode.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-[#adb3b5] uppercase tracking-[0.2em] group-hover:text-primary transition-colors">{sub.subjectCode}</p>
                                                        <p className="text-base font-bold text-[#2d3335]">{sub.subjectName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <span className="material-symbols-outlined text-[#ebeef0] group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward</span>
                                                </div>
                                            </button>
                                        ))}
                                        
                                        {initSearchQuery.length >= 2 && initSearchResults.length === 0 && !isInitSearching && (
                                            <div className="text-center py-20 bg-[#f8f9fa] rounded-3xl border-2 border-dashed border-[#ebeef0]">
                                                <span className="material-symbols-outlined text-[48px] text-[#adb3b5] mb-4">search_off</span>
                                                <p className="text-xs font-black text-[#5a6062] uppercase tracking-[0.3em]">No Modules Found in Registry</p>
                                                <p className="text-[10px] text-[#adb3b5] font-bold uppercase tracking-widest mt-2">Try adjusting your search parameters</p>
                                            </div>
                                        )}
                                        
                                        {!initSearchQuery && (
                                            <div className="text-center py-20 opacity-30">
                                                <span className="material-symbols-outlined text-[64px]">account_tree</span>
                                                <p className="text-xs font-black uppercase tracking-[0.3em] mt-4">Registry Standby</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-8 bg-[#f8f9fa] border-t border-[#f1f4f5] flex justify-center">
                                    <p className="text-[10px] font-bold text-[#adb3b5] uppercase tracking-widest">SMD CURRICULUM ARCHITECTURE SYSTEM v2.0</p>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
