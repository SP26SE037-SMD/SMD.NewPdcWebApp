export default function ReviewActionTab({ curriculumId }: { curriculumId?: number }) {
        return (
                <div className="max-w-4xl mx-auto pt-0 pb-6">
                        <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl shadow-sm border border-outline-variant/20">
                                <div className="mb-6 pb-4 border-b border-surface-container-highest">
                                        <h2 className="text-2xl font-bold tracking-tight text-on-surface">
                                                Final Curriculum Review
                                        </h2>
                                        <p className="text-sm text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
                                                Please provide your official feedback below. This note will be attached to the curriculum logs. Once ready, choose to either request a revision or officially approve the structure.
                                        </p>
                                </div>

                                <div className="mb-6">
                                        <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[20px] text-primary">
                                                        history_edu
                                                </span>
                                                Official Auditor Note
                                        </h3>
                                        <div className="relative group">
                                                <textarea
                                                        className="w-full h-32 bg-surface-container-low border border-transparent group-hover:border-outline-variant/30 rounded-2xl p-6 text-sm focus:ring-2 focus:ring-primary/20 focus:bg-white focus:border-primary transition-all resize-none shadow-inner"
                                                        placeholder="Add detailed feedback, required changes, or general notes for the faculty..."
                                                ></textarea>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2 px-2 opacity-80">
                                                <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                                                        info
                                                </span>
                                                <p className="text-xs text-on-surface-variant font-medium">
                                                        Visibility: Academic Board & Department Leads
                                                </p>
                                        </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                                        <button className="w-full sm:w-1/2 py-4 bg-white border border-error/50 text-error hover:bg-error hover:border-error hover:text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98]">
                                                <span className="material-symbols-outlined text-[20px]">
                                                        assignment_return
                                                </span>
                                                Request Revision
                                        </button>
                                        <button className="w-full sm:w-1/2 py-4 bg-primary text-white border border-primary hover:bg-[#388e3c] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all duration-300 active:scale-[0.98]">
                                                <span className="material-symbols-outlined text-[20px]">
                                                        task_alt
                                                </span>
                                                Approve Structure
                                        </button>
                                </div>
                        </div>
                </div>
        );
}
