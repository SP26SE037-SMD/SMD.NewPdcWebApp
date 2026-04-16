"use client";

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { SubjectService, PrerequisiteItem } from '@/services/subject.service';
import { Loader2, ChevronRight, Hash, Globe, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoadmapNode {
    id: string;
    code: string;
    name: string;
    level: number;
    parents: string[]; // IDs of subjects that REQUIRE this one
}

interface SubjectPrerequisiteRoadmapProps {
    initialSubjectId: string;
}

export const SubjectPrerequisiteRoadmap: React.FC<SubjectPrerequisiteRoadmapProps> = ({ initialSubjectId }) => {
    const [nodes, setNodes] = useState<RoadmapNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchAncestry = async () => {
            setIsLoading(true);
            try {
                // Fetch real prerequisites from API
                const resp = await SubjectService.getPrerequisites(initialSubjectId);
                const rawData: PrerequisiteItem[] = resp.data || [];

                if (rawData.length === 0) {
                    setNodes([]);
                    setIsLoading(false);
                    return;
                }

                const nodesMap = new Map<string, RoadmapNode>();
                
                // Helper to get or create a node
                // Note: We use subjectCode as the key for consistency in visualization
                const getOrCreateNode = (code: string, name: string) => {
                    if (!nodesMap.has(code)) {
                        nodesMap.set(code, { id: code, code, name, level: 0, parents: [] });
                    }
                    return nodesMap.get(code)!;
                };

                // Add all unique subjects from API data to the map
                rawData.forEach((rel) => {
                    const subjectNode = getOrCreateNode(rel.subjectCode, rel.subjectName);
                    const prereqNode = getOrCreateNode(rel.prerequisiteSubjectCode, rel.prerequisiteSubjectName);
                    
                    if (!prereqNode.parents.includes(rel.subjectCode)) {
                        prereqNode.parents.push(rel.subjectCode);
                    }
                });

                // Calculate Levels (Distance from Target)
                // We'll define the "Target" as the one that isn't a prerequisite for anyone in this set
                const allSubjectCodes = rawData.map(r => r.subjectCode);
                const allPrereqCodes = rawData.map(r => r.prerequisiteSubjectCode);
                
                // The root of the prerequisite tree (the subject we are looking at or the one that depends on others)
                const computedTargetCode = allSubjectCodes.find(code => !allPrereqCodes.includes(code)) || initialSubjectId;

                const calculateLevels = () => {
                    const levelsMap = new Map<string, number>();
                    
                    const getLevel = (code: string): number => {
                        if (code === computedTargetCode) return 0;
                        if (levelsMap.has(code)) return levelsMap.get(code)!;

                        const node = nodesMap.get(code);
                        if (!node || node.parents.length === 0) return 0;

                        const maxParentLevel = Math.max(...node.parents.map(pCode => getLevel(pCode)));
                        const level = maxParentLevel + 1;
                        levelsMap.set(code, level);
                        return level;
                    };

                    Array.from(nodesMap.keys()).forEach(code => getLevel(code));
                    return levelsMap;
                };

                const levelsMap = calculateLevels();
                const maxDepth = Math.max(0, ...Array.from(levelsMap.values()));
                
                const finalNodes = Array.from(nodesMap.values()).map(n => ({
                    ...n,
                    level: maxDepth - (levelsMap.get(n.code) || 0)
                }));

                setNodes(finalNodes.sort((a, b) => a.level - b.level));
            } catch (err) {
                console.error("Roadmap Construction Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAncestry();
    }, [initialSubjectId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Tracing Academic Lineage...</p>
            </div>
        );
    }

    // Group nodes by levels
    const levels = Array.from(new Set(nodes.map(n => n.level))).sort((a, b) => a - b);

    return (
        <div className="relative w-full overflow-x-auto overflow-y-hidden py-16 px-10 scrollbar-hide" ref={containerRef}>
            <div className="flex items-center gap-32 min-w-max min-h-[600px] justify-start">
                {levels.map((level, lIdx) => {
                    const levelNodes = nodes.filter(n => n.level === level);
                    const totalLevelNodes = levelNodes.length;

                    return (
                        <div key={level} className="flex flex-col gap-16 relative justify-center min-h-[600px]">
                            {/* Level Label */}
                            <div className="absolute top-0 left-0 whitespace-nowrap">
                                <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">
                                    {level === levels.length - 1 ? 'Current Subject' : `Stage ${level + 1}`}
                                </span>
                            </div>

                            {levelNodes.map((node, nIdx) => (
                                <motion.div
                                    key={node.id}
                                    initial={{ opacity: 0, scale: 0.9, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    transition={{ delay: lIdx * 0.1 + nIdx * 0.05 }}
                                    className="relative z-10"
                                >
                                    <div className={cn(
                                        "w-64 p-6 rounded-[2.5rem] border transition-all duration-300 shadow-sm cursor-pointer group/card",
                                        node.id === initialSubjectId 
                                            ? "bg-zinc-900 border-zinc-800 shadow-2xl shadow-zinc-900/40 translate-x-1" 
                                            : "bg-white border-zinc-100 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1"
                                    )}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all",
                                                node.id === initialSubjectId 
                                                    ? "bg-zinc-800 text-indigo-400" 
                                                    : "bg-zinc-50 text-zinc-400 group-hover/card:bg-indigo-500 group-hover/card:text-white"
                                            )}>
                                                {node.code.substring(0, 3)}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className={cn(
                                                    "text-[10px] font-black uppercase tracking-[0.2em]",
                                                    node.id === initialSubjectId ? "text-indigo-400" : "text-zinc-300"
                                                )}>
                                                    {node.code}
                                                </span>
                                            </div>
                                        </div>
                                        <h4 className={cn(
                                            "text-sm font-black leading-tight line-clamp-2 h-10",
                                            node.id === initialSubjectId ? "text-white" : "text-zinc-900"
                                        )}>
                                            {node.name}
                                        </h4>
                                    </div>

                                    {/* SVG Connector to parents (the ones that depend on this node) */}
                                    {node.parents.map(parentId => {
                                        const parent = nodes.find(n => n.id === parentId);
                                        if (!parent) return null;

                                        const parentLevelNodes = nodes.filter(n => n.level === parent.level);
                                        const parentIdx = parentLevelNodes.findIndex(n => n.id === parentId);
                                        
                                        // Vertical centering logic:
                                        // Each node in a level is spaced out. We need to calculate the difference in their 
                                        // vertical positions relative to the center of the container.
                                        // Node position = (nIdx - (totalLevelNodes-1)/2) * (CardHeight + Gap)
                                        // Parent position = (parentIdx - (parentLevelNodes.length-1)/2) * (CardHeight + Gap)
                                        const CARD_HEIGHT_PLUS_GAP = 152 + 64; // Height ~152px + gap-16 (64px)
                                        
                                        const nodePos = (nIdx - (totalLevelNodes - 1) / 2) * CARD_HEIGHT_PLUS_GAP;
                                        const parentPos = (parentIdx - (parentLevelNodes.length - 1) / 2) * CARD_HEIGHT_PLUS_GAP;
                                        const yOffset = parentPos - nodePos;

                                        const svgHeight = Math.max(200, Math.abs(yOffset) + 200);
                                        const centerY = svgHeight / 2;

                                        return (
                                            <svg 
                                                key={`${node.id}-${parentId}`}
                                                className="absolute left-full top-1/2 -translate-y-1/2 overflow-visible pointer-events-none z-0"
                                                width="128" 
                                                height={svgHeight}
                                            >
                                                <motion.path
                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                    transition={{ duration: 1, delay: lIdx * 0.2 }}
                                                    // Start at centerY of SVG (aligned with source card center)
                                                    // End at centerY + yOffset (aligned with target card center)
                                                    d={`M 0,${centerY} C 64,${centerY} 64,${centerY + yOffset} 128,${centerY + yOffset}`}
                                                    fill="none"
                                                    stroke="#6366f1"
                                                    strokeWidth="3"
                                                    strokeLinecap="round"
                                                    className="drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                                                />
                                                <circle 
                                                    cx="128" 
                                                    cy={centerY + yOffset} 
                                                    r="4" 
                                                    fill="#6366f1" 
                                                    className="shadow-lg" 
                                                />
                                            </svg>
                                        );
                                    })}
                                </motion.div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
