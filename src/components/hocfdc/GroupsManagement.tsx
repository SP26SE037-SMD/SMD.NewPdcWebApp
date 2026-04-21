"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    LayoutGrid, Plus, Search,
    ChevronRight, ChevronLeft
} from "lucide-react";
import { GroupResponse } from "@/services/group.service";

interface GroupsManagementProps {
    initialData: GroupResponse[];
    initialTotalPages: number;
    initialTotalElements: number;
    currentPage: number;
    currentSearch: string;
    currentStatus: string; // Left here for symmetry, backend doesn't filter Combo by status yet.
}

export default function GroupsManagement({
    initialData,
    initialTotalPages,
    initialTotalElements,
    currentPage,
    currentSearch,
    currentStatus,
}: GroupsManagementProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Local state for search before hitting enter
    const [searchInput, setSearchInput] = useState(currentSearch);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (searchInput.trim()) {
            params.set("search", searchInput.trim());
        } else {
            params.delete("search");
        }
        params.set("page", "1"); // reset to page 1 on new search
        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= initialTotalPages) {
            const params = new URLSearchParams(searchParams);
            params.set("page", newPage.toString());
            router.push(`${pathname}?${params.toString()}`);
        }
    };

    return (
        <div className="min-h-screen bg-white p-8 space-y-8 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end mb-10">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/50">
                        <LayoutGrid size={12} />
                        Framework Architecture
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Specialization Management.</h1>
                        <p className="text-sm text-zinc-500 font-medium">Grouped learning units and specialized skill tracks.</p>
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by exact code or name..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary/5 outline-none transition-all"
                            />
                        </div>
                    </form>
                </div>

                <div className="space-y-4 flex flex-col items-end">
                    <button
                        onClick={() => router.push("/dashboard/hocfdc/combos/new")}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-900 transition-all shadow-xl shadow-primary/10 active:scale-95"
                    >
                        <Plus size={16} strokeWidth={3} />
                        New Specialization
                    </button>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Total {initialTotalElements} groups found
                    </p>
                </div>
            </div>

            {initialData.length === 0 ? (
                <div className="py-20 text-center">
                    <LayoutGrid size={48} className="mx-auto text-zinc-200 mb-4" />
                    <h3 className="text-lg font-bold text-zinc-900">No specializations found</h3>
                    <p className="text-sm text-zinc-500">Try adjusting your search query.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialData.map((combo, idx) => (
                        <motion.div
                            key={combo.groupId}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => router.push(`/dashboard/hocfdc/combos/${combo.groupId}`)}
                            className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 group relative flex flex-col h-full overflow-hidden cursor-pointer border-t-4 border-t-primary"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest block w-fit mb-3">
                                        {combo.type || 'SPECIALIZATION'}
                                    </span>
                                    <h3 className="text-xl font-black text-zinc-900 group-hover:text-primary transition-colors">{combo.groupName}</h3>
                                    <p className="text-sm font-bold text-zinc-400 mt-1">{combo.groupCode}</p>
                                </div>
                                <button className="text-zinc-300 hover:text-zinc-900 transition-colors">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-zinc-400 font-medium leading-relaxed mb-8 italic">"{combo.description}"</p>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {initialTotalPages > 1 && (
                <div className="flex items-center justify-center gap-6 pt-10">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-3 bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 rounded-2xl disabled:opacity-50 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-xs font-black text-zinc-600">
                        PAGE {currentPage} OF {initialTotalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === initialTotalPages}
                        className="p-3 bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 rounded-2xl disabled:opacity-50 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
