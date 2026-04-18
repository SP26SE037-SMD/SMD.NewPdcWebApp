"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useState, Fragment, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MajorService,
  Major,
  CreateMajorPayload,
} from "@/services/major.service";
import { PoService, CreatePOPload, PO } from "@/services/po.service";
import { CurriculumService } from "@/services/curriculum.service";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { ToastProvider } from "@/components/ui/Toast";
import {
  X,
  Plus,
  Search,
  MoreHorizontal,
  User,
  ChevronDown,
  SearchIcon,
  Loader2,
  History,
  LayoutGrid,
  Users,
  Settings,
  Eye,
  Target,
  Trash2,
  Check,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Save,
  Trash,
  Edit2,
  Undo2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function ManageMajorsContent() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Instituional");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const router = useRouter();

  // Wizard Navigation
  const [wizardStep, setWizardStep] = useState(1);
  const [currentMajorId, setCurrentMajorId] = useState<string | null>(null);

  // Step 1: Major Identity State
  const [newMajor, setNewMajor] = useState<CreateMajorPayload>({
    majorCode: "",
    majorName: "",
    description: "",
  });
  const [createError, setCreateError] = useState("");

  const [taskForm, setTaskForm] = useState({
    deadline: "",
    type: "REVIEW",
    priority: "HIGH",
  });



  // Step 2: Program Outcomes State
  const [stagedPOs, setStagedPOs] = useState<CreatePOPload[]>([]);
  const [currentPO, setCurrentPO] = useState<CreatePOPload>({
    poCode: "",
    description: "",
  });
  const [editingPOIndex, setEditingPOIndex] = useState<number | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch Majors
  const { data: majorResponse, isLoading: isMajorsLoading } = useQuery({
    queryKey: ["majors", search, selectedStatus],
    queryFn: () => MajorService.getMajors({ search, status: selectedStatus }),
  });

  // Fetch all Curriculums to count them per major
  const { data: curriculumResponse, isLoading: isCurriculumsLoading } =
    useQuery({
      queryKey: ["all-curriculums-counts"],
      queryFn: () => CurriculumService.getCurriculums({ size: 1000 }), // Large size to get all for counting
    });

  const majors = majorResponse?.data?.content || [];
  const curriculumsList = curriculumResponse?.data?.content || [];

  // Calculate counts per major code
  const curriculumCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    curriculumsList.forEach((curr) => {
      const code = curr.major?.majorCode || curr.majorCode;
      if (code) {
        counts[code] = (counts[code] || 0) + 1;
      }
    });
    return counts;
  }, [curriculumsList]);

  const isLoading = isMajorsLoading;

  // Create Major Mutation
  const createMutation = useMutation({
    mutationFn: MajorService.createMajor,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      setCurrentMajorId(response.data.majorId);
      setWizardStep(2);
      showToast("Major identity established.", "success");
    },
    onError: (error: any) => {
      setCreateError(error.message || "Failed to create major");
      showToast(error.message || "Failed to create major.", "error");
    },
  });

  // Update Major Mutation
  const updateMajorMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: CreateMajorPayload;
    }) => MajorService.updateMajor(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      setWizardStep(2);
      showToast("Major identity updated.", "success");
    },
    onError: (error: any) => {
      setCreateError(error.message || "Failed to update major");
      showToast(error.message || "Failed to update major.", "error");
    },
  });

  // Bulk PO Mutation
  const bulkPOMutation = useMutation({
    mutationFn: (pos: CreatePOPload[]) =>
      PoService.createMultiplePOs(currentMajorId || "", pos),
    onSuccess: () => {
      setWizardStep(3); // Move to Review step
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      showToast("Outcomes staged for final review.", "info");
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to save outcomes.", "error");
    },
  });

  // Fetch Existing Major for "Back" navigation or update
  const { data: existingMajorData } = useQuery({
    queryKey: ["wizard-major", currentMajorId],
    queryFn: () => MajorService.getMajorById(currentMajorId || ""),
    enabled: !!currentMajorId && isCreateModalOpen && wizardStep === 1,
  });

  // Auto-fill form when returning to Step 1
  useEffect(() => {
    if (existingMajorData?.data && wizardStep === 1) {
      setNewMajor({
        majorCode: existingMajorData.data.majorCode,
        majorName: existingMajorData.data.majorName,
        description: existingMajorData.data.description,
      });
    } else if (wizardStep === 1 && typeof window !== "undefined" && !currentMajorId) {
      const savedMajor = localStorage.getItem("pendingMajor");
      if (savedMajor) {
        try {
          setNewMajor(JSON.parse(savedMajor));
        } catch(e) {}
      }
      const savedPOs = localStorage.getItem("pendingPOs");
      if (savedPOs) {
        try {
          setStagedPOs(JSON.parse(savedPOs));
        } catch(e) {}
      }
    }
  }, [existingMajorData, wizardStep, currentMajorId]);

  // Handle Step 1 Submit
  const handleMajorIdentitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingMajor", JSON.stringify(newMajor));
    }
    setWizardStep(2);
  };

  // PO Management Logic
  const handleAddPO = () => {
    if (currentPO.poCode && currentPO.description) {
      if (editingPOIndex !== null) {
        const updated = [...stagedPOs];
        updated[editingPOIndex] = { ...currentPO };
        setStagedPOs(updated);
        setEditingPOIndex(null);
        showToast("Outcome updated in queue", "info");
      } else {
        setStagedPOs((prev) => [...prev, { ...currentPO }]);
        showToast("Outcome staged for review", "info");
      }
      setCurrentPO({ poCode: "", description: "" });
    }
  };

  const handleEditPO = (index: number) => {
    setCurrentPO(stagedPOs[index]);
    setEditingPOIndex(index);
  };

  const handleDeletePO = (index: number) => {
    setStagedPOs((prev) => prev.filter((_, i) => i !== index));
    showToast("Outcome removed from queue", "warning");
  };

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      MajorService.updateMajorStatus(id, status),
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      setIsConfirmModalOpen(false);
      setWizardStep(4); // Move to Success screen
      showToast(
        `Major submitted for ${response.data.status.replace("_", " ")}.`,
        "success",
      );
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to update major status.", "error");
    },
  });

  
  const submitAllDataMutation = useMutation({
    mutationFn: async () => {
      // 1. Create Major
      let finalMajorId = currentMajorId;
      if (!finalMajorId) {
        const majorRes = await MajorService.createMajor(newMajor);
        finalMajorId = majorRes.data.majorId;
      }
      
      // 2. Create POs
      if (stagedPOs.length > 0 && finalMajorId) {
        await PoService.createMultiplePOs(finalMajorId, stagedPOs);
      }
      
      // 3. Update status
      if (finalMajorId) {
        await MajorService.updateMajorStatus(finalMajorId, "INTERNAL_REVIEW");
      }
      
      // 4. Create Task
      if (finalMajorId) {
        let actualDeadline = taskForm.deadline;
        if (!actualDeadline) {
          actualDeadline = new Date().toISOString().split("T")[0]; // fallback to today
        }
        await fetch("/api/tasks/byVP", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                accountId: "a7e97b05-4fce-4f65-9b01-bd8cafaf3a9a",
                majorId: finalMajorId,
                taskName: `Review Major: ${newMajor.majorName}`,
                description: `Please review the new major ${newMajor.majorCode} - ${newMajor.majorName}.`,
                priority: taskForm.priority,
                deadline: actualDeadline,
                type: taskForm.type
            })
        });
      }
      
      return finalMajorId;
    },
    onSuccess: (newMajorId) => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      setCurrentMajorId(newMajorId || null);
      setWizardStep(4);
      showToast("Major created and submitted for Board Review successfully.", "success");
      setIsConfirmModalOpen(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("pendingMajor");
        localStorage.removeItem("pendingPOs");
      }
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to submit major", "error");
      setIsConfirmModalOpen(false);
    }
  });

  // Delete Major Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => MajorService.deleteMajor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["majors"] });
      showToast("Major deleted permanently.", "success");
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to delete major.", "error");
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete the major "${name}"? This action cannot be undone.`,
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleFinalSubmit = () => {
    if (stagedPOs.length === 0) {
      showToast("Please add at least one program outcome.", "error");
      return;
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingPOs", JSON.stringify(stagedPOs));
    }
    setWizardStep(3);
  };

  const handleOpenDetail = (code: string) => {
    router.push(
      `/dashboard/vice-principal/manage-majors/${encodeURIComponent(code)}`,
    );
  };

  const handleInitialCreateAction = () => {
    setWizardStep(1);
    setCurrentMajorId(null);
    setNewMajor({ majorCode: "", majorName: "", description: "" });
    setStagedPOs([]);
    setIsCreateModalOpen(true);
  };

  // Filter mapping
  const statusTabs = [
    { label: "All Programs", value: "" },
    { label: "Active", value: "PUBLISHED" },
    { label: "In Review", value: "INTERNAL_REVIEW" },
    { label: "Draft", value: "DRAFT" },
  ];

  const filteredMajors = useMemo(() => {
    return majors.filter((m) => {
      const matchesSearch = search
        ? m.majorCode.toLowerCase().includes(search.toLowerCase()) ||
          m.majorName.toLowerCase().includes(search.toLowerCase())
        : true;
      const matchesStatus = selectedStatus ? m.status === selectedStatus : true;
      return matchesSearch && matchesStatus;
    });
  }, [majors, search, selectedStatus]);

  const kpis = {
    totalActive: majors.filter((m) => m.status === "PUBLISHED").length,
    underReview: majors.filter((m) => m.status === "INTERNAL_REVIEW").length,
    complianceRate: "94.2%",
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#2d3335]">
      {isCreateModalOpen ? (
        <div className="max-w-6xl mx-auto pt-12 pb-12 px-6">
          {/* Breadcrumbs & Header */}
          <div className="mb-8">
            <nav className="flex items-center gap-2 text-sm text-[#5a6062] mb-4">
              <span
                className="cursor-pointer hover:underline"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Curriculum
              </span>
              <span className="material-symbols-outlined text-xs">
                chevron_right
              </span>
              <span className="text-[#4caf50] font-medium">Create Major</span>
            </nav>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#2d3335] mb-2 font-['Plus_Jakarta_Sans']">
              {wizardStep === 1
                ? "Define Academic Major"
                : wizardStep === 2
                  ? "Program Outcomes"
                  : "Major Established"}
            </h1>
          </div>

          {/* Stepper Component */}
          <div className="mb-10 flex items-center justify-between w-full">
            {[
              { id: 1, label: "Major Identity" },
              { id: 2, label: "Program Outcomes" },
              { id: 3, label: "Review & Submit" },
            ].map((step, idx, arr) => (
              <Fragment key={step.id}>
                <div
                  className={`flex items-center gap-3 ${wizardStep < step.id ? "opacity-40" : ""}`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      wizardStep >= step.id
                        ? "bg-[#4caf50] text-white"
                        : "bg-[#f1f4f5] text-[#5a6062] border-2 border-[#adb3b5]"
                    }`}
                  >
                    {wizardStep > step.id ? <Check size={16} /> : step.id}
                  </div>
                  <span
                    className={`text-sm ${wizardStep >= step.id ? "font-bold text-[#2d3335]" : "font-medium text-[#5a6062]"}`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < arr.length - 1 && (
                  <div
                    className={`h-[2px] grow mx-4 ${wizardStep > step.id ? "bg-[#4caf50]" : "bg-[#e5e7eb]"}`}
                  ></div>
                )}
              </Fragment>
            ))}
          </div>

          {wizardStep === 1 && (
            <form
              onSubmit={handleMajorIdentitySubmit}
              className="space-y-8"
            >
              <div className="space-y-8">
                <div className="bg-white rounded-xl p-8 border border-[#adb3b5]/10 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-[#4caf50] p-2 bg-[#e8f5e9] rounded-lg">
                      edit_note
                    </span>
                    <div>
                      <h2 className="text-xl font-bold text-[#2d3335] leading-tight font-['Plus_Jakarta_Sans']">
                        Basic Program Information
                      </h2>
                      <p className="text-sm text-[#5a6062]">
                        Provide the foundational identification details for the
                        new major.
                      </p>
                    </div>
                  </div>

                  {createError && (
                    <div className="mb-6 p-4 bg-[#fff7f6] text-[#a73b21] text-xs font-bold uppercase tracking-widest rounded-xl border border-[#fd795a]/20">
                      Error: {createError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8 mb-8">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5a6062] mb-2">
                        Major Code
                      </label>
                      <input
                        required
                        value={newMajor.majorCode}
                        onChange={(e) =>
                          setNewMajor({
                            ...newMajor,
                            majorCode: e.target.value,
                          })
                        }
                        className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-3 text-[#2d3335] placeholder:text-[#adb3b5] transition-all outline-none"
                        placeholder="e.g. CS-2024"
                        type="text"
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#5a6062] mb-2">
                        Major Name
                      </label>
                      <input
                        required
                        value={newMajor.majorName}
                        onChange={(e) =>
                          setNewMajor({
                            ...newMajor,
                            majorName: e.target.value,
                          })
                        }
                        className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-3 text-[#2d3335] placeholder:text-[#adb3b5] transition-all outline-none"
                        placeholder="e.g. Computer Science"
                        type="text"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#5a6062] mb-2">
                      Program Description
                    </label>
                    <textarea
                      required
                      value={newMajor.description}
                      onChange={(e) =>
                        setNewMajor({
                          ...newMajor,
                          description: e.target.value,
                        })
                      }
                      className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-3 text-[#2d3335] placeholder:text-[#adb3b5] transition-all resize-none outline-none"
                      placeholder="Describe the program's vision, philosophy, and primary educational focus..."
                      rows={8}
                    ></textarea>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-6 py-3 text-[#5a6062] font-semibold hover:text-[#2d3335] transition-colors flex items-center gap-2"
                  >
                    <ArrowLeft size={18} /> Back to Dashboard
                  </button>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-6 py-3 border border-[#adb3b5] rounded-xl font-semibold text-[#5a6062] hover:bg-[#f1f4f5] transition-colors flex items-center gap-2"
                    >
                      <Save size={18} />
                      {currentMajorId ? "Update as Draft" : "Save as Draft"}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        createMutation.isPending || updateMajorMutation.isPending
                      }
                      className="px-8 py-3 bg-[#4caf50] text-white rounded-xl font-bold shadow-lg shadow-[#4caf50]/20 hover:bg-[#388e3c] transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {createMutation.isPending ||
                      updateMajorMutation.isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          Next: Outcomes <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {wizardStep === 2 && (
            <div className="grid grid-cols-12 gap-8 items-start">
              {/* Left Column: Form */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#adb3b5]/10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-[#e8f5e9] text-[#4caf50] flex items-center justify-center">
                      <Plus size={24} />
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-[#2d3335]">
                      {editingPOIndex !== null ? "Edit Outcome" : "Add Outcome"}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a6062] ml-1">
                        Outcome Title (PO Code)
                      </label>
                      <input
                        value={currentPO.poCode}
                        onChange={(e) =>
                          setCurrentPO({ ...currentPO, poCode: e.target.value })
                        }
                        className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-[#4caf50]/30 rounded-xl px-5 py-4 text-sm font-bold outline-none transition-all"
                        placeholder="e.g. PO1"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5a6062] ml-1">
                        Description
                      </label>
                      <textarea
                        rows={5}
                        value={currentPO.description}
                        onChange={(e) =>
                          setCurrentPO({
                            ...currentPO,
                            description: e.target.value,
                          })
                        }
                        className="w-full bg-[#f1f4f5] border-2 border-transparent focus:border-[#4caf50]/30 rounded-xl px-5 py-4 text-sm font-medium outline-none transition-all resize-none"
                        placeholder="Define what students will demonstrate..."
                      />
                    </div>
                    <button
                      onClick={handleAddPO}
                      className="w-full py-4 bg-[#4caf50] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#388e3c] transition-all shadow-lg shadow-[#4caf50]/10 flex items-center justify-center gap-2"
                    >
                      {editingPOIndex !== null ? (
                        <>
                          Update Outcome <Check size={16} strokeWidth={3} />
                        </>
                      ) : (
                        <>
                          Save Outcome <Check size={16} strokeWidth={3} />
                        </>
                      )}
                    </button>
                    {editingPOIndex !== null && (
                      <button
                        onClick={() => {
                          setEditingPOIndex(null);
                          setCurrentPO({ poCode: "", description: "" });
                        }}
                        className="w-full py-2 text-[10px] font-black text-[#5a6062] uppercase tracking-widest hover:text-[#2d3335]"
                      >
                        Cancel Editing
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-[#1b5e20] rounded-2xl p-8 text-white relative overflow-hidden group">
                  <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#a5d6a7]">
                      Pro Tip
                    </span>
                    <p className="mt-2 text-sm font-medium leading-relaxed">
                      Program outcomes should be measurable, achievable, and
                      aligned with institutional goals.
                    </p>
                  </div>
                  <Target
                    size={120}
                    className="absolute -bottom-4 -right-4 text-white/5 opacity-50"
                  />
                </div>
              </div>

              {/* Right Column: List */}
              <div className="col-span-12 lg:col-span-7 bg-[#f1f4f5]/50 rounded-2xl p-8 border border-[#adb3b5]/10 min-h-[600px] flex flex-col">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-[#2d3335]">
                      Staging Queue
                    </h3>
                    <p className="text-xs text-[#5a6062] font-medium">
                      Review and manage outcomes before final submission.
                    </p>
                  </div>
                  <span className="px-4 py-1.5 bg-white text-[#4caf50] text-[10px] font-black rounded-full border border-[#4caf50]/20">
                    {stagedPOs.length} TOTAL
                  </span>
                </div>

                <div className="space-y-4 grow">
                  {stagedPOs.length > 0 ? (
                    stagedPOs.map((po, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={idx}
                        className="bg-white p-5 rounded-2xl border border-transparent hover:border-[#4caf50]/20 transition-all shadow-sm group"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] font-black text-[#4caf50] px-2 py-0.5 bg-[#e8f5e9] rounded">
                                {po.poCode}
                              </span>
                            </div>
                            <p className="text-sm text-[#2d3335] font-medium leading-relaxed">
                              {po.description}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditPO(idx)}
                              className="p-2 text-[#5a6062] hover:text-[#4caf50] hover:bg-[#e8f5e9] rounded-lg transition-all"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeletePO(idx)}
                              className="p-2 text-[#5a6062] hover:text-[#a73b21] hover:bg-[#fff7f6] rounded-lg transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-40">
                      <Target size={48} className="mb-4" />
                      <p className="text-sm font-bold uppercase tracking-widest text-[#5a6062]">
                        Queue is currently empty
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-8 border-t border-[#adb3b5]/20 flex justify-between items-center">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="px-6 py-3 text-[#5a6062] font-bold text-sm flex items-center gap-2 hover:text-[#2d3335] transition-all"
                  >
                    <ArrowLeft size={18} /> Back to Identity
                  </button>
                  <button
                    onClick={handleFinalSubmit}
                    disabled={bulkPOMutation.isPending}
                    className="px-10 py-4 bg-[#2d3335] text-white rounded-xl font-bold shadow-xl shadow-[#2d3335]/10 hover:bg-[#0c0f10] transition-all flex items-center gap-3 group disabled:opacity-50"
                  >
                    {bulkPOMutation.isPending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Next: Submit
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {wizardStep === 3 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <header className="mb-10">
                <div className="flex items-center gap-2 text-[#4caf50] font-semibold mb-2">
                  <span className="material-symbols-outlined text-sm">
                    verified
                  </span>
                  <span className="text-xs uppercase tracking-widest">
                    Final Review
                  </span>
                </div>
                <h1 className="text-4xl font-extrabold text-[#2d3335] tracking-tight leading-tight font-['Plus_Jakarta_Sans']">
                  Review Major Submission
                </h1>
                <p className="text-[#5a6062] mt-2 text-lg">
                  Please verify the details below before submitting the
                  curriculum for academic board approval.
                </p>
              </header>

              <div className="grid grid-cols-12 gap-8">
                {/* Basic Information Bento Card */}
                <section className="col-span-12 bg-white rounded-xl p-8 shadow-sm border border-[#adb3b5]/10">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-[#2d3335] font-['Plus_Jakarta_Sans']">
                      Basic Information
                    </h3>
                    <button
                      onClick={() => setWizardStep(1)}
                      className="text-[#4caf50] hover:bg-[#e8f5e9] px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="text-[10px] font-black text-[#5a6062] uppercase tracking-[0.2em] mb-1 block">
                        Major Code
                      </label>
                      <div className="text-2xl font-bold text-[#1b5e20] font-['Plus_Jakarta_Sans']">
                        {newMajor.majorCode || "N/A"}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-[#5a6062] uppercase tracking-[0.2em] mb-1 block">
                        Major Name
                      </label>
                      <div className="text-2xl font-bold text-[#2d3335] font-['Plus_Jakarta_Sans']">
                        {newMajor.majorName || "N/A"}
                      </div>
                    </div>
                    <div className="md:col-span-2 pt-4 border-t border-[#f1f4f5]">
                      <label className="text-[10px] font-black text-[#5a6062] uppercase tracking-[0.2em] mb-2 block">
                        Description
                      </label>
                      <p className="text-[#5a6062] leading-relaxed text-sm font-medium">
                        {newMajor.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                </section>

                {/* Program Outcomes Bento Card */}
                <section className="col-span-12 bg-white rounded-xl p-8 shadow-sm border border-[#adb3b5]/10">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-[#2d3335] font-['Plus_Jakarta_Sans']">
                      Program Outcomes
                    </h3>
                    <button
                      onClick={() => setWizardStep(2)}
                      className="text-[#4caf50] hover:bg-[#e8f5e9] px-4 py-1.5 rounded-full text-sm font-bold transition-colors"
                    >
                      Edit Outcomes
                    </button>
                  </div>
                  <div className="space-y-4">
                    {stagedPOs.length > 0 ? (
                      stagedPOs.map((po, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-5 bg-[#f1f4f5]/50 rounded-xl group hover:bg-[#e8f5e9]/50 transition-colors border border-transparent hover:border-[#4caf50]/20"
                        >
                          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-[#adb3b5]/10">
                            <span className="font-bold text-[#4caf50] text-sm">
                              {(index + 1).toString().padStart(2, "0")}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-[#2d3335] mb-1">
                              {po.poCode}
                            </h4>
                            <p className="text-[#5a6062] text-sm leading-relaxed font-medium">
                              {po.description}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-[#f1f4f5]/30 rounded-xl border-2 border-dashed border-[#adb3b5]/20">
                        <p className="text-sm text-[#5a6062] font-bold">
                          No outcomes defined yet.
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Confirmation Footer */}
                <section className="col-span-12 mt-4">
                  <div className="flex items-center justify-between gap-6 p-8 bg-[#1b5e20] rounded-2xl shadow-xl relative overflow-hidden group">
                    <div className="relative z-10">
                      <h4 className="text-white font-bold text-xl font-['Plus_Jakarta_Sans']">
                        Ready for Approval?
                      </h4>
                      <p className="text-[#a5d6a7] text-sm font-medium">
                        Once submitted, this major will enter the review queue.
                      </p>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto relative z-10">
                      <button
                        onClick={() => setWizardStep(2)}
                        className="flex-1 sm:flex-none px-8 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/20"
                      >
                        <ArrowLeft size={18} />
                        Back to Outcomes
                      </button>
                      <button
                        onClick={() => setIsConfirmModalOpen(true)}
                        className="flex-1 sm:flex-none px-10 py-3 bg-[#4caf50] text-white font-black uppercase tracking-widest text-[13px] rounded-xl shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Send size={18} />
                        Submit for Approval
                      </button>
                    </div>
                    <ShieldCheck
                      size={140}
                      className="absolute -bottom-10 -right-10 text-white/5 group-hover:rotate-12 transition-transform duration-700"
                    />
                  </div>
                </section>
              </div>

              {/* Confirmation Modal */}
              <AnimatePresence>
                {isConfirmModalOpen && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsConfirmModalOpen(false)}
                      className="absolute inset-0 bg-[#2d3335]/60 backdrop-blur-sm"
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
                    >
                      <div className="px-8 pt-8 pb-4 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-[#e8f5e9] flex items-center justify-center mb-4 shadow-sm border border-[#4caf50]/10">
                          <Send className="text-[#4caf50] w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight text-[#2d3335] mb-2 font-['Plus_Jakarta_Sans']">
                          Confirm & Create Task
                        </h2>
                        <p className="text-[#5a6062] leading-relaxed px-4 text-xs font-medium">
                          Submit this major and assign a review task.
                        </p>
                      </div>

                      <div className="px-8 flex flex-col gap-4 mb-8">
                        <div>
                           <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6062] mb-1">
                             Task Deadline
                           </label>
                           <input
                             type="date"
                             required
                             value={taskForm.deadline}
                             onChange={(e) => setTaskForm({...taskForm, deadline: e.target.value})}
                             className="w-full bg-[#f1f4f5] border border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-2 text-[#2d3335] text-sm outline-none transition-all"
                           />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                             <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6062] mb-1">
                               Priority
                             </label>
                             <select
                               value={taskForm.priority}
                               onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                               className="w-full bg-[#f1f4f5] border border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-2 text-[#2d3335] text-sm outline-none transition-all appearance-none"
                             >
                               <option value="HIGH">High</option>
                               <option value="MEDIUM">Medium</option>
                               <option value="LOW">Low</option>
                             </select>
                           </div>
                           <div>
                             <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5a6062] mb-1">
                               Type
                             </label>
                             <select
                               value={taskForm.type}
                               onChange={(e) => setTaskForm({...taskForm, type: e.target.value})}
                               className="w-full bg-[#f1f4f5] border border-transparent focus:border-[#4caf50]/30 rounded-lg px-4 py-2 text-[#2d3335] text-sm outline-none transition-all appearance-none"
                             >
                               <option value="REVIEW">Review</option>
                               <option value="ENACTMENT">Enactment</option>
                               <option value="EXPERTISE">Expertise</option>
                             </select>
                           </div>
                        </div>
                      </div>

                      <div className="px-8 pb-10 flex flex-col sm:flex-row-reverse gap-3">
                        <button
                          onClick={() => submitAllDataMutation.mutate()}
                          disabled={submitAllDataMutation.isPending}
                          className="flex-1 bg-[#4caf50] hover:bg-[#388e3c] text-white font-black uppercase tracking-widest text-[13px] py-4 px-6 rounded-xl transition-all shadow-lg shadow-[#4caf50]/20 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
                        >
                          {submitAllDataMutation.isPending ? (
                            <Loader2 className="animate-spin" size={18} />
                          ) : (
                            <span>Yes, Submit</span>
                          )}
                        </button>
                        <button
                          onClick={() => setIsConfirmModalOpen(false)}
                          className="flex-1 bg-[#f1f4f5] hover:bg-[#e5e9eb] text-[#2d3335] font-bold py-4 px-6 rounded-xl transition-all flex items-center justify-center active:scale-95"
                        >
                          Cancel
                        </button>
                      </div>

                      <button
                        onClick={() => setIsConfirmModalOpen(false)}
                        className="absolute top-4 right-4 text-[#adb3b5] hover:text-[#5a6062] transition-colors p-2 rounded-full hover:bg-[#f1f4f5]"
                      >
                        <X size={20} />
                      </button>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {wizardStep === 4 && (
            <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in duration-700">
              <div className="w-24 h-24 bg-[#e8f5e9] text-[#4caf50] rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-[#4caf50]/10">
                <Check size={48} strokeWidth={4} />
              </div>
              <h2 className="text-4xl font-extrabold text-[#2d3335] mb-4 tracking-tight font-['Plus_Jakarta_Sans']">
                Submission Successful!
              </h2>
              <p className="text-[#5a6062] text-lg mb-12 font-medium">
                The academic major{" "}
                <span className="text-[#2d3335] font-bold">
                  {newMajor.majorName}
                </span>{" "}
                has been submitted for review. You can track its status in the
                Major Catalog.
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-10 py-5 bg-[#4caf50] text-white rounded-2xl font-black uppercase tracking-widest text-[14px] shadow-xl shadow-[#4caf50]/20 hover:bg-[#388e3c] hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-3"
                >
                  Return to Major Catalog <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 max-w-7xl mx-auto space-y-12">
          {/* Page Header */}
          <section className="flex justify-end">
            <button
              onClick={handleInitialCreateAction}
              className="px-6 py-3 bg-[#2d6a4f] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#2d6a4f]/10 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus size={18} strokeWidth={3} />
              Create New Major
            </button>
          </section>


          {/* Major Catalog Section */}
          <section className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight">
                  Academic Major Catalog
                </h2>
                <p className="text-[#5a6062] text-sm font-medium">
                  Detailed directory of all educational pathways and
                  accreditation cycles.
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                {/* Search */}
                <div className="relative w-full md:w-64">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#adb3b5]"
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="Search majors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border-none rounded-full text-sm focus:ring-2 focus:ring-[#2d6a4f]/20 transition-all shadow-sm"
                  />
                </div>

                {/* Tabs System */}
                <div className="flex p-1 bg-[#ebeef0] rounded-xl w-full md:w-auto">
                  {statusTabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() => setSelectedStatus(tab.value)}
                      className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                        selectedStatus === tab.value
                          ? "bg-white text-[#1d5c42] shadow-sm"
                          : "text-[#5a6062] hover:text-[#2d3335]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data Table Container */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-[0px_4px_20px_rgba(45,51,53,0.04)] border border-[#ebeef0]">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 text-[#adb3b5]">
                  <Loader2 className="animate-spin mb-4" size={32} />
                  <p className="font-bold text-xs uppercase tracking-widest text-[#5a6062]">
                    Accessing Institutional Repository...
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f1f4f5]/50">
                        <th className="px-8 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest">
                          Major Name
                        </th>
                        <th className="px-6 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest text-center">
                          Curriculums
                        </th>
                        <th className="px-6 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest text-center">
                          Credits
                        </th>
                        <th className="px-6 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-6 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest">
                          Last Audit
                        </th>
                        <th className="px-8 py-5 text-xs font-bold text-[#5a6062] uppercase tracking-widest text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebeef0]">
                      {filteredMajors.length > 0 ? (
                        filteredMajors.map((major) => (
                          <tr
                            key={major.majorId}
                            className="hover:bg-[#f1f4f5] transition-colors group cursor-pointer"
                            onClick={() => handleOpenDetail(major.majorCode)}
                          >
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[#dee3e6] flex items-center justify-center text-[#2d6a4f] group-hover:bg-white transition-colors">
                                  <span className="material-symbols-outlined">
                                    {major.majorCode.includes("BIT") ||
                                    major.majorCode.includes("SE")
                                      ? "terminal"
                                      : "architecture"}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-bold text-[#2d3335]">
                                    {major.majorName}
                                  </div>
                                  <div className="text-xs text-[#5a6062] font-medium">
                                    {major.majorCode}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-6 text-center text-sm font-bold">
                              {curriculumCountsMap[major.majorCode] || 0}
                            </td>
                            <td className="px-6 py-6 text-center text-sm font-medium text-[#5a6062]">
                              -
                            </td>
                            <td className="px-6 py-6">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                                  major.status === "PUBLISHED"
                                    ? "bg-[#b1f0ce] text-[#1d5c42]"
                                    : major.status === "INTERNAL_REVIEW"
                                      ? "bg-[#d5e8ce] text-[#465643]"
                                      : major.status === "DRAFT"
                                        ? "bg-[#dee3e6] text-[#5a6062]"
                                        : "bg-[#f1f4f5] text-[#adb3b5]"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    major.status === "PUBLISHED"
                                      ? "bg-[#2d6a4f]"
                                      : major.status === "INTERNAL_REVIEW"
                                        ? "bg-[#53634f]"
                                        : "bg-[#767c7e]"
                                  }`}
                                ></span>
                                {major.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="px-6 py-6 text-sm text-[#5a6062] font-medium">
                              {new Date(
                                major.createdAt || Date.now(),
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "2-digit",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {major.status === "DRAFT" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(
                                        major.majorId,
                                        major.majorName,
                                      );
                                    }}
                                    className="text-[#a73b21] hover:bg-[#fd795a]/20 p-2 rounded-lg transition-colors"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenDetail(major.majorCode);
                                  }}
                                  className="text-[#2d6a4f] hover:bg-[#b1f0ce]/30 p-2 rounded-lg transition-colors"
                                >
                                  <span className="material-symbols-outlined">
                                    more_vert
                                  </span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-8 py-12 text-center text-[#5a6062] font-medium"
                          >
                            No majors found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Footer / Pagination fallback */}
              <div className="px-8 py-4 bg-[#f1f4f5]/30 flex items-center justify-between border-t border-[#ebeef0]">
                <div className="text-xs text-[#5a6062] font-medium">
                  Showing {filteredMajors.length} of {majors.length} Majors
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled
                    className="p-1 rounded hover:bg-[#ebeef0] transition-colors disabled:opacity-30"
                  >
                    <ChevronDown className="rotate-90" size={18} />
                  </button>
                  <span className="text-xs font-bold px-2 text-[#2d3335]">
                    Page 1 of 1
                  </span>
                  <button
                    disabled
                    className="p-1 rounded hover:bg-[#ebeef0] transition-colors disabled:opacity-30"
                  >
                    <ChevronDown className="-rotate-90" size={18} />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
