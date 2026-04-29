import re

with open("src/components/dashboard/pdcm-content.tsx", "r") as f:
    code = f.read()

# Add import if missing
if "import { PDCMBaseLayout }" not in code:
    code = code.replace("import { motion, AnimatePresence } from 'framer-motion';", "import { motion, AnimatePresence } from 'framer-motion';\nimport { PDCMBaseLayout } from '@/components/layout/PDCMBaseLayout';")

# Find the return block
# It starts at: return (\n        <div className="flex h-screen overflow-hidden" style={{ background: C.surface }}>
return_idx = code.find('return (\n        <div className="flex h-screen overflow-hidden"')

new_return = """    const globalHeaderTabs = [
        { id: 'develop', label: 'My Task', isActive: navTab === 'develop', onClick: () => router.push('/dashboard/pdcm/develop') },
        { id: 'peer-review', label: 'My Review Task', isActive: navTab === 'peer-review', onClick: () => router.push('/dashboard/pdcm/peer-review') },
    ];

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: 'dashboard', isActive: false, onClick: () => {} },
        { id: 'tasks', label: 'My Tasks', icon: 'task', isActive: navTab === 'develop', onClick: () => router.push('/dashboard/pdcm/develop') },
        { id: 'reviews', label: 'Peer Review', icon: 'rate_review', isActive: navTab === 'peer-review', onClick: () => router.push('/dashboard/pdcm/peer-review') },
        { id: 'library', label: 'Library', icon: 'folder', isActive: false, onClick: () => {} },
        { id: 'settings', label: 'Settings', icon: 'settings', isActive: false, onClick: () => {} },
    ];

    return (
        <PDCMBaseLayout
            activeSidebarId={navTab === 'develop' ? 'tasks' : 'reviews'}
            headerTitle={navTab === 'develop' ? 'Development Pipeline' : 'Peer Review Queue'}
            headerTabs={globalHeaderTabs}
            sidebarItems={sidebarItems}
        >
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <header className="mb-10">
                    <h2 className="text-3xl font-black tracking-tight mb-1" style={{ color: C.onSurface }}>
                        {navTab === 'develop' ? 'Development Pipeline' : 'Peer Review Queue'}
                    </h2>
                    <p className="text-sm font-medium" style={{ color: C.onSurfaceVariant }}>
                        {navTab === 'develop' ? 'Manage your syllabus development tasks and deadlines.' : 'Evaluate and provide feedback on your peers\\' work.'}
                    </p>
                </header>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
                    {[
                        { id: 'all', label: 'All Tasks', icon: 'apps' },
                        { id: 'todo', label: 'To Do', icon: 'list_alt' },
                        { id: 'inprogress', label: 'In Progress', icon: 'pending' },
                        { id: 'completed', label: 'Completed', icon: 'task_alt' },
                        ...(navTab === 'develop' ? [{ id: 'revision_requested', label: 'Revisions', icon: 'history_edu' }] : [])
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setStatusTab(tab.id as any)}
                            className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap"
                            style={statusTab === tab.id
                                ? { background: C.primary, color: 'white', boxShadow: '0 4px 12px rgba(45,52,43,0.2)' }
                                : { background: C.surfaceContainerHigh, color: C.onSurfaceVariant }
                            }
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {isLoadingTasks ? (
                    <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p className="text-sm font-bold uppercase tracking-widest">Loading tasks...</p>
                    </div>
                ) : tasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        <AnimatePresence mode="popLayout">
                            {tasks.map((task: any) => (
                                navTab === 'develop' 
                                    ? <DevelopCard key={task.taskId} task={task} isAccepting={isAccepting} onAccept={handleAcceptTask} router={router} />
                                    : <ReviewCard key={task.reviewId || task.taskId} task={task} isAccepting={isAccepting} onAccept={handleAcceptTask} router={router} />
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed rounded-3xl" style={{ borderColor: C.outline + '20', background: C.surfaceContainerLowest }}>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: C.surfaceContainer }}>
                            <span className="material-symbols-outlined text-3xl" style={{ color: C.onSurfaceVariant }}>task</span>
                        </div>
                        <h3 className="text-lg font-bold mb-1" style={{ color: C.onSurface }}>No tasks available</h3>
                        <p className="text-sm" style={{ color: C.onSurfaceVariant }}>You're all caught up! Check back later.</p>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8 mb-12">
                        <button 
                            disabled={page === 0}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white shadow-sm border border-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 hover:shadow"
                        >
                            <span className="material-symbols-outlined text-zinc-600">chevron_left</span>
                        </button>
                        
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setPage(i)}
                                    className={`w-10 h-10 rounded-xl text-sm font-bold transition-all shadow-sm ${page === i ? 'bg-primary text-white shadow-md' : 'bg-white border text-zinc-600 border-zinc-100 hover:bg-zinc-50'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={page >= totalPages - 1}
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white shadow-sm border border-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 hover:shadow"
                        >
                            <span className="material-symbols-outlined text-zinc-600">chevron_right</span>
                        </button>
                    </div>
                )}
            </div>
        </PDCMBaseLayout>
    );
}"""

if return_idx != -1:
    code = code[:return_idx] + new_return

with open("src/components/dashboard/pdcm-content.tsx", "w") as f:
    f.write(code)

