"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    Loader2, 
    AlertCircle, 
    Plus, 
    Search, 
    Trash2, 
    ChevronRight, 
    BookOpen,
    ArrowRight,
    ArrowLeftRight,
    X,
    Link as LinkIcon
} from 'lucide-react';
import { SubjectService } from '@/services/subject.service';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TreeDirection = 'requirements' | 'dependents';

interface PrerequisiteNodeProps {
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    isMandatory?: boolean;
    level: number;
    readOnly?: boolean;
    direction: TreeDirection;
    onDeleteRelation: (relationId: string) => void;
    relationId?: string;
}

const PrerequisiteNode = ({ 
    subjectId, 
    subjectCode, 
    subjectName, 
    isMandatory = true,
    level, 
    readOnly,
    direction,
    onDeleteRelation,
    relationId
}: PrerequisiteNodeProps) => {
    const [isExpanded, setIsExpanded] = useState(level === 0);
    const [children, setChildren] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Inline Search States
    const [showInlineSearch, setShowInlineSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    const fetchChildren = useCallback(async () => {
        if (hasLoaded || loading) return;
        setLoading(true);
        try {
            const resp = direction === 'requirements' 
                ? await SubjectService.getPrerequisites(subjectId)
                : await SubjectService.getDependents(subjectId);
            setChildren(resp.data || []);
            setHasLoaded(true);
        } catch (err) {
            console.error(`Failed to fetch ${direction} for`, subjectCode, err);
        } finally {
            setLoading(false);
        }
    }, [subjectId, subjectCode, hasLoaded, loading, direction]);

    useEffect(() => {
        if (isExpanded && !hasLoaded) {
            fetchChildren();
        }
    }, [isExpanded, hasLoaded, fetchChildren]);

    // Direction change should reset
    useEffect(() => {
        if (level === 0) {
            setHasLoaded(false);
            setChildren([]);
            fetchChildren();
        }
    }, [direction, level, fetchChildren]);

    // Search logic
    useEffect(() => {
        const delaySearch = setTimeout(async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const resp = await SubjectService.getSubjects({ search: searchQuery, size: 5 });
                setSearchResults(resp.data?.content || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchQuery]);

    // Handle outside click for inline search
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowInlineSearch(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleQuickAdd = async (targetSubject: any) => {
        try {
            setLoading(true);
            const payload = direction === 'requirements' 
                ? { subjectId: subjectId, prerequisiteSubjectId: targetSubject.subjectId, isMandatory: true }
                : { subjectId: targetSubject.subjectId, prerequisiteSubjectId: subjectId, isMandatory: true };
                
            await SubjectService.addPrerequisite(payload);
            setShowInlineSearch(false);
            setSearchQuery("");
            // Force reload children
            setHasLoaded(false);
            setIsExpanded(true);
            fetchChildren();
        } catch (err: any) {
            alert(err.message || "Failed to establish registry link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-8 relative">
            {/* Horizontal Line from Parent */}
            {level > 0 && (
                <div className="absolute left-[-2rem] top-1/2 -translate-y-1/2 w-8 h-[2px] bg-zinc-200" />
            )}

            <div className="shrink-0 relative">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "group flex flex-col w-64 p-5 rounded-2xl border transition-all duration-300 relative z-10",
                        level === 0 
                            ? "bg-zinc-900 border-zinc-800 shadow-xl" 
                            : "bg-white border-zinc-200 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-50"
                    )}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className={cn(
                            "px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase",
                            level === 0 ? "bg-primary-500 text-white" : "bg-zinc-100 text-zinc-500 group-hover:bg-primary-50 group-hover:text-primary-600"
                        )}>
                            {subjectCode}
                        </div>
                        {level > 0 && (
                            <span className={cn(
                                "text-[9px] font-bold uppercase tracking-widest",
                                isMandatory ? "text-red-500" : "text-zinc-400"
                            )}>
                                {isMandatory ? "Req." : "Opt."}
                            </span>
                        )}
                    </div>

                    <h4 className={cn(
                        "text-sm font-bold leading-tight mb-4",
                        level === 0 ? "text-white" : "text-zinc-900"
                    )}>
                        {subjectName}
                    </h4>

                    {hasLoaded && children.length > 0 && (
                        <div className="mt-auto pt-4 border-t border-zinc-100/10">
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                level === 0 ? "text-zinc-400" : "text-zinc-400"
                            )}>
                                {children.length} {direction === 'requirements' ? 'Requirements' : 'Dependents'}
                            </span>
                        </div>
                    )}

                    {/* Node Actions Overlay */}
                    <div className={cn(
                        "absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-2 transition-all",
                        !readOnly ? "opacity-0 group-hover:opacity-100" : "opacity-0"
                    )}>
                        {!readOnly && (
                            <button 
                                onClick={() => setShowInlineSearch(!showInlineSearch)}
                                className="w-8 h-8 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                title={`Add ${direction === 'requirements' ? 'Requirement' : 'Dependent'}`}
                            >
                                <Plus size={16} strokeWidth={3} />
                            </button>
                        )}
                        {relationId && !readOnly && (
                            <button 
                                onClick={() => onDeleteRelation(relationId)}
                                className="w-8 h-8 rounded-full bg-red-100 text-red-600 shadow-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                                title="Sever Link"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {/* Expand/Collapse Button */}
                    {hasLoaded && children.length > 0 && (
                        <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={cn(
                                "absolute -right-3 bottom-4 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all",
                                level === 0 ? "bg-white text-zinc-900" : "bg-zinc-100 text-zinc-600 hover:bg-primary-100 hover:text-primary-600",
                                isExpanded ? "rotate-180" : "rotate-0"
                            )}
                        >
                            <ChevronRight size={14} />
                        </button>
                    )}
                </motion.div>

                {/* Inline Search Popup */}
                <AnimatePresence>
                    {showInlineSearch && (
                        <motion.div 
                            ref={searchRef}
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 30 }}
                            exit={{ opacity: 0, scale: 0.9, x: 20 }}
                            className="absolute left-full top-0 w-80 bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-zinc-200 z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
                                <LinkIcon size={16} className="text-primary-500" />
                                <input 
                                    autoFocus
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={`Search ${direction}...`}
                                    className="flex-1 bg-transparent border-none outline-none text-xs font-bold"
                                />
                                {isSearching ? <Loader2 size={14} className="animate-spin text-zinc-400" /> : <X size={14} className="text-zinc-400 cursor-pointer" onClick={() => setShowInlineSearch(false)} />}
                            </div>
                            <div className="max-h-[300px] overflow-y-auto p-2">
                                {searchResults.map(sub => (
                                    <button
                                        key={sub.subjectId}
                                        onClick={() => handleQuickAdd(sub)}
                                        className="w-full p-3 rounded-xl hover:bg-primary-50 flex items-center justify-between group transition-all text-left"
                                    >
                                        <div>
                                            <p className="text-[10px] font-black text-primary-500 uppercase">{sub.subjectCode}</p>
                                            <p className="text-xs font-bold text-zinc-900 truncate max-w-[200px]">{sub.subjectName}</p>
                                        </div>
                                        <Plus size={14} className="text-zinc-300 group-hover:text-primary-600" />
                                    </button>
                                ))}
                                {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
                                    <div className="p-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                        No matches found
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Children Rendered Vertically inline with horizontal flow */}
            <AnimatePresence>
                {isExpanded && children.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-6 relative py-4"
                    >
                        {/* Vertical Connector Line for siblings connecting to parent horizontal line */}
                        <div className="absolute left-[-2rem] top-[50%] -translate-y-1/2 h-[calc(100%-4rem)] w-[2px] bg-zinc-200" />

                        {children.map((child: any) => (
                            <PrerequisiteNode 
                                key={child.id}
                                subjectId={direction === 'requirements' ? child.prerequisiteSubjectId : child.subjectId}
                                subjectCode={direction === 'requirements' ? child.prerequisiteSubjectCode : child.subjectCode}
                                subjectName={direction === 'requirements' ? child.prerequisiteSubjectName : child.subjectName}
                                isMandatory={child.isMandatory}
                                level={level + 1}
                                readOnly={readOnly}
                                direction={direction}
                                onDeleteRelation={onDeleteRelation}
                                relationId={child.prerequisiteId || child.id}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

interface PrerequisiteTreeProps {
    initialSubjectId?: string;
    readOnly?: boolean;
}

export default function PrerequisiteTree({ initialSubjectId, readOnly = false }: PrerequisiteTreeProps) {
    const [mainSubject, setMainSubject] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [treeDirection, setTreeDirection] = useState<TreeDirection>('requirements');

    const fetchMainSubject = useCallback(async (sid: string) => {
        setLoading(true);
        try {
            const resp = await SubjectService.getSubjectById(sid);
            setMainSubject(resp.data);
            setError(null);
        } catch (err) {
            setError("Failed to resolve base module");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialSubjectId) {
            fetchMainSubject(initialSubjectId);
        }
    }, [initialSubjectId, fetchMainSubject]);

    const handleDeleteRelation = async (relationId: string) => {
        if (confirm("Sever dependency link? This will update the official registry.")) {
            try {
                await SubjectService.deletePrerequisite(relationId);
                // We could do a full force reload or optimistic update here.
                // For simplicity, re-fetch main subject so tree re-renders if level 0 changed.
                // Note: deeper nodes will not auto-refresh unless we pass a forced refresh key.
                // Adding a key to PrerequisiteNode based on relation updates would force it.
                if (initialSubjectId) fetchMainSubject(initialSubjectId);
            } catch (err: any) {
                alert(err.message || "Failed to sever link");
            }
        }
    };

    if (loading && !mainSubject) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-white/50 backdrop-blur-sm">
                <Loader2 className="animate-spin text-primary-500" size={32} />
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Resolving Hierarchy...</p>
            </div>
        );
    }

    if (error || !mainSubject) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 text-center bg-zinc-50/50">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                    <AlertCircle size={24} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-zinc-900">Chain Broken</h3>
                    <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider mt-1">{error || "Select a module to view lineage"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-12 bg-zinc-50/50 overflow-auto">
            <div className="min-w-max">
                <div className="flex items-center justify-between mb-16 sticky left-0">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
                            <BookOpen className="text-primary-500" size={24} />
                            Hierarchy Architect
                        </h2>
                        <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">Linear Dependency Tracking Interface</p>
                    </div>

                    {/* Tree Direction Toggle */}
                    <div className="flex bg-white rounded-xl shadow-sm border border-zinc-200 p-1">
                        <button
                            onClick={() => setTreeDirection('requirements')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                treeDirection === 'requirements' ? "bg-primary-500 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
                            )}
                        >
                            <ArrowLeftRight size={14} className="opacity-50" />
                            Requirements
                        </button>
                        <button
                            onClick={() => setTreeDirection('dependents')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                treeDirection === 'dependents' ? "bg-emerald-500 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
                            )}
                        >
                            Dependents
                            <ArrowRight size={14} className="opacity-50" />
                        </button>
                    </div>
                </div>

                <div className="pb-20">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={treeDirection}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 30 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        >
                            <PrerequisiteNode 
                                subjectId={mainSubject.subjectId}
                                subjectCode={mainSubject.subjectCode}
                                subjectName={mainSubject.subjectName}
                                level={0}
                                direction={treeDirection}
                                readOnly={readOnly}
                                onDeleteRelation={handleDeleteRelation}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
