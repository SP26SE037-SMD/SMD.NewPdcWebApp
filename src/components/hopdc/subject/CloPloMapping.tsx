"use client";

import { useState } from "react";
import { GitBranch, Plus, Trash2 } from "lucide-react";
import { SubjectClo } from "@/services/cloplo.service";
import { PLO } from "@/services/curriculum.service";
import { ConfirmModal } from "@/components/common/ConfirmModal";

const BLOOM_LEVEL_LABELS: Record<number, string> = {
  1: "Remember",
  2: "Understand",
  3: "Apply",
  4: "Analyze",
  5: "Evaluate",
  6: "Create",
};

const BLOOM_LEVEL_BY_KEY: Record<string, number> = {
  REMEMBER: 1,
  UNDERSTAND: 2,
  APPLY: 3,
  ANALYZE: 4,
  EVALUATE: 5,
  CREATE: 6,
};

function formatBloomLevel(value?: string | number): string {
  if (value === undefined || value === null || value === "") {
    return "Bloom N/A";
  }

  const normalized = String(value).trim();
  const parsedNumber = Number(normalized);
  if (!Number.isNaN(parsedNumber) && BLOOM_LEVEL_LABELS[parsedNumber]) {
    return `${parsedNumber} - ${BLOOM_LEVEL_LABELS[parsedNumber]}`;
  }

  const mappedNumber = BLOOM_LEVEL_BY_KEY[normalized.toUpperCase()];
  if (mappedNumber) {
    return `${mappedNumber} - ${BLOOM_LEVEL_LABELS[mappedNumber]}`;
  }

  return normalized;
}

interface CloPloMappingProps {
  plos: PLO[];
  clos: SubjectClo[];
  isPloLoading: boolean;
  isCloLoading: boolean;
  createdMappings: Record<string, boolean>;
  localMapping: Record<string, string>;
  localContributionLevel: Record<string, "Low" | "Medium" | "High">;
  submittingKey: string | null;
  mappingNotice: string;
  onLocalMappingChange: (cloId: string, ploId: string) => void;
  onLocalContributionLevelChange: (
    cloId: string,
    level: "Low" | "Medium" | "High",
  ) => void;
  onCreateSingleMapping: (
    cloId: string,
    ploId: string,
    level: "Low" | "Medium" | "High",
  ) => Promise<void>;
  onCreateAllMappings: () => Promise<void>;
  onCreateClo?: () => void;
  onDeleteClo?: (cloId: string) => Promise<void>;
  deletingCloId?: string | null;
  iconBgColor?: string;
  iconTextColor?: string;
}

