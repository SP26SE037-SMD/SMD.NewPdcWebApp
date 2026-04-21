"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Layers, Plus, Search,
    ChevronRight, MoreHorizontal
} from "lucide-react";
import { GroupResponse } from "@/services/group.service";

interface ElectivesManagementProps {
    initialData: GroupResponse[];
    initialTotalPages: number;
    initialTotalElements: number;
    currentPage: number;
    initialSearch: string;
}

export default function ElectivesManagement({
    initialData,
    initialTotalPages,
    initialTotalElements,
    currentPage,
    initialSearch
}: ElectivesManagementProps) {
    const router = useRouter();
    const [search, setSearch] = useState(initialSearch);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/dashboard/hocfdc/electives?search=${search}&page=0`);
    };

    return (
        <div className="min-h-screen bg-white p-8 space-y-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end mb-10">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">
                        <Layers size={12} />
                        Framework Architecture
                    </div>
                    <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Elective Management.</h1>
                    <p className="text-sm text-zinc-500 font-medium">Configurable subject pools and specialized elective tracks.</p>
                </div>

                <div className="flex items-center gap-4">
                    <form onSubmit={handleSearch} className="relative w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search electives..."
                            className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </form>
                    <button
                        onClick={() => router.push("/dashboard/hocfdc/electives/new")}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-primary/10 active:scale-95 border border-primary/20"
                    >
                        <Plus size={16} strokeWidth={3} />
                        New Elective
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialData.map((elective, idx) => (
                    <motion.div
                        key={elective.groupId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => router.push(`/dashboard/hocfdc/electives/${elective.groupId}`)}
                        className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group relative flex flex-col h-full overflow-hidden cursor-pointer border-t-4 border-t-zinc-900"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase bg-zinc-50 px-3 py-1 rounded-full mb-3 inline-block border border-zinc-100">
                                    {elective.groupCode}
                                </span>
                                <h3 className="text-xl font-black text-zinc-900 group-hover:text-primary transition-colors">{elective.groupName}</h3>
                            </div>
                            <button className="text-zinc-300 hover:text-zinc-900 transition-colors flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-8 italic">
                            {elective.description ? `"${elective.description}"` : "No description provided."}
                        </p>

                        <div className="flex items-center gap-4 mt-auto pt-6 border-t border-zinc-50">
                            <div className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                View Subjects
                            </div>
                            <button className="ml-auto text-zinc-300 hover:text-primary transition-colors">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {initialData.length === 0 && (
                <div className="text-center py-20 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-[3rem]">
                    <p className="text-zinc-400 font-bold mb-2">No electives found.</p>
                    <p className="text-sm text-zinc-400">Try adjusting your search query or create a new elective pool.</p>
                </div>
            )}
        </div>
    );
}
