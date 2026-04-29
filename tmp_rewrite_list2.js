const fs = require('fs');
const content = fs.readFileSync('src/components/dashboard/pdcm-content.tsx', 'utf8');

let newContent = content.replace(
    /\/\* ─── Develop Task Card ─── \*\/(.|\n)*?\/\* ─── Sidebar Nav Item ─── \*\//m,
    `/* ─── Develop Task Card ─── */
const DevelopCard = ({ task, isAccepting, onAccept, router }: { task: any; isAccepting: string | null; onAccept: (t: any) => void; router: any }) => {
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const [now] = React.useState(() => Date.now());
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
    const status = (task.status || '').toUpperCase().replace(/\\s+/g, '_');

    const effectiveSyllabusId = task.syllabus?.syllabusId || task.syllabus?.syllabusId;

    // Fetch syllabus details if task is In Progress to check its specific status
    const syllabusStatusFromTask = (task.syllabusStatus || '').trim().toUpperCase().replace(/\\s+/g, '_');
    
    const { data: syllabusRes } = useQuery({
        queryKey: ['syllabus', effectiveSyllabusId],
        queryFn: () => SyllabusService.getSyllabusById(effectiveSyllabusId!),
        enabled: !!effectiveSyllabusId && status === 'IN_PROGRESS' && !task.syllabusStatus
    });

    const syllabusStatus = syllabusStatusFromTask || (syllabusRes?.data?.status || '').trim().toUpperCase().replace(/\\s+/g, '_');

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="group px-6 py-5 rounded-2xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 border border-transparent hover:border-zinc-200"
            style={{ background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
        >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: C.surfaceContainer, color: C.onSurfaceVariant }}>
                <span className="material-symbols-outlined text-2xl">menu_book</span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-bold truncate pr-4" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Task'}</h3>
                </div>
                <p className="text-sm truncate" style={{ color: C.onSurfaceVariant }}>{task.description || 'No description provided.'}</p>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-48 gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ background: C.surfaceVariant, color: C.onSurfaceVariant }}>
                        {syllabusStatus === 'PENDING_REVIEW' ? 'PENDING REVIEW' : 
                         status === 'TO_DO' ? 'TO DO' : 
                         status === 'IN_PROGRESS' ? 'IN PROGRESS' : 
                         status === 'REVISION_REQUESTED' ? 'REVISION REQ' : 'DONE'}
                    </span>
                    <DaysLeftBadge daysLeft={daysLeft} />
                </div>
            </div>

            <div className="flex items-center justify-end w-full md:w-36 shrink-0 mt-4 md:mt-0">
                {status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="btn-pdcm-ghost px-5 py-2 rounded-xl text-sm w-full md:w-auto flex items-center justify-center gap-2 transition-all hover:bg-zinc-100"
                        style={{ border: \`1px solid \${C.outline}30\` }}
                    >
                        {isAccepting === task.taskId
                            ? <Loader2 size={16} className="animate-spin" />
                            : <><span className="material-symbols-outlined text-[18px]">edit</span>Accept</>}
                    </button>
                ) : (status === 'PENDING_REVIEW' || (status === 'IN_PROGRESS' && syllabusStatus === 'PENDING_REVIEW')) ? (
                    <span className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold w-full md:w-auto" style={{ color: C.onSurfaceVariant, background: '#f5f5f5' }}>
                        <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                        Pending Review
                    </span>
                ) : (
                    <button
                        onClick={() => {
                            const basePath = status === 'REVISION_REQUESTED' ? 'revisions' : 'tasks';
                            router.push(\`/dashboard/pdcm/\${basePath}/\${task.taskId}/information\`);
                        }}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white w-full md:w-auto flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-105"
                        style={{ background: C.primary, boxShadow: \`0 4px 12px \${C.primary}40\` }}
                    >
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>Do Task
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Review Task Card ─── */
const ReviewCard = ({ task, isAccepting, onAccept, router }: { task: any; isAccepting: string | null; onAccept: (t: any) => void; router: any }) => {
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const [now] = React.useState(() => Date.now());
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
    const status = (task.status || '').toUpperCase().replace(/\\s+/g, '_');
    const isCompleted = ['APPROVED', 'REVISION_REQUESTED', 'DONE', 'COMPLETED'].includes(status);

    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="group px-6 py-5 rounded-2xl transition-all duration-300 flex flex-col md:flex-row items-start md:items-center gap-6 border border-transparent hover:border-zinc-200"
            style={{ background: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
        >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: C.secondaryContainer, color: C.secondary }}>
                <span className="material-symbols-outlined text-2xl">rate_review</span>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-base font-bold truncate pr-4" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Review'}</h3>
                </div>
                <p className="text-sm truncate" style={{ color: C.onSurfaceVariant }}>{task.description || 'No details provided.'}</p>
                
                {/* Reviewer info */}
                <div className="flex items-center gap-2 mt-2 bg-zinc-50 px-3 py-1.5 rounded-lg w-max max-w-full">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0 bg-white" style={{ color: C.onSurface, borderColor: C.surfaceVariant }}>
                        {(task.taskName || 'R').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-xs flex gap-1 items-center truncate">
                        <span className="font-semibold" style={{ color: C.onSurface }}>{task.reviewer?.fullName || 'Assigned Reviewer'}</span>
                        <span className="text-zinc-400">&bull;</span>
                        <span className="text-zinc-500 truncate">{task.reviewer?.email || 'reviewer@university.edu'}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-48 gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md" style={{ background: C.surfaceVariant, color: C.onSurfaceVariant }}>
                        {status === 'PENDING' ? 'PEER REVIEW' : 
                         status === 'IN_PROGRESS' ? 'IN REVIEW' : 
                         status === 'APPROVED' ? 'APPROVED' : 
                         status === 'REVISION_REQUESTED' ? 'REVISION REQ' : status}
                    </span>
                    {!isCompleted && <DaysLeftBadge daysLeft={daysLeft} />}
                </div>
            </div>

            <div className="flex items-center justify-end w-full md:w-40 shrink-0 mt-4 md:mt-0">
                {status === 'PENDING' || status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="btn-pdcm-ghost px-5 py-2 rounded-xl text-sm w-full md:w-auto flex items-center justify-center gap-2 transition-all hover:bg-zinc-100"
                        style={{ border: \`1px solid \${C.outline}30\` }}
                    >
                        {isAccepting === task.taskId
                            ? <Loader2 size={16} className="animate-spin" />
                            : <><span className="material-symbols-outlined text-[18px]">fact_check</span>Accept</>}
                    </button>
                ) : isCompleted ? (
                    <button
                        onClick={() => router.push(\`/dashboard/pdcm/reviews/\${task.reviewId || task.taskId}\`)}
                        className="btn-pdcm-ghost px-5 py-2 rounded-xl text-sm w-full md:w-auto flex items-center justify-center gap-2 transition-all hover:bg-zinc-100"
                        style={{ border: \`1px solid \${C.outline}30\` }}
                    >
                        <span className="material-symbols-outlined text-[18px]">visibility</span>Result
                    </button>
                ) : (
                    <button
                        onClick={() => router.push(\`/dashboard/pdcm/reviews/\${task.reviewId || task.taskId}\`)}
                        className="px-5 py-2 rounded-xl text-sm font-bold text-white w-full md:w-auto flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-105"
                        style={{ background: C.primary, boxShadow: \`0 4px 12px \${C.primary}40\` }}
                    >
                        <span className="material-symbols-outlined text-[18px]">rate_review</span>Review
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Sidebar Nav Item ─── */`
);

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', newContent);
