"use client";

import React, { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { 
    CheckCircle2, AlertCircle, FileCheck2, Send, 
    ArrowRight, Sparkles, BookOpen, CalendarDays, PieChart, 
    ChevronRight, Loader2, Info
} from 'lucide-react';
import { MOCK_TASKS } from '@/lib/mockData';
import { useQuery } from '@tanstack/react-query';
import { TaskService } from '@/services/task.service';
import { SessionService } from '@/services/session.service';
import { MaterialService } from '@/services/material.service';
import { AssessmentService } from '@/services/assessment.service';
import { SyllabusService } from '@/services/syllabus.service';
import { useToast } from '@/components/ui/Toast';

export default function SubmitPage({ params }: { params: Promise<{ taskId: string }> }) {
    const { taskId } = use(params);
    const router = useRouter();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Fetch Task Details
    const { data: fullTaskResponse, isLoading: isTaskLoading } = useQuery({
        queryKey: ['pdcm-task-detail', taskId],
        queryFn: () => TaskService.getTaskById(taskId),
        enabled: !!taskId
    });

    const taskData = fullTaskResponse?.data;
    const syllabusId = taskData?.syllabus?.syllabusId || (taskData as any)?.syllabusId;

    // Fetch Sessions to ensure count is accurate even if not visited sessions tab
    const { data: sessionsRes } = useQuery({
        queryKey: ['sessions', syllabusId, 'REVISION_REQUESTED'],
        queryFn: () => (syllabusId ? SessionService.getDetailedSessions(syllabusId, 0, 100, 'REVISION_REQUESTED') : null),
        enabled: !!syllabusId
    });

    // Fetch Materials to ensure count is accurate
    const { data: materialsRes } = useQuery({
        queryKey: ['pdcm-materials', syllabusId, 'REVISION_REQUESTED'],
        queryFn: () => (syllabusId ? MaterialService.getMaterialsBySyllabusId(syllabusId, 'REVISION_REQUESTED') : null),
        enabled: !!syllabusId
    });

    // Fetch Assessments (already synced in Assessments tab, but safe to fetch here too if needed)
    // Actually we can rely on Redux for assessments if we want, but fetching is more robust for Submit page.
    const { data: assessmentsRes } = useQuery({
        queryKey: ['assessments', syllabusId, 'REVISION_REQUESTED'],
        queryFn: () => (syllabusId ? AssessmentService.getAssessmentsBySyllabusId(syllabusId, 'REVISION_REQUESTED') : null),
        enabled: !!syllabusId
    });

    // Memoized fallbacks to prevent Redux selector warnings
    const emptyArray: any[] = [];
    const emptyObject = {};

    const reduxSessions = useSelector((state: RootState) => (syllabusId ? state.syllabus.sessionsDB[syllabusId] : emptyArray) || emptyArray);
    const reduxAssessments = useSelector((state: RootState) => (syllabusId ? state.syllabus.assessmentsDB[syllabusId] : emptyArray) || emptyArray);
    const reduxMaterials = useSelector((state: RootState) => (taskId ? state.syllabus.materialsDB[taskId] : emptyObject) || emptyObject);

    // Use Query data first, fallback to Redux
    const sessions = (sessionsRes as any)?.data?.content || (sessionsRes as any)?.data || reduxSessions;
    const assessments = (assessmentsRes as any)?.data?.content || (assessmentsRes as any)?.data || reduxAssessments;
    const materialsCount = (materialsRes as any)?.data?.content?.length || (materialsRes as any)?.data?.length || Object.keys(reduxMaterials).length;

    // Detection
    const isReviewTask = taskData?.type === "Curriculum Review" || taskData?.taskName?.toLowerCase().includes('review');

    if (isTaskLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                <p className="text-zinc-500 font-bold">Verifying configuration...</p>
            </div>
        );
    }

    const totalWeight = assessments.reduce((sum: number, a: any) => sum + (+a.weight || 0), 0);
    const hasSessions = sessions.length > 0;
    const materialCount = materialsCount;
    const isWeightValid = totalWeight === 100;
    const isValidated = isWeightValid && hasSessions;

    if (isReviewTask) {
        return <div className="text-center py-20">Review mode interface coming soon...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-black uppercase tracking-widest border border-primary-100">
                    <Sparkles size={14} /> Ready for Review
                </div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Revision Resubmission</h1>
                <p className="text-zinc-500 max-w-xl mx-auto font-medium">Please review the checklist below to ensure all revised syllabus components meet the required standards before resubmitting to the reviewer.</p>
            </div>

            {/* Component Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Materials', value: materialCount, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Sessions', value: sessions.length, icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Assessments', value: assessments.length, icon: PieChart, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-zinc-100 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                            <div className="text-2xl font-black text-zinc-900">{stat.value} <span className="text-sm font-medium text-zinc-400">Items</span></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Checklist */}
            <div className="bg-white border border-zinc-200 rounded-[40px] overflow-hidden shadow-xl shadow-zinc-200/20">
                <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-lg">
                            <FileCheck2 size={20} />
                        </div>
                        <h2 className="text-xl font-black text-zinc-900">Submission Checklist</h2>
                    </div>
                    {isValidated && (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                            <CheckCircle2 size={16} /> All systems clear
                        </div>
                    )}
                </div>
                
                <div className="p-2 space-y-2">
                    {/* Item 1: Sessions */}
                    <div className={`p-6 rounded-[32px] flex items-center justify-between transition-all ${hasSessions ? 'bg-emerald-50/30' : 'bg-zinc-50'}`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${hasSessions ? 'bg-white text-emerald-600 border border-emerald-100' : 'bg-white text-zinc-300 border border-zinc-100'}`}>
                                {hasSessions ? <CheckCircle2 size={28} /> : <Info size={28} />}
                            </div>
                            <div>
                                <h3 className="font-black text-zinc-900 leading-none mb-1.5 flex items-center gap-2 text-lg">
                                    Syllabus Sessions
                                    {hasSessions && <span className="bg-emerald-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>}
                                </h3>
                                <p className="text-sm font-medium text-zinc-500">
                                    {hasSessions 
                                        ? `Successfully defined ${sessions.length} interactive sessions.` 
                                        : "At least one session is required before submission."}
                                </p>
                            </div>
                        </div>
                        {!hasSessions && (
                            <button 
                                onClick={() => router.push(`/dashboard/pdcm/revisions/${taskId}/sessions`)}
                                className="px-5 py-2.5 rounded-xl bg-primary-600 text-white text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-all flex items-center gap-2 shadow-lg shadow-primary-600/20"
                            >
                                Setup Sessions <ChevronRight size={14} />
                            </button>
                        )}
                    </div>

                    {/* Item 2: Weights */}
                    <div className={`p-6 rounded-[32px] flex items-center justify-between transition-all ${isWeightValid ? 'bg-emerald-50/30' : 'bg-zinc-50'}`}>
                        <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${isWeightValid ? 'bg-white text-emerald-600 border border-emerald-100' : 'bg-white text-zinc-300 border border-zinc-100'}`}>
                                {isWeightValid ? <CheckCircle2 size={28} /> : <AlertCircle size={28} />}
                            </div>
                            <div>
                                <h3 className="font-black text-zinc-900 leading-none mb-1.5 flex items-center gap-2 text-lg">
                                    Assessment Distribution
                                    {isWeightValid && <span className="bg-emerald-500 w-1.5 h-1.5 rounded-full animate-pulse"></span>}
                                </h3>
                                <p className="text-sm font-medium text-zinc-500">
                                    {isWeightValid 
                                        ? "Perfectly balanced assessment weight totaling 100%." 
                                        : `Current total weight: ${totalWeight}%. Must equal exactly 100%.`}
                                </p>
                            </div>
                        </div>
                        {!isWeightValid && (
                            <button 
                                onClick={() => router.push(`/dashboard/pdcm/revisions/${taskId}/assessments`)}
                                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20"
                            >
                                Fix Weights <ChevronRight size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Submit Action */}
                <div className="p-8 bg-zinc-50/80 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <Info size={18} className="text-zinc-400 shrink-0" />
                        <p className="text-xs font-semibold text-zinc-500 leading-relaxed max-w-sm">
                            Once submitted, the syllabus will be locked and sent to the Head of PDC for professional cross-review.
                        </p>
                    </div>
                    <button 
                        disabled={!isValidated || isSubmitting}
                        onClick={async () => {
                            const accountId = taskData?.account?.accountId || (taskData as any)?.accountId;
                            if (!syllabusId || !accountId) return;
                            
                            setIsSubmitting(true);
                            try {
                                // 1. Update Sessions Status
                                await SessionService.updateSyllabusSessionsStatus(syllabusId, 'PENDING_REVIEW');
                                
                                // 2. Update Assessments Status
                                await AssessmentService.updateSyllabusAssessmentsStatus(syllabusId, 'PENDING_REVIEW');
                                
                                // 3. Update Materials Status
                                await MaterialService.updateSyllabusMaterialsStatus(syllabusId, 'PENDING_REVIEW');
                                
                                // 4. Update Syllabus Status
                                await SyllabusService.updateSyllabusStatus(syllabusId, accountId, 'PENDING_REVIEW');

                                showToast("Syllabus configuration submitted to HoPDC successfully!", "success");
                                router.push('/dashboard/pdcm');
                            } catch (err) {
                                console.error("Submission failed:", err);
                                showToast("Failed to submit syllabus. Please ensure all components are properly configured.", "error");
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                        className={`group relative h-[64px] px-12 rounded-[22px] font-black tracking-wide flex items-center gap-3 transition-all overflow-hidden ${
                            isValidated && !isSubmitting
                                ? 'bg-zinc-900 text-white shadow-2xl shadow-zinc-900/30 hover:scale-[1.02] active:scale-95' 
                                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed opacity-50'
                        }`}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <div className="absolute inset-0 bg-primary-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                                <Send size={22} className="relative group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                <span className="relative">Submit to HoPDC</span>
                                <ArrowRight size={20} className="relative opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
