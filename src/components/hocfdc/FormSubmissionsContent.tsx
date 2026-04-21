"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FormService } from "@/services/form.service";
import { 
  ChevronLeft, 
  MessageSquare, 
  Clock, 
  User, 
  HelpCircle,
  Loader2,
  Inbox,
  CalendarDay,
  Search
} from "lucide-react";
import { motion } from "framer-motion";

interface FeedbackAnswer {
  id: string;
  questionId: string;
  questionText: string;
  selectedOptionId: string | null;
  selectedOptionText: string | null;
  answerText: string | null;
}

interface FeedbackSubmission {
  id: string;
  accountId: string;
  curriculumId: string;
  submittedAt: string;
  answers: FeedbackAnswer[];
}

export default function FormSubmissionsContent() {
  const params = useParams();
  const router = useRouter();
  const formId = params.formId as string;
  const majorCode = params.majorCode as string;

  const { data: submissionsRaw, isLoading, isError } = useQuery({
    queryKey: ["form-submissions", formId],
    queryFn: () => FormService.getSubmissions(formId),
    enabled: !!formId,
  });

  const submissions = ((submissionsRaw as any)?.data || submissionsRaw) as FeedbackSubmission[];

  const { data: formDetailRaw } = useQuery({
    queryKey: ["form-detail", formId],
    queryFn: () => FormService.getFormById(formId),
    enabled: !!formId,
  });
  const formDetail = (formDetailRaw as any)?.data || formDetailRaw;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="animate-spin text-zinc-900" size={48} />
        <p className="text-sm font-black text-zinc-400 uppercase tracking-widest">Retrieving Submissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col font-sans pb-20">
      {/* ── Header ── */}
      <header className="h-20 bg-white border-b border-zinc-100 flex items-center justify-between px-10 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="h-8 w-px bg-zinc-100" />
          <div className="space-y-0.5">
            <h1 className="text-base font-black text-zinc-900 tracking-tight uppercase">
              {formDetail?.formType || "Feedback"} Submissions
            </h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">
               {submissions?.length || 0} Total Responses Analyzed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="px-5 py-2.5 bg-zinc-50 rounded-xl text-[10px] font-black uppercase tracking-widest border border-zinc-100 text-zinc-500">
              Form ID: {formId.slice(0, 8)}
           </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full px-8 pt-12">
        {submissions && submissions.length > 0 ? (
          <div className="space-y-8">
            {submissions.map((sub, index) => (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 overflow-hidden"
              >
                {/* Submission Header */}
                <div className="px-10 py-8 bg-zinc-50/50 border-b border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-primary shadow-sm">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-zinc-900 uppercase tracking-[0.1em]">
                        Participant #{sub.accountId?.slice(0, 8) || "ANON"}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                          <Clock size={12} />
                          {new Date(sub.submittedAt).toLocaleTimeString()}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400">
                          <MessageSquare size={12} />
                          {sub.answers.length} Responses
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-white rounded-xl border border-zinc-100 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    {new Date(sub.submittedAt).toLocaleDateString("vi-VN")}
                  </div>
                </div>

                {/* Answers Content */}
                <div className="p-10 space-y-10">
                  {sub.answers.map((ans, aIdx) => (
                    <div key={ans.id} className="group relative">
                      <div className="flex items-start gap-8">
                        <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center font-black text-[10px] text-zinc-400 border border-zinc-100 shrink-0 group-hover:bg-primary/5 group-hover:text-primary transition-all">
                          {(aIdx + 1).toString().padStart(2, '0')}
                        </div>
                        <div className="space-y-3 flex-1">
                          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Question</p>
                          <p className="text-base font-black text-zinc-900 tracking-tight leading-snug">
                            {ans.questionText}
                          </p>
                          <div className="mt-4 p-6 bg-zinc-50 rounded-2xl border border-zinc-100 group-hover:bg-white group-hover:border-primary/20 transition-all">
                            <p className="text-xs font-black text-primary uppercase tracking-[0.1em] mb-2 opacity-60">Answer Content</p>
                            <p className="text-sm font-bold text-zinc-600 leading-relaxed">
                              {ans.selectedOptionText || ans.answerText || "No response provided."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-40 flex flex-col items-center justify-center text-zinc-300 gap-6">
             <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-zinc-100 shadow-xl shadow-zinc-200/50 flex items-center justify-center">
                <Inbox size={40} strokeWidth={1.5} className="text-zinc-200" />
             </div>
             <div className="text-center space-y-1">
               <h3 className="text-sm font-black uppercase tracking-[0.3em] text-zinc-400">Inbox Vault Empty</h3>
               <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">No participant data synchronized yet.</p>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
