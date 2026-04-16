"use client";

import { useState } from "react";
import { 
    ChevronRight, 
    ChevronLeft, 
    Check, 
    Box, 
    Target, 
    Link, 
    FileText, 
    Eye,
    Save,
    Plus,
    X,
    ClipboardCheck,
    AlertCircle,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { SubjectService } from "@/services/subject.service";

const STEPS = [
    { id: 1, title: "Identity", icon: Box, description: "Elective group parameters" },
    { id: 2, title: "Candidate Pool", icon: ClipboardCheck, description: "Select allowed subjects" },
    { id: 3, title: "Architecture", icon: Link, description: "Group constraints" },
    { id: 4, title: "Strategy", icon: Target, description: "Mission mapping" },
    { id: 5, title: "Review", icon: Eye, description: "Finalize Elective Group" },
];

export default function ElectiveCreationFlow() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        electiveName: "",
        minCredits: 9,
        maxCredits: 9,
        subjectPool: [] as string[],
        prerequisites: [] as string[],
        mappingPLOs: [] as string[],
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 5));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await SubjectService.createElective(formData);
            router.push("/dashboard/hocfdc/curriculums");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-10 px-6">
            <div className="mb-12">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Curate Elective.</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Luồng 3 - Quy trình thiết kế nhóm học phần tự chọn</p>
                    </div>
                    <button onClick={() => router.back()} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-100 -translate-y-1/2 z-0" />
                    <motion.div 
                        className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0"
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
                                    }`}
                                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                                >
                                    {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                                </motion.div>
                                <div className="absolute -bottom-8 whitespace-nowrap text-center text-[9px] font-black uppercase tracking-widest">
                                    {step.title}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl min-h-[500px] flex flex-col mt-12 overflow-hidden">
                <div className="p-10 flex-1">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {currentStep === 1 && (
                                <div className="space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Elective Group Name</label>
                                        <input 
                                            value={formData.electiveName}
                                            onChange={e => setFormData({...formData, electiveName: e.target.value})}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                                            placeholder="e.g. Humanities Electives (HME-01)"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="p-6 bg-zinc-50 border border-zinc-100 rounded-3xl space-y-4">
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Enrollment Threshold (Credits)</p>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    type="number" 
                                                    value={formData.minCredits}
                                                    onChange={e => setFormData({...formData, minCredits: parseInt(e.target.value)})}
                                                    className="w-16 bg-white border border-zinc-200 rounded-xl py-2 px-3 text-sm font-black text-center"
                                                />
                                                <span className="text-zinc-300 font-bold">to</span>
                                                <input 
                                                    type="number" 
                                                    value={formData.maxCredits}
                                                    onChange={e => setFormData({...formData, maxCredits: parseInt(e.target.value)})}
                                                    className="w-16 bg-white border border-zinc-200 rounded-xl py-2 px-3 text-sm font-black text-center"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-black text-zinc-900 tracking-tight">Candidate Selection.</h3>
                                        <button className="px-4 py-2 bg-zinc-900 text-white text-[10px] font-black uppercase rounded-xl">Add to Pool</button>
                                    </div>
                                    <div className="space-y-3">
                                        {["Psychology 101", "Introduction to Sociology", "Eastern Philosophy", "Contemporary History"].map(name => (
                                            <div key={name} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between group cursor-pointer hover:border-primary transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-zinc-300 group-hover:text-primary transition-colors">
                                                        <Box size={14} />
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[11px] font-bold text-zinc-900">{name}</p>
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">3 Credits</p>
                                                    </div>
                                                </div>
                                                <X size={14} className="text-zinc-200 hover:text-red-500 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="p-12 text-center space-y-4">
                                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto">
                                        <Link size={24} className="text-zinc-300" />
                                    </div>
                                    <h3 className="text-lg font-black text-zinc-900">Global Constraints</h3>
                                    <p className="text-xs text-zinc-400 max-w-xs mx-auto mb-4">Set conditions for the entire elective group (e.g. students must have completed Semester 5).</p>
                                    <div className="p-4 bg-zinc-50 border border-zinc-100 rounded-2xl flex items-center gap-3 text-left max-w-md mx-auto">
                                        <AlertCircle size={16} className="text-amber-500 shrink-0" />
                                        <p className="text-[10px] font-medium text-zinc-500">Currently no global constraints defined for this group.</p>
                                    </div>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-8">
                                    <div className="p-10 bg-primary/5 border border-primary/20 rounded-[2.5rem] relative overflow-hidden group">
                                        <div className="relative z-10 space-y-2">
                                            <h3 className="text-2xl font-black text-primary tracking-tight">Mission Mapping.</h3>
                                            <p className="text-xs text-zinc-500 max-w-sm leading-relaxed">
                                                Which Program Outcomes are satisfied by choosing ANY subject in this elective group?
                                            </p>
                                        </div>
                                        <Target className="absolute -right-16 -bottom-16 text-primary/5 group-hover:scale-110 transition-transform duration-700" size={240} />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[1, 2].map(id => (
                                            <div key={id} className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center gap-4 hover:border-primary transition-all cursor-pointer">
                                                <div className="w-5 h-5 rounded-md border-2 border-zinc-200 flex items-center justify-center">
                                                    <Check size={12} className="text-primary opacity-0 hover:opacity-100" />
                                                </div>
                                                <p className="text-[10px] font-black text-zinc-900 uppercase">PLO.0{id} - Critical Thinking & Analysis</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 5 && (
                                <div className="space-y-10">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Elective Group Verification</p>
                                            <h4 className="text-3xl font-black text-zinc-900 tracking-tight">{formData.electiveName || "General Electives"}</h4>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-zinc-900 text-white text-[9px] font-black rounded-lg uppercase tracking-widest">{formData.minCredits} TOTAL CREDITS</span>
                                                <span className="px-3 py-1 bg-zinc-100 text-zinc-400 text-[9px] font-black rounded-lg uppercase tracking-widest">4 Candidate Modules</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-700 font-black text-[10px] uppercase">
                                            <CheckCircle className="text-emerald-500" size={16} /> Curated Pool Integrity
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <p className="text-[11px] text-emerald-800/70 font-medium leading-relaxed">
                                                The candidate pool consists of validated academic modules. Student choice maintains credit equilibrium.
                                            </p>
                                            <p className="text-[11px] text-emerald-800/70 font-medium leading-relaxed">
                                                Strategy: Successfully mapped to 2 Program Learning Outcomes.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                <div className="px-10 py-8 bg-zinc-50/50 border-t border-zinc-100 flex justify-between items-center">
                    <button 
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                            currentStep === 1 ? "text-zinc-200" : "text-zinc-400 hover:text-zinc-900"
                        }`}
                    >
                        <ChevronLeft size={16} strokeWidth={3} />
                        Curation Phase
                    </button>

                    <div className="flex items-center gap-4">
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
                                Persist Elective
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CheckCircle({ size, className }: { size: number, className?: string }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}
