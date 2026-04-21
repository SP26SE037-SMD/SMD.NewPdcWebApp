"use client";

import { useQuery } from "@tanstack/react-query";
import { CurriculumService } from "@/services/curriculum.service";
import CurriculumBuilder from "@/components/hocfdc/CurriculumBuilder";
import { 
    ChevronLeft, 
    Layers, 
    Share2, 
    MoreHorizontal,
    Loader2,
    Calendar,
    Target
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function BuilderPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();

    const { data, isLoading } = useQuery({
        queryKey: ['curriculum-details', id],
        queryFn: () => CurriculumService.getCurriculumById(id),
        enabled: !!id,
    });

    const curriculum = data?.data;

    useEffect(() => {
        if (curriculum && curriculum.status !== 'DRAFT') {
            router.replace(`/dashboard/hocfdc/curriculums/${id}`);
        }
    }, [curriculum, id, router]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-zinc-400">
                <Loader2 className="animate-spin mb-4" size={32} />
                <p className="font-semibold text-sm">Decoding Framework Architecture...</p>
            </div>
        );
    }

    if (!curriculum) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-zinc-400">
                <p className="font-semibold text-sm text-red-400">Framework not found in established repository.</p>
                <button onClick={() => router.back()} className="mt-4 text-xs font-black uppercase tracking-widest text-primary underline">Backward to Repository</button>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 overflow-hidden">
                <div className="space-y-4 max-w-2xl">
                    <button 
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors font-bold text-xs uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} /> Repository
                    </button>
                    
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="px-3 py-1 bg-zinc-900 text-white rounded-lg text-[10px] font-black tracking-widest uppercase">
                                {curriculum.status}
                            </div>
                            <span className="text-zinc-300">/</span>
                            <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                                <Calendar size={12} /> Established {new Date(curriculum.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-baseline gap-3">
                            {curriculum.curriculumCode}
                            <span className="text-sm font-medium text-zinc-400 tracking-normal">— {curriculum.majorName}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button className="p-3 bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-2xl transition-all shadow-sm">
                        <Share2 size={18} />
                    </button>
                    <button className="p-3 bg-white border border-zinc-100 text-zinc-400 hover:text-zinc-900 rounded-2xl transition-all shadow-sm">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* Curriculum Builder Tool */}
            <CurriculumBuilder 
                curriculumId={id} 
                initialSubjects={[]} 
            />
        </div>
    );
}
