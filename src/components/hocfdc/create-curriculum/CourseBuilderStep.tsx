import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SubjectService } from "@/services/subject.service";
import { GroupService } from "@/services/group.service";
import {
  Search,
  Layers,
  Plus,
  Box,
  Loader2,
  Building,
  ChevronDown,
  BookOpen,
  ChevronRight,
  Folder,
  FolderOpen,
  Save,
  CheckCircle2,
} from "lucide-react";
import { CurriculumGroupSubjectService } from "@/services/curriculum-group-subject.service";
import { useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import StepNavigation from "./StepNavigation";
import { motion, AnimatePresence } from "framer-motion";

export interface DraftSubject {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  semester: number;
  groupId?: string | null;
  description?: string;
}

export interface SoftGroup {
  groupId: string;
  code: string;
  name: string;
  type: "COMBO" | "ELECTIVE";
}

interface PrerequisiteError {
  subjectId: string;
  type: "SEMESTER" | "CYCLE" | "ELECTIVE_CREDIT" | "ELECTIVE_SEMESTER";
  message: string;
}

interface StepProps {
  onNext?: () => void;
  onBack?: () => void;
  curriculumIdProp?: string;
}

// Custom Tree Node Component (Cloned from CurriculumBuilder)
const TreeNode = ({ label, icon, childrenList, defaultOpen = false }: any) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="text-zinc-700">
      <div
        className="flex items-center gap-2 py-1.5 px-2 hover:bg-zinc-100 rounded-xl cursor-pointer transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-zinc-400">
          {childrenList &&
            (isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
        <span
          className={`${isOpen ? "text-[var(--primary)]" : "text-zinc-400"}`}
        >
          {icon || (isOpen ? <FolderOpen size={14} /> : <Folder size={14} />)}
        </span>
        <span className="text-xs font-bold select-none">{label}</span>
      </div>
      {isOpen && childrenList && (
        <div className="pl-6 border-l border-zinc-200 ml-3">{childrenList}</div>
      )}
    </div>
  );
};

export default function CourseBuilderStep({ onNext, onBack, curriculumIdProp }: StepProps) {
  const [rightTab, setRightTab] = useState<"WAREHOUSE" | "GROUPS" | "TREE">(
    "WAREHOUSE",
  );
  const [search, setSearch] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const searchParams = useSearchParams();
  const curriculumId = curriculumIdProp || searchParams.get("id");
  const queryClient = useQueryClient();

  // Curriculum State
  const [draftSubjects, setDraftSubjects] = useState<DraftSubject[]>([]);
  const [initialSubjectIds, setInitialSubjectIds] = useState<string[]>([]);
  const [semesterCount, setSemesterCount] = useState(5);
  const [hasSemesterZero, setHasSemesterZero] = useState(false);
  const [activeSemester, setActiveSemester] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [shouldProceedAfterSave, setShouldProceedAfterSave] = useState(false);
  const [isCreateGroupExpanded, setIsCreateGroupExpanded] = useState(false);

  // 1. Fetch Existing Mapped Subjects
  const { data: mappedData, isLoading: isLoadingMapped } = useQuery({
    queryKey: ["curriculum-mapped-subjects", curriculumId],
    queryFn: () =>
      CurriculumGroupSubjectService.getSubjectsByCurriculum(curriculumId!),
    enabled: !!curriculumId,
  });

  // 2. Initialize State from Server
  useEffect(() => {
    if (mappedData?.data?.semesterMappings) {
      const mappings = mappedData.data.semesterMappings;

      const allSubjects: DraftSubject[] = [];
      let maxSem = 5;
      let hasSemZero = false;

      mappings.forEach((semMapping: any) => {
        const semNo = semMapping.semesterNo;
        if (semNo === 0) hasSemZero = true;
        if (semNo > maxSem) maxSem = semNo;

        semMapping.subjects?.forEach((sub: any) => {
          allSubjects.push({
            subjectId: sub.subjectId,
            subjectCode: sub.subjectCode,
            subjectName: sub.subjectName,
            credits: sub.credit || sub.credits || 3,
            semester: semNo,
            groupId: sub.groupId || null,
            description: sub.description,
          });
        });
      });

      setDraftSubjects(allSubjects);
      setInitialSubjectIds(allSubjects.map((s) => s.subjectId));
      setSemesterCount(maxSem);
      setHasSemesterZero(hasSemZero);
    }
  }, [mappedData]);

  // Dirty Check for Unsaved Changes
  const hasUnsavedChanges = useMemo(() => {
    const mappings = mappedData?.data?.semesterMappings;

    if (!mappings) return draftSubjects.length > 0;

    // Compare current subjects with initial subjects
    const currentSubjectIds = draftSubjects.map((s) => s.subjectId);
    if (currentSubjectIds.length !== initialSubjectIds.length) return true;

    // Check if any subject moved semester or group
    const initialMappings = mappings.flatMap((m: any) =>
      (m.subjects || []).map((s: any) => ({
        id: s.subjectId,
        sem: m.semesterNo,
        grp: s.groupId || null,
      })),
    );

    return draftSubjects.some((s) => {
      const original = initialMappings.find((im: any) => im.id === s.subjectId);
      if (!original) return true;
      return original.sem !== s.semester || original.grp !== s.groupId;
    });
  }, [draftSubjects, initialSubjectIds, mappedData]);

  const { data: subjectData, isLoading: isLoadingSub } = useQuery({
    queryKey: ["warehouse-subjects", search, selectedDepartmentId],
    queryFn: () =>
      SubjectService.getSubjects({
        search,
        departmentId: selectedDepartmentId || undefined,
        size: 50,
      }),
  });

  const { data: deptData } = useQuery({
    queryKey: ["all-departments"],
    queryFn: () => SubjectService.getDepartments({ size: 100 }),
  });

  const departments =
    (deptData?.data as any)?.content ||
    (Array.isArray(deptData?.data) ? deptData?.data : []);

  const { data: groupData, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["warehouse-groups"],
    queryFn: () => GroupService.getGroups(),
  });

  const existingGroups = useMemo(() => {
    const groupContent =
      groupData?.data && "content" in groupData.data
        ? groupData.data.content
        : Array.isArray(groupData?.data)
          ? groupData.data
          : [];

    return groupContent.map((g: any) => ({
      groupId: g.groupId,
      code: g.groupCode,
      name: g.groupName,
      type: g.type,
    }));
  }, [groupData]);

  const warehouseSubjects = subjectData?.data?.content || [];

  // Actions
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupCode, setNewGroupCode] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [groupTypeFilter, setGroupTypeFilter] = useState<"COMBO" | "ELECTIVE">(
    "COMBO",
  );

  // 3. Mutation for Saving
  const syncMutation = useMutation({
    mutationFn: (data: any) =>
      CurriculumGroupSubjectService.bulkConfigure(data),
    onSuccess: () => {
      toast.success("Curriculum flow synchronized");
      queryClient.invalidateQueries({
        queryKey: ["curriculum-mapped-subjects", curriculumId],
      });
      if (shouldProceedAfterSave) {
        onNext?.();
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Sync failed");
      setShouldProceedAfterSave(false);
    },
  });

  const handleSaveDraft = (proceed: boolean = false) => {
    if (!curriculumId) return;
    setShouldProceedAfterSave(proceed);

    const currentSubjectIds = draftSubjects.map((s) => s.subjectId);
    const removedSubjectIds = initialSubjectIds.filter(
      (id) => !currentSubjectIds.includes(id),
    );

    const semestersArr = Array.from({ length: semesterCount + 1 }, (_, i) => i); // include 0
    const semesterMappings = semestersArr
      .map((semNum) => ({
        semesterNo: semNum,
        subjects: draftSubjects
          .filter((s) => s.semester === semNum)
          .map((s) => ({
            subjectId: s.subjectId,
            groupId: s.groupId || null,
          })),
      }))
      .filter((mapping) => mapping.subjects.length > 0);

    syncMutation.mutate({
      curriculumId,
      deleteSubjectsList:
        removedSubjectIds.length > 0 ? removedSubjectIds : undefined,
      semesterMappings,
    });
  };

  const handleNextClick = () => {
    if (hasUnsavedChanges) {
      setShowConfirmModal(true);
    } else {
      onNext?.();
    }
  };

  const createSoftGroup = async () => {
    if (!newGroupCode || !newGroupName) return;
    setIsCreatingGroup(true);
    try {
      await GroupService.createGroup({
        groupCode: newGroupCode.toUpperCase().replace(/\s+/g, "-"),
        groupName: newGroupName,
        description: newGroupDescription,
        type: groupTypeFilter,
      });
      // Invalidate groups query
      queryClient.invalidateQueries({ queryKey: ["warehouse-groups"] });

      toast.success(
        `Created ${groupTypeFilter === "COMBO" ? "Combo" : "Elective"} Group: ${newGroupCode.toUpperCase()}`,
      );

      // Reset fields
      setNewGroupCode("");
      setNewGroupName("");
      setNewGroupDescription("");
      setIsCreateGroupExpanded(false);
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          `Failed to create ${groupTypeFilter} group`,
      );
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const addSubjectToSemester = (subject: any, semNum: number) => {
    if (draftSubjects.some((s) => s.subjectId === subject.subjectId)) return;
    const newSubject: DraftSubject = {
      subjectId: subject.subjectId,
      subjectCode: subject.subjectCode,
      subjectName: subject.subjectName,
      credits: subject.credits || 3,
      semester: semNum,
      description: subject.description,
    };
    setDraftSubjects((prev) => [...prev, newSubject]);
  };

  const removeSubject = (subjectId: string) => {
    setDraftSubjects((prev) => prev.filter((s) => s.subjectId !== subjectId));
  };

  const setSubjectGroup = (subjectId: string, groupId: string | null) => {
    setDraftSubjects((prev) =>
      prev.map((s) => (s.subjectId === subjectId ? { ...s, groupId } : s)),
    );
  };

  const unlinkGroup = (groupId: string) => {
    setDraftSubjects((prev) =>
      prev.map((s) => (s.groupId === groupId ? { ...s, groupId: null } : s)),
    );
  };

  const semesters = useMemo(() => {
    const base = Array.from({ length: semesterCount }, (_, i) => i + 1);
    return hasSemesterZero ? [0, ...base] : base;
  }, [semesterCount, hasSemesterZero]);

  const removeSemester = (semNum: number) => {
    if (semNum === 0) {
      setHasSemesterZero(false);
      setDraftSubjects((prev) => prev.filter((s) => s.semester !== 0));
      if (activeSemester === 0) setActiveSemester(1);
      return;
    }

    // Standard semester removal logic
    setDraftSubjects((prev) =>
      prev
        .filter((s) => s.semester !== semNum)
        .map((s) =>
          s.semester > semNum ? { ...s, semester: s.semester - 1 } : s,
        ),
    );
    setSemesterCount((prev) => Math.max(1, prev - 1));

    if (activeSemester === semNum) {
      setActiveSemester(Math.max(1, semNum - 1));
    } else if (activeSemester > semNum) {
      setActiveSemester((prev) => prev - 1);
    }
  };

  // Prerequisite Cache & Validation
  const [prereqCache, setPrereqCache] = useState<Record<string, any[]>>({});
  const [validationErrors, setValidationErrors] = useState<PrerequisiteError[]>(
    [],
  );
  const [isValidating, setIsValidating] = useState(false);

  // Fetch missing prerequisites
  const fetchPrerequisites = async (subjectIds: string[]) => {
    const missing = subjectIds.filter((id) => !prereqCache[id]);
    if (missing.length === 0) return;

    setIsValidating(true);
    try {
      const newPrereqs = { ...prereqCache };
      await Promise.all(
        missing.map(async (id) => {
          try {
            const res = await SubjectService.getPrerequisites(id);
            newPrereqs[id] = res.data || [];
          } catch (e) {
            newPrereqs[id] = [];
          }
        }),
      );
      setPrereqCache(newPrereqs);
    } finally {
      setIsValidating(false);
    }
  };

  // Run validation whenever draftSubjects or prereqCache changes
  const runValidation = () => {
    const errors: PrerequisiteError[] = [];

    // 1. Semester Violation Check
    draftSubjects.forEach((subject) => {
      const prereqs = prereqCache[subject.subjectId];
      if (!prereqs) return;

      prereqs.forEach((p: any) => {
        const pInDraft = draftSubjects.find(
          (ds) => ds.subjectCode === p.prerequisiteSubjectCode,
        );
        if (!pInDraft) {
          errors.push({
            subjectId: subject.subjectId,
            type: "SEMESTER",
            message: `Prerequisite ${p.prerequisiteSubjectCode} was not found.`,
          });
        } else if (pInDraft.semester >= subject.semester) {
          errors.push({
            subjectId: subject.subjectId,
            type: "SEMESTER",
            message: `Prerequisite ${p.prerequisiteSubjectCode} must be in a previous semester.`,
          });
        }
      });
    });

    // 2. Circular Dependency Detection (DFS)
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const cyclesFound = new Set<string>();

    const hasCycle = (v: string) => {
      if (recStack.has(v)) return true;
      if (visited.has(v)) return false;

      visited.add(v);
      recStack.add(v);

      const prereqs = prereqCache[v] || [];
      for (const p of prereqs) {
        const pSub = draftSubjects.find(
          (ds) => ds.subjectCode === p.prerequisiteSubjectCode,
        );
        if (pSub && hasCycle(pSub.subjectId)) return true;
      }

      recStack.delete(v);
      return false;
    };

    draftSubjects.forEach((subject) => {
      if (!visited.has(subject.subjectId)) {
        if (hasCycle(subject.subjectId)) {
          cyclesFound.add(subject.subjectId);
        }
      }
    });

    if (cyclesFound.size > 0) {
      draftSubjects.forEach((s) => {
        if (cyclesFound.has(s.subjectId)) {
          errors.push({
            subjectId: s.subjectId,
            type: "CYCLE",
            message: "Circular prerequisite dependency detected.",
          });
        }
      });
    }

    // 3. Elective Group Consistency Check
    const subjectsWithGroups = draftSubjects.filter((s) => !!s.groupId);
    const groupsToCheck = Array.from(
      new Set(subjectsWithGroups.map((s) => s.groupId!)),
    );

    groupsToCheck.forEach((grpId) => {
      const groupDef = existingGroups.find((g) => g.groupId === grpId);
      if (groupDef?.type === "ELECTIVE") {
        const members = draftSubjects.filter((s) => s.groupId === grpId);
        if (members.length > 1) {
          const first = members[0];
          members.forEach((m) => {
            if (m.credits !== first.credits) {
              errors.push({
                subjectId: m.subjectId,
                type: "ELECTIVE_CREDIT",
                message: `Credits must be consistent in ELECTIVE groups.`,
              });
            }
            if (m.semester !== first.semester) {
              errors.push({
                subjectId: m.subjectId,
                type: "ELECTIVE_SEMESTER",
                message: `Semesters must be consistent in ELECTIVE groups.`,
              });
            }
          });
        }
      }
    });

    setValidationErrors(errors);
  };

  // Effects
  useEffect(() => {
    if (draftSubjects.length > 0) {
      const subjectIds = draftSubjects.map((s) => s.subjectId);
      fetchPrerequisites(subjectIds);
    }
  }, [draftSubjects.length]);

  useEffect(() => {
    runValidation();
  }, [draftSubjects, prereqCache]);

  const [draggedSubject, setDraggedSubject] = useState<any>(null);

  const handleDrop = (e: React.DragEvent, semNum: number) => {
    e.preventDefault();
    if (draggedSubject) {
      addSubjectToSemester(draggedSubject, semNum);
      setDraggedSubject(null);
    }
  };
  return (
    <div className="min-h-screen px-4 md:px-12 pb-12 font-['Plus_Jakarta_Sans']">
      {/* Step Indicator (Progress Stepper) */}
      <header className="mb-10 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight mb-2">
              Course Builder
            </h1>
            <p className="text-zinc-500 max-w-xl leading-relaxed font-medium">
              Orchestrate the academic journey by structuring semester blocks
              and organizing subjects.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1 mr-2">
              <span
                className={`text-[9px] font-black uppercase tracking-widest ${hasUnsavedChanges ? "text-amber-500 animate-pulse" : "text-emerald-500"}`}
              >
                {hasUnsavedChanges ? "● Pending Sync" : "● Flow Synced"}
              </span>
            </div>
            <button
              onClick={() => handleSaveDraft(false)}
              disabled={syncMutation.isPending || !hasUnsavedChanges}
              className={`btn-pdcm-ghost px-8 py-4 rounded-2xl ${syncMutation.isPending || !hasUnsavedChanges ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {syncMutation.isPending ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Save Draft
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 items-start max-w-5xl mx-auto">
        {/* Curriculum Area (The Editorial Layout) */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          {/* Prefix Semester 0 Trigger - Positioned before Semester 1 */}
          {!hasSemesterZero && (
            <div className="group/prep border-b border-dashed border-zinc-100 pb-6 mb-2 flex items-center gap-4">
              <div className="w-px h-12 bg-gradient-to-b from-transparent via-zinc-200 to-transparent" />
              <button
                onClick={() => {
                  setHasSemesterZero(true);
                  setActiveSemester(0);
                }}
                className="flex items-center gap-3 px-4 py-2 rounded-xl border border-dashed border-zinc-200 text-zinc-400 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/[0.02] transition-all"
              >
                <Plus size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Enroll Semester 0 (Preparatory)
                </span>
              </button>
            </div>
          )}

          {semesters.map((semNum) => {
            const semSubjects = draftSubjects.filter(
              (s) => s.semester === semNum,
            );
            const standalones = semSubjects.filter((s) => !s.groupId);
            const groupMap = semSubjects
              .filter((s) => !!s.groupId)
              .reduce(
                (acc, curr) => {
                  const grpId = curr.groupId!;
                  if (!acc[grpId]) acc[grpId] = [];
                  acc[grpId].push(curr);
                  return acc;
                },
                {} as Record<string, DraftSubject[]>,
              );

            return (
              <section
                key={semNum}
                onClick={() => setActiveSemester(semNum)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setActiveSemester(semNum);
                }}
                onDrop={(e) => handleDrop(e, semNum)}
                className={`transition-all rounded-2xl ${activeSemester === semNum ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-4xl font-extrabold transition-colors ${activeSemester === semNum ? "text-[var(--primary)]" : "text-zinc-200"}`}
                    >
                      {semNum < 10 ? `0${semNum}` : semNum}
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900">
                      {semNum === 0
                        ? "Preparatory Semester"
                        : `Semester ${semNum}`}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                      {semSubjects.reduce((acc, s) => acc + s.credits, 0)}{" "}
                      Credits Total
                    </span>
                    {semNum !== 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSemester(semNum);
                        }}
                        className="text-zinc-300 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">
                          delete
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Subject Blocks (Asymmetric Card Layout) */}
                <div className="grid grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {/* Groups Rendering */}
                    {Object.entries(groupMap).map(([grpId, subjects]) => {
                      const groupInfo = existingGroups.find(
                        (g: any) => g.groupId === grpId,
                      );
                      const isCombo = groupInfo?.type === "COMBO";

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          key={grpId}
                          className="col-span-2 relative group/group-block"
                        >
                          {/* Accent Bar & Header */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-1 h-4 rounded-full ${isCombo ? "bg-[#5850ec]" : "bg-[var(--primary)]"}`}
                              />
                              <h4 className="text-[10px] font-black text-zinc-900 tracking-widest uppercase flex items-center gap-2">
                                {groupInfo?.name || "Untitled Group"}
                                <span
                                  className={`px-1.5 py-0.5 rounded-[4px] text-[8px] text-white ${isCombo ? "bg-[#5850ec]" : "bg-[var(--primary)]"}`}
                                >
                                  {isCombo ? "COMBO" : "ELECTIVE"}
                                </span>
                              </h4>
                            </div>
                            <button
                              onClick={() => unlinkGroup(grpId)}
                              className="flex items-center gap-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <span className="text-[9px] font-black uppercase tracking-widest">
                                Unlink
                              </span>
                              <span className="material-symbols-outlined text-base">
                                link_off
                              </span>
                            </button>
                          </div>

                          {/* Group Content Box */}
                          <div
                            className={`p-1.5 rounded-2xl border transition-all ${
                              isCombo
                                ? "bg-[#5850ec]/[0.02] border-[#5850ec]/10"
                                : "bg-[var(--primary)]/[0.02] border-[var(--primary)]/10"
                            }`}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                              {subjects.map((subject) => {
                                const subErrors = validationErrors.filter(
                                  (e) => e.subjectId === subject.subjectId,
                                );
                                const hasError = subErrors.length > 0;

                                return (
                                  <div
                                    key={subject.subjectId}
                                    className={`bg-white p-2.5 rounded-xl border flex items-center gap-3 group/item relative hover:shadow-sm transition-all ${
                                      hasError
                                        ? "border-red-200 bg-red-50/10"
                                        : "border-zinc-100/50"
                                    }`}
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                        hasError
                                          ? "bg-red-500 animate-pulse"
                                          : isCombo
                                            ? "bg-[#5850ec]/30"
                                            : "bg-[var(--primary)]/30"
                                      }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div
                                        className={`text-[9px] font-bold tracking-tight truncate ${hasError ? "text-red-400" : "text-zinc-400"}`}
                                      >
                                        {subject.subjectCode}
                                      </div>
                                      <div
                                        className={`text-[11px] font-bold truncate ${hasError ? "text-red-700" : "text-zinc-800"}`}
                                      >
                                        {subject.subjectName}
                                      </div>
                                      {hasError && (
                                        <div className="mt-0.5 space-y-0.5">
                                          {subErrors.map((err, idx) => (
                                            <div
                                              key={idx}
                                              className="text-[8px] text-red-500 font-bold animate-in fade-in slide-in-from-top-1 duration-300 flex items-center gap-1"
                                            >
                                              <div className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                                              {err.message}
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() =>
                                        removeSubject(subject.subjectId)
                                      }
                                      className="text-zinc-300 hover:text-red-500 transition-colors opacity-0 group-hover/item:opacity-100"
                                    >
                                      <span className="material-symbols-outlined text-sm">
                                        close
                                      </span>
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Standalone Subjects */}
                    {standalones.map((subject) => {
                      const subErrors = validationErrors.filter(
                        (e) => e.subjectId === subject.subjectId,
                      );
                      const hasError = subErrors.length > 0;

                      return (
                        <motion.div
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          key={subject.subjectId}
                          className={`col-span-2 md:col-span-1 p-5 rounded-2xl shadow-sm border group hover:shadow-md transition-all ${
                            hasError
                              ? "bg-red-50/10 border-red-200 ring-1 ring-red-100/50"
                              : "bg-white border-zinc-200"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                hasError
                                  ? "bg-red-100 text-red-600 animate-pulse"
                                  : "bg-[#b1f0ce]/30 text-[#1f5e44]"
                              }`}
                            >
                              {hasError ? "Validation Error" : "Core"}
                            </span>
                            <button
                              onClick={() => removeSubject(subject.subjectId)}
                              className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">
                                close
                              </span>
                            </button>
                          </div>
                          <h4
                            className={`font-bold mb-1 truncate ${hasError ? "text-red-900" : "text-zinc-900"}`}
                          >
                            {subject.subjectName}
                          </h4>
                          {hasError ? (
                            <div className="mt-1 space-y-1 animate-in fade-in slide-in-from-top-1 duration-300">
                              {subErrors.map((err, idx) => (
                                <p
                                  key={idx}
                                  className="text-[10px] text-red-500 font-bold flex items-start gap-1.5"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1" />
                                  {err.message}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-zinc-500 line-clamp-2">
                              {subject.description ||
                                "No description provided."}
                            </p>
                          )}
                          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">
                                schedule
                              </span>{" "}
                              {subject.credits} Credits
                            </span>
                            <div className="flex items-center gap-2">
                              <select
                                onChange={(e) =>
                                  setSubjectGroup(
                                    subject.subjectId,
                                    e.target.value || null,
                                  )
                                }
                                value={subject.groupId || ""}
                                className="text-[9px] font-bold bg-zinc-50 border-none rounded-lg px-2 py-1 focus:ring-1 focus:ring-[var(--primary)] outline-none"
                              >
                                <option value="">Move to Group</option>
                                {existingGroups.map((g: any) => (
                                  <option key={g.groupId} value={g.groupId}>
                                    {g.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Drop Zone / Empty State */}
                  <div
                    onClick={() => setActiveSemester(semNum)}
                    className={`col-span-2 border-2 border-dashed rounded-2xl py-10 flex flex-col items-center justify-center transition-all cursor-pointer group ${
                      activeSemester === semNum
                        ? "border-zinc-300 bg-[var(--primary)]/[0.02] text-[var(--primary)]"
                        : "border-zinc-200 text-zinc-400 hover:border-zinc-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl mb-1 group-hover:scale-110 transition-transform">
                      add_circle
                    </span>
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {activeSemester === semNum
                        ? "Drop subjects from library"
                        : "Click to focus this semester"}
                    </span>
                  </div>
                </div>
              </section>
            );
          })}

          {/* Add Semester Trigger */}
          <button
            onClick={() => setSemesterCount((v) => v + 1)}
            className="w-full py-8 border-2 border-dashed border-zinc-200 rounded-2xl text-zinc-400 font-bold hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/[0.02] transition-all flex flex-col items-center gap-2"
          >
            <Plus size={32} />
            <span className="text-sm">Append Next Semester Block</span>
          </button>
        </div>

        <div className="col-span-12 lg:col-span-4 sticky top-24">
          <div className="bg-zinc-100 rounded-2xl p-6 h-[calc(100vh-160px)] flex flex-col shadow-sm overflow-hidden">
            {/* Tabs Area */}
            <div className="flex items-center border-b border-zinc-200/50 bg-white/50 p-1.5 gap-1 rounded-2xl mb-6">
              <button
                onClick={() => setRightTab("WAREHOUSE")}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${rightTab === "WAREHOUSE" ? "bg-white text-[var(--primary)] shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
              >
                Subjects
              </button>
              <button
                onClick={() => setRightTab("GROUPS")}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${rightTab === "GROUPS" ? "bg-white text-[var(--primary)] shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
              >
                Groups
                {existingGroups.length > 0 && (
                  <span className="text-[9px] bg-[var(--primary)] text-white px-1.5 py-0.5 rounded-sm font-bold">
                    {existingGroups.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setRightTab("TREE")}
                className={`px-4 py-2.5 text-[10px] font-black rounded-xl transition-all ${rightTab === "TREE" ? "bg-white text-[var(--primary)] shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
              >
                <Layers size={14} />
              </button>
            </div>
            {rightTab === "WAREHOUSE" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                      size={14}
                    />
                    <input
                      type="text"
                      placeholder="Filter by code or name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all"
                    />
                  </div>
                  <div className="relative group/dept">
                    <Building
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within/dept:text-[var(--primary)] transition-colors"
                      size={14}
                    />
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      className="w-full bg-white border-none rounded-xl py-2.5 pl-10 pr-10 text-xs font-bold outline-none focus:ring-1 focus:ring-[var(--primary)] transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Departments</option>
                      {departments.map((dept: any) => (
                        <option
                          key={dept.departmentId}
                          value={dept.departmentId}
                        >
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-300 pointer-events-none"
                      size={14}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar">
                  {isLoadingSub ? (
                    <div className="flex justify-center py-20 text-zinc-300">
                      <Loader2 className="animate-spin" size={24} />
                    </div>
                  ) : warehouseSubjects.length === 0 ? (
                    <div className="text-center py-10 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                      No subjects found
                    </div>
                  ) : (
                    warehouseSubjects.map((s: any) => {
                      const isAdded = draftSubjects.some(
                        (ds) => ds.subjectId === s.subjectId,
                      );
                      return (
                        <div
                          key={s.subjectId}
                          draggable={!isAdded}
                          onDragStart={() => setDraggedSubject(s)}
                          onDragEnd={() => setDraggedSubject(null)}
                          onClick={() =>
                            !isAdded && addSubjectToSemester(s, activeSemester)
                          }
                          className={`p-3.5 bg-white rounded-xl border transition-all group relative overflow-hidden ${
                            isAdded
                              ? "opacity-60 border-zinc-100 grayscale-[0.5] cursor-default"
                              : "border-zinc-200 cursor-pointer hover:border-[var(--primary)]/40 hover:shadow-sm active:scale-95"
                          } ${draggedSubject?.subjectId === s.subjectId ? "ring-2 ring-[var(--primary)] shadow-lg scale-105" : ""}`}
                        >
                          {isAdded && (
                            <div className="absolute top-0 right-0 px-2 py-0.5 bg-[var(--primary)] text-white text-[8px] font-black uppercase tracking-tighter">
                              Added
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${isAdded ? "bg-zinc-100 text-zinc-400" : "bg-[var(--primary)]/10 text-[var(--primary)]"}`}
                              >
                                {s.subjectCode}
                              </span>
                              {s.status && (
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded shrink-0 ${
                                    s.status === "PUBLISHED"
                                      ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                                      : s.status === "DRAFT"
                                        ? "bg-zinc-400 text-white shadow-sm shadow-zinc-200"
                                        : s.status === "INTERNAL_REVIEW" ||
                                            s.status === "STRUCTURE_REVIEW"
                                          ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                                          : "bg-indigo-500 text-white shadow-sm shadow-indigo-200"
                                  }`}
                                >
                                  {s.status.replace("_", " ")}
                                </span>
                              )}
                            </div>
                            <span
                              className={`material-symbols-outlined text-sm ${isAdded ? "text-[var(--primary)]" : "text-zinc-400 group-hover:text-[var(--primary)]"}`}
                            >
                              {isAdded ? "check_circle" : "drag_indicator"}
                            </span>
                          </div>
                          <h5
                            className={`text-xs font-extrabold line-clamp-1 ${isAdded ? "text-zinc-500" : "text-zinc-900"}`}
                          >
                            {s.subjectName}
                          </h5>
                          <div className="flex items-center gap-3 mt-2 text-[9px] text-zinc-500 font-medium">
                            <span className="flex items-center gap-1">
                              <span
                                className="material-symbols-outlined text-[10px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                schedule
                              </span>
                              {s.credits} CR
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[10px]">
                                school
                              </span>
                              {s.departmentName || "General"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}{" "}
            {rightTab === "GROUPS" && (
              <div className="flex-1 flex-col overflow-hidden flex">
                <div className="flex bg-zinc-100 p-1.5 rounded-2xl mb-4 gap-1">
                  <button
                    onClick={() => setGroupTypeFilter("COMBO")}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${groupTypeFilter === "COMBO" ? "bg-white text-[#5850ec] shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
                  >
                    COMBO
                  </button>
                  <button
                    onClick={() => setGroupTypeFilter("ELECTIVE")}
                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${groupTypeFilter === "ELECTIVE" ? "bg-white text-[var(--primary)] shadow-sm border border-zinc-100" : "text-zinc-400 hover:text-zinc-600"}`}
                  >
                    ELECTIVE
                  </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 mb-4 overflow-hidden transition-all">
                  <button
                    onClick={() =>
                      setIsCreateGroupExpanded(!isCreateGroupExpanded)
                    }
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1 rounded-lg ${groupTypeFilter === "COMBO" ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        <Plus size={12} />
                      </div>
                      <h4 className="text-[10px] font-black uppercase text-zinc-900 tracking-widest">
                        New {groupTypeFilter}
                      </h4>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-zinc-400 transition-transform duration-300 ${isCreateGroupExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isCreateGroupExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3 pt-1 border-t border-zinc-50">
                          <div className="space-y-1">
                            <input
                              value={newGroupCode}
                              onChange={(e) => setNewGroupCode(e.target.value)}
                              placeholder="Group Code (e.g. AI-K18)"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                          </div>
                          <div className="space-y-1">
                            <input
                              value={newGroupName}
                              onChange={(e) => setNewGroupName(e.target.value)}
                              placeholder="Group Name (e.g. AI Fundamentals)"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                          </div>
                          <div className="space-y-1">
                            <textarea
                              value={newGroupDescription}
                              onChange={(e) =>
                                setNewGroupDescription(e.target.value)
                              }
                              placeholder="Description (Optional)"
                              rows={2}
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 text-[10px] font-bold outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                            />
                          </div>
                          <button
                            onClick={createSoftGroup}
                            disabled={
                              isCreatingGroup || !newGroupCode || !newGroupName
                            }
                            className={`w-full text-white p-2.5 flex items-center justify-center gap-2 rounded-xl text-[10px] font-bold transition-all disabled:opacity-50 ${groupTypeFilter === "COMBO" ? "bg-[#5850ec] hover:bg-indigo-700" : "bg-[var(--primary)] hover:bg-zinc-900"}`}
                          >
                            {isCreatingGroup ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Plus size={14} />
                            )}
                            Create {groupTypeFilter}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 no-scrollbar">
                  {isLoadingGroups ? (
                    <div className="flex justify-center py-10 text-zinc-300">
                      <Loader2 className="animate-spin" size={24} />
                    </div>
                  ) : existingGroups.filter((g) => g.type === groupTypeFilter)
                      .length === 0 ? (
                    <div className="text-center py-10 text-[10px] text-zinc-400 font-bold uppercase tracking-widest border border-dashed rounded-2xl border-zinc-200">
                      No {groupTypeFilter} Found
                    </div>
                  ) : (
                    existingGroups
                      .filter((g) => g.type === groupTypeFilter)
                      .map((grp: any) => (
                        <div
                          key={grp.groupId}
                          className={`p-3.5 rounded-xl border relative shadow-sm transition-all hover:shadow-md ${grp.type === "COMBO" ? "bg-[#5850ec]/5 border-[#5850ec]/10" : "bg-[var(--primary)]/5 border-[var(--primary)]/10"}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex gap-2 items-center">
                              <span
                                className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-white ${grp.type === "COMBO" ? "bg-[#5850ec]" : "bg-[var(--primary)]"}`}
                              >
                                {grp.type}
                              </span>
                              <h4 className="text-xs font-black text-zinc-900 tracking-tight">
                                {grp.code}
                              </h4>
                            </div>
                            <button className="text-zinc-300 hover:text-zinc-500">
                              <span className="material-symbols-outlined text-sm">
                                sync
                              </span>
                            </button>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-medium line-clamp-1 mb-2">
                            {grp.name}
                          </p>
                          <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">
                            Mapped Subjects: 0
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
            {rightTab === "TREE" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
                  <TreeNode
                    label="Curriculum Draft"
                    icon={
                      <BookOpen size={14} className="text-[var(--primary)]" />
                    }
                    defaultOpen={true}
                    childrenList={semesters.map((semNum) => (
                      <TreeNode
                        key={`tree-sem-${semNum}`}
                        label={`Semester ${semNum}`}
                        defaultOpen={true}
                        childrenList={
                          <div className="py-1 px-2 text-[10px] font-medium text-zinc-400 italic">
                            Drop subjects to view hierarchy
                          </div>
                        }
                      />
                    ))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <StepNavigation
        onNext={handleNextClick}
        onBack={onBack}
        nextLabel="Review & Publish"
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
              Save Course Flow?
            </h3>
            <p className="text-zinc-500 leading-relaxed mb-10 font-medium">
              You have modified the semester distribution or subject mappings.
              Would you like to save these changes before moving to the next
              step?
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
                disabled={syncMutation.isPending}
                className="flex-1 py-4 px-6 bg-primary text-white font-bold rounded-2xl shadow-xl shadow-primary/20 hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2"
              >
                {syncMutation.isPending ? (
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
    </div>
  );
}
