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
    
    // Fetch syllabus details if not provided by parent to check its specific status
    const { data: syllabusRes } = useQuery({
        queryKey: ['syllabus', effectiveSyllabusId],
        queryFn: () => SyllabusService.getSyllabusById(effectiveSyllabusId!),
        enabled: !!effectiveSyllabusId && status === 'IN_PROGRESS' && !task.syllabusStatus
    });

    const syllabusStatus = syllabusStatusFromTask || (syllabusRes?.data?.status || '').trim().toUpperCase().replace(/\\s+/g, '_');

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl hover:scale-[1.01] transition-all flex flex-col md:flex-row items-start md:items-center gap-4 h-full"
            style={{ background: C.surfaceContainerLowest, boxShadow: '0 8px 32px rgba(45,52,43,0.06)' }}
        >
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: C.surfaceVariant, color: C.onSurfaceVariant }}>
                        {syllabusStatus === 'PENDING_REVIEW' ? 'PENDING REVIEW' : 
                         status === 'TO_DO' ? 'TO DO' : 
                         status === 'IN_PROGRESS' ? 'IN PROGRESS' : 
                         status === 'REVISION_REQUESTED' ? 'REVISION REQ' : 'DONE'}
                    </span>
                    <DaysLeftBadge daysLeft={daysLeft} />
                </div>
                <h3 className="text-lg font-bold line-clamp-1" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Task'}</h3>
                <p className="text-xs line-clamp-1 mt-1" style={{ color: C.onSurfaceVariant }}>{task.description || 'No description provided.'}</p>
            </div>

            <div className="flex-shrink-0 flex items-center md:justify-end w-full md:w-auto mt-4 md:mt-0">
                {status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="btn-pdcm-ghost px-5 py-2 rounded-lg text-sm w-full md:w-auto shrink-0"
                    >
                        {isAccepting === task.taskId
                            ? <Loader2 size={14} className="animate-spin" />
                            : <><span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>edit</span>Accept</>}
                    </button>
                ) : (status === 'PENDING_REVIEW' || (status === 'IN_PROGRESS' && syllabusStatus === 'PENDING_REVIEW')) ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shrink-0 w-full md:w-auto justify-center" style={{ color: C.onSurfaceVariant, background: C.surfaceVariant }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hourglass_top</span>
                        Pending Review
                    </span>
                ) : (
                    <button
                        onClick={() => {
                            const basePath = status === 'REVISION_REQUESTED' ? 'revisions' : 'tasks';
                            router.push(\`/dashboard/pdcm/\${basePath}/\${task.taskId}/information\`);
                        }}
                        className="btn-pdcm-ghost px-5 py-2 rounded-lg text-sm w-full md:w-auto shrink-0"
                    >
                        <span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>task</span>Do Task
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-xl hover:scale-[1.01] transition-all flex flex-col md:flex-row items-start md:items-center gap-4 h-full"
            style={{ background: C.surfaceContainerLowest, boxShadow: '0 8px 32px rgba(45,52,43,0.06)' }}
        >
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{ background: C.surfaceVariant, color: C.onSurfaceVariant }}>
                        {status === 'PENDING' ? 'PEER REVIEW' : 
                         status === 'IN_PROGRESS' ? 'IN REVIEW' : 
                         status === 'APPROVED' ? 'APPROVED' : 
                         status === 'REVISION_REQUESTED' ? 'REVISION REQ' : status}
                    </span>
                    {!isCompleted && <DaysLeftBadge daysLeft={daysLeft} />}
                </div>
                <h3 className="text-lg font-bold line-clamp-1" style={{ color: C.onSurface }}>{task.taskName || 'Untitled Review'}</h3>
                <p className="text-xs line-clamp-1 mt-1" style={{ color: C.onSurfaceVariant }}>{task.description || 'No details provided.'}</p>
                
                {/* Reviewer info */}
                <div className="flex items-center gap-3 mt-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0" style={{ background: C.secondaryContainer, color: C.secondary, borderColor: C.surfaceVariant }}>
                        {(task.taskName || 'R').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-[11px] flex gap-2 items-center">
                        <span className="font-bold line-clamp-1" style={{ color: C.onSurface }}>{task.reviewer?.fullName || 'Assigned Reviewer'}</span>
                        <span className="opacity-60 truncate" style={{ color: C.onSurfaceVariant }}>{task.reviewer?.email || 'reviewer@university.edu'}</span>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0 flex">
                {status === 'PENDING' || status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="btn-pdcm-ghost px-5 py-2 rounded-lg text-sm w-full md:w-auto shrink-0"
                    >
                        {isAccepting === task.taskId
                            ? <Loader2 size={14} className="animate-spin" />
                            : <><span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>fact_check</span>Accept &amp; Review</>}
                    </button>
                ) : isCompleted ? (
                    <button
                        onClick={() => router.push(\`/dashboard/pdcm/reviews/\${task.reviewId || task.taskId}\`)}
                        className="btn-pdcm-ghost px-5 py-2 rounded-lg text-sm w-full md:w-auto shrink-0"
                    >
                        <span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>visibility</span>View Result
                    </button>
                ) : (
                    <button
                        onClick={() => router.push(\`/dashboard/pdcm/reviews/\${task.reviewId || task.taskId}\`)}
                        className="btn-pdcm-ghost px-5 py-2 rounded-lg text-sm w-full md:w-auto shrink-0"
                    >
                        <span className="material-symbols-outlined transition-colors" style={{ fontSize: '18px' }}>rate_review</span>Review Now
                    </button>
                )}
            </div>
        </motion.div>
    );
};

/* ─── Sidebar Nav Item ─── */`
);

fs.writeFileSync('src/components/dashboard/pdcm-content.tsx', newContent);
