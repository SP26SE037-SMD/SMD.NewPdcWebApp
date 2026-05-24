"use client";

import React, { useEffect, useState } from "react";
import { Loader2, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { FeedbackFormService, FeedbackSubmissionRecord } from "@/services/feedback-form.service";

interface Props {
  formId: string;
}

export function FeedbackSubmissions({ formId }: Props) {
  const [submissions, setSubmissions] = useState<FeedbackSubmissionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchSubmissions = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await FeedbackFormService.getSubmissions(formId);
        if (isMounted) {
          setSubmissions(Array.isArray(data) ? data : []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to load submissions");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (formId) {
      fetchSubmissions();
    }

    return () => {
      isMounted = false;
    };
  }, [formId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading submissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-error/30 py-14 text-center text-error">
        <MessageSquare className="h-8 w-8 opacity-50" />
        <h3 className="font-bold">Error loading submissions</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline/30 py-14 text-center text-on-surface-variant">
        <MessageSquare className="h-8 w-8 text-outline" />
        <h3 className="font-bold">No submissions yet</h3>
        <p className="text-sm">This form has not received any answers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-on-surface">
          Total Submissions: <span className="text-primary">{submissions.length}</span>
        </h3>
      </div>

      <div className="space-y-3">
        {submissions.map((sub, idx) => {
          const isExpanded = expandedId === sub.id;
          const submittedDate = sub.submittedAt
            ? new Date(sub.submittedAt).toLocaleString("vi-VN")
            : "Unknown time";

          return (
            <div
              key={sub.id}
              className="overflow-hidden rounded-xl border border-outline/20 bg-surface transition-all"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-surface-container-lowest"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-on-surface">
                      Submission #{idx + 1}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 text-xs text-on-surface-variant">
                    <span className="font-mono">{sub.id}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{submittedDate}</span>
                  </div>
                </div>
                <div className="text-on-surface-variant">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-outline/10 bg-surface-container-lowest p-4">
                  {(sub.answers || []).length > 0 ? (
                    <div className="space-y-4">
                      {sub.answers.map((answer, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-xs font-semibold text-on-surface-variant">
                            Q: {answer.questionText || answer.questionId}
                          </p>
                          <p className="text-sm font-medium text-on-surface">
                            {answer.answerText || answer.selectedOptionText || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-on-surface-variant italic">
                      No answers found in this submission.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
