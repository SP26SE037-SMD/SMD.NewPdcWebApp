import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ReviewerFeedback } from './ReviewerFeedback';
import { Reviewer } from '@/services/review-task.service';

interface RevisionRequestedModalProps {
    isOpen: boolean;
    onClose: () => void;
    reviewer?: Reviewer;
    description?: string;
    comment?: string;
}

export const RevisionRequestedModal: React.FC<RevisionRequestedModalProps> = ({
    isOpen,
    onClose,
    reviewer,
    description,
    comment
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div 
                className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                style={{ maxHeight: '90vh' }}
            >
                <div className="absolute top-4 right-4 z-10">
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="overflow-y-auto p-2">
                    <ReviewerFeedback 
                        reviewer={reviewer}
                        comments={[
                            { title: 'Task Requirement / Description', content: description },
                            { title: 'Additional Comments', content: comment }
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};
