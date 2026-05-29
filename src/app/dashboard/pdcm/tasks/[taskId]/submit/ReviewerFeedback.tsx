import React, { useState } from 'react';
import { Sparkles, BookOpen, Link2, ChevronUp, ChevronDown } from 'lucide-react';

export function ReviewerFeedback({ feedbackJson }: { feedbackJson: string }) {
    let feedback: any = null;
    try {
        feedback = JSON.parse(feedbackJson);
    } catch (e) {
        return (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800 mb-8">
                <p className="font-bold mb-2">Reviewer Feedback</p>
                <p className="text-sm">{feedbackJson}</p>
            </div>
        );
    }

    if (!feedback.aiResult && !feedback.reviewerComment) return null;

    const { aiResult, reviewerComment } = feedback;

    return (
        <div className="bg-white border border-rose-200 rounded-[32px] overflow-hidden shadow-xl shadow-rose-100/50 mb-12">
            <div className="bg-rose-50 px-8 py-5 border-b border-rose-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-md shrink-0">
                    <span className="material-symbols-outlined">rate_review</span>
                </div>
                <div>
                    <h2 className="text-xl font-black text-rose-900">Syllabus Rejected</h2>
                    <p className="text-sm font-medium text-rose-600">Please address the feedback below before resubmitting</p>
                </div>
            </div>

            <div className="p-8 space-y-6">
                {reviewerComment && (
                    <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100">
                        <p className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2">Reviewer Comment</p>
                        <p className="text-rose-900 leading-relaxed font-medium">{reviewerComment}</p>
                    </div>
                )}

                {aiResult && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={18} className="text-indigo-500" />
                            <p className="text-sm font-black text-indigo-900 uppercase tracking-widest">AI Audit Details</p>
                        </div>

                        <div className="bg-indigo-50 rounded-2xl p-5 border border-indigo-100">
                            <p className="text-indigo-900 font-medium leading-relaxed">{aiResult.conclusion}</p>
                        </div>

                        <div className="grid gap-4 mt-4">
                            {aiResult.sections?.map((section: any, idx: number) => (
                                <SectionCard key={idx} section={section} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function SectionCard({ section }: { section: any }) {
    const [expanded, setExpanded] = useState(section.status === 'FAIL');
    const isFail = section.status === 'FAIL';

    return (
        <div className={`rounded-2xl border overflow-hidden ${isFail ? 'border-amber-200 bg-white' : 'border-emerald-200 bg-white'}`}>
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${isFail ? 'bg-amber-50/50 hover:bg-amber-50' : 'bg-emerald-50/30 hover:bg-emerald-50/60'}`}
            >
                <div className="flex items-center gap-3">
                    {section.id === 'assessments' ? <BookOpen size={16} className={isFail ? "text-amber-500" : "text-emerald-400"} /> : <Link2 size={16} className={isFail ? "text-amber-500" : "text-emerald-400"} />}
                    <p className={`text-sm font-bold ${isFail ? "text-amber-900" : "text-emerald-900"}`}>{section.title}</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${isFail ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-600'}`}>
                        {isFail ? 'Issues Found' : 'Passed'}
                    </span>
                    {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
            </button>

            {expanded && (
                <div className="p-5 border-t border-gray-100 space-y-5">
                    {/* Stats */}
                    {section.stats?.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {section.stats.map((stat: any, i: number) => (
                                <StatCard key={i} stat={stat} />
                            ))}
                        </div>
                    )}

                    {/* Unmapped CLOs */}
                    {section.unmappedClos?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unmapped CLOs</p>
                            <div className="grid gap-2">
                                {section.unmappedClos.map((c: any, i: number) => (
                                    <div key={i} className="flex gap-3 bg-amber-50/50 rounded-xl p-3 border border-amber-200 items-start">
                                        <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg h-fit shrink-0 mt-0.5">{c.code}</span>
                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">{c.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Unmapped Assessments / Sessions */}
                    {section.unmappedAssessments?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unmapped Assessments</p>
                            <div className="grid gap-2">
                                {section.unmappedAssessments.map((a: any, i: number) => (
                                    <div key={i} className="flex gap-3 bg-amber-50/50 rounded-xl p-3 border border-amber-200 items-start">
                                        <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg h-fit shrink-0 mt-0.5">{a.questionType || `Assessment ${i+1}`}</span>
                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">{a.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {section.unmappedSessions?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Unmapped Sessions</p>
                            <div className="grid gap-2">
                                {section.unmappedSessions.map((s: any, i: number) => (
                                    <div key={i} className="flex gap-3 bg-amber-50/50 rounded-xl p-3 border border-amber-200 items-start">
                                        <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-1 rounded-lg h-fit shrink-0 mt-0.5">#{i+1}</span>
                                        <p className="text-xs text-amber-800 leading-relaxed font-medium">{s.title}: {s.suggestion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({ stat }: { stat: any }) {
    const isError = stat.type === 'error';
    const isOk = stat.type === 'ok';

    return (
        <div className={`p-3 rounded-xl border ${isError ? 'bg-amber-50 border-amber-200' : isOk ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isError ? 'text-amber-600' : isOk ? 'text-emerald-500' : 'text-gray-400'}`}>{stat.label}</p>
            <p className={`text-lg font-black ${isError ? 'text-amber-700' : isOk ? 'text-emerald-600' : 'text-gray-700'}`}>{stat.value}</p>
        </div>
    );
}
