"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal, Target, Layers, GraduationCap, Building2, Clock, CheckCircle2, Loader2, AlertCircle, Save, X, Edit2, Info } from "lucide-react";
import { Subject, SubjectService, SUBJECT_STATUS } from "@/services/subject.service";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SubjectPrerequisiteRoadmap } from "./SubjectPrerequisiteRoadmap";

const STATUS_COLORS: Record<string, string> = {
    [SUBJECT_STATUS.DRAFT]: "text-zinc-600 bg-zinc-50 border-zinc-200",
    [SUBJECT_STATUS.DEFINED]: "text-blue-600 bg-blue-50 border-blue-100",
    [SUBJECT_STATUS.WAITING_SYLLABUS]: "text-indigo-600 bg-indigo-50 border-indigo-100",
    [SUBJECT_STATUS.PENDING_REVIEW]: "text-amber-600 bg-amber-50 border-amber-100",
    [SUBJECT_STATUS.COMPLETED]: "text-emerald-600 bg-emerald-50 border-emerald-100",
    [SUBJECT_STATUS.ARCHIVED]: "text-red-600 bg-red-50 border-red-100",
};

export default function SubjectDetail({ 
    id, 
    initialSubject,
    initialError 
}: { 
    id: string, 
    initialSubject?: Subject | null, 
    initialError?: string | null 
}) {
    const router = useRouter();
    const [subject, setSubject] = useState<Subject | null>(initialSubject || null);
    const [loading, setLoading] = useState(!initialSubject && !initialError);
    const [error, setError] = useState<string | null>(initialError || null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editFormData, setEditFormData] = useState<any>(null);
    const [departments, setDepartments] = useState<any[]>([]);

    const fetchSubject = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const response = await SubjectService.getSubjectById(id);
            setSubject(response.data);
            setError(null);
        } catch (error) {
            setError("Failed to load subject details");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        if (!initialSubject && !initialError) {
            fetchSubject();
        }
    }, [id, initialSubject, initialError]);

    useEffect(() => {
        if (isEditing && departments.length === 0) {
            const fetchDeps = async () => {
                try {
                    const resp = await SubjectService.getDepartments({ size: 100 });
                    setDepartments(resp.data?.content || []);
                } catch (error) {
                    console.error("Failed to fetch departments", error);
                }
            };
            fetchDeps();
        }
    }, [isEditing, departments.length]);

    const handleEditToggle = () => {
        if (!subject) return;
        if (isEditing) {
            setIsEditing(false);
        } else {
            setEditFormData({
                subjectCode: subject.subjectCode,
                subjectName: subject.subjectName,
                credits: subject.credits,
                degreeLevel: subject.degreeLevel,
                timeAllocation: subject.timeAllocation,
                description: subject.description,
                studentTasks: subject.studentTasks,
                scoringScale: subject.scoringScale,
                minToPass: subject.minToPass || 0,
                departmentId: subject.department?.departmentId || "",
                electiveId: "" // According to create payload
            });
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        if (!editFormData) return;
        setIsSaving(true);
        try {
            await SubjectService.updateSubject(id, editFormData);
            await fetchSubject(false); // Re-fetch without global loading state
            setIsEditing(false);
        } catch (error: any) {
            setError(error.message || "Failed to update subject");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-sm font-black uppercase tracking-widest text-zinc-400 animate-pulse">Establishing Connection...</p>
                </div>
            </div>
        );
    }

    if (error || !subject) {
        return (
            <div className="min-h-screen bg-zinc-50/50 flex items-center justify-center px-8">
                <div className="bg-white p-10 rounded-[2.5rem] border border-zinc-100 shadow-xl text-center space-y-6 max-w-md w-full">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto">
                        <AlertCircle size={40} />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Module Missing.</h2>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                            {error || "We couldn't find the subject details. It might have been relocated or your connection was interrupted."}
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/hocfdc/subjects")}
                        className="w-full py-4 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all shadow-lg shadow-zinc-200"
                    >
                        Back to Warehouse
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-zinc-100 px-8 py-6 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={() => router.push("/dashboard/hocfdc/subjects")}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
                        >
                            <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform" size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{subject.subjectCode}</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{subject.department?.departmentName}</span>
                            </div>
                            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">{subject.subjectName}</h1>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <span className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm border ${STATUS_COLORS[subject.status] || STATUS_COLORS.DRAFT}`}>
                                {subject.status.replace("_", " ")}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            {subject.status === SUBJECT_STATUS.DRAFT && (
                                <button
                                    onClick={handleEditToggle}
                                    className="px-6 py-3 bg-white border border-zinc-200 text-zinc-600 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-50 transition-all shadow-sm flex items-center gap-2"
                                >
                                    {isEditing ? <X size={14} /> : <Edit2 size={14} />}
                                    {isEditing ? "Cancel Edit" : "Edit Module"}
                                </button>
                            )}
                            {isEditing ? (
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-900 transition-all shadow-sm shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    Commit Changes
                                </button>
                            ) : (
                                <button className="px-6 py-3 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-900 transition-all shadow-sm shadow-primary/20">
                                    Publish Subject
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 mt-10">
                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div
                            key="edit-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-12 gap-8"
                        >
                            <div className="col-span-8 bg-white rounded-[2.5rem] border border-zinc-100 p-10 shadow-sm space-y-10">
                                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                    <Info className="text-primary" size={20} />
                                    Configure Module Parameters
                                </h2>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Subject Code</label>
                                        <input
                                            value={editFormData?.subjectCode}
                                            onChange={e => setEditFormData({ ...editFormData, subjectCode: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Credits</label>
                                        <input
                                            type="number"
                                            value={editFormData?.credits}
                                            onChange={e => setEditFormData({ ...editFormData, credits: parseInt(e.target.value) })}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Subject Name</label>
                                        <input
                                            value={editFormData?.subjectName}
                                            onChange={e => setEditFormData({ ...editFormData, subjectName: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Degree Level</label>
                                        <select
                                            value={editFormData?.degreeLevel}
                                            onChange={e => setEditFormData({ ...editFormData, degreeLevel: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        >
                                            <option value="Bachelor">Bachelor</option>
                                            <option value="Master">Master</option>
                                            <option value="Doctor">Doctor</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Department</label>
                                        <select
                                            value={editFormData?.departmentId}
                                            onChange={e => setEditFormData({ ...editFormData, departmentId: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        >
                                            {departments.map(dep => (
                                                <option key={dep.departmentId} value={dep.departmentId}>{dep.departmentName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Time Allocation</label>
                                        <input
                                            value={editFormData?.timeAllocation}
                                            onChange={e => setEditFormData({ ...editFormData, timeAllocation: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Scoring Scale</label>
                                            <input
                                                type="number"
                                                value={editFormData?.scoringScale}
                                                onChange={e => setEditFormData({ ...editFormData, scoringScale: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Min to Pass</label>
                                            <input
                                                type="number"
                                                value={editFormData?.minToPass}
                                                onChange={e => setEditFormData({ ...editFormData, minToPass: parseInt(e.target.value) })}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Description</label>
                                        <textarea
                                            rows={4}
                                            value={editFormData?.description}
                                            onChange={e => setEditFormData({ ...editFormData, description: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                                        />
                                    </div>

                                    <div className="col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Student Tasks</label>
                                        <textarea
                                            rows={3}
                                            value={editFormData?.studentTasks}
                                            onChange={e => setEditFormData({ ...editFormData, studentTasks: e.target.value })}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-4 space-y-6">
                                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-8 space-y-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm">
                                        <Info size={20} />
                                    </div>
                                    <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest">Draft Modification</h3>
                                    <p className="text-xs text-amber-600 font-medium leading-relaxed">
                                        You are editing a module in DRAFT status. Changes will be reflected immediately after committing. Ensure core parameters align with the academic syllabus.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="detail-view"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="grid grid-cols-12 gap-8"
                        >
                            {/* Left Column - Core Details */}
                            <div className="col-span-8 space-y-8">
                                {/* Description block */}
                                <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-10 shadow-sm space-y-6 relative overflow-hidden">
                                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                        <Target className="text-primary" size={20} />
                                        Core Overview
                                    </h2>
                                    <div className="space-y-4 relative z-10">
                                        <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                                            {subject.description}
                                        </p>
                                        <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Student Tasks</h4>
                                            <p className="text-xs text-zinc-700 leading-relaxed font-medium">
                                                {subject.studentTasks}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Config Block */}
                                <div className="grid grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm col-span-1">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-4">
                                            <Layers size={18} />
                                        </div>
                                        <h3 className="text-3xl font-black text-zinc-900 mb-1">{subject.credits}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Credits</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm col-span-1">
                                        <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-4">
                                            <Clock size={18} />
                                        </div>
                                        <h3 className="text-2xl font-black text-zinc-900 mb-1">{subject.timeAllocation}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Time Allocation</p>
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm col-span-1">
                                        <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-4">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <h3 className="text-2xl font-black text-zinc-900 mb-1">{subject.scoringScale}</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scoring Scale (Min {subject.minToPass ? subject.minToPass : 0})</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column - Relations */}
                            <div className="col-span-4 space-y-6">
                                <div className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm">
                                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6">Hierarchy</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Department</p>
                                            <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                                <Building2 size={16} className="text-primary" />
                                                <span className="text-xs font-bold text-zinc-900">{subject.department?.departmentName}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Degree Level</p>
                                            <div className="flex items-center gap-3 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                                                <GraduationCap size={16} className="text-emerald-500" />
                                                <span className="text-xs font-bold text-zinc-900">{subject.degreeLevel}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm">
                                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6">Strategic Mapping</h3>
                                    {(subject as any).mappingPLOs && (subject as any).mappingPLOs.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {(subject as any).mappingPLOs?.map((plo: any) => (
                                                <div key={plo} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                    {plo}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-zinc-500">No mapping PLOs found</p>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* Full Width Prerequisites */}
                            <div className="col-span-12 bg-white rounded-3xl border border-zinc-100 p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Prerequisites Chain</h3>
                                    <button 
                                        onClick={() => router.push("/dashboard/hocfdc/prerequisites")}
                                        className="text-[10px] font-black text-primary uppercase hover:underline"
                                    >
                                        Manage Tree
                                    </button>
                                </div>
                                
                                <div className="min-h-[500px] w-full bg-zinc-50 rounded-[2.5rem] border border-zinc-100 overflow-hidden relative">
                                    <SubjectPrerequisiteRoadmap initialSubjectId={subject.subjectId} />
                                </div>

                                {subject.preRequisite && subject.preRequisite.length > 0 && (
                                    <div className="mt-8 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-px flex-1 bg-zinc-100" />
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Registry Source</p>
                                            <div className="h-px flex-1 bg-zinc-100" />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {subject.preRequisite.map(item => (
                                                <div key={item.id} className="flex items-center gap-3 bg-zinc-50/50 p-3 rounded-2xl border border-zinc-100 hover:border-primary/20 transition-all group/item">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-[10px] font-black text-zinc-400 group-hover/item:bg-primary group-hover/item:text-white transition-all">
                                                        {item.prerequisiteSubjectCode.substring(0, 3)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">{item.prerequisiteSubjectCode}</p>
                                                        <p className="text-[11px] font-bold text-zinc-700 line-clamp-1">{item.prerequisiteSubjectName}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
