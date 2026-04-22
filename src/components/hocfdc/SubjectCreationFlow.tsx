"use client";

import { useState } from "react";
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
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SubjectService } from "@/services/subject.service";

const STEPS = [
    { id: 1, title: "Identity", icon: Info, description: "Basic parameters & naming" },
    { id: 2, title: "Strategic", icon: Target, description: "PLO & Mission alignment" },
    { id: 3, title: "Architecture", icon: Link, description: "Prerequisites & Dependencies" },
    { id: 4, title: "Shell", icon: FileText, description: "Content & Assessment brief" },
    { id: 5, title: "Review", icon: Eye, description: "Confirm & Establish" },
];

export default function SubjectCreationFlow() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        subjectCode: "",
        subjectNameEn: "",
        subjectNameVi: "",
        credits: 3,
        minBloomLevel: 3,
        type: "CORE", // CORE, ELECTIVE, VOCATIONAL
        description: "",
        mappingPLOs: [] as string[],
        prerequisites: [] as string[],
        assessmentBrief: "",
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await SubjectService.createSubject({
                subjectCode: formData.subjectCode,
                subjectName: formData.subjectNameEn,
                credits: formData.credits,
                minBloomLevel: formData.minBloomLevel,
                // These are currently fixed for simplified flow/mock
                departmentId: "DEPT_001",
                scoringScale: 10,
                description: formData.description,
                studentTasks: "",
                timeAllocation: "",
                degreeLevel: "BACHELOR",
                minToPass: 4,
                tool: "",
            });
            router.push("/dashboard/hocfdc/curriculums");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-6">
            {/* Progress Header */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Establish Subject.</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Luồng 1 - Quy trình thiết kế học phần 5 bước</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => router.back()} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between relative px-2">
                    {/* Progress Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-100 -translate-y-1/2 z-0" />
                    <motion.div 
                        className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0"
                        initial={{ width: "0%" }}
                        animate={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                    />

                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isCompleted = currentStep > step.id;
                        const isActive = currentStep === step.id;

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <motion.div 
                                    className={`w-10 h-10 rounded-full flex items-center justify-center border-4 ${
                                        isCompleted ? "bg-primary border-primary text-white" :
                                        isActive ? "bg-white border-primary text-primary shadow-lg shadow-primary/20" :
                                        "bg-white border-zinc-100 text-zinc-300"
                                    } transition-colors`}
                                    initial={false}
                                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                                >
                                    {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                                </motion.div>
                                <div className="absolute -bottom-8 whitespace-nowrap text-center">
                                    <p className={`text-[9px] font-black uppercase tracking-[0.1em] ${isActive ? "text-zinc-900" : "text-zinc-400"}`}>
                                        {step.title}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl overflow-hidden min-h-[500px] flex flex-col mt-12">
                <div className="p-10 flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStep === 1 && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject Registry Code</label>
                                            <input 
                                                value={formData.subjectCode}
                                                onChange={e => setFormData({...formData, subjectCode: e.target.value})}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                                                placeholder="e.g. PRN231"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Credit Weight</label>
                                            <select 
                                                value={formData.credits}
                                                onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none"
                                            >
                                                <option value={2}>2 Credits</option>
                                                <option value={3}>3 Credits</option>
                                                <option value={4}>4 Credits</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Academic Name (English)</label>
                                            <input 
                                                value={formData.subjectNameEn}
                                                onChange={e => setFormData({...formData, subjectNameEn: e.target.value})}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                                                placeholder="e.g. Cross-platform Application Development"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Threshold Bloom Level</label>
                                            <select 
                                                value={formData.minBloomLevel}
                                                onChange={e => setFormData({...formData, minBloomLevel: parseInt(e.target.value)})}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all appearance-none"
                                            >
                                                {[1, 2, 3, 4, 5, 6].map(level => (
                                                    <option key={level} value={level}>Level {level}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Academic Name (Vietnamese)</label>
                                        <input 
                                            value={formData.subjectNameVi}
                                            onChange={e => setFormData({...formData, subjectNameVi: e.target.value})}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                                            placeholder="e.g. Phát triển ứng dụng đa nền tảng"
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-8">
                                    <div className="p-8 bg-indigo-50/50 rounded-3xl border border-indigo-100 relative overflow-hidden group">
                                        <Target className="absolute -right-8 -bottom-8 text-indigo-500/10 group-hover:scale-110 transition-transform duration-700" size={160} />
                                        <h3 className="text-xl font-bold text-indigo-900 mb-2">Strategic Alignment</h3>
                                        <p className="text-xs text-indigo-600/80 max-w-md leading-relaxed">
                                            Select the Program Learning Outcomes (PLOs) this subject contributes to. This ensures every module has a defined strategic mission.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        {[1, 2, 3, 4, 5].map(id => (
                                            <div key={id} className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 hover:border-primary/30 hover:bg-zinc-50 transition-all cursor-pointer group">
                                                <div className="w-6 h-6 rounded-md border-2 border-zinc-200 flex items-center justify-center group-hover:border-primary">
                                                    <Check size={14} className="text-primary opacity-0 group-hover:opacity-100" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-zinc-900 uppercase">PLO.0{id}</p>
                                                    <p className="text-[11px] font-medium text-zinc-400">Design and implement complex software systems using modern frameworks.</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Academic Prerequisites</label>
                                            <button className="flex items-center gap-1 text-primary text-[10px] font-black uppercase hover:underline">
                                                <Plus size={12} strokeWidth={3} /> Add Dependent
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {["PRF192", "PRO192"].map(code => (
                                                <div key={code} className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-zinc-900 text-[10px] font-black">{code}</div>
                                                        <p className="text-[11px] font-bold text-zinc-600">Established Pre-requisite</p>
                                                    </div>
                                                    <X size={14} className="text-zinc-300 hover:text-red-500 cursor-pointer" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 flex gap-4">
                                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-amber-900 uppercase tracking-tight leading-none">Sequence Validation</p>
                                            <p className="text-[11px] text-amber-700 leading-relaxed">
                                                The curriculum builder will automatically ensure these dependencies are respected in semester scheduling.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subject Mission Statement</label>
                                        <textarea 
                                            rows={5}
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all resize-none placeholder:text-zinc-300 leading-relaxed"
                                            placeholder="What are the key learning outcomes and scope of this subject?"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Assessment Strategy Brief</label>
                                        <div className="p-6 bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl text-center space-y-3">
                                            <MessageSquare className="mx-auto text-zinc-300 shadow-sm" size={32} />
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Draft assessment components (Labs, Progress Tests)...</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-2 gap-12">
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-zinc-400 uppercase">Subject Identity</p>
                                                <h4 className="text-2xl font-black text-zinc-900 tracking-tight leading-tight">{formData.subjectNameEn || "Undefined Subject"}</h4>
                                                <p className="text-sm font-bold text-primary">{formData.subjectCode || "NO_CODE"}</p>
                                            </div>
                                            <div className="flex gap-4">
                                                <div className="px-3 py-1 bg-zinc-100 rounded-lg text-[10px] font-black">{formData.credits} CREDITS</div>
                                                <div className="px-3 py-1 bg-zinc-100 rounded-lg text-[10px] font-black">{formData.type}</div>
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 space-y-3">
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Ready for Enactment</span>
                                                </div>
                                                <p className="text-[11px] text-emerald-700 leading-relaxed">
                                                    This subject has been mapped to PLOs and prerequisites have been defined. It is ready to be added to Curriculum Frameworks.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-zinc-50 rounded-[2rem] border border-zinc-100 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Info size={14} className="text-zinc-400" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Final Summary</p>
                                        </div>
                                        <p className="text-xs text-zinc-500 leading-relaxed">
                                            Establishing this academic module will make it available in the Subject Warehouse for all Committee members. PLO mappings will be finalized upon submission.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="px-10 py-8 bg-zinc-50/50 border-t border-zinc-100 flex justify-between items-center">
                    <button 
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                            currentStep === 1 ? "text-zinc-200" : "text-zinc-400 hover:text-zinc-900"
                        }`}
                    >
                        <ChevronLeft size={16} strokeWidth={3} />
                        Genesis Phase
                    </button>

                    <div className="flex items-center gap-4">
                        <button className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors">
                            Draft Stash
                        </button>
                        {currentStep < 5 ? (
                            <button 
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all shadow-xl active:scale-95"
                            >
                                Advance Flow
                                <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-10 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Confirm & Establish
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
