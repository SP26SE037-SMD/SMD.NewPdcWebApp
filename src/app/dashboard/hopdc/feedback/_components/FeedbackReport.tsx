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
        <div className="rounded-2xl border border-outline/20 bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Total Responses
          </p>
          <p className="mt-2 text-4xl font-black text-primary">
            {report.totalSubmissions ?? "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-outline/20 bg-surface p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Total Questions
          </p>
          <p className="mt-2 text-4xl font-black text-secondary">
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

            // Generate optionCounts dynamically for non-scale answers to render them as a bar chart
            let chartData: Record<string, number> | null = null;
            if (isChoice && q.optionCounts && Object.keys(q.optionCounts).length > 0) {
              chartData = q.optionCounts;
            } else if (!isScale && hasTextAnswers) {
              const counts: Record<string, number> = {};
              (q.textAnswers || []).forEach((ans) => {
                if (ans && ans.trim()) {
                  const key = ans.trim();
                  counts[key] = (counts[key] || 0) + 1;
                }
              });
              chartData = counts;
            }

            return (
              <div
                key={q.questionId || idx}
                className="overflow-hidden rounded-2xl border border-outline/20 bg-surface shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="border-b border-outline/10 bg-surface-container-lowest p-4">
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-[15px] sm:text-base font-extrabold text-on-surface leading-snug">
                        {q.questionText || "Untitled Question"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {chartData ? (
                    /* Bar Chart Rendering */
                    <div className="space-y-4">
                      {Object.entries(chartData).map(([label, count]) => {
                        const totalCount = Object.values(chartData || {}).reduce(
                          (a, b) => a + b,
                          0,
                        );
                        const pct =
                          totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

                        return (
                          <div key={label} className="space-y-1.5 group">
                            <div className="flex items-center justify-between text-sm sm:text-[15px]">
                              <span className="font-semibold text-on-surface group-hover:text-primary transition-colors">
                                {label}
                              </span>
                              <span className="text-xs sm:text-sm font-extrabold text-on-surface-variant">
                                {count} <span className="text-primary/70">({pct}%)</span>
                              </span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-container-highest">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 group-hover:brightness-105"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Expandable original raw list for text-based questions */}
                      {!isChoice && hasTextAnswers && (
                        <details className="mt-5 group border-t border-outline/10 pt-4">
                          <summary className="cursor-pointer text-xs font-bold text-primary hover:underline select-none list-none flex items-center gap-1">
                            <span className="transition-transform group-open:rotate-90">▶</span>
                            <span>View All Raw Responses ({(q.textAnswers || []).length})</span>
                          </summary>
                          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
                            {(q.textAnswers || []).map((ans, i) => (
                              <div
                                key={i}
                                className="flex items-start gap-2.5 rounded-xl bg-surface-container-lowest p-3 text-[13px] font-medium text-on-surface border border-outline/5 hover:border-outline/15 transition-all"
                              >
                                <AlignLeft className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant/40" />
                                <p className="leading-relaxed">{ans}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  ) : isScale ? (
                    /* Scale / Rating rendering with precise decimal clipping */
                    <div className="flex flex-col items-center justify-center py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-5xl font-black text-on-surface">
                          {typeof q.averageRating === "number"
                            ? q.averageRating.toFixed(1)
                            : "—"}
                        </span>
                        <span className="text-base font-bold text-on-surface-variant/70">
                          / 5
                        </span>
                      </div>
                      <div className="mt-3 flex gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => {
                          const rating = typeof q.averageRating === "number" ? q.averageRating : 0;
                          let fillPercentage = 0;
                          if (rating >= i + 1) {
                            fillPercentage = 100;
                          } else if (rating > i) {
                            fillPercentage = (rating - i) * 100;
                          }

                          return (
                            <div key={i} className="relative h-7 w-7">
                              {/* Background Empty Star */}
                              <Star
                                strokeWidth={1.5}
                                className="absolute top-0 left-0 h-7 w-7 text-outline/30 fill-transparent"
                              />
                              {/* Foreground Filled Star (Clipped) */}
                              {fillPercentage > 0 && (
                                <div
                                  className="absolute top-0 left-0 h-7 overflow-hidden transition-all duration-300"
                                  style={{ width: `${fillPercentage}%` }}
                                >
                                  <Star
                                    strokeWidth={1.5}
                                    className="h-7 w-7 fill-amber-400 text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.2)] max-w-none"
                                    style={{ width: "28px", minWidth: "28px" }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
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
