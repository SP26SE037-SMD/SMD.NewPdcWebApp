"use client";

import { useState, useEffect } from "react";
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Info,
    Target,
    Link,
    FileText,
    Eye,
    Save,
    Plus,
    X,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Upload,
    Download,
    BookOpen,
    Building2,
    Layers,
    Clock,
    GraduationCap,
    Sliders
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SubjectService } from "@/services/subject.service";
import { CurriculumSubject } from "@/services/curriculum.service";

export default function SubjectManagement() {
    const [activeTab, setActiveTab] = useState<'details' | 'strategic' | 'architecture' | 'import'>('details');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const router = useRouter();

    const [formData, setFormData] = useState<Partial<CurriculumSubject>>({
        subjectCode: "",
        subjectName: "",
        credits: 3,
        degreeLevel: "UNDERGRADUATE",
        timeAllocation: "3-0-6 (30-0-60)",
        description: "",
        studentTasks: "",
        scoringScale: 10,
        minToPass: 5,
        departmentId: "",
        mappingPLOs: [],
        prerequisites: [],
    });

    useEffect(() => {
        const fetchDeps = async () => {
            const resp = await SubjectService.getDepartments();
            setDepartments(resp.data as any);
        };
        fetchDeps();
    }, []);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await (SubjectService as any).createSubject(formData);
            router.push("/dashboard/hocfdc/curriculums");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const togglePLO = (ploId: string) => {
        const current = formData.mappingPLOs || [];
        if (current.includes(ploId)) {
            setFormData({ ...formData, mappingPLOs: current.filter(id => id !== ploId) });
        } else {
            setFormData({ ...formData, mappingPLOs: [...current, ploId] });
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-10 px-8">
            <div className="flex justify-between items-end mb-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push("/dashboard/hocfdc/subjects")}
                        className="w-10 h-10 flex items-center justify-center bg-white border border-zinc-100 rounded-xl text-zinc-400 hover:text-primary hover:border-primary/30 transition-all shadow-sm group"
                    >
                        <ChevronLeft className="group-hover:-translate-x-0.5 transition-transform" size={20} />
                    </button>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">
                            <BookOpen size={12} />
                            Academic Registry
                        </div>
                        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Subject Management.</h1>
                        <p className="text-sm text-zinc-500 font-medium">Configure core academic modules and strategic alignments.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.back()}
                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-all"
                    >
                        Discard Changes
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-primary/10 active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Establish Module
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-10">
                {/* Sidebar Navigation */}
                <div className="col-span-3 space-y-2">
                    {[
                        { id: 'details', label: 'Core Parameters', icon: Info, color: 'text-blue-500' },
                        { id: 'strategic', label: 'Strategic Mapping', icon: Target, color: 'text-indigo-500' },
                        { id: 'architecture', label: 'Prerequisites', icon: Link, color: 'text-amber-500' },
                        { id: 'import', label: 'Bulk Import', icon: Upload, color: 'text-emerald-500' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${activeTab === tab.id
                                    ? "bg-white border border-zinc-100 shadow-lg shadow-zinc-200/50 text-zinc-900"
                                    : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50/50"
                                }`}
                        >
                            <tab.icon size={18} className={activeTab === tab.id ? tab.color : ""} />
                            <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
                            {activeTab === tab.id && (
                                <motion.div layoutId="tab-indicator" className="ml-auto">
                                    <ChevronRight size={14} />
                                </motion.div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Main Subject Form */}
                <div className="col-span-9 bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden min-h-[600px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="p-10"
                        >
                            {activeTab === 'details' && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="col-span-2 grid grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Subject Code</label>
                                                <div className="relative">
                                                    <input
                                                        value={formData.subjectCode}
                                                        onChange={e => setFormData({ ...formData, subjectCode: e.target.value })}
                                                        placeholder="e.g. PRN231"
                                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                                                    />
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-primary">
                                                        <CheckCircle2 size={16} />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Credits</label>
                                                <div className="relative group">
                                                    <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={16} />
                                                    <input
                                                        type="number"
                                                        value={formData.credits}
                                                        onChange={e => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Degree Level</label>
                                                <div className="relative group">
                                                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={16} />
                                                    <select
                                                        value={formData.degreeLevel}
                                                        onChange={e => setFormData({ ...formData, degreeLevel: e.target.value })}
                                                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none"
                                                    >
                                                        <option value="UNDERGRADUATE">Undergraduate</option>
                                                        <option value="GRADUATE">Graduate</option>
                                                        <option value="VOCATIONAL">Vocational</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Subject Name (Academic English)</label>
                                            <input
                                                value={formData.subjectName}
                                                onChange={e => setFormData({ ...formData, subjectName: e.target.value })}
                                                placeholder="e.g. Cross-platform Application Development"
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Responsible Department</label>
                                            <div className="relative group">
                                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={16} />
                                                <select
                                                    value={formData.departmentId}
                                                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none"
                                                >
                                                    <option value="">Select Department...</option>
                                                    {departments.map(dep => (
                                                        <option key={dep.departmentId} value={dep.departmentId}>{dep.departmentName}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Time Allocation</label>
                                            <div className="relative group">
                                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-primary transition-colors" size={16} />
                                                <input
                                                    value={formData.timeAllocation}
                                                    onChange={e => setFormData({ ...formData, timeAllocation: e.target.value })}
                                                    placeholder="e.g. 3-0-6 (30-0-60)"
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 col-span-2">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Scoring Scale</label>
                                                <input
                                                    type="number"
                                                    value={formData.scoringScale}
                                                    onChange={e => setFormData({ ...formData, scoringScale: parseInt(e.target.value) })}
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/5 outline-none transition-all"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Min. Grade to Pass</label>
                                                <input
                                                    type="number"
                                                    value={formData.minToPass}
                                                    onChange={e => setFormData({ ...formData, minToPass: parseInt(e.target.value) })}
                                                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 px-6 text-sm font-bold focus:ring-2 focus:ring-primary/5 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Subject Description</label>
                                            <textarea
                                                rows={4}
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none placeholder:text-zinc-300"
                                                placeholder="Provide a comprehensive academic description..."
                                            />
                                        </div>

                                        <div className="col-span-2 space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 ml-1">Expectation of Student Tasks</label>
                                            <textarea
                                                rows={3}
                                                value={formData.studentTasks}
                                                onChange={e => setFormData({ ...formData, studentTasks: e.target.value })}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-3xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none placeholder:text-zinc-300"
                                                placeholder="Describe assignments, labs, projects..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'strategic' && (
                                <div className="space-y-8">
                                    <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                                            <Target size={32} />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-indigo-900">Strategic Contribution</h3>
                                            <p className="text-xs text-indigo-600/70 leading-relaxed max-w-xl">
                                                Academic modules must map to specific Program Learning Outcomes (PLOs). Select the outcomes this subject contributes to.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2, 3, 4, 5, 6].map(num => (
                                            <div
                                                key={num}
                                                onClick={() => togglePLO(`PLO${num}`)}
                                                className={`p-6 rounded-[2rem] border transition-all cursor-pointer group ${formData.mappingPLOs?.includes(`PLO${num}`)
                                                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                                        : "bg-white border-zinc-100 hover:border-primary/30"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${formData.mappingPLOs?.includes(`PLO${num}`) ? "text-white/80" : "text-zinc-400"}`}>
                                                        PLO.0{num}
                                                    </span>
                                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${formData.mappingPLOs?.includes(`PLO${num}`) ? "bg-white border-white text-primary" : "border-zinc-100 group-hover:border-primary"
                                                        }`}>
                                                        {formData.mappingPLOs?.includes(`PLO${num}`) && <Check size={12} strokeWidth={4} />}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] font-bold leading-relaxed">
                                                    Demonstrate proficiency in designing and implementing scalable software architectures.
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'architecture' && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-zinc-900">Academic Prerequisites</h3>
                                            <p className="text-xs text-zinc-500">Establish logical dependencies for this module.</p>
                                        </div>
                                        <button className="flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all">
                                            <Plus size={14} /> Add Dependency
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {["PRF192", "PRO192"].map(code => (
                                            <div key={code} className="p-6 rounded-[2rem] bg-zinc-50 border border-zinc-100 flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-zinc-900 text-[11px] font-black border border-zinc-100 group-hover:border-primary/30 transition-all">
                                                        {code}
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-0.5">Established</p>
                                                        <p className="text-xs font-bold text-zinc-900">Programming Foundations</p>
                                                    </div>
                                                </div>
                                                <button className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight leading-none">Security Validation</p>
                                            <p className="text-[11px] text-amber-700 leading-relaxed">
                                                Automatic prerequisite cycles will be detected and flagged during curriculum enactment.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'import' && (
                                <div className="space-y-8">
                                    <div className="text-center py-20 border-4 border-dashed border-zinc-100 rounded-[3rem] space-y-6 group hover:border-emerald-100 hover:bg-emerald-50/30 transition-all cursor-pointer">
                                        <div className="w-24 h-24 bg-zinc-50 rounded-3xl flex items-center justify-center mx-auto text-zinc-300 group-hover:text-emerald-500 group-hover:scale-110 transition-all duration-500 shadow-sm border border-zinc-50 group-hover:bg-white">
                                            <Upload size={40} />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-zinc-900">Fast-Track Registry.</h3>
                                            <p className="text-xs text-zinc-400 font-medium max-w-xs mx-auto">
                                                Upload Academic CSV or Excel files to register multiple subjects simultaneously.
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-center gap-4 pt-4">
                                            <button className="px-6 py-2.5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary transition-all">
                                                Select Files
                                            </button>
                                            <button className="flex items-center gap-2 px-6 py-2.5 border border-zinc-200 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all">
                                                <Download size={14} /> Template
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-zinc-50 rounded-[2.5rem] border border-zinc-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Sliders className="text-zinc-400" size={16} />
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Import Configuration</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-zinc-900">Auto-map Fields</p>
                                                    <p className="text-[11px] text-zinc-500">System intelligence will automatically identify column headers.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                    <Check size={16} strokeWidth={3} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-bold text-zinc-900">Duplicate Shield</p>
                                                    <p className="text-[11px] text-zinc-500">Checks for existing Subject Codes before final establishment.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
