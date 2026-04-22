import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Edit3,
} from "lucide-react";
import { CurriculumService, PLO } from "@/services/curriculum.service";
import StepNavigation from "./StepNavigation";

interface StepProps {
  onNext?: () => void;
  onBack?: () => void;
  curriculumIdProp?: string;
}

interface Outcome {
  id: string; // Mapping to ploId
  identifier: string; // Mapping to ploCode
  description: string;
  tags: string[];
}

export default function PloDefinitionStep({ onNext, onBack, curriculumIdProp }: StepProps) {
  const searchParams = useSearchParams();
  const curriculumId = curriculumIdProp || searchParams.get("id");
  const queryClient = useQueryClient();

  const DRAFT_KEY = `pdcm-plo-draft-${curriculumId}`;

  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [identifier, setIdentifier] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<Outcome | null>(null);
  const [shouldProceedAfterSave, setShouldProceedAfterSave] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

  // 1. Fetch Server Data
  const { data: serverPLOs, isLoading: isLoadingPLOs } = useQuery({
    queryKey: ["curriculum-plos", curriculumId],
    queryFn: async () => {
      const response = await CurriculumService.getPloByCurriculumId(
        curriculumId!,
      );
      const plos = response.data?.content || [];
      return plos.map((p: PLO) => ({
        id: p.ploId,
        identifier: p.ploCode || "",
        description: p.description,
        tags: ["GENERAL"],
      }));
    },
    enabled: !!curriculumId,
    staleTime: 0,
  });

  // 2. Merge logic
  useEffect(() => {
    if (serverPLOs) {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      let newLocalItems: Outcome[] = [];
      if (savedDraft) {
        try {
          const localDraft: Outcome[] = JSON.parse(savedDraft);
          newLocalItems = localDraft.filter((item) =>
            item.id.startsWith("temp-"),
          );
        } catch (e) {}
      }
      setOutcomes([...serverPLOs, ...newLocalItems]);
      setHasLoadedDraft(true);
    }
  }, [serverPLOs, DRAFT_KEY]);

  // 3. LocalStorage sync
  useEffect(() => {
    if (hasLoadedDraft) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(outcomes));
    }
  }, [outcomes, hasLoadedDraft, DRAFT_KEY]);

  const pendingOutcomes = useMemo(() => {
    return outcomes.filter((o) => o.id.startsWith("temp-"));
  }, [outcomes]);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload: any[]) =>
      CurriculumService.bulkCreatePLOs(curriculumId!, payload),
    onSuccess: () => {
      toast.success("PLOs saved successfully!");
      localStorage.removeItem(DRAFT_KEY);
      queryClient.invalidateQueries({
        queryKey: ["curriculum-plos", curriculumId],
      });
      if (shouldProceedAfterSave) onNext?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Sync failed");
      setShouldProceedAfterSave(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: {
      ploId: string;
      ploCode: string;
      description: string;
    }) =>
      CurriculumService.updatePLO(data.ploId, {
        ploCode: data.ploCode,
        description: data.description,
        curriculumId: curriculumId!,
      }),
    onSuccess: () => {
      toast.success("Updated on server");
      queryClient.invalidateQueries({
        queryKey: ["curriculum-plos", curriculumId],
      });
      setEditingId(null);
      setIdentifier("");
      setDescription("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ploId: string) => CurriculumService.deletePLO(ploId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["curriculum-plos", curriculumId],
      });
      setShowDeleteModal(false);
    },
  });

  const handleSaveDraft = (proceed: boolean = false) => {
    if (!curriculumId) return;
    if (pendingOutcomes.length === 0) {
      if (proceed) onNext?.();
      return;
    }
    setShouldProceedAfterSave(proceed);
    const payload = pendingOutcomes.map((o) => ({
      ploCode: o.identifier,
      description: o.description,
    }));
    saveMutation.mutate(payload);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !description) return;
    if (editingId) {
      if (!editingId.startsWith("temp-")) {
        updateMutation.mutate({
          ploId: editingId,
          ploCode: identifier.toUpperCase(),
          description,
        });
        return;
      }
      setOutcomes(
        outcomes.map((o) =>
          o.id === editingId
            ? { ...o, identifier: identifier.toUpperCase(), description }
            : o,
        ),
      );
      setEditingId(null);
    } else {
      setOutcomes([
        ...outcomes,
        {
          id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          identifier: identifier.toUpperCase(),
          description,
          tags: ["GENERAL"],
        },
      ]);
    }
    setIdentifier("");
    setDescription("");
  };

  const handleNextClick = () => {
    // CRITICAL FIX: If there are unsaved items, SHOW MODAL instead of blocking
    if (pendingOutcomes.length > 0) {
      setShowConfirmModal(true);
    } else {
      onNext?.();
    }
  };

  const startEdit = (outcome: Outcome) => {
    setEditingId(outcome.id);
    setIdentifier(outcome.identifier);
    setDescription(outcome.description);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIdentifier("");
    setDescription("");
  };

  const removeOutcome = (outcome: Outcome) => {
    if (outcome.id.startsWith("temp-")) {
      setOutcomes(outcomes.filter((o) => o.id !== outcome.id));
    } else {
      setItemToDelete(outcome);
      setShowDeleteModal(true);
    }
  };

  return (
    <div className="min-h-screen px-4 md:px-12 pb-12 pt-10 relative">
      <header className="mb-10 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 mb-3">
            Program Learning Outcomes
          </h1>
          <p className="text-zinc-500 max-w-2xl leading-relaxed font-medium">
            Define the high-level competencies students will achieve upon
            graduation.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-1 mr-2">
            <span
              className={`text-[9px] font-black uppercase tracking-widest ${pendingOutcomes.length > 0 ? "text-amber-500 animate-pulse" : "text-emerald-500"}`}
            >
              {pendingOutcomes.length > 0
                ? `● ${pendingOutcomes.length} Pending Sync`
                : "● PLOs Synced"}
            </span>
          </div>
          <button
            onClick={() => handleSaveDraft(false)}
            disabled={saveMutation.isPending || pendingOutcomes.length === 0}
            className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all ${
              saveMutation.isPending || pendingOutcomes.length === 0 
                ? "bg-zinc-100 text-zinc-400 cursor-not-allowed" 
                : "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95"
            }`}
          >
            {saveMutation.isPending ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Save All PLOs
          </button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 max-w-5xl mx-auto items-start">
        <section className="col-span-12 lg:col-span-5 sticky top-40">
          <div className="bg-white p-8 rounded-xl shadow-[0px_4px_20px_rgba(45,51,53,0.04)] border border-zinc-100">
            <h3 className="text-xl font-bold text-zinc-900 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[var(--primary)]">
                  {editingId ? "edit_note" : "add_circle"}
                </span>
                {editingId ? "Edit Outcome" : "New Outcome"}
              </div>
              {editingId && (
                <button
                  onClick={cancelEdit}
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Cancel
                </button>
              )}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Outcome Identifier
                </label>
                <input
                  className="w-full bg-zinc-50 border-none focus:ring-2 focus:ring-[var(--primary)] rounded-lg py-3 px-4 font-bold text-zinc-900"
                  placeholder="e.g., PLO-01"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">
                  Detailed Description
                </label>
                <textarea
                  className="w-full bg-zinc-50 border-none focus:ring-2 focus:ring-[var(--primary)] rounded-lg py-3 px-4 font-medium text-zinc-900 resize-none"
                  placeholder="Describe the competencies..."
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>
              <button
                className={`w-full py-4 text-white font-bold rounded-xl shadow-[0px_4px_20px_rgba(45,51,53,0.04)] hover:translate-y-[-2px] transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${editingId ? (editingId.startsWith("temp-") ? "bg-amber-500" : "bg-primary") : "bg-primary"}`}
                type="submit"
                disabled={
                  !identifier || !description || updateMutation.isPending
                }
              >
                {updateMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : editingId ? (
                  <Edit3 size={18} />
                ) : null}
                {editingId ? "Update Outcome" : "Add to Curriculum"}
              </button>
            </form>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-7 pb-40">
          <div className="flex items-end justify-between mb-6 px-4">
            <div>
              <span className="text-xs font-bold text-primary tracking-widest uppercase">
                {outcomes.length} Outcomes Found
              </span>
              <h3 className="text-2xl font-bold text-zinc-900">
                Outcome Inventory
              </h3>
            </div>
          </div>

          <div className="space-y-4">
            {(isLoadingPLOs && outcomes.length === 0) ||
            (updateMutation.isPending && outcomes.length > 0) ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                  Synchronizing Data...
                </p>
              </div>
            ) : outcomes.length === 0 ? (
              <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-16 flex flex-col items-center justify-center text-center bg-zinc-50/50">
                <h5 className="font-bold text-zinc-400">No PLOs defined yet</h5>
              </div>
            ) : (
              outcomes.map((outcome) => (
                <div
                  key={outcome.id}
                  className={`group transition-all p-6 rounded-xl flex items-start gap-6 relative border hover:shadow-[0px_4px_20px_rgba(45,51,53,0.04)] ${editingId === outcome.id ? "bg-amber-50/50 border-amber-200" : "bg-zinc-50 hover:bg-white border-transparent hover:border-zinc-200"} ${outcome.id.startsWith("temp-") ? "border-l-4 border-l-amber-400" : ""}`}
                >
                  <div className="w-16 h-16 shrink-0 bg-white rounded-lg flex flex-col items-center justify-center border border-zinc-200 group-hover:scale-110 transition-transform shadow-sm">
                    <span
                      className={`text-sm font-extrabold text-center px-1 truncate w-full ${editingId === outcome.id ? "text-amber-600" : "text-primary"}`}
                    >
                      {outcome.identifier}
                    </span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-lg font-bold text-zinc-900 truncate">
                        {outcome.identifier} Outcome
                      </h4>
                      {outcome.id.startsWith("temp-") && (
                        <span className="text-[8px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-widest">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed mb-2 font-medium break-words">
                      {outcome.description}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(outcome)}
                      className="p-2 text-zinc-400 hover:text-amber-600 transition-colors"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      onClick={() => removeOutcome(outcome)}
                      className="p-2 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <StepNavigation
        onNext={handleNextClick}
        onBack={onBack}
        isNextDisabled={false}
      />

      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-100">
            <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-8">
              <CheckCircle2 className="text-primary-600" size={32} />
            </div>
            <h3 className="text-3xl font-extrabold text-zinc-900 mb-3 tracking-tight">
              Save New PLOs?
            </h3>
            <p className="text-zinc-500 leading-relaxed mb-10 font-medium">
              You have added {pendingOutcomes.length} new outcomes. Do you want
              to save them before moving to the next step?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-4 px-6 border border-zinc-100 text-zinc-500 font-bold rounded-2xl hover:bg-zinc-50 transition-all"
              >
                Review
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  handleSaveDraft(true);
                }}
                disabled={saveMutation.isPending}
                className="flex-1 py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                Save & Next
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-zinc-100">
            <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mb-8">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-3xl font-extrabold text-zinc-900 mb-3 tracking-tight">
              Delete Outcome?
            </h3>
            <p className="text-zinc-500 leading-relaxed mb-10 font-medium">
              Are you sure you want to permanently delete this outcome from the
              server?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-4 px-6 border border-zinc-100 text-zinc-500 font-bold rounded-2xl hover:bg-zinc-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (itemToDelete) deleteMutation.mutate(itemToDelete.id);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-4 px-6 bg-red-500 text-white font-bold rounded-2xl shadow-xl shadow-red-500/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Trash2 size={18} />
                )}
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
