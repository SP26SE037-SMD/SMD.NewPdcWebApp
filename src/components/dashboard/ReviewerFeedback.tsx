import React from 'react';
import { Reviewer } from '@/services/review-task.service';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';

interface ReviewerFeedbackProps {
    reviewer?: Reviewer;
    comments: {
        title: string;
        content?: string;
    }[];
}

const C = {
    error: "#a73b21",
    errorContainer: "#fd795a",
    surfaceContainerLow: "#ffffff",
    surfaceVariant: "#dee5d8",
    onSurface: "#2d342b",
    onSurfaceVariant: "#5a6157",
    primary: "#41683f",
};

export const ReviewerFeedback: React.FC<ReviewerFeedbackProps> = ({ reviewer, comments }) => {
    // Filter out empty comments
    const activeComments = comments.filter(c => c.content && c.content.trim().length > 0);

    if (activeComments.length === 0) {
        return null; // Nothing to show if no comments are available for this section
    }

    return (
        <div className="mb-8 rounded-2xl overflow-hidden border shadow-sm animate-in fade-in slide-in-from-top-4 duration-500"
            style={{ borderColor: `${C.error}33`, background: `${C.error}08` }}>

            {/* Header / Reviewer Info */}
            <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b"
                style={{ borderColor: `${C.error}22`, background: `${C.error}11` }}>

                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: C.error, color: 'white' }}>
                        <AlertCircle size={18} />
                    </span>
                    <h3 className="font-bold text-lg" style={{ color: C.error, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Revision Requested
                    </h3>
                </div>

                {reviewer && (
                    <div className="flex items-center gap-3">
                        {reviewer.avatarUrl ? (
                            <Image
                                src={reviewer.avatarUrl}
                                alt={reviewer.fullName}
                                width={36}
                                height={36}
                                className="rounded-full object-cover shrink-0 border-2"
                                style={{ borderColor: 'white' }}
                            />
                        ) : (
                            <div className="w-9 h-9 flex items-center justify-center rounded-full shrink-0 font-bold text-sm border-2"
                                style={{ background: C.surfaceVariant, color: C.primary, borderColor: 'white' }}>
                                {reviewer.fullName?.charAt(0).toUpperCase() || 'R'}
                            </div>
                        )}
                        <div className="text-sm">
                            <p className="font-bold leading-none" style={{ color: C.onSurface }}>{reviewer.fullName || 'Reviewer'}</p>
                            <p className="text-[11px] mt-1" style={{ color: C.onSurfaceVariant }}>{reviewer.email}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Comments List */}
            <div className="px-6 py-5 flex flex-col gap-5">
                {activeComments.map((comment, idx) => (
                    <div key={idx} className="flex gap-4">
                        <div className="w-1.5 shrink-0 rounded-full" style={{ background: C.errorContainer }}></div>
                        <div className="flex-1">
                            <h4 className="text-sm font-bold uppercase tracking-widest mb-1.5" style={{ color: C.error }}>
                                {comment.title}
                            </h4>
                            <p className="text-sm leading-relaxed" style={{ color: C.onSurface }}>
                                {comment.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
