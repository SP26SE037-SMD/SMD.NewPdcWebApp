const fs = require('fs');
const file = '/Users/mycomputer/Documents/DoAn/smd/UI/SMD.NewPdcWebApp/src/app/dashboard/pdcm/tasks/[taskId]/information/page.tsx';
let data = fs.readFileSync(file, 'utf8');

const oldCheck = `    if (isTaskLoading || (!!syllabusId && isSyllabusLoading) || (!!subjectId && isSubjectLoading)) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }`;

const newCheck = `    const isMajorTask = !syllabusId && realTask && !realTask?.syllabus;

    if (isTaskLoading || (!!syllabusId && isSyllabusLoading) || (!!subjectId && isSubjectLoading)) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: C.primary }}></div>
            </div>
        );
    }

    if (isMajorTask) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-xl shadow-sm border" style={{ borderColor: C.outlineVariant + '33' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.primaryContainer }}>
                    <span className="material-symbols-outlined text-3xl" style={{ color: C.onPrimaryContainer }}>domain</span>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: C.onSurface }}>Major Operations Task</h3>
                <p className="max-w-md mb-6 text-sm" style={{ color: C.onSurfaceVariant }}>
                    This task is related to Academic Major review and enactment. Detailed Syllabus properties are not applicable here.
                </p>
                <div className="grid grid-cols-2 gap-4 max-w-sm w-full text-left">
                    <div className="p-4 rounded-lg" style={{ background: C.surfaceContainer }}>
                        <p className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: C.onSurfaceVariant }}>Task Type</p>
                        <p className="font-semibold" style={{ color: C.onSurface }}>{realTask?.type || 'MAJOR TASK'}</p>
                    </div>
                    <div className="p-4 rounded-lg" style={{ background: C.surfaceContainer }}>
                        <p className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: C.onSurfaceVariant }}>Priority</p>
                        <p className="font-semibold" style={{ color: C.onSurface }}>{realTask?.priority || 'NORMAL'}</p>
                    </div>
                    <div className="col-span-2 p-4 rounded-lg" style={{ background: C.surfaceContainer }}>
                        <p className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: C.onSurfaceVariant }}>Task Name</p>
                        <p className="font-semibold text-sm leading-tight" style={{ color: C.onSurface }}>{realTask?.taskName || 'Review Major'}</p>
                    </div>
                </div>
            </div>
        );
    }`;

data = data.replace(oldCheck, newCheck);
fs.writeFileSync(file, data);