export function CloPloMapping({
  plos,
  clos,
  isPloLoading,
  isCloLoading,
  createdMappings,
  localMapping,
  localContributionLevel,
  submittingKey,
  mappingNotice,
  onLocalMappingChange,
  onLocalContributionLevelChange,
  onCreateSingleMapping,
  onCreateAllMappings,
  onCreateClo,
  onDeleteClo,
  deletingCloId,
  iconBgColor = "bg-emerald-50",
  iconTextColor = "text-emerald-700",
}: CloPloMappingProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [cloToDelete, setCloToDelete] = useState<string | null>(null);

  const getSelectedPloId = (cloId: string) => {
    return localMapping[cloId] || "";
  };

  const getContributionLevel = (cloId: string) => {
    return localContributionLevel[cloId] || "Low";
  };

  const handleDeleteClick = (cloId: string) => {
    setCloToDelete(cloId);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (cloToDelete && onDeleteClo) {
      await onDeleteClo(cloToDelete);
    }
    setIsConfirmModalOpen(false);
    setCloToDelete(null);
  };

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white shadow-sm p-6 md:p-7 space-y-5">
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        title="Delete CLO"
        message="Are you sure you want to delete this CLO? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDelete}
        onClose={() => setIsConfirmModalOpen(false)}
        isDanger={true}
      />

      <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
        <div
          className={`h-10 w-10 rounded-xl ${iconBgColor} ${iconTextColor} flex items-center justify-center`}
        >
          <GitBranch size={18} />
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-900">CLO-PLO Mapping</h2>
          <p className="text-base text-zinc-500">
            CLO list loaded by subjectId and mapped to curriculum PLOs
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <p className="text-base text-zinc-500">
          HOPDC can decide both PLO and contribution level for each CLO.
        </p>
        <div className="flex items-center gap-2">
          {onCreateClo && (
            <button
              type="button"
              onClick={onCreateClo}
              className="h-10 px-4 rounded-xl border border-zinc-200 bg-white text-zinc-700 text-[11px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-colors flex items-center gap-2"
            >
              <Plus size={14} />
              Create CLO
            </button>
          )}
          <button
            type="button"
            onClick={onCreateAllMappings}
            disabled={
              submittingKey === "all" || clos.length === 0 || plos.length === 0
            }
            className="h-10 px-4 rounded-xl bg-[#0b7a47] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#08683c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submittingKey === "all" ? "Creating..." : "CREATE ALL MAPPINGS"}
          </button>
        </div>
      </div>

      {mappingNotice && (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-base font-medium text-zinc-700">
          {mappingNotice}
        </p>
      )}

      {isPloLoading && (
        <div className="flex items-center gap-2 text-base text-zinc-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0b7a47]" />
          Loading curriculum PLO options...
        </div>
      )}

      {isCloLoading && (
        <div className="flex items-center gap-2 text-base text-zinc-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0b7a47]" />
          Loading subject CLOs...
        </div>
      )}

      {!isCloLoading && clos.length === 0 && (
        <p className="text-base text-zinc-500">
          No CLOs found for this subject.
        </p>
      )}

      {!isCloLoading && clos.length > 0 && (
        <div className="space-y-3">
          {clos.map((clo) => {
            const selectedPloId = getSelectedPloId(clo.cloId);
            const selectedContributionLevel = getContributionLevel(clo.cloId);
            const isCreated = !!createdMappings[clo.cloId];

            return (
              <div
                key={clo.cloId}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-3"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-base font-black text-zinc-900">
                      {clo.cloCode || "CLO"}
                    </p>
                    <p className="mt-1 text-base text-zinc-600 whitespace-pre-wrap">
                      {clo.description || "No description"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] font-black uppercase tracking-widest text-zinc-600">
                      Bloom Level: {formatBloomLevel(clo.bloomLevel)}
                    </span>
                    {onDeleteClo && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(clo.cloId)}
                        disabled={deletingCloId === clo.cloId}
                        className="h-7 w-7 rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        aria-label="Delete CLO"
                        title="Delete CLO"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-2 items-center">
                  <p className="text-[11px] font-black uppercase tracking-widest text-zinc-500">
                    Map To PLO
                  </p>
                  <select
                    value={selectedPloId}
                    onChange={(event) => {
                      const ploId = event.target.value;
                      onLocalMappingChange(clo.cloId, ploId);
                    }}
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 outline-none focus:border-emerald-300"
                    disabled={plos.length === 0}
                  >
                    <option value="">Select PLO...</option>
                    {plos.map((plo) => (
                      <option key={plo.ploId} value={plo.ploId}>
                        {plo.ploCode || "PLO"} - {plo.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {isCreated && (
                    <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                      Created
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      onCreateSingleMapping(
                        clo.cloId,
                        selectedPloId,
                        selectedContributionLevel,
                      )
                    }
                    disabled={
                      isCreated ||
                      !selectedPloId ||
                      submittingKey === clo.cloId ||
                      submittingKey === "all"
                    }
                    className="h-9 px-3 rounded-lg bg-zinc-900 text-white text-[11px] font-black uppercase tracking-widest hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreated
                      ? "Mapped"
                      : submittingKey === clo.cloId
                        ? "Creating..."
                        : "Create Mapping"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
