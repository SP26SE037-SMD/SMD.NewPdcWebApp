"use client";

import { useState, useEffect } from "react";
import {
    ChevronRight,
    Check,
    Info,
    Target,
    Link,
    Save,
    Plus,
    X,
    Loader2,
    LayoutGrid,
    Search,
    Filter,
    Layers,
    ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { GroupService, GroupRequest } from "@/services/group.service";
import { SubjectService } from "@/services/subject.service";
import { CurriculumSubject } from "@/services/curriculum.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";

export default function GroupManagement() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState<CurriculumSubject[]>([]);
    const [search, setSearch] = useState("");
    const router = useRouter();

    const [formData, setFormData] = useState<GroupRequest>({
        groupCode: "",
        groupName: "",
        description: "",
        type: "COMBO"
    });

    const [selectedSubjects, setSelectedSubjects] = useState<Array<{ subjectId: string; semester: number; }>>([]);

    useEffect(() => {
        const fetchSubjects = async () => {
            const resp = await SubjectService.getSubjects({ search: "" });
            setAvailableSubjects(resp.data.content);
        };
        fetchSubjects();
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const resp = await GroupService.createGroup(formData);
            if (resp.data?.groupId) {
                // Ignore subject array mapping for now as it uses a separate API
                if (selectedSubjects.length > 0) {
                    for (const s of selectedSubjects) {
                        try {
                            await CurriculumGroupSubjectService.addSubject({
                                curriculumId: null, // Server allows nullable now
                                groupId: resp.data.groupId,
                                subjectId: s.subjectId,
                                semester: s.semester
                            });
                        } catch (err) {
                            console.error("Failed to map subject to group", err);
                        }
                    }
                }
                router.push(`/dashboard/hocfdc/combos/${resp.data.groupId}`);
            } else {
                router.push("/dashboard/hocfdc/combos");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSubject = (id: string) => {
        setSelectedSubjects(prev =>
            prev.some(s => s.subjectId === id) ? prev.filter(s => s.subjectId !== id) : [...prev, { subjectId: id, semester: 1 }]
        );
    };

    const updateSemester = (id: string, semester: number) => {
        setSelectedSubjects(prev =>
            prev.map(s => s.subjectId === id ? { ...s, semester } : s)
        );
    };



    return (
        <div className="max-w-7xl mx-auto py-10 px-8">
            <div className="flex justify-between items-end mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/50">
                        <LayoutGrid size={12} />
                        Group Configuration
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Specialization Management.</h1>
                    <p className="text-sm text-zinc-500 font-medium">Create specialized subject tracks and curated selections.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-all">
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Establish Specialization
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* Left Panel: Configuration */}
                <div className="col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-xl space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <Info size={14} /> Basic Identity
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Group Code</label>
                            <input
                                value={formData.groupCode}
                                onChange={e => setFormData({ ...formData, groupCode: e.target.value })}
                                placeholder="e.g. CBO-001"
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Group Name</label>
                            <input
                                value={formData.groupName}
                                onChange={e => setFormData({ ...formData, groupName: e.target.value })}
                                placeholder="e.g. Full-stack Specialization"
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the purpose of this subject group..."
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Subject Selection */}
                <div className="col-span-8 bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/30">
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-zinc-900">Curated Selection</h3>
                            <p className="text-xs text-zinc-500">Pick subjects that form this specialized track.</p>
                        </div>
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Filter subjects..."
                                className="w-full bg-white border border-zinc-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            {availableSubjects.map(subject => {
                                const isSelected = selectedSubjects.some(s => s.subjectId === subject.subjectId);
                                const selectedData = selectedSubjects.find(s => s.subjectId === subject.subjectId);
                                return (
                                    <div
                                        key={subject.subjectId}
                                        className={`group relative p-5 rounded-[2rem] border transition-all ${isSelected
                                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                                            : "bg-white border-zinc-100 hover:border-indigo-100"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border transition-colors ${isSelected ? "bg-white/20 border-white/20" : "bg-zinc-50 border-zinc-100"
                                                }`}>
                                                {subject.subjectCode}
                                            </div>
                                            <button 
                                                onClick={() => toggleSubject(subject.subjectId)}
                                                className={`w-6 h-6 rounded-full flex outline-none items-center justify-center border-2 transition-colors cursor-pointer ${isSelected ? "bg-white border-white text-indigo-600 hover:bg-zinc-100" : "border-zinc-200 group-hover:border-indigo-200"
                                                }`}>
                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                            </button>
                                        </div>
                                        <h4 className="text-xs font-black mb-1 cursor-pointer" onClick={() => !isSelected && toggleSubject(subject.subjectId)}>{subject.subjectName}</h4>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSelected ? "bg-white/10" : "bg-zinc-100 text-zinc-500"}`}>
                                                {subject.credits} Credits
                                            </span>
                                            {isSelected && (
                                                <div className="flex items-center gap-2 bg-indigo-700/50 px-2 py-1 rounded-lg">
                                                    <span className="text-[10px] font-bold">Sem:</span>
                                                    <input 
                                                        type="number" 
                                                        min={1} 
                                                        max={9}
                                                        value={selectedData?.semester || 1}
                                                        onChange={(e) => updateSemester(subject.subjectId, parseInt(e.target.value) || 1)}
                                                        className="w-10 bg-transparent text-center outline-none text-[10px] font-black font-mono border-b border-indigo-400 focus:border-white transition-colors"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-zinc-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Selection Summary</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] font-black text-zinc-900 uppercase">
                                {selectedSubjects.length} <span className="text-zinc-400 font-bold">Subjects Selected</span>
                            </p>
                            <ArrowRight size={14} className="text-zinc-300" />
                            <p className="text-[10px] font-black text-zinc-900 uppercase">
                                <span className="text-indigo-600">~{selectedSubjects.length * 3}</span> Total Credits
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
