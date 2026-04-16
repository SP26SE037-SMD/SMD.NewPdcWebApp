const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('src/components/hocfdc/CurriculumDetail.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Imports
content = content.replace(
    `import { useState } from "react";`,
    `import { useState, useMemo } from "react";`
);
if (!content.includes('import { GroupService }')) {
    content = content.replace(
        `import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";`,
        `import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";\nimport { GroupService } from "@/services/group.service";`
    );
}
if (!content.includes('ArrowRight')) {
    content = content.replace(`import { `, `import { X, ArrowRight, `);
}

// 2. States & Queries
const hookInsertionPoint = `const router = useRouter();
    const queryClient = useQueryClient();`;
if (!content.includes('selectedComboId')) {
    content = content.replace(
        hookInsertionPoint,
        `${hookInsertionPoint}

    // New Feature State
    const [selectedComboId, setSelectedComboId] = useState<string | null>(null);
    const [activeElectiveGroup, setActiveElectiveGroup] = useState<any>(null);`
    );
}

const queryInsertionPoint = `const { data: ploData, isLoading: isLoadingPLOs } = useQuery({
        queryKey: ['curriculum-plos', id],
        queryFn: () => CurriculumService.getPLOsByCurriculumId(id),
    });`;

if (!content.includes('warehouse-groups')) {
    content = content.replace(
        queryInsertionPoint,
        `${queryInsertionPoint}

    const { data: groupData, isLoading: isLoadingGroups } = useQuery({
        queryKey: ['warehouse-groups'],
        queryFn: () => GroupService.getGroups(),
    });`
    );
}

const computedInsertionPoint = `const plos = ploData?.data?.content || [];`;
if (!content.includes('allGroups')) {
    content = content.replace(
        computedInsertionPoint,
        `${computedInsertionPoint}
    const allGroups = groupData?.data?.content || groupData?.data || [];
    
    const usedGroupIds = useMemo(() => {
        const ids = new Set<string>();
        mappedSubjects.forEach((m: any) => m.subjects?.forEach((s: any) => {
            if (s.groupId) ids.add(s.groupId);
        }));
        return ids;
    }, [mappedSubjects]);

    const curriculumGroups = useMemo(() => {
        return allGroups.filter((g: any) => usedGroupIds.has(g.groupId));
    }, [allGroups, usedGroupIds]);

    const combos = useMemo(() => curriculumGroups.filter((g: any) => g.type === 'COMBO'), [curriculumGroups]);
`
    );
}

const isLoadingReplacement = `if (isLoadingCore || isLoadingMapped || isLoadingPLOs) {`;
content = content.replace(
    isLoadingReplacement,
    `if (isLoadingCore || isLoadingMapped || isLoadingPLOs || isLoadingGroups) {`
);

// 3. Header Simulation Widget
const widgetInsertionPoint = `{/* Transition Actions */}`;
if (!content.includes('Combo Simulator Widget')) {
    content = content.replace(
        widgetInsertionPoint,
        `{/* Combo Simulator Widget */}
                        {combos.length > 0 && (
                            <div className="flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 rounded-xl ml-2">
                                <Sparkles size={14} className="text-indigo-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900/50">Combo Flow:</span>
                                <select
                                    value={selectedComboId || ""}
                                    onChange={(e) => setSelectedComboId(e.target.value || null)}
                                    className="bg-transparent text-[11px] font-black uppercase tracking-widest text-indigo-600 outline-none cursor-pointer max-w-[220px]"
                                >
                                    <option value="" className="text-zinc-500">None (Slot View)</option>
                                    {combos.map((c: any) => (
                                        <option key={c.groupId} value={c.groupId}>{c.groupCode}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="h-8 w-px bg-zinc-100 mx-2" />
                        
                        ${widgetInsertionPoint}`
    );
}

// 4. Custom block rendering
const originalBlock = `{semester.subjects?.map((sub: any) => {
                                        const isElective = !!sub.groupId; // Implementation detail: if linked to group, it's elective/combo
                                        return (
                                            <div 
                                                key={sub.subjectId} 
                                                className={\`p-5 rounded-[1.5rem] bg-white border shadow-sm transition-all relative overflow-hidden group \${isElective ? "border-emerald-100/50" : "border-zinc-100"}\`}
                                            >
                                                {isElective && <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-400" />}
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className={\`text-[10px] font-black uppercase tracking-widest \${isElective ? "text-emerald-500" : "text-primary"}\`}>
                                                        {sub.subjectCode}
                                                    </span>
                                                    {isElective && (
                                                        <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter">
                                                            Elective/Combo
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="text-sm font-black text-zinc-900 leading-snug mb-3 group-hover:text-primary transition-colors">
                                                    {sub.subjectName}
                                                </h4>
                                                <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-50">
                                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                                        <Layers size={12} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">{sub.credits || 3} CR</span>
                                                    </div>
                                                    <button className="w-7 h-7 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-300 hover:bg-zinc-900 hover:text-white transition-all">
                                                        <Info size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!semester.subjects || semester.subjects.length === 0) && (
                                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-200 border-2 border-dashed border-zinc-100 rounded-[2rem] py-12">
                                            <Box size={24} strokeWidth={1} />
                                            <p className="text-[10px] font-black uppercase tracking-widest mt-2">Zero Registry</p>
                                        </div>
                                    )}`;

const newBlock = `{(() => {
                                        const subjects = semester.subjects || [];
                                        const standalones = subjects.filter((s: any) => !s.groupId);
                                        const comboSubjects = subjects.filter((s: any) => curriculumGroups.find((g: any) => g.groupId === s.groupId)?.type === 'COMBO');
                                        const electiveSubjects = subjects.filter((s: any) => curriculumGroups.find((g: any) => g.groupId === s.groupId)?.type === 'ELECTIVE');

                                        const activeComboSubjects = selectedComboId 
                                            ? comboSubjects.filter((s: any) => s.groupId === selectedComboId)
                                            : [];
                                        
                                        const electiveGroupIds = Array.from(new Set(electiveSubjects.map((s: any) => s.groupId as string))).filter(Boolean) as string[];

                                        return (
                                            <>
                                                {/* Standalones */}
                                                {standalones.map((sub: any) => (
                                                    <div 
                                                        key={sub.subjectId} 
                                                        className="p-5 rounded-[1.5rem] bg-white border border-zinc-100 shadow-sm transition-all group hover:border-primary/20 hover:shadow-md"
                                                    >
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                                                                {sub.subjectCode}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-zinc-900 leading-snug mb-3 group-hover:text-primary transition-colors">
                                                            {sub.subjectName}
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-50">
                                                            <div className="flex items-center gap-1.5 text-zinc-400">
                                                                <Layers size={12} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{sub.credits || 0} CR</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Combo Subjects */}
                                                {activeComboSubjects.map((sub: any) => (
                                                    <div 
                                                        key={\`combo-\${sub.subjectId}\`} 
                                                        className="p-5 rounded-[1.5rem] bg-indigo-50 border border-indigo-100 shadow-sm transition-all relative overflow-hidden group hover:shadow-md"
                                                    >
                                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-400" />
                                                        <div className="flex justify-between items-start mb-3 pl-1">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                                                                {sub.subjectCode}
                                                            </span>
                                                            <span className="text-[8px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                                Combo
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-black text-indigo-950 leading-snug mb-3 pl-1">
                                                            {sub.subjectName}
                                                        </h4>
                                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-indigo-100/50 pl-1">
                                                            <div className="flex items-center gap-1.5 text-indigo-400">
                                                                <Layers size={12} />
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{sub.credits || 0} CR</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Elective Groups */}
                                                {electiveGroupIds.map(gid => {
                                                    const group = curriculumGroups.find((g: any) => g.groupId === gid);
                                                    if (!group) return null;
                                                    const groupSubs = electiveSubjects.filter((s: any) => s.groupId === gid);
                                                    return (
                                                        <div 
                                                            key={\`elective-group-\${gid}\`}
                                                            onClick={() => setActiveElectiveGroup({ group, subjects: groupSubs })}
                                                            className="p-5 rounded-[1.5rem] bg-emerald-50 border border-emerald-200 shadow-sm transition-all cursor-pointer relative overflow-hidden group hover:bg-emerald-100 hover:shadow-md hover:-translate-y-1"
                                                        >
                                                            <div className="absolute top-0 right-4 w-12 h-2 bg-emerald-200 rounded-b-lg opacity-50" />
                                                            <div className="flex justify-between items-start mb-3">
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                                    {group.groupCode}
                                                                </span>
                                                                <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                                                    <Layers size={10} /> {groupSubs.length} Modules
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-black text-emerald-900 leading-snug mb-3">
                                                                {group.groupName}
                                                            </h4>
                                                            <div className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest flex items-center gap-2">
                                                                Click to Browse <ArrowRight size={12} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                
                                                {(!subjects || subjects.length === 0) && (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-zinc-200 border-2 border-dashed border-zinc-100 rounded-[2rem] py-12">
                                                        <Box size={24} strokeWidth={1} />
                                                        <p className="text-[10px] font-black uppercase tracking-widest mt-2">Zero Registry</p>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}`;

if (content.includes('const isElective = !!sub.groupId;')) {
    content = content.replace(originalBlock, newBlock);
}

// 5. Elective Modal component at end
const modalInsertion = `
            {/* Elective Content Modal */}
            <AnimatePresence>
                {activeElectiveGroup && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveElectiveGroup(null)}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden w-full max-w-4xl max-h-[85vh] flex flex-col border border-zinc-100"
                        >
                            <div className="px-8 py-6 flex items-center justify-between border-b border-zinc-100 bg-emerald-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <Layers size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">{activeElectiveGroup.group.groupCode}</span>
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black uppercase tracking-widest">Elective Group</span>
                                        </div>
                                        <h2 className="text-xl font-black text-zinc-900">{activeElectiveGroup.group.groupName}</h2>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setActiveElectiveGroup(null)}
                                    className="w-10 h-10 rounded-xl bg-white border border-zinc-200 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 flex items-center justify-center transition-all shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-8 bg-zinc-50">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {activeElectiveGroup.subjects.map((sub: any) => (
                                        <div 
                                            key={sub.subjectId} 
                                            className="p-5 rounded-[1.5rem] bg-white border border-zinc-200 shadow-sm transition-all relative overflow-hidden group hover:border-emerald-300 hover:shadow-md"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                    {sub.subjectCode}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-black text-zinc-900 leading-snug mb-3 group-hover:text-emerald-700 transition-colors">
                                                {sub.subjectName}
                                            </h4>
                                            <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-50">
                                                <div className="flex items-center gap-1.5 text-zinc-400">
                                                    <BookOpen size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{sub.credits || 0} CR</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );`;

if (!content.includes('Elective Content Modal')) {
    content = content.replace(`        </div>\r\n    );\r\n}`, `${modalInsertion}\r\n}`);
    content = content.replace(`        </div>\n    );\n}`, `${modalInsertion}\n}`);
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Update absolute successful');
