import {
  FileText,
  ExternalLink,
  Check,
  X,
  RotateCcw,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

interface MaterialItem {
  materialId: string;
  title: string;
  materialType: string;
  status: string;
}

interface SyllabusMaterialsTabProps {
  materials: MaterialItem[];
  evaluations?: Record<string, any>;
  overallFeedback?: { status: string; note: string };
  onOpenMaterial?: (material: MaterialItem) => void;
  onUpdateStatus?: (
    id: string,
    status: "APPROVED" | "REVISION_REQUESTED" | "PENDING_REVIEW",
  ) => void;
}

export function SyllabusMaterialsTab({
  materials,
  evaluations,
  overallFeedback,
  onOpenMaterial,
  onUpdateStatus,
}: SyllabusMaterialsTabProps) {
  if (!materials || materials.length === 0) {
    return (
      <div className="space-y-6">
        {overallFeedback && <ReviewerFeedbackCard feedback={overallFeedback} />}
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[#dee1d8] rounded-2xl bg-[#f8faf2]/50 animate-in fade-in duration-500">
          <FileText size={28} className="text-[#adb4a8] mb-3" />
          <h3 className="text-base font-bold text-[#2d342b] mb-1">
            No materials found
          </h3>
          <p className="text-xs text-[#5a6157] max-w-sm">
            No teaching materials have been created for this syllabus yet.
          </p>
        </div>
      </div>
    );
  }

  const getStatusStyle = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "APPROVED" || s === "ACCEPTED" || s === "ACTIVE") {
      return {
        label: "Approved",
        color: "#4caf50",
        bg: "#e8f5e9",
        border: "#4caf5033",
      };
    }
    if (s === "REVISION_REQUESTED" || s === "REJECTED") {
      return {
        label: "Revision Requested",
        color: "#ef4444",
        bg: "#fef2f2",
        border: "#ef444433",
      };
    }
    if (s === "PENDING_REVIEW") {
      return {
        label: "Pending Review",
        color: "#5a6157",
        bg: "#f1f5eb",
        border: "#dee1d8",
      };
    }
    return {
      label: status || "Pending",
      color: "#5a6157",
      bg: "#f1f5eb",
      border: "#dee1d8",
    };
  };

  const getEvalBadge = (materialId: string) => {
    if (!evaluations) return null;
    let ev = evaluations[materialId];
    if (evaluations.materials && evaluations.materials[materialId]) {
      ev = evaluations.materials[materialId];
    }

    if (!ev || ev.status === "PENDING") return null;
    return getStatusStyle(ev.status);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-left">
      {overallFeedback && <ReviewerFeedbackCard feedback={overallFeedback} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {materials.map((material) => {
          const badge = getEvalBadge(material.materialId);
          const baseStatusStyle = getStatusStyle(material.status);
          const currentEvalStatus =
            evaluations?.[material.materialId]?.status ||
            evaluations?.materials?.[material.materialId]?.status;

          return (
            <div
              key={material.materialId}
              className="group border border-[#dee1d8] rounded-2xl p-4 bg-white hover:border-primary-500/40 hover:shadow-lg hover:shadow-primary-500/5 transition-all flex flex-col gap-3"
              style={badge ? { borderColor: badge.color + "55" } : {}}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-1.5">
                      <h3
                        className="text-base font-bold text-[#2d342b] truncate group-hover:text-primary-500 transition-colors"
                        style={{ fontFamily: "Plus Jakarta Sans, sans-serif" }}
                      >
                        {material.title}
                      </h3>
                      {badge ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide border shrink-0"
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            borderColor: badge.border,
                          }}
                        >
                          {badge.label}
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border shrink-0 transition-colors"
                          style={{
                            background: baseStatusStyle.bg,
                            color: baseStatusStyle.color,
                            borderColor: baseStatusStyle.border,
                          }}
                        >
                          {baseStatusStyle.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 bg-zinc-50 text-zinc-500 rounded text-[10px] font-bold uppercase tracking-wide border border-zinc-200">
                        {material.materialType || "GENERAL"}
                      </span>
                    </div>
                  </div>

                  {onOpenMaterial && (
                    <button
                      onClick={() => onOpenMaterial(material)}
                      className="shrink-0 h-7 w-7 bg-zinc-50 text-zinc-400 rounded-lg border border-zinc-200 hover:bg-zinc-100 hover:text-zinc-600 transition-all flex items-center justify-center"
                      title="Open Material"
                    >
                      <ExternalLink size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Synthesis Actions (HoPDC Only) */}
              {onUpdateStatus && (
                <div className="flex items-center gap-1 mt-auto pt-3 border-t border-[#dee1d8]/50">
                  <button
                    onClick={() =>
                      onUpdateStatus(material.materialId, "APPROVED")
                    }
                    className={`flex-1 h-8 rounded-lg transition-all flex items-center justify-center ${
                      currentEvalStatus === "APPROVED" ||
                      (material.status === "APPROVED" && !currentEvalStatus)
                        ? "bg-[#4caf50] text-white shadow-lg shadow-emerald-500/20"
                        : "bg-[#f1f5eb] text-[#4caf50] hover:bg-[#c8e6c9]"
                    }`}
                    title="Approve"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() =>
                      onUpdateStatus(material.materialId, "REVISION_REQUESTED")
                    }
                    className={`flex-1 h-8 rounded-lg transition-all flex items-center justify-center ${
                      currentEvalStatus === "REVISION_REQUESTED" ||
                      (material.status === "REVISION_REQUESTED" &&
                        !currentEvalStatus)
                        ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
                        : "bg-rose-50 text-rose-500 hover:bg-rose-100"
                    }`}
                    title="Reject"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={() =>
                      onUpdateStatus(material.materialId, "PENDING_REVIEW")
                    }
                    className={`px-3 h-8 rounded-lg transition-all flex items-center justify-center ${
                      currentEvalStatus === "PENDING_REVIEW" ||
                      (material.status === "PENDING_REVIEW" &&
                        !currentEvalStatus)
                        ? "bg-[#5a6157] text-white"
                        : "bg-zinc-100 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
                    }`}
                    title="Clear Selection"
                  >
                    <RotateCcw size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ReviewerFeedbackCard = ({
  feedback,
}: {
  feedback: { status: string; note: string };
}) => {
  // Kiểm tra xem có note hay không
  const hasNote =
    feedback.note &&
    feedback.note !== "Approved" &&
    feedback.note !== "No comments";

  // Split sequentially by newline first. If no newlines exist, try splitting by the hyphen format historically used in mock material data.
  const rawLines = hasNote ? feedback.note.split('\n') : [];
  
  // Further sanitize the lines to handle mixed formatting
  const lines = rawLines
    .flatMap(line => line.includes('- ') && rawLines.length === 1 ? line.split('- ') : line)
    .map(line => line.trim())
    .filter(line => line !== "" && line !== "-");

  return (
    <div className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-900 shadow-sm transition-all animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg p-1.5 bg-white border border-zinc-200 text-primary-600 shadow-sm">
          <MessageSquare size={18} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Reviewer Feedback
            </span>
          </div>
          {hasNote ? (
            <div className="space-y-1.5">
              {lines.map((line, idx) => (
                <p
                  key={idx}
                  className="text-xs font-semibold leading-relaxed text-[#2d342b] flex items-start gap-2"
                >
                  {/* Dấu chấm tròn thay cho dấu gạch ngang */}
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary-500/40" />
                  <span>{line}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs font-medium leading-relaxed text-zinc-400 italic">
              No specific comments provided for this section.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
