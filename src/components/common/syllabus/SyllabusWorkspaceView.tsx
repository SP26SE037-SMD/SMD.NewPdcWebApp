import React, { useState } from 'react';
import { useSyllabusWorkspace } from '@/hooks/useSyllabusWorkspace';
import { SyllabusInfoTab } from './_components/SyllabusInfoTab';
import { SyllabusMaterialsTab } from './_components/SyllabusMaterialsTab';
import { SyllabusSessionsTab } from './_components/SyllabusSessionsTab';
import { SyllabusAssessmentsTab } from './_components/SyllabusAssessmentsTab';
import { Info, BookOpen, Calendar, ClipboardList, Loader2 } from 'lucide-react';
import { SessionDetailModal } from '@/components/dashboard/SessionDetailModal';

export type WorkspaceMode = 'MONITOR' | 'SYNTHESIS';

interface SyllabusWorkspaceViewProps {
    syllabusId: string | undefined;
    mode: WorkspaceMode;
    evaluations?: {
        materials: Record<string, any>;
        sessions: Record<string, any>;
        assessments: Record<string, any>;
    };
    overallFeedback?: {
        materials?: { status: string; note: string };
        sessions?: { status: string; note: string };
        assessments?: { status: string; note: string };
    };
    onOpenMaterial?: (material: any) => void;
    onUpdateStatus?: (type: 'material' | 'sessions' | 'assessments', id: string, status: 'APPROVED' | 'REVISION_REQUESTED' | 'PENDING_REVIEW') => void;
}

export function SyllabusWorkspaceView({ 
    syllabusId, 
    mode, 
    evaluations,
    overallFeedback,
    onOpenMaterial,
    onUpdateStatus
}: SyllabusWorkspaceViewProps) {
    const { syllabus, subject, materials, sessions, assessments, isLoading, isError } = useSyllabusWorkspace(syllabusId);
    const [activeTab, setActiveTab] = useState<'materials' | 'sessions' | 'assessments'>('materials');
    
    // Modal state for session detail (shared across modes)
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-[400px]">
                <Loader2 className="animate-spin mb-4 text-primary-500" size={40} />
                <p className="text-[#5a6157] font-bold uppercase tracking-widest text-[10px]">Synchronizing Syllabus Content...</p>
            </div>
        );
    }

    if (isError || (!syllabus && !isLoading)) {
        return (
            <div className="py-20 text-center text-rose-500 bg-rose-50 rounded-2xl border border-rose-100 mx-6">
                <p className="font-bold">Failed to load syllabus data.</p>
                <p className="text-xs opacity-70">Please check your connection or verify if the syllabus exists.</p>
            </div>
        );
    }

    const tabs = [
        { id: 'materials', label: 'Materials', icon: <BookOpen size={16} /> },
        { id: 'sessions', label: 'Sessions', icon: <Calendar size={16} /> },
        { id: 'assessments', label: 'Assessments', icon: <ClipboardList size={16} /> },
    ];

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-700">
            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-[#f1f5eb] rounded-2xl w-fit mb-6 border border-[#dee1d8]/50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                                ? 'bg-white text-primary-600 shadow-sm ring-1 ring-black/5' 
                                : 'text-[#5a6157] hover:bg-white/50'
                        }`}
                    >
                        <span className="flex items-center">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
                {activeTab === 'materials' && (
                    <SyllabusMaterialsTab 
                        materials={materials} 
                        evaluations={evaluations?.materials}
                        overallFeedback={overallFeedback?.materials}
                        onOpenMaterial={onOpenMaterial}
                        onUpdateStatus={onUpdateStatus ? (id, s) => onUpdateStatus('material', id, s) : undefined}
                    />
                )}
                {activeTab === 'sessions' && (
                    <SyllabusSessionsTab 
                        sessions={sessions} 
                        evaluations={evaluations?.sessions}
                        overallFeedback={overallFeedback?.sessions}
                        onViewDetail={(s) => {
                            setSelectedSession(s);
                            setIsSessionModalOpen(true);
                        }}
                        onUpdateStatus={onUpdateStatus ? (s) => onUpdateStatus('sessions', 'ALL', s) : undefined}
                    />
                )}
                {activeTab === 'assessments' && (
                    <SyllabusAssessmentsTab 
                        assessments={assessments} 
                        evaluations={evaluations?.assessments}
                        overallFeedback={overallFeedback?.assessments}
                        onUpdateStatus={onUpdateStatus ? (s) => onUpdateStatus('assessments', 'ALL', s) : undefined}
                    />
                )}
            </div>

            {/* Shared Modals */}
            <SessionDetailModal 
                isOpen={isSessionModalOpen}
                onClose={() => setIsSessionModalOpen(false)}
                session={selectedSession}
                subjectId={syllabus?.subjectId}
            />
        </div>
    );
}
