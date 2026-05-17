"use client";

import React, { useEffect, useState } from "react";
import { Loader2, BarChart3, Star, AlignLeft } from "lucide-react";
import { FeedbackFormService, FeedbackReportData } from "@/services/feedback-form.service";

interface Props {
  formId: string;
}

export function FeedbackReport({ formId }: Props) {
  const [report, setReport] = useState<FeedbackReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await FeedbackFormService.getReport(formId);
        if (isMounted) {
          setReport(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || "Failed to load report");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (formId) {
      fetchReport();
    }

    return () => {
      isMounted = false;
    };
  }, [formId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading report data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-error/30 py-14 text-center text-error">
        <BarChart3 className="h-8 w-8 opacity-50" />
        <h3 className="font-bold">Error loading report</h3>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const questions = report.questions || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-outline/20 bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Total Responses
          </p>
          <p className="mt-2 text-3xl font-extrabold text-primary">
            {report.totalSubmissions ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-outline/20 bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Total Questions
          </p>
          <p className="mt-2 text-3xl font-extrabold text-secondary">
            {questions.length}
          </p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-outline/30 py-14 text-center text-on-surface-variant">
          <BarChart3 className="h-8 w-8 text-outline" />
          <h3 className="font-bold">No questions found</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isChoice = ["RADIO", "DROPDOWN", "CHECKBOX"].includes(q.type);
            const isScale = ["LINEAR_SCALE", "SCALE"].includes(q.type);
            const hasTextAnswers = (q.textAnswers || []).length > 0;

            return (
              <div
                key={q.questionId || idx}
                className="overflow-hidden rounded-2xl border border-outline/20 bg-surface"
              >
                <div className="border-b border-outline/10 bg-surface-container-lowest p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">
                        {q.questionText || "Untitled Question"}
                      </p>
                      <span className="mt-1 inline-block rounded bg-surface-container px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                        {q.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* Choice Chart (Bars) */}
                  {isChoice && q.optionCounts && Object.keys(q.optionCounts).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(q.optionCounts).map(([label, count]) => {
                        const totalCount = Object.values(q.optionCounts || {}).reduce(
                          (a, b) => a + b,
                          0,
                        );
                        const pct =
                          totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-on-surface">
                                {label}
                              </span>
                              <span className="text-xs font-semibold text-on-surface-variant">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                              <div
                                className="h-full rounded-full bg-primary transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : isScale ? (
                    /* Scale / Rating */
                    <div className="flex flex-col items-center justify-center py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-extrabold text-on-surface">
                          {typeof q.averageRating === "number"
                            ? q.averageRating.toFixed(1)
                            : "—"}
                        </span>
                        <span className="text-sm font-semibold text-on-surface-variant">
                          / 5
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-6 w-6 ${
                              typeof q.averageRating === "number" &&
                              i < Math.round(q.averageRating)
                                ? "fill-warning text-warning"
                                : "text-outline/30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  ) : hasTextAnswers ? (
                    /* Text Answers List */
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-2">
                      {(q.textAnswers || []).map((ans, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2 rounded-lg bg-surface-container-lowest p-3 text-sm text-on-surface"
                        >
                          <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/50" />
                          <p>{ans}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-on-surface-variant italic">
                      No data available for this question.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
