"use client";

import { useState, useEffect } from "react";
import {
    ChevronRight, Check, Info, Target, Link, Save,
    Plus, X, Loader2, Search, Filter, Layers,
    ArrowRight, Scale, Library, Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SubjectService } from "@/services/subject.service";
import { CurriculumSubject } from "@/services/curriculum.service";
import { GroupService, GroupRequest } from "@/services/group.service";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";

export default function ElectiveManagement() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState<CurriculumSubject[]>([]);

    // UI Filters
    const [search, setSearch] = useState("");
    const [creditFilter, setCreditFilter] = useState<string>("ALL");

    const router = useRouter();

    const [formData, setFormData] = useState<GroupRequest>({
        groupCode: "",
        groupName: "",
        description: "",
        type: "ELECTIVE"
    });

    const [globalSemester, setGlobalSemester] = useState<number>(1);
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

    useEffect(() => {
        const fetchSubjects = async () => {
            try {
                const resp = await SubjectService.getSubjects({ search: "" });
                setAvailableSubjects(resp.data.content);
            } catch (err) {
                console.error("Failed to load subjects", err);
            }
        };
        fetchSubjects();
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const resp = await GroupService.createGroup(formData);
            if (resp.data?.groupId) {
                if (selectedSubjects.length > 0) {
                    for (const subjectId of selectedSubjects) {
                        try {
                            await CurriculumGroupSubjectService.addSubject({
                                curriculumId: null,
                                groupId: resp.data.groupId,
                                subjectId: subjectId,
                                semester: globalSemester
                            });
                        } catch (err) {
                            console.error("Failed to map subject to elective", err);
                        }
                    }
                }
                router.push(`/dashboard/hocfdc/electives/${resp.data.groupId}`);
            } else {
                router.push("/dashboard/hocfdc/electives");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleSubject = (id: string) => {
        setSelectedSubjects(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    // Derived State
    const filteredSubjects = availableSubjects.filter(sub => {
        const matchesSearch = sub.subjectName.toLowerCase().includes(search.toLowerCase()) ||
            sub.subjectCode.toLowerCase().includes(search.toLowerCase());
        const matchesCredits = creditFilter === "ALL" || sub.credits.toString() === creditFilter;
        return matchesSearch && matchesCredits;
    });

    // Extract unique credits for the filter dropdown
    const availableCredits = Array.from(new Set(availableSubjects.map(s => s.credits))).sort((a, b) => a - b);

    return (
        <div className="max-w-7xl mx-auto py-10 px-8">
            <div className="flex justify-between items-end mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500/50">
                        <Scale size={12} />
                        Flexible Track Design
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Elective Management.</h1>
                    <p className="text-sm text-zinc-500 font-medium">Design elective groups using the Group registry architecture.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-all">
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-emerald-100 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Establish Elective Group
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* Left Panel: Configuration */}
                <div className="col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-xl space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <Info size={14} /> Group Identity
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Elective Code</label>
                            <input
                                value={formData.groupCode}
                                onChange={e => setFormData({ ...formData, groupCode: e.target.value })}
                                placeholder="e.g. ELEC-001"
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Elective Name</label>
                            <input
                                value={formData.groupName}
                                onChange={e => setFormData({ ...formData, groupName: e.target.value })}
                                placeholder="e.g. Humanities Electives"
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Elective Description</label>
                            <textarea
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Academic purpose of this elective group..."
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-600/20 text-white space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                            <Calendar size={14} /> Global Mapping
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-emerald-100 ml-1">Target Semester</label>
                            <input
                                type="number"
                                min={1}
                                max={9}
                                value={globalSemester}
                                onChange={e => setGlobalSemester(parseInt(e.target.value) || 1)}
                                className="w-full bg-emerald-700/50 border border-emerald-500 rounded-xl py-3 px-4 text-sm font-bold placeholder-emerald-300 focus:ring-2 focus:ring-white outline-none"
                            />
                            <p className="text-[10px] text-emerald-200 mt-2 font-medium">All subjects configured in this pool will automatically be assigned to this semester.</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Pool Management */}
                <div className="col-span-8 bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-zinc-50 flex flex-col gap-6 bg-zinc-50/30">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-zinc-900">Candidate Pool</h3>
                                <p className="text-xs text-zinc-500">Select subjects eligible for this elective group.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search subject code or name..."
                                    className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all"
                                />
                            </div>

                            <div className="relative w-48 shrink-0">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                                <select
                                    value={creditFilter}
                                    onChange={(e) => setCreditFilter(e.target.value)}
                                    className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%239CA3AF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')", backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem top 50%", backgroundSize: "0.65rem auto" }}
                                >
                                    <option value="ALL">All Credits</option>
                                    {availableCredits.map(c => (
                                        <option key={c} value={c}>{c} Credits</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            {filteredSubjects.map(subject => {
                                const isSelected = selectedSubjects.includes(subject.subjectId);
                                return (
                                    <div
                                        key={subject.subjectId}
                                        className={`group relative p-5 rounded-[2rem] border transition-all ${isSelected
                                                ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100"
                                                : "bg-white border-zinc-100 hover:border-emerald-100"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black border transition-colors ${isSelected ? "bg-white/20 border-white/20" : "bg-zinc-50 border-zinc-100"
                                                }`}>
                                                {subject.subjectCode}
                                            </div>
                                            <button
                                                onClick={() => toggleSubject(subject.subjectId)}
                                                className={`w-6 h-6 rounded-full flex outline-none items-center justify-center border-2 transition-colors cursor-pointer ${isSelected ? "bg-white border-white text-emerald-600 hover:brightness-110" : "border-zinc-200 group-hover:border-emerald-200 hover:bg-zinc-50"
                                                    }`}>
                                                {isSelected && <Check size={14} strokeWidth={3} />}
                                            </button>
                                        </div>
                                        <h4 className="text-xs font-black mb-1 cursor-pointer pr-4" onClick={() => !isSelected && toggleSubject(subject.subjectId)}>{subject.subjectName}</h4>
                                        <p className="text-[10px] opacity-70 mb-3 line-clamp-1">{subject.description}</p>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isSelected ? "bg-white/10" : "bg-zinc-100 text-zinc-500"}`}>
                                                {subject.credits} Credits required
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {filteredSubjects.length === 0 && (
                            <div className="text-center py-20">
                                <Layers size={32} className="mx-auto text-zinc-200 mb-4" />
                                <p className="text-zinc-400 font-bold mb-1">No modules found</p>
                                <p className="text-xs text-zinc-400">Try adjusting your filters.</p>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Library size={14} className="text-zinc-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pool Summary</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="text-[10px] font-black text-zinc-900 uppercase">
                                <span className="text-emerald-600">{selectedSubjects.length}</span> Candidate Modules
                            </p>
                            <ArrowRight size={14} className="text-zinc-300" />
                            <p className="text-[10px] font-black text-zinc-900 uppercase">
                                Global Semester <span className="text-emerald-600 text-sm">{globalSemester}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

