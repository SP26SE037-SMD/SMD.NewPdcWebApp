import re

with open("src/components/dashboard/pdcm-content.tsx", "r") as f:
    text = f.read()

# Locate DevelopCard
start_develop = text.find('/* ─── Develop Task Card ─── */')
start_review = text.find('/* ─── Review Task Card ─── */')
end_review = text.find('/* ─── Sidebar Nav Item ─── */')

new_develop_card = '''/* ─── Develop Task Card ─── */
const DevelopCard = ({ task, isAccepting, onAccept, router }: { task: any; isAccepting: string | null; onAccept: (t: any) => void; router: any }) => {
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const [now] = React.useState(() => Date.now());
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
    const status = (task.status || '').toUpperCase().replace(/\s+/g, '_');

    const effectiveSyllabusId = task.syllabus?.syllabusId || task.syllabus?.syllabusId;
    const syllabusStatusFromTask = (task.syllabusStatus || '').trim().toUpperCase().replace(/\s+/g, '_');
    
    const { data: syllabusRes } = useQuery({
        queryKey: ['syllabus', effectiveSyllabusId],
        queryFn: () => SyllabusService.getSyllabusById(effectiveSyllabusId!),
        enabled: !!effectiveSyllabusId && status === 'IN_PROGRESS' && !task.syllabusStatus
    });

    const syllabusStatus = syllabusStatusFromTask || (syllabusRes?.data?.status || '').trim().toUpperCase().replace(/\s+/g, '_');
    
    const subjectCode = task.syllabus?.subjectCode || 'SUB';
    const isRevision = status === 'REVISION_REQUESTED';
    
    // Status Display config
    let statusConfig = { label: 'PENDING', bg: '#f1f5f9', text: '#64748b' };
    if (syllabusStatus === 'PENDING_REVIEW') statusConfig = { label: 'PENDING REVIEW', bg: '#fef3c7', text: '#b45309' };
    else if (status === 'TO_DO') statusConfig = { label: 'TO DO', bg: '#e0e7ff', text: '#0369a1' };
    else if (status === 'IN_PROGRESS') statusConfig = { label: 'IN PROGRESS', bg: '#dcfce7', text: '#15803d' };
    else if (isRevision) statusConfig = { label: 'REVISION REQ', bg: '#fee2e2', text: '#b91c1c' };
    else if (status === 'DONE' || status === 'COMPLETED') statusConfig = { label: 'DONE', bg: '#f1f5f9', text: '#475569' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col h-full bg-white rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-gray-100/80 cursor-pointer overflow-hidden"
            onClick={() => {
                if (status === 'TO_DO' || syllabusStatus === 'PENDING_REVIEW') return; // Do nothing or let buttons handle
                const basePath = isRevision ? 'revisions' : 'tasks';
                router.push(`/dashboard/pdcm/${basePath}/${task.taskId}/information`);
            }}
        >
            {/* Top Row: Subject & Status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-[#409b43ff]/10 text-[#409b43ff]">
                        {subjectCode.substring(0, 3)}
                    </div>
                    <div>
                        <h4 className="font-extrabold text-gray-900 text-sm">{subjectCode}</h4>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold border-b border-transparent">CODE</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span 
                        className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                        style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                    >
                        {statusConfig.label}
                    </span>
                    <DaysLeftBadge daysLeft={daysLeft} />
                </div>
            </div>

            {/* Task Name & Desc */}
            <div className="grow mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug line-clamp-2 group-hover:text-[#409b43ff] transition-colors">
                    {task.taskName || 'Untitled Task'}
                </h3>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                {status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-900 text-white hover:bg-[#409b43ff] hover:shadow-lg hover:shadow-[#409b43ff]/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                    >
                        {isAccepting === task.taskId ? <Loader2 size={16} className="animate-spin" /> : <span>Accept Task</span>}
                    </button>
                ) : (status === 'PENDING_REVIEW' || (status === 'IN_PROGRESS' && syllabusStatus === 'PENDING_REVIEW')) ? (
                    <span className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-amber-50 text-amber-600">
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>hourglass_top</span>
                        Waiting Review
                    </span>
                ) : (
                    <button
                        onClick={() => {
                            const basePath = isRevision ? 'revisions' : 'tasks';
                            router.push(`/dashboard/pdcm/${basePath}/${task.taskId}/information`);
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-700 group-hover:bg-[#409b43ff] group-hover:text-white transition-all hover:shadow-[#409b43ff]/20 active:scale-95"
                    >
                        <span>Workspace</span>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                    </button>
                )}
            </div>
            
            {/* Soft decorative bottom line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#409b43ff] opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};

/* ─── Review Task Card ─── */
const ReviewCard = ({ task, isAccepting, onAccept, router }: { task: any; isAccepting: string | null; onAccept: (t: any) => void; router: any }) => {
    const deadline = task.deadline ? new Date(task.deadline) : null;
    const [now] = React.useState(() => Date.now());
    const daysLeft = deadline ? Math.ceil((deadline.getTime() - now) / 86400000) : null;
    const status = (task.status || '').toUpperCase().replace(/\s+/g, '_');
    const isCompleted = ['APPROVED', 'REVISION_REQUESTED', 'DONE', 'COMPLETED'].includes(status);

    const subjectCode = task.syllabus?.subjectCode || 'SUB';
    
    let statusConfig = { label: 'PENDING', bg: '#f1f5f9', text: '#64748b' };
    if (status === 'PENDING') statusConfig = { label: 'PEER REVIEW', bg: '#e0e7ff', text: '#0369a1' };
    else if (status === 'IN_PROGRESS') statusConfig = { label: 'IN REVIEW', bg: '#dcfce7', text: '#15803d' };
    else if (status === 'APPROVED') statusConfig = { label: 'APPROVED', bg: '#dcfce7', text: '#15803d' };
    else if (status === 'REVISION_REQUESTED') statusConfig = { label: 'REVISION REQ', bg: '#fee2e2', text: '#b91c1c' };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col h-full bg-white rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-gray-100/80 cursor-pointer overflow-hidden"
            onClick={() => {
                if (status === 'PENDING' || status === 'TO_DO') return;
                router.push(`/dashboard/pdcm/reviews/${task.reviewId || task.taskId}`);
            }}
        >
            {/* Top Row: Subject & Status */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm bg-blue-50 text-blue-600">
                        {subjectCode.substring(0, 3)}
                    </div>
                    <div>
                        <h4 className="font-extrabold text-gray-900 text-sm">{subjectCode}</h4>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold border-b border-transparent">CODE</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <span 
                        className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                        style={{ backgroundColor: statusConfig.bg, color: statusConfig.text }}
                    >
                        {statusConfig.label}
                    </span>
                    {!isCompleted && <DaysLeftBadge daysLeft={daysLeft} />}
                </div>
            </div>

            {/* Task Name & Desc */}
            <div className="grow mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {task.taskName || 'Untitled Review'}
                </h3>
                
                {/* Developer Info */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-dashed border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {task.reviewer?.fullName ? task.reviewer.fullName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-medium text-gray-500 truncate">{task.reviewer?.fullName || 'Assigned User'}</span>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto pt-4 flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                {status === 'PENDING' || status === 'TO_DO' ? (
                    <button
                        onClick={() => onAccept(task)}
                        disabled={isAccepting === task.taskId}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-900 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
                    >
                        {isAccepting === task.taskId ? <Loader2 size={16} className="animate-spin" /> : <span>Accept Review</span>}
                    </button>
                ) : isCompleted ? (
                    <button
                        onClick={() => router.push(`/dashboard/pdcm/reviews/${task.reviewId || task.taskId}`)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-gray-50 text-gray-700 hover:bg-gray-200 transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                        <span>View Result</span>
                    </button>
                ) : (
                    <button
                        onClick={() => router.push(`/dashboard/pdcm/reviews/${task.reviewId || task.taskId}`)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition-all hover:shadow-blue-600/20 active:scale-95"
                    >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>rate_review</span>
                        <span>Review Now</span>
                    </button>
                )}
            </div>
            
            {/* Soft decorative bottom line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
};
'''

text = text[:start_develop] + new_develop_card + text[end_review:]
with open("src/components/dashboard/pdcm-content.tsx", "w") as f:
    f.write(text)
    
