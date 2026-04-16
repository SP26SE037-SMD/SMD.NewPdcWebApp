"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    ChevronLeft, 
    Network, 
    Search, 
    Plus, 
    Loader2, 
    Building2, 
    BookOpen, 
    Layers, 
    X,
    Filter,
    LayoutGrid,
    ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SubjectService } from '@/services/subject.service';
import PrerequisiteTree from './PrerequisiteTree';
import { DepartmentWhiteboard } from './DepartmentWhiteboard';
import { cn } from '@/lib/utils';

export default function PrerequisiteManagement() {
    const router = useRouter();
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
            } finally {
                setIsLoadingDepts(false);
            }
        };
        fetchDepts();
    }, []);

    // Fetch Subjects when selectedDeptId changes
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
        <div className="h-[calc(100vh-80px)] flex bg-white overflow-hidden">
            {/* Sidebar: Departments */}
            <div className="w-72 border-r border-zinc-100 flex flex-col bg-zinc-50/30">
                <div className="p-6 border-b border-zinc-100 space-y-4">
                    <button
                        onClick={() => router.push("/dashboard/hocfdc")}
                        className="flex items-center gap-2 text-primary font-bold text-xs hover:gap-3 transition-all"
                    >
                        <ChevronLeft size={16} />
                        Dashboard
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 tracking-tight">Catalog.</h2>
                        <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">Navigate by Dept.</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {isLoadingDepts ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2 opacity-50">
                            <Loader2 className="animate-spin text-primary" size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Syncing Registry...</span>
                        </div>
                    ) : (
                        departments.map(dept => (
                            <button
                                key={dept.departmentId}
                                onClick={() => setSelectedDeptId(dept.departmentId)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all group",
                                    selectedDeptId === dept.departmentId 
                                        ? "bg-white border border-zinc-100 shadow-sm text-primary" 
                                        : "text-zinc-500 hover:bg-white hover:text-zinc-900"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                                    selectedDeptId === dept.departmentId ? "bg-primary/10" : "bg-zinc-100 group-hover:bg-zinc-200"
                                )}>
                                    <Building2 size={14} strokeWidth={selectedDeptId === dept.departmentId ? 3 : 2} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black truncate uppercase tracking-tight">{dept.departmentName}</p>
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{dept.departmentCode}</p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content: Subject Grid */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Header */}
                <div className="h-20 border-b border-zinc-100 px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <div className="space-y-0.5">
                            <h2 className="text-lg font-black text-zinc-900 tracking-tight flex items-center gap-2">
                                <LayoutGrid className="text-primary" size={18} />
                                {getSelectedDeptName()}
                            </h2>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Viewing {filteredSubjects.length} Registered Modules</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-100" />
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={14} />
                            <input 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Quick filter subjects..."
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-xl py-2 pl-9 pr-3 text-[10px] font-bold uppercase tracking-wider outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white transition-all shadow-inner"
                            />
                        </div>
                        <button 
                            onClick={() => setIsInitModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-lg shadow-primary/20"
                        >
                            <Plus size={16} strokeWidth={3} />
                            Add Subject
                        </button>
                    </div>
                    </div>
                </div>

                {/* Whiteboard */}
                <div className="flex-1 relative overflow-hidden bg-zinc-50/30">
                    <AnimatePresence mode="wait">
                        {isLoadingSubjects ? (
                            <motion.div 
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-50/50 z-10"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                                    <Loader2 className="relative animate-spin text-primary" size={32} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rendering Department Cartography...</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="whiteboard"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
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
                </div>
            </div>

            {/* Full-screen Architect Mode Overlay */}
            <AnimatePresence>
                {activeSubject && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-white flex flex-col"
                    >
                        {/* Overlay Header */}
                        <div className="h-20 border-b border-zinc-100 px-8 flex items-center justify-between shrink-0 bg-white shadow-sm z-50">
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => setActiveSubject(null)}
                                    className="w-10 h-10 rounded-xl bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 flex items-center justify-center transition-all"
                                >
                                    <X size={20} />
                                </button>
                                <div className="h-8 w-px bg-zinc-100" />
                                <div>
                                    <h2 className="text-base font-black text-zinc-900 tracking-tight flex items-center gap-3 uppercase">
                                        <Network className="text-primary" size={20} />
                                        Architect Mode
                                        <span className="text-zinc-200">/</span>
                                        <span className="text-primary">{activeSubject.code}</span>
                                    </h2>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-0.5">{activeSubject.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden md:flex flex-col items-end mr-4">
                                    <p className="text-[10px] font-black text-zinc-900 uppercase tracking-widest">Drafting Registry</p>
                                    <p className="text-[8px] font-bold text-green-500 uppercase tracking-[0.2em]">All Changes Sync on Connect</p>
                                </div>
                                <button 
                                    onClick={() => setActiveSubject(null)}
                                    className="px-6 py-3 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 shadow-xl transition-all"
                                >
                                    Finalize & Close
                                </button>
                            </div>
                        </div>

                        {/* Editor Area */}
                        <div className="flex-1 relative overflow-auto bg-zinc-50/30">
                            <PrerequisiteTree initialSubjectId={activeSubject.id} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Initialization Modal */}
            <AnimatePresence>
                {isInitModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsInitModalOpen(false)}
                            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-zinc-100 overflow-hidden"
                        >
                            <div className="p-8 border-b border-zinc-50 bg-zinc-50/50">
                                <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-6 flex items-center gap-3">
                                    <Network size={20} className="text-primary" />
                                    Initiate Tree Architecture
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                                    <input 
                                        autoFocus
                                        value={initSearchQuery}
                                        onChange={e => setInitSearchQuery(e.target.value)}
                                        className="w-full bg-white border border-zinc-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold shadow-sm focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        placeholder="Find subject to manage..."
                                    />
                                    {isInitSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-primary" size={18} />}
                                </div>
                            </div>
                            
                            <div className="p-4 max-h-[400px] overflow-y-auto">
                                <div className="space-y-2">
                                    {initSearchResults.map(sub => (
                                        <button
                                            key={sub.subjectId}
                                            onClick={() => {
                                                setActiveSubject({ id: sub.subjectId, code: sub.subjectCode, name: sub.subjectName });
                                                setIsInitModalOpen(false);
                                                setInitSearchQuery("");
                                            }}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-zinc-50 rounded-xl flex items-center justify-center font-black text-[9px] text-zinc-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                                    {sub.subjectCode.substring(0, 3)}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{sub.subjectCode}</p>
                                                    <p className="text-sm font-bold text-zinc-900">{sub.subjectName}</p>
                                                </div>
                                            </div>
                                            <Plus size={18} className="text-zinc-200 group-hover:text-primary group-hover:scale-110 transition-all" />
                                        </button>
                                    ))}
                                    {initSearchQuery.length >= 2 && initSearchResults.length === 0 && !isInitSearching && (
                                        <div className="text-center py-12 opacity-50">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">No modules found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
