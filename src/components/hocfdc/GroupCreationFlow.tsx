"use client";

import { useState } from "react";
import { 
    ChevronRight, 
    ChevronLeft, 
    Check, 
    Layers, 
    Target, 
    Link, 
    FileText, 
    Eye,
    Save,
    Plus,
    X,
    LayoutGrid,
    AlertCircle,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { GroupService } from "@/services/group.service";

const STEPS = [
    { id: 1, title: "Identity", icon: Layers, description: "Group name & type" },
    { id: 2, title: "Curated Selection", icon: LayoutGrid, description: "Pick core modules" },
    { id: 3, title: "Architecture", icon: Link, description: "Group prerequisites" },
    { id: 4, title: "Review", icon: Eye, description: "Verify Group integrity" },
];

export default function GroupCreationFlow() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        groupName: "",
        groupCode: "", // Added groupCode
        type: "COMBO", // COMBO, ELECTIVE
        description: "",
        selectedSubjects: [] as string[],
        prerequisites: [] as string[],
        mappingPLOs: [] as string[],
    });

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await GroupService.createGroup({
                groupCode: formData.groupCode,
                groupName: formData.groupName,
                description: formData.description,
                type: formData.type as any
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
            <div className="mb-12">
                <div className="flex justify-between items-center mb-8">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Design Group.</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">Luồng 2 - Quy trình thiết kế nhóm học phần chuyên sâu</p>
                    </div>
                    <button onClick={() => router.back()} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex items-center justify-between relative px-2">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-zinc-100 -translate-y-1/2 z-0" />
                    <motion.div 
                        className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0"
                        animate={{ width: `${((currentStep - 1) / 3) * 100}%` }}
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
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Group Code</label>
                                            <input 
                                                value={formData.groupCode}
                                                onChange={e => setFormData({...formData, groupCode: e.target.value})}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                                                placeholder="e.g. AI01"
                                            />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Group Name</label>
                                            <input 
                                                value={formData.groupName}
                                                onChange={e => setFormData({...formData, groupName: e.target.value})}
                                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300"
                                                placeholder="e.g. AI & Machine Learning"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Description</label>
                                        <textarea 
                                            value={formData.description}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                            className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-zinc-300 min-h-[100px]"
                                            placeholder="Describe the purpose of this group..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        {['COMBO', 'ELECTIVE'].map(type => (
                                            <button 
                                                key={type}
                                                onClick={() => setFormData({...formData, type: type})}
                                                className={`p-6 rounded-[2rem] border-2 transition-all text-left space-y-2 ${
                                                    formData.type === type ? "border-primary bg-white shadow-lg" : "border-zinc-100 bg-zinc-50 grayscale"
                                                }`}
                                            >
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">{type}</p>
                                                <p className="text-[11px] font-medium text-zinc-500">
                                                    {type === 'COMBO' ? 'In-depth modules for specific career paths.' : 'Flexible subject pools for elective selection.'}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-black text-zinc-900">Module Aggregation.</h3>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select 2-4 core subjects for this group</p>
                                        </div>
                                        <button className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-xl text-[10px] font-black uppercase">
                                            <Filter size={14} /> Filter Taxonomy
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {["Artificial Intelligence", "Deep Learning", "Neural Networks"].map(name => (
                                            <div key={name} className="p-4 rounded-2xl border border-zinc-100 flex items-center justify-between group hover:border-primary transition-all cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                        <Check size={14} />
                                                    </div>
                                                    <p className="text-[11px] font-bold text-zinc-600">{name}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                                    <Link className="text-zinc-200" size={64} />
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-bold text-zinc-900">Group Dependencies</h3>
                                        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                                            Define if this entire group requires a specific prerequisite before students can enroll.
                                        </p>
                                    </div>
                                    <button className="px-6 py-2 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                        Attach Dependency
                                    </button>
                                </div>
                            )}

                            {currentStep === 4 && (
                                <div className="space-y-10">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Ready for Enactment</p>
                                            <h4 className="text-3xl font-black text-zinc-900 tracking-tight">{formData.groupName || "New Strategic Group"}</h4>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[9px] font-black rounded-lg uppercase tracking-widest">{formData.type}</span>
                                                <span className="px-3 py-1 bg-zinc-100 text-zinc-400 text-[9px] font-black rounded-lg uppercase tracking-widest">3 Modules</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-8 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase">
                                                <Check className="text-emerald-500" size={14} /> Structural Integrity
                                            </div>
                                            <p className="text-[11px] text-zinc-500 font-medium">Group components are logically grouped and validated.</p>
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
                        Architect Phase
                    </button>

                    <div className="flex items-center gap-4">
                        {currentStep < 4 ? (
                            <button 
                                onClick={nextStep}
                                className="flex items-center gap-2 px-8 py-3 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary transition-all shadow-xl active:scale-95"
                            >
                                Next Step
                                <ChevronRight size={16} strokeWidth={3} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-10 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-primary/20 active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Persist Group
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Filter({ size }: { size: number }) {
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>;
}
