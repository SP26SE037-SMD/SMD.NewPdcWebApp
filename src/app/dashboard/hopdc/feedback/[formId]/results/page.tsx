"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { FeedbackSubmissions } from "../../_components/FeedbackSubmissions";
import { FeedbackReport } from "../../_components/FeedbackReport";

export default function FormResultsPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const router = useRouter();
  const { formId } = use(params);
  const [activeResultTab, setActiveResultTab] = useState<"submissions" | "report">("submissions");

  return (
    <div className="space-y-8 p-4">
      <div className="mx-auto pt-12 pb-12 px-6 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center mb-5"
        >
          <button
            onClick={() => router.push("/dashboard/hopdc/feedback")}
            className="inline-flex items-center gap-2 rounded-2xl border border-outline/30 bg-surface px-4 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container shadow-sm shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Forms
          </button>

          <div className="sm:ml-4">
            <h1 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent pb-1">
              Feedback Results
            </h1>
            <p className="text-on-surface-variant text-base max-w-xl">
              View submissions and analytical reports for your feedback form.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-outline/20 bg-surface/40 shadow-xl shadow-black/5 backdrop-blur-2xl p-5 md:p-8 flex flex-col"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-outline/10 pb-4 mb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-primary">
                Form Results
              </span>
            </div>
          </div>

          <div className="flex gap-3 border-b border-outline/10 pb-3 mb-6">
            <button
              onClick={() => setActiveResultTab("submissions")}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                ${
                  activeResultTab === "submissions"
                    ? "text-white"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline/10"
                }`}
            >
              {activeResultTab === "submissions" && (
                <motion.div
                  layoutId="activeResultTab"
                  className="absolute inset-0 bg-primary rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Submissions</span>
            </button>
            <button
              onClick={() => setActiveResultTab("report")}
              className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300
                ${
                  activeResultTab === "report"
                    ? "text-white"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-outline/10"
                }`}
            >
              {activeResultTab === "report" && (
                <motion.div
                  layoutId="activeResultTab"
                  className="absolute inset-0 bg-primary rounded-xl"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="relative z-10">Report Dashboard</span>
            </button>
          </div>

          <div className="mt-4">
            {activeResultTab === "submissions" ? (
              <FeedbackSubmissions formId={formId} />
            ) : (
              <FeedbackReport formId={formId} />
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
