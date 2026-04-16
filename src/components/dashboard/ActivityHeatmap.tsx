"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Calendar } from "lucide-react";

interface ActivityNode {
    date: string; // YYYY-MM-DD
    count: number;
    details: {
        subjectCode: string;
        curriculum: string;
        major: string;
    }[];
}

interface ActivityHeatmapProps {
    data: ActivityNode[];
    title?: string;
}

export default function ActivityHeatmap({ data, title = "Syllabus Creation Activity" }: ActivityHeatmapProps) {
    const [selectedDate, setSelectedDate] = useState<ActivityNode | null>(null);

    // Create a mock grid of 52 weeks (364 days)
    const weeks = 24; // Showing ~6 months for dashboard clarity
    const daysPerWeek = 7;
    
    // In a real app, we would calculate relative to TODAY
    // For this mockup, we'll generate a static range
    const grid = Array.from({ length: weeks * daysPerWeek }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (weeks * daysPerWeek - 1) + i);
        const dateStr = date.toISOString().split('T')[0];
        const activity = data.find(d => d.date === dateStr);
        
        return {
            date: dateStr,
            activity: activity || { date: dateStr, count: 0, details: [] }
        };
    });

    const getColor = (count: number) => {
        if (count === 0) return "bg-zinc-100";
        if (count === 1) return "bg-emerald-200";
        if (count === 2) return "bg-emerald-400";
        if (count >= 3) return "bg-emerald-600";
        return "bg-zinc-100";
    };

    return (
        <div className="bg-white rounded-2xl border border-zinc-100 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
                    <p className="text-sm text-zinc-400 font-medium uppercase tracking-widest">
                        Node Intensity = Velocity
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-zinc-100" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-200" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                        <div className="w-3 h-3 rounded-sm bg-emerald-600" />
                    </div>
                    <span>More</span>
                </div>
            </div>

            <div className="flex gap-8">
                {/* The Heatmap Grid */}
                <div className="flex-1 overflow-x-auto pb-4">
                    <div className="grid grid-flow-col grid-rows-7 gap-1.5 min-w-max">
                        {grid.map((item, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.2, zIndex: 10 }}
                                onClick={() => setSelectedDate(item.activity)}
                                className={`w-3.5 h-3.5 rounded-[3px] transition-colors cursor-pointer ${getColor(item.activity.count)}`}
                                title={`${item.date}: ${item.activity.count} contributions`}
                            />
                        ))}
                    </div>
                    {/* Month labels mockup */}
                    <div className="flex justify-between mt-4 px-2 text-xs font-black uppercase tracking-tighter text-zinc-300 pointer-events-none">
                        <span>OCT</span>
                        <span>NOV</span>
                        <span>DEC</span>
                        <span>JAN</span>
                        <span>FEB</span>
                        <span>MAR</span>
                    </div>
                </div>

                {/* Details Side Panel */}
                <div className="w-64 border-l border-zinc-50 pl-6 flex flex-col">
                    <AnimatePresence mode="wait">
                        {selectedDate && selectedDate.count > 0 ? (
                            <motion.div
                                key={selectedDate.date}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center gap-2 text-primary">
                                    <Calendar size={14} />
                                    <span className="text-sm font-black uppercase tracking-widest">
                                        {new Date(selectedDate.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    {selectedDate.details.map((detail, idx) => (
                                        <div key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1 group hover:border-primary/30 transition-colors">
                                            <p className="text-xs font-black text-primary uppercase tracking-tighter">{detail.major}</p>
                                            <p className="text-sm font-bold text-zinc-900 leading-none">{detail.subjectCode}</p>
                                            <p className="text-xs font-medium text-zinc-400 underline decoration-zinc-200">Ref: {detail.curriculum}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-2 opacity-30 grayscale">
                                <Info size={24} className="text-zinc-400" />
                                <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                                    Select active node<br/>to examine logs
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
