"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { PDCMBaseLayout } from '@/components/layout/PDCMBaseLayout';
import { ReviewTaskService, ReviewTaskItem } from '@/services/review-task.service';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const C = {
    primary: "#41683f",
    primaryDim: "#355c34",
    primaryContainer: "#c1eeba",
    onPrimaryContainer: "#345a32",
    surface: "#ffffff",
    surfaceContainer: "#f4f7f1",
    surfaceContainerHigh: "#e4eade",
    surfaceContainerLowest: "#ffffff",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    tertiaryContainer: "#f9fbb7",
    onTertiaryFixed: "#4c4e1b",
    onTertiaryFixedVariant: "#686b35",
};

// Local MOCK_TASKS are no longer needed as they are now in the Service layer

export default function PeerReviewPage() {
    const router = useRouter();
    const { user } = useSelector((state: RootState) => state.auth);
    const [tasks, setTasks] = React.useState<ReviewTaskItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchTasks = async () => {
            if (user?.id) {
                try {
                    const response = await ReviewTaskService.getReviewTasks(user.id);
                    // Filter out tasks with REVISION_REQUESTED status (normalized)
                    const filteredTasks = (response.data.content || []).filter(
                        (t: ReviewTaskItem) => {
                            const status = (t.status || '').toUpperCase().replace(/\s+/g, '_');
                            return status !== 'REVISION_REQUESTED';
                        }
                    );
                    setTasks(filteredTasks);
                } catch (error) {
                    console.error('Failed to fetch tasks:', error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                // Fallback for demo if no user
                const response = await ReviewTaskService.getReviewTasks('demo');
                setTasks(response.data.content);
                setIsLoading(false);
            }
        };
        fetchTasks();
    }, [user?.id]);

    const sidebarItems = [
        { id: 'overview', label: 'Overview', icon: 'dashboard', onClick: () => { } },
        { id: 'develop', label: 'Develop Syllabus', icon: 'edit_note', onClick: () => router.push('/dashboard/pdcm') },
        { id: 'peer-review', label: 'Peer Review', icon: 'rate_review', isActive: true, onClick: () => { } },
        { id: 'archive', label: 'Archive', icon: 'inventory_2', onClick: () => { } },
    ];

    const headerTabs = [
        { id: 'available', label: 'Available Tasks', isActive: false, onClick: () => { } },
        { id: 'my-tasks', label: 'My Tasks', isActive: false, onClick: () => { } },
        { id: 'peer-review', label: 'Peer Review', isActive: true, onClick: () => { } },
    ];

    return (
        <PDCMBaseLayout
            activeSidebarId="peer-review"
            headerTitle="Peer Review Queue"
            headerTabs={headerTabs}
        >
            <section className="mb-8 w-full">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: C.onSurface, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Peer Review Queue
                        </h1>
                        <p className="text-on-surface-variant text-sm leading-relaxed max-w-xl">
                            Ensure academic excellence by auditing syllabuses from your peers. Your critical feedback shapes the future of the curriculum.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="bg-[#f4f7f1] px-4 py-2 rounded-xl flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg" style={{ color: C.primary }}>draw</span>
                            <div>
                                <p className="text-[9px] uppercase tracking-wider font-bold text-on-surface-variant leading-none">Pending Reviews</p>
                                <p className="text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{tasks.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                            </div>
                        ) : tasks.length > 0 ? (
                            tasks.map((task) => (
                                <div key={task.reviewId} className="bg-white p-4 rounded-xl group transition-all duration-300 hover:shadow-[0_4px_24px_rgba(45,52,43,0.06)] flex flex-col md:flex-row gap-4 items-start md:items-center relative overflow-hidden border border-transparent hover:border-primary/5 shadow-sm">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                                    <div className="w-12 h-12 rounded-lg bg-[#f4f7f1] flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-2xl" style={{ color: C.primary }}>
                                            {task.titleTask.toLowerCase().includes('macro') ? 'menu_book' :
                                                task.titleTask.toLowerCase().includes('quantum') ? 'biotech' : 'architecture'}
                                        </span>
                                    </div>
                                    <div className="grow min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-full ${task.status === 'PENDING' ? 'bg-[#c1eeba] text-[#345a32]' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                            <span className="text-[10px] text-on-surface-variant font-medium">Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                        </div>
                                        <h3 className="text-base font-bold text-on-surface truncate" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                            {task.titleTask}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <img className="w-4 h-4 rounded-full object-cover" src={task.reviewer.avatarUrl} alt={task.reviewer.fullName} />
                                            <p className="text-[11px] text-on-surface-variant">Author: <span className="text-on-surface font-semibold">{task.reviewer.fullName}</span></p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/dashboard/pdcm/reviews/${task.reviewId}/information`)}
                                        className="px-5 py-2.5 rounded-lg text-white font-bold text-xs whitespace-nowrap shadow-md transition-transform hover:scale-105 active:scale-95"
                                        style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDim} 100%)` }}
                                    >
                                        Start Review
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="bg-[#f4f7f1] p-12 rounded-2xl text-center border-2 border-dashed border-gray-200">
                                <span className="material-symbols-outlined text-6xl text-gray-200 mb-4">folder_off</span>
                                <h3 className="text-xl font-bold text-gray-400 mb-2">Không có task nào</h3>
                                <p className="text-gray-400 text-sm max-w-sm mx-auto">Vui lòng quay lại sau hoặc kiểm tra các mục khác trong hệ thống.</p>
                            </div>
                        )}
                    </div>

                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-[#f4f7f1] p-6 rounded-xl">
                            <h4 className="font-bold text-lg mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Review Guidelines</h4>
                            <ul className="space-y-4">
                                {[
                                    "Check for alignment with current university accreditation standards.",
                                    "Verify that reading lists include 30% diverse perspectives.",
                                    "Assess the feasibility of the 12-week assessment schedule."
                                ].map((text, i) => (
                                    <li key={i} className="flex gap-3">
                                        <span className="material-symbols-outlined text-lg" style={{ color: C.primary }}>check_circle</span>
                                        <p className="text-sm text-on-surface-variant leading-relaxed">{text}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-[#f9fbb7] p-6 rounded-xl">
                            <div className="flex items-center gap-3 mb-3" style={{ color: C.onTertiaryFixed }}>
                                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>lightbulb</span>
                                <h4 className="font-bold text-lg" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Atelier Pro-Tip</h4>
                            </div>
                            <p className="text-sm leading-relaxed mb-4 italic" style={{ color: C.onTertiaryFixedVariant }}>
                                "Constructive feedback focuses on the clarity of learning outcomes. Use the syllabus table tool to suggest specific content pivots."
                            </p>
                            <button className="font-bold text-sm underline underline-offset-4 hover:text-primary transition-colors" style={{ color: C.onTertiaryFixed }}>
                                View Best Practices
                            </button>
                        </div>

                        <div className="relative h-64 rounded-xl overflow-hidden group">
                            <div className="absolute inset-0 opacity-80 z-10" style={{ background: 'linear-gradient(135deg, #41683f 0%, #355c34 100%)' }}></div>
                            <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqnjlNQKc6E1bUAXybGo3XOrG547FElYWFvy6NyD-3STXk5wzM7FHST1nAPa-iIfTvO3NX07cEc_i8mwmkOMArKv8Wf-IvAD633fH6l6N0pUsWqRsRXDZmWfL3aI9xKqcVILE4VVbo9Tljb4EtrBIbBGXCzSJ_ZdjZDQsUYqnSKiPVkmEGYxSLwc1ZV2KK-ma8FURGRV5YXcdoW6eFOGAkzxNWE9IvcXyUY9m5mVQJnhCxIwjWYKhkcdt15aeBka8_oDp9nwrA2jse"
                                alt="Aesthetic workspace"
                            />
                            <div className="absolute inset-0 z-20 p-5 flex flex-col justify-end">
                                <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-0.5">Peer Contribution</p>
                                <h5 className="text-white text-lg font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Earn Faculty Credits</h5>
                                <p className="text-white/80 text-[11px] mt-1">Every review completed adds to your professional development portfolio.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </PDCMBaseLayout>
    );
}
