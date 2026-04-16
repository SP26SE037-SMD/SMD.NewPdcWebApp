"use client";

import React from "react";
import {
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Check,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ReviewTaskItem,
  REVIEW_TASK_STATUS,
} from "@/services/review-task.service";
import { useRouter } from "next/navigation";

interface ReviewTaskItemRowProps {
  review: ReviewTaskItem;
  onRecreateTask?: () => void;
}

const getReviewStatusConfig = (status?: string) => {
  const s = status?.toUpperCase() || "UNKNOWN";
  switch (s) {
    case REVIEW_TASK_STATUS.APPROVED:
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-100",
        icon: CheckCircle2,
      };
    case REVIEW_TASK_STATUS.REVISION_REQUESTED:
      return {
        bg: "bg-rose-50",
        text: "text-rose-600",
        border: "border-rose-100",
        icon: AlertCircle,
      };
    case REVIEW_TASK_STATUS.IN_PROGRESS:
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-100",
        icon: Clock,
      };
    case REVIEW_TASK_STATUS.PENDING:
    default:
      return {
        bg: "bg-zinc-50",
        text: "text-zinc-600",
        border: "border-zinc-200",
        icon: Clock,
      };
  }
};

export function ReviewTaskItemRow({ review, onRecreateTask }: ReviewTaskItemRowProps) {
  const router = useRouter();
  const config = getReviewStatusConfig(review.status);
  const StatusIcon = config.icon;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border border-zinc-100 hover:border-zinc-300 transition-all rounded-2xl group/review">
      <div className="flex items-center gap-4 min-w-[300px]">
        {/* Reviewer Info */}
        <div className="h-10 w-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover/review:border-zinc-400 transition-colors">
          {review.reviewer?.avatarUrl ? (
            <img
              src={review.reviewer.avatarUrl}
              alt={review.reviewer.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={18} className="text-zinc-400" />
          )}
        </div>

        <div className="space-y-0.5">
          <p className="text-sm font-black text-zinc-900 leading-tight">
            Reviewer: {review.reviewer?.fullName || "Unknown"}
          </p>
          <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            <span className="flex items-center gap-1">
              <Calendar size={10} /> DUE: {formatDate(review.dueDate)}
            </span>
            {review.reviewDate && (
              <span className="flex items-center gap-1 text-emerald-500">
                <CheckCircle2 size={10} /> DONE: {formatDate(review.reviewDate)}
              </span>
            )}
            {typeof review.isAccepted === "boolean" && (
              <span className={`flex items-center gap-1 text-emerald-600 px-1.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50`}>
                <ShieldCheck size={10} /> SYNTHESIZED
              </span>
            )}
            {(review.isAccepted === null || review.isAccepted === undefined) && 
             (review.status === REVIEW_TASK_STATUS.APPROVED || review.status === REVIEW_TASK_STATUS.REVISION_REQUESTED) && (
              <span className={`flex items-center gap-1 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 animate-pulse`}>
                <Clock size={10} /> AWAITING SYNTHESIS
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Dynamic Status Stepper */}
        <ReviewStatusStepper status={review.status} />

        {review.status !== REVIEW_TASK_STATUS.PENDING && (
          <button
            onClick={() =>
              router.push(`/dashboard/hopdc/reviews/${review.reviewId}`)
            }
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 hover:border-[#0b7a47] hover:bg-emerald-50 hover:text-[#0b7a47] transition-all duration-200 shadow-sm"
            title="View Synthesis & Reconciliation"
          >
            <Eye size={14} />
          </button>
        )}
        
        {typeof review.isAccepted === "boolean" && review.status === REVIEW_TASK_STATUS.REVISION_REQUESTED && onRecreateTask && (
          <button
            onClick={onRecreateTask}
            className="h-8 flex items-center gap-1.5 px-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-black uppercase text-[10px] tracking-wider transition-all"
            title="Create new iteration for Reviewer"
          >
            <RefreshCcw size={12} />
            Re-assign Review
          </button>
        )}
      </div>
    </div>
  );
}

const ReviewStatusStepper = ({ status }: { status: string }) => {
  const s = status.toUpperCase();
  const steps = [
    REVIEW_TASK_STATUS.PENDING,
    REVIEW_TASK_STATUS.IN_PROGRESS,
    "DONE", // This represents either APPROVED or REVISION_REQUESTED
  ];

  const isRevision = s === REVIEW_TASK_STATUS.REVISION_REQUESTED;
  const isApproved = s === REVIEW_TASK_STATUS.APPROVED;
  const isInProgress = s === REVIEW_TASK_STATUS.IN_PROGRESS;
  const isPending = s === REVIEW_TASK_STATUS.PENDING;

  // Determine active index for the points
  let activeIdx = 0;
  if (isInProgress) activeIdx = 1;
  if (isApproved || isRevision) activeIdx = 2;

  return (
    <div className="flex flex-col gap-1.5 min-w-[180px]">
      <div className="flex items-center relative gap-0">
        {steps.map((step, idx) => {
          const isCompletedNode = idx < activeIdx;
          const isActiveNode = idx === activeIdx;
          const isLastNode = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              {/* Point */}
              <div className="relative z-10 flex flex-col items-center">
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActiveNode ? 1.2 : 1,
                    backgroundColor:
                      isActiveNode || isCompletedNode
                        ? isRevision && idx === 2
                          ? "#f43f5e" // Red for Revision
                          : "#4caf50" // Green for others
                        : "#e4e4e7", // Grey for inactive
                  }}
                  className="w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-colors duration-300"
                >
                  {isCompletedNode || (isActiveNode && isApproved && idx === 2) ? (
                    <Check size={8} className="text-white stroke-[4]" />
                  ) : isActiveNode && isRevision && idx === 2 ? (
                    <AlertCircle size={10} className="text-white" />
                  ) : (
                    isActiveNode && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                    )
                  )}
                </motion.div>
              </div>

              {/* Line */}
              {!isLastNode && (
                <div className="flex-1 h-[2px] bg-zinc-100 mx-0.5 relative overflow-hidden -translate-y-0.25">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isCompletedNode ? "100%" : "0%" }}
                    className={`absolute inset-0 bg-[#4caf50]/40`}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex justify-between items-center px-0.5 mt-1">
        <span
          className={`text-[10px] font-bold ${activeIdx >= 0 ? (isPending ? "text-[#4caf50]" : "text-zinc-400") : "text-zinc-400"}`}
        >
          Pending
        </span>
        <span
          className={`text-[10px] font-bold ${activeIdx >= 1 ? (isInProgress ? "text-[#4caf50]" : "text-zinc-400") : "text-zinc-400"}`}
        >
          In Progress
        </span>
        <span
          className={`text-[10px] font-bold ${activeIdx >= 2 ? (isRevision ? "text-rose-500" : "text-[#4caf50]") : "text-zinc-400"}`}
        >
          {isRevision ? "Revision Req" : isApproved ? "Approved" : "Done"}
        </span>
      </div>
    </div>
  );
};
